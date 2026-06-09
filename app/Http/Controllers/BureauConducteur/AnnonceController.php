<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index(Request $request)
    {
        $enAttente = ActeLiturgique::with(['createur', 'family', 'conducteur', 'membre'])
            ->annonces()
            ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'enAttente_page');

        $validees = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre'])
            ->annonces()
            ->where('statut', ActeLiturgique::STATUT_VALIDEE)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'validees_page');

        $historique = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar', 'membre'])
            ->annonces()
            ->whereIn('statut', [
                ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
                ActeLiturgique::STATUT_PUBLIEE,
                ActeLiturgique::STATUT_ARCHIVEE,
            ])
            ->orderBy('updated_at', 'desc')
            ->paginate(50, ['*'], 'historique_page');

        return Inertia::render('Pasteur/Annonce/Index', [
            'enAttente' => $enAttente,
            'validees'  => $validees,
            'historique' => $historique,
        ]);
    }

    public function show(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar', 'membre'])
            ->annonces()
            ->findOrFail($id);

        return Inertia::render('Pasteur/Annonce/Show', [
            'annonce' => $acte,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce'      => 'required|string',
            'motif'             => 'nullable|string|max:100',
            'temoignage_public' => 'nullable|boolean',
            'membre_id'         => 'nullable|exists:users,id',
            'details.titre'     => 'nullable|string|max:255',
            'details.contenu'   => 'nullable|string',
            'message'           => 'nullable|string',
            'date_publication'  => 'nullable|date',
            'date_annonce'      => 'nullable|date',
            'date_expiration'   => 'nullable|date|after:date_publication',
        ]);

        $user = Auth::user();

        $acte = ActeLiturgique::create([
            'type_acte'         => $validated['type_annonce'],
            'est_annonce'       => true,
            'statut'            => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'membre_id'         => $validated['membre_id'] ?? null,
            'created_by'        => $user->id,
            'family_id'         => $user->family_id,
            'details'           => $validated['details'] ?? [],
            'message'           => $validated['message'] ?? null,
            'date_publication'  => $validated['date_publication'] ?? null,
            'reference'         => 'ANN-' . now()->format('Ymd-His') . '-' . random_int(100, 999),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce soumise avec succès.',
            'acte'    => $acte,
        ]);
    }

    public function valider(int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $acte->update([
            'statut'     => ActeLiturgique::STATUT_VALIDEE,
            'pasteur_id' => $user->id,
        ]);
        return redirect()->back()->with('success', 'Annonce validée.');
    }

    public function rejeter(Request $request, int $id)
    {
        $request->validate(['commentaire' => 'nullable|string|max:500']);
        $user = Auth::user();
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $acte->update([
            'statut'     => ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
            'pasteur_id' => $user->id,
        ]);
        return redirect()->back()->with('success', 'Annonce rejetée.');
    }

    public function publier(int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $acte->update([
            'statut'           => ActeLiturgique::STATUT_PUBLIEE,
            'pasteur_id'       => $user->id,
            'publiee_par'      => $user->id,
            'date_publication' => now(),
        ]);
        return redirect()->back()->with('success', 'Annonce publiée.');
    }

    public function archiver(int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $acte->update(['statut' => ActeLiturgique::STATUT_ARCHIVEE]);
        return redirect()->back()->with('success', 'Annonce archivée.');
    }

    public function fiche(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre'])
            ->annonces()
            ->findOrFail($id);

        $logoDataUri  = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));

        $conducteurSig = null;
        if ($acte->conducteur?->signature_path && Storage::disk('public')->exists($acte->conducteur->signature_path)) {
            $conducteurSig = $this->buildImageDataUri(Storage::disk('public')->path($acte->conducteur->signature_path));
        }
        $pasteurSig = null;
        if ($acte->pasteur?->signature_path && Storage::disk('public')->exists($acte->pasteur->signature_path)) {
            $pasteurSig = $this->buildImageDataUri(Storage::disk('public')->path($acte->pasteur->signature_path));
        }

        $pdf = Pdf::loadView('pdf.fiche-demande', [
            'acte'                       => $acte,
            'logoDataUri'                => $logoDataUri,
            'methoDataUri'               => $methoDataUri,
            'signatureConducteurDataUri' => $conducteurSig,
            'signaturePasteurDataUri'    => $pasteurSig,
        ])->setPaper('a4', 'portrait');

        $ref = $acte->reference ?? $acte->id;
        return $pdf->download("Fiche-Annonce_{$ref}.pdf");
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
