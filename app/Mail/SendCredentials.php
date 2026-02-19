<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $identifier;
    public $tempPassword;

    /**
     * Créer une nouvelle instance de mailable.
     *
     * @param $user
     * @param string $identifier L'identifiant unique généré pour l'utilisateur
     * @param string $tempPassword Le mot de passe temporaire
     */
    public function __construct($user, string $identifier, string $tempPassword)
    {
        $this->user = $user;
        $this->identifier = $identifier;
        $this->tempPassword = $tempPassword;
    }

    /**
     * Construire le message.
     */
    public function build()
    {
        return $this
            ->to($this->user->email)
            ->subject('Vos identifiants de connexion')
            ->view('emails.account-created')
            ->with([
                'user' => $this->user,
                'identifier' => $this->identifier,
                'password' => $this->tempPassword,
            ]);
    }
}
