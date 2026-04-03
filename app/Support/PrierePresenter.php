<?php

namespace App\Support;

use App\Models\Priere;
use Carbon\Carbon;

class PrierePresenter
{
    public static function forOwner(Priere $request): array
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
            'createdAt' => self::formatPrayerCreatedAt($request->created_at),
            'comments' => self::formatComments($request),
            'direction' => 'sent',
            'canComment' => true,
            'canMarkFulfilled' => true,
            'targetLabel' => self::formatTargetLabel($request),
            'history' => self::formatHistory($request),
        ];
    }

    public static function forRecipient(Priere $request, string $viewerRole, ?int $viewerId = null): array
    {
        $requesterName = trim((string) optional($request->requester)->name);
        $status = $viewerRole === 'pasteur'
            ? self::normalizePastorStatus($request->statut)
            : ($request->statut ?: 'Nouvelle');
        $comments = self::formatComments($request, $viewerRole, $viewerId, $status);

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
                : self::formatSourceLabel($request->role_soumission),
            'status' => $status,
            'createdAt' => self::formatPrayerCreatedAt($request->created_at),
            'comments' => $comments,
            'testimony' => collect($comments)->last()['message'] ?? null,
            'direction' => 'received',
            'canComment' => $viewerRole === 'pasteur' && !in_array($status, ['Exaucement', 'Exaucement partage'], true),
            'canMarkFulfilled' => false,
            'targetLabel' => self::formatTargetLabel($request),
            'history' => self::formatHistory($request),
        ];
    }

    public static function formatPrayerCreatedAt($createdAt): ?string
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

    public static function formatReactions(array $reactions): array
    {
        $availableReactions = ['🙏', '❤️', '🙌', '😊', '🔥'];

        return collect($reactions)
            ->filter(fn ($reaction) => in_array($reaction['emoji'] ?? null, Priere::AVAILABLE_REACTIONS, true))
            ->groupBy('emoji')
            ->map(fn ($items, $emoji) => [
                'emoji' => $emoji,
                'count' => $items->count(),
            ])
            ->values()
            ->all();
    }

    public static function formatHistory(Priere $request): array
    {
        return collect($request->historiques())
            ->sortBy('created_at')
            ->values()
            ->map(fn (array $history) => [
                'id' => $history['id'] ?? null,
                'action' => $history['action'] ?? null,
                'description' => $history['description'] ?? null,
                'actorLabel' => $history['actor_label'] ?? 'Systeme',
                'createdAt' => self::formatEventAt($history['created_at'] ?? null),
            ])
            ->all();
    }

    public static function formatComments(Priere $request, ?string $viewerRole = null, ?int $viewerId = null, ?string $status = null): array
    {
        $allReactions = collect($request->reactions());

        return collect($request->commentaires())
            ->sortBy('created_at')
            ->values()
            ->map(function (array $comment, int $index) use ($allReactions, $request, $viewerRole, $viewerId, $status) {
                $commentId = (int) ($comment['id'] ?? ($index + 1));
                $commentReactions = $allReactions
                    ->filter(fn (array $reaction) => (int) ($reaction['comment_id'] ?? 0) === $commentId)
                    ->values()
                    ->all();

                return [
                    'id' => $commentId,
                    'message' => $comment['message'] ?? null,
                    'actorLabel' => self::resolveCommentActorLabel($request, $comment, $viewerRole),
                    'actorType' => self::resolveCommentActorType($request, $comment),
                    'createdAt' => self::formatEventAt($comment['created_at'] ?? null),
                    'replyTo' => self::formatCommentReplyReference($request, $comment, $viewerRole),
                    'reactions' => self::formatReactions($commentReactions),
                    'canReact' => $viewerRole === 'pasteur' && !in_array($status, ['Exaucement', 'Exaucement partage'], true),
                    'hasPastorReaction' => $viewerRole === 'pasteur'
                        && $viewerId !== null
                        && $request->pastorHasReactionForComment($commentId, $viewerId),
                ];
            })
            ->filter(fn (array $comment) => filled($comment['message']))
            ->all();
    }

    public static function formatTargetLabel(Priere $request): string
    {
        $labels = collect($request->resolveDestinataireLabels());

        if ($labels->isNotEmpty()) {
            return $labels->join(' , ');
        }

        return 'Destinataire non precise';
    }

    public static function formatSourceLabel(?string $role): string
    {
        return match ($role) {
            'conducteur' => 'Conducteur',
            'responsable_famille' => 'Responsable de famille',
            'membre_famille' => 'Membre de famille',
            default => 'Demande recue',
        };
    }

    public static function normalizePastorStatus(?string $status): string
    {
        return match ($status) {
            'Exaucement partage' => 'Exaucement',
            default => $status ?: 'Nouvelle',
        };
    }

    private static function resolveCommentActorLabel(Priere $request, array $comment, ?string $viewerRole): string
    {
        $defaultLabel = $comment['actor_label'] ?? 'Auteur';

        if ($viewerRole === null || !$request->est_anonyme) {
            return $defaultLabel;
        }

        if ((int) ($comment['actor_id'] ?? 0) === (int) $request->user_id) {
            return 'Anonyme';
        }

        return 'Pasteur';
    }

    private static function resolveCommentActorType(Priere $request, array $comment): string
    {
        if ((int) ($comment['actor_id'] ?? 0) === (int) $request->user_id) {
            return 'requester';
        }

        return ($comment['actor_role'] ?? null) === 'pasteur' ? 'pastor' : 'participant';
    }

    private static function formatCommentReplyReference(Priere $request, array $comment, ?string $viewerRole): ?array
    {
        $replyToId = (int) ($comment['reply_to_id'] ?? 0);

        if ($replyToId === 0) {
            return null;
        }

        $replyActorLabel = $comment['reply_to_actor_label'] ?? 'Commentaire';

        if ($request->est_anonyme && $viewerRole !== null) {
            $replyToComment = collect($request->commentaires())
                ->first(fn (array $item) => (int) ($item['id'] ?? 0) === $replyToId);

            if ((int) ($replyToComment['actor_id'] ?? 0) === (int) $request->user_id) {
                $replyActorLabel = 'Anonyme';
            } elseif ($replyToComment) {
                $replyActorLabel = 'Pasteur';
            }
        }

        return [
            'id' => $replyToId,
            'actorLabel' => $replyActorLabel,
            'message' => $comment['reply_to_message'] ?? null,
        ];
    }

    private static function formatEventAt($dateTime): ?string
    {
        if (!$dateTime) {
            return null;
        }

        $dateTime = $dateTime instanceof Carbon ? $dateTime : Carbon::parse($dateTime);

        return sprintf(
            'Le %s a %s',
            $dateTime->locale('fr')->translatedFormat('d F Y'),
            $dateTime->format('H:i'),
        );
    }
}
