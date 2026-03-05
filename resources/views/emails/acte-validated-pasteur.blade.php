<p>Bonjour,</p>

<p>Une demande a été transmise pour validation pastorale par <strong>{{ $acte->createur?->prenom }} {{ $acte->createur?->nom }}</strong>{{ $acte->classe ? ' (classe ' . $acte->classe->nom . ')' : '' }}.</p>

<p>Type: <strong>{{ $acte->isAnnonce() ? 'Annonce' : ucfirst(str_replace('_', ' ', $acte->type_acte)) }}</strong> — Réf: <strong>{{ $acte->reference }}</strong></p>

@php
$link = $acte->isAnnonce() ? config('app.url') . '/pasteur/annonces/' . $acte->id : config('app.url') . '/pasteur/liturgie/' . $acte->id;
@endphp

<p>Voir la demande : <a href="{{ $link }}">{{ $link }}</a></p>

<p>Merci.</p>