<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\Priere;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PrieresController extends Controller
{
    private const AVAILABLE_REACTIONS = ['🙏', '❤️', '🙌', '😊', '🔥'];

    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('MembreFamille/Prieres/Index', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
            'prayerRequests' => $user
                ? Priere::query()
                    ->where('user_id', $user->id)
                    ->latest()
                    ->get()
                    ->map(fn (Priere $request) => $this->transformOwnerRequest($request))
                    ->values()
                : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $validated = $request->validate([
            'sujet' => ['required', 'string', 'max:255'],
            'demande' => ['required', 'string', 'max:5000'],
            'mode_identite' => ['required', 'in:anonymous,visible'],
            'nom_affiche' => ['nullable', 'string', 'max:255'],
        ]);

        $isAnonymous = $validated['mode_identite'] === 'anonymous';
        $visibleName = $isAnonymous ? null : trim((string) ($validated['nom_affiche'] ?? ''));

        if (!$isAnonymous && $visibleName === '') {
            return back()->withErrors([
                'nom_affiche' => 'Le nom est requis lorsque vous choisissez de l afficher.',
            ]);
        }

        Priere::create([
            'user_id' => $user->id,
            'classe_id' => $isAnonymous ? null : $user->classe_id,
            'role_soumission' => $user->role ?? 'membre_famille',
            'sujet' => trim($validated['sujet']),
            'demande' => trim($validated['demande']),
            'est_anonyme' => $isAnonymous,
            'nom_affiche' => $visibleName,
            'statut' => 'Nouvelle',
        ]);

        return back()->with('success', 'Votre demande de priere a ete enregistree.');
    }

    public function updateTestimony(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user && $priere->user_id === $user->id, 403);

        if ($priere->temoignage) {
            return back()->with('error', 'Un seul commentaire est autorise pour cette priere.');
        }

        $validated = $request->validate([
            'temoignage' => ['required', 'string', 'max:5000'],
        ]);

        $priere->update([
            'temoignage' => trim($validated['temoignage']),
        ]);

        return back()->with('success', 'Votre commentaire a ete ajoute.');
    }

    public function markFulfilled(Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user && $priere->user_id === $user->id, 403);

        if (!$priere->temoignage) {
            return back()->with('error', 'Ajoutez d abord un commentaire avant de marquer cette priere comme exaucee.');
        }

        if ($priere->statut === 'Exaucement partage') {
            return back()->with('success', 'Cette priere est deja marquee comme exaucee.');
        }

        $priere->update([
            'statut' => 'Exaucement partage',
            'exaucee_le' => $priere->exaucee_le ?: now(),
        ]);

        return back()->with('success', 'La priere a ete marquee comme exaucee.');
    }

    private function transformOwnerRequest(Priere $request): array
    {
        return [
            'id' => $request->id,
            'subject' => $request->sujet,
            'message' => $request->demande,
            'isAnonymous' => (bool) $request->est_anonyme,
            'authorLabel' => $request->est_anonyme
                ? 'Anonyme'
                : ($request->nom_affiche ?: 'Nom visible'),
            'status' => $request->statut,
            'createdAt' => $this->formatPrayerCreatedAt($request->created_at),
            'comments' => $request->temoignage ? [[
                'message' => $request->temoignage,
                'reactions' => $this->formatReactions($request->reactions_emoji ?? []),
            ]] : [],
        ];
    }

    private function formatPrayerCreatedAt($createdAt): ?string
    {
        if (!$createdAt) {
            return null;
        }

        return sprintf(
            'Cree le %s a %s',
            $createdAt->locale('fr')->translatedFormat('d F Y'),
            $createdAt->format('H:i'),
        );
    }

    private function formatReactions(array $reactions): array
    {
        return collect($reactions)
            ->filter(fn ($reaction) => in_array($reaction['emoji'] ?? null, self::AVAILABLE_REACTIONS, true))
            ->groupBy('emoji')
            ->map(fn ($items, $emoji) => [
                'emoji' => $emoji,
                'count' => $items->count(),
            ])
            ->values()
            ->all();
    }
}
