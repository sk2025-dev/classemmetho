import React, { useEffect, useMemo, useState } from "react";
import { Link, Head, router } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    ArrowLeft,
    Search,
    LayoutDashboard,
    Users,
    Layers,
    History as HistoryIcon,
    Wallet,
    AlertCircle,
    Eye,
    X,
    Receipt,
    CreditCard,
    Mail,
    Send,
    Check,
    Clock,
    MessageCircle,
} from "lucide-react";
import { getStatutBadge } from "../../Helpers/tribuStatutHelper";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

const STYLES = `
    :root {
        --primary: #4f46e5;
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

// "Aucun paiement" est plus clair que "en attente" quand rien n'a encore été
// versé — que ce soit pour une cotisation précise (modale de détail) ou pour
// l'ensemble d'un membre (colonne Statut du tableau).
const statutBadge = (statut) =>
    statut === "EN_ATTENTE"
        ? { label: "Aucun paiement", className: "bg-gray-100 text-gray-500" }
        : getStatutBadge(statut);

const TABS = [
    { key: "apercu", label: "Vue d'ensemble", icon: LayoutDashboard },
    { key: "membres", label: "Membres", icon: Users },
    { key: "cotisations", label: "Cotisations", icon: Layers },
    { key: "historique", label: "Historique", icon: HistoryIcon },
];

const DEFAULT_RELANCE_MESSAGE =
    "Nous vous rappelons qu'il vous reste des cotisations à régulariser. Merci de bien vouloir régulariser votre situation auprès du trésorier de votre classe dans les meilleurs délais.";

// Compose le texte final (WhatsApp et aperçu) : message personnalisé + résumé
// payé / reste / total, en restant bref (pas de détail ligne par ligne).
const buildRelanceTexte = (membre, message) => {
    const totalAttendu = (membre.totalPaye || 0) + (membre.totalDu || 0);
    return [
        `Bonjour ${membre.prenom || membre.nom},`,
        "",
        message,
        "",
        `💰 Payé : ${(membre.totalPaye || 0).toLocaleString()} F`,
        `⏳ Reste à payer : ${(membre.totalDu || 0).toLocaleString()} F`,
        `📊 Total attendu : ${totalAttendu.toLocaleString()} F`,
        "",
        "Merci de régulariser votre situation auprès du trésorier de votre classe.",
    ].join("\n");
};

const buildWhatsAppLink = (telephone, text) => {
    const digits = (telephone || "").replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

export default function TribuFinances({
    basePath = "/membre-famille",
    tribu,
    membres = [],
    historique = [],
}) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState("apercu");
    const [detailMembre, setDetailMembre] = useState(null);
    const [detailCotisation, setDetailCotisation] = useState(null);
    const [relanceMembre, setRelanceMembre] = useState(null);
    const [relanceMessage, setRelanceMessage] = useState(
        DEFAULT_RELANCE_MESSAGE,
    );
    const [sendingRelance, setSendingRelance] = useState(false);
    const [showRelanceTousModal, setShowRelanceTousModal] = useState(false);
    const [relanceTousMessage, setRelanceTousMessage] = useState(
        DEFAULT_RELANCE_MESSAGE,
    );
    const [relancingTous, setRelancingTous] = useState(false);

    const openRelanceTousModal = () => {
        setRelanceTousMessage(DEFAULT_RELANCE_MESSAGE);
        setShowRelanceTousModal(true);
    };

    const relancerTous = () => {
        setRelancingTous(true);
        router.post(
            withBasePath("", `${basePath}/tribu/membres/relancer-tous`),
            { message: relanceTousMessage },
            {
                preserveScroll: true,
                onSuccess: () => setShowRelanceTousModal(false),
                onError: () =>
                    toast.error("Erreur lors de l'envoi des rappels."),
                onFinish: () => setRelancingTous(false),
            },
        );
    };

    const detailPaiements = useMemo(() => {
        if (!detailMembre) return [];
        return historique.filter((h) => h.membre_id === detailMembre.id);
    }, [historique, detailMembre]);

    const detailCotisationMembres = useMemo(() => {
        if (!detailCotisation) return { payes: [], nonPayes: [] };
        const payes = [];
        const nonPayes = [];
        membres.forEach((m) => {
            const c = m.cotisations.find(
                (c) => c.nom === detailCotisation.nom,
            );
            if (!c) return;
            (c.du === 0 ? payes : nonPayes).push({ ...m, cot: c });
        });
        return { payes, nonPayes };
    }, [membres, detailCotisation]);

    const openRelanceModal = (m) => {
        setRelanceMembre(m);
        setRelanceMessage(DEFAULT_RELANCE_MESSAGE);
    };

    const envoyerRelance = () => {
        if (!relanceMembre) return;
        setSendingRelance(true);
        router.post(
            withBasePath(
                "",
                `${basePath}/tribu/membres/${relanceMembre.id}/relancer`,
            ),
            { message: relanceMessage },
            {
                preserveScroll: true,
                onSuccess: () => setRelanceMembre(null),
                onError: (errors) =>
                    toast.error(
                        errors?.error || "Erreur lors de l'envoi du rappel.",
                    ),
                onFinish: () => setSendingRelance(false),
            },
        );
    };

    // --- Membres ---
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredMembres = membres.filter((m) =>
        m.nom.toLowerCase().includes(search.trim().toLowerCase()),
    );
    const totalPages = Math.max(
        1,
        Math.ceil(filteredMembres.length / itemsPerPage),
    );
    const paginatedMembres = filteredMembres.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    // --- Vue d'ensemble ---
    const kpis = useMemo(() => {
        const ajour = membres.filter((m) => m.statut === "A_JOUR").length;
        const encours = membres.filter((m) => m.statut === "EN_COURS").length;
        const attente = membres.filter(
            (m) => m.statut === "EN_ATTENTE",
        ).length;
        const totalDu = membres.reduce((sum, m) => sum + m.totalDu, 0);
        return { ajour, encours, attente, totalDu };
    }, [membres]);

    const membresEnRetard = useMemo(
        () =>
            [...membres]
                .filter((m) => m.totalDu > 0)
                .sort((a, b) => b.totalDu - a.totalDu)
                .slice(0, 5),
        [membres],
    );

    // --- Cotisations (pivot) ---
    const cotisationsPivot = useMemo(() => {
        const map = {};
        membres.forEach((m) => {
            m.cotisations.forEach((c) => {
                if (!map[c.nom]) {
                    map[c.nom] = {
                        nom: c.nom,
                        nbConcernes: 0,
                        montantTotal: 0,
                        paye: 0,
                        du: 0,
                        nbAJour: 0,
                    };
                }
                map[c.nom].nbConcernes += 1;
                map[c.nom].montantTotal += c.montant;
                map[c.nom].paye += c.paye;
                map[c.nom].du += c.du;
                if (c.du === 0) map[c.nom].nbAJour += 1;
            });
        });
        return Object.values(map);
    }, [membres]);

    // --- Historique ---
    const [searchHistorique, setSearchHistorique] = useState("");
    const [historiquePage, setHistoriquePage] = useState(1);
    const historiquePerPage = 10;

    const filteredHistorique = historique.filter((h) => {
        const term = searchHistorique.trim().toLowerCase();
        if (!term) return true;
        return (
            h.membre.toLowerCase().includes(term) ||
            h.cotisation.toLowerCase().includes(term)
        );
    });
    const historiqueTotalPages = Math.max(
        1,
        Math.ceil(filteredHistorique.length / historiquePerPage),
    );
    const paginatedHistorique = filteredHistorique.slice(
        (historiquePage - 1) * historiquePerPage,
        historiquePage * historiquePerPage,
    );

    useEffect(() => {
        setHistoriquePage(1);
    }, [searchHistorique]);

    useEffect(() => {
        if (historiquePage > historiqueTotalPages)
            setHistoriquePage(historiqueTotalPages);
    }, [historiqueTotalPages, historiquePage]);

    return (
        <>
            <Head title={`Finances - ${tribu.nom}`} />
            <style>{STYLES}</style>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-16 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-5xl mx-auto py-8">
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", `${basePath}/tribu`)}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Suivi des cotisations
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Tribu :{" "}
                                <span className="font-semibold text-yellow-300">
                                    {tribu.nom}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={openRelanceTousModal}
                            className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold shadow-lg"
                        >
                            <Mail className="w-4 h-4" />
                            Relancer tous les retardataires
                        </button>
                    </div>

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

                    {membres.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <p className="text-sm text-gray-400">
                                Aucune donnée financière disponible.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* TAB: VUE D'ENSEMBLE */}
                            {activeTab === "apercu" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <StatCard
                                            icon={Receipt}
                                            label="Cotisations"
                                            value={cotisationsPivot.length}
                                            badge="Actives"
                                            badgeClass="bg-violet-50 text-violet-700"
                                            iconBg="bg-violet-50"
                                            iconColor="text-violet-600"
                                            barColor="bg-violet-500"
                                            barPercent={100}
                                        />
                                        <StatCard
                                            icon={Users}
                                            label="Membres à jour"
                                            value={kpis.ajour}
                                            badge={`${membres.length} total`}
                                            badgeClass="bg-green-50 text-green-700"
                                            iconBg="bg-green-50"
                                            iconColor="text-green-600"
                                            barColor="bg-green-500"
                                            barPercent={
                                                membres.length > 0
                                                    ? (kpis.ajour /
                                                          membres.length) *
                                                      100
                                                    : 0
                                            }
                                        />
                                        <StatCard
                                            icon={Wallet}
                                            label="En cours de paiement"
                                            value={kpis.encours}
                                            badge="En cours"
                                            badgeClass="bg-sky-50 text-sky-700"
                                            iconBg="bg-sky-50"
                                            iconColor="text-sky-600"
                                            barColor="bg-sky-500"
                                            barPercent={
                                                membres.length > 0
                                                    ? (kpis.encours /
                                                          membres.length) *
                                                      100
                                                    : 0
                                            }
                                        />
                                        <StatCard
                                            icon={AlertCircle}
                                            label="En attente de paiement"
                                            value={kpis.attente}
                                            badge="Retard"
                                            badgeClass="bg-amber-50 text-amber-700"
                                            iconBg="bg-amber-50"
                                            iconColor="text-amber-600"
                                            barColor="bg-amber-500"
                                            barPercent={
                                                membres.length > 0
                                                    ? (kpis.attente /
                                                          membres.length) *
                                                      100
                                                    : 0
                                            }
                                        />
                                        <StatCard
                                            icon={Wallet}
                                            label="Total dû cumulé"
                                            value={kpis.totalDu.toLocaleString()}
                                            badge="F CFA"
                                            badgeClass="bg-red-50 text-red-700"
                                            iconBg="bg-red-50"
                                            iconColor="text-red-600"
                                            barColor="bg-red-500"
                                            barPercent={100}
                                        />
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Membres en retard
                                            </h2>
                                            {membresEnRetard.length > 0 && (
                                                <button
                                                    onClick={() =>
                                                        setActiveTab("membres")
                                                    }
                                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                                >
                                                    Voir tous les membres
                                                </button>
                                            )}
                                        </div>
                                        {membresEnRetard.length === 0 ? (
                                            <p className="text-sm text-gray-400">
                                                Aucun membre en retard. 🎉
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {membresEnRetard.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center justify-between gap-4 flex-wrap p-3 rounded-xl bg-red-50/50 border border-red-100"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-800 text-sm">
                                                                {m.nom}
                                                            </span>
                                                            <span className="text-gray-400 text-xs ml-2">
                                                                {m.famille}
                                                            </span>
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 shrink-0">
                                                            {m.totalDu.toLocaleString()}{" "}
                                                            F dû
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: MEMBRES */}
                            {activeTab === "membres" && (
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <div className="relative max-w-xs mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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

                                    {filteredMembres.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun membre ne correspond à "
                                            {search}".
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
                                                                Famille
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Nombre de cotisations
                                                            </th>
                                                            <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                                Payé
                                                            </th>
                                                            <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                                Dû
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Statut
                                                            </th>
                                                            <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {paginatedMembres.map(
                                                            (m) => (
                                                                <tr key={m.id}>
                                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                                        {m.nom}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-gray-500">
                                                                        {
                                                                            m.famille
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        {(() => {
                                                                            const nbEnCours =
                                                                                m.cotisations.filter(
                                                                                    (
                                                                                        c,
                                                                                    ) =>
                                                                                        c.du >
                                                                                        0,
                                                                                ).length;
                                                                            if (
                                                                                nbEnCours ===
                                                                                0
                                                                            ) {
                                                                                return (
                                                                                    <span className="text-gray-300 text-xs">
                                                                                        0
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                                                                                    {
                                                                                        nbEnCours
                                                                                    }
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-green-700">
                                                                        {m.totalPaye.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-red-600">
                                                                        {m.totalDu.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statutBadge(m.statut).className}`}
                                                                        >
                                                                            {
                                                                                statutBadge(
                                                                                    m.statut,
                                                                                )
                                                                                    .label
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                                                        <button
                                                                            onClick={() =>
                                                                                setDetailMembre(
                                                                                    m,
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                            Voir
                                                                        </button>
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

                            {/* TAB: COTISATIONS */}
                            {activeTab === "cotisations" && (
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                                        Cotisations de la tribu
                                    </h2>
                                    {cotisationsPivot.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucune cotisation ne cible les
                                            membres de cette tribu.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Cotisation
                                                        </th>
                                                        <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                            Concernés
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Attendu
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Payé
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Dû
                                                        </th>
                                                        <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                            À jour
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Détails
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {cotisationsPivot.map(
                                                        (c) => (
                                                            <tr key={c.nom}>
                                                                <td className="px-4 py-2 font-medium text-gray-800">
                                                                    {c.nom}
                                                                </td>
                                                                <td className="px-4 py-2 text-center text-gray-500">
                                                                    {
                                                                        c.nbConcernes
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-gray-700">
                                                                    {c.montantTotal.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-green-700">
                                                                    {c.paye.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-red-600">
                                                                    {c.du.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                                        {
                                                                            c.nbAJour
                                                                        }
                                                                        /
                                                                        {
                                                                            c.nbConcernes
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                                    <button
                                                                        onClick={() =>
                                                                            setDetailCotisation(
                                                                                c,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                        Voir
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: HISTORIQUE */}
                            {activeTab === "historique" && (
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Historique des paiements (
                                            {historique.length})
                                        </h2>
                                        {historique.length > 0 && (
                                            <div className="relative max-w-xs">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={searchHistorique}
                                                    onChange={(e) =>
                                                        setSearchHistorique(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Rechercher..."
                                                    className="input-control pl-9"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {historique.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun paiement enregistré pour le
                                            moment.
                                        </p>
                                    ) : filteredHistorique.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun paiement ne correspond à "
                                            {searchHistorique}".
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
                                                                Cotisation
                                                            </th>
                                                            <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                                Montant
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Mode
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {paginatedHistorique.map(
                                                            (h) => (
                                                                <tr key={h.id}>
                                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                                        {
                                                                            h.membre
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 text-gray-500">
                                                                        {
                                                                            h.cotisation
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-green-700">
                                                                        {h.montant.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-gray-500">
                                                                        {h.mode ||
                                                                            "-"}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-gray-500">
                                                                        {h.date ||
                                                                            "-"}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {historiqueTotalPages > 1 && (
                                                <Pagination
                                                    currentPage={
                                                        historiquePage
                                                    }
                                                    totalPages={
                                                        historiqueTotalPages
                                                    }
                                                    paginate={
                                                        setHistoriquePage
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {detailMembre && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {detailMembre.nom}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {detailMembre.famille}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailMembre(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Résumé */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-indigo-50 p-3 text-center">
                                    <div className="text-xl font-extrabold text-indigo-700">
                                        {detailMembre.cotisations.length}
                                    </div>
                                    <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-wide">
                                        Cotisation
                                        {detailMembre.cotisations.length > 1
                                            ? "s"
                                            : ""}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-green-50 p-3 text-center">
                                    <div className="text-xl font-extrabold text-green-700">
                                        {detailMembre.totalPaye.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-bold text-green-600 uppercase tracking-wide">
                                        Total payé
                                    </div>
                                </div>
                                <div className="rounded-xl bg-red-50 p-3 text-center">
                                    <div className="text-xl font-extrabold text-red-700">
                                        {detailMembre.totalDu.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-bold text-red-600 uppercase tracking-wide">
                                        Reste dû
                                    </div>
                                </div>
                            </div>

                            {/* Détail par cotisation */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-gray-400" />
                                    Détail des cotisations
                                </h3>
                                {detailMembre.cotisations.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        Aucune cotisation ne concerne ce
                                        membre.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                                        Cotisation
                                                    </th>
                                                    <th className="text-right px-3 py-2 font-semibold text-gray-600">
                                                        Montant
                                                    </th>
                                                    <th className="text-right px-3 py-2 font-semibold text-gray-600">
                                                        Payé
                                                    </th>
                                                    <th className="text-right px-3 py-2 font-semibold text-gray-600">
                                                        Reste
                                                    </th>
                                                    <th className="text-center px-3 py-2 font-semibold text-gray-600">
                                                        Statut
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {detailMembre.cotisations.map(
                                                    (c, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-3 py-2 font-medium text-gray-800">
                                                                {c.nom}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-gray-600">
                                                                {c.montant.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-green-700">
                                                                {c.paye.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-red-600">
                                                                {c.du.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statutBadge(c.statut).className}`}
                                                                >
                                                                    {statutBadge(c.statut).label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Historique des paiements */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    Historique des paiements (
                                    {detailPaiements.length})
                                </h3>
                                {detailPaiements.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        Aucun paiement enregistré pour ce
                                        membre.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                                        Cotisation
                                                    </th>
                                                    <th className="text-right px-3 py-2 font-semibold text-gray-600">
                                                        Montant
                                                    </th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                                        Mode
                                                    </th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {detailPaiements.map((p) => (
                                                    <tr key={p.id}>
                                                        <td className="px-3 py-2 font-medium text-gray-800">
                                                            {p.cotisation}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-green-700">
                                                            {p.montant.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500">
                                                            {p.mode || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                                            {p.date || "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailCotisation && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {detailCotisation.nom}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {detailCotisation.nbConcernes} membre
                                    {detailCotisation.nbConcernes > 1
                                        ? "s"
                                        : ""}{" "}
                                    concerné
                                    {detailCotisation.nbConcernes > 1
                                        ? "s"
                                        : ""}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailCotisation(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Ont payé */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    Ont payé (
                                    {detailCotisationMembres.payes.length})
                                </h3>
                                {detailCotisationMembres.payes.length ===
                                0 ? (
                                    <p className="text-sm text-gray-400">
                                        Personne n'a encore payé cette
                                        cotisation.
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {detailCotisationMembres.payes.map(
                                            (m) => (
                                                <div
                                                    key={m.id}
                                                    className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-green-50/50 border border-green-100"
                                                >
                                                    <span className="font-semibold text-gray-800 text-sm">
                                                        {m.nom}
                                                    </span>
                                                    <span className="text-xs font-bold text-green-700">
                                                        {m.cot.paye.toLocaleString()}{" "}
                                                        payé
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* N'ont pas payé */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    N'ont pas payé (
                                    {detailCotisationMembres.nonPayes.length})
                                </h3>
                                {detailCotisationMembres.nonPayes.length ===
                                0 ? (
                                    <p className="text-sm text-gray-400">
                                        Tout le monde est à jour sur cette
                                        cotisation. 🎉
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {detailCotisationMembres.nonPayes.map(
                                            (m) => (
                                                <div
                                                    key={m.id}
                                                    className="flex items-center justify-between gap-4 flex-wrap p-2.5 rounded-xl bg-amber-50/50 border border-amber-100"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-gray-800 text-sm">
                                                            {m.nom}
                                                        </span>
                                                        <span className="text-xs text-gray-400 ml-2">
                                                            {m.cot.paye >
                                                            0
                                                                ? `${m.cot.paye.toLocaleString()} payé sur ${m.cot.montant.toLocaleString()}`
                                                                : "Aucun paiement"}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            openRelanceModal(m)
                                                        }
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold shrink-0"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                        Relancer
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {relanceMembre && (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Envoyer un rappel
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    À {relanceMembre.nom}
                                    {relanceMembre.email
                                        ? ` · ${relanceMembre.email}`
                                        : ""}
                                    {relanceMembre.telephone
                                        ? ` · ${relanceMembre.telephone}`
                                        : ""}
                                </p>
                            </div>
                            <button
                                onClick={() => setRelanceMembre(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                    Message
                                </label>
                                <textarea
                                    value={relanceMessage}
                                    onChange={(e) =>
                                        setRelanceMessage(e.target.value)
                                    }
                                    rows={4}
                                    placeholder="Votre message..."
                                    className="input-control"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                    Aperçu de ce qui sera envoyé
                                </label>
                                <pre className="whitespace-pre-wrap break-words text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 font-sans">
                                    {buildRelanceTexte(
                                        relanceMembre,
                                        relanceMessage,
                                    )}
                                </pre>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 flex-wrap">
                                <button
                                    onClick={() => setRelanceMembre(null)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <a
                                    href={
                                        relanceMembre.telephone
                                            ? buildWhatsAppLink(
                                                  relanceMembre.telephone,
                                                  buildRelanceTexte(
                                                      relanceMembre,
                                                      relanceMessage,
                                                  ),
                                              )
                                            : undefined
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={
                                        relanceMembre.telephone
                                            ? undefined
                                            : "Aucun numéro de téléphone enregistré"
                                    }
                                    aria-disabled={!relanceMembre.telephone}
                                    onClick={(e) => {
                                        if (!relanceMembre.telephone)
                                            e.preventDefault();
                                    }}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white ${
                                        relanceMembre.telephone
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp
                                </a>
                                <button
                                    onClick={envoyerRelance}
                                    disabled={
                                        !relanceMessage.trim() ||
                                        sendingRelance
                                    }
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    {sendingRelance
                                        ? "Envoi..."
                                        : "Envoyer par email"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRelanceTousModal && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Relancer tous les retardataires
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Un email sera envoyé à chaque membre de
                                    votre tribu en retard ayant une adresse
                                    email enregistrée.
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    setShowRelanceTousModal(false)
                                }
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                    Message
                                </label>
                                <textarea
                                    value={relanceTousMessage}
                                    onChange={(e) =>
                                        setRelanceTousMessage(e.target.value)
                                    }
                                    rows={6}
                                    placeholder="Votre message..."
                                    className="input-control"
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                Le résumé payé / reste à payer / total sera
                                automatiquement ajouté à la suite de ce
                                message dans chaque email, avec le nom de
                                chaque destinataire.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() =>
                                        setShowRelanceTousModal(false)
                                    }
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={relancerTous}
                                    disabled={
                                        !relanceTousMessage.trim() ||
                                        relancingTous
                                    }
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                    {relancingTous
                                        ? "Envoi en cours..."
                                        : "Envoyer à tous"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
