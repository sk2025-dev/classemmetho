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
import Select from "react-select";
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
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.375rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 0.75rem; color: #4b5563; font-size: 0.875rem; font-weight: 600; }
    .pagination-btn { min-width: 2.25rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
    .pagination-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-dots { padding: 0 0.25rem; color: #9ca3af; font-weight: 700; user-select: none; }
`;

// Fenêtre de pages autour de la page courante (ex: 1 … 4 5 6 … 29) pour éviter
// d'afficher un bouton par page quand il y en a beaucoup.
const getPageWindow = (current, total, delta = 1) => {
    const pages = [];
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            pages.push(i);
        }
    }
    const withDots = [];
    let previous;
    pages.forEach((page) => {
        if (previous !== undefined) {
            if (page - previous === 2) {
                withDots.push(previous + 1);
            } else if (page - previous > 2) {
                withDots.push("…");
            }
        }
        withDots.push(page);
        previous = page;
    });
    return withDots;
};

const Pagination = ({ currentPage, totalPages, paginate }) => {
    const pages = getPageWindow(currentPage, totalPages);

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
            {pages.map((page, idx) =>
                page === "…" ? (
                    <span key={`dots-${idx}`} className="pagination-dots">
                        …
                    </span>
                ) : (
                    <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                        onClick={() => paginate(page)}
                    >
                        {page}
                    </button>
                ),
            )}
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

const AVATAR_COLORS = [
    { bg: "#e0e7ff", text: "#4338ca" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#dcfce7", text: "#166534" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#e0f2fe", text: "#0369a1" },
    { bg: "#f3e8ff", text: "#6b21a8" },
];

const getInitials = (fullName = "") => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
};

const getAvatarColor = (fullName = "") => {
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
        hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Styles react-select cohérents avec .input-control (mêmes filtres multi-sélection
// pour "Lieu d'habitation" et "Situation professionnelle").
const multiSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        minHeight: "2.5rem",
        borderRadius: "0.75rem",
        borderWidth: "1.5px",
        borderColor: state.isFocused ? "#4f46e5" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
        "&:hover": { borderColor: state.isFocused ? "#4f46e5" : "#9ca3af" },
    }),
    valueContainer: (provided) => ({ ...provided, padding: "2px 8px" }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#e0e7ff",
        borderRadius: "0.375rem",
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: "#4338ca",
        fontSize: "0.75rem",
        fontWeight: 600,
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        color: "#4338ca",
        borderRadius: "0 0.375rem 0.375rem 0",
        "&:hover": { backgroundColor: "#c7d2fe", color: "#3730a3" },
    }),
    placeholder: (provided) => ({ ...provided, color: "#9ca3af", fontSize: "0.875rem" }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
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
    const [selectedVilles, setSelectedVilles] = useState([]);
    const [selectedProfessions, setSelectedProfessions] = useState([]);
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
            if (selectedVilles.length > 0 && !selectedVilles.includes(m.ville))
                return false;
            if (
                selectedProfessions.length > 0 &&
                !selectedProfessions.includes(m.employment_status)
            )
                return false;
            if (min !== null && (m.age === null || m.age < min)) return false;
            if (max !== null && (m.age === null || m.age > max)) return false;
            return true;
        });
    }, [
        membresAAffecter,
        search,
        selectedVilles,
        selectedProfessions,
        ageMin,
        ageMax,
    ]);

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
    }, [search, selectedVilles, selectedProfessions, ageMin, ageMax]);

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
                        <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
                                    <UserPlus className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Affecter des membres à {tribu.nom}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        {filteredMembres.length} membre(s) disponible(s) pour affectation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAjouterModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">

                        {/* Filtres (figés en haut pendant le scroll de la liste) */}
                        <div className="sticky top-0 z-20 bg-white px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="form-group">
                                    <label className="form-label">Nom</label>
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
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lieu d'habitation</label>
                                    <Select
                                        inputId="filtre_villes"
                                        value={villeOptions.filter((o) =>
                                            selectedVilles.includes(o.value),
                                        )}
                                        onChange={(opts) =>
                                            setSelectedVilles(
                                                (opts || []).map((o) => o.value),
                                            )
                                        }
                                        options={villeOptions}
                                        placeholder="Toutes les villes"
                                        isMulti
                                        isClearable
                                        styles={multiSelectStyles}
                                        classNamePrefix="react-select"
                                        noOptionsMessage={() => "Aucun lieu"}
                                        menuPortalTarget={
                                            typeof document !== "undefined"
                                                ? document.body
                                                : null
                                        }
                                        menuPosition="fixed"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Situation professionnelle</label>
                                    <Select
                                        inputId="filtre_professions"
                                        value={EMPLOYMENT_STATUS_OPTIONS.filter(
                                            (o) =>
                                                selectedProfessions.includes(
                                                    o.value,
                                                ),
                                        )}
                                        onChange={(opts) =>
                                            setSelectedProfessions(
                                                (opts || []).map((o) => o.value),
                                            )
                                        }
                                        options={EMPLOYMENT_STATUS_OPTIONS}
                                        placeholder="Toutes les situations"
                                        isMulti
                                        isClearable
                                        styles={multiSelectStyles}
                                        classNamePrefix="react-select"
                                        noOptionsMessage={() => "Aucune situation"}
                                        menuPortalTarget={
                                            typeof document !== "undefined"
                                                ? document.body
                                                : null
                                        }
                                        menuPosition="fixed"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Âge</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={ageMin}
                                            onChange={(e) => setAgeMin(e.target.value)}
                                            placeholder="Min"
                                            className="input-control"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            value={ageMax}
                                            onChange={(e) => setAgeMax(e.target.value)}
                                            placeholder="Max"
                                            className="input-control"
                                        />
                                    </div>
                                </div>
                            </div>
                            {(search ||
                                selectedVilles.length > 0 ||
                                selectedProfessions.length > 0 ||
                                ageMin ||
                                ageMax) && (
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setSelectedVilles([]);
                                            setSelectedProfessions([]);
                                            setAgeMin("");
                                            setAgeMax("");
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="p-6 pt-5">
                        {filteredMembres.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-14 text-gray-400">
                                <Search className="w-8 h-8 mb-2 text-gray-300" />
                                <p className="text-sm font-medium">
                                    Aucun membre ne correspond à ces critères.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={allPageSelected}
                                                        onChange={toggleSelectAllPage}
                                                        title="Sélectionner tous les membres de cette page"
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                                    Membre
                                                </th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                                    Critères
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedMembres.map((m) => {
                                                const avatarColor = getAvatarColor(m.nom);
                                                return (
                                                <tr
                                                    key={m.id}
                                                    onClick={() => toggleMembre(m.id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        selectedIds.has(m.id)
                                                            ? "bg-indigo-50/60 hover:bg-indigo-50"
                                                            : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                                style={{
                                                                    backgroundColor: avatarColor.bg,
                                                                    color: avatarColor.text,
                                                                }}
                                                            >
                                                                {getInitials(m.nom)}
                                                            </span>
                                                            <span className="font-medium text-gray-800">
                                                                {m.nom}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
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

                                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap sticky bottom-0 bg-white">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                                            <UserCheck className="w-4 h-4" />
                                            {selectedIds.size} sélectionné(s)
                                        </span>
                                        {selectedIds.size > 0 && (
                                            <button
                                                onClick={() => setSelectedIds(new Set())}
                                                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                                            >
                                                Effacer la sélection
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAjouterSelection}
                                        disabled={
                                            selectedIds.size === 0 || assigning
                                        }
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        {assigning
                                            ? "Affectation en cours..."
                                            : `Affecter la sélection à ${tribu.nom}`}
                                    </button>
                                </div>
                            </>
                        )}
                        </div>
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
