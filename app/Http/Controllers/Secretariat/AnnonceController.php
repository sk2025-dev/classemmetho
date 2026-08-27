<?php

namespace App\Http\Controllers\Secretariat;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

class AnnonceController extends Controller
{
    /**
     * Le secrétariat archive une demande de prière déjà validée/publiée par
     * le pasteur.
     */
    public function archiver(int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);

        if (!in_array($acte->statut, [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Seule une demande validée par le pasteur peut être archivée.',
            ], 403);
        }

        $acte->update([
            'statut' => ActeLiturgique::STATUT_ARCHIVEE,
            'updated_by' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande archivée avec succès.',
        ]);
    }

    /**
     * Impression de la fiche PDF de la demande de prière, disponible dès
     * validation par le pasteur.
     */
    public function fiche(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'bureauConducteur', 'pasteur', 'membre'])
            ->annonces()
            ->findOrFail($id);

        if (!in_array($acte->statut, [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE, ActeLiturgique::STATUT_ARCHIVEE], true)) {
            abort(403, 'La fiche PDF est disponible uniquement après validation du pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $view = $acte->type_acte === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande';
        $pdf = Pdf::loadView($view, [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Annonce';
        return $pdf->stream("{$prefix}_{$acte->reference}.pdf");
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
