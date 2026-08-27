import React, { useEffect, useMemo, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import Select from "react-select";
import { withBasePath } from "../../Utils/urlHelper";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../Helpers/select2SingleOptions";
import {
    ArrowLeft,
    MapPin,
    Cake,
    Briefcase,
    UserCheck,
    UserPlus,
    Search,
    X,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
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
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.375rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 0.75rem; color: #4b5563; font-size: 0.875rem; font-weight: 600; }
    .pagination-btn { min-width: 2.25rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
    .pagination-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-dots { padding: 0 0.25rem; color: #9ca3af; font-weight: 700; user-select: none; }
`;

// Fenêtre de pages autour de la page courante (ex: 1 … 4 5 6 … 30) pour éviter
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

// Styles react-select cohérents avec .input-control pour les filtres multi-sélection
// "Lieu d'habitation" et "Situation professionnelle".
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

export default function TribuAffectation({
    tribus = [],
    membres = [],
    villes = [],
    classeNom,
}) {
    const toast = useToast();

    const [tribuCible, setTribuCible] = useState("");
    const [search, setSearch] = useState("");
    const [selectedVilles, setSelectedVilles] = useState([]);
    const [selectedProfessions, setSelectedProfessions] = useState([]);
    const [ageMin, setAgeMin] = useState("");
    const [ageMax, setAgeMax] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [assigning, setAssigning] = useState(false);
    const itemsPerPage = 8;

    const tribuOptions = tribus.map((t) => ({ value: t.id, label: t.nom }));
    const villeOptions = villes.map((v) => ({ value: v.id, label: v.nom }));

    const filteredMembres = useMemo(() => {
        const term = search.trim().toLowerCase();
        const min = ageMin !== "" ? parseInt(ageMin, 10) : null;
        const max = ageMax !== "" ? parseInt(ageMax, 10) : null;

        return membres.filter((m) => {
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
        membres,
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

    const tribuCibleNom = tribus.find(
        (t) => String(t.id) === String(tribuCible),
    )?.nom;

    const handleBulkAssign = () => {
        if (selectedIds.size === 0 || !tribuCible) return;
        setAssigning(true);
        router.post(
            withBasePath("", "/conducteur/tribus/membres/bulk"),
            { tribu_id: tribuCible, user_ids: Array.from(selectedIds) },
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
            <Head title="Affecter des membres à une tribu" />
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
                                Affecter des membres
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Classe :{" "}
                                <span className="font-semibold text-yellow-300">
                                    {classeNom}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Tribu cible + Filtres (figés en haut pendant le scroll) */}
                        <div className="sticky top-0 z-20 bg-white p-6 pb-5 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
                                <UserPlus className="w-5 h-5" />
                            </span>
                            <p className="text-xs text-gray-500 font-medium">
                                {filteredMembres.length} membre(s) disponible(s) pour affectation
                            </p>
                        </div>

                        <div className="form-group mb-5 max-w-sm">
                            <label className="form-label">
                                Affecter à quelle tribu ?{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select2Single
                                name="tribu_cible"
                                value={tribuCible}
                                onChange={(e) => setTribuCible(e.target.value)}
                                options={tribuOptions}
                                placeholder="Choisir une tribu..."
                                isClearable={false}
                            />
                        </div>

                        {/* Filtres */}
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
                                                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
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
                                                    <td className="px-4 py-2">
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
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold">
                                                                <MapPin className="w-3 h-3" />
                                                                {m.ville ||
                                                                    "Non renseigné"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold">
                                                                <Cake className="w-3 h-3" />
                                                                {m.age !== null
                                                                    ? `${m.age} ans`
                                                                    : "Âge inconnu"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
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
                            </>
                        )}

                        {/* Barre d'action */}
                        <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-gray-100 flex-wrap">
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
                                onClick={handleBulkAssign}
                                disabled={
                                    selectedIds.size === 0 ||
                                    !tribuCible ||
                                    assigning
                                }
                                className="btn btn-primary"
                                title={
                                    !tribuCible
                                        ? "Choisissez d'abord une tribu cible"
                                        : undefined
                                }
                            >
                                <UserCheck className="w-4 h-4" />
                                {tribuCible
                                    ? `Affecter la sélection à ${tribuCibleNom}`
                                    : "Choisir une tribu cible"}
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
