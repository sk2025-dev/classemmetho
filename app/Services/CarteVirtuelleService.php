<?php

namespace App\Services;

use App\Helpers\PhotoHelper;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Models\SiteSetting;
use App\Models\User;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class CarteVirtuelleService
{
    private const ROLE_LABELS = [
        'membre_famille' => 'Membre de famille',
        'responsable_famille' => 'Responsable de famille',
        'conducteur' => 'Conducteur',
        'pasteur' => 'Pasteur',
        'tresorier' => 'Trésorier',
        'bureau_conducteur' => 'Bureau des conducteurs',
    ];

    /**
     * Construit les données affichables de la carte virtuelle d'un membre.
     * Retourne null si la classe du membre n'a pas activé la carte virtuelle.
     */
    public static function build(User $member): ?array
    {
        $classe = $member->classe;

        if (!$classe || !$classe->carte_virtuelle_active) {
            return null;
        }

        $member->loadMissing('fonction');

        $titre = $member->fonction?->nom
            ?: (self::ROLE_LABELS[$member->role] ?? ucfirst((string) $member->role));

        $writer = new PngWriter();
        $qrResult = $writer->write(
            new QrCode(
                data: (string) ($member->code_membre ?: $member->identifier ?: $member->id),
                size: 260,
                margin: 8,
            )
        );

        // La signature affichée sur la carte est toujours celle du conducteur de la classe.
        $conducteur = $classe->conducteurs()->whereNotNull('signature_path')->first()
            ?? $classe->conducteurs()->first();

        return [
            'membre' => [
                'id' => $member->id,
                'nom' => $member->nom,
                'prenom' => $member->prenom,
                'titre' => $titre,
                'telephone' => $member->telephone,
                'code_membre' => $member->code_membre,
                'photo_url' => PhotoHelper::getPhotoUrl($member->photo_path, $member->prenom, $member->nom),
            ],
            'classe' => [
                'nom' => $classe->nom,
                'logo_url' => PhotoHelper::getImageUrl($classe->logo_path),
                'cachet_url' => PhotoHelper::getImageUrl($classe->cachet_path),
            ],
            'signature_url' => $conducteur?->signature_path
                ? PhotoHelper::getImageUrl($conducteur->signature_path)
                : null,
            'theme_texte' => $classe->theme_texte
                ?: SiteSetting::get(SiteSettingController::CARTE_THEME_KEY, SiteSettingController::CARTE_THEME_DEFAULT),
            'qr_code' => $qrResult->getDataUri(),
        ];
    }
}
