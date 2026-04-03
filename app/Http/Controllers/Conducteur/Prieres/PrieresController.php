<?php

namespace App\Http\Controllers\Conducteur\Prieres;

use App\Http\Controllers\Controller;
use App\Models\Priere;
use App\Support\PrierePresenter;
use App\Support\PriereTargeting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PrieresController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Prieres/Index', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
            'targeting' => $user ? PriereTargeting::availableTargetsForConductor($user) : null,
            'prayerRequests' => $user
                ? Priere::query()
                    ->with('requester')
                    ->where('user_id', $user->id)
                    ->latest()
                    ->get()
                    ->map(fn (Priere $request) => PrierePresenter::forOwner($request))
                    ->values()
                : [],
            'receivedPrayerRequests' => $user
                ? PriereTargeting::filterVisibleForUser(
                    Priere::query()
                        ->with('requester')
                        ->where('user_id', '!=', $user->id)
                        ->get()
                        ->sortByDesc('created_at')
                        ->values(),
                    $user,
                )
                    ->map(fn (Priere $request) => PrierePresenter::forRecipient($request, 'conducteur'))
                    ->values()
                : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $validated = $request->validate([
            'sujet' => ['required', 'string', 'max:40'],
            'demande' => ['required', 'string', 'max:5000'],
            'mode_identite' => ['required', 'in:anonymous,visible'],
            'nom_affiche' => ['nullable', 'string', 'max:255'],
            'type_cible' => ['required', 'string'],
            'user_cible_id' => ['nullable', 'integer'],
        ]);

        $isAnonymous = $validated['mode_identite'] === 'anonymous';
        $visibleName = $isAnonymous ? null : trim((string) ($validated['nom_affiche'] ?? ''));

        if (!$isAnonymous && $visibleName === '') {
            return back()->withErrors([
                'nom_affiche' => 'Le nom est requis lorsque vous choisissez de l afficher.',
            ]);
        }

        $destinations = PriereTargeting::buildDestinationsForConductor(
            $user,
            $validated['type_cible'],
            isset($validated['user_cible_id']) ? (int) $validated['user_cible_id'] : null,
        );

        DB::transaction(function () use ($user, $validated, $isAnonymous, $visibleName, $destinations) {
            $priere = Priere::create([
                'user_id' => $user->id,
                'classe_id' => $isAnonymous ? null : $user->classe_id,
                'role_soumission' => $user->role ?? 'conducteur',
                'sujet' => trim($validated['sujet']),
                'demande' => trim($validated['demande']),
                'est_anonyme' => $isAnonymous,
                'nom_affiche' => $visibleName,
                'statut' => 'Transmise',
            ]);

            $priere->setDestinataires($destinations);
            $priere->addHistorique(
                $user,
                'creation',
                'Priere creee et transmise vers ' . collect($priere->resolveDestinataireLabels())->join(', ') . '.',
                ['type_cible' => $validated['type_cible']],
            );
            $priere->save();
        });

        return back()->with('success', 'Votre demande de priere a ete enregistree.');
    }

    public function updateTestimony(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user && $priere->user_id === $user->id, 403);

        $validated = $request->validate([
            'temoignage' => ['required', 'string', 'max:5000'],
            'reply_to_comment_id' => ['nullable', 'integer'],
        ]);

        $priere->addCommentaire(
            $user,
            trim($validated['temoignage']),
            isset($validated['reply_to_comment_id']) ? (int) $validated['reply_to_comment_id'] : null,
        );
        $priere->addHistorique($user, 'temoignage', 'Un commentaire a ete ajoute par le conducteur.');
        $priere->save();

        return back()->with('success', 'Votre commentaire a ete ajoute.');
    }

    public function markFulfilled(Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user && $priere->user_id === $user->id, 403);

        if (count($priere->commentaires()) === 0) {
            return back()->with('error', 'Ajoutez d abord un commentaire avant de marquer cette priere comme exaucee.');
        }

        if ($priere->statut === 'Exaucement partage') {
            return back()->with('success', 'Cette priere est deja marquee comme exaucee.');
        }

        $priere->update([
            'statut' => 'Exaucement partage',
            'exaucee_le' => $priere->exaucee_le ?: now(),
        ]);

        $priere->addHistorique($user, 'exaucement', 'La priere a ete marquee comme exaucee par son auteur.');
        $priere->save();

        return back()->with('success', 'La priere a ete marquee comme exaucee.');
    }
}
