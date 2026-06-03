<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Priere extends Model
{
    use HasFactory;

    public const AVAILABLE_REACTIONS = ['🙏', '❤️', '🙌', '😊', '🔥'];

    public const TYPE_ALL_PASTEURS = 'all_pasteurs';
    public const TYPE_SPECIFIC_PASTEUR = 'specific_pasteur';
    public const TYPE_ALL_CONDUCTEURS_CLASSE = 'all_conducteurs_classe';
    public const TYPE_SPECIFIC_CONDUCTEUR_CLASSE = 'specific_conducteur_classe';
    public const TYPE_SPECIFIC_MEMBRE_CLASSE = 'specific_membre_classe';

    protected $table = 'prieres';

    protected $fillable = [
        'user_id',
        'classe_id',
        'role_soumission',
        'sujet',
        'demande',
        'est_anonyme',
        'nom_affiche',
        'statut',
        'temoignage',
        'commentaires_data',
        'destinataires_data',
        'historiques_data',
        'reactions_emoji',
        'vue_le',
        'prise_en_priere_le',
        'exaucee_le',
        'vue_par_pasteur_id',
        'prise_en_priere_par_pasteur_id',
        'exaucee_par_pasteur_id',
    ];

    protected $casts = [
        'est_anonyme' => 'boolean',
        'commentaires_data' => 'array',
        'destinataires_data' => 'array',
        'historiques_data' => 'array',
        'reactions_emoji' => 'array',
        'vue_le' => 'datetime',
        'prise_en_priere_le' => 'datetime',
        'exaucee_le' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function viewedByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vue_par_pasteur_id');
    }

    public function prayedByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prise_en_priere_par_pasteur_id');
    }

    public function fulfilledByPastor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'exaucee_par_pasteur_id');
    }

    public function setDestinataires(array $destinataires): void
    {
        $this->destinataires_data = array_values($destinataires);
    }

    public function destinataires(): array
    {
        return $this->destinataires_data ?? [];
    }

    public function addHistorique(?User $acteur, string $action, string $description, array $meta = []): void
    {
        $historiques = $this->historiques();
        $historiques[] = [
            'id' => count($historiques) + 1,
            'action' => $action,
            'description' => $description,
            'actor_id' => $acteur?->id,
            'actor_label' => trim((string) $acteur?->name) ?: 'Systeme',
            'meta' => $meta,
            'created_at' => now()->toISOString(),
        ];

        $this->historiques_data = $historiques;
    }

    public function historiques(): array
    {
        return $this->historiques_data ?? [];
    }

    public function commentaires(): array
    {
        $commentaires = $this->commentaires_data ?? [];

        if (!empty($commentaires)) {
            return $commentaires;
        }

        if ($this->temoignage) {
            return [[
                'id' => 1,
                'message' => $this->temoignage,
                'actor_id' => $this->user_id,
                'actor_label' => trim((string) optional($this->requester)->name) ?: 'Auteur',
                'created_at' => optional($this->updated_at ?: $this->created_at)?->toISOString(),
            ]];
        }

        return [];
    }

    public function addCommentaire(?User $acteur, string $message, ?int $replyToCommentId = null): void
    {
        $commentaires = $this->commentaires();
        $replyToComment = $replyToCommentId
            ? collect($commentaires)->first(fn (array $comment) => (int) ($comment['id'] ?? 0) === $replyToCommentId)
            : null;

        $commentaires[] = [
            'id' => count($commentaires) + 1,
            'message' => $message,
            'actor_id' => $acteur?->id,
            'actor_label' => trim((string) $acteur?->name) ?: 'Auteur',
            'actor_role' => $acteur?->role,
            'reply_to_id' => $replyToComment ? (int) ($replyToComment['id'] ?? 0) : null,
            'reply_to_actor_label' => $replyToComment['actor_label'] ?? null,
            'reply_to_message' => isset($replyToComment['message'])
                ? mb_substr((string) $replyToComment['message'], 0, 140)
                : null,
            'created_at' => now()->toISOString(),
        ];

        $this->commentaires_data = $commentaires;
        $this->temoignage = null;
    }

    public function reactions(): array
    {
        $lastCommentId = collect($this->commentaires())->last()['id'] ?? null;

        return collect($this->reactions_emoji ?? [])
            ->filter(fn ($reaction) => in_array($reaction['emoji'] ?? null, self::AVAILABLE_REACTIONS, true))
            ->map(function (array $reaction) use ($lastCommentId) {
                if (!isset($reaction['comment_id']) && $lastCommentId !== null) {
                    $reaction['comment_id'] = (int) $lastCommentId;
                }

                return $reaction;
            })
            ->values()
            ->all();
    }

    public function pastorHasReactionForComment(int $commentId, int $pastorId): bool
    {
        return collect($this->reactions())
            ->contains(fn (array $reaction) =>
                (int) ($reaction['comment_id'] ?? 0) === $commentId
                && (int) ($reaction['pasteur_id'] ?? 0) === $pastorId
            );
    }

    public function addReactionToComment(int $commentId, int $pastorId, string $emoji): bool
    {
        $reactions = collect($this->reactions());

        if ($reactions->contains(fn (array $reaction) =>
            (int) ($reaction['comment_id'] ?? 0) === $commentId
            && (int) ($reaction['pasteur_id'] ?? 0) === $pastorId
        )) {
            return false;
        }

        $reactions->push([
            'comment_id' => $commentId,
            'emoji' => $emoji,
            'pasteur_id' => $pastorId,
        ]);

        $this->reactions_emoji = $reactions->values()->all();

        return true;
    }

    public function resolveDestinataireLabels(): array
    {
        return collect($this->destinataires())
            ->map(function (array $destination) {
                return match ($destination['type_cible'] ?? null) {
                    self::TYPE_ALL_PASTEURS => 'Tous les pasteurs',
                    self::TYPE_SPECIFIC_PASTEUR => 'Pasteur: ' . ($destination['user_label'] ?? 'Inconnu'),
                    self::TYPE_ALL_CONDUCTEURS_CLASSE => 'Tous les conducteurs de la classe',
                    self::TYPE_SPECIFIC_CONDUCTEUR_CLASSE => 'Conducteur: ' . ($destination['user_label'] ?? 'Inconnu'),
                    self::TYPE_SPECIFIC_MEMBRE_CLASSE => 'Membre: ' . ($destination['user_label'] ?? 'Inconnu'),
                    default => 'Destinataire',
                };
            })
            ->filter()
            ->values()
            ->all();
    }
}
