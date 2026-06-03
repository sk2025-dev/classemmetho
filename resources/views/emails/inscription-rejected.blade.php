@component('mail::message')
# Notification concernant votre inscription ❌

Bonjour **{{ $user->prenom }} {{ $user->nom }}**,

Nous regrettons de vous informer que votre inscription en tant que **{{ ucfirst($inscriptionType) }}** a été **REFUSÉE**.

## Raison du refus

@component('mail::panel')
{{ $reason }}
@endcomponent

## Prochaines étapes

Si vous pensez qu'il y a une erreur ou si vous avez des questions concernant cette décision, veuillez nous contacter directement via email ou par téléphone.

Nous vous remercions pour votre compréhension et votre intérêt envers notre communauté.

@component('mail::button', ['url' => config('app.url')])
Retourner à l'accueil
@endcomponent

Cordialement,  
**L'équipe d'administration**

---

*Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à ce message.*
@endcomponent
