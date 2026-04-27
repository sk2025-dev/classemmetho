import React, { useState, useRef, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";
import {
    Megaphone,
    Plus,
    Archive,
    Trash2,
    X,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Zap,
} from "lucide-react";

const CATEGORY_OPTIONS = [
    { value: "generale", label: "Information générale" },
    { value: "annonce", label: "Annonce" },
    { value: "priere", label: "Sujet de prière" },
];

function Modal({ open, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {children}
            </div>
        </div>
    );
}

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, []);
    const colors = type === "success"
        ? "bg-green-600 text-white"
        : "bg-red-600 text-white";
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl ${colors}`}>
            {type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

function AnnonceRow({ annonce, onArchive, onDelete }) {
    const titre = annonce.details?.titre || "(Sans titre)";
    const contenu = annonce.details?.contenu || "";
    const date = annonce.date_publication
        ? new Date(annonce.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
        : "—";
    const expiration = annonce.date_expiration
        ? new Date(annonce.date_expiration).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
        : null;
    const isExpired = annonce.date_expiration && new Date(annonce.date_expiration) < new Date();

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 transition-all ${isExpired ? "opacity-60 border-gray-200" : "border-blue-100"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 truncate">{titre}</span>
                    {isExpired && (
                        <span className="ml-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 flex-shrink-0">Expiré</span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onArchive(annonce.id)}
                        title="Archiver"
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                        <Archive className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(annonce.id)}
                        title="Supprimer"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{contenu}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Publié le {date}
                </span>
                {expiration && (
                    <span className={`flex items-center gap-1 ${isExpired ? "text-orange-500" : ""}`}>
                        <Clock className="w-3.5 h-3.5" />
                        Expire le {expiration}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Annonces({ publiees = [], archivees = [], auth }) {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ titre: "", contenu: "", date_expiration: "" });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [toastList, setToastList] = useState([]);
    const [publishedList, setPublishedList] = useState(publiees);
    const [archivedList, setArchivedList] = useState(archivees);
    const [showArchived, setShowArchived] = useState(false);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToastList((prev) => [...prev, { id, message, type }]);
    };
    const removeToast = (id) => setToastList((prev) => prev.filter((t) => t.id !== id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.titre.trim()) newErrors.titre = "Le titre est obligatoire.";
        if (!form.contenu.trim()) newErrors.contenu = "Le contenu est obligatoire.";
        if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

        setSubmitting(true);
        try {
            const res = await axios.post(withBasePath("", "/admin/annonces"), {
                titre: form.titre,
                contenu: form.contenu,
                date_expiration: form.date_expiration || null,
            });
            setPublishedList((prev) => [res.data.annonce, ...prev]);
            setForm({ titre: "", contenu: "", date_expiration: "" });
            setErrors({});
            setShowModal(false);
            addToast("✅ Information publiée dans le flash info !", "success");
            // Rafraîchir les flashAnnouncements Inertia pour mettre à jour le ticker
            router.reload({ only: ["flashAnnouncements"] });
        } catch (err) {
            const msg = err.response?.data?.message || "Une erreur est survenue.";
            addToast("❌ " + msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleArchive = async (id) => {
        if (!confirm("Archiver cette information ?")) return;
        try {
            await axios.post(withBasePath("", `/admin/annonces/${id}/archiver`));
            const item = publishedList.find((a) => a.id === id);
            setPublishedList((prev) => prev.filter((a) => a.id !== id));
            if (item) setArchivedList((prev) => [{ ...item, statut: "ARCHIVEE" }, ...prev]);
            addToast("Information archivée.", "success");
        } catch {
            addToast("Erreur lors de l'archivage.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer définitivement cette information ?")) return;
        try {
            await axios.delete(withBasePath("", `/admin/annonces/${id}`));
            setPublishedList((prev) => prev.filter((a) => a.id !== id));
            setArchivedList((prev) => prev.filter((a) => a.id !== id));
            addToast("Information supprimée.", "success");
        } catch {
            addToast("Erreur lors de la suppression.", "error");
        }
    };

    return (
        <>
        <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Flash Info Paroissial</h1>
                            <p className="text-blue-200 text-sm">Gérez les informations visibles par toute la communauté</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={withBasePath("", "/admin/dashboard")}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                        >
                            ← Retour
                        </Link>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Faire une annonce
                        </button>
                    </div>
                </div>

                {/* Infos publiées */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <h2 className="text-lg font-bold text-white">
                            En cours de diffusion
                            <span className="ml-2 text-sm font-normal text-blue-200">({publishedList.length})</span>
                        </h2>
                    </div>

                    {publishedList.length === 0 ? (
                        <div className="text-center py-10">
                            <Megaphone className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Aucune information en cours de diffusion.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-semibold transition-colors"
                            >
                                + Créer la première annonce
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {publishedList.map((a) => (
                                <AnnonceRow
                                    key={a.id}
                                    annonce={a}
                                    onArchive={handleArchive}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Historique archivées */}
                {archivedList.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-6 py-4 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setShowArchived((v) => !v)}
                        >
                            <div className="flex items-center gap-2">
                                <Archive className="w-4 h-4" />
                                <span className="text-sm font-medium">Historique archivé ({archivedList.length})</span>
                            </div>
                            {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showArchived && (
                            <div className="px-6 pb-6 space-y-3">
                                {archivedList.map((a) => (
                                    <AnnonceRow
                                        key={a.id}
                                        annonce={a}
                                        onArchive={() => {}}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal création */}
            <Modal open={showModal} onClose={() => { setShowModal(false); setErrors({}); }}>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Nouvelle annonce</h2>
                                <p className="text-xs text-gray-500">Visible immédiatement dans le flash info</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowModal(false); setErrors({}); }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Titre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={`w-full h-11 border rounded-lg px-4 text-sm outline-none transition-all focus:shadow-md ${errors.titre ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"}`}
                                placeholder="ex: Service du dimanche, Réunion de prière..."
                                value={form.titre}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, titre: e.target.value }));
                                    setErrors((p) => ({ ...p, titre: "" }));
                                }}
                            />
                            {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre}</p>}
                        </div>

                        {/* Contenu */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none focus:shadow-md ${errors.contenu ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"}`}
                                placeholder="Rédigez votre message ici. Il sera affiché dans le flash info de toute la plateforme..."
                                value={form.contenu}
                                onChange={(e) => {
                                    setForm((p) => ({ ...p, contenu: e.target.value }));
                                    setErrors((p) => ({ ...p, contenu: "" }));
                                }}
                            />
                            <div className="flex justify-between mt-1">
                                {errors.contenu ? <p className="text-red-500 text-xs">{errors.contenu}</p> : <span />}
                                <span className="text-xs text-gray-400">{form.contenu.length}/2000</span>
                            </div>
                        </div>

                        {/* Date expiration */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Date d'expiration
                                <span className="ml-1 text-xs text-gray-400 font-normal">(optionnel — laisser vide = permanent)</span>
                            </label>
                            <input
                                type="date"
                                className="w-full h-11 border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-blue-500 focus:shadow-md transition-all"
                                value={form.date_expiration}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setForm((p) => ({ ...p, date_expiration: e.target.value }))}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
                            <Zap className="w-4 h-4 flex-shrink-0" />
                            Cette annonce sera publiée <strong>immédiatement</strong> et visible par tous les profils de la plateforme.
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 pb-6">
                        <button
                            type="button"
                            onClick={() => { setShowModal(false); setErrors({}); }}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                        >
                            {submitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Publication...
                                </>
                            ) : (
                                <>
                                    <Megaphone className="w-4 h-4" />
                                    Publier maintenant
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Toasts */}
            {toastList.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </>
    );
}
