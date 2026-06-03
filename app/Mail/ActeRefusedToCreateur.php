<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeRefusedToCreateur extends Mailable
{
    use Queueable, SerializesModels;

    public ActeLiturgique $acte;
    public string $refusePar; // 'conducteur' ou 'pasteur'

    public function __construct(ActeLiturgique $acte, string $refusePar)
    {
        $this->acte = $acte;
        $this->refusePar = $refusePar;
    }

    public function build()
    {
        $type = $this->acte->isAnnonce() ? 'Annonce' : 'Demande d\'acte liturgique';

        return $this
            ->subject("Votre {$type} a été refusée ❌")
            ->view('emails.acte-refused-createur')
            ->with([
                'acte'     => $this->acte,
                'refusePar' => $this->refusePar,
            ]);
    }
}
