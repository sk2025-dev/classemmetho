import React, { useEffect, useMemo, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../Helpers/select2SingleOptions";
import {
    ArrowLeft,
    Crown,
    MapPin,
    Cake,
    Briefcase,
    UserMinus,
    UserCheck,
    UserPlus,
    CalendarCheck,
    Search,
    X,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import ProfilePhoto from "../../Components/ProfilePhoto";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";
import DeleteConfirmationModal from "../../Components/DeleteConfirmationModal";

const ROLE_LABELS = {
    membre_famille: "Membre de famille",
    responsable_famille: "Responsable de famille",
    conducteur: "Conducteur",
    pasteur: "Pasteur",
};
const formatRole = (role) => ROLE_LABELS[role] || role || "-";
const formatGenre = (genre) =>
    genre === "M" ? "Masculin" : genre === "F" ? "Féminin" : "-";

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
        `${m.prenom} ${m.nom}`
            .toLowerCase()
            .includes(searchActuels.trim().toLowerCase()),
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

    const [removingMembre, setRemovingMembre] = useState(null);
    const [removing, setRemoving] = useState(false);

    const handleRemove = (userId) => {
        setRemoving(true);
        router.delete(
            withBasePath("", `/conducteur/tribus/${tribu.id}/membres/${userId}`),
            {
                preserveScroll: true,
                onSuccess: () => setRemovingMembre(null),
                onError: () => toast.error("Erreur lors du retrait."),
                onFinish: () => setRemoving(false),
            },
        );
    };

    const handleNommerChef = (userId) => {
        router.post(
            withBasePath("", `/conducteur/tribus/${tribu.id}/chef`),
            { user_id: userId },
            {
                preserveScroll: true,
                onError: () => toast.error("Erreur lors de la nomination."),
            },
        );
    };

    const handleRetirerChef = (userId) => {
        router.delete(
            withBasePath("", `/conducteur/tribus/${tribu.id}/chef/${userId}`),
            {
                preserveScroll: true,
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
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [assigning, setAssigning] = useState(false);
    const itemsPerPage = 8;

    const villeOptions = villes.map((v) => ({ value: v.id, label: v.nom }));

    const filteredMembres = useMemo(() => {
        const term = search.trim().toLowerCase();
        const min = ageMin !== "" ? parseInt(ageMin, 10) : null;
        const max = ageMax !== "" ? parseInt(ageMax, 10) : null;

        return membresAAffecter.filter((m) => {
            if (m.tribu_actuelle) return false;
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

    const toggleMembre = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allPageSelected =
        paginatedMembres.length > 0 &&
        paginatedMembres.every((m) => selectedIds.has(m.id));

    const toggleSelectAllPage = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                paginatedMembres.forEach((m) => next.delete(m.id));
            } else {
                paginatedMembres.forEach((m) => next.add(m.id));
            }
            return next;
        });
    };

    const handleAjouterSelection = () => {
        if (selectedIds.size === 0) return;
        setAssigning(true);
        router.post(
            withBasePath("", `/conducteur/tribus/${tribu.id}/membres/bulk`),
            { user_ids: Array.from(selectedIds) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                },
                onError: () => toast.error("Erreur lors de l'affectation."),
                onFinish: () => setAssigning(false),
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
                        <div className="ml-auto flex flex-wrap gap-2 justify-end items-center">
                            {tribu.chefs &&
                                tribu.chefs.map((chef) => (
                                    <span
                                        key={chef.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold"
                                    >
                                        <Crown className="w-4 h-4" />
                                        {chef.nom}
                                    </span>
                                ))}
                            <Link
                                href={withBasePath(
                                    "",
                                    `/conducteur/tribus/${tribu.id}/presences`,
                                )}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold shadow-lg"
                            >
                                <CalendarCheck className="w-4 h-4" />
                                Suivi des présences
                            </Link>
                        </div>
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
                                                N°
                                            </th>
                                            <th className="px-4 py-2"></th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Nom
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Prénom
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Code famille
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Code membre
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Email
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Téléphone
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Genre
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Rôle
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Fonction
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Baptisé
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                1ère Comm.
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Statut matrimonial
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Classe
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Famille
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Date Naiss.
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Relation
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Profession
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Statut emploi
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Lieu Naiss.
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                N° CNI
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Hors Comm.
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Retrait
                                            </th>
                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                Date Retrait
                                            </th>
                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                Statut
                                            </th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedActuels.map((m, idx) => {
                                            const estChef = chefIds.includes(
                                                m.id,
                                            );
                                            return (
                                                <tr key={m.id}>
                                                    <td className="px-4 py-2 text-gray-400">
                                                        {(currentPageActuels -
                                                            1) *
                                                            itemsPerPageActuels +
                                                            idx +
                                                            1}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <ProfilePhoto
                                                            user={m}
                                                            size="sm"
                                                        />
                                                    </td>
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
                                                    <td className="px-4 py-2 text-gray-700">
                                                        {m.prenom}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.code_famille || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.code_membre || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.email || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.telephone || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {formatGenre(m.genre)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {formatRole(m.role)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">
                                                        {m.fonction || "Non renseigné"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {m.baptise ? (
                                                            <span className="text-green-600 font-bold">
                                                                Oui
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                Non
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {m.premiere_communion ? (
                                                            <span className="text-green-600 font-bold">
                                                                Oui
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                Non
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                m.statut_marital ===
                                                                "Marié(e)"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : m.statut_marital ===
                                                                        "Célibataire"
                                                                      ? "bg-blue-100 text-blue-700"
                                                                      : m.statut_marital ===
                                                                          "Veuf(ve)"
                                                                        ? "bg-gray-200 text-gray-600"
                                                                        : m.statut_marital ===
                                                                            "Divorcé(e)"
                                                                          ? "bg-orange-100 text-orange-700"
                                                                          : "bg-purple-100 text-purple-700"
                                                            }`}
                                                        >
                                                            {m.statut_marital}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.classe || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.famille}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.date_naissance || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.relation || "Non renseigné"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.profession || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center whitespace-nowrap">
                                                        {m.employment_status ? (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                                {employmentLabel(
                                                                    m.employment_status,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.lieu_naissance || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.numero_cni || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {m.hors_communaute ? (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                                Oui
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                Non
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {m.retrait ? (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                                Oui
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                Non
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                        {m.date_retrait || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                                        >
                                                            {m.is_active
                                                                ? "Actif"
                                                                : "Inactif"}
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
                                                                setRemovingMembre(
                                                                    m,
                                                                )
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
                                                <th className="px-4 py-2 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={allPageSelected}
                                                        onChange={toggleSelectAllPage}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Membre
                                                </th>
                                                <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                    Critères
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedMembres.map((m) => (
                                                <tr
                                                    key={m.id}
                                                    className={
                                                        selectedIds.has(m.id)
                                                            ? "bg-indigo-50/60"
                                                            : ""
                                                    }
                                                >
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(
                                                                m.id,
                                                            )}
                                                            onChange={() =>
                                                                toggleMembre(
                                                                    m.id,
                                                                )
                                                            }
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                        {m.nom}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700">
                                                                <MapPin className="w-3 h-3" />
                                                                {m.ville ||
                                                                    "Non renseigné"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700">
                                                                <Cake className="w-3 h-3" />
                                                                {m.age !== null
                                                                    ? `${m.age} ans`
                                                                    : "Âge inconnu"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                                                <Briefcase className="w-3 h-3" />
                                                                {employmentLabel(
                                                                    m.employment_status,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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

                                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-600">
                                        {selectedIds.size} membre(s) sélectionné(s)
                                    </span>
                                    <button
                                        onClick={handleAjouterSelection}
                                        disabled={
                                            selectedIds.size === 0 || assigning
                                        }
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Affecter la sélection à {tribu.nom}
                                    </button>
                                </div>
                            </>
                        )}
                        </div>
                        </div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={!!removingMembre}
                title="Retirer ce membre"
                itemName={
                    removingMembre
                        ? `${removingMembre.prenom} ${removingMembre.nom}`
                        : ""
                }
                message={`Êtes-vous sûr de vouloir retirer ${removingMembre?.prenom} ${removingMembre?.nom} de la tribu ${tribu.nom} ?`}
                confirmText="Retirer"
                onConfirm={() => handleRemove(removingMembre.id)}
                onCancel={() => setRemovingMembre(null)}
                loading={removing}
            />
        </>
    );
}
