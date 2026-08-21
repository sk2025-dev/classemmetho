import React, { useEffect, useMemo, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../Helpers/select2SingleOptions";
import {
    ArrowLeft,
    MapPin,
    Cake,
    Briefcase,
    UserCheck,
    Search,
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

export default function TribuAffectation({
    tribus = [],
    membres = [],
    villes = [],
    classeNom,
}) {
    const toast = useToast();

    const [tribuCible, setTribuCible] = useState("");
    const [search, setSearch] = useState("");
    const [ville, setVille] = useState("");
    const [profession, setProfession] = useState("");
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
            if (ville && m.ville !== ville) return false;
            if (profession && m.employment_status !== profession) return false;
            if (min !== null && (m.age === null || m.age < min)) return false;
            if (max !== null && (m.age === null || m.age > max)) return false;
            return true;
        });
    }, [membres, search, ville, profession, ageMin, ageMax]);

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

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {/* Tribu cible */}
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
                            </>
                        )}

                        {/* Barre d'action */}
                        <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-gray-100 flex-wrap">
                            <span className="text-sm font-semibold text-gray-600">
                                {selectedIds.size} membre(s) sélectionné(s)
                            </span>
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
        </>
    );
}
