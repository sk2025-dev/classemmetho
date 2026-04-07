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
    { value: "pere", label: "Pere" },
    { value: "mere", label: "Mere" },
    { value: "grandpere", label: "Grand-pere" },
    { value: "grandmere", label: "Grand-mere" },
    { value: "fils", label: "Fils" },
    { value: "fille", label: "Fille" },
    { value: "frere", label: "Frere" },
    { value: "soeur", label: "Soeur" },
    { value: "oncle", label: "Oncle" },
    { value: "tante", label: "Tante" },
    { value: "cousin", label: "Cousin" },
    { value: "cousine", label: "Cousine" },
    { value: "epoux", label: "Epoux" },
    { value: "epouse", label: "Epouse" },
    { value: "beaupere", label: "Beau-pere" },
    { value: "bellemere", label: "Belle-mere" },
    { value: "beaufils", label: "Beau-fils" },
    { value: "beaufille", label: "Belle-fille" },
    { value: "tuteur", label: "Tuteur" },
    { value: "tutrice", label: "Tutrice" },
    { value: "ami", label: "Ami de la famille" },
    { value: "neveu", label: "Neveu" },
    { value: "niece", label: "Niece" },
    { value: "demi_frere", label: "Demi-frere" },
    { value: "demi_soeur", label: "Demi-soeur" },
    { value: "petit_fils", label: "Petit-fils" },
    { value: "petite_fille", label: "Petite-fille" },
    { value: "arriere_grandpere", label: "Arriere-grand-pere" },
    { value: "arriere_grandmere", label: "Arriere-grand-mere" },
    { value: "beau_frere", label: "Beau-frere" },
    { value: "belle_soeur", label: "Belle-soeur" },
    { value: "gendre", label: "Gendre" },
    { value: "bru", label: "Bru" },
    { value: "conjoint", label: "Conjoint(e)" },
    { value: "parrain", label: "Parrain" },
    { value: "marraine", label: "Marraine" },
    { value: "responsable", label: "Responsable" },
    { value: "chef_famille", label: "Chef de famille" },
    { value: "autre", label: "Autre" },
];

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
