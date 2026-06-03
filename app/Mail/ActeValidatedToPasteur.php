<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeValidatedToPasteur extends Mailable
{
    use Queueable, SerializesModels;

    public ActeLiturgique $acte;

    public function __construct(ActeLiturgique $acte)
    {
        $this->acte = $acte;
    }

    public function build()
    {
        return $this
            ->subject("Acte transmis pour validation pastorale")
            ->view('emails.acte-validated-pasteur')
            ->with(['acte' => $this->acte]);
    }
}
