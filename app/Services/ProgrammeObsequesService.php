<?php

namespace App\Services;

use App\Models\ActeLiturgique;
use App\Models\User;

/**
 * Gère le "programme d'obsèques" structuré rattaché à une annonce de décès.
 *
 * Le programme vit entièrement dans `actes_liturgiques.details` (cast array) :
 *  - `programme_evenements` : liste de lignes
 *      { date_debut, date_fin|null, heure|null, libelle, lieu|null }
 *      Une ligne avec `date_fin` = intervalle "du … au …" (même libellé / heure).
 *  - `programme_statut`      : OUVERT | CLOS (absent ⇒ OUVERT)
 *  - `programme_maj_at`      : ISO, à chaque écriture famille
 *  - `programme_clos_*`      : traçabilité de la clôture par le conducteur
 *
 * Aucune migration : c'est un sous-objet JSON, calqué sur le sous-workflow
 * `ceremonie_*` du mariage.
 */
class ProgrammeObsequesService
{
    public const STATUT_OUVERT = 'OUVERT';
    public const STATUT_CLOS = 'CLOS';

    public const STATUTS_ACTE_BLOQUANTS = [
        'REFUSEE_PAR_CONDUCTEUR',
        'REFUSEE_PAR_PASTEUR',
        'ARCHIVEE',
    ];

    /**
     * Règles de validation réutilisables pour un tableau de lignes de programme.
     * `$prefix` = clé racine ("programme_evenements" en JSON body, ou
     * "details.programme_evenements" à la création).
     *
     * @return array<string, mixed>
     */
    public function rules(string $prefix = 'programme_evenements'): array
    {
        return [
            $prefix => ['sometimes', 'array'],
            "{$prefix}.*.date_debut" => ['required_with:' . $prefix . '.*', 'date'],
            "{$prefix}.*.date_fin" => ['nullable', 'date', 'after_or_equal:' . $prefix . '.*.date_debut'],
            "{$prefix}.*.heure" => ['nullable', 'date_format:H:i'],
            "{$prefix}.*.heure_fin" => ['nullable', 'date_format:H:i'],
            "{$prefix}.*.libelle" => ['required_with:' . $prefix . '.*', 'string', 'max:255'],
            "{$prefix}.*.lieu" => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(string $prefix = 'programme_evenements'): array
    {
        return [
            "{$prefix}.*.date_debut.required_with" => 'La date est obligatoire pour chaque étape du programme.',
            "{$prefix}.*.date_debut.date" => 'La date de début est invalide.',
            "{$prefix}.*.date_fin.after_or_equal" => 'La date de fin doit être postérieure ou égale à la date de début.',
            "{$prefix}.*.heure.date_format" => "L'heure doit être au format HH:MM.",
            "{$prefix}.*.heure_fin.date_format" => "L'heure de fin doit être au format HH:MM.",
            "{$prefix}.*.libelle.required_with" => 'La désignation est obligatoire pour chaque étape du programme.',
            "{$prefix}.*.libelle.max" => 'La désignation ne peut dépasser 255 caractères.',
            "{$prefix}.*.lieu.max" => 'Le lieu ne peut dépasser 500 caractères.',
        ];
    }

    /**
     * Nettoie un tableau de lignes brutes :
     *  - trim des chaînes ;
     *  - suppression des lignes vides (ni date_debut ni libelle) ;
     *  - `date_fin` / `heure` / `lieu` vides → null ;
     *  - `date_fin` égale à `date_debut` → null (ce n'est plus un intervalle) ;
     *  - ré-indexation.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    public function normalize(array $rows): array
    {
        $clean = [];

        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            $dateDebut = $this->trimOrNull($row['date_debut'] ?? null);
            $dateFin = $this->trimOrNull($row['date_fin'] ?? null);
            $heure = $this->normalizeHeure($row['heure'] ?? null);
            $heureFin = $this->normalizeHeure($row['heure_fin'] ?? null);
            $libelle = $this->trimOrNull($row['libelle'] ?? null);
            $lieu = $this->trimOrNull($row['lieu'] ?? null);

            if ($dateDebut === null && $libelle === null) {
                continue; // ligne totalement vide
            }

            if ($dateFin !== null && $dateFin === $dateDebut) {
                $dateFin = null;
            }

            $clean[] = [
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'heure' => $heure,
                'heure_fin' => $heureFin,
                'libelle' => $libelle,
                'lieu' => $lieu,
            ];
        }

        return array_values($clean);
    }

    /**
     * Applique un nouveau programme à l'acte (édition famille / conducteur).
     */
    public function apply(ActeLiturgique $acte, array $rows): ActeLiturgique
    {
        $clean = $this->normalize($rows);

        $details = (array) ($acte->details ?? []);
        $details['programme_evenements'] = $clean;
        $details['programme_obseques'] = $clean !== []
            ? 'oui'
            : ($details['programme_obseques'] ?? 'non');
        $details['programme_statut'] = self::STATUT_OUVERT;
        $details['programme_maj_at'] = now()->toISOString();

        $acte->update(['details' => $details]);

        return $acte->fresh(['membre', 'classe', 'historiques.acteur']);
    }

    /**
     * Clôture ou ré-ouvre le programme (action du conducteur / président).
     *
     * @param  'CLOTURER'|'REOUVRIR'  $action
     */
    public function cloture(ActeLiturgique $acte, User $by, string $action, ?string $commentaire = null): ActeLiturgique
    {
        $details = (array) ($acte->details ?? []);
        $acteurNom = trim(($by->prenom ?? '') . ' ' . ($by->nom ?? '')) ?: ($by->email ?? 'Conducteur');

        if ($action === 'CLOTURER') {
            $details['programme_statut'] = self::STATUT_CLOS;
            $details['programme_clos_at'] = now()->toISOString();
            $details['programme_clos_par_id'] = $by->id;
            $details['programme_clos_par_nom'] = $acteurNom;
        } else {
            $details['programme_statut'] = self::STATUT_OUVERT;
            $details['programme_clos_at'] = null;
            $details['programme_clos_par_id'] = null;
            $details['programme_clos_par_nom'] = null;
            $details['programme_reouvert_at'] = now()->toISOString();
        }

        if ($commentaire !== null && trim($commentaire) !== '') {
            $details['programme_commentaire_conducteur'] = trim($commentaire);
        }

        $acte->update([
            'details' => $details,
            'conducteur_id' => $acte->conducteur_id ?: $by->id,
        ]);

        $this->logHistorique($acte, $by, $action, $commentaire);

        return $acte->fresh(['membre', 'classe', 'historiques.acteur']);
    }

    private function logHistorique(ActeLiturgique $acte, User $by, string $action, ?string $commentaire): void
    {
        try {
            $libelle = $action === 'CLOTURER'
                ? "Programme d'obsèques clôturé"
                : "Programme d'obsèques ré-ouvert";
            $note = $commentaire && trim($commentaire) !== '' ? ' — ' . trim($commentaire) : '';

            $acte->historiques()->create([
                'statut_precedent' => $acte->statut,
                'statut_nouveau' => $acte->statut,
                'commentaire' => $libelle . $note,
                'acteur_id' => $by->id,
            ]);
        } catch (\Throwable) {
            // L'historique ne doit jamais faire échouer l'action.
        }
    }

    private function normalizeHeure(mixed $value): ?string
    {
        $value = $this->trimOrNull($value);
        if ($value === null) {
            return null;
        }
        if (preg_match('/^(\d{1,2}):(\d{1,2})$/', $value, $m)) {
            return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return $value;
    }

    private function trimOrNull(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
