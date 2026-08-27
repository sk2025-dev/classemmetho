import React, { useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { Sparkles, Megaphone, User, MessageSquare, Calendar, Clock, HandHeart, ChevronRight } from "lucide-react";
import Select2Single from "./Select2Single";
import { withBasePath } from "../Utils/urlHelper";

const ANNONCE_TYPES = [
    {
        value: "grace",
        label: "Prière d'action de grâce / remerciement",
        emoji: "🙌",
    },
    {
        value: "priere",
        label: "Prière d'intercession",
        emoji: "🙏",
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

const EMPTY_FORM = {
    type_annonce: "",
    motif: "",
    temoignage_public: false,
    membre_id: "",
    message: "",
    date_annonce: "",
    heure_culte: "",
};

/**
 * Bouton + modal auto-porté pour soumettre une demande de prière / action de
 * grâce en 3 étapes (Type, Détails, Confirmation). Réutilisable sur les
 * tableaux de bord Pasteur et Président des Conducteurs (et partout où un
 * profil doit pouvoir soumettre sa propre demande).
 *
 * @param {string} submitUrl - endpoint POST (ex: "/pasteur/annonces")
 * @param {Array} familyMembers - liste [{id, prenom, nom}] pour "Personne concernée"
 * @param {string} circuitLabel - étapes suivant la soumission (ex: "Pasteur → Publication")
 * @param {string} buttonLabel - texte du bouton déclencheur
 * @param {function} onSuccess - callback après soumission réussie (optionnel)
 * @param {string} redirectTo - URL de redirection après succès (optionnel)
 */
export default function PriereRequestButton({
    submitUrl,
    familyMembers = [],
    circuitLabel = "Pasteur → Publication",
    buttonLabel = "Nouvelle demande de prière",
    onSuccess,
    redirectTo,
    className = "",
}) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [toast, setToast] = useState(null);

    const selectedType = ANNONCE_TYPES.find((t) => t.value === form.type_annonce);
    const selectedMotifLabel =
        form.type_annonce === "grace"
            ? MOTIFS_GRACE.find((m) => m.value === form.motif)?.label
            : form.type_annonce === "priere"
              ? MOTIFS_INTERCESSION.find((m) => m.value === form.motif)?.label
              : null;

    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const openModal = () => {
        setForm(EMPTY_FORM);
        setStep(1);
        setOpen(true);
    };

    const closeModal = () => {
        if (processing) return;
        setOpen(false);
        setStep(1);
        setForm(EMPTY_FORM);
    };

    const submit = async () => {
        if (!form.type_annonce || !form.message.trim()) {
            notify("Veuillez remplir tous les champs obligatoires.", "error");
            return;
        }
        if (
            (form.type_annonce === "grace" || form.type_annonce === "priere") &&
            !form.motif
        ) {
            notify("Veuillez sélectionner un motif.", "error");
            return;
        }
        try {
            setProcessing(true);
            await axios.post(withBasePath("", submitUrl), form);
            closeModal();
            notify("✅ Demande de prière soumise avec succès.");
            if (onSuccess) onSuccess();
            if (redirectTo) {
                setTimeout(() => router.visit(withBasePath("", redirectTo)), 1500);
            }
        } catch (e) {
            notify(e?.response?.data?.message || "Une erreur est survenue.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <style>{modalStyles}</style>
            <button
                type="button"
                onClick={openModal}
                className={className || "pr-trigger-btn"}
            >
                <HandHeart size={16} />
                {buttonLabel}
                <ChevronRight size={14} />
            </button>

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 220,
                        background: toast.type === "error" ? "#C06040" : "#4A7C5E",
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

            {open && (
                <div className="sel-modal-overlay" onClick={closeModal}>
                    <div className="sel-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sel-modal-head">
                            <div>
                                <div className="sel-modal-title">
                                    {step === 1 && "Type de demande de prière"}
                                    {step === 2 &&
                                        `${selectedType?.emoji || "🙏"} ${selectedType?.label || "Demande de prière"}`}
                                    {step === 3 && "Confirmation"}
                                </div>
                                <div className="sel-modal-sub">
                                    Étape {step} / 3 · Circuit : {circuitLabel}
                                </div>
                            </div>
                            <button type="button" className="sel-modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <div className="sel-ann-steps-bar">
                            {["Type", "Détails", "Confirmation"].map((s, i) => (
                                <div
                                    key={i}
                                    className={`sel-asb-step ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}
                                >
                                    <div className="sel-asb-dot">{step > i + 1 ? "✓" : i + 1}</div>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>

                        <div className="sel-modal-body">
                            {step === 1 && (
                                <div className="sel-ann-type-grid">
                                    {ANNONCE_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            className={`sel-ann-type-btn ${form.type_annonce === t.value ? "sel" : ""}`}
                                            onClick={() =>
                                                setForm((f) => ({ ...f, type_annonce: t.value, motif: "" }))
                                            }
                                        >
                                            <span style={{ fontSize: 24, flexShrink: 0 }}>{t.emoji}</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, textAlign: "left", lineHeight: 1.3 }}>
                                                {t.label}
                                            </span>
                                            {form.type_annonce === t.value && (
                                                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#5B3FAF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step === 2 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {(form.type_annonce === "grace" || form.type_annonce === "priere") && (
                                        <div className="sel-card">
                                            <PrField label="Motif" icon={<Sparkles size={13} />} required>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                                    {(form.type_annonce === "grace" ? MOTIFS_GRACE : MOTIFS_INTERCESSION).map((m) => (
                                                        <button
                                                            key={m.value}
                                                            type="button"
                                                            className={`sel-chip ${form.motif === m.value ? "sel" : ""}`}
                                                            onClick={() => setForm((f) => ({ ...f, motif: m.value }))}
                                                        >
                                                            {form.motif === m.value && "✓ "}
                                                            {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PrField>

                                            <PrField label="Voulez-vous rendre publiquement témoignage ?" icon={<Megaphone size={13} />}>
                                                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                                    {[{ val: true, label: "OUI" }, { val: false, label: "NON" }].map(({ val, label }) => (
                                                        <button
                                                            key={label}
                                                            type="button"
                                                            className={`sel-chip ${form.temoignage_public === val ? "sel" : ""}`}
                                                            style={{ minWidth: 64, textAlign: "center" }}
                                                            onClick={() => setForm((f) => ({ ...f, temoignage_public: val }))}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 11, color: "#9C9484", marginTop: 6 }}>
                                                    Pour cas exceptionnel
                                                </div>
                                            </PrField>
                                        </div>
                                    )}

                                    <div className="sel-card">
                                        <PrField label="Personne concernée (optionnel)" icon={<User size={13} />}>
                                            <Select2Single
                                                name="membre_id"
                                                value={form.membre_id}
                                                onChange={(e) => setForm((f) => ({ ...f, membre_id: e.target.value }))}
                                                options={familyMembers.map((m) => ({
                                                    value: m.id,
                                                    label: `${m.prenom} ${m.nom}`,
                                                }))}
                                                placeholder="Rechercher un membre..."
                                                noOptionsMessage="Aucun membre trouvé"
                                            />
                                        </PrField>
                                        <PrField label="Message de l'annonce" icon={<MessageSquare size={13} />} required>
                                            <textarea
                                                className="sel-ann-textarea"
                                                rows={4}
                                                maxLength={500}
                                                placeholder={getPlaceholder(form.type_annonce)}
                                                value={form.message}
                                                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                            />
                                            <div style={{ fontSize: 10.5, color: "#9C9484", textAlign: "right", marginTop: 2 }}>
                                                {form.message.length}/500
                                            </div>
                                        </PrField>
                                    </div>

                                    <div className="sel-card">
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                            <PrField label="Date du culte" icon={<Calendar size={13} />} style={{ flex: "1 1 140px" }}>
                                                <input
                                                    className="sel-ann-input"
                                                    type="date"
                                                    value={form.date_annonce}
                                                    onChange={(e) => setForm((f) => ({ ...f, date_annonce: e.target.value }))}
                                                />
                                            </PrField>
                                            <PrField label="Heure du culte" icon={<Clock size={13} />} style={{ flex: "1 1 140px" }}>
                                                <input
                                                    className="sel-ann-input"
                                                    type="time"
                                                    list="pr-heures-culte"
                                                    value={form.heure_culte}
                                                    onChange={(e) => setForm((f) => ({ ...f, heure_culte: e.target.value }))}
                                                />
                                                <datalist id="pr-heures-culte">
                                                    <option value="07:30" label="7h30" />
                                                    <option value="09:30" label="9h30" />
                                                </datalist>
                                            </PrField>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(74,124,94,.06)", border: "1px solid rgba(74,124,94,.18)", borderRadius: 8, fontSize: 12, color: "#4A7C5E", fontWeight: 600 }}>
                                        Visible par toute la paroisse après validation
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 10, background: "#F5F4F0", border: "1px solid #E8E4DC" }}>
                                        <span style={{ fontSize: 30 }}>{selectedType?.emoji}</span>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedType?.label}</div>
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
                                    {form.membre_id && (
                                        <PrRecapRow
                                            label="Concerné(e)"
                                            value={(() => {
                                                const m = familyMembers.find((fm) => String(fm.id) === String(form.membre_id));
                                                return m ? `${m.prenom} ${m.nom}` : "Membre";
                                            })()}
                                        />
                                    )}
                                    {form.date_annonce && <PrRecapRow label="Date du culte" value={form.date_annonce} />}
                                    {form.heure_culte && <PrRecapRow label="Heure du culte" value={form.heure_culte} />}
                                    <div style={{ background: "#F5F4F0", borderRadius: 8, padding: 13 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", color: "#9C9484", marginBottom: 6 }}>
                                            Message
                                        </div>
                                        <div style={{ fontSize: 13, color: "#1E1B16", lineHeight: 1.7 }}>{form.message}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9C9484", background: "rgba(91,63,175,.05)", border: "1px solid rgba(91,63,175,.15)", borderRadius: 8, padding: "10px 14px" }}>
                                        Après soumission :{" "}
                                        <strong style={{ color: "#5B3FAF" }}>{circuitLabel}</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sel-modal-foot">
                            {step > 1 ? (
                                <button type="button" className="sel-btn-mghost" onClick={() => setStep((s) => s - 1)}>
                                    ← Retour
                                </button>
                            ) : (
                                <button type="button" className="sel-btn-mghost" onClick={closeModal}>
                                    Annuler
                                </button>
                            )}
                            {step < 3 ? (
                                <button
                                    type="button"
                                    className="sel-btn-mnext"
                                    disabled={step === 1 && !form.type_annonce}
                                    onClick={() => {
                                        if (
                                            step === 2 &&
                                            (form.type_annonce === "grace" || form.type_annonce === "priere") &&
                                            !form.motif
                                        ) {
                                            notify("Veuillez sélectionner un motif.", "error");
                                            return;
                                        }
                                        if (step === 2 && !form.message.trim()) {
                                            notify("Le message est obligatoire.", "error");
                                            return;
                                        }
                                        setStep((s) => s + 1);
                                    }}
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button type="button" className="sel-btn-msubmit" disabled={processing} onClick={submit}>
                                    {processing ? "Envoi en cours…" : "✅ Soumettre la demande"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function PrField({ label, icon, required, children, style }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", color: "#5C5748" }}>
                {icon && <span style={{ color: "#9C8BD9", display: "inline-flex" }}>{icon}</span>}
                {label}
                {required && <span style={{ color: "#C06040" }}> *</span>}
            </label>
            {children}
        </div>
    );
}

function PrRecapRow({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #E8E4DC", fontSize: 12.5, gap: 10 }}>
            <span style={{ color: "#9C9484", fontWeight: 600 }}>{label}</span>
            <span style={{ color: "#1E1B16", fontWeight: 700, textAlign: "right" }}>{value}</span>
        </div>
    );
}

const modalStyles = `
.pr-trigger-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.pr-trigger-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
.sel-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:200;backdrop-filter:blur(6px)}
.sel-modal{width:100%;max-width:540px;max-height:90vh;overflow:auto;background:#fff;border:1px solid #E8E4DC;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.3);animation:selMIn .28s cubic-bezier(.34,1.56,.64,1) both;box-sizing:border-box}
.sel-modal *{box-sizing:border-box}
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
.sel-ann-input{width:100%;padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13.5px;color:#1E1B16;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
.sel-ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.sel-ann-input:hover{border-color:#B9B2A3}
.sel-ann-textarea{width:100%;padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.sel-ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.sel-card{display:flex;flex-direction:column;gap:16px;padding:16px;background:#FBFAF8;border:1px solid #ECE8DE;border-radius:12px}
.sel-chip{padding:7px 15px;border-radius:20px;border:1.5px solid #D6D1C7;background:#fff;color:#374151;font-weight:600;font-size:12px;cursor:pointer;transition:all .15s;font-family:inherit}
.sel-chip:hover{border-color:#d97706;background:#fffbeb}
.sel-chip.sel{border-color:#d97706;background:#fffbeb;color:#b45309;font-weight:700;box-shadow:0 0 0 3px rgba(217,119,6,.1)}
.sel-btn-mghost{padding:9px 18px;border-radius:8px;background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.sel-btn-mnext{padding:9px 22px;border-radius:8px;background:#5B3FAF;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.sel-btn-mnext:disabled{opacity:.4;cursor:not-allowed}
.sel-btn-mnext:hover:not(:disabled){background:#4C34A0;transform:translateY(-1px)}
.sel-btn-msubmit{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.sel-btn-msubmit:disabled{opacity:.5;cursor:not-allowed}
.sel-btn-msubmit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
`;
