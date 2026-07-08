import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { Send, CheckCircle, Pencil, Trash2, Megaphone } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

const TARGET_OPTIONS = [
    { value: "all", label: "Tous les membres (tous les rôles)" },
    { value: "conducteur", label: "Conducteurs uniquement" },
    { value: "responsable_famille", label: "Responsables de famille uniquement" },
    { value: "pasteur", label: "Pasteur uniquement" },
];

const targetLabel = (value) =>
    TARGET_OPTIONS.find((opt) => opt.value === value)?.label || "Tous les membres (tous les rôles)";

export default function TabFlashInfo({ flashInfos: flashInfosProp = [] }) {
    const { props } = usePage();
    const flashInfos = Array.isArray(flashInfosProp) ? flashInfosProp : [];

    const [titre, setTitre] = useState("");
    const [message, setMessage] = useState("");
    const [targetRole, setTargetRole] = useState("all");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [editItem, setEditItem] = useState(null);
    const [editTitre, setEditTitre] = useState("");
    const [editMessage, setEditMessage] = useState("");
    const [editTargetRole, setEditTargetRole] = useState("all");
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    const openEdit = (item) => {
        setEditItem(item);
        setEditTitre(item.titre || "");
        setEditMessage(item.message || "");
        setEditTargetRole(item.target_role || "all");
        setEditError("");
    };

    const closeEdit = () => setEditItem(null);

    const handlePublish = () => {
        if (titre.trim().length < 3) {
            setError("Le titre doit contenir au moins 3 caractères.");
            return;
        }
        if (message.trim().length < 5) {
            setError("Le message doit contenir au moins 5 caractères.");
            return;
        }
        setLoading(true);
        router.post(
            withBasePath("", "/president-conducteurs/flash-info"),
            { titre: titre.trim(), message: message.trim(), target_role: targetRole },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setTitre("");
                    setMessage("");
                    setTargetRole("all");
                    setLoading(false);
                },
                onError: () => {
                    setError("Une erreur est survenue.");
                    setLoading(false);
                },
            }
        );
    };

    const handleUpdate = () => {
        if (!editItem) return;
        if (editTitre.trim().length < 3) {
            setEditError("Le titre doit contenir au moins 3 caractères.");
            return;
        }
        if (editMessage.trim().length < 5) {
            setEditError("Le message doit contenir au moins 5 caractères.");
            return;
        }
        setEditLoading(true);
        router.put(
            withBasePath("", `/president-conducteurs/flash-info/${editItem.id}`),
            { titre: editTitre.trim(), message: editMessage.trim(), target_role: editTargetRole },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setEditLoading(false);
                    closeEdit();
                },
                onError: () => {
                    setEditError("Une erreur est survenue.");
                    setEditLoading(false);
                },
            }
        );
    };

    const handleDelete = (item) => {
        if (!window.confirm("Supprimer définitivement ce flash info ?")) return;
        router.delete(withBasePath("", `/president-conducteurs/flash-info/${item.id}`), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Publier un flash info</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Choisissez à qui ce message est destiné. Il apparaîtra immédiatement dans le flash info des personnes concernées.
                </p>

                {props.flash?.success && (
                    <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {props.flash.success}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Titre</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            maxLength={150}
                            placeholder="Ex : Réunion mensuelle des conducteurs"
                            value={titre}
                            onChange={(e) => { setTitre(e.target.value); setError(""); }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Message</label>
                        <textarea
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                            rows="4"
                            maxLength={1000}
                            placeholder="Rédigez votre message..."
                            value={message}
                            onChange={(e) => { setMessage(e.target.value); setError(""); }}
                        />
                        <div className="flex items-center justify-between mt-1">
                            {error ? (
                                <p className="text-xs text-red-500">{error}</p>
                            ) : (
                                <span />
                            )}
                            <span className={`text-xs ${message.length > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                                {message.length}/1000
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Destinataires</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        >
                            {TARGET_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        disabled={loading || titre.trim().length < 3 || message.trim().length < 5}
                        onClick={handlePublish}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? "Publication..." : "Publier dans le flash info"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Mes flash infos publiés</h3>
                {flashInfos.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucun flash info publié pour le moment.</p>
                ) : (
                    <div className="space-y-3">
                        {flashInfos.map((item) => (
                            <div key={item.id} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">{item.titre}</p>
                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.message}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                {targetLabel(item.target_role)}
                                            </span>
                                            <span className="text-xs text-gray-400">{item.created_at}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Modifier"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editItem && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={closeEdit}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Modifier le flash info</h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1">Titre</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    maxLength={150}
                                    value={editTitre}
                                    onChange={(e) => { setEditTitre(e.target.value); setEditError(""); }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1">Message</label>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                                    rows="4"
                                    maxLength={1000}
                                    value={editMessage}
                                    onChange={(e) => { setEditMessage(e.target.value); setEditError(""); }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1">Destinataires</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    value={editTargetRole}
                                    onChange={(e) => setEditTargetRole(e.target.value)}
                                >
                                    {TARGET_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {editError && <p className="text-xs text-red-500">{editError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={closeEdit}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    disabled={editLoading}
                                    onClick={handleUpdate}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {editLoading ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
