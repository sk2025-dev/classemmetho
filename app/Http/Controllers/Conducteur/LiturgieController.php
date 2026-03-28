<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\FormationRequest;
use App\Models\FormationRequestHistorique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $query = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->whereIn('classe_id', $classIds)
            // ne pas mélanger les annonces dans les actes liturgiques
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->latest();

        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut')->toString());
        }

        $actes = $query->get();

        // récupérer également les annonces liées aux mêmes classes
        $annonces = ActeLiturgique::with(['createur', 'family', 'membre'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $formations = FormationRequest::with(['membre', 'classe', 'family', 'createur'])
            ->whereIn('classe_id', $classIds)
            ->whereIn('statut', ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR'])
            ->orderBy('created_at', 'desc')
            ->get();

        $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        $familyMembers = User::query()
            ->whereIn('classe_id', $classIds)
            ->with('classe', 'sacrements')
            ->select($columns)
            ->orderBy('prenom')
            ->orderBy('nom')
            ->get()
            ->map(function ($member) {
                if (!empty($member->date_naissance)) {
                    $member->date_naissance = $member->date_naissance->format('Y-m-d');
                }
                return $member;
            });

        return Inertia::render('Conducteur/Liturgie/Index', [
            'actes' => $actes,
            'annonces' => $annonces,
            'formations' => $formations,
            'familyMembers' => $familyMembers,
            'classes' => $user->getManagedClasses()->values(),
        ]);
    }

    public function transitionFormation(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:TRANSMISE_AU_PASTEUR,REFUSEE_PAR_CONDUCTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'REFUSEE_PAR_CONDUCTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $formation = FormationRequest::with('membre')
            ->where(function ($q) use ($classIds, $user) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhere('conducteur_id', $user->id);
            })
            ->findOrFail($id);

        if (!in_array($formation->statut, ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande de formation n\'est plus en attente du conducteur.',
            ], 422);
        }

        $oldStatus = $formation->statut;
        $formation->statut = $payload['statut'];
        $formation->conducteur_id = $user->id;
        $formation->save();

        FormationRequestHistorique::create([
            'formation_request_id' => $formation->id,
            'statut_precedent' => $oldStatus,
            'statut_nouveau' => $payload['statut'],
            'acteur_id' => $user->id,
            'commentaire' => $payload['commentaire'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $payload['statut'] === 'TRANSMISE_AU_PASTEUR'
                ? 'Demande de formation transmise au pasteur.'
                : 'Demande de formation refusée.',
            'formation' => $formation->fresh(['membre', 'classe', 'family', 'createur']),
        ]);
    }

    public function store(StoreActeLiturgiqueRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();
        $payload['created_by'] = $user->id;
        $payload['conducteur_id'] = $user->id;
        $payload['statut'] = 'TRANSMISE_AU_PASTEUR';

        if (empty($payload['classe_id']) && $user->classe_id) {
            $payload['classe_id'] = $user->classe_id;
        }

        $acte = $this->service->create($payload, $user)->load(['membre', 'classe', 'historiques.acteur']);

        return response()->json([
            'success' => true,
            'message' => 'Acte créé et transmis au pasteur.',
            'acte' => $acte,
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::whereIn('classe_id', $classIds)->findOrFail($id);

        $updated = $this->service->transitionStatut(
            $acte,
            $request->string('statut')->toString(),
            $user,
            $request->input('commentaire')
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'acte' => $updated,
        ]);
    }

    public function decisionCeremonie(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:CEREMONIE_TRANSMISE_AU_PASTEUR,CEREMONIE_REFUSEE_PAR_CONDUCTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'CEREMONIE_REFUSEE_PAR_CONDUCTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $acte = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);

        if (strtolower((string) $acte->type_acte) !== 'mariage') {
            return response()->json([
                'success' => false,
                'message' => 'Cette validation de cérémonie concerne uniquement les mariages.',
            ], 422);
        }

        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'La date de cérémonie ne peut être traitée qu\'après validation pastorale du dossier.',
            ], 422);
        }

        $details = (array) ($acte->details ?? []);
        if (($details['ceremonie_statut'] ?? null) !== 'CEREMONIE_SOUMISE_AU_CONDUCTEUR') {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande de date en attente du conducteur pour ce dossier.',
            ], 422);
        }

        $details['ceremonie_statut'] = $payload['statut'];
        $details['ceremonie_commentaire_conducteur'] = $payload['commentaire'] ?? null;
        $details['ceremonie_decision_conducteur_at'] = now()->toISOString();

        if ($payload['statut'] === 'CEREMONIE_TRANSMISE_AU_PASTEUR') {
            $details['ceremonie_transmise_pasteur_at'] = now()->toISOString();
        }

        $acte->update([
            'details' => $details,
            'conducteur_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $payload['statut'] === 'CEREMONIE_TRANSMISE_AU_PASTEUR'
                ? 'La date choisie a ete transmise au pasteur.'
                : 'La demande de date a ete refusee.',
            'acte' => $acte->fresh(['membre', 'classe', 'historiques.acteur']),
        ]);
    }

    public function certificat(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);
        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];

        if (!in_array($acte->statut, ['CELEBRE', 'TERMINE'], true)) {
            abort(422, "Le certificat est disponible uniquement apres l'acte effectue.");
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
            $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
            $view = $typeActe === 'naissance' ? 'pdf.fiche-naissance' : 'pdf.fiche-demande';

            $pdf = Pdf::loadView($view, [
                'acte' => $acte,
                'logoDataUri' => $logoDataUri,
                'methoDataUri' => $methoDataUri,
            ])->setPaper('a4', 'portrait');

            $filename = 'fiche-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

            return $pdf->download($filename);
        }

        if (!in_array($typeActe, $typesCertificat, true)) {
            abort(422, 'Un certificat PDF est disponible uniquement pour les actes de baptême et mariage.');
        }

        $pasteurSignature = $acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)
            ? Storage::disk('public')->path($acte->pasteur->signature_path)
            : null;
        $conducteurSignature = $acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)
            ? Storage::disk('public')->path($acte->conducteur->signature_path)
            : null;

        $signaturePath = $pasteurSignature ?: $conducteurSignature;
        $signatureName = $pasteurSignature
            ? (trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? '')) ?: null)
            : (trim(($acte->conducteur->prenom ?? '') . ' ' . ($acte->conducteur->nom ?? '')) ?: null);
        $signatureRole = $pasteurSignature ? 'Pasteur Principal' : 'Conducteur';

        $qrUrl = $acte->reference
            ? url('/certificat/verification/' . $acte->reference)
            : url('/certificat/verification/' . $acte->id);
        $qrDataUri = $this->buildQrDataUri($qrUrl);
        if (empty($qrDataUri)) {
            $remote = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($qrUrl);
            $img = @file_get_contents($remote);
            if ($img !== false) {
                $qrDataUri = 'data:image/png;base64,' . base64_encode($img);
            } else {
                $qrDataUri = null;
            }
        }
        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $scanDataUri = $this->buildImageDataUri(public_path('images/scan.png'))
            ?? $this->buildImageDataUri(public_path('images/image.png'));

        $pdf = Pdf::loadView('pdf.acte-liturgique-certificat', [
            'acte' => $acte,
            'signaturePath' => $signaturePath,
            'signatureName' => $signatureName,
            'signatureRole' => $signatureRole,
            'qrDataUri' => $qrDataUri,
            'logoDataUri' => $logoDataUri,
            'scanDataUri' => $scanDataUri,
        ])->setPaper('a4', 'landscape');

        $filename = 'certificat-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        return $pdf->download($filename);
    }

    public function ficheConducteur(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with([
            'createur.classe',
            'createur.family',
            'family.ville',
            'classe.conducteur',
            'conducteur',
            'pasteur',
            'membre.family',
            'membre.classe',
        ])
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
            'generatedBy' => $user,
            'generatedAt' => now(),
            'documentLabel' => 'Fiche du conducteur',
        ])->setPaper('a4', 'portrait');

        $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Download a PDF sheet for the acte/prayer after pastor validation.
     */
    public function fiche(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre', 'classe'])
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        // PDF disponible après validation du pasteur
        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
            abort(403, 'La fiche PDF est disponible après validation du pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.fiche-demande', [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])
            ->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Acte';
        return $pdf->download("{$prefix}_{$acte->reference}.pdf");
    }

    private function generateQrCode(string $payload): ?string
    {
        if (!class_exists(\Endroid\QrCode\QrCode::class) || !class_exists(\Endroid\QrCode\Writer\PngWriter::class)) {
            return null;
        }

        try {
            $qr = new \Endroid\QrCode\QrCode(data: $payload);
            $writer = new \Endroid\QrCode\Writer\PngWriter();
            $result = $writer->write($qr);
            return $result->getDataUri();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function buildQrDataUri(string $payload): ?string
    {
        return $this->generateQrCode($payload);
    }

    private function buildImageDataUri(string $path): ?string
    {
        if (!file_exists($path)) {
            return null;
        }

        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        if ($data === false) {
            return null;
        }

        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }
}
