// Statuts de cotisation par membre de tribu, calculés côté serveur
// (Conducteur\TribuController::buildFinancesDataForMembers).
export const STATUT_BADGES = {
    A_JOUR: { label: "À jour", className: "bg-green-100 text-green-700" },
    EN_COURS: { label: "En cours", className: "bg-sky-100 text-sky-700" },
    EN_ATTENTE: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    AUCUNE_DONNEE: { label: "Aucune donnée", className: "bg-gray-100 text-gray-500" },
};

export const getStatutBadge = (statut) =>
    STATUT_BADGES[statut] || STATUT_BADGES.AUCUNE_DONNEE;
