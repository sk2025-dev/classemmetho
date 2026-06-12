<?php

namespace App\Http\Controllers\PresidentConducteurs;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    /**
     * Suivi des actes (naissance, décès, prière d'intercession, action de
     * grâce) : chronologie des validations (conducteur, président des
     * conducteurs, pasteur) et accès aux fiches PDF.
     */
    public function historique(Request $request)
    {
        $types = [
            ActeLiturgique::TYPE_NAISSANCE,
            ActeLiturgique::TYPE_DECES,
            ActeLiturgique::TYPE_PRIERE,
            ActeLiturgique::TYPE_GRACE,
        ];

        $query = ActeLiturgique::with([
            'membre.family', 'classe', 'conducteur', 'bureauConducteur', 'pasteur', 'historiques.acteur',
        ])
            ->whereIn('type_acte', $types)
            ->whereNot('statut', ActeLiturgique::STATUT_Soumise);

        if ($request->filled('type')) {
            $query->where('type_acte', $request->string('type')->toString());
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut')->toString());
        }

        if ($request->filled('classe_id')) {
            $query->where('classe_id', (int) $request->integer('classe_id'));
        }

        $actes = $query->latest()->paginate(10, ['*'], 'historique_page');

        $stepRoles = [
            ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR => 'Conducteur de classe',
            ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR => 'Conducteur de classe',
            ActeLiturgique::STATUT_REFUSEE_PAR_CONDUCTEUR => 'Conducteur de classe',
            ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR => 'Président des conducteurs',
            ActeLiturgique::STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR => 'Président des conducteurs',
            ActeLiturgique::STATUT_VALIDEE => 'Pasteur',
            ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR => 'Pasteur',
            ActeLiturgique::STATUT_PUBLIEE => 'Pasteur',
            ActeLiturgique::STATUT_CELEBRE => 'Pasteur',
            ActeLiturgique::STATUT_TERMINE => 'Pasteur',
            ActeLiturgique::STATUT_ARCHIVEE => 'Pasteur',
        ];

        $ficheAccessibleStatuts = [
            ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR,
            ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            ActeLiturgique::STATUT_VALIDEE,
            ActeLiturgique::STATUT_PUBLIEE,
            ActeLiturgique::STATUT_ARCHIVEE,
            ActeLiturgique::STATUT_CELEBRE,
            ActeLiturgique::STATUT_TERMINE,
        ];

        $actes->getCollection()->transform(function (ActeLiturgique $acte) use ($stepRoles, $ficheAccessibleStatuts) {
            $chronologie = $acte->historiques
                ->sortBy('created_at')
                ->map(fn ($h) => [
                    'role'        => $stepRoles[$h->statut_nouveau] ?? 'Acte',
                    'statut'      => $h->statut_nouveau,
                    'statut_label' => ActeLiturgique::getStatutOptions()[$h->statut_nouveau] ?? $h->statut_nouveau,
                    'acteur'      => $h->acteur?->name,
                    'commentaire' => $h->commentaire,
                    'date'        => optional($h->created_at)->toISOString(),
                ])
                ->values();

            $ficheUrl = null;
            if (in_array($acte->type_acte, [ActeLiturgique::TYPE_NAISSANCE, ActeLiturgique::TYPE_DECES], true)
                && in_array($acte->statut, $ficheAccessibleStatuts, true)
            ) {
                $ficheUrl = route('president_conducteurs.liturgie.fiche_conducteur', $acte->id) . '?preview=1';
            } elseif (in_array($acte->type_acte, [ActeLiturgique::TYPE_PRIERE, ActeLiturgique::TYPE_GRACE], true)) {
                $ficheUrl = route('president_conducteurs.liturgie.fiche_priere', $acte->id) . '?preview=1';
            }

            return [
                'id'             => $acte->id,
                'reference'      => $acte->reference,
                'type_acte'      => $acte->type_acte,
                'type_label'     => ActeLiturgique::getTypeOptions()[$acte->type_acte] ?? $acte->type_acte,
                'statut'         => $acte->statut,
                'statut_label'   => ActeLiturgique::getStatutOptions()[$acte->statut] ?? $acte->statut,
                'membre'         => $acte->membre?->name,
                'classe'         => $acte->classe?->nom,
                'classe_id'      => $acte->classe_id,
                'date_souhaitee' => $acte->date_souhaitee,
                'created_at'     => optional($acte->created_at)->toISOString(),
                'chronologie'    => $chronologie,
                'fiche_url'      => $ficheUrl,
            ];
        });

        return response()->json($actes);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::findOrFail($id);
        $statut = $request->string('statut')->toString();

        // Le Bureau peut uniquement valider (→ pasteur) ou refuser
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

        $logoDataUri  = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));

        $view = match ($acte->type_acte) {
            ActeLiturgique::TYPE_NAISSANCE => 'pdf.fiche-naissance',
            ActeLiturgique::TYPE_DECES     => 'pdf.fiche-deces',
            ActeLiturgique::TYPE_MARIAGE   => 'pdf.fiche-pasteur_mariage',
            ActeLiturgique::TYPE_BAPTEME   => 'pdf.fiche-pasteur-bapteme',
            default                        => 'pdf.fiche-acte-conducteur',
        };

        $pdfData = match ($view) {
            'pdf.fiche-naissance', 'pdf.fiche-deces' => [
                'acte'        => $acte,
                'logoDataUri' => $logoDataUri,
                'methoDataUri' => $methoDataUri,
            ],
            'pdf.fiche-pasteur_mariage', 'pdf.fiche-pasteur-bapteme' => [
                'actes'         => collect([$acte]),
                'logoDataUri'   => $logoDataUri,
                'documentLabel' => $view === 'pdf.fiche-pasteur_mariage' ? 'Fiche finale du mariage' : 'Fiche finale du baptême',
                'generatedAt'   => $acte->updated_at ?? now(),
            ],
            default => [
                'acte'          => $acte,
                'actes'         => [$acte],
                'logoDataUri'   => $logoDataUri,
                'generatedBy'   => $acte->conducteur ?? $acte->classe?->conducteur,
                'generatedAt'   => $acte->updated_at ?? now(),
                'documentLabel' => 'Fiche reçue du conducteur',
            ],
        };

        try {
            $pdf = Pdf::loadView($view, $pdfData)->setPaper('a4', 'portrait');
        } catch (\Throwable $e) {
            Log::error('PDF fiche-conducteur (president_conducteurs)', [
                'acte_id'   => $acte->id,
                'type_acte' => $acte->type_acte,
                'view'      => $view,
                'error'     => $e->getMessage(),
            ]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }

        $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';
        return $request->query('preview') ? $pdf->stream($filename) : $pdf->download($filename);
    }

    public function fichePriere(Request $request, int $id)
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
            'acte'                              => $acte,
            'logoDataUri'                       => $logoDataUri,
            'methoDataUri'                      => $methoDataUri,
            'signatureConducteurDataUri'        => $conducteurSig,
            'signatureBureauConducteurDataUri'  => $bureauSig,
            'signaturePasteurDataUri'           => $pasteurSig,
        ])->setPaper('a4', 'portrait');

        $ref = $acte->reference ?? $acte->id;
        $filename = "Fiche-Priere_{$ref}.pdf";
        return $request->query('preview') ? $pdf->stream($filename) : $pdf->download($filename);
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
