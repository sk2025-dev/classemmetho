import React from "react";
import { CalendarDays, MapPin, Clock, Trash2, Plus, Lock } from "lucide-react";
import {
    emptyProgrammeRow,
    isIntervalRow,
    formatProgrammeRow,
} from "./programmeObseques";

/**
 * Éditeur du programme d'obsèques : lignes répétables
 *   { date_debut, date_fin (intervalle), heure, libelle, lieu }
 *
 * Props :
 *  - value      : Row[]                    (contrôlé)
 *  - onChange   : (rows: Row[]) => void
 *  - disabled   : bool   → rendu lecture seule (programme clôturé)
 *  - errors     : { "0.date_debut": "…" }
 *  - closedNote : string affiché quand disabled
 */
export default function ProgrammeObsequesEditor({
    value = [],
    onChange,
    disabled = false,
    errors = {},
    closedNote = "Programme clôturé par le conducteur — modification impossible.",
}) {
    const rows = Array.isArray(value) ? value : [];

    const update = (index, key, val) => {
        const next = rows.map((r, i) => (i === index ? { ...r, [key]: val } : r));
        onChange?.(next);
    };

    const setInterval = (index, checked) => {
        const next = rows.map((r, i) =>
            i === index
                ? {
                      ...r,
                      _interval: checked,
                      date_fin: checked ? r.date_fin || r.date_debut || "" : "",
                  }
                : r,
        );
        onChange?.(next);
    };

    const addRow = () => onChange?.([...rows, emptyProgrammeRow()]);
    const removeRow = (index) => onChange?.(rows.filter((_, i) => i !== index));

    /* ---------- Lecture seule (clôturé) ---------- */
    if (disabled) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Lock size={14} /> Programme d'obsèques
                </div>
                {rows.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune étape renseignée.</p>
                ) : (
                    <ul className="space-y-2">
                        {rows.map((r, i) => (
                            <li
                                key={i}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            >
                                {formatProgrammeRow(r) || "—"}
                            </li>
                        ))}
                    </ul>
                )}
                <p className="mt-3 text-xs italic text-amber-700">{closedNote}</p>
            </div>
        );
    }

    /* ---------- Édition ---------- */
    return (
        <div className="space-y-3">
            {rows.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Aucune étape. Cliquez sur « Ajouter une étape » pour composer le programme
                    (levée du corps, veillée, culte, inhumation…).
                </p>
            )}

            {rows.map((row, i) => {
                const interval = !!row._interval || isIntervalRow(row);
                const err = (k) => errors[`${i}.${k}`];
                return (
                    <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                Étape {i + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={13} /> Retirer
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Désignation / libellé *
                                </span>
                                <input
                                    type="text"
                                    value={row.libelle || ""}
                                    maxLength={255}
                                    onChange={(e) => update(i, "libelle", e.target.value)}
                                    placeholder="Ex. Veillée de prière, Levée du corps, Culte d'action de grâce…"
                                />
                                {err("libelle") && (
                                    <span className="mt-1 block text-xs text-red-600">{err("libelle")}</span>
                                )}
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                                <input
                                    type="checkbox"
                                    style={{ width: "auto" }}
                                    checked={interval}
                                    onChange={(e) => setInterval(i, e.target.checked)}
                                />
                                Sur plusieurs jours (intervalle « du … au … », même libellé et même heure)
                            </label>

                            <div className={`grid grid-cols-1 gap-3 ${interval ? "sm:grid-cols-2" : ""}`}>
                                <label className="block">
                                    <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <CalendarDays size={12} /> {interval ? "Du *" : "Date *"}
                                    </span>
                                    <input
                                        type="date"
                                        value={row.date_debut || ""}
                                        onChange={(e) => update(i, "date_debut", e.target.value)}
                                    />
                                    {err("date_debut") && (
                                        <span className="mt-1 block text-xs text-red-600">{err("date_debut")}</span>
                                    )}
                                </label>

                                {interval && (
                                    <label className="block">
                                        <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            <CalendarDays size={12} /> Au
                                        </span>
                                        <input
                                            type="date"
                                            value={row.date_fin || ""}
                                            min={row.date_debut || undefined}
                                            onChange={(e) => update(i, "date_fin", e.target.value)}
                                        />
                                        {err("date_fin") && (
                                            <span className="mt-1 block text-xs text-red-600">{err("date_fin")}</span>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <Clock size={12} /> Heure {interval ? "de début" : ""}
                                    </span>
                                    <input
                                        type="time"
                                        value={row.heure || ""}
                                        onChange={(e) => update(i, "heure", e.target.value)}
                                    />
                                    {err("heure") && (
                                        <span className="mt-1 block text-xs text-red-600">{err("heure")}</span>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <Clock size={12} /> Heure de fin
                                        <span className="font-normal normal-case tracking-normal text-slate-400">(optionnel)</span>
                                    </span>
                                    <input
                                        type="time"
                                        value={row.heure_fin || ""}
                                        onChange={(e) => update(i, "heure_fin", e.target.value)}
                                    />
                                    {err("heure_fin") && (
                                        <span className="mt-1 block text-xs text-red-600">{err("heure_fin")}</span>
                                    )}
                                </label>
                            </div>

                            <label className="block">
                                <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <MapPin size={12} /> Lieu
                                </span>
                                <textarea
                                    rows={2}
                                    value={row.lieu || ""}
                                    maxLength={500}
                                    onChange={(e) => update(i, "lieu", e.target.value)}
                                    placeholder="Ex. Domicile familial à Cocody Angré, Temple Central…"
                                />
                                {err("lieu") && (
                                    <span className="mt-1 block text-xs text-red-600">{err("lieu")}</span>
                                )}
                            </label>
                        </div>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={addRow}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 hover:border-slate-400 hover:bg-slate-100"
            >
                <Plus size={16} /> Ajouter une étape
            </button>
        </div>
    );
}
