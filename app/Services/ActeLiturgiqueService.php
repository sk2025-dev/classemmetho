<?php

namespace App\Services;

use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\ActeSubmittedToConducteur;
use App\Mail\ActeValidatedToPasteur;
use App\Mail\ActeCertificateReadyToResponsable;
use App\Mail\ActeRefusedToCreateur;
use App\Mail\ActeValidatedToCreateur;
use App\Mail\ActeDecisionToConducteur;
use InvalidArgumentException;

class ActeLiturgiqueService
{
    private const STATUTS = [
        'SOUMISE',
        'EN_ATTENTE_CONDUCTEUR',
        'TRANSMISE_AU_PASTEUR',
        'VALIDEE',
        'PUBLIEE',
        'CELEBRE',
        'TERMINE',
        'REFUSEE_PAR_CONDUCTEUR',
        'REFUSEE_PAR_PASTEUR',
        'ARCHIVEE',
    ];

    /**
     * Crée un acte et son entrée d'historique initiale.
     */
    public function create(array $data, User $actor): ActeLiturgique
    {
        $data['reference'] = $data['reference'] ?? $this->generateReference();
        $data['created_by'] = $data['created_by'] ?? $actor->id;
        $data['statut'] = $data['statut'] ?? 'SOUMISE';

        if (!in_array($data['statut'], self::STATUTS, true)) {
            throw new InvalidArgumentException('Statut initial invalide.');
        }

        // duplicate prevention at service level as well in case other callers
        if (!empty($data['membre_id']) && !empty($data['type_acte'])) {
            $exists = ActeLiturgique::query()
                ->where('membre_id', $data['membre_id'])
                ->where('type_acte', $data['type_acte'])
                ->where('statut', '!=', 'ARCHIVEE')
                ->exists();
            if ($exists) {
                throw new InvalidArgumentException('Demande deja en cours pour ce membre et ce type.');
            }
        }

        return DB::transaction(function () use ($data, $actor) {
            $acte = ActeLiturgique::create($data);

            ActeLiturgiqueHistorique::create([
                'acte_id' => $acte->id,
                'statut_precedent' => null,
                'statut_nouveau' => $acte->statut,
                'acteur_id' => $actor->id,
                'commentaire' => 'Création de la demande',
            ]);

            // notify conducteurs for this class
            if (!empty($acte->classe_id)) {
                $conducteurs = User::query()
                    ->where('role', 'conducteur')
                    ->where('classe_id', $acte->classe_id)
                    ->whereNotNull('email')
                    ->get();
                foreach ($conducteurs as $cond) {
                    Mail::to($cond->email)->queue(new ActeSubmittedToConducteur($acte));
                    // create an in-app notification for the conducteur
                    try {
                        Notification::create([
                            'user_id' => $cond->id,
                            'channel' => 'in_app',
                            'to' => $cond->email,
                            'subject' => 'Nouvelle demande',
                            'body' => "Nouvelle demande de {$acte->createur?->prenom} {$acte->createur?->nom} (Réf {$acte->reference})",
                            'data' => ['link' => config('app.url') . ($acte->isAnnonce() ? '/conducteur/annonces/' . $acte->id : '/conducteur/liturgie/' . $acte->id)],
                            'sent_at' => now(),
                        ]);
                    } catch (\Exception $e) {
                        // swallow so notification failure doesn't break flow
                    }
                }
            }

            return $acte;
        });
    }

    /**
     * Transitionne le statut de l'acte en appliquant les règles de workflow.
     */
    public function transitionStatut(
        ActeLiturgique $acte,
        string $newStatus,
        User $actor,
        ?string $commentaire = null
    ): ActeLiturgique {
        if (!in_array($newStatus, self::STATUTS, true)) {
            throw new InvalidArgumentException('Nouveau statut invalide.');
        }

        $currentStatus = $acte->statut;
        $role = $actor->role;

        if (!$this->canTransition($currentStatus, $newStatus, $role)) {
            throw new InvalidArgumentException("Transition interdite: {$currentStatus} -> {$newStatus} ({$role})");
        }

        $acte = DB::transaction(function () use ($acte, $newStatus, $actor, $commentaire, $currentStatus) {
            $update = ['statut' => $newStatus];

            if ($actor->role === 'conducteur') {
                $update['conducteur_id'] = $actor->id;
                if ($commentaire !== null && trim((string) $commentaire) !== '') {
                    $update['note_conducteur'] = $commentaire;
                }
            }

            if ($actor->role === 'pasteur') {
                $update['pasteur_id'] = $actor->id;
                if ($commentaire !== null && trim((string) $commentaire) !== '') {
                    $update['note_pastorale'] = $commentaire;
                }
            }

            $acte->update($update);

            ActeLiturgiqueHistorique::create([
                'acte_id' => $acte->id,
                'statut_precedent' => $currentStatus,
                'statut_nouveau' => $newStatus,
                'acteur_id' => $actor->id,
                'commentaire' => $commentaire,
            ]);

            // Automatiser la publication des annonces validées
            if ($newStatus === 'VALIDEE' && $acte->isAnnonce()) {
                $acte->update([
                    'statut' => 'PUBLIEE',
                    'date_publication' => now(),
                    'publiee_par' => $actor->id,
                ]);

                ActeLiturgiqueHistorique::create([
                    'acte_id' => $acte->id,
                    'statut_precedent' => 'VALIDEE',
                    'statut_nouveau' => 'PUBLIEE',
                    'acteur_id' => $actor->id,
                    'commentaire' => 'Publication automatique après validation',
                ]);
            }

            return $acte->fresh();
        });

        // notifications outside transaction
        // pasteur email when conducteur transmits
        if ($actor->role === 'conducteur' && $newStatus === 'TRANSMISE_AU_PASTEUR') {
            $pasteurs = User::query()
                ->where('role', 'pasteur')
                ->where('classe_id', $acte->classe_id)
                ->whereNotNull('email')
                ->get();
            foreach ($pasteurs as $p) {
                Mail::to($p->email)->queue(new ActeValidatedToPasteur($acte));
                try {
                    Notification::create([
                        'user_id' => $p->id,
                        'channel' => 'in_app',
                        'to' => $p->email,
                        'subject' => 'Demande transmise',
                        'body' => "Une demande a été transmise par {$acte->createur?->prenom} {$acte->createur?->nom} (Réf {$acte->reference})",
                        'data' => ['link' => config('app.url') . ($acte->isAnnonce() ? '/pasteur/annonces/' . $acte->id : '/pasteur/liturgie/' . $acte->id)],
                        'sent_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // ignore notification errors
                }
            }
        }

        // email au créateur quand refus conducteur ou pasteur
        if (in_array($newStatus, ['REFUSEE_PAR_CONDUCTEUR', 'REFUSEE_PAR_PASTEUR'], true)) {
            $owner = $acte->createur;
            if ($owner && $owner->email) {
                $refusePar = $newStatus === 'REFUSEE_PAR_CONDUCTEUR' ? 'conducteur' : 'pasteur';
                Mail::to($owner->email)->queue(new ActeRefusedToCreateur($acte, $refusePar));
                try {
                    Notification::create([
                        'user_id' => $owner->id,
                        'channel' => 'in_app',
                        'to'      => $owner->email,
                        'subject' => 'Votre demande a été refusée',
                        'body'    => "Votre demande (Réf {$acte->reference}) a été refusée par le {$refusePar}.",
                        'data'    => ['link' => config('app.url') . '/membre-famille/liturgie'],
                        'sent_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // ignore
                }
            }
        }

        // email au créateur quand le pasteur valide (VALIDEE)
        if ($actor->role === 'pasteur' && $newStatus === 'VALIDEE') {
            $owner = $acte->createur;
            if ($owner && $owner->email) {
                Mail::to($owner->email)->queue(new ActeValidatedToCreateur($acte));
                try {
                    Notification::create([
                        'user_id' => $owner->id,
                        'channel' => 'in_app',
                        'to'      => $owner->email,
                        'subject' => 'Votre demande a été validée',
                        'body'    => "Votre demande (Réf {$acte->reference}) a été validée par le pasteur.",
                        'data'    => ['link' => config('app.url') . '/membre-famille/liturgie'],
                        'sent_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // ignore
                }
            }
        }

        // email au conducteur quand le pasteur valide ou refuse
        if ($actor->role === 'pasteur' && in_array($newStatus, ['VALIDEE', 'REFUSEE_PAR_PASTEUR'], true)) {
            $conducteurs = User::query()
                ->where('role', 'conducteur')
                ->where('classe_id', $acte->classe_id)
                ->whereNotNull('email')
                ->get();
            $decision = $newStatus === 'VALIDEE' ? 'validee' : 'refusee';
            foreach ($conducteurs as $cond) {
                Mail::to($cond->email)->queue(new ActeDecisionToConducteur($acte, $decision));
                try {
                    $label = $decision === 'validee' ? 'validée' : 'refusée';
                    Notification::create([
                        'user_id' => $cond->id,
                        'channel' => 'in_app',
                        'to'      => $cond->email,
                        'subject' => "Décision pastorale : demande {$label}",
                        'body'    => "La demande (Réf {$acte->reference}) de {$acte->createur?->prenom} {$acte->createur?->nom} a été {$label} par le pasteur.",
                        'data'    => ['link' => config('app.url') . '/conducteur/liturgie'],
                        'sent_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // ignore
                }
            }
        }

        // responsable family email when acte celebrated or finished
        if (in_array($newStatus, ['CELEBRE', 'TERMINE'], true)) {
            $owner = $acte->createur;
            if ($owner && $owner->email) {
                Mail::to($owner->email)->queue(new ActeCertificateReadyToResponsable($acte));
                try {
                    Notification::create([
                        'user_id' => $owner->id,
                        'channel' => 'in_app',
                        'to' => $owner->email,
                        'subject' => 'Votre demande est prête',
                        'body' => "Votre demande (Réf {$acte->reference}) est prête. Cliquez pour voir la fiche.",
                        'data' => ['link' => config('app.url') . '/responsable/liturgie/' . $acte->id],
                        'sent_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // ignore
                }
            }
        }

        return $acte;
    }

    /**
     * Vérifie les transitions autorisées selon le rôle.
     */
    public function canTransition(string $from, string $to, string $role): bool
    {
        $map = [
            'membre_famille' => [
                'SOUMISE' => [],
                'EN_ATTENTE_CONDUCTEUR' => [],
                'TRANSMISE_AU_PASTEUR' => [],
                'VALIDEE' => [],
                'REFUSEE_PAR_CONDUCTEUR' => [],
                'REFUSEE_PAR_PASTEUR' => [],
                'ARCHIVEE' => [],
            ],
            'responsable_famille' => [
                'SOUMISE' => [],
                'EN_ATTENTE_CONDUCTEUR' => [],
                'TRANSMISE_AU_PASTEUR' => [],
                'VALIDEE' => [],
                'REFUSEE_PAR_CONDUCTEUR' => [],
                'REFUSEE_PAR_PASTEUR' => [],
                'ARCHIVEE' => [],
            ],
            'conducteur' => [
                'SOUMISE' => ['EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'REFUSEE_PAR_CONDUCTEUR'],
                'EN_ATTENTE_CONDUCTEUR' => ['TRANSMISE_AU_PASTEUR', 'REFUSEE_PAR_CONDUCTEUR'],
                'TRANSMISE_AU_PASTEUR' => [],
                'VALIDEE' => [],
                'REFUSEE_PAR_CONDUCTEUR' => [],
                'REFUSEE_PAR_PASTEUR' => [],
                'ARCHIVEE' => [],
            ],
            'pasteur' => [
                'SOUMISE' => [],
                'EN_ATTENTE_CONDUCTEUR' => [],
                'TRANSMISE_AU_PASTEUR' => ['VALIDEE', 'REFUSEE_PAR_PASTEUR'],
                'VALIDEE' => ['PUBLIEE', 'CELEBRE', 'TERMINE', 'ARCHIVEE'],
                'PUBLIEE' => ['ARCHIVEE'],
                'CELEBRE' => ['ARCHIVEE'],
                'TERMINE' => ['ARCHIVEE'],
                'REFUSEE_PAR_CONDUCTEUR' => [],
                'REFUSEE_PAR_PASTEUR' => [],
                'ARCHIVEE' => [],
            ],
            'admin' => [
                'SOUMISE' => ['EN_ATTENTE_CONDUCTEUR', 'TRANSMISE_AU_PASTEUR', 'REFUSEE_PAR_CONDUCTEUR'],
                'EN_ATTENTE_CONDUCTEUR' => ['TRANSMISE_AU_PASTEUR', 'REFUSEE_PAR_CONDUCTEUR'],
                'TRANSMISE_AU_PASTEUR' => ['VALIDEE', 'REFUSEE_PAR_PASTEUR'],
                'VALIDEE' => ['PUBLIEE', 'CELEBRE', 'TERMINE', 'ARCHIVEE'],
                'PUBLIEE' => ['ARCHIVEE'],
                'CELEBRE' => ['ARCHIVEE'],
                'TERMINE' => ['ARCHIVEE'],
                'REFUSEE_PAR_CONDUCTEUR' => [],
                'REFUSEE_PAR_PASTEUR' => [],
                'ARCHIVEE' => [],
            ],
        ];

        return in_array($to, $map[$role][$from] ?? [], true);
    }

    /**
     * Génère une référence lisible du type ACT-20260223-123456.
     */
    public function generateReference(): string
    {
        return 'ACT-' . now()->format('Ymd-His') . '-' . random_int(100, 999);
    }
}
