<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index()
    {
        $user = Auth::user();

        // Types à exclure complètement (annonces générales non liturgiques)
        $excludedTypes = [
            ActeLiturgique::TYPE_ANNOUNCE,
            ActeLiturgique::TYPE_GENERALE,
        ];

        // Tous les actes en attente du Bureau (liturgiques + demandes de prières)
        $actes = ActeLiturgique::with([
            'membre.family',
            'classe',
            'family',
            'conducteur',
            'historiques.acteur',
        ])
            ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR)
            ->whereNotIn('type_acte', $excludedTypes)
            ->latest()
            ->paginate(10, ['*'], 'actes_page');

        // Historique des actes traités par le bureau (paginé)
        $historique = ActeLiturgiqueHistorique::with([
            'acte.membre.family',
            'acte.classe',
            'acte.family',
            'acte.conducteur',
        ])
            ->whereHas('acte', function ($q) use ($excludedTypes) {
                $q->whereNotIn('type_acte', $excludedTypes);
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', [
                ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
                ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR,
            ])
            ->latest()
            ->paginate(15, ['*'], 'historique_page');

        $historique->getCollection()->transform(function ($item) {
            $acte = $item->acte;
            return [
                'id'             => $acte?->id,
                'type_acte'      => $acte?->type_acte,
                'membre'         => $acte?->membre,
                'classe'         => $acte?->classe,
                'classe_id'      => $acte?->classe_id,
                'family'         => $acte?->family ?? $acte?->membre?->family,
                'family_id'      => $acte?->family_id ?? $acte?->membre?->family_id,
                'conducteur'     => $acte?->conducteur,
                'reference'      => $acte?->reference,
                'date_souhaitee' => $acte?->date_souhaitee,
                'details'        => $acte?->details,
                'statut'         => $item->statut_nouveau,
                'commentaire'    => $item->commentaire,
                'validated_at'   => optional($item->created_at)->toISOString(),
            ];
        });

        // Stats globales (incluant les demandes de prières)
        $pendingCount = ActeLiturgique::where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR)
            ->whereNotIn('type_acte', $excludedTypes)
            ->count();

        $validatedCount = ActeLiturgiqueHistorique::where('acteur_id', $user->id)
            ->where('statut_nouveau', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
            ->count();

        $refusedCount = ActeLiturgiqueHistorique::where('acteur_id', $user->id)
            ->where('statut_nouveau', ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR)
            ->count();

        return Inertia::render('BureauConducteur/Liturgie/Index', [
            'actes'          => $actes,
            'historique'     => $historique,
            'pendingCount'   => $pendingCount,
            'validatedCount' => $validatedCount,
            'refusedCount'   => $refusedCount,
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::findOrFail($id);
        $statut = $request->string('statut')->toString();

        // Bureau peut uniquement valider (→ pasteur) ou refuser
        $allowed = [
            ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR,
        ];

        if (!in_array($statut, $allowed, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Transition non autorisée pour le Bureau des Conducteurs.',
            ], 422);
        }

        if ($acte->statut !== ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR) {
            return response()->json([
                'success' => false,
                'message' => 'Cet acte n\'est pas en attente de validation du Bureau.',
            ], 422);
        }

        if ($statut === ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR
            && empty(trim((string) $request->input('commentaire', '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        try {
            $updated = $this->service->transitionStatut(
                $acte,
                $statut,
                $user,
                $request->input('commentaire'),
                null
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $message = $statut === ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR
            ? 'Acte validé et transmis au Pasteur.'
            : 'Acte refusé par le Bureau des Conducteurs.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'acte'    => $updated,
        ]);
    }

    public function ficheConducteur(Request $request, int $id)
    {
        $acte = ActeLiturgique::with([
            'createur.classe', 'createur.family', 'family.ville',
            'classe.conducteur', 'conducteur', 'bureauConducteur', 'pasteur',
            'membre.family', 'membre.classe',
        ])
            ->where(fn ($q) => $q->where('est_annonce', false)->orWhereNull('est_annonce'))
            ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
            ->findOrFail($id);

        if (!in_array($acte->statut, [
            'TRANSMISE_AU_BUREAU_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR',
            'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE',
        ], true)) {
            abort(403, 'La fiche est disponible après transmission au Bureau des Conducteurs.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        try {
            $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
                'acte'          => $acte,
                'actes'         => [$acte],
                'logoDataUri'   => $logoDataUri,
                'generatedBy'   => $acte->conducteur ?? $acte->classe?->conducteur,
                'generatedAt'   => $acte->updated_at ?? now(),
                'documentLabel' => 'Fiche reçue du conducteur',
            ])->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('PDF fiche-conducteur (bureau_conducteur)', ['acte_id' => $acte->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }

        $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';
        return $request->query('preview') ? $pdf->stream($filename) : $pdf->download($filename);
    }

    public function fichePriere(int $id)
    {
        $acte = ActeLiturgique::with([
            'createur', 'family', 'conducteur', 'bureauConducteur', 'pasteur', 'membre.classe', 'classe', 'historiques.acteur',
        ])
            ->where('est_annonce', true)
            ->findOrFail($id);

        $logoDataUri  = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
        $conducteurSig = $this->resolveSignatureDataUri($acte->conducteur);
        $bureauSig     = $this->resolveSignatureDataUri($acte->bureauConducteur);
        $pasteurSig    = $this->resolveSignatureDataUri($acte->pasteur);

        $pdf = Pdf::loadView('pdf.fiche-demande', [
            'acte'                           => $acte,
            'logoDataUri'                    => $logoDataUri,
            'methoDataUri'                   => $methoDataUri,
            'signatureConducteurDataUri'     => $conducteurSig,
            'signatureBureauConducteurDataUri' => $bureauSig,
            'signaturePasteurDataUri'        => $pasteurSig,
        ])->setPaper('a4', 'portrait');

        $ref = $acte->reference ?? $acte->id;
        return $pdf->download("Fiche-Priere_{$ref}.pdf");
    }

    private function resolveSignatureDataUri(?User $user): ?string
    {
        if (!$user || !$user->signature_path) return null;
        if (!Storage::disk('public')->exists($user->signature_path)) return null;
        return $this->buildImageDataUri(Storage::disk('public')->path($user->signature_path));
    }

    private function buildImageDataUri(string $path): ?string
    {
        if (!file_exists($path)) return null;
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        if ($data === false) return null;
        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }
}
