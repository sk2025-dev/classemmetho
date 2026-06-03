<p>Bonjour <strong>{{ $acte->createur?->prenom }} {{ $acte->createur?->nom }}</strong>,</p>

<p>Bonne nouvelle ! Votre
    <strong>{{ $acte->isAnnonce() ? 'annonce' : 'demande d\'acte liturgique' }}</strong>
    a été <strong>validée</strong> par le pasteur.
</p>

<p>
    Type : <strong>{{ $acte->isAnnonce() ? 'Annonce' : ucfirst(str_replace('_', ' ', $acte->type_acte)) }}</strong>
    &mdash; Réf : <strong>{{ $acte->reference }}</strong>
    {{ $acte->classe ? '&mdash; Classe : <strong>' . $acte->classe->nom . '</strong>' : '' }}
</p>

@if($acte->note_pastorale)
<p>Note pastorale : <em>{{ $acte->note_pastorale }}</em></p>
@endif

@php
$role = $acte->createur?->role ?? 'membre_famille';
$base = match($role) {
'responsable_famille' => '/responsable-famille/liturgie',
'conducteur' => '/conducteur/liturgie',
default => '/membre-famille/liturgie',
};
$link = config('app.url') . $base;
@endphp

<p>Consultez votre espace personnel pour suivre la suite : <a href="{{ $link }}">{{ $link }}</a></p>

<p>Que Dieu vous bénisse.</p>