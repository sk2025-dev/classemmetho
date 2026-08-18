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

    /**
     * @param $user L'utilisateur relancé
     * @param array $cotisationsDues Liste des cotisations non soldées [{nom, montant, paye, du}]
     * @param int $totalDu Montant total dû, toutes cotisations confondues
     */
    public function __construct($user, array $cotisationsDues, int $totalDu)
    {
        $this->user = $user;
        $this->cotisationsDues = $cotisationsDues;
        $this->totalDu = $totalDu;
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
            ]);
    }
}
