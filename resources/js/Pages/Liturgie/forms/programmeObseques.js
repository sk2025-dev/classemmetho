/**
 * Helpers partagés pour le "programme d'obsèques" structuré d'une annonce de
 * décès (lignes répétables : date ou intervalle du…au, heure, libellé, lieu).
 * Utilisé par ProgrammeObsequesEditor + les vues Liturgie (RF / MF / Conducteur
 * / Pasteur / Président).
 */

export const PROGRAMME_STATUT = { OUVERT: "OUVERT", CLOS: "CLOS" };

export function emptyProgrammeRow() {
    return {
        date_debut: "",
        date_fin: "",
        heure: "",
        heure_fin: "",
        libelle: "",
        lieu: "",
    };
}

export function isIntervalRow(row) {
    return !!row?.date_fin && String(row.date_fin) !== String(row.date_debut);
}

/** Normalise une ligne venue du backend (dates ISO longues → "YYYY-MM-DD"). */
export function normalizeRowFromServer(row = {}) {
    const slice = (v) => (v ? String(v).slice(0, 10) : "");
    return {
        date_debut: slice(row.date_debut),
        date_fin: slice(row.date_fin),
        heure: row.heure ? String(row.heure).slice(0, 5) : "",
        heure_fin: row.heure_fin ? String(row.heure_fin).slice(0, 5) : "",
        libelle: row.libelle || "",
        lieu: row.lieu || "",
        _interval: !!row.date_fin && String(row.date_fin) !== String(row.date_debut),
    };
}

/**
 * Valide un tableau de lignes côté client (miroir des règles serveur).
 * @returns {{ valid: boolean, errors: Record<string,string>, cleaned: Array }}
 */
export function validateProgrammeRows(rows) {
    const errors = {};
    const cleaned = [];

    (rows || []).forEach((raw, i) => {
        const row = {
            date_debut: (raw.date_debut || "").trim(),
            date_fin: (raw.date_fin || "").trim(),
            heure: (raw.heure || "").trim(),
            heure_fin: (raw.heure_fin || "").trim(),
            libelle: (raw.libelle || "").trim(),
            lieu: (raw.lieu || "").trim(),
        };

        // Ligne totalement vide → ignorée
        if (!row.date_debut && !row.libelle) return;

        const pad = (t) => {
            const [h, m] = t.split(":");
            return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
        };
        const timeOk = (t) => /^\d{1,2}:\d{2}$/.test(t);

        if (!row.date_debut) errors[`${i}.date_debut`] = "La date est requise.";
        if (!row.libelle) errors[`${i}.libelle`] = "La désignation est requise.";
        if (row.libelle.length > 255)
            errors[`${i}.libelle`] = "255 caractères maximum.";
        if (row.date_fin && row.date_debut && row.date_fin < row.date_debut)
            errors[`${i}.date_fin`] =
                "La date de fin doit être postérieure ou égale à la date de début.";
        if (row.heure && !timeOk(row.heure))
            errors[`${i}.heure`] = "Heure au format HH:MM.";
        if (row.heure_fin && !timeOk(row.heure_fin))
            errors[`${i}.heure_fin`] = "Heure au format HH:MM.";
        if (
            row.heure &&
            row.heure_fin &&
            timeOk(row.heure) &&
            timeOk(row.heure_fin) &&
            pad(row.heure_fin) < pad(row.heure)
        )
            errors[`${i}.heure_fin`] =
                "L'heure de fin doit être après l'heure de début.";
        if (row.lieu.length > 500) errors[`${i}.lieu`] = "500 caractères maximum.";

        if (row.date_fin && row.date_fin === row.date_debut) row.date_fin = "";
        if (row.heure && timeOk(row.heure)) row.heure = pad(row.heure);
        if (row.heure_fin && timeOk(row.heure_fin)) row.heure_fin = pad(row.heure_fin);

        cleaned.push({
            date_debut: row.date_debut,
            date_fin: row.date_fin || null,
            heure: row.heure || null,
            heure_fin: row.heure_fin || null,
            libelle: row.libelle,
            lieu: row.lieu || null,
        });
    });

    return { valid: Object.keys(errors).length === 0, errors, cleaned };
}

const formatDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return d && m && y ? `${d}/${m}/${y}` : String(iso);
};

const formatHeure = (h) => {
    if (!h) return "";
    const [hh, mm] = String(h).slice(0, 5).split(":");
    return mm ? `${hh}h${mm}` : `${hh}h`;
};

/** "12/01/2026 → 14/01/2026 · 19h00–21h00 · Veillée · Domicile" */
export function formatProgrammeRow(row = {}) {
    const dates = isIntervalRow(row)
        ? `${formatDate(row.date_debut)} → ${formatDate(row.date_fin)}`
        : formatDate(row.date_debut);
    const heures = row.heure_fin
        ? `${formatHeure(row.heure)}–${formatHeure(row.heure_fin)}`
        : formatHeure(row.heure);
    return [dates, heures, row.libelle, row.lieu].filter(Boolean).join(" · ");
}

export function programmeStatutLabel(value) {
    return String(value || "OUVERT").toUpperCase() === "CLOS"
        ? "Clôturé"
        : "Ouvert";
}

/** Le programme est-il clôturé (depuis `acte.details` ou `acte.programme_est_clos`) ? */
export function programmeEstClos(acte) {
    if (!acte) return false;
    if (typeof acte.programme_est_clos === "boolean") return acte.programme_est_clos;
    return (
        String(acte.details?.programme_statut || "OUVERT").toUpperCase() === "CLOS"
    );
}
