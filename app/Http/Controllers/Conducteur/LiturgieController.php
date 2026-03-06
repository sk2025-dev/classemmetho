<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Models\ActeLiturgique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
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

        $columns = ['id', 'nom', 'prenom', 'classe_id', 'sexe'];
        $optionalColumns = ['date_naissance', 'lieu_naissance', 'pere', 'mere'];
        foreach ($optionalColumns as $col) {
            if (Schema::hasColumn('users', $col)) {
                $columns[] = $col;
            }
        }

        $familyMembers = User::query()
            ->whereIn('classe_id', $classIds)
            ->with('classe')
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
            'familyMembers' => $familyMembers,
            'classes' => $user->getManagedClasses()->values(),
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

    public function certificat(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->whereIn('classe_id', $classIds)
            ->findOrFail($id);

        if (!in_array($acte->statut, ['CELEBRE', 'TERMINE'], true)) {
            abort(422, "Le certificat est disponible uniquement apres l'acte effectue.");
        }

        $conducteurSignature = $acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)
            ? Storage::disk('public')->path($acte->conducteur->signature_path)
            : null;
        $signaturePath = $conducteurSignature;
        $signatureName = trim(($acte->conducteur->prenom ?? '') . ' ' . ($acte->conducteur->nom ?? '')) ?: null;
        $signatureRole = 'Conducteur';

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
            $qr = \Endroid\QrCode\QrCode::create($payload);
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
