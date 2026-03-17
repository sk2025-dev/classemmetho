<p>Bonjour <strong>{{ $acte->createur?->prenom }} {{ $acte->createur?->nom }}</strong>,</p>

<p>Nous avons le regret de vous informer que votre
    <strong>{{ $acte->isAnnonce() ? 'annonce' : 'demande d\'acte liturgique' }}</strong>
    a été <strong>refusée</strong> par
    {{ $refusePar === 'conducteur' ? 'votre conducteur de classe' : 'le pasteur' }}.
</p>

<p>
    Type : <strong>{{ $acte->isAnnonce() ? 'Annonce' : ucfirst(str_replace('_', ' ', $acte->type_acte)) }}</strong>
    &mdash; Réf : <strong>{{ $acte->reference }}</strong>
    {{ $acte->classe ? '&mdash; Classe : <strong>' . $acte->classe->nom . '</strong>' : '' }}
</p>

@if($refusePar === 'conducteur' && $acte->note_conducteur)
<p>Motif communiqué par le conducteur : <em>{{ $acte->note_conducteur }}</em></p>
@elseif($refusePar === 'pasteur' && $acte->note_pastorale)
<p>Motif communiqué par le pasteur : <em>{{ $acte->note_pastorale }}</em></p>
@endif

<p>Si vous avez des questions, veuillez contacter votre conducteur de classe.</p>

<p>Que Dieu vous bénisse.</p>