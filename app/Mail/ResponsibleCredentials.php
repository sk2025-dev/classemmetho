<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResponsibleCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $identifier;
    public $tempPassword;
    public $classe;
    public $members;

    /**
     * Créer une nouvelle instance de mailable pour un responsable/conducteur.
     *
     * @param $user Le responsable ou conducteur
     * @param string $identifier L'identifiant unique généré pour l'utilisateur
     * @param string $tempPassword Le mot de passe temporaire
     * @param $classe La classe de la famille/groupe
     * @param array $members Tableau des membres de la famille avec leurs infos (nom, prenom, classe, identifier, password)
     */
    public function __construct($user, string $identifier, string $tempPassword, $classe, array $members = [])
    {
        $this->user = $user;
        $this->identifier = $identifier;
        $this->tempPassword = $tempPassword;
        $this->classe = $classe;
        $this->members = $members;
    }

    /**
     * Construire le message.
     */
    public function build()
    {
        return $this
            ->to($this->user->email)
            ->subject('Vos identifiants de connexion et celle de vos membres')
            ->view('emails.responsible-credentials')
            ->with([
                'user' => $this->user,
                'identifier' => $this->identifier,
                'password' => $this->tempPassword,
                'classe' => $this->classe,
                'members' => $this->members,
            ]);
    }
}
