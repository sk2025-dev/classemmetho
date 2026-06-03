<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeValidatedToCreateur extends Mailable
{
    use Queueable, SerializesModels;

    public ActeLiturgique $acte;

    public function __construct(ActeLiturgique $acte)
    {
        $this->acte = $acte;
    }

    public function build()
    {
        $type = $this->acte->isAnnonce() ? 'Annonce' : 'Demande d\'acte liturgique';

        return $this
            ->subject("Votre {$type} a été validée ✅")
            ->view('emails.acte-validated-createur')
            ->with(['acte' => $this->acte]);
    }
}
