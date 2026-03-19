# 💰 MODULE TRÉSORERIE - PLAN DE DÉVELOPPEMENT

## Phase 1 : Fondations (BD + Models)

- [x] Migration : **cotisations** (types, montants, périodicité, statut)
- [x] Migration : **paiements** (famille, cotisation, montant, mode, date, ref)
- [x] Migration : **dons** (membre, montant, type, campagne, date)
- [x] Migration : **campagnes** (titre, objectif, classe/global, période, statut)
- [x] Migration : **notifications_financieres** (utilisateur, type, acte_id, lue)
- [x] Modèle : **Cotisation**
- [x] Modèle : **Paiement**
- [x] Modèle : **Don**
- [x] Modèle : **ProjectionFinanciere** (calculs, soldes)

## Phase 2 : Routes & Contrôleurs

### Admin

- [x] AdminTresorerieController (paramètres cotisations, supervision, rapports)
- Routes : /admin/tresorerie

API Admin ajoutée :

- [x] POST /api/admin/tresorerie/cotisations
- [x] PUT /api/admin/tresorerie/cotisations/{cotisation}
- [x] POST /api/admin/tresorerie/campagnes
- [x] PUT /api/admin/tresorerie/campagnes/{campagne}
- [x] POST /api/admin/tresorerie/campagnes/{campagne}/close

### Conducteur

- [x] ConducteurTresorerieController (suivi classe, créer collectes)
- Routes : /conducteur/tresorerie

### Pasteur

- [x] PasteurTresorerieController (vue globale, supervision)
- Routes : /pasteur/tresorerie

### Membre de Famille

- [x] MembreFamilleFinancesController (consultation, paiement, dons)
- Routes : /membre-famille/tresorerie

API Membre de famille ajoutée :

- [x] POST /api/membre-famille/finances/paiements
- [x] POST /api/membre-famille/finances/dons

### Responsable de Famille

- [x] ResponsableFamilleTresorerieController (consultation, paiements, dons)
- [x] Route web : /responsable-famille/tresorerie (branchée au contrôleur)
- [x] Routes API : /api/responsable-famille/tresorerie/paiements et /api/responsable-famille/tresorerie/dons

## Phase 3 : Frontend React

### Composants réutilisables

- [ ] CotisationCard
- [ ] PaiementForm
- [ ] DonForm
- [ ] CampagneCard
- [ ] TableTransactions
- [ ] StatsFinancières
- [ ] NotificationsFinancières

### Pages par rôle

- [ ] Admin/Tresorerie/Index (dashboard)
- [ ] Admin/Tresorerie/Cotisations (gestion)
- [ ] Admin/Tresorerie/Campagnes (gestion)
- [ ] Admin/Tresorerie/Rapports (exports)
- [ ] Conducteur/Tresorerie/Index (sa classe)
- [ ] Conducteur/Tresorerie/Collecte (créer)
- [ ] Pasteur/Tresorerie/Index (global)
- [ ] MembreFamille/Finances/Index (consultation)
- [ ] MembreFamille/Finances/Paiement (payer)
- [ ] MembreFamille/Finances/Dons (donner)
- [ ] MembreFamille/Finances/Historique (transactions)

## Phase 4 : Logique métier & Notifications

- [ ] Calcul soldes et dettes
- [ ] Génération reçus PDF
- [ ] Système de notifications financières
- [ ] Rappels automatiques de retards
- [ ] Clôture automatique campagnes
- [ ] Export Excel/PDF rapports

## État du projet

**Statut actuel** : Phase 1 terminée + tous les rôles Trésorerie connectés (Admin, Conducteur, Pasteur, ResponsableFamille, MembreFamille)  
**Priorité** : Admin (paramètres) → Conducteur (suivi) → Membre (paiement) → Pasteur (supervision)

---

## Notes d'implémentation

### Modes de paiement

- Mobile Money (Moov, Orange, Mtl)
- Espèces (manuel, confirmé conducteur)
- Virement (bancaire)

### Statuts cotisations

- `PAYÉ` : complètement payé
- `PARTIELLEMENT_PAYÉ` : avance ou partiel
- `EN_RETARD` : dépassé la date limite
- `ANNULÉE` : cotisation résilié

### Statuts campagnes

- `ACTIVE` : en cours
- `CLÔTURÉE` : terminée
- `ANNULÉE` : suspendue

### Notifications types

- `PAIEMENT_REÇU` : confirmation paiement
- `RETARD_COTISATION` : rappel dû
- `CAMPAGNE_ACTIVE` : nouvelle collecte
- `OBJECTIF_ATTEINT` : campagne réussie
- `DON_REÇU` : confirmation don
