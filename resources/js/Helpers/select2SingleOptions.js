export const GENDER_OPTIONS = [
    { value: "M", label: "Masculin" },
    { value: "F", label: "Feminin" },
];

export const EMPLOYMENT_STATUS_OPTIONS = [
    { value: "TRAVAILLEUR", label: "Travailleur(euse)" },
    { value: "RETRAITE", label: "Retraite(e)" },
    { value: "ETUDIANT", label: "Etudiant(e)" },
    { value: "SANS_EMPLOI", label: "Sans emploi" },
];

export const MARITAL_STATUS_OPTIONS = [
    { value: "celibataire", label: "Celibataire" },
    { value: "marie", label: "Marie(e)" },
    { value: "divorce", label: "Divorce(e)" },
    { value: "veuf", label: "Veuf(ve)" },
    { value: "dot", label: "Dot" },
];

export const MEMBER_MARITAL_STATUS_OPTIONS = [
    { value: "Célibataire", label: "Célibataire" },
    { value: "Marié(e)", label: "Marié(e)" },
    { value: "Divorcé(e)", label: "Divorcé(e)" },
    { value: "Veuf(ve)", label: "Veuf(ve)" },
    { value: "Dote", label: "Doté(e)" },
];

export const RESPONSABLE_MARITAL_STATUS_OPTIONS = MARITAL_STATUS_OPTIONS.filter(
    (option) => option.value !== "dot",
);

export const RELATION_OPTIONS = [
    { value: "Père", label: "Père" },
    { value: "Mère", label: "Mère" },
    { value: "Grand-père", label: "Grand-père" },
    { value: "Grand-mère", label: "Grand-mère" },
    { value: "Fils", label: "Fils" },
    { value: "Fille", label: "Fille" },
    { value: "Frère", label: "Frère" },
    { value: "Sœur", label: "Sœur" },
    { value: "Oncle", label: "Oncle" },
    { value: "Tante", label: "Tante" },
    { value: "Cousin", label: "Cousin" },
    { value: "Cousine", label: "Cousine" },
    { value: "Époux", label: "Époux" },
    { value: "Épouse", label: "Épouse" },
    { value: "Beau-père", label: "Beau-père" },
    { value: "Belle-mère", label: "Belle-mère" },
    { value: "Beau-fils", label: "Beau-fils" },
    { value: "Belle-fille", label: "Belle-fille" },
    { value: "Tuteur", label: "Tuteur" },
    { value: "Tutrice", label: "Tutrice" },
    { value: "Ami de la famille", label: "Ami de la famille" },
    { value: "Neveu", label: "Neveu" },
    { value: "Nièce", label: "Nièce" },
    { value: "Demi-frère", label: "Demi-frère" },
    { value: "Demi-sœur", label: "Demi-sœur" },
    { value: "Petit-fils", label: "Petit-fils" },
    { value: "Petite-fille", label: "Petite-fille" },
    { value: "Arrière-grand-père", label: "Arrière-grand-père" },
    { value: "Arrière-grand-mère", label: "Arrière-grand-mère" },
    { value: "Beau-frère", label: "Beau-frère" },
    { value: "Belle-sœur", label: "Belle-sœur" },
    { value: "Gendre", label: "Gendre" },
    { value: "Conjoint(e)", label: "Conjoint(e)" },
    { value: "Parrain", label: "Parrain" },
    { value: "Marraine", label: "Marraine" },
    { value: "Responsable", label: "Responsable" },
    { value: "Chef de famille", label: "Chef de famille" },
    { value: "Autre", label: "Autre" },
];

/** Libellé affiché pour une valeur de relation (slug ancien ou libellé propre). */
export const relationLabelFromValue = (value) => {
    if (!value) return "";
    const raw = String(value).trim();
    const normalized = raw.toLowerCase();
    // Correspondance exacte ou normalisée
    const match = RELATION_OPTIONS.find(
        (option) =>
            option.value === raw ||
            option.value.toLowerCase() === normalized ||
            option.label.toLowerCase() === normalized,
    );
    if (match) return match.label;
    // Fallback : anciens slugs sans accents (ex: "pere" → "Père")
    const SLUG_MAP = {
        "pere":"Père","mere":"Mère","grandpere":"Grand-père","grandmere":"Grand-mère",
        "fils":"Fils","fille":"Fille","frere":"Frère","soeur":"Sœur",
        "oncle":"Oncle","tante":"Tante","cousin":"Cousin","cousine":"Cousine",
        "epoux":"Époux","epouse":"Épouse","beaupere":"Beau-père","bellemere":"Belle-mère",
        "beaufils":"Beau-fils","beaufille":"Belle-fille","tuteur":"Tuteur","tutrice":"Tutrice",
        "ami":"Ami de la famille","neveu":"Neveu","niece":"Nièce",
        "demi_frere":"Demi-frère","demi_soeur":"Demi-sœur",
        "petit_fils":"Petit-fils","petite_fille":"Petite-fille",
        "arriere_grandpere":"Arrière-grand-père","arriere_grandmere":"Arrière-grand-mère",
        "beau_frere":"Beau-frère","belle_soeur":"Belle-sœur",
        "gendre":"Gendre","conjoint":"Conjoint(e)",
        "parrain":"Parrain","marraine":"Marraine",
        "responsable":"Responsable","chef_famille":"Chef de famille","autre":"Autre",
    };
    return SLUG_MAP[normalized] ?? raw;
};

export const buildClasseOptions = (classes = []) =>
    classes.map((option) => ({
        value: option.id,
        label: option.nom,
    }));

export const buildVilleOptions = (villes = []) =>
    villes.map((option) => ({
        value: option.id,
        label: option.nom,
    }));
