<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendCredentials extends Mailable
{
    use SerializesModels;

    public $user;
    public $identifier;
    public $tempPassword;
    public $classe;

    /**
     * Créer une nouvelle instance de mailable.
     *
     * @param $user
     * @param string $identifier L'identifiant unique généré pour l'utilisateur
     * @param string $tempPassword Le mot de passe temporaire
     * @param $classe La classe de l'utilisateur (optionnel)
     */
    public function __construct($user, string $identifier, string $tempPassword, $classe = null)
    {
        $this->user = $user;
        $this->identifier = $identifier;
        $this->tempPassword = $tempPassword;
        $this->classe = $classe;
    }

    /**
     * Construire le message.
     */
    public function build()
    {
        return $this
            ->to($this->user->email)
            ->subject('Votre code membre de connexion')
            ->view('emails.account-created')
            ->with([
                'user' => $this->user,
                'identifier' => $this->identifier,
                'password' => $this->tempPassword,
                'classe' => $this->classe,
            ]);
    }
}
