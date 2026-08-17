<?php

namespace App\Http\Controllers\Conducteur;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Paiement;
use App\Models\Tribu;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TribuController extends Controller
{
    private function guardClasse(): User
    {
        $user = Auth::user();

        if ($user->role !== 'conducteur' || !$user->classe_id) {
            abort(403, 'Accès non autorisé au module tribu.');
        }

        if (!$user->classe?->has_tribus) {
            abort(403, 'Le module tribu n\'est pas activé pour votre classe.');
        }

        return $user;
    }

    public function index()
    {
        $user = $this->guardClasse();
        $classeId = $user->classe_id;

        $membresClasse = User::query()
            ->where('classe_id', $classeId)
            ->whereIn('role', ['membre_famille', 'responsable_famille'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'role', 'tribu_id']);

        $tribus = Tribu::query()
            ->where('classe_id', $classeId)
            ->withCount('membres')
            ->with('chef:id,nom,prenom')
            ->orderBy('nom')
            ->get()
            ->map(fn (Tribu $tribu) => [
                'id' => $tribu->id,
                'nom' => $tribu->nom,
                'description' => $tribu->description ?? '',
                'status' => $tribu->status,
                'membres_count' => $tribu->membres_count,
                'chef' => $tribu->chef ? [
                    'id' => $tribu->chef->id,
                    'nom' => trim($tribu->chef->prenom . ' ' . $tribu->chef->nom),
                ] : null,
            ]);

        $membresNonAffectes = $membresClasse
            ->whereNull('tribu_id')
            ->map(fn (User $membre) => [
                'id' => $membre->id,
                'nom' => trim($membre->prenom . ' ' . $membre->nom),
            ])
            ->values();

        $membresAffectes = User::query()
            ->where('classe_id', $classeId)
            ->whereNotNull('tribu_id')
            ->with('family:id,nom')
            ->get(['id', 'nom', 'prenom', 'family_id']);

        $financesClasse = self::buildFinancesDataForMembers($membresAffectes, $classeId);
        $membresAJour = collect($financesClasse)->where('statut', 'A JOUR')->count();

        return Inertia::render('Conducteur/Tribus', [
            'tribus' => $tribus,
            'membresNonAffectes' => $membresNonAffectes,
            'classeNom' => $user->classe?->nom,
            'stats' => [
                'nombreTribus' => $tribus->count(),
                'totalMembres' => $membresAffectes->count(),
                'membresAJour' => $membresAJour,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->guardClasse();

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('tribus', 'nom')->where('classe_id', $user->classe_id)],
            'description' => 'nullable|string',
        ]);

        Tribu::create($validated + [
            'classe_id' => $user->classe_id,
            'status' => 'active',
        ]);

        return back()->with('success', 'Tribu créée avec succès.');
    }

    public function update(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255', Rule::unique('tribus', 'nom')->where('classe_id', $user->classe_id)->ignore($tribu->id)],
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $tribu->update($validated);

        return back()->with('success', 'Tribu mise à jour avec succès.');
    }

    public function destroy(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        if ($tribu->membres()->count() > 0) {
            return back()->withErrors([
                'error' => 'Impossible de supprimer cette tribu car elle contient encore des membres.',
            ]);
        }

        $tribu->delete();

        return back()->with('success', 'Tribu supprimée avec succès.');
    }

    public function assignMembre(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $membre = User::query()->findOrFail($validated['user_id']);

        if ($membre->classe_id !== $user->classe_id) {
            return back()->withErrors(['error' => 'Ce membre n\'est pas dans votre classe.']);
        }

        if (!in_array($membre->role, ['membre_famille', 'responsable_famille'], true)) {
            return back()->withErrors(['error' => 'Seul un membre de famille peut être affecté à une tribu.']);
        }

        $membre->update(['tribu_id' => $tribu->id]);

        return back()->with('success', 'Membre affecté à la tribu avec succès.');
    }

    public function removeMembre(Request $request, Tribu $tribu, User $user)
    {
        $conducteur = $this->guardClasse();
        $this->authorizeTribu($conducteur, $tribu);

        if ($user->tribu_id !== $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre n\'appartient pas à cette tribu.']);
        }

        $user->update(['tribu_id' => null]);

        if ($tribu->chef_id === $user->id) {
            $tribu->update(['chef_id' => null]);
        }

        return back()->with('success', 'Membre retiré de la tribu avec succès.');
    }

    public function nommerChef(Request $request, Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $membre = User::query()->findOrFail($validated['user_id']);

        if ($membre->tribu_id !== $tribu->id) {
            return back()->withErrors(['error' => 'Ce membre doit d\'abord appartenir à la tribu pour en devenir le chef.']);
        }

        $tribu->update(['chef_id' => $membre->id]);

        return back()->with('success', 'Chef de tribu nommé avec succès.');
    }

    public function retirerChef(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        $tribu->update(['chef_id' => null]);

        return back()->with('success', 'Chef de tribu retiré avec succès.');
    }

    public function finances(Tribu $tribu)
    {
        $user = $this->guardClasse();
        $this->authorizeTribu($user, $tribu);

        return response()->json([
            'success' => true,
            'data' => $this->buildFinancesData($tribu),
        ]);
    }

    /**
     * Agrégation des cotisations individuelles payées/dues pour les membres d'une tribu,
     * même logique que Conducteur\TresorerieController (scope classe -> scope tribu).
     */
    public static function buildFinancesData(Tribu $tribu): array
    {
        $membres = $tribu->membres()->with('family:id,nom')->get(['id', 'nom', 'prenom', 'family_id', 'genre', 'employment_status']);

        return self::buildFinancesDataForMembers($membres, $tribu->classe_id);
    }

    /**
     * Agrégation des cotisations individuelles payées/dues pour un ensemble de membres donné,
     * réutilisée pour une tribu précise ou pour toute la classe (cartes de statistiques).
     */
    public static function buildFinancesDataForMembers(Collection $membres, int $classeId): array
    {
        $memberIds = $membres->pluck('id');

        $cotisationsIndividuelles = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->where('target_scope', Cotisation::TARGET_SCOPE_INDIVIDUELLE)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->get();

        $cotisationTotal = (int) $cotisationsIndividuelles->sum('montant');

        $paiementsByMember = Paiement::query()
            ->select('user_id', DB::raw('SUM(montant) as total_paye'))
            ->whereIn('user_id', $memberIds)
            ->whereIn('cotisation_id', $cotisationsIndividuelles->pluck('id'))
            ->where('statut', Paiement::STATUT_PAYE)
            ->groupBy('user_id')
            ->pluck('total_paye', 'user_id');

        return $membres->map(function (User $membre) use ($paiementsByMember, $cotisationTotal) {
            $paid = (int) ($paiementsByMember[$membre->id] ?? 0);
            $due = max(0, $cotisationTotal - $paid);

            return [
                'id' => $membre->id,
                'nom' => trim(($membre->prenom ?? '') . ' ' . ($membre->nom ?? '')),
                'famille' => $membre->family?->nom ?? 'Sans famille',
                'cotisation' => $cotisationTotal,
                'totalPaye' => $paid,
                'totalDu' => $due,
                'statut' => $due === 0 ? 'A JOUR' : 'EN ATTENTE',
            ];
        })->values()->all();
    }

    private function authorizeTribu(User $user, Tribu $tribu): void
    {
        if ($tribu->classe_id !== $user->classe_id) {
            abort(403, 'Cette tribu n\'appartient pas à votre classe.');
        }
    }
}
