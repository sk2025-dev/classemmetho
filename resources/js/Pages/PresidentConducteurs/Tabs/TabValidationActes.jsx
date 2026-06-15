import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../../Utils/urlHelper";
import TabHistoriqueActes from "./TabHistoriqueActes";
import {
    CheckCircle, XCircle, Clock, FileText,
    ChevronDown, ChevronUp, AlertCircle, Send, RotateCcw,
    User, BookOpen, Calendar, Hash, Bell, RefreshCw, Search,
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────── */
const TYPE_LABELS = {
    bapteme:            "Baptême",
    mariage:            "Mariage",
    naissance:          "Naissance",
    deces:              "Décès",
    premiere_communion: "1ère Communion",
    grace:              "Action de grâce",
    priere:             "Prière d'intercession",
    generale:           "Prière générale",
    annonce:            "Annonce",
    annonce_liturgique: "Annonce liturgique",
    felicitations:      "Félicitations",
};

const TYPE_COLORS = {
    bapteme:            { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
    mariage:            { bg: "#fdf4ff", border: "#e9d5ff", text: "#7c3aed" },
    naissance:          { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    deces:              { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
    premiere_communion: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    default:            { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
};

function typeColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS.default;
}

function prettyDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function Pagination({ paginator, onPage }) {
    if (!paginator?.last_page || paginator.last_page <= 1) return null;
    const prev = paginator.prev_page_url;
    const next = paginator.next_page_url;
    return (
        <div className="flex items-center justify-center gap-3 mt-4">
            <button
                disabled={!prev}
                onClick={() => prev && onPage(prev)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                ← Précédent
            </button>
            <span className="text-xs text-gray-500 font-medium">
                Page {paginator.current_page} / {paginator.last_page}
            </span>
            <button
                disabled={!next}
                onClick={() => next && onPage(next)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Suivant →
            </button>
        </div>
    );
}

/* ─── ActeCard ────────────────────────────────────────── */
function ActeCard({ acte, onValidate, onRefuse, isProcessing, selected, onToggleSelect }) {
    const [expanded, setExpanded] = useState(false);
    const [motifRefus, setMotifRefus] = useState("");
    const [showRefuseForm, setShowRefuseForm] = useState(false);

    const type = (acte.type_acte || "").toLowerCase();
    const col = typeColor(type);
    const membre = acte.membre;
    const conducteurName = acte.conducteur
        ? `${acte.conducteur.prenom || ""} ${acte.conducteur.nom || ""}`.trim()
        : "—";

    const handleRefuse = () => {
        if (!motifRefus.trim()) return;
        onRefuse(acte.id, motifRefus);
        setShowRefuseForm(false);
        setMotifRefus("");
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${selected ? "ring-2 ring-purple-400" : ""}`}
            style={{ borderColor: selected ? "#a78bfa" : col.border }}
        >
            {/* Header */}
            <div
                className="flex items-start justify-between p-4 gap-3"
                style={{ borderBottom: `1px solid ${selected ? "#a78bfa" : col.border}` }}
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox sélection groupée */}
                    <label className="flex-shrink-0 mt-0.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => onToggleSelect(acte.id)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer accent-purple-600"
                        />
                    </label>
                    <span
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}
                    >
                        <BookOpen size={11} />
                        {TYPE_LABELS[type] || type}
                    </span>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">
                                {membre ? `${membre.prenom} ${membre.nom}` : "—"}
                            </span>
                            {acte.reference && (
                                <span className="text-xs text-gray-400 font-mono">#{acte.reference}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                            {acte.classe && (
                                <span className="flex items-center gap-1">
                                    <User size={10} />
                                    {acte.classe.nom}
                                </span>
                            )}
                            {conducteurName !== "—" && (
                                <span className="flex items-center gap-1">
                                    <Hash size={10} />
                                    Cond. : {conducteurName}
                                </span>
                            )}
                            {acte.date_souhaitee && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    {prettyDate(acte.date_souhaitee)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
                >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Détails expandable */}
            {expanded && acte.details && Object.keys(acte.details).length > 0 && (
                <div className="px-4 py-3 bg-gray-50 text-xs text-gray-600 border-b border-gray-100">
                    <div className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <FileText size={12} /> Détails
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(acte.details)
                            .filter(([k]) => !["fiche_conducteur_envoye", "fiche_pasteur_envoyee"].includes(k))
                            .slice(0, 10)
                            .map(([k, v]) => (
                                <div key={k} className="flex gap-1">
                                    <span className="text-gray-400 capitalize">{k.replace(/_/g, " ")} :</span>
                                    <span className="font-medium text-gray-700 truncate">
                                        {typeof v === "object" ? JSON.stringify(v) : String(v || "—")}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Note conducteur */}
            {expanded && acte.historiques?.length > 0 && (
                <div className="px-4 py-3 bg-blue-50 text-xs border-b border-blue-100">
                    <div className="font-semibold text-blue-700 mb-1">Note du conducteur</div>
                    {acte.historiques
                        .filter((h) => h.acteur?.role === "conducteur")
                        .slice(-1)
                        .map((h) => (
                            <p key={h.id} className="text-blue-600 italic">
                                {h.commentaire || "Aucune note."}
                            </p>
                        ))}
                </div>
            )}

            {/* Actions */}
            <div className="p-4 flex flex-col gap-3">
                {!showRefuseForm ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <a
                            href={withBasePath("", `/president-conducteurs/liturgie/${acte.id}/fiche-conducteur?preview=1`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText size={13} /> Fiche conducteur
                        </a>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={() => setShowRefuseForm(true)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                <XCircle size={14} /> Refuser
                            </button>
                            <button
                                onClick={() => onValidate(acte.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <Send size={14} />
                                {isProcessing ? "Traitement..." : "Valider → Pasteur"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-red-700">
                            Motif du refus <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={motifRefus}
                            onChange={(e) => setMotifRefus(e.target.value)}
                            rows={3}
                            placeholder="Expliquer le motif du refus..."
                            className="w-full text-sm border border-red-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => { setShowRefuseForm(false); setMotifRefus(""); }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRefuse}
                                disabled={isProcessing || !motifRefus.trim()}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                <XCircle size={13} /> Confirmer le refus
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── HistoriqueCard ──────────────────────────────────── */
function HistoriqueCard({ item }) {
    const isValidated = item.statut === "TRANSMISE_AU_PASTEUR";
    const type = (item.type_acte || "").toLowerCase();
    const col = typeColor(type);

    return (
        <div
            className="bg-white rounded-lg border p-3 flex items-start gap-3"
            style={{ borderColor: col.border }}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isValidated ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}>
                {isValidated ? <CheckCircle size={16} /> : <XCircle size={16} />}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                        {item.membre ? `${item.membre.prenom} ${item.membre.nom}` : "—"}
                    </span>
                    <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: col.bg, color: col.text }}
                    >
                        {TYPE_LABELS[type] || type}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    {isValidated ? "Transmis au Pasteur" : "Refusé par le Bureau"}
                    {item.validated_at && (
                        <span className="ml-2">{prettyDate(item.validated_at)}</span>
                    )}
                </div>
                {item.commentaire && (
                    <p className="text-xs text-gray-500 italic mt-0.5 truncate">
                        &ldquo;{item.commentaire}&rdquo;
                    </p>
                )}
            </div>
        </div>
    );
}

/* ─── Onglet Validation des actes ─────────────────────── */
export default function TabValidationActes({
    actes,
    historique = {},
    pendingCount = 0,
    validatedCount = 0,
    refusedCount = 0,
}) {
    const [localActes, setLocalActes] = useState(actes?.data ?? []);
    const [localPaginator, setLocalPaginator] = useState(actes);
    const [localHistorique, setLocalHistorique] = useState(historique?.data ?? []);
    const [localHistoriquePaginator, setLocalHistoriquePaginator] = useState(historique);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState("pending");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [newRequestsCount, setNewRequestsCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [historiqueSearch, setHistoriqueSearch] = useState("");
    const lastKnownCount = useRef(pendingCount);
    const pollingRef = useRef(null);

    // Sync local state when Inertia reloads props
    useEffect(() => {
        const incoming = actes?.data ?? [];
        const newPending = pendingCount;

        // Detect new requests since last check
        if (newPending > lastKnownCount.current) {
            const diff = newPending - lastKnownCount.current;
            setNewRequestsCount((prev) => prev + diff);
        }
        lastKnownCount.current = newPending;
        setLocalActes(incoming);
        setLocalPaginator(actes);
        setLocalHistorique(historique?.data ?? []);
        setLocalHistoriquePaginator(historique);
        setIsRefreshing(false);
        setSelectedIds(new Set());
    }, [pendingCount, actes, historique]);

    // Poll every 30 seconds for new requests
    useEffect(() => {
        pollingRef.current = setInterval(() => {
            router.reload({
                only: ["actes", "pendingCount", "validatedCount", "refusedCount", "historique"],
                preserveState: true,
            });
        }, 30000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ["actes", "pendingCount", "validatedCount", "refusedCount", "historique"],
            preserveState: true,
        });
    };

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handlePageChange = (url) => {
        router.get(url, {}, {
            preserveState: true,
            onSuccess: (page) => {
                const freshActes = page.props.actes;
                setLocalActes(freshActes?.data ?? []);
                setLocalPaginator(freshActes);
                setSelectedIds(new Set());
            },
        });
    };

    const handleHistoriquePageChange = (url) => {
        router.get(url, {}, {
            preserveState: true,
            onSuccess: (page) => {
                const freshHistorique = page.props.historique;
                setLocalHistorique(freshHistorique?.data ?? []);
                setLocalHistoriquePaginator(freshHistorique);
            },
        });
    };

    // Recherche dans l'historique (débounce 400ms)
    useEffect(() => {
        const handle = setTimeout(() => {
            router.get(window.location.pathname, { historique_search: historiqueSearch }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["historique"],
                onSuccess: (page) => {
                    const freshHistorique = page.props.historique;
                    setLocalHistorique(freshHistorique?.data ?? []);
                    setLocalHistoriquePaginator(freshHistorique);
                },
            });
        }, 400);

        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historiqueSearch]);

    const handleValidate = async (id) => {
        try {
            setProcessing(true);
            await axios.post(
                withBasePath("", `/president-conducteurs/liturgie/${id}/transition`),
                { statut: "TRANSMISE_AU_PASTEUR", commentaire: "" }
            );
            setLocalActes((prev) => prev.filter((a) => a.id !== id));
            showToast("✅ Acte validé et transmis au Pasteur.");
        } catch (e) {
            showToast(e?.response?.data?.message || "Erreur lors de la validation.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleRefuse = async (id, motif) => {
        try {
            setProcessing(true);
            await axios.post(
                withBasePath("", `/president-conducteurs/liturgie/${id}/transition`),
                { statut: "REFUSEE_PAR_BUREAU_CONDUCTEUR", commentaire: motif }
            );
            setLocalActes((prev) => prev.filter((a) => a.id !== id));
            showToast("Acte refusé par le Bureau des Conducteurs.", "info");
        } catch (e) {
            showToast(e?.response?.data?.message || "Erreur lors du refus.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const toggleSelect = (id) =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    const toggleSelectAll = () => {
        if (selectedIds.size === localActes.length && localActes.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(localActes.map((a) => a.id)));
        }
    };

    const allSelected = localActes.length > 0 && selectedIds.size === localActes.length;

    const handleBulkValidate = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        try {
            setProcessing(true);
            for (const id of ids) {
                await axios.post(
                    withBasePath("", `/president-conducteurs/liturgie/${id}/transition`),
                    { statut: "TRANSMISE_AU_PASTEUR", commentaire: "" }
                );
            }
            setLocalActes((prev) => prev.filter((a) => !ids.includes(a.id)));
            setSelectedIds(new Set());
            showToast(`✅ ${ids.length} acte${ids.length > 1 ? "s" : ""} validé${ids.length > 1 ? "s" : ""} et transmis au Pasteur.`);
        } catch (e) {
            showToast(e?.response?.data?.message || "Erreur lors de la validation groupée.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkRefuse = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        const motif = window.prompt(`Motif du refus pour ${ids.length} acte${ids.length > 1 ? "s" : ""} sélectionné${ids.length > 1 ? "s" : ""} :`);
        if (!motif?.trim()) return;
        try {
            setProcessing(true);
            for (const id of ids) {
                await axios.post(
                    withBasePath("", `/president-conducteurs/liturgie/${id}/transition`),
                    { statut: "REFUSEE_PAR_BUREAU_CONDUCTEUR", commentaire: motif }
                );
            }
            setLocalActes((prev) => prev.filter((a) => !ids.includes(a.id)));
            setSelectedIds(new Set());
            showToast(`${ids.length} acte${ids.length > 1 ? "s" : ""} refusé${ids.length > 1 ? "s" : ""}.`, "info");
        } catch (e) {
            showToast(e?.response?.data?.message || "Erreur lors du refus groupé.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const subTabs = [
        { id: "pending",    label: "En attente",     count: pendingCount,                                icon: Clock },
        { id: "historique", label: "Historique",     count: historique?.total ?? localHistorique.length, icon: RotateCcw },
        { id: "suivi",      label: "Suivi des actes", count: null,                                        icon: FileText },
    ];

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
                    toast.type === "error" ? "bg-red-600 text-white"
                    : toast.type === "info" ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                }`}>
                    {toast.msg}
                </div>
            )}

            {/* Refresh */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-extrabold text-white">
                        Validation des actes
                    </h3>
                    {pendingCount > 0 && (
                        <span className="relative inline-flex">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg">
                                <Bell size={11} />
                                {pendingCount > 99 ? "99+" : pendingCount}
                            </span>
                        </span>
                    )}
                </div>

                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 px-3 py-2 rounded-full hover:bg-gray-100 transition-all text-xs font-medium"
                    title="Actualiser"
                >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    {isRefreshing ? "Actualisation..." : "Actualiser"}
                </button>
            </div>

            {/* Bannière de nouvelles demandes (pulsante) */}
            {newRequestsCount > 0 && (
                <div className="mb-5 flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-400/90 backdrop-blur shadow-lg animate-pulse">
                    <span className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                    </span>
                    <Bell size={16} className="text-amber-900 flex-shrink-0" />
                    <p className="text-sm font-bold text-amber-900">
                        {newRequestsCount} nouvelle{newRequestsCount > 1 ? "s" : ""} demande{newRequestsCount > 1 ? "s" : ""} reçue{newRequestsCount > 1 ? "s" : ""} depuis votre dernière consultation !
                    </p>
                    <button
                        onClick={() => { setNewRequestsCount(0); setActiveSubTab("pending"); }}
                        className="ml-auto text-xs font-semibold text-amber-900 bg-white/50 hover:bg-white/80 px-3 py-1 rounded-full transition-colors flex-shrink-0"
                    >
                        Voir les demandes ×
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "En attente",  value: pendingCount,   color: "text-amber-600",  bg: "bg-amber-50",  icon: Clock,         pulse: pendingCount > 0 },
                    { label: "Validés",     value: validatedCount, color: "text-green-600",  bg: "bg-green-50",  icon: CheckCircle,   pulse: false },
                    { label: "Refusés",     value: refusedCount,   color: "text-red-600",    bg: "bg-red-50",    icon: XCircle,       pulse: false },
                ].map(({ label, value, color, bg, icon: Icon, pulse }) => (
                    <div
                        key={label}
                        className={`bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3 relative overflow-hidden ${pulse ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                    >
                        {pulse && (
                            <span className="absolute top-2 right-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                                </span>
                            </span>
                        )}
                        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500 font-medium">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Card principale */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Sous-onglets */}
                <div className="flex border-b border-gray-200">
                    {subTabs.map(({ id, label, count, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSubTab(id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
                                activeSubTab === id
                                    ? "border-b-2 border-purple-700 text-purple-700"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Icon size={15} />
                            {label}
                            {count !== null && (
                                <span className={`relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                                    activeSubTab === id
                                        ? "bg-purple-100 text-purple-700"
                                        : id === "pending" && count > 0
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-500"
                                }`}>
                                    {id === "pending" && count > 0 && activeSubTab !== "pending" && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                        </span>
                                    )}
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Sous-onglet En attente */}
                    {activeSubTab === "pending" && (
                        <>
                            {localActes.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle size={48} className="text-green-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-700">
                                        Aucun acte en attente
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Tous les actes ont été traités.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingCount > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                                            <AlertCircle size={15} />
                                            <span>
                                                <b>{pendingCount}</b> acte{pendingCount > 1 ? "s" : ""} en attente de validation
                                            </span>
                                        </div>
                                    )}

                                    {/* Barre de sélection groupée */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-purple-300 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                readOnly
                                                checked={allSelected}
                                                className="w-3.5 h-3.5 accent-purple-600 pointer-events-none"
                                            />
                                            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                                        </button>

                                        {selectedIds.size > 0 && (
                                            <>
                                                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                                                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleBulkValidate}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50 shadow-sm"
                                                >
                                                    <Send size={12} />
                                                    Valider tout → Pasteur
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleBulkRefuse}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={12} />
                                                    Refuser tout
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedIds(new Set())}
                                                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                                                >
                                                    Annuler
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {localActes.map((acte) => (
                                        <ActeCard
                                            key={acte.id}
                                            acte={acte}
                                            onValidate={handleValidate}
                                            onRefuse={handleRefuse}
                                            isProcessing={processing}
                                            selected={selectedIds.has(acte.id)}
                                            onToggleSelect={toggleSelect}
                                        />
                                    ))}
                                    <Pagination
                                        paginator={localPaginator}
                                        onPage={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Sous-onglet Historique */}
                    {activeSubTab === "historique" && (
                        <>
                            <div className="relative mb-4 max-w-sm">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={historiqueSearch}
                                    onChange={(e) => setHistoriqueSearch(e.target.value)}
                                    placeholder="Rechercher par nom du membre ou référence..."
                                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm text-gray-700"
                                />
                            </div>

                            {localHistorique.length === 0 ? (
                                <div className="text-center py-12">
                                    <RotateCcw size={48} className="text-gray-200 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-700">
                                        {historiqueSearch ? "Aucun résultat" : "Aucun historique"}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {historiqueSearch
                                            ? "Aucun acte ne correspond à cette recherche."
                                            : "Les actes traités apparaîtront ici."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {localHistorique.map((item, idx) => (
                                        <HistoriqueCard key={`${item.id}-${idx}`} item={item} />
                                    ))}
                                    <Pagination
                                        paginator={localHistoriquePaginator}
                                        onPage={handleHistoriquePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Sous-onglet Suivi des actes */}
                    {activeSubTab === "suivi" && <TabHistoriqueActes />}
                </div>
            </div>
        </div>
    );
}
