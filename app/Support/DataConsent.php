<?php

namespace App\Support;

use App\Models\SiteSetting;

/**
 * Fonctionnalité activable côté Administration → Paramètres : quand elle est
 * active, chaque famille (via son responsable) — et chaque compte sans
 * famille, individuellement — doit valider les conditions d'utilisation des
 * données personnelles avant de pouvoir utiliser la plateforme. Désactivée,
 * tout redevient accessible sans restriction (comportement historique).
 */
final class DataConsent
{
    public const ACTIF_KEY = 'consentement_donnees_actif';
    public const TEXTE_KEY = 'consentement_donnees_texte';

    public const TEXTE_DEFAUT = <<<'TXT'
En utilisant cette plateforme, vous acceptez que les données personnelles de votre famille (identité, contact, situation, photos, historique de participation et de trésorerie) soient collectées et traitées par l'Église Méthodiste — Classe Jubilé de Cocody, dans le seul cadre de la gestion de la vie communautaire (présences, cotisations, actes liturgiques, communications).

Vos données ne sont ni vendues ni transmises à des tiers en dehors de l'administration de la classe. Vous pouvez à tout moment demander leur rectification ou leur suppression auprès du secrétariat.

Tant que ces conditions ne sont pas acceptées par le responsable de famille, l'accès aux fonctionnalités de la plateforme reste bloqué pour tous les membres du foyer.
TXT;

    public static function isEnabled(): bool
    {
        return SiteSetting::get(self::ACTIF_KEY, '0') === '1';
    }

    public static function setEnabled(bool $enabled): void
    {
        SiteSetting::set(self::ACTIF_KEY, $enabled ? '1' : '0');
    }

    public static function texte(): string
    {
        return SiteSetting::get(self::TEXTE_KEY, self::TEXTE_DEFAUT) ?: self::TEXTE_DEFAUT;
    }

    public static function setTexte(string $texte): void
    {
        SiteSetting::set(self::TEXTE_KEY, $texte);
    }
}
