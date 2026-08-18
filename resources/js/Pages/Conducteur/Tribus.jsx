import React, { useEffect, useState } from "react";
import { Link, router, useForm, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    X,
    Plus,
    Users,
    Crown,
    Pencil,
    Trash2,
    UserCog,
    Layers,
    CheckCircle2,
    Search,
    Wallet,
} from "lucide-react";
import DeleteConfirmationModal from "../../Components/DeleteConfirmationModal";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

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
            <div className="text-3xl font-extrabold text-gray-900 leading-tight">
                {value}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {label}
            </div>
        </div>
    </div>
);

// Palette tournante pour varier visuellement les cartes tribu (avatar + accent).
const TRIBE_PALETTE = [
    { text: "text-indigo-600", bg: "bg-indigo-100", accent: "#6366f1" },
    { text: "text-amber-600", bg: "bg-amber-100", accent: "#f59e0b" },
    { text: "text-emerald-600", bg: "bg-emerald-100", accent: "#10b981" },
    { text: "text-rose-600", bg: "bg-rose-100", accent: "#f43f5e" },
    { text: "text-sky-600", bg: "bg-sky-100", accent: "#0ea5e9" },
    { text: "text-fuchsia-600", bg: "bg-fuchsia-100", accent: "#d946ef" },
];

// Styles locaux pour les classes utilitaires form-group/input-control/btn
// (pas de feuille de style partagée pour ces classes dans ce projet — chaque page les redéfinit).
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
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 1rem; color: #eef2ff; font-size: 0.875rem; font-weight: 600; }
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
        <div className="pagination bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 shadow-lg mt-2">
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

const TribuFormModal = ({ isOpen, onClose, tribu, toast }) => {
    const isEditing = !!tribu;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nom: tribu?.nom || "",
        description: tribu?.description || "",
    });

    useEffect(() => {
        if (isOpen) {
            setData({
                nom: tribu?.nom || "",
                description: tribu?.description || "",
            });
            clearErrors();
        }
    }, [isOpen, tribu, setData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const action = isEditing ? put : post;
        const url = isEditing
            ? withBasePath("", `/conducteur/tribus/${tribu.id}`)
            : withBasePath("", "/conducteur/tribus");
        action(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing ? "Tribu mise à jour." : "Tribu créée avec succès.",
                );
                reset();
                onClose();
            },
            onError: () => toast.error("Une erreur est survenue."),
        });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditing ? "Modifier la tribu" : "Créer une tribu"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="form-group">
                        <label className="form-label">
                            Nom de la tribu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.nom}
                            onChange={(e) => setData("nom", e.target.value)}
                            className={`input-control ${errors.nom ? "border-red-500" : ""}`}
                            placeholder="Ex: Tribu de Juda"
                        />
                        {errors.nom && (
                            <p className="text-red-600 text-xs mt-1">{errors.nom}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            rows="3"
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            className="input-control resize-none"
                            placeholder="Décrivez cette tribu..."
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn btn-primary"
                        >
                            {isEditing ? "Mettre à jour" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Tribus({
    tribus = [],
    classeNom,
    stats = { nombreTribus: 0, totalMembres: 0, membresAJour: 0 },
}) {
    const toast = useToast();
    const [editingTribu, setEditingTribu] = useState(null);
    const [deletingTribu, setDeletingTribu] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredTribus = tribus.filter((tribu) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
            tribu.nom.toLowerCase().includes(term) ||
            (tribu.description || "").toLowerCase().includes(term) ||
            (tribu.chefs || []).some((c) =>
                c.nom.toLowerCase().includes(term),
            )
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredTribus.length / itemsPerPage));
    const paginatedTribus = filteredTribus.slice(
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
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handleDelete = () => {
        if (!deletingTribu) return;
        setDeleting(true);
        router.delete(
            withBasePath("", `/conducteur/tribus/${deletingTribu.id}`),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Tribu supprimée.");
                    setDeletingTribu(null);
                },
                onError: (errors) => {
                    toast.error(
                        errors?.error || "Impossible de supprimer cette tribu.",
                    );
                },
                onFinish: () => setDeleting(false),
            },
        );
    };

    return (
        <>
            <Head title={`Tribus - ${classeNom || ""}`} />
            <style>{FORM_STYLES}</style>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-6xl mx-auto py-8">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 text-white">
                            <Link
                                href={withBasePath("", "/conducteur/dashboard")}
                                className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Tribus
                                </h1>
                                <p className="text-blue-100 opacity-90">
                                    Classe :{" "}
                                    <span className="font-semibold text-yellow-300">
                                        {classeNom}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link
                                href={withBasePath("", "/conducteur/tribus/assigner")}
                                className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                <UserCog className="w-5 h-5" /> Affecter un membre
                            </Link>
                            <Link
                                href={withBasePath("", "/conducteur/tribus/finances")}
                                className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Wallet className="w-5 h-5" /> Suivre les finances
                            </Link>
                            <Link
                                href={withBasePath("", "/conducteur/tribus/creer")}
                                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Créer une tribu
                            </Link>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <StatCard
                            icon={Layers}
                            label="Tribus de la classe"
                            value={stats.nombreTribus}
                            gradient="linear-gradient(135deg, #6366f1, #4338ca)"
                        />
                        <StatCard
                            icon={Users}
                            label="Total membres affectés"
                            value={stats.totalMembres}
                            gradient="linear-gradient(135deg, #0ea5e9, #0369a1)"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Membres à jour"
                            value={stats.membresAJour}
                            gradient="linear-gradient(135deg, #22c55e, #15803d)"
                        />
                    </div>

                    {/* SEARCH */}
                    <div className="relative mb-6 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une tribu par nom, chef ou description..."
                            className="input-control pl-10 bg-white/95"
                        />
                    </div>

                    {/* TABLE */}
                    {tribus.length === 0 ? (
                        <div className="bg-white/90 rounded-2xl p-10 text-center text-gray-500">
                            Aucune tribu créée pour le moment.
                        </div>
                    ) : filteredTribus.length === 0 ? (
                        <div className="bg-white/90 rounded-2xl p-10 text-center text-gray-500">
                            Aucune tribu ne correspond à "{search}".
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 font-semibold text-gray-600">
                                                Tribu
                                            </th>
                                            <th className="text-left px-5 py-3 font-semibold text-gray-600">
                                                Description
                                            </th>
                                            <th className="text-center px-5 py-3 font-semibold text-gray-600">
                                                Membres
                                            </th>
                                            <th className="text-left px-5 py-3 font-semibold text-gray-600">
                                                Chef
                                            </th>
                                            <th className="text-center px-5 py-3 font-semibold text-gray-600">
                                                Statut
                                            </th>
                                            <th className="text-right px-5 py-3 font-semibold text-gray-600">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedTribus.map((tribu, idx) => {
                                            const palette =
                                                TRIBE_PALETTE[
                                                    idx % TRIBE_PALETTE.length
                                                ];
                                            return (
                                                <tr
                                                    key={tribu.id}
                                                    className="hover:bg-gray-50/80 transition-colors"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${palette.bg} ${palette.text}`}
                                                            >
                                                                {tribu.nom
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-gray-900">
                                                                {tribu.nom}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                                                        {tribu.description || (
                                                            <span className="italic text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                                                            <Users className="w-3.5 h-3.5" />
                                                            {tribu.membres_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {tribu.chefs &&
                                                        tribu.chefs.length >
                                                            0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {tribu.chefs.map(
                                                                    (chef) => (
                                                                        <span
                                                                            key={
                                                                                chef.id
                                                                            }
                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                                                                        >
                                                                            <Crown className="w-3.5 h-3.5" />
                                                                            {
                                                                                chef.nom
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-xs font-semibold italic">
                                                                <Crown className="w-3.5 h-3.5" />
                                                                Aucun chef
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                tribu.status ===
                                                                "active"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-100 text-gray-500"
                                                            }`}
                                                        >
                                                            {tribu.status ===
                                                            "active"
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Link
                                                                href={withBasePath(
                                                                    "",
                                                                    `/conducteur/tribus/${tribu.id}/assigner`,
                                                                )}
                                                                className="text-xs font-bold text-indigo-600 hover:underline mr-2 whitespace-nowrap"
                                                            >
                                                                Gérer
                                                            </Link>
                                                            <button
                                                                onClick={() =>
                                                                    setEditingTribu(
                                                                        tribu,
                                                                    )
                                                                }
                                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Modifier"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setDeletingTribu(
                                                                        tribu,
                                                                    )
                                                                }
                                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {filteredTribus.length > 0 && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            paginate={goToPage}
                        />
                    )}
                </div>
            </div>

            <TribuFormModal
                isOpen={!!editingTribu}
                onClose={() => setEditingTribu(null)}
                tribu={editingTribu}
                toast={toast}
            />

            <DeleteConfirmationModal
                isOpen={!!deletingTribu}
                title="Supprimer la tribu"
                message="Êtes-vous sûr de vouloir supprimer cette tribu ?"
                itemName={deletingTribu?.nom}
                onConfirm={handleDelete}
                onCancel={() => setDeletingTribu(null)}
                loading={deleting}
            />
        </>
    );
}
