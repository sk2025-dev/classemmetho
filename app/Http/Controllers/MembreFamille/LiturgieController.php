<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiquePieceJointe;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service)
    {
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $familyMemberIds = User::where('family_id', $user->family_id)->pluck('id');

        $actes = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->where(function ($query) use ($user, $familyMemberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $familyMemberIds);
            })
            ->latest()
            ->get();

        $annonces = ActeLiturgique::with(['membre', 'classe', 'createur', 'historiques.acteur'])
            ->annonces()
            ->where(function ($query) use ($user, $familyMemberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $familyMemberIds);
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
                'date_naissance' => $user->date_naissance?->format('Y-m-d'),
                'lieu_naissance' => $user->lieu_naissance ?? null,
                'pere' => $user->pere ?? null,
                'mere' => $user->mere ?? null,
            ]],
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

    public function certificat(int $id)
    {
        $user = Auth::user();
        $familyMemberIds = User::where('family_id', $user->family_id)->pluck('id');

        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->where(function ($query) use ($user, $familyMemberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $familyMemberIds);
            })
            ->findOrFail($id);

        if (!in_array($acte->statut, ['CELEBRE', 'TERMINE'], true)) {
            abort(422, "Le certificat est disponible uniquement apres l'acte effectue.");
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
            $remote = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($qrUrl);
            $img = @file_get_contents($remote);
            if ($img !== false) {
                $qrDataUri = 'data:image/png;base64,'.base64_encode($img);
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

    private function buildQrDataUri(string $payload): ?string
    {
        if (!class_exists(\Endroid\QrCode\QrCode::class) || !class_exists(\Endroid\QrCode\Writer\PngWriter::class)) {
            return null;
        }

        try {
            $qr = \Endroid\QrCode\QrCode::create($payload);
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
