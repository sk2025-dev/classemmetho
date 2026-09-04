<?php

namespace App\Http\Controllers\Fimeco;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\FimecoSouscription;
use App\Services\FimecoClasseSuiviService;
use App\Support\FimecoAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Espace du Point Focal FIMECO : mêmes informations que le conducteur au
 * niveau FIMECO (suivi par famille, KPI, classement inter-classes), mais
 * limité à la classe de l'utilisateur — aucun autre module de trésorerie
 * ni aucune autre classe n'est accessible ici.
 */
class PointFocalController extends Controller
{
    public function __construct(private FimecoClasseSuiviService $fimecoService)
    {
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $classeId = FimecoAccess::pointFocalClasseId($user);
        abort_unless($classeId !== null, 403);

        $annee = (int) ($request->integer('fimeco_annee') ?: now()->year);

        $anneesDisponibles = $this->fimecoService->anneesDisponibles($classeId);
        ['suivi' => $fimecoSuivi, 'kpi' => $fimecoKpi] = $this->fimecoService->suiviPourClasse($classeId, $annee);
        $fimecoClassement = $this->fimecoService->classementClasses($annee, $classeId);

        return Inertia::render('Fimeco/PointFocal', [
            'classeNom' => $user->classe?->nom ?? 'Ma classe',
            'fimecoSuivi' => $fimecoSuivi,
            'fimecoAnnee' => $annee,
            'fimecoAnneesDisponibles' => $anneesDisponibles,
            'fimecoKpi' => $fimecoKpi,
            'fimecoClassement' => $fimecoClassement,
        ]);
    }

    public function setSouscription(Request $request): JsonResponse
    {
        $user = Auth::user();
        $classeId = FimecoAccess::pointFocalClasseId($user);
        abort_unless($classeId !== null, 403);

        $validated = $request->validate([
            'family_id' => ['required', 'exists:families,id'],
            'montant_souscrit' => ['required', 'integer', 'min:0'],
        ]);

        $family = Family::query()->findOrFail($validated['family_id']);

        if ((int) $family->classe_id !== $classeId) {
            return response()->json(['message' => "Cette famille n'est pas dans votre classe."], 403);
        }

        $annee = now()->year;

        $souscription = FimecoSouscription::query()->updateOrCreate(
            ['family_id' => $family->id, 'annee' => $annee],
            [
                'classe_id' => $classeId,
                'montant_souscrit' => $validated['montant_souscrit'],
                'created_by' => $user->id,
            ]
        );

        return response()->json([
            'message' => 'Souscription FIMECO enregistrée avec succès.',
            'data' => [
                'family_id' => $souscription->family_id,
                'annee' => $souscription->annee,
                'montant_souscrit' => $souscription->montant_souscrit,
            ],
        ]);
    }
}
