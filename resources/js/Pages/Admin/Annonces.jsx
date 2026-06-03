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
    { value: "annonce", label: "Demande de prière" },
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

const ROLE_LABELS = {
    admin: "Admin",
    conducteur: "Conducteur",
    responsable_famille: "Resp. famille",
    pasteur: "Pasteur",
    membre_famille: "Membre",
};

function roleLabel(role) {
    return ROLE_LABELS[role] || role || "Membre";
}

function formatDateTime(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric",
    }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function AnnonceRow({ annonce, onArchive, onDelete, authUserId }) {
    const titre = annonce.details?.titre || "(Sans titre)";
    const contenu = annonce.details?.contenu || "";
    const datePublication = formatDateTime(annonce.date_publication);
    const dateCreation = formatDateTime(annonce.created_at);
    const expiration = annonce.date_expiration
        ? new Date(annonce.date_expiration).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
        : null;
    const isExpired = annonce.date_expiration && new Date(annonce.date_expiration) < new Date();

    const createur = annonce.createur;
    const createurNom = createur ? `${createur.prenom || ""} ${createur.nom || ""}`.trim() : null;
    const createurRole = createur ? roleLabel(createur.role) : null;
    const isMine = createur?.id === authUserId;

    const publieePar = annonce.publieePar;
    const publisherNom = publieePar ? `${publieePar.prenom || ""} ${publieePar.nom || ""}`.trim() : null;
    const publisherIsMine = publieePar?.id === authUserId;
    const publishedByOther = publieePar && createur && publieePar.id !== createur.id;

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 transition-all ${isExpired ? "opacity-60 border-gray-200" : "border-blue-100"}`}>
            {/* Titre + actions */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 truncate">{titre}</span>
                    {isExpired && (
                        <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">Expiré</span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onArchive(annonce.id)} title="Archiver"
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                        <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(annonce.id)} title="Supprimer"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Contenu */}
            <p className="text-sm text-gray-600 line-clamp-2">{contenu}</p>

            {/* Méta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 mt-1 pt-2 border-t border-gray-50">
                {/* Date de publication */}
                <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Publié le {datePublication}
                </span>

                {/* Expiration */}
                {expiration && (
                    <span className={`flex items-center gap-1 ${isExpired ? "text-orange-500" : ""}`}>
                        <Clock className="w-3.5 h-3.5" />
                        Expire le {expiration}
                    </span>
                )}

                {/* Soumis par */}
                {createurNom && (
                    <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Soumis par&nbsp;
                        {isMine ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                ★ Moi
                            </span>
                        ) : (
                            <span className="font-semibold text-gray-600">
                                {createurNom}
                                {createurRole && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-normal">{createurRole}</span>
                                )}
                            </span>
                        )}
                    </span>
                )}

                {/* Validé par (si différent du créateur) */}
                {publishedByOther && publisherNom && (
                    <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Validé par&nbsp;
                        {publisherIsMine ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                                ★ Moi
                            </span>
                        ) : (
                            <span className="font-semibold text-gray-600">{publisherNom}</span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

const PER_PAGE = 5;

function Pagination({ page, total, perPage, onChange }) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
            <span className="text-xs text-white/50">
                {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} sur {total}
            </span>
            <div className="flex gap-1">
                <button
                    disabled={page === 1}
                    onClick={() => onChange(page - 1)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    ‹ Préc.
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-yellow-400 text-gray-900 font-bold" : "bg-white/10 hover:bg-white/20 text-white"}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    disabled={page === totalPages}
                    onClick={() => onChange(page + 1)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Suiv. ›
                </button>
            </div>
        </div>
    );
}

export default function Annonces({ publiees = [], archivees = [], enAttente = [], auth }) {
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ titre: "", contenu: "", date_expiration: "" });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [toastList, setToastList] = useState([]);
    const [publishedList, setPublishedList] = useState(publiees);
    const [archivedList, setArchivedList] = useState(archivees);
    const [pendingList, setPendingList] = useState(enAttente);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState("");
    const [pubPage, setPubPage] = useState(1);
    const [arcPage, setArcPage] = useState(1);
    const [confirm, setConfirm] = useState(null); // { message, onConfirm }

    const filterList = (list) => {
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter((a) => {
            const titre = (a.details?.titre || "").toLowerCase();
            const contenu = (a.details?.contenu || "").toLowerCase();
            return titre.includes(q) || contenu.includes(q);
        });
    };

    const filteredPublished = filterList(publishedList);
    const filteredArchived  = filterList(archivedList);
    const pagedPublished = filteredPublished.slice((pubPage - 1) * PER_PAGE, pubPage * PER_PAGE);
    const pagedArchived  = filteredArchived.slice((arcPage - 1) * PER_PAGE, arcPage * PER_PAGE);

    const handleSearch = (val) => {
        setSearch(val);
        setPubPage(1);
        setArcPage(1);
    };

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

    const handleValider = async (id) => {
        try {
            const res = await axios.post(withBasePath("", `/admin/annonces/${id}/valider`));
            const validated = res.data.annonce;
            setPendingList((prev) => prev.filter((a) => a.id !== id));
            setPublishedList((prev) => [validated, ...prev]);
            addToast("✅ Annonce validée et publiée dans le flash info !", "success");
            router.reload({ only: ["flashAnnouncements"] });
        } catch {
            addToast("Erreur lors de la validation.", "error");
        }
    };

    const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
    const doConfirm = async () => {
        if (!confirm) return;
        const fn = confirm.onConfirm;
        setConfirm(null);
        await fn();
    };

    const handleRejeter = (id) => {
        askConfirm("Rejeter et supprimer cette annonce ?", async () => {
            try {
                await axios.post(withBasePath("", `/admin/annonces/${id}/rejeter`));
                setPendingList((prev) => prev.filter((a) => a.id !== id));
                addToast("Annonce refusée et supprimée.", "success");
            } catch {
                addToast("Erreur lors du rejet.", "error");
            }
        });
    };

    const handleArchive = (id) => {
        askConfirm("Archiver cette information ?", async () => {
            try {
                await axios.post(withBasePath("", `/admin/annonces/${id}/archiver`));
                const item = publishedList.find((a) => a.id === id);
                setPublishedList((prev) => prev.filter((a) => a.id !== id));
                if (item) setArchivedList((prev) => [{ ...item, statut: "ARCHIVEE" }, ...prev]);
                addToast("Information archivée.", "success");
            } catch {
                addToast("Erreur lors de l'archivage.", "error");
            }
        });
    };

    const handleDelete = (id) => {
        askConfirm("Supprimer définitivement cette information ?", async () => {
            try {
                await axios.delete(withBasePath("", `/admin/annonces/${id}`));
                setPublishedList((prev) => prev.filter((a) => a.id !== id));
                setArchivedList((prev) => prev.filter((a) => a.id !== id));
                addToast("Information supprimée.", "success");
            } catch {
                addToast("Erreur lors de la suppression.", "error");
            }
        });
    };

    return (
        <>
        <div className="max-w-9xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Link
                            href={withBasePath("", "/admin/dashboard")}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                        >
                            ← Retour
                        </Link>
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Flash Info Paroissial</h1>
                            <p className="text-blue-200 text-sm">Gérez les informations visibles par toute la communauté</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Faire une annonce
                    </button>
                </div>

                {/* Barre de recherche */}
                <div className="mb-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Rechercher par titre ou contenu…"
                            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-yellow-400/60 focus:bg-white/15 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {search && (
                        <p className="text-xs text-white/40 mt-1.5 pl-1">
                            {filteredPublished.length + filteredArchived.length} résultat(s) pour « {search} »
                        </p>
                    )}
                </div>

                {/* Soumissions conducteurs en attente */}
                {pendingList.length > 0 && (
                    <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-amber-400/30">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-amber-300" />
                            <h2 className="text-lg font-bold text-white">
                                En attente de validation
                                <span className="ml-2 text-sm font-normal text-amber-200">({pendingList.length} annonce(s) de conducteur(s))</span>
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {pendingList.map((a) => {
                                const titre = a.details?.titre || "(Sans titre)";
                                const contenu = a.details?.contenu || "";
                                const createurNom = a.createur
                                    ? `${a.createur.prenom || ""} ${a.createur.nom || ""}`.trim()
                                    : "Membre";
                                const createurRole = a.createur?.role === "responsable_famille"
                                    ? "Resp. famille"
                                    : a.createur?.role === "conducteur"
                                      ? "Conducteur"
                                      : (a.createur?.role || "Membre");
                                const dateCreation = a.created_at
                                    ? new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                                    : "—";
                                return (
                                    <div key={a.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                <span className="font-semibold text-gray-900 truncate">{titre}</span>
                                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 flex-shrink-0">{createurRole} : {createurNom}</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleValider(a.id)}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Valider & Publier
                                                </button>
                                                <button
                                                    onClick={() => handleRejeter(a.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Rejeter"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{contenu}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Soumis le {dateCreation}
                                            </span>
                                            {a.date_expiration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" /> Expire le {new Date(a.date_expiration).toLocaleDateString("fr-FR")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Infos publiées */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <h2 className="text-lg font-bold text-white">
                            En cours de diffusion
                            <span className="ml-2 text-sm font-normal text-blue-200">({filteredPublished.length})</span>
                        </h2>
                    </div>

                    {filteredPublished.length === 0 ? (
                        <div className="text-center py-10">
                            <Megaphone className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">
                                {search ? "Aucune annonce ne correspond à votre recherche." : "Aucune information en cours de diffusion."}
                            </p>
                            {!search && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    + Créer la première demande de prière
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {pagedPublished.map((a) => (
                                    <AnnonceRow
                                        key={a.id}
                                        annonce={a}
                                        onArchive={handleArchive}
                                        onDelete={handleDelete}
                                        authUserId={auth?.user?.id}
                                    />
                                ))}
                            </div>
                            <Pagination
                                page={pubPage}
                                total={filteredPublished.length}
                                perPage={PER_PAGE}
                                onChange={setPubPage}
                            />
                        </>
                    )}
                </div>

                {/* Historique archivées */}
                {(archivedList.length > 0 || (search && filteredArchived.length > 0)) && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-6 py-4 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setShowArchived((v) => !v)}
                        >
                            <div className="flex items-center gap-2">
                                <Archive className="w-4 h-4" />
                                <span className="text-sm font-medium">Historique archivé ({filteredArchived.length})</span>
                            </div>
                            {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showArchived && (
                            <div className="px-6 pb-6 space-y-3">
                                {pagedArchived.map((a) => (
                                    <AnnonceRow
                                        key={a.id}
                                        annonce={a}
                                        onArchive={() => {}}
                                        onDelete={handleDelete}
                                        authUserId={auth?.user?.id}
                                    />
                                ))}
                                <Pagination
                                    page={arcPage}
                                    total={filteredArchived.length}
                                    perPage={PER_PAGE}
                                    onChange={setArcPage}
                                />
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
                                <h2 className="text-lg font-bold text-gray-900">Nouvelle demande de prière</h2>
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

            {/* Toast de confirmation */}
            {confirm && (
                <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-white border border-gray-200 rounded-xl shadow-2xl px-5 py-4 max-w-sm w-full animate-[fadeIn_.2s_ease]">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 mb-3">{confirm.message}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={doConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Confirmer
                            </button>
                            <button
                                onClick={() => setConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setConfirm(null)} className="text-gray-400 hover:text-gray-600 ml-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Toasts */}
            {toastList.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </>
    );
}
