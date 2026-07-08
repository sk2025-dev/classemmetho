import React, { useState, useEffect } from "react";
import axios from "axios";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    FileText, Loader2, Eye, Search,
} from "lucide-react";

const HISTORIQUE_URL = withBasePath("", "/president-conducteurs/liturgie/historique");

const TYPE_OPTIONS = [
    { value: "", label: "Tous les types" },
    { value: "naissance", label: "Naissance" },
    { value: "deces", label: "Décès" },
    { value: "priere", label: "Prière d'intercession" },
    { value: "grace", label: "Action de grâce" },
    { value: "bapteme", label: "Baptême" },
    { value: "mariage", label: "Mariage" },
    { value: "premiere_communion", label: "Première communion" },
];

const STATUT_OPTIONS = [
    { value: "", label: "Tous les statuts" },
    { value: "TRANSMISE_AU_BUREAU_CONDUCTEUR", label: "En attente du président" },
    { value: "TRANSMISE_AU_PASTEUR", label: "Transmise au pasteur" },
    { value: "VALIDEE", label: "Validée" },
    { value: "PUBLIEE", label: "Publiée" },
    { value: "CELEBRE", label: "Célébré" },
    { value: "TERMINE", label: "Terminé" },
    { value: "ARCHIVEE", label: "Archivée" },
    { value: "REFUSEE_PAR_CONDUCTEUR", label: "Refusée par le conducteur" },
    { value: "REFUSEE_PAR_BUREAU_CONDUCTEUR", label: "Refusée par le président" },
    { value: "REFUSEE_PAR_PASTEUR", label: "Refusée par le pasteur" },
];

function statutBadgeClass(statut) {
    if (statut.startsWith("REFUSEE")) return "bg-red-50 text-red-600";
    if (["PUBLIEE", "VALIDEE", "CELEBRE", "TERMINE"].includes(statut)) return "bg-green-50 text-green-700";
    if (statut === "ARCHIVEE") return "bg-gray-100 text-gray-500";
    return "bg-amber-50 text-amber-700";
}

function prettyDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Pagination({ paginator, onPage }) {
    if (!paginator?.last_page || paginator.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-3 mt-4">
            <button
                disabled={!paginator.prev_page_url}
                onClick={() => onPage(paginator.current_page - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                ← Précédent
            </button>
            <span className="text-xs text-gray-500 font-medium">
                Page {paginator.current_page} / {paginator.last_page}
            </span>
            <button
                disabled={!paginator.next_page_url}
                onClick={() => onPage(paginator.current_page + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Suivant →
            </button>
        </div>
    );
}

const STEP_DEFS = [
    { key: "soumise", label: "Soumise", role: null, fallback: "conducteur_nom" },
    { key: "conducteur", label: "Validation du conducteur", role: "Conducteur de classe", fallback: "conducteur_nom" },
    { key: "bureau", label: "Bureau des Conducteurs", role: "Président des conducteurs", fallback: "bureau_conducteur_nom" },
    { key: "pasteur", label: "Validation du pasteur", role: "Pasteur", fallback: "pasteur_nom" },
];

const REFUSED_STEP_BY_STATUT = {
    REFUSEE_PAR_CONDUCTEUR: "conducteur",
    REFUSEE_PAR_BUREAU_CONDUCTEUR: "bureau",
    REFUSEE_PAR_PASTEUR: "pasteur",
};

const ACTIVE_STEP_BY_STATUT = {
    Soumise: "conducteur",
    EN_ATTENTE_CONDUCTEUR: "conducteur",
    TRANSMISE_AU_BUREAU_CONDUCTEUR: "bureau",
    TRANSMISE_AU_PASTEUR: "pasteur",
};

const FINAL_STATUTS = ["VALIDEE", "PUBLIEE", "CELEBRE", "TERMINE", "ARCHIVEE"];

function buildSteps(acte) {
    const chronologie = acte.chronologie || [];
    const refusedStepKey = REFUSED_STEP_BY_STATUT[acte.statut];
    const activeStepKey = ACTIVE_STEP_BY_STATUT[acte.statut];
    const isFinal = FINAL_STATUTS.includes(acte.statut);
    const refusedIndex = refusedStepKey ? STEP_DEFS.findIndex((s) => s.key === refusedStepKey) : -1;

    return STEP_DEFS.map((def, idx) => {
        const entry = def.role ? chronologie.find((c) => c.role === def.role) : chronologie[0];
        const isRefused = refusedIndex === idx;
        const beforeRefused = refusedIndex === -1 || idx < refusedIndex;
        const active = !isRefused && activeStepKey === def.key;
        const done = !isRefused && beforeRefused && (idx === 0 || !!entry || isFinal);

        return {
            label: def.label,
            done,
            active,
            refused: isRefused,
            date: entry?.date,
            acteur: entry?.acteur || acte[def.fallback] || null,
            motif: isRefused ? entry?.commentaire : null,
        };
    });
}

function StepDot({ step }) {
    let dotClass = "border-gray-300 text-gray-300";
    let content = "";
    if (step.done) {
        dotClass = "bg-[#4A7C5E] border-[#4A7C5E] text-white";
        content = "✓";
    } else if (step.refused) {
        dotClass = "bg-red-500 border-red-500 text-white";
        content = "✕";
    } else if (step.active) {
        dotClass = "border-amber-500 text-amber-500";
    }

    return (
        <div className="flex flex-col items-center text-center min-w-[110px]">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${dotClass}`}>
                {content}
            </div>
            <span className={`mt-1.5 text-xs font-semibold ${step.refused ? "text-red-600" : step.active ? "text-amber-600" : step.done ? "text-[#4A7C5E]" : "text-gray-400"}`}>
                {step.label}
            </span>
            <span className="text-[11px] text-gray-400 mt-0.5">
                {step.refused ? "Refusée" : step.active ? "En cours" : step.done ? prettyDate(step.date) : "En attente"}
            </span>
            {step.acteur && (step.done || step.refused) && (
                <span className="text-[11px] font-medium text-gray-600 mt-0.5 max-w-[120px]">{step.acteur}</span>
            )}
            {step.motif && (
                <span className="text-[11px] text-red-500 italic mt-0.5 max-w-[120px]">"{step.motif}"</span>
            )}
        </div>
    );
}

function StatusStepper({ acte }) {
    const steps = buildSteps(acte);
    return (
        <div className="flex items-start overflow-x-auto py-2">
            {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                    <StepDot step={step} />
                    {idx < steps.length - 1 && (
                        <div className="mt-3 text-gray-300 px-1 shrink-0">→</div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function TabHistoriqueActes() {
    const [actes, setActes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [type, setType] = useState("");
    const [statut, setStatut] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const handle = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);

        return () => clearTimeout(handle);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axios
            .get(HISTORIQUE_URL, { params: { type, statut, search, page } })
            .then((res) => {
                if (!cancelled) setActes(res.data);
            })
            .catch(() => {
                if (!cancelled) setError("Impossible de charger le suivi des actes.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [type, statut, search, page]);

    const items = actes?.data ?? [];

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-3 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Recherche</label>
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Nom du membre, référence..."
                            className="border rounded-md pl-7 pr-2 py-1 text-xs text-gray-700 w-56"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Type d'acte</label>
                    <select
                        value={type}
                        onChange={(e) => { setType(e.target.value); setPage(1); }}
                        className="border rounded-md px-2 py-1 text-xs text-gray-700"
                    >
                        {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Statut</label>
                    <select
                        value={statut}
                        onChange={(e) => { setStatut(e.target.value); setPage(1); }}
                        className="border rounded-md px-2 py-1 text-xs text-gray-700"
                    >
                        {STATUT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {loading && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Chargement...
                    </div>
                )}
                {error && <div className="text-xs text-red-500">{error}</div>}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Suivi des actes (naissance, décès, prière d'intercession, action de grâce, baptême, mariage, première communion)
                </h4>

                {!actes ? (
                    <div className="text-center text-sm text-gray-400 py-8">Chargement...</div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucun acte trouvé pour ces filtres.</p>
                ) : (
                    <div className="space-y-2">
                        {items.map((acte) => (
                            <div key={acte.id} className="border rounded-lg overflow-hidden">
                                <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-gray-900 text-sm">{acte.membre || "—"}</span>
                                        <span className="text-xs text-gray-400">{acte.reference}</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                            {acte.type_label}
                                        </span>
                                        {acte.classe && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                                {acte.classe}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutBadgeClass(acte.statut)}`}>
                                        {acte.statut_label}
                                    </span>
                                </div>

                                <div className="border-t px-3 py-3 bg-gray-50">
                                    <StatusStepper acte={acte} />
                                </div>

                                {acte.fiche_url && (
                                    <div className="border-t px-3 py-3">
                                        <a
                                            href={acte.fiche_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A7C5E] text-white text-xs font-semibold hover:bg-[#3d6a4f] transition-colors"
                                        >
                                            <Eye size={14} />
                                            Voir la fiche PDF
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Pagination paginator={actes} onPage={setPage} />
            </div>
        </div>
    );
}
