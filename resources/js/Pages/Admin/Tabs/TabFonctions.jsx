import React, { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";

// --- CSS GLOBAL (identique à celui de la page Classe) ---
const GLOBAL_STYLES = `
    :root {
        --primary: #2563eb; --primary-hover: #1d4ed8;
        --success: #16a34a; --danger: #dc2626; --warning: #ca8a04;
        --glass-bg: rgba(255, 255, 255, 0.7); --glass-border: rgba(255, 255, 255, 0.5);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .glass-panel {
        background: var(--glass-bg); backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    .btn-success { background-color: var(--success); color: white; }
    .btn-success:hover { background-color: #15803d; }
    .btn-danger { background-color: var(--danger); color: white; }
    .btn-danger:hover { background-color: #b91c1c; }
    .btn-warning { background-color: var(--warning); color: white; }
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
    .btn-icon { padding: 0.5rem; border-radius: 0.5rem; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
    .btn-icon:hover { transform: translateY(-1px); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }

    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
    @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

    .stat-card { background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid #f3f4f6; }
    .stat-value { font-size: 1.875rem; font-weight: 800; margin: 0.25rem 0; }
    .stat-label { font-size: 0.875rem; color: #6b7280; font-weight: 600; }

    .filters-bar { border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    @media (min-width: 768px) { .filters-bar { flex-direction: row; align-items: center; justify-content: space-between; } }
    .filter-group { display: flex; gap: 0.5rem; flex: 1; flex-wrap: wrap; }
    .input-control { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; background-color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; color: #111827; transition: ring 0.2s; }
    .input-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); outline: none; }
    .input-search-wrapper { position: relative; }
    .input-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 1.25rem; height: 1.25rem; }
    .input-search { padding-left: 2.5rem; }

    .table-container { background: var(--glass-bg); border-radius: 1rem; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--glass-border); display: flex; flex-direction: column; flex: 1; min-height: 500px; }
    .table-scroll { overflow-x: auto; width: 100%; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead { background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; position: sticky; top: 0; z-index: 10; }
    th { padding: 0.75rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    td { padding: 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; vertical-align: middle; }
    tr:hover td { background-color: rgba(255, 255, 255, 0.9); }

    .status-badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid; }
    .status-active { background-color: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
    .status-inactive { background-color: #fee2e2; color: #dc2626; border-color: #fecaca; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem; background: white; border-top: 1px solid #e5e7eb; }
    .pagination-btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; transition: all 0.2s; }
    .pagination-btn:hover { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-info { margin-right: 1rem; color: #6b7280; font-size: 0.875rem; }

    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

// --- Composant Alert Modal (identique à celui de la page Classe) ---
const AlertModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText = "Annuler",
    type = "warning",
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        warning: {
            icon: (
                <svg
                    className="w-12 h-12 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                </svg>
            ),
            btnClass: "btn-warning",
        },
        danger: {
            icon: (
                <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            btnClass: "btn-danger",
        },
        success: {
            icon: (
                <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            btnClass: "btn-success",
        },
    };
    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-t-4 border-yellow-500">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-full bg-white shadow-sm">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-gray-700">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn w-full sm:w-auto ${config.btnClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Composant Actions SVG (adapté pour afficher le compteur de membres) ---
const ActionButtonsSVG = ({ rowData, onEdit, onDelete, onView, count }) => {
    return (
        <div className="flex items-center justify-center gap-2">
            <button
                onClick={onView}
                className="btn-icon"
                style={{
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    border: "2px solid rgba(37, 99, 235, 0.2)",
                }}
                title={`Voir les ${count} membres`}
            >
                <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                </svg>
            </button>
            <button
                onClick={onEdit}
                className="btn-icon"
                style={{
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    border: "2px solid rgba(37, 99, 235, 0.2)",
                }}
                title="Modifier"
            >
                <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                </svg>
            </button>
            <button
                onClick={onDelete}
                className="btn-icon"
                style={{
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    border: "2px solid rgba(220, 38, 38, 0.2)",
                }}
                title="Supprimer"
            >
                <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
};

// --- Modal Détails des Membres (style identique aux modals de la page Classe) ---
const FonctionMembersModal = ({
    isOpen,
    onClose,
    title,
    members = [],
    onViewProfile,
}) => {
    const [search, setSearch] = useState("");
    if (!isOpen) return null;

    const filteredMembers = members.filter((m) => {
        const term = search.toLowerCase();
        return (
            m.nom?.toLowerCase().includes(term) ||
            m.prenom?.toLowerCase().includes(term) ||
            m.email?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-white/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0h.01"
                                />
                            </svg>
                        </span>
                        {title}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-600">
                            {filteredMembers.length} / {members.length}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 bg-white">
                    <div className="mb-6 relative w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="table-container min-h-[400px]">
                        <div className="table-scroll h-full">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Nom
                                        </th>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Prénom
                                        </th>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Téléphone
                                        </th>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Classe
                                        </th>
                                        <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white/60 backdrop-blur-sm">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((m, idx) => (
                                            <tr
                                                key={idx}
                                                className="hover:bg-white/90 transition-all duration-200"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800 text-center">
                                                    {m.nom}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                                    {m.prenom}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    {m.email || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    {m.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    {m.classe || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                    <button
                                                        className="btn-icon text-blue-600"
                                                        style={{
                                                            backgroundColor:
                                                                "rgba(37, 99, 235, 0.1)",
                                                        }}
                                                        title="Profil"
                                                        onClick={() =>
                                                            onViewProfile?.(m)
                                                        }
                                                    >
                                                        Profil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-12 text-center text-gray-400"
                                            >
                                                Aucun membre trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-200 flex justify-end shrink-0">
                    <button onClick={onClose} className="btn btn-primary">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberProfileModal = ({ isOpen, onClose, member }) => {
    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">
                        Profil du membre
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Nom</p>
                        <p className="font-semibold text-gray-900">
                            {member.nom || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Prénom</p>
                        <p className="font-semibold text-gray-900">
                            {member.prenom || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">
                            {member.email || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Téléphone</p>
                        <p className="font-semibold text-gray-900">
                            {member.telephone || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Classe</p>
                        <p className="font-semibold text-gray-900">
                            {member.classe || "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Rôle</p>
                        <p className="font-semibold text-gray-900">
                            {member.role || "-"}
                        </p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex justify-end">
                    <button onClick={onClose} className="btn btn-primary">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal Formulaire (style identique aux modals de la page Classe) ---
const FonctionFormModal = ({ isOpen, onClose, fonctionData, onSuccess }) => {
    const isEditing = !!fonctionData;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nom: fonctionData?.nom || "",
        description: fonctionData?.description || "",
    });

    useEffect(() => {
        if (isOpen) {
            setData({
                nom: fonctionData?.nom || "",
                description: fonctionData?.description || "",
            });
        }
    }, [isOpen, fonctionData, setData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const action = isEditing ? put : post;
        const url = isEditing
            ? withBasePath("", `/admin/fonctions/${fonctionData.id}`)
            : withBasePath("", "/admin/fonctions");
        action(url, {
            onSuccess: () => {
                onClose();
                if (onSuccess) onSuccess();
            },
            preserveScroll: true,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            {isEditing ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            )}
                        </span>
                        {isEditing
                            ? "Modifier la fonction"
                            : "Créer une fonction"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="form-label">
                                Nom de la fonction{" "}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nom}
                                onChange={(e) => setData("nom", e.target.value)}
                                className={`input-control ${errors.nom ? "border-red-500" : ""}`}
                                placeholder="Ex: Diacre, Ancien"
                            />
                            {errors.nom && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.nom}
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                rows="4"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                className="input-control resize-none"
                                placeholder="Décrivez les responsabilités..."
                            ></textarea>
                        </div>
                    </form>
                </div>
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className={`btn btn-primary w-full sm:w-auto ${processing ? "opacity-75 cursor-not-allowed" : ""}`}
                    >
                        {processing
                            ? "En cours..."
                            : isEditing
                              ? "Mettre à jour"
                              : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Composant Pagination (identique à celui de la page Classe) ---
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

// --- Composant Principal TabFonctions (calqué sur TabClasses) ---
const TabFonctions = ({ rawData, onDelete, onUpdate }) => {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingFonction, setEditingFonction] = useState(null);
    const [selectedFonction, setSelectedFonction] = useState(null);
    const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [selectedFonctionForDelete, setSelectedFonctionForDelete] =
        useState(null);

    // Pagination
    const itemsPerPage = 10;

    const fonctionsData = rawData?.fonctions || [];
    const usersByFonction = rawData?.usersByFonction || {};

    // ✅ Recharger les données si elles sont vides
    useEffect(() => {
        if (!fonctionsData || fonctionsData.length === 0) {
            console.log("Fonctions vides - rechargement des données...");
            router.reload({ only: ["dataByType"] });
        }
    }, [fonctionsData.length]);

    // Enrichissement des données
    const enrichedData = fonctionsData.map((fonc) => {
        const members = usersByFonction[fonc.nom] || [];
        return {
            ...fonc,
            membres_count: members.length,
            members_list: members,
        };
    });

    // Filtrage
    const filteredData = enrichedData.filter((item) => {
        const term = search.toLowerCase();
        return (
            item.nom?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Statistiques (2 cartes)
    const stats = {
        total: fonctionsData.length,
        totalMembersAssigned: enrichedData.reduce(
            (acc, f) => acc + f.membres_count,
            0,
        ),
    };

    const openDeleteAlert = (fonction) => {
        setSelectedFonctionForDelete(fonction);
        setShowDeleteAlert(true);
    };
    const handleDeleteFonction = () => {
        if (!selectedFonctionForDelete) return;
        router.delete(
            withBasePath(
                "",
                `/admin/fonctions/${selectedFonctionForDelete.id}`,
            ),
            {
                onSuccess: () => {
                    setShowDeleteAlert(false);
                    setSelectedFonctionForDelete(null);
                    if (onDelete) onDelete();
                    router.reload({ only: ["rawData"] });
                },
                preserveScroll: true,
            },
        );
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <div className="flex flex-col h-full animate-fade-in-up">
                {/* --- STATS GRID (style identique à TabClasses) --- */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="text-blue-500 mb-2">
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Fonctions</span>
                    </div>
                    <div className="stat-card">
                        <div className="text-purple-500 mb-2">
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        </div>
                        <span className="stat-value">
                            {stats.totalMembersAssigned}
                        </span>
                        <span className="stat-label">Membres Assignés</span>
                    </div>
                </div>

                {/* --- FILTERS BAR (exactement comme dans TabClasses) --- */}
                <div className="glass-panel filters-bar">
                    <div className="filter-group w-full">
                        <div className="input-search-wrapper w-full md:w-80">
                            <svg
                                className="input-search-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Rechercher une fonction..."
                                className="input-control input-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setSearch("")}
                            className="btn btn-secondary"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Réinitialiser
                        </button>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn btn-success"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Nouvelle fonction
                        </button>
                    </div>
                </div>

                {/* --- DATA TABLE avec Pagination et scroll horizontal --- */}
                <div className="table-container">
                    <div className="table-scroll h-full">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                        Nom
                                    </th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                        Membres
                                    </th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white/60 backdrop-blur-sm">
                                {currentItems.length > 0 ? (
                                    currentItems.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-white/90 transition-all duration-200"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                                #{row.id}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                                <button
                                                    onClick={() =>
                                                        setSelectedFonction(
                                                            row.nom,
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-900 hover:underline"
                                                >
                                                    {row.nom}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-center max-w-xs truncate whitespace-nowrap">
                                                {row.description || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor:
                                                            row.membres_count >
                                                            0
                                                                ? "#dcfce7"
                                                                : "#f3f4f6",
                                                        color:
                                                            row.membres_count >
                                                            0
                                                                ? "#166534"
                                                                : "#6b7280",
                                                        borderColor:
                                                            row.membres_count >
                                                            0
                                                                ? "#bbf7d0"
                                                                : "#d1d5db",
                                                    }}
                                                >
                                                    {row.membres_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ActionButtonsSVG
                                                        rowData={row}
                                                        onEdit={() =>
                                                            setEditingFonction(
                                                                row,
                                                            )
                                                        }
                                                        onDelete={() =>
                                                            openDeleteAlert(row)
                                                        }
                                                        onView={() =>
                                                            setSelectedFonction(
                                                                row.nom,
                                                            )
                                                        }
                                                        count={
                                                            row.membres_count
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-gray-400 italic"
                                        >
                                            Aucune fonction trouvée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Controls --- */}
                    {filteredData.length > 0 && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            paginate={goToPage}
                        />
                    )}
                </div>

                {/* --- Modals --- */}
                <FonctionFormModal
                    isOpen={isAddModalOpen || !!editingFonction}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingFonction(null);
                    }}
                    fonctionData={editingFonction}
                    onSuccess={() => router.reload({ only: ["rawData"] })}
                />

                <FonctionMembersModal
                    isOpen={!!selectedFonction}
                    onClose={() => setSelectedFonction(null)}
                    title={`Membres : ${selectedFonction || ""}`}
                    members={
                        enrichedData.find((f) => f.nom === selectedFonction)
                            ?.members_list || []
                    }
                    onViewProfile={(member) => setSelectedMemberProfile(member)}
                />

                <MemberProfileModal
                    isOpen={!!selectedMemberProfile}
                    onClose={() => setSelectedMemberProfile(null)}
                    member={selectedMemberProfile}
                />

                <AlertModal
                    isOpen={showDeleteAlert}
                    onClose={() => setShowDeleteAlert(false)}
                    onConfirm={handleDeleteFonction}
                    title="Supprimer la fonction"
                    message={`Êtes-vous sûr de vouloir supprimer "${selectedFonctionForDelete?.nom}" ?`}
                    confirmText="Supprimer"
                    type="danger"
                />
            </div>
        </>
    );
};

export default TabFonctions;
