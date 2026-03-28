<?php

namespace App\Http\Controllers\Pasteur;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiquePasteurRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\FormationRequest;
use App\Models\FormationRequestHistorique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $annonceTypes = [
            ActeLiturgique::TYPE_ANNOUNCE,
            ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ActeLiturgique::TYPE_PRIERE,
            ActeLiturgique::TYPE_GRACE,
            ActeLiturgique::TYPE_FELICITATIONS,
            ActeLiturgique::TYPE_GENERALE,
        ];

        $actes = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->where(function ($q) {
                $q->where('est_annonce', false)
                    ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', $annonceTypes)
            ->latest()
            ->paginate(10, ['*'], 'actes_page');

        $historique = ActeLiturgiqueHistorique::with(['acte.membre', 'acte.classe', 'acte.family'])
            ->whereHas('acte', function ($q) use ($annonceTypes) {
                $q->where(function ($sub) {
                    $sub->where('est_annonce', false)
                        ->orWhereNull('est_annonce');
                })->whereNotIn('type_acte', $annonceTypes);
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR', 'CELEBRE', 'TERMINE'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $acte = $item->acte;
                return [
                    'id' => $acte?->id,
                    'type_acte' => $acte?->type_acte,
                    'membre' => $acte?->membre,
                    'classe' => $acte?->classe,
                    'classe_id' => $acte?->classe_id,
                    'family' => $acte?->family,
                    'family_id' => $acte?->family_id,
                    'reference' => $acte?->reference,
                    'date_souhaitee' => $acte?->date_souhaitee,
                    'details' => $acte?->details,
                    'statut' => $item->statut_nouveau,
                    'note_pastorale' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        $familyMembers = User::query()
            ->where('family_id', $user->family_id)
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

        // Load announcements from all families
        $annonces = ActeLiturgique::with(['createur', 'family', 'classe', 'membre'])
            ->annonces()
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->orderBy('created_at', 'desc')
            ->get();

        // Load announcement history
        $annoncesHistorique = ActeLiturgiqueHistorique::with(['acte.createur', 'acte.family', 'acte.classe', 'acte.membre'])
            ->whereHas('acte', function ($q) {
                $q->annonces();
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR', 'PUBLIEE', 'ARCHIVEE'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $acte = $item->acte;
                return [
                    'id' => $acte?->id,
                    'type_acte' => $acte?->type_acte,
                    'type_annonce' => $acte?->type_annonce,
                    'message' => $acte?->details?->contenu ?? $acte?->message,
                    'createur' => $acte?->createur,
                    'famille' => $acte?->family,
                    'family_id' => $acte?->family_id,
                    'classe' => $acte?->classe,
                    'classe_id' => $acte?->classe_id,
                    'membre' => $acte?->membre,
                    'reference' => $acte?->reference,
                    'statut' => $item->statut_nouveau,
                    'commentaire' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        $formations = FormationRequest::with(['membre', 'classe', 'family', 'createur'])
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->orderBy('updated_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $formationsValidees = FormationRequest::with([
            'membre',
            'classe',
            'family',
            'createur',
            'formationTermineePar',
        ])
            ->where('statut', 'VALIDEE')
            ->orderByRaw('CASE WHEN formation_terminee_at IS NULL THEN 0 ELSE 1 END ASC')
            ->orderBy('updated_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $formationsHistorique = FormationRequestHistorique::with(['formation.membre', 'formation.classe', 'formation.family', 'acteur'])
            ->whereHas('formation', function ($q) {
                $q->whereIn('statut', ['VALIDEE', 'REFUSEE_PAR_PASTEUR']);
            })
            ->where('acteur_id', $user->id)
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $formation = $item->formation;
                return [
                    'id' => $formation?->id,
                    'reference' => $formation?->reference,
                    'membre' => $formation?->membre,
                    'classe' => $formation?->classe,
                    'family' => $formation?->family,
                    'conjoint_nom' => $formation?->conjoint_nom,
                    'conjoint_contact' => $formation?->conjoint_contact,
                    'conjoint_phone' => $formation?->conjoint_phone,
                    'conjoint_birthdate' => $formation?->conjoint_birthdate,
                    'conjoint_baptized' => $formation?->conjoint_baptized,
                    'conjoint_church' => $formation?->conjoint_church,
                    'formation_terminee_at' => optional($formation?->formation_terminee_at)?->toISOString(),
                    'formation_terminee_by' => $formation?->formation_terminee_by,
                    'statut' => $item->statut_nouveau,
                    'commentaire' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        return Inertia::render('Pasteur/Liturgie/Index', [
            'actes' => $actes,
            'historique' => $historique,
            'familyMembers' => $familyMembers,
            'annonces' => $annonces,
            'annoncesHistorique' => $annoncesHistorique,
            'formations' => $formations,
            'formationsValidees' => $formationsValidees,
            'formationsHistorique' => $formationsHistorique,
        ]);
    }

    public function transitionFormation(Request $request, int $id)
    {
        $user = Auth::user();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:VALIDEE,REFUSEE_PAR_PASTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'REFUSEE_PAR_PASTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $formation = FormationRequest::findOrFail($id);

        if ($formation->statut !== 'TRANSMISE_AU_PASTEUR') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande de formation n\'est plus en attente du pasteur.',
            ], 422);
        }

        $oldStatus = $formation->statut;
        $formation->statut = $payload['statut'];
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
            'message' => $payload['statut'] === 'VALIDEE'
                ? 'Demande de formation validée.'
                : 'Demande de formation refusée.',
            'formation' => $formation->fresh(['membre', 'classe', 'family', 'createur', 'formationTermineePar']),
        ]);
    }

    public function terminerFormation(Request $request, int $id)
    {
        $user = Auth::user();

        $payload = Validator::make($request->all(), [
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        $formation = FormationRequest::findOrFail($id);

        if ($formation->statut !== 'VALIDEE') {
            return response()->json([
                'success' => false,
                'message' => 'Seule une formation validee peut etre marquee comme terminee.',
            ], 422);
        }

        if ($formation->formation_terminee_at) {
            return response()->json([
                'success' => false,
                'message' => 'Cette formation est deja marquee comme terminee.',
            ], 422);
        }

        $formation->forceFill([
            'formation_terminee_at' => now(),
            'formation_terminee_by' => $user->id,
        ])->save();

        FormationRequestHistorique::create([
            'formation_request_id' => $formation->id,
            'statut_precedent' => $formation->statut,
            'statut_nouveau' => $formation->statut,
            'acteur_id' => $user->id,
            'commentaire' => $payload['commentaire'] ?: 'Formation confirmee comme terminee par le pasteur.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'La formation a ete marquee comme terminee.',
            'formation' => $formation->fresh(['membre', 'classe', 'family', 'createur', 'formationTermineePar']),
        ]);
    }

    public function ficheFormationsValidees()
    {
        $pasteur = Auth::user();

        $formations = FormationRequest::with(['membre', 'classe', 'family', 'createur'])
            ->where('statut', 'VALIDEE')
            ->orderBy('created_at', 'asc')
            ->get();

        if ($formations->isEmpty()) {
            abort(422, 'Aucune demande de formation validée à imprimer.');
        }

        $pdf = Pdf::loadView('pdf.formations-validees-secretariat', [
            'formations' => $formations,
            'pasteur' => $pasteur,
            'generatedAt' => now(),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('fiche-formations-validees-secretariat.pdf');
    }

    public function ficheFormationsHistorique()
    {
        $pasteur = Auth::user();

        $historique = FormationRequestHistorique::with(['formation.membre', 'formation.classe', 'formation.family', 'acteur'])
            ->whereHas('formation', function ($q) {
                $q->whereIn('statut', ['VALIDEE', 'REFUSEE_PAR_PASTEUR']);
            })
            ->where('acteur_id', $pasteur->id)
            ->whereIn('statut_nouveau', ['VALIDEE', 'REFUSEE_PAR_PASTEUR'])
            ->latest()
            ->get();

        if ($historique->isEmpty()) {
            abort(422, 'Aucun historique de formations à imprimer.');
        }

        $pdf = Pdf::loadView('pdf.formations-historique-pasteur', [
            'historique' => $historique,
            'pasteur' => $pasteur,
            'generatedAt' => now(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('historique-formations-validations.pdf');
    }

    public function store(StoreActeLiturgiquePasteurRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();

        $member = User::query()
            ->where('id', $payload['membre_id'])
            ->where('family_id', $user->family_id)
            ->firstOrFail();

        $payload['classe_id'] = $payload['classe_id'] ?? $member->classe_id;
        $payload['details'] = $payload['details'] ?? [];
        $payload['created_by'] = $user->id;
        $payload['pasteur_id'] = $user->id;
        $payload['statut'] = 'VALIDEE';

        $acte = $this->service->create($payload, $user)->load(['membre', 'classe', 'historiques.acteur']);

        return response()->json([
            'success' => true,
            'message' => 'Acte cree et valide par le pasteur.',
            'acte' => $acte,
        ]);
    }

    public function transition(TransitionActeLiturgiqueRequest $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::findOrFail($id);

        try {
            $updated = $this->service->transitionStatut(
                $acte,
                $request->string('statut')->toString(),
                $user,
                $request->input('commentaire')
            );
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Decision pastorale enregistree.',
            'acte' => $updated,
        ]);
    }

    public function decisionCeremonie(Request $request, int $id)
    {
        $user = Auth::user();

        $payload = Validator::make($request->all(), [
            'statut' => ['required', 'in:CEREMONIE_VALIDEE_PAR_PASTEUR,CEREMONIE_REFUSEE_PAR_PASTEUR'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        if (
            $payload['statut'] === 'CEREMONIE_REFUSEE_PAR_PASTEUR'
            && empty(trim((string) ($payload['commentaire'] ?? '')))
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Le motif du refus est obligatoire.',
            ], 422);
        }

        $acte = ActeLiturgique::with(['membre', 'classe', 'family', 'historiques.acteur'])
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
        if (($details['ceremonie_statut'] ?? null) !== 'CEREMONIE_TRANSMISE_AU_PASTEUR') {
            return response()->json([
                'success' => false,
                'message' => 'Aucune demande de date en attente du pasteur pour ce dossier.',
            ], 422);
        }

        $details['ceremonie_statut'] = $payload['statut'];
        $details['ceremonie_commentaire_pasteur'] = $payload['commentaire'] ?? null;
        $details['ceremonie_decision_pasteur_at'] = now()->toISOString();

        if ($payload['statut'] === 'CEREMONIE_VALIDEE_PAR_PASTEUR') {
            $details['ceremonie_validee_pasteur_at'] = now()->toISOString();
        }

        $acte->update([
            'details' => $details,
            'pasteur_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $payload['statut'] === 'CEREMONIE_VALIDEE_PAR_PASTEUR'
                ? 'La date de cérémonie a ete validée par le pasteur.'
                : 'La demande de date a ete refusee par le pasteur.',
            'acte' => $acte->fresh(['membre', 'classe', 'family', 'historiques.acteur']),
        ]);
    }

    public function certificat(int $id)
    {
        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->findOrFail($id);

        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];

        // Le pasteur ne doit pas pouvoir télécharger les certificats des membres
        // de sa propre famille pour éviter tout conflit d'intérêts.
        $user = Auth::user();
        if ($user->family_id && $acte->membre && $acte->membre->family_id === $user->family_id) {
            abort(403, 'Accès interdit aux certificats de membres de votre famille.');
        }

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
        $signaturePath = $pasteurSignature;
        $signatureName = trim(($acte->pasteur->prenom ?? '') . ' ' . ($acte->pasteur->nom ?? '')) ?: null;
        $signatureRole = 'Pasteur';

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
            ->where(function ($q) {
                $q->where('est_annonce', false)
                    ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
            ->findOrFail($id);

        if (!in_array($acte->statut, ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true)) {
            abort(403, 'La fiche du conducteur est disponible apres transmission au pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        $pdf = Pdf::loadView('pdf.fiche-acte-conducteur', [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
            'generatedBy' => $acte->conducteur ?? $acte->classe?->conducteur,
            'generatedAt' => $acte->updated_at ?? now(),
            'documentLabel' => 'Fiche recue du conducteur',
        ])->setPaper('a4', 'portrait');

        $filename = 'fiche-conducteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        return $pdf->download($filename);
    }

    public function fiche(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre', 'classe'])
            ->where(function ($q) {
                $q->where('est_annonce', false)
                    ->orWhereNull('est_annonce');
            })
            ->whereNotIn('type_acte', ActeLiturgique::ANNOUNCE_TYPES)
            ->findOrFail($id);

        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true)) {
            abort(403, 'La fiche du pasteur est disponible apres validation du dossier.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));

        $pdf = Pdf::loadView('pdf.fiche-demande', [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])->setPaper('a4', 'portrait');

        $filename = 'fiche-pasteur-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

        return $pdf->download($filename);
    }

    private function buildQrDataUri(string $payload): ?string
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
