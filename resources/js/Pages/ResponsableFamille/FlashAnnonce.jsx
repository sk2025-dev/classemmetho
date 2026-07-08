import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";
import {
    Megaphone,
    Plus,
    Zap,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    ArrowLeft,
    User,
} from "lucide-react";

const TYPE_OPTIONS = [
    { value: "intercession", label: "Prière d'intercession", emoji: "🙏" },
    { value: "grace",        label: "Action de grâce",       emoji: "🙌" },
    { value: "autre",        label: "Autre",                  emoji: "📢" },
];

const ROLE_LABELS = {
    responsable_famille: "Responsable de famille",
    conducteur:          "Conducteur",
    membre_famille:      "Membre de famille",
    pasteur:             "Pasteur",
    admin:               "Administrateur",
};

function typeLabel(val) {
    return TYPE_OPTIONS.find((t) => t.value === val) || { label: val || "Non précisé", emoji: "📢" };
}
function roleLabel(role) {
    return ROLE_LABELS[role] || role || "Membre";
}
function formatDateTime(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function Toast({ message, type, onClose }) {
    React.useEffect(() => {
        const t = setTimeout(onClose, 4500);
        return () => clearTimeout(t);
    }, []);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

function DetailModal({ annonce: a, currentUser, onClose }) {
    const details     = a.details || {};
    const type        = typeLabel(details.type_demande);
    const statut      = a.statut || "SOUMISE";
    const isPublished = statut === "PUBLIEE";
    const isArchived  = statut === "ARCHIVEE";
    const nomComplet  = [currentUser.prenom, currentUser.nom].filter(Boolean).join(" ") || "—";
    const role        = roleLabel(currentUser.role);
    const heureCulte  = details.heure_culte;
    const heureLabel  = heureCulte === "07:30" ? "7h30" : heureCulte === "09:30" ? "9h30" : heureCulte || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📢</div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Détail de l'annonce</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {type.emoji} {type.label}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Statut */}
                    <span className={`inline-flex text-xs font-bold px-3 py-1.5 rounded-full border ${isPublished ? "bg-green-50 text-green-700 border-green-200" : isArchived ? "bg-gray-50 text-gray-500 border-gray-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                        {isPublished ? "✅ Publiée" : isArchived ? "Archivée" : "⏳ En attente de validation"}
                    </span>

                    {/* Qui a soumis */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Soumis par</p>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">{nomComplet}</div>
                                <div className="text-xs text-gray-500">{role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(a.created_at)}
                        </div>
                    </div>

                    {/* Type de demande */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Type d'annonce</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl leading-none">{type.emoji}</span>
                            <span className="text-sm font-semibold text-blue-800">{type.label}</span>
                        </div>
                    </div>

                    {/* Titre */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Titre</p>
                        <p className="text-sm font-semibold text-gray-900">{details.titre || "—"}</p>
                    </div>

                    {/* Message */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Message</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{details.contenu || "—"}</p>
                    </div>

                    {/* Infos complémentaires */}
                    {(heureLabel || a.date_expiration || (isPublished && a.date_publication)) && (
                        <div className="grid grid-cols-2 gap-3">
                            {heureLabel && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">Heure du culte</p>
                                    <p className="text-sm font-semibold text-gray-800">{heureLabel}</p>
                                </div>
                            )}
                            {a.date_expiration && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">Date d'expiration</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {new Date(a.date_expiration).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            )}
                            {isPublished && a.date_publication && (
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs text-green-600 mb-0.5">Publiée le</p>
                                    <p className="text-sm font-semibold text-green-800">
                                        {new Date(a.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end px-6 pb-6">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

function normalizeAnnonce(a) {
    if (!a) return a;
    const details = typeof a.details === "string"
        ? (() => { try { return JSON.parse(a.details); } catch { return {}; } })()
        : (a.details || {});
    return { ...a, details };
}

export default function FlashAnnonce({ annonces = [] }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user || {};

    const [list, setList] = useState(() => annonces.map(normalizeAnnonce));
    const [showModal, setShowModal]       = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [form, setForm] = useState({ type_demande: "", titre: "", contenu: "", date_expiration: "", heure_culte: "" });
    const [submitting, setSubmitting]     = useState(false);
    const [errors, setErrors]             = useState({});
    const [toasts, setToasts]             = useState([]);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };
    const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const resetForm = () => setForm({ type_demande: "", titre: "", contenu: "", date_expiration: "", heure_culte: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.titre.trim())   errs.titre   = "Le titre est obligatoire.";
        if (!form.contenu.trim()) errs.contenu = "Le contenu est obligatoire.";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            const res = await axios.post(
                withBasePath("", "/responsable-famille/flash-annonces"),
                {
                    type_demande:    form.type_demande   || null,
                    titre:           form.titre,
                    contenu:         form.contenu,
                    date_expiration: form.date_expiration || null,
                    heure_culte:     form.heure_culte    || null,
                },
            );
            setList((prev) => [normalizeAnnonce(res.data.annonce), ...prev]);
            resetForm();
            setErrors({});
            setShowModal(false);
            addToast("✅ Annonce soumise ! Elle sera publiée après validation par l'administrateur.", "success");
        } catch (err) {
            addToast("❌ " + (err.response?.data?.message || "Une erreur est survenue."), "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 52%, #B6C01A 100%)" }}>
            <div className="mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={withBasePath("", "/responsable-famille/liturgie")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Retour
                        </Link>
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Flash Info Paroissial</h1>
                            <p className="text-blue-200 text-sm">Informations à diffuser dans toute la communauté</p>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4" /> Faire une annonce
                    </button>
                </div>

                {/* Bandeau info */}
                <div className="flex items-start gap-3 bg-blue-600/20 border border-blue-400/30 rounded-xl px-5 py-4 text-blue-100 text-sm mb-6">
                    <Zap className="w-5 h-5 flex-shrink-0 text-yellow-300 mt-0.5" />
                    <span>Vos annonces sont transmises à l'<strong>administrateur</strong> pour validation avant d'être diffusées dans le flash info.</span>
                </div>

                {/* Liste */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <h2 className="text-lg font-bold text-white">
                            Mes annonces
                            <span className="ml-2 text-sm font-normal text-blue-200">({list.length})</span>
                        </h2>
                    </div>

                    {list.length === 0 ? (
                        <div className="text-center py-10">
                            <Megaphone className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Aucune annonce soumise pour le moment.</p>
                            <button onClick={() => setShowModal(true)}
                                className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-semibold transition-colors">
                                + Faire ma première annonce
                            </button>
                        </div>
                    ) : (
                        list.map((a) => {
                            const titre     = a.details?.titre   || "(Sans titre)";
                            const contenu   = a.details?.contenu || "";
                            const statut    = a.statut || "SOUMISE";
                            const isPublished = statut === "PUBLIEE";
                            const isArchived  = statut === "ARCHIVEE";
                            const type = typeLabel(a.details?.type_demande);
                            const dateCreation = a.created_at
                                ? new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                                : "—";
                            const datePublication = a.date_publication
                                ? new Date(a.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                                : null;
                            const dateExp = a.date_expiration
                                ? new Date(a.date_expiration).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                                : null;
                            return (
                                <div key={a.id}
                                    onClick={() => setSelectedDetail(a)}
                                    className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow ${isPublished ? "border-green-200" : isArchived ? "border-gray-200 opacity-60" : "border-yellow-200"}`}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Zap className={`w-4 h-4 flex-shrink-0 ${isPublished ? "text-green-500" : "text-yellow-500"}`} />
                                            <span className="font-semibold text-gray-900 truncate">{titre}</span>
                                            {a.details?.type_demande && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                                                    {type.emoji} {type.label}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${isPublished ? "bg-green-50 text-green-700 border-green-200" : isArchived ? "bg-gray-50 text-gray-500 border-gray-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                                            {isPublished ? "✅ Publiée" : isArchived ? "Archivée" : "⏳ En attente"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{contenu}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Soumise le {dateCreation}</span>
                                        {isPublished && datePublication && (
                                            <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-3.5 h-3.5" /> Publiée le {datePublication}</span>
                                        )}
                                        {dateExp && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Expire le {dateExp}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══ MODAL DÉTAIL ══ */}
            {selectedDetail && (
                <DetailModal
                    annonce={selectedDetail}
                    currentUser={currentUser}
                    onClose={() => setSelectedDetail(null)}
                />
            )}

            {/* ══ MODAL CRÉATION ══ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); setErrors({}); }} />
                    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Megaphone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Nouvelle annonce</h2>
                                        <p className="text-xs text-gray-500">Sera publiée après validation par l'administrateur</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                {/* Type de demande */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type de demande</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {TYPE_OPTIONS.map((t) => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setForm((p) => ({ ...p, type_demande: t.value }))}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${form.type_demande === t.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`}
                                            >
                                                <span className="text-xl">{t.emoji}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Titre */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Titre <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text"
                                        className={`w-full h-11 border rounded-lg px-4 text-sm outline-none transition-all focus:shadow-md ${errors.titre ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"}`}
                                        placeholder="ex: Service du dimanche, Réunion de prière..."
                                        value={form.titre}
                                        onChange={(e) => { setForm((p) => ({ ...p, titre: e.target.value })); setErrors((p) => ({ ...p, titre: "" })); }}
                                    />
                                    {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre}</p>}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea rows={4}
                                        className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none focus:shadow-md ${errors.contenu ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"}`}
                                        placeholder="Rédigez votre message ici..."
                                        value={form.contenu}
                                        onChange={(e) => { setForm((p) => ({ ...p, contenu: e.target.value })); setErrors((p) => ({ ...p, contenu: "" })); }}
                                    />
                                    <div className="flex justify-between mt-1">
                                        {errors.contenu ? <p className="text-red-500 text-xs">{errors.contenu}</p> : <span />}
                                        <span className="text-xs text-gray-400">{form.contenu.length}/2000</span>
                                    </div>
                                </div>

                                {/* Date expiration + Heure culte */}
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Date d'expiration <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                                        </label>
                                        <input type="date"
                                            className="w-full h-11 border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-blue-500 focus:shadow-md transition-all"
                                            value={form.date_expiration}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setForm((p) => ({ ...p, date_expiration: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Heure du culte <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                                        </label>
                                        <select
                                            className="w-full h-11 border border-gray-300 rounded-lg px-4 text-sm outline-none focus:border-blue-500 focus:shadow-md transition-all bg-white"
                                            value={form.heure_culte}
                                            onChange={(e) => setForm((p) => ({ ...p, heure_culte: e.target.value }))}
                                        >
                                            <option value="">-- Choisir --</option>
                                            <option value="07:30">7h30</option>
                                            <option value="09:30">9h30</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Cette annonce sera publiée <strong>uniquement après validation par l'administrateur</strong>.
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 pb-6">
                                <button type="button" onClick={() => { setShowModal(false); setErrors({}); }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md">
                                    {submitting ? (
                                        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Envoi...</>
                                    ) : (
                                        <><Megaphone className="w-4 h-4" />Soumettre</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toasts */}
            {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </div>
    );
}
