<p>Bonjour,</p>

<p><strong>{{ $acte->createur?->prenom }} {{ $acte->createur?->nom }}</strong> a soumis une demande{{ $acte->classe ? ' pour la classe ' . $acte->classe->nom : '' }}.</p>

<p>Type: <strong>{{ $acte->isAnnonce() ? 'Annonce' : ucfirst(str_replace('_', ' ', $acte->type_acte)) }}</strong> — Réf: <strong>{{ $acte->reference }}</strong></p>

@php
$link = $acte->isAnnonce() ? config('app.url') . '/conducteur/annonces/' . $acte->id : config('app.url') . '/conducteur/liturgie/' . $acte->id;
@endphp

<p>Voir la demande : <a href="{{ $link }}">{{ $link }}</a></p>

<p>Merci.</p>