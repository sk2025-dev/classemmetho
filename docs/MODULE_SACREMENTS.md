# Baptême et première communion

État de l’implémentation : 21 septembre 2026. Point d’entrée : `/sacrements` (le préfixe d’installation, par exemple `/classemmetho` ou `/demo`, est conservé).

## Responsabilités retenues

- Le membre de famille simple n’a aucune action dans ce module, y compris le téléchargement.
- Le responsable de famille inscrit exclusivement les membres de sa famille, lui-même compris. Les comptes ayant explicitement `is_family_responsible` agissent au titre de cette responsabilité supplémentaire ; un rôle pasteur, conducteur ou administrateur ne suffit pas pour inscrire.
- Le conducteur contrôle la FIMECO familiale et l’assiduité, individuellement ou par sélection. Il reste décisionnaire : aucun seuil automatique ne remplace son appréciation.
- Le bureau des conducteurs (y compris le conducteur désigné président) valide les listes et les transmet au pasteur.
- Le pasteur admet les candidats, renseigne la préparation et la cérémonie, confirme chaque sacrement reçu et rectifie les certificats avec motif.
- L’administration ouvre, ferme, réouvre et archive les campagnes. Elle supervise et archive les dossiers. La reprise explicite d’anciens dossiers n’est pas une nouvelle inscription.

## Parcours

1. **Campagne** : ouverture avec année, titre et dates. Une seule campagne peut être ouverte ; une campagne expirée est fermée et historisée lors de l’ouverture suivante. La fermeture manuelle ou l’expiration bloque toute nouvelle inscription. La réouverture est motivée et conserve les listes déjà transmises.
2. **Inscription** : choix du candidat de la famille et du sacrement ; informations complémentaires et pièces PDF/JPG/PNG (5 Mo chacune, maximum 5 par envoi). Brouillon ou soumission. Les critères paroissiaux supplémentaires (pièces obligatoires, âge, durée de catéchèse) n’ayant pas été définis, ils ne sont pas imposés arbitrairement. La première communion seule suppose un baptême enregistré sur la fiche du membre ; sinon, choisir le parcours combiné.
3. **Contrôle progressif** : le conducteur consulte les indicateurs, valide, demande une correction ou exclut avec motif. Une sélection est traitée en transaction : si un dossier n’est plus admissible, aucune décision partielle n’est enregistrée. Chaque candidat conserve son contrôle et sa propre trace de décision.
4. **Transmission** : action explicite du conducteur, uniquement après fermeture. Tous les dossiers soumis de sa classe doivent être contrôlés ou exclus/annulés. Les brouillons ne font pas partie des inscriptions soumises. La liste contient les candidats validés et fige leur identité, leurs renseignements et les indicateurs observés au contrôle.
5. **Bureau puis pasteur** : validation de liste, refus motivé ou retour au conducteur. Le retour invalide les contrôles des candidats de cette version ; le conducteur peut demander des compléments à la famille. La correction reste possible après fermeture. La retransmission crée une version conservant l’ancienne et revient au niveau ayant demandé la correction.
6. **Réouverture** : elle n’altère pas les versions transmises. Les nouveaux candidats attendent la nouvelle fermeture. Une liste complémentaire peut être transmise après traitement de la précédente ; seuls les nouveaux candidats contrôlés sont ajoutés à cette transmission.
7. **Préparation et célébration** : suivi de préparation (en cours, terminée, non requise), date prévue, lieu, célébrant. Ces renseignements n’accordent aucun sacrement. La confirmation réelle est pastorale, individuelle ou groupée ; une demande combinée permet deux confirmations distinctes, le baptême précédant la communion. L’absence/report exige un motif et la suite prévue.
8. **Certificats** : mise à jour de `user_sacrements` à la confirmation réelle seulement, attribution d’une référence de registre et PDF téléchargeable par les profils autorisés. Rectification pastorale motivée, avec conservation des versions précédentes et actualisation de la fiche membre. Les anciennes versions PDF portent la mention « version antérieure remplacée ».
9. **Archivage** : dossier célébré, refusé, annulé ou reporté ; conservation de l’issue finale, des pièces et de l’historique. Tous les dossiers doivent être archivés avant la campagne. L’administration peut annuler un brouillon abandonné après fermeture avec motif. L’archive est en lecture seule pour les opérations ordinaires ; la rectification explicite d’un certificat reste tracée et n’enlève pas le statut archivé.

## Indicateurs

La FIMECO provient du service existant `FimecoClasseSuiviService` : souscription et versements **de la famille**, pour l’année de campagne. Les montants ne constituent pas une cotisation individuelle du candidat.

L’assiduité porte sur les activités de la classe (`special_events`, hors activités paroissiales), réalisées dans l’année de la campagne et à la date du contrôle. Le taux utilise les présences/absences effectivement pointées ; les absences justifiées sont indiquées séparément. L’absence de pointage s’affiche « aucun pointage disponible » et n’est pas assimilée à une absence. Les activités sans rattachement à une classe ne sont pas incluses. Le conducteur conserve son appréciation des activités non saisies.

Les indicateurs actuels sont affichés au conducteur ; le contrôle enregistré est conservé séparément et copié dans la version de liste transmise.

## Protection et compatibilité

- Droits vérifiés côté serveur pour les dossiers, listes, actions groupées, pièces et PDF ; CSRF conservé.
- Verrouillage campagne puis dossiers, détection des versions devenues obsolètes lors des actions, prévention des doubles célébrations et doublons entre demandes simples/combinées, même après archivage.
- Pièces des nouvelles inscriptions sur le disque privé `local`, accessibles par une route autorisée. Les pièces des anciens dossiers conservent leur stockage existant lors de leur reprise.
- Notifications internes à l’application : responsables de famille, conducteurs et intervenants suivants. Aucun SMS ni envoi automatique de courriel ajouté.
- Les anciennes actions liturgiques ne permettent plus de contourner le circuit des sacrements ; les autres actes liturgiques restent dans leur circuit existant.
- Les dossiers antérieurs ne sont pas rattachés automatiquement à une campagne. L’administrateur peut reprendre les dossiers encore en cours dans une campagne ouverte, avec motif et nouveau contrôle. Référence, pièces, renseignements et historique sont conservés. Les anciennes célébrations ne sont jamais déduites automatiquement.

## Installation et vérification

Migrations nécessaires, dans cet ordre :

```sh
php artisan migrate --path=database/migrations/2026_09_19_120000_create_campagnes_sacrements_table.php
php artisan migrate --path=database/migrations/2026_09_21_120000_add_sacrement_workflow.php
npm run build
```

La seconde migration est additive : nouvelles colonnes de suivi et table des versions de listes. Elle a été appliquée sur la base locale de développement ; aucune ancienne inscription n’a été automatiquement transformée.

```sh
./vendor/bin/phpunit tests/Feature/SacrementWorkflowTest.php
```

Les tests utilisent SQLite en mémoire avec un schéma isolé et les migrations propres au module ; ils ne modifient pas MySQL. Ils couvrent les parcours complets, permissions, isolation famille/classe, validation groupée atomique, fermeture/réouverture, versions de listes, pièces privées, préparation, célébration partielle, certificats, rectification, archives et reprise historique. Le rendu Inertia est testé pour chaque profil. Un contrôle de lecture sur MySQL local vérifie les écrans avec les comptes disponibles.

Recette visuelle à effectuer dans le navigateur avec les profils réels : confort des formulaires sur mobile, sélection groupée, lisibilité des listes et mise en page imprimée des certificats. Aucun navigateur automatisé n’est fourni dans cet environnement.

## Résultats de vérification du 21 septembre 2026

- 20 tests du module réussis, 130 assertions.
- Compilation Vite réussie (avertissement existant sur la taille de certains bundles).
- Contrôle PHP/Pint des fichiers du module réussi.
- Réponses HTTP 200 des contrôleurs avec les comptes locaux administrateur, conducteur, pasteur et responsable de famille. Aucun compte local de rôle `bureau_conducteur` trouvé ; rôle bureau et fonction président couverts par les tests isolés.
- Suite générale : 40 tests, 6 échecs dans `tests/Unit/PhoneValidationTest.php`, fichier inchangé contenant ses propres helpers de test. Ces échecs ne concernent pas le module des sacrements.

## Ajout d’une personne avant son inscription au sacrement

Le formulaire propose « membre déjà présent dans ma famille » ou « personne à ajouter d’abord à ma famille ». Le second choix ouvre le formulaire complet d’ajout de membre, puis revient au sacrement choisi avec le membre présélectionné. La création de la fiche familiale ne soumet pas automatiquement la demande de sacrement. Le rattachement est limité à la famille du responsable connecté, avec blocage des familles en transfert/archivées. Une identité déjà enregistrée (nom, prénom et date de naissance) est signalée pour éviter un doublon ; un rattachement existant à une autre famille n’est pas déplacé silencieusement.

### Inscription par le conducteur

Le conducteur peut inscrire les membres de sa classe pendant la campagne ouverte, en conservant leur famille de rattachement. Il peut soumettre, corriger ou annuler les dossiers qu’il a créés, selon leur état. Ses brouillons lui sont accessibles ; les brouillons des autres familles restent privés. Les contacts proviennent du candidat et de sa famille. Les contrôles FIMECO et assiduité et le circuit de validation restent obligatoires.


## Actions pastorales depuis l’historique

Dans Baptême / communion → Historique, les actions de préparation/cérémonie, confirmation du sacrement, absence/report et rectification restent accessibles individuellement et par sélection. Une sélection peut couvrir plusieurs classes d’une même campagne (100 dossiers maximum). Les informations communes s’appliquent à tous les dossiers sélectionnés après confirmation dans une modale avec récapitulatif défilant.

La confirmation et la rectification groupées acceptent des demandes différentes : le pasteur choisit le sacrement pour chaque candidat dans la modale. Pour une demande combinée non encore célébrée, il peut confirmer le baptême seul ou explicitement les deux sacrements reçus ; le système enregistre alors le baptême avant la première communion, avec deux certificats distincts. Une rectification cible un certificat existant par candidat. Chaque dossier conserve sa propre révision, son historique, sa référence de certificat et les versions antérieures en cas de rectification. Une révision obsolète, un dossier non admissible ou un sacrement déjà reçu annule toute l’opération ; aucune réussite partielle n’est enregistrée. Les anciennes versions de listes restent en consultation seule. Après archivage, seule la rectification motivée des certificats reste possible pour le pasteur.
