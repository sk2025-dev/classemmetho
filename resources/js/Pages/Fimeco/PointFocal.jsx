import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Edit3,
    Eye,
    Landmark,
    Loader2,
    Search,
    Trophy,
    Users,
    X,
    XCircle,
} from "lucide-react";
import { withBasePath } from "../../Utils/urlHelper";

const formatAmount = (value) =>
    `${new Intl.NumberFormat("fr-FR").format(Number(value) || 0)} F CFA`;

const statusStyles = {
    "A JOUR": "bg-emerald-100 text-emerald-800",
    "EN RETARD": "bg-red-100 text-red-800",
    "NON SOUSCRIT": "bg-slate-100 text-slate-600",
};

const statusLabels = {
    "A JOUR": "À jour",
    "EN RETARD": "En retard",
    "NON SOUSCRIT": "Non souscrit",
};

const progressTone = (pct) => {
    const value = Number(pct) || 0;
    if (value >= 100) return "bg-emerald-500";
    if (value >= 50) return "bg-amber-500";
    return "bg-red-500";
};

const MODE_OPTIONS = [
    { value: "ESPECES", label: "Espèces" },
    { value: "VIREMENT", label: "Virement" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "MOBILE_MONEY", label: "Mobile Money" },
];

const rankOrdinal = (rank) => (rank === 1 ? "1er" : `${rank}e`);
const rankBadgeStyle = (rank) =>
    ({
        1: "bg-amber-400 text-white shadow-sm shadow-amber-200",
        2: "bg-slate-300 text-slate-800",
        3: "bg-orange-300 text-orange-950",
    })[rank] || "bg-slate-100 text-slate-500";
const RANG_CRITERES = [
    {
        key: "taux_recouvrement",
        field: "rang_taux_recouvrement",
        label: "Taux de recouvrement",
        detail: "Rang sur le pourcentage versé par rapport aux souscriptions.",
    },
    {
        key: "montant_souscrit",
        field: "rang_montant_souscrit",
        label: "Montant souscrit",
        detail: "Rang sur le montant total souscrit par les familles de la classe.",
    },
    {
        key: "nombre_souscripteurs",
        field: "rang_nombre_souscripteurs",
        label: "Nombre de souscripteurs",
        detail: "Rang sur le nombre de familles ayant souscrit.",
    },
];

function StatCard({ label, value, detail, icon: Icon, color }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
    };
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
                </div>
                <div className={`rounded-xl border p-3 ${colors[color] || colors.indigo}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function FimecoPointFocal({
    classeNom = "Ma classe",
    fimecoSuivi = [],
    fimecoAnnee = new Date().getFullYear(),
    fimecoAnneesDisponibles = [new Date().getFullYear()],
    fimecoKpi = {
        montant_cible: 0,
        montant_paye: 0,
        montant_restant: 0,
        taux_recouvrement: 0,
        familles_total: 0,
        familles_a_jour: 0,
        familles_en_retard: 0,
        familles_non_souscrit: 0,
    },
    fimecoRang = {
        total_classes: 0,
        rang_montant_souscrit: null,
        rang_taux_recouvrement: null,
        rang_nombre_souscripteurs: null,
    },
    fimecoVersements = { data: [], current_page: 1, last_page: 1, total: 0, per_page: 20 },
}) {
    const [search, setSearch] = useState("");
    const [statutFilter, setStatutFilter] = useState("TOUS");
    const [tauxFilter, setTauxFilter] = useState("TOUS");
    const [rangCritere, setRangCritere] = useState("taux_recouvrement");
    const [editing, setEditing] = useState(null);
    const [montantInput, setMontantInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [versementSearch, setVersementSearch] = useState("");
    const [versementMode, setVersementMode] = useState("");
    const [familyDetails, setFamilyDetails] = useState(null);
    const [familyDetailsLoading, setFamilyDetailsLoading] = useState(false);
    const isFirstVersementRender = useRef(true);

    const changeYear = (value) => {
        setVersementSearch("");
        setVersementMode("");
        router.get(
            withBasePath("", "/fimeco/classe"),
            { fimeco_annee: value },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["fimecoSuivi", "fimecoAnnee", "fimecoAnneesDisponibles", "fimecoKpi", "fimecoRang", "fimecoVersements"],
            },
        );
    };

    const reloadVersements = (overrides = {}) => {
        router.get(
            withBasePath("", "/fimeco/classe"),
            {
                fimeco_annee: fimecoAnnee,
                versement_q: versementSearch,
                versement_mode: versementMode,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true, only: ["fimecoVersements"] },
        );
    };

    // Recherche texte : requête différée (debounce) pour éviter une requête par frappe.
    useEffect(() => {
        if (isFirstVersementRender.current) {
            isFirstVersementRender.current = false;
            return;
        }
        const handle = window.setTimeout(() => {
            reloadVersements({ versement_page: 1 });
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [versementSearch]);

    const handleVersementModeChange = (event) => {
        const value = event.target.value;
        setVersementMode(value);
        reloadVersements({ versement_mode: value, versement_page: 1 });
    };

    const goToVersementPage = (nextPage) => {
        reloadVersements({ versement_page: nextPage });
    };

    const loadFamilyVersements = async (familyId, page = 1) => {
        setFamilyDetailsLoading(true);
        try {
            const response = await axios.get(
                withBasePath("", `/fimeco/classe/familles/${familyId}/versements`),
                { params: { annee: fimecoAnnee, page } },
            );
            setFamilyDetails(response.data);
        } catch (error) {
            setFamilyDetails((current) =>
                current
                    ? {
                          ...current,
                          versements: { data: [], current_page: 1, last_page: 1, total: 0 },
                          loadError: true,
                      }
                    : current,
            );
        } finally {
            setFamilyDetailsLoading(false);
        }
    };
    const viewFamilyDetails = (item) => {
        setFamilyDetails({ family_id: item.family_id, famille: item.famille, code_famille: item.code_famille, versements: null });
        loadFamilyVersements(item.family_id, 1);
    };
    const goToFamilyVersementsPage = (nextPage) => {
        if (!familyDetails) return;
        loadFamilyVersements(familyDetails.family_id, nextPage);
    };
    const closeFamilyDetails = () => setFamilyDetails(null);

    const pctOf = (item) =>
        item.montant_cible > 0 ? Math.round((item.montant_paye / item.montant_cible) * 100) : 0;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return fimecoSuivi.filter((item) => {
            if (q) {
                const match =
                    (item.famille || "").toLowerCase().includes(q) ||
                    (item.code_famille || "").toLowerCase().includes(q);
                if (!match) return false;
            }
            if (statutFilter !== "TOUS" && item.statut !== statutFilter) return false;
            if (tauxFilter !== "TOUS") {
                const pct = pctOf(item);
                if (tauxFilter === "0" && pct !== 0) return false;
                if (tauxFilter === "1-49" && (pct < 1 || pct > 49)) return false;
                if (tauxFilter === "50-99" && (pct < 50 || pct > 99)) return false;
                if (tauxFilter === "100" && pct < 100) return false;
            }
            return true;
        });
    }, [fimecoSuivi, search, statutFilter, tauxFilter]);

    const openEdit = (item) => {
        setEditing(item);
        setMontantInput(String(item.montant_souscrit || ""));
        setFeedback(null);
    };

    const submitSouscription = async () => {
        if (!editing) return;
        const montant = parseInt(montantInput, 10);
        if (Number.isNaN(montant) || montant < 0) {
            setFeedback({ type: "error", message: "Montant invalide." });
            return;
        }
        try {
            setSaving(true);
            await axios.post(withBasePath("", "/fimeco/classe/souscription"), {
                family_id: editing.family_id,
                montant_souscrit: montant,
            });
            setEditing(null);
            router.reload({ only: ["fimecoSuivi", "fimecoKpi", "fimecoRang"] });
        } catch (e) {
            setFeedback({
                type: "error",
                message: e?.response?.data?.message || "Échec de l'enregistrement.",
            });
        } finally {
            setSaving(false);
        }
    };

    const anneeOptions = (fimecoAnneesDisponibles || []).map((a) => ({ value: String(a), label: String(a) }));

    return (
        <>
            <Head title="Point Focal FIMECO" />
            <div className="min-h-screen bg-slate-50/95 py-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Link
                                href={withBasePath("", "/dashboard")}
                                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"
                            >
                                <ArrowLeft size={16} /> Retour au tableau de bord
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
                                    <Landmark size={28} />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Point Focal FIMECO</h1>
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                            Classe {classeNom}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Suivi FIMECO limité aux familles de votre classe.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-40">
                            <Field label="Exercice suivi">
                                <select
                                    value={String(fimecoAnnee)}
                                    onChange={(e) => changeYear(e.target.value)}
                                    className={inputClass}
                                >
                                    {anneeOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Cible FIMECO"
                            value={formatAmount(fimecoKpi.montant_cible)}
                            detail={`${fimecoKpi.familles_total} famille(s) de la classe`}
                            icon={Banknote}
                            color="indigo"
                        />
                        <StatCard
                            label="Montant versé"
                            value={formatAmount(fimecoKpi.montant_paye)}
                            detail={`Reste ${formatAmount(fimecoKpi.montant_restant)}`}
                            icon={CheckCircle2}
                            color="emerald"
                        />
                        <StatCard
                            label="Taux de recouvrement"
                            value={`${fimecoKpi.taux_recouvrement}%`}
                            detail={`${fimecoKpi.familles_a_jour} à jour · ${fimecoKpi.familles_en_retard} en retard`}
                            icon={Users}
                            color={fimecoKpi.taux_recouvrement >= 100 ? "emerald" : fimecoKpi.taux_recouvrement >= 50 ? "amber" : "blue"}
                        />
                        <StatCard
                            label="Classement inter-classes"
                            value={
                                fimecoRang.rang_taux_recouvrement
                                    ? `${rankOrdinal(fimecoRang.rang_taux_recouvrement)} / ${fimecoRang.total_classes}`
                                    : "Non classée"
                            }
                            detail={fimecoRang.rang_taux_recouvrement ? "sur le taux de recouvrement" : "aucune donnée enregistrée"}
                            icon={Trophy}
                            color="amber"
                        />
                    </div>

                    {fimecoRang.total_classes > 0 && (
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-slate-800">
                                    Mon classement · FIMECO {fimecoAnnee}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Position de votre classe uniquement — les autres classes ne sont pas affichées.
                                </p>
                            </div>
                            <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                {RANG_CRITERES.map((c) => (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => setRangCritere(c.key)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                            rangCritere === c.key
                                                ? "bg-white text-indigo-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            {(() => {
                                const rang = fimecoRang[RANG_CRITERES.find((c) => c.key === rangCritere)?.field];
                                return (
                                    <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4">
                                        <span
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${rankBadgeStyle(rang)}`}
                                        >
                                            {rang ?? "–"}
                                        </span>
                                        <div>
                                            <p className="text-base font-black text-indigo-700">
                                                Classe {classeNom}{" "}
                                                {rang ? (
                                                    <>
                                                        · {rankOrdinal(rang)} / {fimecoRang.total_classes}
                                                    </>
                                                ) : (
                                                    "· non classée"
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {RANG_CRITERES.find((c) => c.key === rangCritere)?.detail}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h2 className="text-sm font-black text-slate-800">
                                Suivi FIMECO par famille · Souscription {fimecoAnnee}
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-3 px-5 py-4">
                            <div className="relative w-full max-w-xs">
                                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher par code famille ou par nom…"
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className={`${inputClass} w-auto`}>
                                <option value="TOUS">Tous les statuts</option>
                                <option value="A JOUR">À jour</option>
                                <option value="EN RETARD">En retard</option>
                                <option value="NON SOUSCRIT">Non souscrit</option>
                            </select>
                            <select value={tauxFilter} onChange={(e) => setTauxFilter(e.target.value)} className={`${inputClass} w-auto`}>
                                <option value="TOUS">Tous les taux de recouvrement</option>
                                <option value="0">0% versé</option>
                                <option value="1-49">1 à 49% versé</option>
                                <option value="50-99">50 à 99% versé</option>
                                <option value="100">100% versé (soldé)</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3">Code famille</th>
                                        <th className="px-5 py-3">Famille</th>
                                        <th className="px-5 py-3 text-right">Cible</th>
                                        <th className="px-5 py-3 text-right">Payé</th>
                                        <th className="px-5 py-3 text-right">Reste</th>
                                        <th className="px-5 py-3 text-center">Progression</th>
                                        <th className="px-5 py-3 text-center">Statut</th>
                                        <th className="px-5 py-3 text-center">Versements</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">
                                                Aucun suivi FIMECO disponible.
                                            </td>
                                        </tr>
                                    )}
                                    {filtered.map((item) => {
                                        const pct = pctOf(item);
                                        return (
                                            <tr key={item.family_id} className="border-b border-slate-50 last:border-0">
                                                <td className="px-5 py-3 text-slate-500">{item.code_famille || "-"}</td>
                                                <td className="px-5 py-3 font-semibold text-slate-800">{item.famille}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {formatAmount(item.montant_cible)}
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(item)}
                                                            title="Définir la souscription de la famille"
                                                            className="text-amber-500 hover:text-amber-600"
                                                        >
                                                            <Edit3 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                                                    {formatAmount(item.montant_paye)}
                                                </td>
                                                <td className={`px-5 py-3 text-right font-semibold ${item.montant_restant > 0 ? "text-red-600" : "text-emerald-700"}`}>
                                                    {formatAmount(item.montant_restant)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="mx-auto w-20">
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className={`h-full rounded-full ${progressTone(pct)}`}
                                                                style={{ width: `${Math.min(100, pct)}%` }}
                                                            />
                                                        </div>
                                                        <p className="mt-1 text-center text-[10px] text-slate-400">{pct}%</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[item.statut] || statusStyles["NON SOUSCRIT"]}`}>
                                                        {statusLabels[item.statut] || item.statut}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => viewFamilyDetails(item)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                                                        title="Voir le détail des versements"
                                                    >
                                                        <Eye size={14} /> Détails
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="font-black text-slate-900">Versements de {fimecoAnnee}</h2>
                            <p className="text-xs text-slate-500">
                                {fimecoVersements.total || 0} versement(s) confirmé(s)
                                {(versementSearch || versementMode) ? " correspondant aux filtres." : "."}
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="relative">
                                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={versementSearch}
                                        onChange={(e) => setVersementSearch(e.target.value)}
                                        placeholder="Famille, code, référence, note…"
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                                <select value={versementMode} onChange={handleVersementModeChange} className={inputClass}>
                                    <option value="">Tous les modes</option>
                                    {MODE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Famille</th>
                                        <th className="px-5 py-3">Mode</th>
                                        <th className="px-5 py-3 text-right">Montant</th>
                                        <th className="px-5 py-3">Référence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(fimecoVersements.data || []).map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-5 py-3">{payment.date || "-"}</td>
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-900">{payment.famille}</div>
                                                <div className="text-xs text-slate-500">{payment.code_famille || ""}</div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{String(payment.mode || "-").replaceAll("_", " ")}</td>
                                            <td className="px-5 py-3 text-right font-black text-emerald-700">{formatAmount(payment.montant)}</td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{payment.reference || "-"}</td>
                                        </tr>
                                    ))}
                                    {(fimecoVersements.data || []).length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                                                {(versementSearch || versementMode) ? "Aucun versement ne correspond aux filtres." : "Aucun versement confirmé pour cet exercice."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {fimecoVersements.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
                                <span className="text-slate-500">
                                    Page {fimecoVersements.current_page} sur {fimecoVersements.last_page}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={fimecoVersements.current_page <= 1}
                                        onClick={() => goToVersementPage(fimecoVersements.current_page - 1)}
                                        className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40"
                                    >
                                        Précédent
                                    </button>
                                    <button
                                        type="button"
                                        disabled={fimecoVersements.current_page >= fimecoVersements.last_page}
                                        onClick={() => goToVersementPage(fimecoVersements.current_page + 1)}
                                        className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40"
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {familyDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                            <div>
                                <h3 className="text-base font-black text-slate-900">{familyDetails.famille}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {familyDetails.code_famille || "Sans code"} · Exercice {familyDetails.annee || fimecoAnnee}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFamilyDetails}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {familyDetails.montant_souscrit !== undefined && (
                            <div className="grid grid-cols-3 gap-3 p-5 pb-0 text-center">
                                <div className="rounded-xl bg-indigo-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">Souscrit</p>
                                    <p className="mt-1 text-sm font-black text-indigo-700">{formatAmount(familyDetails.montant_souscrit)}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Versé</p>
                                    <p className="mt-1 text-sm font-black text-emerald-700">{formatAmount(familyDetails.montant_paye)}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Reste</p>
                                    <p className="mt-1 text-sm font-black text-amber-700">{formatAmount(familyDetails.montant_restant)}</p>
                                </div>
                            </div>
                        )}
                        <div className="p-5">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Détail des versements</h4>
                            {familyDetailsLoading && (
                                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                                    <Loader2 className="animate-spin" size={16} /> Chargement…
                                </div>
                            )}
                            {!familyDetailsLoading && familyDetails.loadError && (
                                <p className="py-4 text-sm text-red-600">Impossible de charger les versements de cette famille.</p>
                            )}
                            {!familyDetailsLoading && !familyDetails.loadError && familyDetails.versements && (
                                <>
                                    <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                                        {familyDetails.versements.data.length === 0 && (
                                            <p className="p-4 text-center text-sm text-slate-400">
                                                Aucun versement enregistré pour cet exercice.
                                            </p>
                                        )}
                                        {familyDetails.versements.data.map((v) => (
                                            <div key={v.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{v.date || "-"}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {String(v.mode || "-").replaceAll("_", " ")}
                                                        {v.reference ? ` · ${v.reference}` : ""}
                                                    </p>
                                                    {v.note && <p className="text-xs italic text-slate-400">{v.note}</p>}
                                                </div>
                                                <span className="shrink-0 font-black text-emerald-700">{formatAmount(v.montant)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {familyDetails.versements.last_page > 1 && (
                                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                            <span>
                                                Page {familyDetails.versements.current_page} sur {familyDetails.versements.last_page}
                                                {" "}({familyDetails.versements.total} versement(s))
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={familyDetails.versements.current_page <= 1}
                                                    onClick={() => goToFamilyVersementsPage(familyDetails.versements.current_page - 1)}
                                                    className="rounded-lg border border-slate-300 px-2.5 py-1 font-semibold disabled:opacity-40"
                                                >
                                                    Précédent
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={familyDetails.versements.current_page >= familyDetails.versements.last_page}
                                                    onClick={() => goToFamilyVersementsPage(familyDetails.versements.current_page + 1)}
                                                    className="rounded-lg border border-slate-300 px-2.5 py-1 font-semibold disabled:opacity-40"
                                                >
                                                    Suivant
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-base font-black text-slate-900">Souscription FIMECO</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Montant que <strong>{editing.famille}</strong> s'engage à verser pour la FIMECO {fimecoAnnee}.
                        </p>
                        <input
                            type="number"
                            min="0"
                            value={montantInput}
                            onChange={(e) => setMontantInput(e.target.value)}
                            className={`${inputClass} mt-4`}
                            placeholder="Montant en F CFA"
                            autoFocus
                        />
                        {feedback?.type === "error" && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                <XCircle size={13} /> {feedback.message}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={submitSouscription}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving && <Loader2 className="animate-spin" size={15} />}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
