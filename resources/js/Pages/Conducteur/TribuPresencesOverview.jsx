import React, { useEffect, useMemo, useState } from "react";
import { Link, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import Select2Single from "../../Components/Select2Single";
import {
    ArrowLeft,
    Crown,
    CalendarCheck,
    Users,
    TrendingUp,
    Layers,
    Search,
    MapPin,
    Check,
    X as XIcon,
    Clock,
    ClipboardList,
    Calendar,
    BarChart3,
    AlertTriangle,
    History,
    Trophy,
} from "lucide-react";

const MOIS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// Les dates arrivent formatées "d/m/Y" depuis le backend.
const parseDateFr = (dateStr) => {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split("/").map((v) => parseInt(v, 10));
    if (!d || !m || !y) return null;
    return { day: d, month: m, year: y };
};

const formatDateLong = (dateStr) => {
    const parsed = parseDateFr(dateStr);
    if (!parsed) return dateStr || "-";
    return `${parsed.day} ${MOIS_FR[parsed.month - 1]}`;
};

const isCurrentMonth = (dateStr) => {
    const parsed = parseDateFr(dateStr);
    if (!parsed) return false;
    const now = new Date();
    return parsed.month === now.getMonth() + 1 && parsed.year === now.getFullYear();
};

// Couleurs de badge tribu, mêmes teintes que TribuFinances.jsx pour rester cohérent.
const TRIBU_BADGE_COLORS = [
    "bg-indigo-50 text-indigo-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
    "bg-rose-50 text-rose-700",
    "bg-sky-50 text-sky-700",
    "bg-fuchsia-50 text-fuchsia-700",
];

const PointageBadge = ({ statut }) => {
    if (statut === "present") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                Présent
            </span>
        );
    }
    if (statut === "absent") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                <XIcon className="w-3.5 h-3.5" strokeWidth={3} />
                Absent
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            Aucun pointage
        </span>
    );
};

const StatutActiviteBadge = ({ estCloture }) =>
    estCloture ? (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
            Terminée
        </span>
    ) : (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            En cours
        </span>
    );

const FORM_STYLES = `
    :root {
        --primary: #4f46e5; --primary-hover: #4338ca;
    }
    .input-control { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1.5px solid #d1d5db; background-color: #ffffff; font-size: 0.9rem; color: #111827; transition: all 0.2s; }
    .input-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); outline: none; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 1rem; color: #4b5563; font-size: 0.875rem; font-weight: 600; }
    .pagination-btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
    .pagination-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const StatCard = ({
    icon: IconComp,
    label,
    value,
    badge,
    badgeClass,
    iconBg,
    iconColor,
    barColor,
    barPercent,
}) => (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
            >
                <IconComp className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
            </div>
            {badge && (
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}
                >
                    {badge}
                </span>
            )}
        </div>
        <div className="text-3xl font-extrabold text-gray-900 leading-tight">
            {value}
        </div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${barPercent}%` }}
            />
        </div>
    </div>
);

const TribuBadge = ({ nom, colorClass }) => (
    <span
        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${colorClass}`}
    >
        {nom}
    </span>
);

const Pagination = ({ currentPage, totalPages, paginate }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <span className="pagination-info">
                Page {currentPage} sur {totalPages}
            </span>
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Précédent
            </button>
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    className={`pagination-btn ${currentPage === number ? "active" : ""}`}
                    onClick={() => paginate(number)}
                >
                    {number}
                </button>
            ))}
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Suivant
            </button>
        </div>
    );
};

const TABS = [
    { key: "marquer", label: "Marquer", icon: ClipboardList },
    { key: "activites", label: "Activités", icon: Calendar },
    { key: "statistiques", label: "Statistiques", icon: BarChart3 },
    { key: "absences", label: "Absences", icon: AlertTriangle },
    { key: "membres", label: "Activité des membres", icon: Users },
    { key: "historique", label: "Historique", icon: History },
];

export default function TribuPresencesOverview({
    classeNom,
    tribus = [],
    activites = [],
    membres = [],
    pointages = [],
    stats = { tauxMoyen: null, nombreActivites: 0, nombreMembres: 0, nombreTribus: 0 },
}) {
    const [activeTab, setActiveTab] = useState("activites");
    const [selectedActiviteId, setSelectedActiviteId] = useState(
        activites[0]?.id ?? null,
    );
    const [showAllPills, setShowAllPills] = useState(false);
    const [absencesPage, setAbsencesPage] = useState(1);
    const [voirMembre, setVoirMembre] = useState(null);
    const [detailMembreActivite, setDetailMembreActivite] = useState(null);
    const [search, setSearch] = useState("");
    const [tribuFiltre, setTribuFiltre] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const absencesPerPage = 10;
    const marquerPerPage = 10;

    // --- Tab: Activité des membres ---
    const [draftSearchMembres, setDraftSearchMembres] = useState("");
    const [searchMembresActivite, setSearchMembresActivite] = useState("");
    const [tribuFiltreMembresActivite, setTribuFiltreMembresActivite] =
        useState("");
    const [membresActivitePage, setMembresActivitePage] = useState(1);
    const membresActivitePerPage = 10;

    const membresAvecCompteurs = useMemo(
        () =>
            membres.map((m) => ({
                ...m,
                nbPresences: m.presences.filter(
                    (p) => p.statut === "present",
                ).length,
                nbAbsences: m.presences.filter((p) => p.statut === "absent")
                    .length,
            })),
        [membres],
    );

    const filteredMembresActivite = useMemo(() => {
        const term = searchMembresActivite.trim().toLowerCase();
        return membresAvecCompteurs.filter((m) => {
            if (term && !m.nom.toLowerCase().includes(term)) return false;
            if (
                tribuFiltreMembresActivite &&
                String(m.tribuId) !== String(tribuFiltreMembresActivite)
            )
                return false;
            return true;
        });
    }, [membresAvecCompteurs, searchMembresActivite, tribuFiltreMembresActivite]);

    const membresActiviteTotalPages = Math.max(
        1,
        Math.ceil(
            filteredMembresActivite.length / membresActivitePerPage,
        ),
    );
    const paginatedMembresActivite = filteredMembresActivite.slice(
        (membresActivitePage - 1) * membresActivitePerPage,
        membresActivitePage * membresActivitePerPage,
    );
    const applySearchMembresActivite = () => {
        setSearchMembresActivite(draftSearchMembres);
        setMembresActivitePage(1);
    };

    useEffect(() => {
        setMembresActivitePage(1);
    }, [tribuFiltreMembresActivite]);

    useEffect(() => {
        if (membresActivitePage > membresActiviteTotalPages)
            setMembresActivitePage(membresActiviteTotalPages);
    }, [membresActiviteTotalPages, membresActivitePage]);

    const tribuColorById = useMemo(() => {
        const map = {};
        tribus.forEach((t, idx) => {
            map[t.id] = TRIBU_BADGE_COLORS[idx % TRIBU_BADGE_COLORS.length];
        });
        return map;
    }, [tribus]);

    const tribuOptions = tribus.map((t) => ({ value: t.id, label: t.nom }));

    const tauxMoyen =
        stats.tauxMoyen !== null ? `${stats.tauxMoyen}%` : "-";

    // --- Top activités du mois ---
    const activitesMoisCourant = useMemo(
        () => activites.filter((a) => isCurrentMonth(a.date)),
        [activites],
    );
    const topActivites = useMemo(
        () =>
            [...activitesMoisCourant]
                .sort((a, b) => b.presents - a.presents)
                .slice(0, 3),
        [activitesMoisCourant],
    );
    const maxPresentsTop = topActivites[0]?.presents || 1;
    const MEDALS = ["🥇", "🥈", "🥉"];
    const MEDAL_BAR_COLORS = ["bg-amber-500", "bg-gray-400", "bg-amber-700"];

    // --- Sélection (pills + dropdown) ---
    const pillsActivites = showAllPills
        ? activitesMoisCourant
        : activitesMoisCourant.slice(0, 3);
    const activiteSelectionnee = activites.find(
        (a) => a.id === selectedActiviteId,
    );

    const selectionnerEtVoir = (id) => {
        setSelectedActiviteId(id);
        setActiveTab("marquer");
    };

    // --- Tab: Marquer (détail de l'activité sélectionnée, toutes tribus) ---
    const [marquerPage, setMarquerPage] = useState(1);

    const pointagesActivite = useMemo(() => {
        if (selectedActiviteId === "all") return pointages;
        return selectedActiviteId
            ? pointages.filter((p) => p.activite_id === selectedActiviteId)
            : [];
    }, [pointages, selectedActiviteId]);

    const marquerTotalPages = Math.max(
        1,
        Math.ceil(pointagesActivite.length / marquerPerPage),
    );
    const paginatedPointagesActivite = pointagesActivite.slice(
        (marquerPage - 1) * marquerPerPage,
        marquerPage * marquerPerPage,
    );

    useEffect(() => {
        setMarquerPage(1);
    }, [selectedActiviteId]);

    useEffect(() => {
        if (marquerPage > marquerTotalPages) setMarquerPage(marquerTotalPages);
    }, [marquerTotalPages, marquerPage]);

    // --- Tab: Statistiques ---
    const statsActivites = activites.slice(0, 8);

    // --- Tab: Absences répétées ---
    const absencesRepetees = useMemo(() => {
        return membres
            .map((m) => ({
                ...m,
                nbAbsences: m.presences.filter((p) => p.statut === "absent")
                    .length,
            }))
            .filter((m) => m.nbAbsences >= 3)
            .sort((a, b) => b.nbAbsences - a.nbAbsences);
    }, [membres]);

    const absencesTotalPages = Math.max(
        1,
        Math.ceil(absencesRepetees.length / absencesPerPage),
    );
    const paginatedAbsences = absencesRepetees.slice(
        (absencesPage - 1) * absencesPerPage,
        absencesPage * absencesPerPage,
    );

    useEffect(() => {
        if (absencesPage > absencesTotalPages) setAbsencesPage(absencesTotalPages);
    }, [absencesTotalPages, absencesPage]);

    const membreActivitesAbsentes = (membre) =>
        membre.presences
            .filter((p) => p.statut === "absent")
            .map((p) => activites.find((a) => a.id === p.activite_id))
            .filter(Boolean);

    // --- Tab: Historique (journal de pointage, toutes tribus) ---
    const filteredPointages = useMemo(() => {
        const term = search.trim().toLowerCase();
        return pointages.filter((p) => {
            if (
                term &&
                !p.membre_nom.toLowerCase().includes(term) &&
                !p.activite_titre.toLowerCase().includes(term)
            )
                return false;
            if (tribuFiltre && String(p.tribuId) !== String(tribuFiltre))
                return false;
            return true;
        });
    }, [pointages, search, tribuFiltre]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredPointages.length / itemsPerPage),
    );
    const paginatedPointages = filteredPointages.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, tribuFiltre]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    return (
        <>
            <Head title={`Présences des tribus - ${classeNom || ""}`} />
            <style>{FORM_STYLES}</style>

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-16 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-6xl mx-auto py-8">
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", "/conducteur/tribus")}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Présences des tribus
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Classe :{" "}
                                <span className="font-semibold text-yellow-300">
                                    {classeNom}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={Layers}
                            label="Tribus"
                            value={stats.nombreTribus}
                            badge="Total"
                            badgeClass="bg-violet-50 text-violet-700"
                            iconBg="bg-violet-50"
                            iconColor="text-violet-600"
                            barColor="bg-violet-600"
                            barPercent={100}
                        />
                        <StatCard
                            icon={Users}
                            label="Membres affectés"
                            value={stats.nombreMembres}
                            badge="Total"
                            badgeClass="bg-indigo-50 text-indigo-700"
                            iconBg="bg-indigo-50"
                            iconColor="text-indigo-600"
                            barColor="bg-indigo-600"
                            barPercent={100}
                        />
                        <StatCard
                            icon={CalendarCheck}
                            label="Activités suivies"
                            value={stats.nombreActivites}
                            badge="Suivies"
                            badgeClass="bg-sky-50 text-sky-700"
                            iconBg="bg-sky-50"
                            iconColor="text-sky-600"
                            barColor="bg-sky-500"
                            barPercent={100}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Taux moyen de présence"
                            value={tauxMoyen}
                            badge={tauxMoyen}
                            badgeClass={
                                stats.tauxMoyen === null
                                    ? "bg-gray-100 text-gray-500"
                                    : stats.tauxMoyen >= 75
                                      ? "bg-green-100 text-green-700"
                                      : stats.tauxMoyen >= 40
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                            }
                            iconBg="bg-green-50"
                            iconColor="text-green-600"
                            barColor={
                                stats.tauxMoyen === null
                                    ? "bg-gray-300"
                                    : stats.tauxMoyen >= 75
                                      ? "bg-green-500"
                                      : stats.tauxMoyen >= 40
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                            }
                            barPercent={stats.tauxMoyen ?? 0}
                        />
                    </div>

                    {/* TOP ACTIVITÉS DU MOIS */}
                    {topActivites.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Top activités du mois
                            </h2>
                            <div className="space-y-3">
                                {topActivites.map((a, idx) => {
                                    const taux =
                                        membres.length > 0
                                            ? Math.round(
                                                  (a.presents / membres.length) *
                                                      100,
                                              )
                                            : 0;
                                    const barPct = Math.round(
                                        (a.presents / maxPresentsTop) * 100,
                                    );
                                    return (
                                        <button
                                            key={a.id}
                                            onClick={() =>
                                                selectionnerEtVoir(a.id)
                                            }
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                    <span className="text-lg">
                                                        {MEDALS[idx]}
                                                    </span>
                                                    {a.titre}
                                                    <span className="text-xs font-normal text-gray-400">
                                                        {formatDateLong(a.date)}
                                                    </span>
                                                </span>
                                                <span className="text-sm font-bold text-gray-700 shrink-0">
                                                    {a.presents} présents ·{" "}
                                                    {taux}%
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${MEDAL_BAR_COLORS[idx]}`}
                                                    style={{
                                                        width: `${barPct}%`,
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SÉLECTION */}
                    {activites.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-gray-600 shrink-0">
                                Sélection :
                            </span>
                            <select
                                value={selectedActiviteId ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedActiviteId(
                                        val === "all"
                                            ? "all"
                                            : Number(val) || null,
                                    );
                                }}
                                className="input-control max-w-xs"
                            >
                                <option value="all">
                                    Toutes les activités
                                </option>
                                {activites.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.titre} · {a.date}
                                    </option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() =>
                                        setSelectedActiviteId("all")
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                        selectedActiviteId === "all"
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    Toutes les activités
                                </button>
                                {pillsActivites.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() =>
                                            setSelectedActiviteId(a.id)
                                        }
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                            selectedActiviteId === a.id
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                                        }`}
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        {a.titre}
                                        <span className="opacity-70">
                                            {formatDateLong(a.date)}
                                        </span>
                                    </button>
                                ))}
                                {activitesMoisCourant.length > 3 && (
                                    <button
                                        onClick={() =>
                                            setShowAllPills((v) => !v)
                                        }
                                        className="text-xs font-bold text-indigo-600 hover:underline px-2"
                                    >
                                        {showAllPills
                                            ? "Voir moins"
                                            : "Voir plus"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ONGLETS */}
                    <div className="bg-white rounded-2xl shadow-xl p-2 mb-6 flex flex-wrap gap-1">
                        {TABS.map((t) => {
                            const TabIcon = t.icon;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                                        activeTab === t.key
                                            ? "bg-indigo-600 text-white shadow"
                                            : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* TAB: MARQUER (détail de l'activité sélectionnée, toutes tribus) */}
                    {activeTab === "marquer" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            {selectedActiviteId === "all" ? (
                                <>
                                    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Toutes les activités
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {pointagesActivite.length}{" "}
                                                pointages, toutes activités
                                                confondues
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        <div className="rounded-xl bg-green-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-green-700">
                                                {
                                                    pointagesActivite.filter(
                                                        (p) =>
                                                            p.statut ===
                                                            "present",
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-xs font-bold text-green-600 uppercase tracking-wide">
                                                Présents
                                            </div>
                                        </div>
                                        <div className="rounded-xl bg-red-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-red-700">
                                                {
                                                    pointagesActivite.filter(
                                                        (p) =>
                                                            p.statut ===
                                                            "absent",
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-xs font-bold text-red-600 uppercase tracking-wide">
                                                Absents
                                            </div>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-gray-600">
                                                {
                                                    pointagesActivite.filter(
                                                        (p) =>
                                                            p.statut !==
                                                                "present" &&
                                                            p.statut !==
                                                                "absent",
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                Aucun pointage
                                            </div>
                                        </div>
                                    </div>

                                    {pointagesActivite.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun pointage à afficher.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Membre
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Tribu
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Activité
                                                        </th>
                                                        <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                            Pointage
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Pointé le
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {paginatedPointagesActivite.map(
                                                        (p) => (
                                                            <tr
                                                                key={`${p.membre_id}-${p.activite_id}`}
                                                            >
                                                                <td className="px-4 py-2 font-medium text-gray-800">
                                                                    <div className="flex items-center gap-2">
                                                                        {
                                                                            p.membre_nom
                                                                        }
                                                                        {p.estChef && (
                                                                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <TribuBadge
                                                                        nom={
                                                                            p.tribuNom
                                                                        }
                                                                        colorClass={
                                                                            tribuColorById[
                                                                                p.tribuId
                                                                            ]
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-700">
                                                                    {
                                                                        p.activite_titre
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <PointageBadge
                                                                        statut={
                                                                            p.statut
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-500">
                                                                    {p.pointe_le ||
                                                                        "-"}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {marquerTotalPages > 1 && (
                                        <Pagination
                                            currentPage={marquerPage}
                                            totalPages={marquerTotalPages}
                                            paginate={setMarquerPage}
                                        />
                                    )}
                                </>
                            ) : !activiteSelectionnee ? (
                                <p className="text-sm text-gray-400">
                                    Aucune activité à afficher pour le moment.
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                {activiteSelectionnee.titre}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {formatDateLong(
                                                    activiteSelectionnee.date,
                                                )}{" "}
                                                ·{" "}
                                                {activiteSelectionnee.lieu ||
                                                    "Lieu non renseigné"}
                                            </p>
                                        </div>
                                        <StatutActiviteBadge
                                            estCloture={
                                                activiteSelectionnee.estCloture
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        <div className="rounded-xl bg-green-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-green-700">
                                                {activiteSelectionnee.presents}
                                            </div>
                                            <div className="text-xs font-bold text-green-600 uppercase tracking-wide">
                                                Présents
                                            </div>
                                        </div>
                                        <div className="rounded-xl bg-red-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-red-700">
                                                {activiteSelectionnee.absents}
                                            </div>
                                            <div className="text-xs font-bold text-red-600 uppercase tracking-wide">
                                                Absents
                                            </div>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3 text-center">
                                            <div className="text-2xl font-extrabold text-gray-600">
                                                {
                                                    activiteSelectionnee.enAttente
                                                }
                                            </div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                Aucun pointage
                                            </div>
                                        </div>
                                    </div>

                                    {pointagesActivite.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun membre à afficher pour cette
                                            activité.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Membre
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Tribu
                                                        </th>
                                                        <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                            Pointage
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Pointé le
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {paginatedPointagesActivite.map(
                                                        (p) => (
                                                            <tr
                                                                key={p.membre_id}
                                                            >
                                                                <td className="px-4 py-2 font-medium text-gray-800">
                                                                    <div className="flex items-center gap-2">
                                                                        {
                                                                            p.membre_nom
                                                                        }
                                                                        {p.estChef && (
                                                                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <TribuBadge
                                                                        nom={
                                                                            p.tribuNom
                                                                        }
                                                                        colorClass={
                                                                            tribuColorById[
                                                                                p.tribuId
                                                                            ]
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <PointageBadge
                                                                        statut={
                                                                            p.statut
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-500">
                                                                    {p.pointe_le ||
                                                                        "-"}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {marquerTotalPages > 1 && (
                                        <Pagination
                                            currentPage={marquerPage}
                                            totalPages={marquerTotalPages}
                                            paginate={setMarquerPage}
                                        />
                                    )}

                                    <p className="text-xs text-gray-400 mt-4 text-center">
                                        Marquage 100% automatique par QR code.
                                        Aucun pointage manuel autorisé.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB: ACTIVITÉS */}
                    {activeTab === "activites" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                Activités de la classe
                            </h2>

                            {activites.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucune activité enregistrée pour cette
                                    classe pour le moment.
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Activité
                                                </th>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Date
                                                </th>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Lieu
                                                </th>
                                                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                    Statut
                                                </th>
                                                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                    Présents
                                                </th>
                                                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                    Absents
                                                </th>
                                                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                    En attente
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activites.map((a) => (
                                                <tr
                                                    key={a.id}
                                                    onClick={() =>
                                                        selectionnerEtVoir(
                                                            a.id,
                                                        )
                                                    }
                                                    className="cursor-pointer hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                        {a.titre}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {a.date || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            {a.lieu ||
                                                                "Non renseigné"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <StatutActiviteBadge
                                                            estCloture={
                                                                a.estCloture
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                            {a.presents}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                            {a.absents}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                                            {a.enAttente}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: STATISTIQUES */}
                    {activeTab === "statistiques" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                Statistiques de participation
                            </h2>
                            <p className="text-sm text-gray-400 mb-5">
                                {classeNom}
                            </p>

                            {statsActivites.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucune activité à analyser pour le moment.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {statsActivites.map((a) => {
                                        const pct =
                                            membres.length > 0
                                                ? Math.round(
                                                      (a.presents /
                                                          membres.length) *
                                                          100,
                                                  )
                                                : 0;
                                        return (
                                            <div key={a.id}>
                                                <div className="flex items-center justify-between mb-1.5 text-sm">
                                                    <span className="font-semibold text-gray-700">
                                                        {a.titre}{" "}
                                                        <span className="text-gray-400 font-normal">
                                                            {a.date}
                                                        </span>
                                                    </span>
                                                    <span className="font-bold text-gray-700">
                                                        {pct}%{" "}
                                                        <span className="text-gray-400 font-normal">
                                                            ({a.presents}/
                                                            {membres.length})
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            pct >= 75
                                                                ? "bg-green-500"
                                                                : pct >= 40
                                                                  ? "bg-amber-500"
                                                                  : "bg-red-500"
                                                        }`}
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: ABSENCES */}
                    {activeTab === "absences" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                Membres avec absences répétées
                            </h2>

                            {absencesRepetees.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucun membre n'a 3 absences ou plus pour le
                                    moment.
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        {paginatedAbsences.map((m) => (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between gap-4 flex-wrap p-3 rounded-xl bg-red-50/50 border border-red-100"
                                            >
                                                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    {m.nom}
                                                    <TribuBadge
                                                        nom={m.tribuNom}
                                                        colorClass={
                                                            tribuColorById[
                                                                m.tribuId
                                                            ]
                                                        }
                                                    />
                                                </span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                        {m.nbAbsences} absences
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            setVoirMembre(m)
                                                        }
                                                        className="text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        Voir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {absencesTotalPages > 1 && (
                                        <Pagination
                                            currentPage={absencesPage}
                                            totalPages={absencesTotalPages}
                                            paginate={setAbsencesPage}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB: ACTIVITÉ DES MEMBRES */}
                    {activeTab === "membres" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                Activité des membres ({membres.length})
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        value={draftSearchMembres}
                                        onChange={(e) =>
                                            setDraftSearchMembres(
                                                e.target.value,
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            applySearchMembresActivite()
                                        }
                                        placeholder="Rechercher un membre..."
                                        className="input-control pl-9"
                                    />
                                </div>
                                <Select2Single
                                    name="tribu_filtre_membres_activite"
                                    value={tribuFiltreMembresActivite}
                                    onChange={(e) =>
                                        setTribuFiltreMembresActivite(
                                            e.target.value,
                                        )
                                    }
                                    options={tribuOptions}
                                    placeholder="Filtrer par tribu..."
                                />
                            </div>
                            <button
                                onClick={applySearchMembresActivite}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold mb-5"
                            >
                                <Search className="w-4 h-4" />
                                Rechercher
                            </button>

                            {membres.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucun membre affecté à une tribu.
                                </p>
                            ) : filteredMembresActivite.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucun membre ne correspond à ces
                                    critères.
                                </p>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Membre
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Tribu
                                                    </th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                        Présences
                                                    </th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                        Absences
                                                    </th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                        Taux
                                                    </th>
                                                    <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {paginatedMembresActivite.map(
                                                    (m) => (
                                                        <tr key={m.id}>
                                                            <td className="px-4 py-2 font-medium text-gray-800">
                                                                {m.nom}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <TribuBadge
                                                                    nom={
                                                                        m.tribuNom
                                                                    }
                                                                    colorClass={
                                                                        tribuColorById[
                                                                            m.tribuId
                                                                        ]
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                                    {
                                                                        m.nbPresences
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                                    {
                                                                        m.nbAbsences
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center text-gray-600">
                                                                {m.taux !==
                                                                null
                                                                    ? `${m.taux}%`
                                                                    : "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-right">
                                                                <button
                                                                    onClick={() =>
                                                                        setDetailMembreActivite(
                                                                            m,
                                                                        )
                                                                    }
                                                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                                                >
                                                                    Voir
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {membresActiviteTotalPages > 1 && (
                                        <Pagination
                                            currentPage={
                                                membresActivitePage
                                            }
                                            totalPages={
                                                membresActiviteTotalPages
                                            }
                                            paginate={
                                                setMembresActivitePage
                                            }
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB: HISTORIQUE (journal de pointage, toutes tribus) */}
                    {activeTab === "historique" && (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Historique complet des présences (
                                    {pointages.length})
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Rechercher un membre..."
                                        className="input-control pl-9"
                                    />
                                </div>
                                <Select2Single
                                    name="tribu_filtre"
                                    value={tribuFiltre}
                                    onChange={(e) =>
                                        setTribuFiltre(e.target.value)
                                    }
                                    options={tribuOptions}
                                    placeholder="Filtrer par tribu..."
                                />
                            </div>

                            {membres.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucun membre affecté à une tribu.
                                </p>
                            ) : activites.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucune activité enregistrée pour le moment
                                    — rien à afficher pour les membres.
                                </p>
                            ) : filteredPointages.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Aucun pointage ne correspond à ces
                                    critères.
                                </p>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Membre
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Tribu
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Activité
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Date de l'activité
                                                    </th>
                                                    <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                        Pointage
                                                    </th>
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                        Pointé le
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {paginatedPointages.map(
                                                    (p) => (
                                                        <tr
                                                            key={`${p.tribuId}-${p.membre_id}-${p.activite_id}`}
                                                        >
                                                            <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    {
                                                                        p.membre_nom
                                                                    }
                                                                    {p.estChef && (
                                                                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <TribuBadge
                                                                    nom={
                                                                        p.tribuNom
                                                                    }
                                                                    colorClass={
                                                                        tribuColorById[
                                                                            p.tribuId
                                                                        ]
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                                                                {
                                                                    p.activite_titre
                                                                }
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                <div>
                                                                    {p.activite_date ||
                                                                        "-"}
                                                                </div>
                                                                {p.activite_heure && (
                                                                    <div className="text-xs text-gray-400">
                                                                        {
                                                                            p.activite_heure
                                                                        }
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <PointageBadge
                                                                    statut={
                                                                        p.statut
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                {p.pointe_le ||
                                                                    "-"}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalPages > 1 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            paginate={goToPage}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: activités absentes d'un membre */}
            {voirMembre && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">
                                Absences de {voirMembre.nom}
                            </h2>
                            <button
                                onClick={() => setVoirMembre(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <ul className="divide-y divide-gray-100">
                                {membreActivitesAbsentes(voirMembre).map(
                                    (a) => (
                                        <li
                                            key={a.id}
                                            className="py-2.5 flex items-center justify-between text-sm"
                                        >
                                            <span className="font-medium text-gray-800">
                                                {a.titre}
                                            </span>
                                            <span className="text-gray-400">
                                                {a.date}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: détail présent/absent à chaque activité pour un membre */}
            {detailMembreActivite && (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {detailMembreActivite.nom}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                    <TribuBadge
                                        nom={detailMembreActivite.tribuNom}
                                        colorClass={
                                            tribuColorById[
                                                detailMembreActivite.tribuId
                                            ]
                                        }
                                    />
                                    {detailMembreActivite.nbPresences}{" "}
                                    présence
                                    {detailMembreActivite.nbPresences > 1
                                        ? "s"
                                        : ""}{" "}
                                    ·{" "}
                                    {detailMembreActivite.nbAbsences} absence
                                    {detailMembreActivite.nbAbsences > 1
                                        ? "s"
                                        : ""}
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    setDetailMembreActivite(null)
                                }
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Activité
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Date
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Statut
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activites.map((a) => {
                                            const p =
                                                detailMembreActivite.presences.find(
                                                    (p) =>
                                                        p.activite_id ===
                                                        a.id,
                                                );
                                            return (
                                                <tr key={a.id}>
                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                        {a.titre}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {a.date || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <PointageBadge
                                                            statut={
                                                                p?.statut
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
