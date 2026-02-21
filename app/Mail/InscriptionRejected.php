<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InscriptionRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $reason;
    public $inscriptionType;

    /**
     * Créer une nouvelle instance de mailable pour un refus d'inscription.
     *
     * @param $user L'utilisateur (responsable/conducteur/pasteur)
     * @param string $reason La raison du refus
     * @param string $inscriptionType Le type d'inscription (famille, conducteur, pasteur, etc.)
     */
    public function __construct($user, string $reason, string $inscriptionType = 'famille')
    {
        $this->user = $user;
        $this->reason = $reason;
        $this->inscriptionType = $inscriptionType;
    }

    /**
     * Construire le message.
     */
    public function build()
    {
        return $this
            ->to($this->user->email)
            ->subject('Notification concernant votre inscription - Refus ❌')
            ->view('emails.inscription-rejected')
            ->with([
                'user' => $this->user,
                'reason' => $this->reason,
                'inscriptionType' => $this->inscriptionType,
            ]);
    }
}
