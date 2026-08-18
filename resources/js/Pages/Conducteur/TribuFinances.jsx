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
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import CotisationBadges from "../../Components/CotisationBadges";
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

// Couleurs de badge tribu, en rotation stable par tribu (mêmes teintes que la liste des tribus).
const TRIBU_BADGE_COLORS = [
    "bg-indigo-50 text-indigo-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
    "bg-rose-50 text-rose-700",
    "bg-sky-50 text-sky-700",
    "bg-fuchsia-50 text-fuchsia-700",
];

export default function TribuFinances({
    tribus = [],
    classeNom,
    stats = { totalCollecte: 0, totalDu: 0, nombreTribus: 0 },
}) {
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [tribuFiltre, setTribuFiltre] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [relancingId, setRelancingId] = useState(null);
    const [relancingTous, setRelancingTous] = useState(false);
    const itemsPerPage = 12;

    const relancerMembre = (userId) => {
        setRelancingId(userId);
        router.post(
            withBasePath("", `/conducteur/tribus/membres/${userId}/relancer`),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Rappel envoyé par email."),
                onError: (errors) =>
                    toast.error(
                        errors?.error || "Erreur lors de l'envoi du rappel.",
                    ),
                onFinish: () => setRelancingId(null),
            },
        );
    };

    const relancerTous = () => {
        setRelancingTous(true);
        router.post(
            withBasePath("", "/conducteur/tribus/membres/relancer-tous"),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Rappels envoyés."),
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
            return true;
        });
    }, [tousLesMembres, search, tribuFiltre]);

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
    }, [search, tribuFiltre]);

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
                            onClick={relancerTous}
                            disabled={relancingTous}
                            className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Mail className="w-4 h-4" />
                            {relancingTous
                                ? "Envoi en cours..."
                                : "Relancer tous les retardataires"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Cotisation
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
                                                <th className="px-4 py-2"></th>
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
                                                    <td className="px-4 py-2">
                                                        <CotisationBadges
                                                            cotisations={
                                                                m.cotisations
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-green-700">
                                                        {m.totalPaye.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-red-600">
                                                        {m.totalDu.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatutBadge(m.statut).className}`}
                                                        >
                                                            {getStatutBadge(m.statut).label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                                        {enRetard && (
                                                            <button
                                                                onClick={() =>
                                                                    relancerMembre(
                                                                        m.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    relancingId ===
                                                                    m.id
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Mail className="w-3.5 h-3.5" />
                                                                Relancer
                                                            </button>
                                                        )}
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
        </>
    );
}
