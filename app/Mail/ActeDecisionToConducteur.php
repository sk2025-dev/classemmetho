<?php

namespace App\Mail;

use App\Models\ActeLiturgique;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ActeDecisionToConducteur extends Mailable
{
    use Queueable, SerializesModels;

    public ActeLiturgique $acte;
    public string $decision; // 'validee' ou 'refusee'

    public function __construct(ActeLiturgique $acte, string $decision)
    {
        $this->acte = $acte;
        $this->decision = $decision;
    }

    public function build()
    {
        $label = $this->decision === 'validee' ? 'validée ✅' : 'refusée ❌';
        $type  = $this->acte->isAnnonce() ? 'Annonce' : 'Demande d\'acte liturgique';

        return $this
            ->subject("{$type} {$label} par le pasteur")
            ->view('emails.acte-decision-conducteur')
            ->with([
                'acte'     => $this->acte,
                'decision' => $this->decision,
            ]);
    }
}
