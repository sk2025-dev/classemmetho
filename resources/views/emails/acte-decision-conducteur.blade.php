<p>Bonjour,</p>

<p>Le pasteur a pris une décision concernant la demande que vous avez transmise :</p>

<p>
    Type : <strong>{{ $acte->isAnnonce() ? 'Annonce' : ucfirst(str_replace('_', ' ', $acte->type_acte)) }}</strong>
    &mdash; Réf : <strong>{{ $acte->reference }}</strong>
    {{ $acte->classe ? '&mdash; Classe : <strong>' . $acte->classe->nom . '</strong>' : '' }}
    &mdash; Demandeur : <strong>{{ $acte->createur?->prenom }} {{ $acte->createur?->nom }}</strong>
</p>

<p>Décision : <strong>{{ $decision === 'validee' ? '✅ Validée' : '❌ Refusée' }}</strong></p>

@if($decision === 'refusee' && $acte->note_pastorale)
<p>Motif : <em>{{ $acte->note_pastorale }}</em></p>
@endif

@php
$link = config('app.url') . '/conducteur/liturgie';
@endphp

<p>Voir dans votre espace conducteur : <a href="{{ $link }}">{{ $link }}</a></p>

<p>Merci.</p>