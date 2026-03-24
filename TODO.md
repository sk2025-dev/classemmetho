# TODO - Ajout Statut d'emploi aux formulaires Admin Inscriptions

## ✅ Compréhension complète

- Publics (Conducteur/RegisterConducteur.jsx, ResponsableFamille/RegisterFamille.jsx) : **DÉJÀ IMPLÉMENTÉS** avec :
    - State: `employment_status: "", profession_detail: ""`
    - UI Step 2: FormField select "Statut d'emploi \*" icon Briefcase (4 options: TRAVAILLEUR, RETRAITE, ETUDIANT, SANS_EMPLOI)
    - Validation requise (`newErrors["responsable.employment_status"] = "Statut d'emploi requis"`)
    - Placement: Grid md:grid-cols-2 avec Profession_detail
    - MembreTemp aussi
    - Affichage vérification Step 4

## 🔄 Plan d'implémentation (3 fichiers identiques)

**Fichiers** : Admin/Inscriptions/RegisterFamille.jsx, RegisterConducteur.jsx, RegisterPasteur.jsx

**1. State responsable** (après profession):

```
employment_status: "",
profession_detail: "",
```

**2. Step 2 UI** (après FormField Profession):

```
<FormField label="Statut d'emploi" icon={Briefcase} required>
  <select className="w-full h-12 border... " value={responsable.employment_status || ""} onChange={(e) => setResponsable({...responsable, employment_status: e.target.value})}>
    <option value="">Sélectionner un statut</option>
    <option value="TRAVAILLEUR">Travailleur(euse)</option>
    <option value="RETRAITE">Retraité(e)</option>
    <option value="ETUDIANT">Étudiant(e)</option>
    <option value="SANS_EMPLOI">Sans emploi</option>
  </select>
  {getFieldError("responsable.employment_status") && <p className="text-red-500 text-xs mt-1">{getFieldError("responsable.employment_status")}</p>}
</FormField>
<FormField label="Profession / Activité" icon={Briefcase} required hint="ex: Infirmier, Commerçant">
  <input className=STYLES.input value={responsable.profession_detail || ""} onChange={(e) => setResponsable({...responsable, profession_detail: e.target.value})} />
</FormField>
```

**Grid md:grid-cols-2**

**3. Validation Step 2 + ajouterMembre**:

```
if (!responsable.employment_status) newErrors["responsable.employment_status"] = "Statut d'emploi requis";
if (!responsable.profession_detail) newErrors["responsable.profession_detail"] = "Profession requise";
```

Même pour membreTemp.

**4. Reset states** (Step 4 success):

```
employment_status: "",
profession_detail: "",
```

**5. Vérification Step 4**:

```
<li><strong>Statut d'emploi:</strong> {responsable.employment_status || "N/A"}</li>
```

## 📋 Steps à compléter (priorité haute)

- [ ]   1. Créer TODO.md ✅
- [ ]   2. Edit RegisterFamille.jsx
- [ ]   3. Edit RegisterConducteur.jsx
- [ ]   4. Edit RegisterPasteur.jsx
- [ ]   5. `npm run dev`
- [ ]   6. Tester /admin/inscriptions/register-famille etc.

**Temps estimé**: 15min

**Procéder ?**
