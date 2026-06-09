<?php

namespace App\Http\Controllers\BureauConducteur\Prieres;

use App\Http\Controllers\Controller;
use App\Models\Priere;
use App\Support\PrierePresenter;
use App\Support\PriereTargeting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PrieresController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('BureauConducteur/Prieres/Index', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
            'prayerRequests' => PriereTargeting::filterVisibleForUser(
                Priere::query()->with('requester')->latest()->get(),
                $user,
            )
                ->map(fn (Priere $request) => PrierePresenter::forRecipient($request, 'bureau_conducteur', $user?->id))
                ->values(),
        ]);
    }

    public function updateStatus(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);
        abort_unless($this->canAccessPrayer($priere, $user), 403);

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
        }

        $priere->update($updates);
        $priere->addHistorique($user, 'statut', 'Le statut de la priere a ete mis a jour vers ' . $status . '.', ['statut' => $status]);
        $priere->save();

        return back()->with('success', 'Le statut de la demande a ete mis a jour.');
    }

    public function addComment(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);
        abort_unless($this->canAccessPrayer($priere, $user), 403);

        if (in_array($priere->statut, ['Exaucement', 'Exaucement partage'], true)) {
            return back()->with('error', 'Les commentaires sont fermes une fois la priere exaucee.');
        }

        $validated = $request->validate([
            'commentaire' => ['required', 'string', 'max:5000'],
            'reply_to_comment_id' => ['nullable', 'integer'],
        ]);

        $priere->addCommentaire(
            $user,
            trim($validated['commentaire']),
            isset($validated['reply_to_comment_id']) ? (int) $validated['reply_to_comment_id'] : null,
        );
        $priere->addHistorique($user, 'commentaire_pasteur', 'Un commentaire a ete ajoute par le bureau des conducteurs.');
        $priere->save();

        return back()->with('success', 'Le commentaire a ete ajoute.');
    }

    public function toggleReaction(Request $request, Priere $priere): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);
        abort_unless($this->canAccessPrayer($priere, $user), 403);

        $validated = $request->validate([
            'comment_id' => ['required', 'integer'],
            'emoji' => ['required', 'string', 'in:' . implode(',', Priere::AVAILABLE_REACTIONS)],
        ]);

        if (in_array($priere->statut, ['Exaucement', 'Exaucement partage'], true)) {
            return back()->with('error', 'Les reactions sont fermees une fois la priere exaucee.');
        }

        $commentId = (int) $validated['comment_id'];
        $emoji = $validated['emoji'];
        $commentExists = collect($priere->commentaires())
            ->contains(fn (array $comment) => (int) ($comment['id'] ?? 0) === $commentId);

        if (!$commentExists) {
            return back()->with('error', 'Le commentaire cible est introuvable.');
        }

        if (!$priere->addReactionToComment($commentId, (int) $user->id, $emoji)) {
            return back()->with('error', 'Vous avez deja reagit a ce commentaire.');
        }

        $priere->save();

        return back();
    }

    private function canAccessPrayer(Priere $priere, $user): bool
    {
        return PriereTargeting::filterVisibleForUser(collect([$priere]), $user)->isNotEmpty();
    }
}
