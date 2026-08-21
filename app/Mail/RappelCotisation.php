<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RappelCotisation extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $cotisationsDues;
    public $totalDu;
    public $totalPaye;
    public $customMessage;

    /**
     * @param $user L'utilisateur relancé
     * @param array $cotisationsDues Liste des cotisations non soldées [{nom, montant, paye, du}]
     * @param int $totalDu Montant total dû, toutes cotisations confondues
     * @param string|null $customMessage Message personnalisé rédigé par le conducteur, remplace le texte par défaut
     * @param int $totalPaye Montant total déjà payé, toutes cotisations confondues
     */
    public function __construct($user, array $cotisationsDues, int $totalDu, ?string $customMessage = null, int $totalPaye = 0)
    {
        $this->user = $user;
        $this->cotisationsDues = $cotisationsDues;
        $this->totalDu = $totalDu;
        $this->customMessage = $customMessage;
        $this->totalPaye = $totalPaye;
    }

    public function build()
    {
        return $this
            ->to($this->user->email)
            ->subject('Rappel de cotisation')
            ->view('emails.rappel-cotisation')
            ->with([
                'user' => $this->user,
                'cotisationsDues' => $this->cotisationsDues,
                'totalDu' => $this->totalDu,
                'customMessage' => $this->customMessage,
                'totalPaye' => $this->totalPaye,
                'totalAttendu' => $this->totalPaye + $this->totalDu,
            ]);
    }
}
