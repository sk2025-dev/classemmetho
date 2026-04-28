import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { sanitizeUppercasePrenom } from "../../../Helpers/nameSanitizers";

export default function ConfirmationForm({
    backHref,
    submitUrl,
    familyMembers = [],
    classes = [],
    canSelectMember = false,
}) {
    const [step, setStep] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errors, setErrors] = useState({});

    const defaultMemberId = familyMembers[0]?.id || "";
    const defaultClasseId = familyMembers[0]?.classe_id || "";

    const [form, setForm] = useState({
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        details: {
            dec_nom: "",
            dec_prenom: "",
            dec_tel: "",
            dec_lien: "",
            confirmand: "",
            date_naissance: "",
            lieu_naissance: "",
            baptise: "",
            date_bapteme: "",
            niveau_catechese: "",
            responsable_catechese: "",
            date: "",
            lieu: "",
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentClasse = classes.find((c) => String(c.id) === String(form.classe_id));
    const recap = useMemo(
        () => ({
            declarant: `${form.details.dec_prenom || ""} ${form.details.dec_nom || ""}`.trim() || "-",
            tel: form.details.dec_tel || "-",
            lien: form.details.dec_lien || "-",
            confirmand: form.details.confirmand || "-",
            niveau: form.details.niveau_catechese || "-",
            date: form.details.date || "-",
            lieu: form.details.lieu || "-",
            classe: currentClasse?.nom || "-",
        }),
        [form.details, currentClasse?.nom],
    );

    const setDetail = (key, value) => setForm((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));

    const next = () => {
        if (step === 1) {
            const nextErrors = {};
            if (!form.details.dec_nom) nextErrors.dec_nom = "Champ requis.";
            if (!form.details.dec_prenom) nextErrors.dec_prenom = "Champ requis.";
            if (!form.details.dec_lien) nextErrors["details.dec_lien"] = "Champ requis.";
            if (Object.keys(nextErrors).length) return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        if (step === 2) {
            const nextErrors = {};
            if (!form.details.confirmand) nextErrors["details.confirmand"] = "Champ requis.";
            if (Object.keys(nextErrors).length) return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        if (step === 3) {
            const nextErrors = {};
            if (!form.details.date) nextErrors["details.date"] = "Champ requis.";
            if (!form.details.lieu) nextErrors["details.lieu"] = "Champ requis.";
            if (Object.keys(nextErrors).length) return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        setStep((s) => Math.min(4, s + 1));
    };

    const prev = () => setStep((s) => Math.max(1, s - 1));

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", "confirmation");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.details.date || "");
        payload.append("details[confirmand]", form.details.confirmand || "");
        payload.append("details[date]", form.details.date || "");
        payload.append("details[lieu]", form.details.lieu || "");
        payload.append("details[declarant_nom]", form.details.dec_nom || "");
        payload.append("details[declarant_prenom]", form.details.dec_prenom || "");
        payload.append("details[declarant_tel]", form.details.dec_tel || "");
        payload.append("details[declarant_lien]", form.details.dec_lien || "");
        payload.append("details[date_naissance]", form.details.date_naissance || "");
        payload.append("details[lieu_naissance]", form.details.lieu_naissance || "");
        payload.append("details[baptise]", form.details.baptise || "");
        payload.append("details[date_bapteme]", form.details.date_bapteme || "");
        payload.append("details[niveau_catechese]", form.details.niveau_catechese || "");
        payload.append("details[responsable_catechese]", form.details.responsable_catechese || "");
        payload.append("details[observations]", form.details.observations || "");
        form.pieces_jointes.forEach((file) => payload.append("pieces_jointes[]", file));

        try {
            const res = await axios.post(submitUrl, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccessMsg(res.data?.message || "Demande de confirmation soumise.");
            setSuccess(true);
        } catch (error) {
            const serverErrors = error?.response?.data?.errors || {};
            const flat = {};
            Object.keys(serverErrors).forEach((k) => {
                flat[k] = serverErrors[k][0];
            });
            if (!Object.keys(flat).length && error?.response?.data?.message) {
                flat.submit = error.response.data.message;
            }
            setErrors(flat);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen py-10 px-4" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
            <div className="max-w-3xl mx-auto">
                <Link href={backHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-sm font-semibold">
                    <ArrowLeft size={16} />
                    Retour
                </Link>

                <div className="text-center mt-6 mb-6">
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-violet-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Demande de <em className="font-medium">Confirmation</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">Église Méthodiste du Jubilé de Cocody</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    {!success && (
                        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
                            {["Declarant", "Confirmand", "Preparation", "Confirmation"].map((label, idx) => {
                                const sn = idx + 1;
                                const active = step === sn;
                                const done = step > sn;
                                return (
                                    <div
                                        key={label}
                                        className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                            active ? "text-violet-700 border-violet-600" : done ? "text-blue-700 border-blue-600" : "text-slate-400 border-transparent"
                                        }`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <form onSubmit={submit} className="p-6 md:p-10">
                        {!success && step === 1 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Informations du declarant</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Personne soumettant la demande de confirmation.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom *"><input value={form.details.dec_nom} onChange={(e) => setDetail("dec_nom", e.target.value)} />{errors.dec_nom && <Err>{errors.dec_nom}</Err>}</Field>
                                    <Field label="Prénoms *"><input value={form.details.dec_prenom} onChange={(e) => setDetail("dec_prenom", sanitizeUppercasePrenom(e.target.value))} />{errors.dec_prenom && <Err>{errors.dec_prenom}</Err>}</Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Téléphone"><input value={form.details.dec_tel} onChange={(e) => setDetail("dec_tel", e.target.value)} /></Field>
                                    <Field label="Classe">
                                        <select value={form.classe_id || ""} onChange={(e) => setForm((prev) => ({ ...prev, classe_id: e.target.value }))}>
                                            <option value="">Selectionner</option>
                                            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Lien avec le confirmand *">
                                    <select value={form.details.dec_lien} onChange={(e) => setDetail("dec_lien", e.target.value)}>
                                        <option value="">Choisir</option><option value="Parent">Parent</option><option value="Tuteur legal">Tuteur legal</option><option value="Le confirmand lui-meme">Le confirmand lui-meme</option>
                                    </select>
                                    {errors["details.dec_lien"] && <Err>{errors["details.dec_lien"]}</Err>}
                                </Field>
                                <Field label="Membre concerne">
                                    <select
                                        value={form.membre_id}
                                        onChange={(e) => {
                                            const member = familyMembers.find((m) => String(m.id) === e.target.value);
                                            setForm((prev) => ({
                                                ...prev,
                                                membre_id: e.target.value,
                                                classe_id: member?.classe_id || prev.classe_id,
                                                details: { ...prev.details, confirmand: `${member?.prenom || ""} ${member?.nom || ""}`.trim() },
                                            }));
                                        }}
                                        disabled={!canSelectMember}
                                    >
                                        {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                                    </select>
                                </Field>
                                <FooterButtons onNext={next} />
                            </section>
                        )}

                        {!success && step === 2 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Informations du confirmand</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Renseignez les informations de la personne à confirmer.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom complet *"><input value={form.details.confirmand} onChange={(e) => setDetail("confirmand", e.target.value)} />{errors["details.confirmand"] && <Err>{errors["details.confirmand"]}</Err>}</Field>
                                    <Field label="Date de naissance"><input type="date" value={form.details.date_naissance} onChange={(e) => setDetail("date_naissance", e.target.value)} /></Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Lieu de naissance"><input value={form.details.lieu_naissance} onChange={(e) => setDetail("lieu_naissance", e.target.value)} /></Field>
                                    <Field label="Baptisé(e) ?">
                                        <select value={form.details.baptise} onChange={(e) => setDetail("baptise", e.target.value)}>
                                            <option value="">Choisir</option><option value="Oui">Oui</option><option value="Non">Non</option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Date du baptême"><input type="date" value={form.details.date_bapteme} onChange={(e) => setDetail("date_bapteme", e.target.value)} /></Field>
                                <FooterButtons onPrev={prev} onNext={next} />
                            </section>
                        )}

                        {!success && step === 3 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Préparation catéchétique</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Informations de préparation et détails de la célébration.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Niveau de catéchèse">
                                        <select value={form.details.niveau_catechese} onChange={(e) => setDetail("niveau_catechese", e.target.value)}>
                                            <option value="">Choisir</option><option value="terminee">Terminee</option><option value="en_cours">En cours</option><option value="debut">Debut</option>
                                        </select>
                                    </Field>
                                    <Field label="Responsable catéchèse"><input value={form.details.responsable_catechese} onChange={(e) => setDetail("responsable_catechese", e.target.value)} /></Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Date de confirmation *"><input type="date" value={form.details.date} onChange={(e) => setDetail("date", e.target.value)} />{errors["details.date"] && <Err>{errors["details.date"]}</Err>}</Field>
                                    <Field label="Lieu de la celebration *"><input value={form.details.lieu} onChange={(e) => setDetail("lieu", e.target.value)} />{errors["details.lieu"] && <Err>{errors["details.lieu"]}</Err>}</Field>
                                </div>
                                <Field label="Observations"><textarea value={form.details.observations} onChange={(e) => setDetail("observations", e.target.value)} /></Field>
                                <Field label="Pièces jointes">
                                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((prev) => ({ ...prev, pieces_jointes: Array.from(e.target.files || []) }))} />
                                </Field>
                                <FooterButtons onPrev={prev} onNext={next} />
                            </section>
                        )}

                        {!success && step === 4 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Recapitulatif de la demande</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Verifiez avant de soumettre.</p>
                                <RecapCard title="Demande de Confirmation">
                                    <RecapRow k="Declarant" v={recap.declarant} />
                                    <RecapRow k="Telephone" v={recap.tel} />
                                    <RecapRow k="Lien" v={recap.lien} />
                                    <RecapRow k="Classe" v={recap.classe} />
                                </RecapCard>
                                <RecapCard title="Confirmand">
                                    <RecapRow k="Nom" v={recap.confirmand} />
                                    <RecapRow k="Niveau catechese" v={recap.niveau} />
                                </RecapCard>
                                <RecapCard title="Celebration">
                                    <RecapRow k="Date" v={recap.date} />
                                    <RecapRow k="Lieu" v={recap.lieu} />
                                    <RecapRow k="Statut" v="SOUMISE" />
                                </RecapCard>
                                {errors.submit && <Err>{errors.submit}</Err>}
                                <div className="flex justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
                                    <button type="button" onClick={prev} className="btn-ghost">Modifier</button>
                                    <button type="submit" disabled={processing} className="btn-main">{processing ? "Soumission..." : "Soumettre la demande"}</button>
                                </div>
                            </section>
                        )}

                        {success && (
                            <section className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">Demande soumise</h2>
                                <p className="text-slate-600 max-w-md mx-auto">Votre demande de confirmation a ete transmise a votre conducteur.</p>
                                {successMsg && <p className="text-sm text-violet-700 mt-3">{successMsg}</p>}
                            </section>
                        )}
                    </form>
                </div>

            </div>

            <style>{`
                input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 2px; padding: 10px 12px; background: #fff; color: #0f172a; outline: none; transition: all .2s; font-size: 13px; }
                input:focus, select:focus, textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.12); }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main{ border: 1px solid #7c3aed; background: #7c3aed; color: #fff; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
                .btn-ghost{ border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
            `}</style>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500">{label}</label>
            {children}
        </div>
    );
}

function Err({ children }) {
    return <p className="text-xs text-red-600 mt-1">{children}</p>;
}

function FooterButtons({ onPrev, onNext }) {
    return (
        <div className="flex justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
            {onPrev ? <button type="button" onClick={onPrev} className="btn-ghost">Retour</button> : <span />}
            <button type="button" onClick={onNext} className="btn-main">Suivant</button>
        </div>
    );
}

function RecapCard({ title, children }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 mb-3">
            <h3 className="text-base font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">{title}</h3>
            {children}
        </div>
    );
}

function RecapRow({ k, v }) {
    return (
        <div className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-slate-200/70 last:border-b-0">
            <span className="text-slate-500">{k}</span>
            <span className="text-slate-800 text-right">{v || "-"}</span>
        </div>
    );
}
