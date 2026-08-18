import React, { useEffect, useMemo, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../Helpers/select2SingleOptions";
import { getStatutBadge } from "../../Helpers/tribuStatutHelper";
import {
    ArrowLeft,
    Crown,
    MapPin,
    Cake,
    Briefcase,
    UserMinus,
    UserCheck,
    UserPlus,
    Search,
    X,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import CotisationBadges from "../../Components/CotisationBadges";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

const FORM_STYLES = `
    :root {
        --primary: #4f46e5; --primary-hover: #4338ca;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .input-control { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1.5px solid #d1d5db; background-color: #ffffff; font-size: 0.9rem; color: #111827; transition: all 0.2s; }
    .input-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); outline: none; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.25rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 1rem; color: #4b5563; font-size: 0.875rem; font-weight: 600; }
    .pagination-btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
    .pagination-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

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

const employmentLabel = (value) =>
    EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === value)?.label ||
    "Non renseigné";

export default function TribuAssigner({
    tribu,
    membresActuels = [],
    membresAAffecter = [],
    villes = [],
}) {
    const toast = useToast();
    const [showAjouterModal, setShowAjouterModal] = useState(false);

    // --- Membres actuels (finances / chef / retrait) ---
    const [searchActuels, setSearchActuels] = useState("");
    const [currentPageActuels, setCurrentPageActuels] = useState(1);
    const itemsPerPageActuels = 10;

    const filteredActuels = membresActuels.filter((m) =>
        m.nom.toLowerCase().includes(searchActuels.trim().toLowerCase()),
    );

    const totalPagesActuels = Math.max(
        1,
        Math.ceil(filteredActuels.length / itemsPerPageActuels),
    );
    const paginatedActuels = filteredActuels.slice(
        (currentPageActuels - 1) * itemsPerPageActuels,
        currentPageActuels * itemsPerPageActuels,
    );
    const goToPageActuels = (page) => {
        if (page < 1 || page > totalPagesActuels) return;
        setCurrentPageActuels(page);
    };

    useEffect(() => {
        setCurrentPageActuels(1);
    }, [searchActuels]);

    useEffect(() => {
        if (currentPageActuels > totalPagesActuels) {
            setCurrentPageActuels(totalPagesActuels);
        }
    }, [totalPagesActuels, currentPageActuels]);

    const handleRemove = (userId) => {
        router.delete(
            withBasePath("", `/conducteur/tribus/${tribu.id}/membres/${userId}`),
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Membre retiré de la tribu."),
                onError: () => toast.error("Erreur lors du retrait."),
            },
        );
    };

    const handleNommerChef = (userId) => {
        router.post(
            withBasePath("", `/conducteur/tribus/${tribu.id}/chef`),
            { user_id: userId },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Chef de tribu nommé."),
                onError: () => toast.error("Erreur lors de la nomination."),
            },
        );
    };

    const handleRetirerChef = (userId) => {
        router.delete(
            withBasePath("", `/conducteur/tribus/${tribu.id}/chef/${userId}`),
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Chef de tribu retiré."),
                onError: () => toast.error("Erreur lors du retrait du chef."),
            },
        );
    };

    const chefIds = (tribu.chefs || []).map((c) => c.id);
    const chefsComplets = chefIds.length >= 2;

    // --- Affectation filtrable de nouveaux membres ---
    const [search, setSearch] = useState("");
    const [ville, setVille] = useState("");
    const [profession, setProfession] = useState("");
    const [ageMin, setAgeMin] = useState("");
    const [ageMax, setAgeMax] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [addingId, setAddingId] = useState(null);
    const itemsPerPage = 8;

    const villeOptions = villes.map((v) => ({ value: v.id, label: v.nom }));

    const filteredMembres = useMemo(() => {
        const term = search.trim().toLowerCase();
        const min = ageMin !== "" ? parseInt(ageMin, 10) : null;
        const max = ageMax !== "" ? parseInt(ageMax, 10) : null;

        return membresAAffecter.filter((m) => {
            if (term && !m.nom.toLowerCase().includes(term)) return false;
            if (ville && m.ville !== ville) return false;
            if (profession && m.employment_status !== profession) return false;
            if (min !== null && (m.age === null || m.age < min)) return false;
            if (max !== null && (m.age === null || m.age > max)) return false;
            return true;
        });
    }, [membresAAffecter, search, ville, profession, ageMin, ageMax]);

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
    }, [search, ville, profession, ageMin, ageMax]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const handleAjouterMembre = (userId) => {
        setAddingId(userId);
        router.post(
            withBasePath("", `/conducteur/tribus/${tribu.id}/membres`),
            { user_id: userId },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(`Membre affecté à ${tribu.nom}.`),
                onError: () => toast.error("Erreur lors de l'affectation."),
                onFinish: () => setAddingId(null),
            },
        );
    };

    return (
        <>
            <Head title={`Affecter des membres - ${tribu.nom}`} />
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
                    {/* HEADER */}
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", "/conducteur/tribus")}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                {tribu.nom}
                            </h1>
                            {tribu.description && (
                                <p className="text-blue-100 opacity-90">
                                    {tribu.description}
                                </p>
                            )}
                        </div>
                        {tribu.chefs && tribu.chefs.length > 0 && (
                            <div className="ml-auto flex flex-wrap gap-2 justify-end">
                                {tribu.chefs.map((chef) => (
                                    <span
                                        key={chef.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold"
                                    >
                                        <Crown className="w-4 h-4" />
                                        {chef.nom}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MEMBRES ACTUELS */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                            <h2 className="text-lg font-bold text-gray-900">
                                Membres actuels ({membresActuels.length})
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                {membresActuels.length > 0 && (
                                    <div className="relative max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchActuels}
                                            onChange={(e) =>
                                                setSearchActuels(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Rechercher..."
                                            className="input-control pl-9"
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowAjouterModal(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shrink-0"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Ajouter des membres
                                </button>
                            </div>
                        </div>

                        {membresActuels.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                Aucun membre affecté pour le moment. Utilisez la
                                section ci-dessous pour en ajouter.
                            </p>
                        ) : filteredActuels.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                Aucun membre ne correspond à "{searchActuels}".
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
                                        {paginatedActuels.map((m) => {
                                            const estChef = chefIds.includes(
                                                m.id,
                                            );
                                            return (
                                                <tr key={m.id}>
                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            {m.nom}
                                                            {estChef && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide shrink-0">
                                                                    <Crown className="w-3 h-3" />
                                                                    Chef
                                                                </span>
                                                            )}
                                                        </div>
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
                                                        {estChef ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleRetirerChef(
                                                                        m.id,
                                                                    )
                                                                }
                                                                className="text-xs text-amber-600 hover:underline mr-3"
                                                            >
                                                                Retirer chef
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    handleNommerChef(
                                                                        m.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    chefsComplets
                                                                }
                                                                title={
                                                                    chefsComplets
                                                                        ? "2 chefs maximum par tribu"
                                                                        : undefined
                                                                }
                                                                className="text-xs text-indigo-600 hover:underline mr-3 disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
                                                            >
                                                                Nommer chef
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                handleRemove(m.id)
                                                            }
                                                            className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                                                        >
                                                            <UserMinus className="w-3 h-3" />
                                                            Retirer
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalPagesActuels > 1 && (
                            <Pagination
                                currentPage={currentPageActuels}
                                totalPages={totalPagesActuels}
                                paginate={goToPageActuels}
                            />
                        )}
                    </div>

                    {/* AFFECTER DES MEMBRES (modal) */}
                    {showAjouterModal && (
                        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">
                                Affecter des membres à {tribu.nom}
                            </h2>
                            <button
                                onClick={() => setShowAjouterModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">

                        {/* Filtres */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher un nom..."
                                    className="input-control pl-9"
                                />
                            </div>
                            <Select2Single
                                name="ville"
                                value={ville}
                                onChange={(e) => setVille(e.target.value)}
                                options={villeOptions}
                                placeholder="Lieu d'habitation..."
                            />
                            <Select2Single
                                name="profession"
                                value={profession}
                                onChange={(e) => setProfession(e.target.value)}
                                options={EMPLOYMENT_STATUS_OPTIONS}
                                placeholder="Situation professionnelle..."
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={ageMin}
                                    onChange={(e) => setAgeMin(e.target.value)}
                                    placeholder="Âge min"
                                    className="input-control"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    value={ageMax}
                                    onChange={(e) => setAgeMax(e.target.value)}
                                    placeholder="Âge max"
                                    className="input-control"
                                />
                            </div>
                        </div>

                        {filteredMembres.length === 0 ? (
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
                                                    Critères
                                                </th>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Tribu actuelle
                                                </th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedMembres.map((m) => {
                                                const dejaDansTribu =
                                                    !!m.tribu_actuelle;
                                                return (
                                                <tr
                                                    key={m.id}
                                                    className={
                                                        dejaDansTribu
                                                            ? "bg-gray-50/70"
                                                            : ""
                                                    }
                                                >
                                                    <td
                                                        className={`px-4 py-2 font-medium ${dejaDansTribu ? "text-gray-400" : "text-gray-800"}`}
                                                    >
                                                        {m.nom}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${dejaDansTribu ? "bg-gray-100 text-gray-400" : "bg-sky-50 text-sky-700"}`}
                                                            >
                                                                <MapPin className="w-3 h-3" />
                                                                {m.ville ||
                                                                    "Non renseigné"}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${dejaDansTribu ? "bg-gray-100 text-gray-400" : "bg-violet-50 text-violet-700"}`}
                                                            >
                                                                <Cake className="w-3 h-3" />
                                                                {m.age !== null
                                                                    ? `${m.age} ans`
                                                                    : "Âge inconnu"}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${dejaDansTribu ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-700"}`}
                                                            >
                                                                <Briefcase className="w-3 h-3" />
                                                                {employmentLabel(
                                                                    m.employment_status,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {m.tribu_actuelle ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[11px] font-semibold">
                                                                {m.tribu_actuelle.nom}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 text-xs font-semibold">
                                                                Non affecté
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button
                                                            onClick={() =>
                                                                handleAjouterMembre(
                                                                    m.id,
                                                                )
                                                            }
                                                            disabled={
                                                                dejaDansTribu ||
                                                                addingId === m.id
                                                            }
                                                            title={
                                                                dejaDansTribu
                                                                    ? `Déjà dans ${m.tribu_actuelle.nom}`
                                                                    : undefined
                                                            }
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                            Ajouter
                                                        </button>
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
                    )}
                </div>
            </div>
        </>
    );
}
