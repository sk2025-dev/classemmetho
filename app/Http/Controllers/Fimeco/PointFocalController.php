<?php

namespace App\Http\Controllers\Fimeco;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Family;
use App\Models\FimecoSouscription;
use App\Models\Paiement;
use App\Services\FimecoClasseSuiviService;
use App\Support\FimecoAccess;
use App\Support\FimecoCotisation;
use Illuminate\Database\Eloquent\Builder;
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
    private const VERSEMENTS_PER_PAGE = 20;
    private const FAMILY_VERSEMENTS_PER_PAGE = 10;
    private const MODES_PAIEMENT = ['MOBILE_MONEY', 'ESPECES', 'VIREMENT', 'CHEQUE'];

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
        // Rang de SA classe uniquement (jamais le détail des autres classes) : le Point
        // Focal FIMECO ne gère que sa classe, il ne doit pas voir les autres.
        $fimecoRang = $this->fimecoService->rangPourClasse($annee, $classeId);

        return Inertia::render('Fimeco/PointFocal', [
            'classeNom' => $user->classe?->nom ?? 'Ma classe',
            'fimecoSuivi' => $fimecoSuivi,
            'fimecoAnnee' => $annee,
            'fimecoAnneesDisponibles' => $anneesDisponibles,
            'fimecoKpi' => $fimecoKpi,
            'fimecoRang' => $fimecoRang,
            'fimecoVersements' => $this->versementsPourClasse($request, $classeId, $annee),
        ]);
    }

    /**
     * Liste paginée (et filtrable) des versements FIMECO confirmés des familles
     * de la classe du Point Focal, pour une année donnée — jamais aucune autre
     * classe, exactement comme le module global mais limité à cette classe.
     */
    private function versementsPourClasse(Request $request, int $classeId, int $annee): array
    {
        $familyIds = Family::query()->where('classe_id', $classeId)->pluck('id');

        if ($familyIds->isEmpty()) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => self::VERSEMENTS_PER_PAGE,
            ];
        }

        $fimecoCotisationIds = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->pluck('id');

        $search = trim((string) $request->string('versement_q'));
        $mode = $request->string('versement_mode')->toString();
        $mode = in_array($mode, self::MODES_PAIEMENT, true) ? $mode : null;

        $paginator = FimecoCotisation::countedPaymentsQuery($fimecoCotisationIds->all())
            ->whereIn('family_id', $familyIds)
            ->where('year', $annee)
            ->with('family:id,nom,code_famille')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $inner) use ($search) {
                    $inner->where('reference_recu', 'like', "%{$search}%")
                        ->orWhere('note', 'like', "%{$search}%")
                        ->orWhereHas('family', function (Builder $familyQuery) use ($search) {
                            $familyQuery->where('nom', 'like', "%{$search}%")
                                ->orWhere('code_famille', 'like', "%{$search}%");
                        });
                });
            })
            ->when($mode, fn (Builder $query) => $query->where('mode_paiement', $mode))
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->paginate(self::VERSEMENTS_PER_PAGE, ['*'], 'versement_page')
            ->through(fn (Paiement $payment) => [
                'id' => $payment->id,
                'date' => optional($payment->date_paiement)->format('d/m/Y'),
                'famille' => $payment->family?->nom ?? 'Famille supprimée',
                'code_famille' => $payment->family?->code_famille,
                'montant' => (int) $payment->montant,
                'mode' => $payment->mode_paiement,
                'reference' => $payment->reference_recu,
                'note' => $payment->note,
            ]);

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
        ];
    }

    /**
     * Détail paginé des versements FIMECO d'UNE famille de la classe du Point
     * Focal — 403 si la famille n'appartient pas à sa classe.
     */
    public function familyVersements(Request $request, Family $family): JsonResponse
    {
        $user = Auth::user();
        $classeId = FimecoAccess::pointFocalClasseId($user);
        abort_unless($classeId !== null, 403);

        if ((int) $family->classe_id !== $classeId) {
            return response()->json(['message' => "Cette famille n'est pas dans votre classe."], 403);
        }

        $currentYear = (int) now()->year;
        $requestedYear = $request->integer('annee');
        $annee = $requestedYear > 0 ? $requestedYear : $currentYear;

        $fimecoCotisationIds = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->pluck('id')
            ->all();

        $souscription = FimecoSouscription::query()
            ->where('family_id', $family->id)
            ->where('annee', $annee)
            ->value('montant_souscrit');

        $montantPaye = (int) FimecoCotisation::countedPaymentsQuery($fimecoCotisationIds)
            ->where('family_id', $family->id)
            ->where('year', $annee)
            ->sum('montant');

        $versementsPaginator = FimecoCotisation::countedPaymentsQuery($fimecoCotisationIds)
            ->where('family_id', $family->id)
            ->where('year', $annee)
            ->orderByDesc('date_paiement')
            ->orderByDesc('id')
            ->paginate(self::FAMILY_VERSEMENTS_PER_PAGE, ['*'], 'page')
            ->through(fn (Paiement $payment) => [
                'id' => $payment->id,
                'date' => optional($payment->date_paiement)->format('d/m/Y'),
                'montant' => (int) $payment->montant,
                'mode' => $payment->mode_paiement,
                'reference' => $payment->reference_recu,
                'note' => $payment->note,
            ]);

        $montantSouscrit = (int) ($souscription ?? 0);

        return response()->json([
            'family_id' => $family->id,
            'famille' => $family->nom ?: 'Famille sans nom',
            'code_famille' => $family->code_famille,
            'annee' => $annee,
            'montant_souscrit' => $montantSouscrit,
            'montant_paye' => $montantPaye,
            'montant_restant' => max(0, $montantSouscrit - $montantPaye),
            'versements' => [
                'data' => $versementsPaginator->items(),
                'current_page' => $versementsPaginator->currentPage(),
                'last_page' => $versementsPaginator->lastPage(),
                'total' => $versementsPaginator->total(),
                'per_page' => $versementsPaginator->perPage(),
            ],
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
