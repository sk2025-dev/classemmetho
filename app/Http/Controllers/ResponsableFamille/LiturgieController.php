<?php

namespace App\Http\Controllers\ResponsableFamille;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiquePieceJointe;
use App\Models\Classe;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        [$familyMembers, $actes] = $this->loadFamilyActesData(Auth::user());
        $classeIds = $familyMembers->pluck('classe_id')->filter()->unique();
        $conducteurs = User::query()
            ->where('role', 'conducteur')
            ->whereIn('classe_id', $classeIds)
            ->select(['id', 'prenom', 'nom', 'telephone', 'email', 'classe_id'])
            ->get()
            ->groupBy('classe_id');

        // Load announcements for family
        $user = Auth::user();
        $familyMemberIds = $familyMembers->pluck('id');
        $annonces = ActeLiturgique::where(function ($q) use ($user, $familyMemberIds) {
            $q->where('created_by', $user->id)
                ->orWhereIn('membre_id', $familyMemberIds);
        })
            ->whereNotNull('details->titre')
            ->where('est_annonce', true)
            ->with(['membre', 'classe', 'createur', 'historiques.acteur'])
            ->latest()
            ->get();

        // Load annonces from paroisse (published only)
        $annoncesParoisse = ActeLiturgique::where('statut', 'PUBLIEE')
            ->whereNotNull('details->titre')
            ->where('est_annonce', true)
            ->with(['membre', 'createur'])
            ->latest()
            ->get();

        return Inertia::render('ResponsableFamille/Liturgie/Index', [
            'actes' => $actes,
            'familyMembers' => $familyMembers,
            'conducteurs' => $conducteurs,
            'annonces' => $annonces,
            'annoncesParoisse' => $annoncesParoisse,
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('ResponsableFamille/Liturgie/Selection');
    }

    public function createForm(Request $request)
    {
        [$familyMembers, $actes] = $this->loadFamilyActesData(Auth::user());
        $classes = Classe::query()
            ->select('id', 'nom')
            ->orderBy('nom')
            ->get();
        $allowedTypes = ['bapteme', 'premiere_communion', 'confirmation', 'mariage', 'naissance', 'deces'];
        $initialType = $request->query('type_acte');

        if (!in_array($initialType, $allowedTypes, true)) {
            $initialType = null;
        }

        return Inertia::render('ResponsableFamille/Liturgie/Form', [
            'actes' => $actes,
            'familyMembers' => $familyMembers,
            'classes' => $classes,
            'initialType' => $initialType,
        ]);
    }

    public function store(StoreActeLiturgiqueRequest $request)
    {
        $user = Auth::user();
        $payload = $request->validated();
        $uploadedFiles = $request->file('pieces_jointes', []);
        unset($payload['pieces_jointes']);
        $payload['created_by'] = $user->id;
        $payload['statut'] = 'SOUMISE';

        $targetMemberId = (int) ($payload['membre_id'] ?? 0);
        $isMemberInFamily = User::where('id', $targetMemberId)
            ->where('family_id', $user->family_id)
            ->exists();

        if (!$isMemberInFamily) {
            return response()->json([
                'success' => false,
                'message' => 'Le membre selectionne ne fait pas partie de votre famille.',
            ], 422);
        }

        // Prevent duplicate submissions: if the same family member has an active
        // request of the same type (any statut except ARCHIVEE), reject the new one.
        if ($targetMemberId > 0 && !empty($payload['type_acte'])) {
            $already = ActeLiturgique::query()
                ->where('membre_id', $targetMemberId)
                ->where('type_acte', $payload['type_acte'])
                // any statut except archived
                ->where('statut', '!=', 'ARCHIVEE')
                ->exists();
            if ($already) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez deja soumis une demande de ' . str_replace('_', ' ', $payload['type_acte']) . '.',
                ], 422);
            }
        }

        if (empty($payload['classe_id']) && $user->classe_id) {
            $payload['classe_id'] = $user->classe_id;
        }

        try {
            $acte = $this->service->create($payload, $user);
        } catch (\InvalidArgumentException $e) {
            // service-level duplicate or bad input
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }


        if (!empty($uploadedFiles)) {
            foreach ($uploadedFiles as $file) {
                $storedPath = $file->store('actes_liturgiques/' . $acte->id, 'public');
                ActeLiturgiquePieceJointe::create([
                    'acte_id' => $acte->id,
                    'path' => $storedPath,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'uploaded_by' => $user->id,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande liturgique soumise avec succes.',
            'acte' => $acte->fresh(['membre', 'classe', 'historiques.acteur']),
        ]);
    }

    public function certificat(Request $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])->findOrFail($id);
        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];
        $preview = $request->boolean('preview');

        $isOwner = (int) $acte->created_by === (int) $user->id;
        $isFamilyMember = User::where('id', $acte->membre_id)
            ->where('family_id', $user->family_id)
            ->exists();

        if (!$isOwner && !$isFamilyMember) {
            abort(403, 'Acces non autorise a ce certificat.');
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $validFicheStatuses = $typeActe === 'naissance'
                ? ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE']
                : ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'];

            if (!in_array($acte->statut, $validFicheStatuses, true)) {
                abort(422, "La fiche est disponible uniquement apres validation du pasteur.");
            }
        } elseif (!in_array($acte->statut, ['CELEBRE', 'TERMINE'], true)) {
            abort(422, "Le certificat est disponible uniquement apres l'acte effectue.");
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
            $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
            $view = $typeActe === 'naissance'
                ? 'pdf.fiche-naissance'
                : ($typeActe === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande');

            $conducteurSignatureDataUri = null;
            if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
                $conducteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
            }
            $pasteurSignatureDataUri = null;
            if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
                $pasteurSignatureDataUri = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
            }

            $pdf = Pdf::loadView($view, [
                'acte' => $acte,
                'logoDataUri' => $logoDataUri,
                'methoDataUri' => $methoDataUri,
                'conducteurSignatureDataUri' => $conducteurSignatureDataUri,
                'pasteurSignatureDataUri' => $pasteurSignatureDataUri,
            ])->setPaper('a4', 'portrait');

            $filename = 'fiche-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';
            return $this->respondWithPdf($pdf, $filename, $preview);
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
            // récupérer l'image depuis l'API et convertir en data-uri
            $remote = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($qrUrl);
            $img = @file_get_contents($remote);
            if ($img !== false) {
                $qrDataUri = 'data:image/png;base64,' . base64_encode($img);
            } else {
                $qrDataUri = null;
            }
        }

        // logo et scan depuis le dossier public/images
        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        // si scan.png absent, on tente image.png
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
        return $this->respondWithPdf($pdf, $filename, $preview);
    }

    public function updateCeremonie(Request $request, int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::with([
            'membre',
            'classe',
            'historiques.acteur',
        ])->findOrFail($id);

        $isOwner = (int) $acte->created_by === (int) $user->id;
        $isFamilyMember = User::where('id', $acte->membre_id)
            ->where('family_id', $user->family_id)
            ->exists();

        if (!$isOwner && !$isFamilyMember) {
            abort(403, 'Acces non autorise a cette demande.');
        }

        if (strtolower((string) $acte->type_acte) !== 'mariage') {
            return response()->json([
                'success' => false,
                'message' => 'Le choix de date est disponible uniquement pour les demandes de mariage.',
            ], 422);
        }

        if (
            in_array($acte->statut, ['REFUSEE_PAR_CONDUCTEUR', 'REFUSEE_PAR_PASTEUR', 'ARCHIVEE'], true)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande ne peut plus etre modifiee.',
            ], 422);
        }

        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'La date de cérémonie ne peut être choisie qu\'après validation pastorale du dossier.',
            ], 422);
        }

        $details = (array) ($acte->details ?? []);
        if (empty($details['fiche_pasteur_envoyee'])) {
            return response()->json([
                'success' => false,
                'message' => 'Le pasteur doit envoyer la fiche PDF avant que vous puissiez proposer une date.',
            ], 422);
        }

        $payload = $request->validate([
            'date_souhaitee' => ['required', 'date'],
            'ceremonie_creneau' => ['required', 'string', 'in:matin,apres_midi'],
            'lieu_ceremonie' => ['required', 'string', 'max:255'],
            'temoins' => ['required', 'string', 'max:1000'],
        ]);

        $conflict = ActeLiturgique::where('type_acte', $acte->type_acte)
            ->where('id', '<>', $acte->id)
            ->where('date_souhaitee', $payload['date_souhaitee'])
            ->where('details->ceremonie_creneau', $payload['ceremonie_creneau'])
            ->whereNotIn('details->ceremonie_statut', [
                'CEREMONIE_REFUSEE_PAR_CONDUCTEUR',
                'CEREMONIE_REFUSEE_PAR_PASTEUR',
            ])
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Ce créneau est déjà réservé pour cette date. Choisissez un autre créneau.',
            ], 422);
        }

        $details = (array) ($acte->details ?? []);
        $details['lieu_ceremonie'] = $payload['lieu_ceremonie'];
        $details['temoins'] = $payload['temoins'];
        $details['ceremonie_creneau'] = $payload['ceremonie_creneau'];
        $details['ceremonie_statut'] = 'CEREMONIE_SOUMISE_AU_CONDUCTEUR';
        $details['ceremonie_soumise_at'] = now()->toISOString();
        $details['ceremonie_transmise_pasteur_at'] = null;
        $details['ceremonie_validee_pasteur_at'] = null;
        $details['ceremonie_commentaire_conducteur'] = null;
        $details['ceremonie_commentaire_pasteur'] = null;

        $acte->update([
            'date_souhaitee' => $payload['date_souhaitee'],
            'details' => $details,
        ]);

        $acte = $acte->fresh([
            'membre',
            'classe',
            'historiques.acteur',
        ]);
        $details = (array) ($acte->details ?? []);
        $ceremonyStatut = strtoupper((string) ($details['ceremonie_statut'] ?? ""));
        $blockedStatuses = [
            'CEREMONIE_SOUMISE_AU_CONDUCTEUR',
            'CEREMONIE_TRANSMISE_AU_PASTEUR',
            'CEREMONIE_VALIDEE_PAR_PASTEUR',
            'CEREMONIE_VALIDE_PAR_PASTEUR',
        ];
        $acteType = strtolower((string) $acte->type_acte);
        $acte->can_choose_date =
            $acteType === 'mariage'
            && in_array($acte->statut, ['VALIDEE', 'PUBLIEE'], true)
            && !in_array($ceremonyStatut, $blockedStatuses, true);

        return response()->json([
            'success' => true,
            'message' => 'Les informations de ceremonie ont ete enregistrees.',
            'acte' => $acte,
        ]);
    }

    public function fiche(int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre', 'classe'])
            ->whereNotIn('type_acte', [
                ActeLiturgique::TYPE_ANNOUNCE,
                ActeLiturgique::TYPE_ANNOUNCE_LITURGIQUE,
            ])
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('family_id', $user->family_id);
            })
            ->findOrFail($id);

        // PDF disponible après transmission au pasteur ou validation pour les fiches naissance/décès
        $typeActe = strtolower((string) $acte->type_acte);
        if ($typeActe === 'naissance') {
            if (!in_array($acte->statut, ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
                abort(403, 'La fiche PDF est disponible après transmission au pasteur.');
            }
        } elseif ($typeActe === 'deces') {
            if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
                abort(403, 'La fiche PDF est disponible après validation du pasteur.');
            }
        } elseif (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
            abort(403, 'La fiche PDF est disponible après validation du pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $view = $acte->type_acte === 'naissance'
            ? 'pdf.fiche-naissance'
            : ($acte->type_acte === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])
            ->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Acte';
        return $pdf->download("{$prefix}_{$acte->reference}.pdf");
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

    private function respondWithPdf($pdf, string $filename, bool $preview)
    {
        if (!$preview) {
            return $pdf->download($filename);
        }

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    private function loadFamilyActesData(User $user): array
    {
        $columns = ['id', 'nom', 'prenom', 'classe_id', 'genre'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        $familyMembers = User::where('family_id', $user->family_id)
            ->with('classe', 'sacrements')
            ->select($columns)
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get()
            ->map(function ($member) {
                if (!empty($member->date_naissance)) {
                    $member->date_naissance = $member->date_naissance->format('Y-m-d');
                }
                return $member;
            });
        $familyMemberIds = $familyMembers->pluck('id');

        $actes = ActeLiturgique::with([
            'membre',
            'classe',
            'createur',
            'historiques.acteur',
        ])
            ->where(function ($query) use ($user, $familyMemberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $familyMemberIds);
            })
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($acte) {
                $type = strtolower((string) $acte->type_acte);
                $details = (array) ($acte->details ?? []);
                $ceremonyStatut = strtoupper((string) ($details['ceremonie_statut'] ?? ""));
                $blockedStatuses = [
                    'CEREMONIE_SOUMISE_AU_CONDUCTEUR',
                    'CEREMONIE_TRANSMISE_AU_PASTEUR',
                ];
                $hasFicheEnvoyee = !empty($details['fiche_pasteur_envoyee']);
                $acte->can_choose_date =
                    $type === 'mariage'
                    && in_array($acte->statut, ['VALIDEE', 'PUBLIEE'], true)
                    && !in_array($ceremonyStatut, $blockedStatuses, true)
                    && $hasFicheEnvoyee;

                return $acte;
            });

        return [$familyMembers, $actes];
    }
}
