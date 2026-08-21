import React, { useEffect, useMemo, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    ArrowLeft,
    Crown,
    Wallet,
    AlertCircle,
    Layers,
    Search,
    Mail,
    Eye,
    X,
    Receipt,
    CreditCard,
    Send,
    MessageCircle,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import { getStatutBadge } from "../../Helpers/tribuStatutHelper";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

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

const StatCard = ({ icon: IconComp, label, value, gradient }) => (
    <div className="relative bg-white rounded-2xl shadow-xl p-5 border border-white/60 flex items-center gap-4 overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
        <div
            className="absolute inset-0 opacity-[0.06] group-hover:opacity-10 transition-opacity"
            style={{ background: gradient }}
        />
        <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg"
            style={{ background: gradient }}
        >
            <IconComp className="w-6 h-6" strokeWidth={2.25} />
        </div>
        <div className="relative">
            <div className="text-2xl font-extrabold text-gray-900 leading-tight">
                {value.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {label}
            </div>
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

// Couleurs de badge tribu, en rotation stable par tribu (mêmes teintes que la liste des tribus).
const TRIBU_BADGE_COLORS = [
    "bg-indigo-50 text-indigo-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
    "bg-rose-50 text-rose-700",
    "bg-sky-50 text-sky-700",
    "bg-fuchsia-50 text-fuchsia-700",
];

// "Aucun paiement" est plus clair que "en attente" quand rien n'a encore été
// versé — que ce soit pour une cotisation précise (modale de détail) ou pour
// l'ensemble d'un membre (colonne Statut du tableau).
const statutBadge = (statut) =>
    statut === "EN_ATTENTE"
        ? { label: "Aucun paiement", className: "bg-gray-100 text-gray-500" }
        : getStatutBadge(statut);

export default function TribuFinances({
    tribus = [],
    classeNom,
    stats = {
        totalCollecte: 0,
        totalDu: 0,
        nombreTribus: 0,
        nombreCotisations: 0,
    },
}) {
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [tribuFiltre, setTribuFiltre] = useState("");
    const [statutFiltre, setStatutFiltre] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [relancingTous, setRelancingTous] = useState(false);
    const [showRelanceTousModal, setShowRelanceTousModal] = useState(false);
    const [relanceTousMessage, setRelanceTousMessage] = useState(
        DEFAULT_RELANCE_MESSAGE,
    );
    const [detailMembre, setDetailMembre] = useState(null);
    const [relanceMembre, setRelanceMembre] = useState(null);
    const [relanceMessage, setRelanceMessage] = useState(
        DEFAULT_RELANCE_MESSAGE,
    );
    const [sendingRelance, setSendingRelance] = useState(false);
    const itemsPerPage = 12;

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
                `/conducteur/tribus/membres/${relanceMembre.id}/relancer`,
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

    const openRelanceTousModal = () => {
        setRelanceTousMessage(DEFAULT_RELANCE_MESSAGE);
        setShowRelanceTousModal(true);
    };

    const relancerTous = () => {
        setRelancingTous(true);
        router.post(
            withBasePath("", "/conducteur/tribus/membres/relancer-tous"),
            { message: relanceTousMessage },
            {
                preserveScroll: true,
                onSuccess: () => setShowRelanceTousModal(false),
                onError: () => toast.error("Erreur lors de l'envoi des rappels."),
                onFinish: () => setRelancingTous(false),
            },
        );
    };

    const tribuColorById = useMemo(() => {
        const map = {};
        tribus.forEach((t, idx) => {
            map[t.id] = TRIBU_BADGE_COLORS[idx % TRIBU_BADGE_COLORS.length];
        });
        return map;
    }, [tribus]);

    const tribuOptions = tribus.map((t) => ({ value: t.id, label: t.nom }));

    const statutOptions = [
        { value: "A_JOUR", label: "À jour" },
        { value: "EN_COURS", label: "En cours" },
        { value: "EN_ATTENTE", label: "Aucun paiement" },
    ];

    // Aplatit les tribus en une seule liste de membres, chacun avec sa tribu attachée.
    const tousLesMembres = useMemo(
        () =>
            tribus.flatMap((tribu) =>
                tribu.membres.map((m) => ({
                    ...m,
                    tribuId: tribu.id,
                    tribuNom: tribu.nom,
                    chefIds: (tribu.chefs || []).map((c) => c.id),
                })),
            ),
        [tribus],
    );

    const filteredMembres = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tousLesMembres.filter((m) => {
            if (term && !m.nom.toLowerCase().includes(term)) return false;
            if (tribuFiltre && String(m.tribuId) !== String(tribuFiltre))
                return false;
            if (statutFiltre && m.statut !== statutFiltre) return false;
            return true;
        });
    }, [tousLesMembres, search, tribuFiltre, statutFiltre]);

    const totalPages = Math.max(1, Math.ceil(filteredMembres.length / itemsPerPage));
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
    }, [search, tribuFiltre, statutFiltre]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    return (
        <>
            <Head title={`Finances des tribus - ${classeNom || ""}`} />
            <style>{FORM_STYLES}</style>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

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
                                Finances des tribus
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Classe :{" "}
                                <span className="font-semibold text-yellow-300">
                                    {classeNom}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={Wallet}
                            label="Total collecté"
                            value={stats.totalCollecte}
                            gradient="linear-gradient(135deg, #22c55e, #15803d)"
                        />
                        <StatCard
                            icon={AlertCircle}
                            label="Total dû"
                            value={stats.totalDu}
                            gradient="linear-gradient(135deg, #f59e0b, #b45309)"
                        />
                        <StatCard
                            icon={Layers}
                            label="Tribus"
                            value={stats.nombreTribus}
                            gradient="linear-gradient(135deg, #6366f1, #4338ca)"
                        />
                        <StatCard
                            icon={Receipt}
                            label="Cotisations"
                            value={stats.nombreCotisations}
                            gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {/* Filtres */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher un membre..."
                                    className="input-control pl-9"
                                />
                            </div>
                            <Select2Single
                                name="tribu_filtre"
                                value={tribuFiltre}
                                onChange={(e) => setTribuFiltre(e.target.value)}
                                options={tribuOptions}
                                placeholder="Filtrer par tribu..."
                            />
                            <Select2Single
                                name="statut_filtre"
                                value={statutFiltre}
                                onChange={(e) => setStatutFiltre(e.target.value)}
                                options={statutOptions}
                                placeholder="Filtrer par statut..."
                            />
                        </div>

                        {tousLesMembres.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                Aucun membre affecté à une tribu pour le moment.
                            </p>
                        ) : filteredMembres.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                Aucun membre ne correspond à ces critères.
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
                                            {paginatedMembres.map((m) => {
                                                const enRetard =
                                                    m.statut === "EN_ATTENTE" ||
                                                    m.statut === "EN_COURS";
                                                return (
                                                <tr key={`${m.tribuId}-${m.id}`}>
                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            {m.nom}
                                                            {m.chefIds.includes(m.id) && (
                                                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span
                                                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                                tribuColorById[
                                                                    m.tribuId
                                                                ]
                                                            }`}
                                                        >
                                                            {m.tribuNom}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.famille}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {(() => {
                                                            const nbEnCours =
                                                                m.cotisations.filter(
                                                                    (c) =>
                                                                        c.du >
                                                                        0,
                                                                ).length;
                                                            if (
                                                                nbEnCours === 0
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
                                                            {statutBadge(m.statut).label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                                        <div className="inline-flex items-center gap-2">
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
                                                            {enRetard && (
                                                                <button
                                                                    onClick={() =>
                                                                        openRelanceModal(
                                                                            m,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold"
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                    Relancer
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                );
                                            })}
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
                                    {detailMembre.tribuNom} ·{" "}
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
                                    {detailMembre.paiements.length})
                                </h3>
                                {detailMembre.paiements.length === 0 ? (
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
                                                {detailMembre.paiements.map(
                                                    (p) => (
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
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {relanceMembre && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                                    Un email sera envoyé à chaque membre en
                                    retard ayant une adresse email
                                    enregistrée.
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
