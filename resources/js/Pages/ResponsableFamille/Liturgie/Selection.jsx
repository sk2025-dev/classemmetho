import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { withBasePath } from "../../../Utils/urlHelper";

const ACTE_OPTIONS = [
    {
        key: "bapteme",
        title: "Bapteme",
        badge: "Sacrement",
        description: "Demande de bapteme pour enfant ou adulte.",
        tone: "blue",
    },
    {
        key: "mariage",
        title: "Mariage",
        badge: "Union",
        description: "Demande pour mariage religieux ou celebration.",
        tone: "rose",
    },
    {
        key: "naissance",
        title: "Présentation Enfant",
        badge: "Présentation",
        description: "Présentation de l'enfant devant l'assemblée.",
        tone: "green",
    },
    {
        key: "deces",
        title: "Annonce Décès",
        badge: "Annonce",
        description: "Annonce de décès pour accompagnement de l'église.",
        tone: "slate",
    },
];

const ANNONCE_TYPES = [
    {
        value: "grace",
        label: "Prière d'action de grâce / remerciement",
        emoji: "🙌",
        color: "amber",
    },
    {
        value: "priere",
        label: "Prière d'intercession",
        emoji: "🙏",
        color: "violet",
    },
];

const MOTIFS_GRACE = [
    { value: "guerison", label: "Guérison" },
    { value: "deuil", label: "Deuil" },
    { value: "mariage", label: "Bénédiction de Mariage" },
    { value: "autres_bienfaits", label: "Autre(s) bienfait(s)" },
];

const MOTIFS_INTERCESSION = [
    { value: "soutien_assistance", label: "Soutien et assistance" },
    { value: "maladie", label: "Maladie" },
    { value: "autre_probleme", label: "Autre(s) problème(s)" },
];

function getPlaceholder(type) {
    const p = {
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        generale: "Rédigez votre annonce à destination de l'assemblée…",
    };
    return p[type] || "Rédigez votre message…";
}

export default function Selection({
    basePath = "/responsable-famille/liturgie",
    actesEnCours = [],
    familyMembers = [],
}) {
    const [showAnnonceModal, setShowAnnonceModal] = useState(false);
    const [annonceStep, setAnnonceStep] = useState(1);
    const [annonceProcessing, setAnnonceProcessing] = useState(false);
    const [annonceForm, setAnnonceForm] = useState({
        type_annonce: "",
        motif: "",
        temoignage_public: false,
        membre_id: "",
        message: "",
        date_annonce: "",
        heure_culte: "",
    });
    const [toast, setToast] = useState(null);

    const selectedType = ANNONCE_TYPES.find(
        (t) => t.value === annonceForm.type_annonce,
    );
    const selectedMotifLabel =
        annonceForm.type_annonce === "grace"
            ? MOTIFS_GRACE.find((m) => m.value === annonceForm.motif)?.label
            : annonceForm.type_annonce === "priere"
              ? MOTIFS_INTERCESSION.find((m) => m.value === annonceForm.motif)
                    ?.label
              : null;

    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const openAnnonce = () => {
        setAnnonceForm({
            type_annonce: "",
            motif: "",
            temoignage_public: false,
            membre_id: "",
            message: "",
            date_annonce: "",
            heure_culte: "",
        });
        setAnnonceStep(1);
        setShowAnnonceModal(true);
    };

    const closeAnnonce = () => {
        if (annonceProcessing) return;
        setShowAnnonceModal(false);
        setAnnonceStep(1);
        setAnnonceForm({
            type_annonce: "",
            motif: "",
            temoignage_public: false,
            membre_id: "",
            message: "",
            date_annonce: "",
            heure_culte: "",
        });
    };

    const submitAnnonce = async () => {
        if (!annonceForm.type_annonce || !annonceForm.message.trim()) {
            notify("Veuillez remplir tous les champs obligatoires.", "error");
            return;
        }
        if (
            (annonceForm.type_annonce === "grace" ||
                annonceForm.type_annonce === "priere") &&
            !annonceForm.motif
        ) {
            notify("Veuillez sélectionner un motif.", "error");
            return;
        }
        if (!annonceForm.membre_id) {
            notify("Veuillez sélectionner un membre concerné.", "error");
            return;
        }
        try {
            setAnnonceProcessing(true);
            await axios.post(
                withBasePath("", "/responsable-famille/annonces"),
                annonceForm,
            );
            closeAnnonce();
            notify(
                "✅ Demande de prière soumise ! Elle sera traitée par votre conducteur puis le pasteur.",
            );
            setTimeout(() => router.visit(basePath), 1800);
        } catch (e) {
            notify(
                e?.response?.data?.message || "Une erreur est survenue.",
                "error",
            );
        } finally {
            setAnnonceProcessing(false);
        }
    };

    return (
        <div
            className="min-h-screen py-10 px-4"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <style>{modalStyles}</style>

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 200,
                        background:
                            toast.type === "error" ? "#C06040" : "#4A7C5E",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                        maxWidth: 360,
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <Link
                    href={basePath}
                    className="inline-flex items-center gap-2 text-white hover:text-yellow-300 font-semibold transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    Retour
                </Link>

                <div className="text-center mb-8">
                    <p className="inline-flex items-center px-4 py-1 rounded-full bg-white/20 text-white text-xs font-semibold tracking-wider uppercase mb-3">
                        Actes Liturgiques
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Choisir le type de demande
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                        Selectionnez un acte. Vous serez ensuite redirige vers
                        le formulaire correspondant.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
                    {ACTE_OPTIONS.map((option) => {
                        const isBlocked = actesEnCours.includes(option.key);
                        if (isBlocked) {
                            return (
                                <div
                                    key={option.key}
                                    className="bg-white/60 rounded-2xl shadow border border-gray-200 overflow-hidden opacity-75 cursor-not-allowed"
                                >
                                    <div className="h-1.5 bg-gray-300" />
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                                                En cours
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-400 mb-2">
                                            {option.title}
                                        </h2>
                                        <p className="text-sm text-gray-400 mb-4">
                                            {option.description}
                                        </p>
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg w-full justify-center">
                                            ⚠ Demande déjà soumise
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <Link
                                key={option.key}
                                href={`${basePath}/nouvelle/formulaire?type_acte=${option.key}`}
                                className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all"
                            >
                                <div
                                    className={`h-1.5 ${toneBar(option.tone)}`}
                                />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span
                                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${toneBadge(option.tone)}`}
                                        >
                                            {option.badge}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                                        {option.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {option.description}
                                    </p>

                                    <div className="inline-flex items-center justify-between w-full text-sm font-semibold text-slate-500">
                                        Cliquer pour ouvrir
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {/* 5ème carte : Demande de prière */}
                    <button
                        type="button"
                        onClick={openAnnonce}
                        className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all text-left w-full"
                    >
                        <div className="h-1.5 bg-violet-500" />
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                                    Prière
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Demande de prière
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Soumettre une demande de prière ou d'annonce
                                pour votre famille.
                            </p>
                            <div className="inline-flex items-center justify-between w-full text-sm font-semibold text-slate-500">
                                Cliquer pour ouvrir
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>

                <div className="mt-6 bg-white/95 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-700">
                        Le dossier suit ce circuit: <strong>Conducteur</strong>{" "}
                        puis <strong>Pasteur</strong>. Vous serez notifie a
                        chaque etape.
                    </p>
                </div>
            </div>

            {/* ══ MODAL DEMANDE DE PRIÈRE ══ */}
            {showAnnonceModal && (
                <div className="sel-modal-overlay" onClick={closeAnnonce}>
                    <div
                        className="sel-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sel-modal-head">
                            <div>
                                <div className="sel-modal-title">
                                    {annonceStep === 1 &&
                                        "Type de demande de prière"}
                                    {annonceStep === 2 &&
                                        `${selectedType?.emoji || "🙏"} ${selectedType?.label || "Demande de prière"}`}
                                    {annonceStep === 3 && "Confirmation"}
                                </div>
                                <div className="sel-modal-sub">
                                    Étape {annonceStep} / 3 · Circuit :
                                    Conducteur → Pasteur → Publication
                                </div>
                            </div>
                            <button
                                type="button"
                                className="sel-modal-close"
                                onClick={closeAnnonce}
                            >
                                ×
                            </button>
                        </div>

                        <div className="sel-ann-steps-bar">
                            {["Type", "Détails", "Confirmation"].map((s, i) => (
                                <div
                                    key={i}
                                    className={`sel-asb-step ${annonceStep > i + 1 ? "done" : annonceStep === i + 1 ? "active" : ""}`}
                                >
                                    <div className="sel-asb-dot">
                                        {annonceStep > i + 1 ? "✓" : i + 1}
                                    </div>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>

                        <div className="sel-modal-body">
                            {/* ÉTAPE 1 — choix du type */}
                            {annonceStep === 1 && (
                                <div className="sel-ann-type-grid">
                                    {ANNONCE_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            className={`sel-ann-type-btn ${annonceForm.type_annonce === t.value ? "sel" : ""}`}
                                            onClick={() =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    type_annonce: t.value,
                                                    motif: "",
                                                }))
                                            }
                                        >
                                            <span style={{ fontSize: 24, flexShrink: 0 }}>
                                                {t.emoji}
                                            </span>
                                            <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, textAlign: "left", lineHeight: 1.3 }}>
                                                {t.label}
                                            </span>
                                            {annonceForm.type_annonce ===
                                                t.value && (
                                                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#5B3FAF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ÉTAPE 2 — détails */}
                            {annonceStep === 2 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {(annonceForm.type_annonce === "grace" ||
                                        annonceForm.type_annonce ===
                                            "priere") && (
                                        <SelField label="Motif" required>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                                {(annonceForm.type_annonce ===
                                                "grace"
                                                    ? MOTIFS_GRACE
                                                    : MOTIFS_INTERCESSION
                                                ).map((m) => (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setAnnonceForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    motif: m.value,
                                                                }),
                                                            )
                                                        }
                                                        style={{
                                                            padding: "6px 14px",
                                                            borderRadius: 20,
                                                            border: annonceForm.motif === m.value ? "2px solid #d97706" : "1.5px solid #d1d5db",
                                                            background: annonceForm.motif === m.value ? "#fffbeb" : "#fff",
                                                            color: annonceForm.motif === m.value ? "#b45309" : "#374151",
                                                            fontWeight: annonceForm.motif === m.value ? 700 : 400,
                                                            fontSize: 12,
                                                            cursor: "pointer",
                                                            transition: "all .15s",
                                                        }}
                                                    >
                                                        {annonceForm.motif ===
                                                            m.value && "✓ "}
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </SelField>
                                    )}
                                    {(annonceForm.type_annonce === "grace" ||
                                        annonceForm.type_annonce ===
                                            "priere") && (
                                        <SelField label="Voulez-vous rendre publiquement témoignage ?">
                                            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                                {[
                                                    { val: true, label: "OUI" },
                                                    {
                                                        val: false,
                                                        label: "NON",
                                                    },
                                                ].map(({ val, label }) => (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() =>
                                                            setAnnonceForm(
                                                                (f) => ({
                                                                    ...f,
                                                                    temoignage_public:
                                                                        val,
                                                                }),
                                                            )
                                                        }
                                                        style={{
                                                            padding: "6px 20px",
                                                            borderRadius: 20,
                                                            border: annonceForm.temoignage_public === val ? "2px solid #d97706" : "1.5px solid #d1d5db",
                                                            background: annonceForm.temoignage_public === val ? "#fffbeb" : "#fff",
                                                            color: annonceForm.temoignage_public === val ? "#b45309" : "#374151",
                                                            fontWeight: annonceForm.temoignage_public === val ? 700 : 400,
                                                            fontSize: 12,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                                Pour cas exceptionnel
                                            </div>
                                        </SelField>
                                    )}
                                    <SelField label="Personne concernée" required>
                                        <select
                                            className="sel-ann-input"
                                            value={annonceForm.membre_id}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    membre_id: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                -- Sélectionnez un membre --
                                            </option>
                                            {familyMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom} {m.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </SelField>
                                    <SelField
                                        label="Message de l'annonce"
                                        required
                                    >
                                        <textarea
                                            className="sel-ann-textarea"
                                            rows={4}
                                            placeholder={getPlaceholder(
                                                annonceForm.type_annonce,
                                            )}
                                            value={annonceForm.message}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    message: e.target.value,
                                                }))
                                            }
                                        />
                                        <div style={{ fontSize: 10.5, color: "#9C9484", textAlign: "right" }}>
                                            {annonceForm.message.length}/500
                                        </div>
                                    </SelField>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <SelField label="Date du culte" style={{ flex: 1 }}>
                                            <input
                                                className="sel-ann-input"
                                                type="date"
                                                value={annonceForm.date_annonce}
                                                onChange={(e) =>
                                                    setAnnonceForm((f) => ({
                                                        ...f,
                                                        date_annonce:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </SelField>
                                        <SelField label="Heure du culte" style={{ flex: 1 }}>
                                            <select
                                                className="sel-ann-input"
                                                value={annonceForm.heure_culte}
                                                onChange={(e) =>
                                                    setAnnonceForm((f) => ({
                                                        ...f,
                                                        heure_culte:
                                                            e.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">-- Choisir --</option>
                                                <option value="07:30">7h30</option>
                                                <option value="09:30">9h30</option>
                                            </select>
                                        </SelField>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(74,124,94,.06)", border: "1px solid rgba(74,124,94,.18)", borderRadius: 8, fontSize: 12, color: "#4A7C5E", fontWeight: 600 }}>
                                        Visible par toute la paroisse après
                                        validation du pasteur
                                    </div>
                                </div>
                            )}

                            {/* ÉTAPE 3 — confirmation */}
                            {annonceStep === 3 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 10, background: "#F5F4F0", border: "1px solid #E8E4DC" }}>
                                        <span style={{ fontSize: 30 }}>
                                            {selectedType?.emoji}
                                        </span>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 800 }}>
                                                {selectedType?.label}
                                            </div>
                                            {selectedMotifLabel && (
                                                <div style={{ fontSize: 11, color: "#9C9484", marginTop: 2, fontWeight: 600 }}>
                                                    Motif : {selectedMotifLabel}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 11, color: "#9C9484", marginTop: 2 }}>
                                                Demande de prière paroissiale
                                            </div>
                                        </div>
                                    </div>
                                    {annonceForm.membre_id && (
                                        <SelRecapRow
                                            label="Concerné(e)"
                                            value={(() => {
                                                const m = familyMembers.find(
                                                    (fm) =>
                                                        String(fm.id) ===
                                                        String(
                                                            annonceForm.membre_id,
                                                        ),
                                                );
                                                return m
                                                    ? `${m.prenom} ${m.nom}`
                                                    : "Membre";
                                            })()}
                                        />
                                    )}
                                    {annonceForm.date_annonce && (
                                        <SelRecapRow
                                            label="Date du culte"
                                            value={annonceForm.date_annonce}
                                        />
                                    )}
                                    {annonceForm.heure_culte && (
                                        <SelRecapRow
                                            label="Heure du culte"
                                            value={annonceForm.heure_culte}
                                        />
                                    )}
                                    <div style={{ background: "#F5F4F0", borderRadius: 8, padding: 13 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", color: "#9C9484", marginBottom: 6 }}>
                                            Message
                                        </div>
                                        <div style={{ fontSize: 13, color: "#1E1B16", lineHeight: 1.7 }}>
                                            {annonceForm.message}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9C9484", background: "rgba(91,63,175,.05)", border: "1px solid rgba(91,63,175,.15)", borderRadius: 8, padding: "10px 14px" }}>
                                        Après soumission :{" "}
                                        <strong style={{ color: "#5B3FAF" }}>
                                            Conducteur
                                        </strong>{" "}
                                        →{" "}
                                        <strong style={{ color: "#5B3FAF" }}>
                                            Pasteur
                                        </strong>{" "}
                                        →{" "}
                                        <strong style={{ color: "#5B3FAF" }}>
                                            Publication
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sel-modal-foot">
                            {annonceStep > 1 ? (
                                <button
                                    type="button"
                                    className="sel-btn-mghost"
                                    onClick={() =>
                                        setAnnonceStep((s) => s - 1)
                                    }
                                >
                                    ← Retour
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="sel-btn-mghost"
                                    onClick={closeAnnonce}
                                >
                                    Annuler
                                </button>
                            )}
                            {annonceStep < 3 ? (
                                <button
                                    type="button"
                                    className="sel-btn-mnext"
                                    disabled={
                                        annonceStep === 1 &&
                                        !annonceForm.type_annonce
                                    }
                                    onClick={() => {
                                        if (
                                            annonceStep === 2 &&
                                            (annonceForm.type_annonce ===
                                                "grace" ||
                                                annonceForm.type_annonce ===
                                                    "priere") &&
                                            !annonceForm.motif
                                        ) {
                                            notify(
                                                "Veuillez sélectionner un motif.",
                                                "error",
                                            );
                                            return;
                                        }
                                        if (
                                            annonceStep === 2 &&
                                            !annonceForm.membre_id
                                        ) {
                                            notify(
                                                "Veuillez sélectionner un membre.",
                                                "error",
                                            );
                                            return;
                                        }
                                        if (
                                            annonceStep === 2 &&
                                            !annonceForm.message.trim()
                                        ) {
                                            notify(
                                                "Le message est obligatoire.",
                                                "error",
                                            );
                                            return;
                                        }
                                        setAnnonceStep((s) => s + 1);
                                    }}
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="sel-btn-msubmit"
                                    disabled={annonceProcessing}
                                    onClick={submitAnnonce}
                                >
                                    {annonceProcessing
                                        ? "Envoi en cours…"
                                        : "✅ Soumettre la demande"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SelField({ label, required, children, style }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
            <label style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", color: "#5C5748" }}>
                {label}
                {required && (
                    <span style={{ color: "#C06040" }}> *</span>
                )}
            </label>
            {children}
        </div>
    );
}

function SelRecapRow({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #E8E4DC", fontSize: 12.5, gap: 10 }}>
            <span style={{ color: "#9C9484", fontWeight: 600 }}>{label}</span>
            <span style={{ color: "#1E1B16", fontWeight: 700, textAlign: "right" }}>
                {value}
            </span>
        </div>
    );
}

function toneBar(tone) {
    const map = {
        blue: "bg-blue-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        green: "bg-green-500",
        slate: "bg-slate-500",
    };
    return map[tone] || "bg-blue-500";
}

function toneBadge(tone) {
    const map = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        green: "bg-green-50 text-green-700 border-green-200",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return map[tone] || "bg-blue-50 text-blue-700 border-blue-200";
}

const modalStyles = `
*{box-sizing:border-box}
.sel-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:120;backdrop-filter:blur(6px)}
.sel-modal{width:100%;max-width:540px;max-height:90vh;overflow:auto;background:#fff;border:1px solid #E8E4DC;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.3);animation:selMIn .28s cubic-bezier(.34,1.56,.64,1) both}
@keyframes selMIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.sel-modal-head{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #E8E4DC}
.sel-modal-title{font-size:18px;font-weight:800;color:#1E1B16}
.sel-modal-sub{font-size:12px;color:#9C9484;margin-top:3px}
.sel-modal-close{width:30px;height:30px;border-radius:7px;border:1px solid #D6D1C7;background:#F5F4F0;color:#5C5748;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}
.sel-ann-steps-bar{display:flex;padding:12px 24px;border-bottom:1px solid #E8E4DC;gap:0}
.sel-asb-step{flex:1;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#9C9484;font-weight:600;position:relative}
.sel-asb-step:not(:last-child)::after{content:"→";position:absolute;right:-4px;color:#D6D1C7}
.sel-asb-step.active{color:#5B3FAF}.sel-asb-step.done{color:#4A7C5E}
.sel-asb-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:#F5F4F0;border:2px solid #D6D1C7;color:#9C9484;flex-shrink:0}
.sel-asb-step.active .sel-asb-dot{background:rgba(91,63,175,.1);border-color:#5B3FAF;color:#5B3FAF}
.sel-asb-step.done .sel-asb-dot{background:#4A7C5E;border-color:#4A7C5E;color:#fff}
.sel-modal-body{padding:18px 22px}
.sel-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid #E8E4DC;background:#FBFAF8}
.sel-ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sel-ann-type-btn{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:2px solid #E8E4DC;background:#FAFAF7;cursor:pointer;transition:all .2s;text-align:left;position:relative;width:100%}
.sel-ann-type-btn:hover{border-color:#5B3FAF;background:rgba(91,63,175,.04)}
.sel-ann-type-btn.sel{border-color:#5B3FAF;background:rgba(91,63,175,.06);box-shadow:0 0 0 3px rgba(91,63,175,.1)}
.sel-ann-input{width:100%;padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13.5px;color:#1E1B16;outline:none;transition:border-color .2s;font-family:inherit}
.sel-ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.sel-ann-textarea{width:100%;padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s}
.sel-ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.sel-btn-mghost{padding:9px 18px;border-radius:8px;background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.sel-btn-mnext{padding:9px 22px;border-radius:8px;background:#5B3FAF;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.sel-btn-mnext:disabled{opacity:.4;cursor:not-allowed}
.sel-btn-mnext:hover:not(:disabled){background:#4C34A0;transform:translateY(-1px)}
.sel-btn-msubmit{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.sel-btn-msubmit:disabled{opacity:.5;cursor:not-allowed}
.sel-btn-msubmit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
`;
