<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeSubmittedToConducteur extends Mailable
{
    use Queueable, SerializesModels;

    public ActeLiturgique $acte;

    /**
     * Create a new message instance.
     */
    public function __construct(ActeLiturgique $acte)
    {
        $this->acte = $acte;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this
            ->subject("Nouvelle demande liturgique pour votre classe")
            ->view('emails.acte-submitted-conducteur')
            ->with(['acte' => $this->acte]);
    }
}
