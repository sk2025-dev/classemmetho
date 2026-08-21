import React, { useEffect, useMemo, useState } from "react";
import { Link, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    ArrowLeft,
    History,
    Search,
    Clock,
    Check,
    X as XIcon,
    ArrowRight,
    User as UserIcon,
    Send,
    UserCheck,
} from "lucide-react";

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

const STATUT_META = {
    en_attente_origine: {
        label: "En attente du départ",
        badgeClass: "bg-amber-100 text-amber-700",
        icon: Clock,
    },
    en_attente_destination: {
        label: "En attente de l'accueil",
        badgeClass: "bg-sky-100 text-sky-700",
        icon: Clock,
    },
    validee: {
        label: "Validée",
        badgeClass: "bg-green-100 text-green-700",
        icon: Check,
    },
    refusee: {
        label: "Refusée",
        badgeClass: "bg-red-100 text-red-700",
        icon: XIcon,
    },
};

const StatutBadge = ({ statut }) => {
    const meta = STATUT_META[statut] || {
        label: statut,
        badgeClass: "bg-gray-100 text-gray-500",
        icon: Clock,
    };
    const Icon = meta.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.badgeClass}`}
        >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            {meta.label}
        </span>
    );
};

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
    { key: "envoyees", label: "Envoyées", icon: Send },
    { key: "accueillis", label: "Membres accueillis", icon: UserCheck },
];

export default function TribuHistoriqueTransferts({
    basePath = "/membre-famille",
    demandes = [],
    accueillis = [],
}) {
    const [activeTab, setActiveTab] = useState("envoyees");
    const [draftSearch, setDraftSearch] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return demandes;
        return demandes.filter(
            (d) =>
                d.membre.toLowerCase().includes(term) ||
                (d.tribuOrigine || "").toLowerCase().includes(term) ||
                (d.tribuDestination || "").toLowerCase().includes(term),
        );
    }, [demandes, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const applySearch = () => {
        setSearch(draftSearch);
        setCurrentPage(1);
    };

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    // --- Onglet "Membres accueillis" ---
    const [draftSearchAccueil, setDraftSearchAccueil] = useState("");
    const [searchAccueil, setSearchAccueil] = useState("");
    const [accueilPage, setAccueilPage] = useState(1);

    const filteredAccueillis = useMemo(() => {
        const term = searchAccueil.trim().toLowerCase();
        if (!term) return accueillis;
        return accueillis.filter(
            (a) =>
                a.membre.toLowerCase().includes(term) ||
                (a.tribuOrigine || "").toLowerCase().includes(term),
        );
    }, [accueillis, searchAccueil]);

    const accueilTotalPages = Math.max(
        1,
        Math.ceil(filteredAccueillis.length / itemsPerPage),
    );
    const paginatedAccueillis = filteredAccueillis.slice(
        (accueilPage - 1) * itemsPerPage,
        accueilPage * itemsPerPage,
    );
    const goToAccueilPage = (page) => {
        if (page < 1 || page > accueilTotalPages) return;
        setAccueilPage(page);
    };

    const applySearchAccueil = () => {
        setSearchAccueil(draftSearchAccueil);
        setAccueilPage(1);
    };

    useEffect(() => {
        if (accueilPage > accueilTotalPages) setAccueilPage(accueilTotalPages);
    }, [accueilTotalPages, accueilPage]);

    return (
        <>
            <Head title="Historique des transferts" />
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
                            href={withBasePath("", `${basePath}/tribu`)}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Historique des transferts
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Demandes envoyées ({demandes.length}) ·
                                Membres accueillis ({accueillis.length})
                            </p>
                        </div>
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

                    {activeTab === "envoyees" && (
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={draftSearch}
                                    onChange={(e) =>
                                        setDraftSearch(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && applySearch()
                                    }
                                    placeholder="Rechercher un membre ou une tribu..."
                                    className="input-control pl-9"
                                />
                            </div>
                            <button
                                onClick={applySearch}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                Rechercher
                            </button>
                        </div>

                        {demandes.length === 0 ? (
                            <div className="text-center py-10">
                                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">
                                    Vous n'avez envoyé aucune demande de
                                    transfert pour le moment.
                                </p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-10">
                                Aucune demande ne correspond à "{search}".
                            </p>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginated.map((d) => (
                                        <div
                                            key={d.id}
                                            className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition"
                                        >
                                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="font-bold text-gray-900">
                                                        {d.membre}
                                                    </span>
                                                    {d.pourSoiMeme && (
                                                        <span className="text-xs text-gray-400">
                                                            (vous-même)
                                                        </span>
                                                    )}
                                                </div>
                                                <StatutBadge
                                                    statut={d.statut}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <span className="font-semibold">
                                                    {d.tribuOrigine}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="font-semibold">
                                                    {d.tribuDestination}
                                                </span>
                                                <span className="text-gray-400">
                                                    · envoyée le {d.dateEnvoi}
                                                </span>
                                            </div>

                                            {d.motif && (
                                                <p className="text-xs text-gray-500 italic mb-2">
                                                    « {d.motif} »
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                                                {d.origineValidePar && (
                                                    <span>
                                                        Départ validé par{" "}
                                                        <span className="font-semibold text-gray-600">
                                                            {
                                                                d.origineValidePar
                                                            }
                                                        </span>{" "}
                                                        le {d.origineValideLe}
                                                    </span>
                                                )}
                                                {d.statut === "validee" &&
                                                    d.traitePar && (
                                                        <span>
                                                            Arrivée validée
                                                            par{" "}
                                                            <span className="font-semibold text-gray-600">
                                                                {d.traitePar}
                                                            </span>{" "}
                                                            le {d.traiteLe}
                                                        </span>
                                                    )}
                                                {d.statut === "refusee" &&
                                                    d.traitePar && (
                                                        <span>
                                                            Refusée par{" "}
                                                            <span className="font-semibold text-gray-600">
                                                                {d.traitePar}
                                                            </span>{" "}
                                                            le {d.traiteLe}
                                                            {d.commentaire &&
                                                                ` — "${d.commentaire}"`}
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
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

                    {activeTab === "accueillis" && (
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={draftSearchAccueil}
                                    onChange={(e) =>
                                        setDraftSearchAccueil(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        applySearchAccueil()
                                    }
                                    placeholder="Rechercher un membre ou une tribu..."
                                    className="input-control pl-9"
                                />
                            </div>
                            <button
                                onClick={applySearchAccueil}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                Rechercher
                            </button>
                        </div>

                        {accueillis.length === 0 ? (
                            <div className="text-center py-10">
                                <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">
                                    Vous n'avez encore accueilli aucun membre
                                    dans votre tribu.
                                </p>
                            </div>
                        ) : filteredAccueillis.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-10">
                                Aucun membre ne correspond à "
                                {searchAccueil}".
                            </p>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginatedAccueillis.map((a) => (
                                        <div
                                            key={a.id}
                                            className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition"
                                        >
                                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="font-bold text-gray-900">
                                                        {a.membre}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    <Check className="w-3.5 h-3.5" />
                                                    Accueilli
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <span className="font-semibold">
                                                    {a.tribuOrigine}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="font-semibold">
                                                    {a.tribuDestination}
                                                </span>
                                                <span className="text-gray-400">
                                                    · accueilli le{" "}
                                                    {a.dateAcceptation}
                                                </span>
                                            </div>

                                            {a.motif && (
                                                <p className="text-xs text-gray-500 italic mb-2">
                                                    « {a.motif} »
                                                </p>
                                            )}

                                            <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                                                Demande envoyée
                                                {a.demandeurEstMembre
                                                    ? " par le membre lui-même"
                                                    : " par"}{" "}
                                                {!a.demandeurEstMembre && (
                                                    <span className="font-semibold text-gray-600">
                                                        {a.demandeur}
                                                    </span>
                                                )}{" "}
                                                le {a.dateEnvoi}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {accueilTotalPages > 1 && (
                                    <Pagination
                                        currentPage={accueilPage}
                                        totalPages={accueilTotalPages}
                                        paginate={goToAccueilPage}
                                    />
                                )}
                            </>
                        )}
                    </div>
                    )}
                </div>
            </div>
        </>
    );
}
