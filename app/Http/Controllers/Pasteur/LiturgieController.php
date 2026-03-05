<?php
namespace App\Http\Controllers\Pasteur;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Http\Requests\ActesLiturgiques\TransitionActeLiturgiqueRequest;
use App\Http\Requests\ActesLiturgiques\StoreActeLiturgiquePasteurRequest;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use App\Services\ActeLiturgiqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LiturgieController extends Controller
{
    public function __construct(private ActeLiturgiqueService $service)
    {
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $actes = ActeLiturgique::with(['membre', 'classe', 'historiques.acteur'])
            ->where('statut', 'TRANSMISE_AU_PASTEUR')
            ->latest()
            ->paginate(10, ['*'], 'actes_page');

        $historique = ActeLiturgiqueHistorique::with(['acte.membre', 'acte.classe'])
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
                    'reference' => $acte?->reference,
                    'statut' => $item->statut_nouveau,
                    'note_pastorale' => $item->commentaire,
                    'validated_at' => optional($item->created_at)->toISOString(),
                ];
            })
            ->values();

        $familyMembers = User::query()
            ->where('family_id', $user->family_id)
            ->select('id', 'nom', 'prenom', 'classe_id')
            ->orderBy('prenom')
            ->orderBy('nom')
            ->get();

        // Load announcements from all families
        $annonces = ActeLiturgique::with(['createur', 'family', 'membre'])
            ->annonces()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pasteur/Liturgie/Index', [
            'actes' => $actes,
            'historique' => $historique,
            'familyMembers' => $familyMembers,
            'annonces' => $annonces,
        ]);
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

        $updated = $this->service->transitionStatut(
            $acte,
            $request->string('statut')->toString(),
            $user,
            $request->input('commentaire')
        );

        return response()->json([
            'success' => true,
            'message' => 'Decision pastorale enregistree.',
            'acte' => $updated,
        ]);
    }

    public function certificat(int $id)
    {
        $acte = ActeLiturgique::with(['membre', 'classe', 'conducteur', 'pasteur'])
            ->findOrFail($id);

        // Le pasteur ne doit pas pouvoir télécharger les certificats des membres
        // de sa propre famille pour éviter tout conflit d'intérêts.
        $user = Auth::user();
        if ($user->family_id && $acte->membre && $acte->membre->family_id === $user->family_id) {
            abort(403, 'Accès interdit aux certificats de membres de votre famille.');
        }

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
