<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiquePieceJointe;
use App\Models\Classe;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $user->load('classe', 'sacrements');

        $actes = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('membre_id', $user->id);
            })
            ->latest()
            ->get();

        $annonces = ActeLiturgique::with(['membre', 'classe', 'createur', 'historiques.acteur'])
            ->annonces()
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('membre_id', $user->id);
            })
            ->latest()
            ->get();

        $annoncesParoisse = ActeLiturgique::with(['membre', 'createur'])
            ->annonces()
            ->publiees()
            ->where(function ($query) use ($user) {
                $query->whereNull('family_id')
                    ->orWhere('family_id', $user->family_id);
            })
            ->latest('date_publication')
            ->get();

        return Inertia::render('MembreFamille/Liturgie/Index', [
            'actes' => $actes,
            'annonces' => $annonces,
            'annoncesParoisse' => $annoncesParoisse,
            'familyMembers' => [[
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'classe_id' => $user->classe_id,
                'classe' => $user->classe,
                'genre' => $user->genre,
                'date_naissance' => $user->date_naissance?->format('Y-m-d'),
                'lieu_naissance' => $user->lieu_naissance ?? null,
                'pere' => $user->pere ?? null,
                'mere' => $user->mere ?? null,
                'sacrements' => $user->sacrements,
            ]],
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();

        $actesEnCours = ActeLiturgique::query()
            ->where('membre_id', $user->id)
            ->whereIn('statut', ActeLiturgique::statutsBloquantNouvelleDemande())
            ->pluck('type_acte')
            ->unique()
            ->values()
            ->toArray();

        return Inertia::render('ResponsableFamille/Liturgie/Selection', [
            'basePath'     => '/membre-famille/liturgie',
            'actesEnCours' => $actesEnCours,
        ]);
    }

    public function createForm(Request $request)
    {
        $user = Auth::user();
        $user->load('classe', 'sacrements');

        $actes = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('membre_id', $user->id);
            })
            ->latest()
            ->get();

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
            'familyMembers' => [[
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'classe_id' => $user->classe_id,
                'classe' => $user->classe,
                'genre' => $user->genre,
                'date_naissance' => $user->date_naissance?->format('Y-m-d'),
                'lieu_naissance' => $user->lieu_naissance ?? null,
                'pere' => $user->pere ?? null,
                'mere' => $user->mere ?? null,
                'sacrements' => $user->sacrements,
            ]],
            'classes' => $classes,
            'initialType' => $initialType,
            'routeBase' => '/membre-famille/liturgie',
            'canSelectMember' => false,
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
        $payload['membre_id'] = $user->id;

        if (empty($payload['classe_id']) && $user->classe_id) {
            $payload['classe_id'] = $user->classe_id;
        }

        if (!empty($payload['type_acte'])) {
            $existingActe = ActeLiturgique::query()
                ->where('membre_id', $user->id)
                ->where('type_acte', $payload['type_acte'])
                ->whereIn('statut', ActeLiturgique::statutsBloquantNouvelleDemande())
                ->latest('id')
                ->first();

            if ($existingActe) {
                $creator = $existingActe->created_by
                    ? User::query()->select(['id', 'role', 'prenom', 'nom'])->find($existingActe->created_by)
                    : null;

                if ($creator && (int) $creator->id !== (int) $user->id && $creator->role === 'responsable_famille') {
                    return response()->json([
                        'success' => false,
                        'message' => "Votre responsable de famille a deja fait cette demande d'acte pour vous.",
                    ], 422);
                }

                return response()->json([
                    'success' => false,
                    'message' => in_array($existingActe->statut, [
                        ActeLiturgique::STATUT_Soumise,
                        ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR,
                        ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
                    ], true)
                        ? 'Une demande de ce type est deja en cours de traitement pour votre profil.'
                        : 'Une demande de ce type existe deja pour votre profil.',
                ], 422);
            }
        }

        $acte = $this->service->create($payload, $user);

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
        $user    = Auth::user();
        $preview = $request->boolean('preview');
        $acte    = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                    ->orWhere('membre_id', $user->id);
            })
            ->findOrFail($id);

        $typeActe = strtolower((string) $acte->type_acte);
        $typesCertificat = ['bapteme', 'mariage'];
        $typesFiche = ['naissance', 'deces'];

        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE', 'CELEBRE', 'TERMINE'], true) || !$acte->pasteur_id) {
            abort(422, "Le certificat est disponible uniquement apres validation du pasteur.");
        }

        if (in_array($typeActe, $typesFiche, true)) {
            $logoDataUri  = $this->buildImageDataUri(public_path('images/logo.png'));
            $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
            $view = match ($typeActe) {
                'naissance' => 'pdf.fiche-naissance',
                'deces'     => 'pdf.fiche-deces',
                default     => 'pdf.fiche-demande',
            };

            $signatureConducteurDataUri = $this->buildSignatureDataUri($acte->conducteur?->signature_path);
            $signaturePasteurDataUri    = $this->buildSignatureDataUri($acte->pasteur?->signature_path);

            try {
                $pdf = Pdf::loadView($view, [
                    'acte'                      => $acte,
                    'logoDataUri'               => $logoDataUri,
                    'methoDataUri'              => $methoDataUri,
                    'signatureConducteurDataUri' => $signatureConducteurDataUri,
                    'signaturePasteurDataUri'   => $signaturePasteurDataUri,
                ])->setPaper('a4', 'portrait');

                $filename = 'fiche-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';
                return $this->respondWithPdf($pdf, $filename, $preview);
            } catch (\Throwable $e) {
                Log::error('Echec generation fiche membre-famille', [
                    'acte_id' => $acte->id,
                    'type_acte' => $typeActe,
                    'view' => $view,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'error' => 'Erreur generation fiche',
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'view' => $view,
                    'acte_id' => $acte->id,
                ], 500);
            }
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

        $signatureConducteurDataUri = $this->buildSignatureDataUri($acte->conducteur?->signature_path);
        $signaturePasteurDataUri    = $this->buildSignatureDataUri($acte->pasteur?->signature_path);

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

        try {
            $pdf = Pdf::loadView('pdf.acte-liturgique-certificat', [
                'acte'                      => $acte,
                'signaturePath'             => $signaturePath,
                'signatureName'             => $signatureName,
                'signatureRole'             => $signatureRole,
                'signatureConducteurDataUri' => $signatureConducteurDataUri,
                'signaturePasteurDataUri'   => $signaturePasteurDataUri,
                'qrDataUri'                 => $qrDataUri,
                'logoDataUri'               => $logoDataUri,
                'scanDataUri'               => $scanDataUri,
            ])->setPaper('a4', 'landscape');

            $filename = 'certificat-' . ($acte->reference ?: ('acte-' . $acte->id)) . '.pdf';

            return $this->respondWithPdf($pdf, $filename, $preview);
        } catch (\Throwable $e) {
            Log::error('Echec generation certificat membre-famille', [
                'acte_id' => $acte->id,
                'type_acte' => $typeActe,
                'view' => 'pdf.acte-liturgique-certificat',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Erreur generation certificat',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'view' => 'pdf.acte-liturgique-certificat',
                'acte_id' => $acte->id,
            ], 500);
        }
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
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    private function buildSignatureDataUri(?string $signaturePath): ?string
    {
        if (empty($signaturePath)) {
            return null;
        }

        // Data URI directe (canvas/base64 déjà encodé)
        if (str_starts_with($signaturePath, 'data:image/')) {
            return $signaturePath;
        }

        $fullPath = Storage::disk('public')->exists($signaturePath)
            ? Storage::disk('public')->path($signaturePath)
            : null;

        if (!$fullPath) {
            return null;
        }

        $ext  = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION) ?: 'png');
        $mime = match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'gif'         => 'image/gif',
            'webp'        => 'image/webp',
            default       => 'image/png',
        };

        $raw = @file_get_contents($fullPath);
        return $raw !== false ? 'data:' . $mime . ';base64,' . base64_encode($raw) : null;
    }
}
