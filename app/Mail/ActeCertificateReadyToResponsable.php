<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeCertificateReadyToResponsable extends Mailable
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
            ->subject("Votre certificat liturgique est disponible")
            ->view('emails.acte-certificate-ready')
            ->with(['acte' => $this->acte]);
    }
}
