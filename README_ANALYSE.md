# ClassEmmetho

## Analyse du projet — 2026-08-22

### 1. Stack technique
- **Backend** : Laravel 12, PHP ^8.2 — `laravel/sanctum` 4.3, `inertiajs/inertia-laravel` 2.0, `barryvdh/laravel-dompdf`, `phpoffice/phpspreadsheet` 5.4, `endroid/qr-code`, `paydunya/paydunya` (mobile money CI), `twilio/sdk` (SMS/WhatsApp).
- **Frontend** : React 19 + Inertia.js 2, Tailwind CSS 4, Vite 8. `recharts`, `framer-motion`, `exceljs` (a remplacé `xlsx` — commit sécurité), `jspdf`/`html2pdf.js`.
- **Base de données** : MySQL, base `metho1_jubile`, avec seed contrôlable par variables d'env (snapshot / reference / demo).

### 2. Architecture
Contrôleurs Inertia organisés **par rôle** (`Admin`, `Conducteur`, `Pasteur`, `ResponsableFamille`, `MembreFamille`, `PresidentConducteurs`, `Public`), frontend React miroir la même arborescence. API mobile (Sanctum) séparée du web Inertia. Couche `app/Services/` riche (trésorerie, PayDunya, transferts, dédup familles, audit).

### 3. Domaine métier
Organisation religieuse : **Classes → Familles/Tribus → Membres**, avec inscriptions (workflow d'approbation), actes liturgiques, présences (QR), prières/sondages, trésorerie (cotisations, campagnes, paiements, dons via PayDunya), transferts de classe/tribu, rôles hiérarchiques mappés via middleware.

### 4. Base de données
~140 migrations. Développement récent (mi-août 2026) centré sur le **module Tribu** (nouveau) : tribus, chefs de tribu, demandes de transfert, justification des présences. Nombreuses migrations de "consolidation"/"nettoyage" du schéma `users`/`inscriptions` — schéma qui a beaucoup bougé.

### 5. Sécurité
Sanctum en mode stateful API + sessions web classiques. Autorisation par rôle via middleware `CheckRole` (logique de mapping non triviale, avec cas spécial "président des conducteurs"). CSRF désactivé explicitement sur 4 routes d'approbation d'inscription.

### 6. Points d'attention
- Un fichier `.bak` de migration versionné inutilement.
- `Log::info` systématique à chaque vérification de rôle — bruit/perf en prod.
- `TrackModifications` désactivé sur `User` avec commentaire "cause issues with is_modified column" — dette technique non résolue.

### 7. État git (au 2026-08-22)
`methoisrael` (branche courante, à jour avec origin) a 3 commits d'avance sur `main` (module Tribu), et `main` a 1 commit absent de `methoisrael` — divergence mineure. **`feature/Desy` diverge fortement** : 107 commits propres à `feature/Desy` contre 12 propres à `methoisrael` — deux lignes de développement à réconcilier avant toute fusion.

### Recommandations
1. Réconcilier `main` ↔ `methoisrael` ↔ `feature/Desy` avant fusion, en particulier les 107 commits isolés sur `feature/Desy`.
2. Supprimer le fichier `.bak` du dossier `migrations/`.
3. Réduire le `Log::info` dans `CheckRole` (passer en `debug` ou conditionner) avant prod.
4. Documenter/corriger la désactivation de `TrackModifications` sur `User`.
5. Ajouter `*.zip`, `*.xlsx`, `*.docx` racine au `.gitignore` par précaution.
