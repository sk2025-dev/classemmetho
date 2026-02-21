<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Support\Str;

trait GeneratesIdentifier
{
    /**
     * Générer un identifiant unique selon la logique demandée
     * Format: NNPPJJMMAARR
     * - NN: 2 premières lettres du NOM (majuscules)
     * - PP: 2 premières lettres du PRÉNOM (majuscules)
     * - JJMMAA: Date de naissance (jour-mois-année sur 2 chiffres)
     * - RR: 2 caractères aléatoires supplémentaires pour l'unicité
     *
     * @param string $nom
     * @param string $prenom
     * @param string $dateNaissance Format: YYYY-MM-DD
     * @return string Identifiant généré (ex: "DuPa150590aB")
     */
    public static function generateIdentifier(string $nom, string $prenom, string $dateNaissance = null): string
    {
        // 1. Deux premières lettres du nom (majuscules)
        $nomPart = strtoupper(substr(trim($nom), 0, 2));
        if (strlen($nomPart) < 2) {
            $nomPart = str_pad($nomPart, 2, 'X'); // Padding si nom trop court
        }

        // 2. Deux premières lettres du prénom (majuscules)
        $prenomPart = strtoupper(substr(trim($prenom), 0, 2));
        if (strlen($prenomPart) < 2) {
            $prenomPart = str_pad($prenomPart, 2, 'X'); // Padding si prénom trop court
        }

        // 3. Jour-Mois-Année (2 derniers chiffres)
        if ($dateNaissance) {
            $date = \DateTime::createFromFormat('Y-m-d', $dateNaissance);
            if (!$date) {
                $date = now();
            }
        } else {
            $date = now();
        }

        $jour = str_pad($date->format('d'), 2, '0', STR_PAD_LEFT);
        $mois = str_pad($date->format('m'), 2, '0', STR_PAD_LEFT);
        $annee = $date->format('y'); // 2 derniers chiffres

        $datePart = $jour . $mois . $annee;

        // 4. Caractères aléatoires pour l'unicité
        $randomPart = Str::random(2);

        // Combiner tous les éléments
        $identifier = $nomPart . $prenomPart . $datePart . $randomPart;

        // Vérifier l'unicité et régénérer si nécessaire
        $counter = 0;
        $originalIdentifier = $identifier;

        while (User::where('identifier', $identifier)->exists() && $counter < 50) {
            // Régénérer les caractères aléatoires
            $randomPart = Str::random(2);
            $identifier = $nomPart . $prenomPart . $datePart . $randomPart;
            $counter++;
        }

        // Si toujours en doublon après 50 tentatives, ajouter un numéro
        if ($counter >= 50) {
            $identifier = $originalIdentifier . $counter;
        }

        return $identifier;
    }

    /**
     * Version alternative plus court (si besoin)
     * Format: NNPPJJMMAA (sans caractères aléatoires)
     *
     * @param string $nom
     * @param string $prenom
     * @param string $dateNaissance
     * @return string
     */
    public static function generateShortIdentifier(string $nom, string $prenom, string $dateNaissance = null): string
    {
        // 1. Deux premières lettres du nom (majuscules)
        $nomPart = strtoupper(substr(trim($nom), 0, 2));
        if (strlen($nomPart) < 2) {
            $nomPart = str_pad($nomPart, 2, 'X');
        }

        // 2. Deux premières lettres du prénom (majuscules)
        $prenomPart = strtoupper(substr(trim($prenom), 0, 2));
        if (strlen($prenomPart) < 2) {
            $prenomPart = str_pad($prenomPart, 2, 'X');
        }

        // 3. Jour-Mois-Année
        if ($dateNaissance) {
            $date = \DateTime::createFromFormat('Y-m-d', $dateNaissance);
            if (!$date) {
                $date = now();
            }
        } else {
            $date = now();
        }

        $jour = str_pad($date->format('d'), 2, '0', STR_PAD_LEFT);
        $mois = str_pad($date->format('m'), 2, '0', STR_PAD_LEFT);
        $annee = $date->format('y');

        $datePart = $jour . $mois . $annee;

        return $nomPart . $prenomPart . $datePart;
    }
}

