<?php

namespace App\Http\Controllers\Pasteur;

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

        return Inertia::render('Pasteur/Prieres/Index', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
            'prayerRequests' => Priere::query()
                ->with('requester')
                ->latest()
                ->get()
                ->map(fn (Priere $request) => $this->transformPastorRequest($request))
                ->values(),
        ]);
    }

    public function updateStatus(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $validated = $request->validate([
            'statut' => ['required', 'in:Vu,En priere'],
        ]);

        $status = $validated['statut'];

        $updates = ['statut' => $status];

        if ($status === 'Vu') {
            $updates['vue_le'] = now();
            $updates['vue_par_pasteur_id'] = $user->id;
        } elseif ($status === 'En priere') {
            $updates['vue_le'] = $priere->vue_le ?: now();
            $updates['vue_par_pasteur_id'] = $priere->vue_par_pasteur_id ?: $user->id;
            $updates['prise_en_priere_le'] = now();
            $updates['prise_en_priere_par_pasteur_id'] = $user->id;
        } elseif ($status === 'Exaucement') {
            $updates['vue_le'] = $priere->vue_le ?: now();
            $updates['vue_par_pasteur_id'] = $priere->vue_par_pasteur_id ?: $user->id;
            $updates['exaucee_le'] = now();
            $updates['exaucee_par_pasteur_id'] = $user->id;
        }

        $priere->update($updates);

        return back()->with('success', 'Le statut de la demande a ete mis a jour.');
    }

    public function markFulfilled(Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $priere->update([
            'statut' => 'Exaucement',
            'vue_le' => $priere->vue_le ?: now(),
            'vue_par_pasteur_id' => $priere->vue_par_pasteur_id ?: $user->id,
            'exaucee_le' => now(),
            'exaucee_par_pasteur_id' => $user->id,
        ]);

        return back()->with('success', 'La priere a ete marquee comme exaucee.');
    }

    public function toggleReaction(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $validated = $request->validate([
            'emoji' => ['required', 'string', 'in:' . implode(',', self::AVAILABLE_REACTIONS)],
        ]);

        $emoji = $validated['emoji'];
        $reactions = collect($priere->reactions_emoji ?? []);

        $existingIndex = $reactions->search(
            fn ($reaction) => ($reaction['emoji'] ?? null) === $emoji
                && (int) ($reaction['pasteur_id'] ?? 0) === (int) $user->id
        );

        if ($existingIndex !== false) {
            $reactions->forget($existingIndex);
        } else {
            $reactions->push([
                'emoji' => $emoji,
                'pasteur_id' => $user->id,
            ]);
        }

        $priere->update([
            'reactions_emoji' => $reactions->values()->all(),
        ]);

        return back();
    }

    private function transformPastorRequest(Priere $request): array
    {
        $requesterName = trim((string) optional($request->requester)->name);
        $status = $this->normalizePastorStatus($request->statut);

        return [
            'id' => $request->id,
            'subject' => $request->sujet,
            'message' => $request->demande,
            'authorLabel' => $request->est_anonyme
                ? 'Anonyme'
                : ($request->nom_affiche ?: ($requesterName ?: 'Nom visible')),
            'isAnonymous' => (bool) $request->est_anonyme,
            'sourceLabel' => $request->est_anonyme
                ? null
                : $this->formatSourceLabel($request->role_soumission),
            'status' => $status,
            'createdAt' => $this->formatPrayerCreatedAt($request->created_at),
            'testimony' => $request->temoignage,
            'reactions' => $this->formatReactions($request->reactions_emoji ?? []),
        ];
    }

    private function normalizePastorStatus(?string $status): string
    {
        return match ($status) {
            'Exaucement partage' => 'Exaucement',
            default => $status ?: 'Nouvelle',
        };
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

    private function formatSourceLabel(?string $role): string
    {
        return match ($role) {
            'conducteur' => 'Conducteur',
            'responsable_famille' => 'Responsable de famille',
            'membre_famille' => 'Membre de famille',
            default => 'Demande recue',
        };
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
