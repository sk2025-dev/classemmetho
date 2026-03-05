import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function CommunionForm({
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
            dem_nom: "",
            dem_prenom: "",
            dem_tel: "",
            dem_lien: "",
            personne: "",
            can_ddn: "",
            can_sexe: "",
            can_adr: "",
            can_baptise: "",
            can_date_bap: "",
            can_anciennete: "",
            cat_suivi: "",
            cat_resp: "",
            cat_duree: "",
            date: "",
            lieu: "",
            decl1: false,
            decl2: false,
            decl3: false,
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentClasse = classes.find((c) => String(c.id) === String(form.classe_id));
    const recap = useMemo(
        () => ({
            demandeur: `${form.details.dem_prenom || ""} ${form.details.dem_nom || ""}`.trim() || "-",
            classe: currentClasse?.nom || "-",
            lien: form.details.dem_lien || "-",
            candidat: form.details.personne || "-",
            ddn: form.details.can_ddn || "-",
            baptise: form.details.can_baptise || "-",
            date: form.details.date || "-",
            lieu: form.details.lieu || "-",
            cat: form.details.cat_suivi || "-",
        }),
        [form.details, currentClasse?.nom],
    );

    const setDetail = (key, value) => {
        setForm((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
    };

    const next = () => {
        if (step === 1) {
            const nextErrors = {};
            if (!form.details.dem_nom) nextErrors.dem_nom = "Champ requis.";
            if (!form.details.dem_prenom) nextErrors.dem_prenom = "Champ requis.";
            if (!form.classe_id) nextErrors.classe_id = "Champ requis.";
            if (!form.details.dem_lien) nextErrors["details.dem_lien"] = "Champ requis.";
            if (Object.keys(nextErrors).length) return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        if (step === 2) {
            const nextErrors = {};
            if (!form.details.personne) nextErrors["details.personne"] = "Champ requis.";
            if (!form.details.can_ddn) nextErrors["details.can_ddn"] = "Champ requis.";
            if (!form.details.can_baptise) nextErrors["details.can_baptise"] = "Champ requis.";
            if (Object.keys(nextErrors).length) return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        if (step === 3) {
            const nextErrors = {};
            if (!form.details.cat_suivi) nextErrors["details.cat_suivi"] = "Champ requis.";
            if (!form.details.date) nextErrors["details.date"] = "Champ requis.";
            if (!form.details.lieu) nextErrors["details.lieu"] = "Champ requis.";
            if (!form.details.decl1 || !form.details.decl2 || !form.details.decl3) {
                nextErrors["details.declarations"] = "Veuillez cocher les 3 declarations.";
            }
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
        payload.append("type_acte", "premiere_communion");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.details.date || "");
        payload.append("details[personne]", form.details.personne || "");
        payload.append("details[date]", form.details.date || "");
        payload.append("details[lieu]", form.details.lieu || "");
        payload.append("details[demandeur_nom]", form.details.dem_nom || "");
        payload.append("details[demandeur_prenom]", form.details.dem_prenom || "");
        payload.append("details[demandeur_tel]", form.details.dem_tel || "");
        payload.append("details[demandeur_lien]", form.details.dem_lien || "");
        payload.append("details[date_naissance]", form.details.can_ddn || "");
        payload.append("details[sexe]", form.details.can_sexe || "");
        payload.append("details[adresse]", form.details.can_adr || "");
        payload.append("details[deja_baptise]", form.details.can_baptise || "");
        payload.append("details[date_bapteme]", form.details.can_date_bap || "");
        payload.append("details[anciennete]", form.details.can_anciennete || "");
        payload.append("details[catechese_suivi]", form.details.cat_suivi || "");
        payload.append("details[catechese_responsable]", form.details.cat_resp || "");
        payload.append("details[catechese_duree]", form.details.cat_duree || "");
        payload.append("details[observations]", form.details.observations || "");
        form.pieces_jointes.forEach((file) => payload.append("pieces_jointes[]", file));

        try {
            const res = await axios.post(submitUrl, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccessMsg(res.data?.message || "Demande de premiere communion soumise.");
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

    const reset = () => {
        setSuccess(false);
        setStep(1);
        setErrors({});
        setSuccessMsg("");
        setForm({
            membre_id: defaultMemberId,
            classe_id: defaultClasseId,
            details: {
                dem_nom: "",
                dem_prenom: "",
                dem_tel: "",
                dem_lien: "",
                personne: "",
                can_ddn: "",
                can_sexe: "",
                can_adr: "",
                can_baptise: "",
                can_date_bap: "",
                can_anciennete: "",
                cat_suivi: "",
                cat_resp: "",
                cat_duree: "",
                date: "",
                lieu: "",
                decl1: false,
                decl2: false,
                decl3: false,
                observations: "",
            },
            pieces_jointes: [],
        });
    };

    return (
        <div className="min-h-screen py-10 px-4" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
            <div className="max-w-3xl mx-auto">
                <Link href={backHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-sm font-semibold">
                    <ArrowLeft size={16} />
                    Retour
                </Link>

                <div className="text-center mt-6 mb-6">
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-amber-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Premiere <em className="font-medium">Communion</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">Eglise Methodiste du Jubile de Cocody</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    {!success && (
                        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200">
                            {["Demandeur", "Candidat", "Preparation", "Confirmation"].map((label, idx) => {
                                const sn = idx + 1;
                                const active = step === sn;
                                const done = step > sn;
                                return (
                                    <div
                                        key={label}
                                        className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                            active ? "text-amber-700 border-amber-600" : done ? "text-green-700 border-green-600" : "text-slate-400 border-transparent"
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
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Informations du demandeur</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Responsable de famille ou tuteur legal.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom *"><input value={form.details.dem_nom} onChange={(e) => setDetail("dem_nom", e.target.value)} />{errors.dem_nom && <Err>{errors.dem_nom}</Err>}</Field>
                                    <Field label="Prenoms *"><input value={form.details.dem_prenom} onChange={(e) => setDetail("dem_prenom", e.target.value)} />{errors.dem_prenom && <Err>{errors.dem_prenom}</Err>}</Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Telephone"><input value={form.details.dem_tel} onChange={(e) => setDetail("dem_tel", e.target.value)} /></Field>
                                    <Field label="Classe *">
                                        <select value={form.classe_id || ""} onChange={(e) => setForm((prev) => ({ ...prev, classe_id: e.target.value }))}>
                                            <option value="">Selectionner</option>
                                            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                        </select>
                                        {errors.classe_id && <Err>{errors.classe_id}</Err>}
                                    </Field>
                                </div>
                                <Field label="Lien avec le candidat *">
                                    <select value={form.details.dem_lien} onChange={(e) => setDetail("dem_lien", e.target.value)}>
                                        <option value="">Choisir</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Tuteur legal">Tuteur legal</option>
                                        <option value="Le candidat lui-meme">Le candidat lui-meme</option>
                                    </select>
                                    {errors["details.dem_lien"] && <Err>{errors["details.dem_lien"]}</Err>}
                                </Field>
                                <FooterButtons onNext={next} accent="amber" />
                            </section>
                        )}

                        {!success && step === 2 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Informations du candidat</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Personne souhaitant communier pour la premiere fois.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Membre concerne">
                                        <select
                                            value={form.membre_id}
                                            onChange={(e) => {
                                                const member = familyMembers.find((m) => String(m.id) === e.target.value);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                    classe_id: member?.classe_id || prev.classe_id,
                                                    details: { ...prev.details, personne: `${member?.prenom || ""} ${member?.nom || ""}`.trim() },
                                                }));
                                            }}
                                            disabled={!canSelectMember}
                                        >
                                            {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Nom complet *"><input value={form.details.personne} onChange={(e) => setDetail("personne", e.target.value)} />{errors["details.personne"] && <Err>{errors["details.personne"]}</Err>}</Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Date de naissance *"><input type="date" value={form.details.can_ddn} onChange={(e) => setDetail("can_ddn", e.target.value)} />{errors["details.can_ddn"] && <Err>{errors["details.can_ddn"]}</Err>}</Field>
                                    <Field label="Sexe">
                                        <select value={form.details.can_sexe} onChange={(e) => setDetail("can_sexe", e.target.value)}>
                                            <option value="">Choisir</option><option value="Masculin">Masculin</option><option value="Feminin">Feminin</option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Adresse"><input value={form.details.can_adr} onChange={(e) => setDetail("can_adr", e.target.value)} /></Field>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Field label="A ete baptise(e) ? *">
                                        <select value={form.details.can_baptise} onChange={(e) => setDetail("can_baptise", e.target.value)}>
                                            <option value="">Choisir</option><option value="Oui cette eglise">Oui - dans cette eglise</option><option value="Oui autre eglise">Oui - autre eglise</option><option value="Non">Non</option>
                                        </select>
                                        {errors["details.can_baptise"] && <Err>{errors["details.can_baptise"]}</Err>}
                                    </Field>
                                    <Field label="Date du bapteme"><input type="date" value={form.details.can_date_bap} onChange={(e) => setDetail("can_date_bap", e.target.value)} /></Field>
                                </div>
                                <Field label="Anciennete dans l'eglise">
                                    <select value={form.details.can_anciennete} onChange={(e) => setDetail("can_anciennete", e.target.value)}>
                                        <option value="">Choisir</option><option value="<6m">Moins de 6 mois</option><option value="6m-1a">6 mois a 1 an</option><option value="1a-3a">1 a 3 ans</option><option value=">3a">Plus de 3 ans</option>
                                    </select>
                                </Field>
                                <FooterButtons onPrev={prev} onNext={next} accent="amber" />
                            </section>
                        )}

                        {!success && step === 3 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Preparation & ceremonie</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Suivi catechetique et date souhaitee.</p>
                                <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-sm text-amber-900 mb-4">
                                    <strong className="block text-xs mb-1">Conditions requises</strong>
                                    Le candidat doit avoir suivi le catechisme et etre valide par le conducteur.
                                </div>
                                <Field label="Suivi catechese *">
                                    <select value={form.details.cat_suivi} onChange={(e) => setDetail("cat_suivi", e.target.value)}>
                                        <option value="">Choisir</option><option value="Toutes les sessions">Toutes les sessions</option><option value="Majorite">Majorite</option><option value="Partiel">Partiel</option><option value="Pas commence">Pas commence</option>
                                    </select>
                                    {errors["details.cat_suivi"] && <Err>{errors["details.cat_suivi"]}</Err>}
                                </Field>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                                    <Field label="Responsable catechese"><input value={form.details.cat_resp} onChange={(e) => setDetail("cat_resp", e.target.value)} /></Field>
                                    <Field label="Duree du suivi"><input value={form.details.cat_duree} onChange={(e) => setDetail("cat_duree", e.target.value)} /></Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Date souhaitee *"><input type="date" value={form.details.date} onChange={(e) => setDetail("date", e.target.value)} />{errors["details.date"] && <Err>{errors["details.date"]}</Err>}</Field>
                                    <Field label="Lieu *"><input value={form.details.lieu} onChange={(e) => setDetail("lieu", e.target.value)} />{errors["details.lieu"] && <Err>{errors["details.lieu"]}</Err>}</Field>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <CheckRow
                                        checked={form.details.decl1}
                                        text="Je confirme que les informations sont exactes"
                                        onChange={(v) => setDetail("decl1", v)}
                                    />
                                    <CheckRow
                                        checked={form.details.decl2}
                                        text="Le candidat a suivi le parcours de preparation"
                                        onChange={(v) => setDetail("decl2", v)}
                                    />
                                    <CheckRow
                                        checked={form.details.decl3}
                                        text="Je comprends que la validation finale revient au Pasteur"
                                        onChange={(v) => setDetail("decl3", v)}
                                    />
                                    {errors["details.declarations"] && <Err>{errors["details.declarations"]}</Err>}
                                </div>
                                <Field label="Observations"><textarea value={form.details.observations} onChange={(e) => setDetail("observations", e.target.value)} /></Field>
                                <Field label="Pieces jointes">
                                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((prev) => ({ ...prev, pieces_jointes: Array.from(e.target.files || []) }))} />
                                </Field>
                                <FooterButtons onPrev={prev} onNext={next} accent="amber" />
                            </section>
                        )}

                        {!success && step === 4 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Recapitulatif de la demande</h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">Verifiez avant de soumettre.</p>
                                <RecapCard title="Premiere Communion">
                                    <RecapRow k="Demandeur" v={recap.demandeur} />
                                    <RecapRow k="Classe" v={recap.classe} />
                                    <RecapRow k="Lien" v={recap.lien} />
                                </RecapCard>
                                <RecapCard title="Candidat">
                                    <RecapRow k="Identite" v={recap.candidat} />
                                    <RecapRow k="Date de naissance" v={recap.ddn} />
                                    <RecapRow k="Baptise(e)" v={recap.baptise} />
                                </RecapCard>
                                <RecapCard title="Ceremonie">
                                    <RecapRow k="Date souhaitee" v={recap.date} />
                                    <RecapRow k="Lieu" v={recap.lieu} />
                                    <RecapRow k="Suivi catechese" v={recap.cat} />
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
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">Demande soumise avec succes</h2>
                                <p className="text-slate-600 max-w-md mx-auto">Votre demande de premiere communion a ete transmise a votre conducteur.</p>
                                {successMsg && <p className="text-sm text-amber-700 mt-3">{successMsg}</p>}
                                <div className="mt-6"><button type="button" onClick={reset} className="btn-main">Nouvelle demande</button></div>
                            </section>
                        )}
                    </form>
                </div>

            </div>

            <style>{`
                input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 2px; padding: 10px 12px; background: #fff; color: #0f172a; outline: none; transition: all .2s; font-size: 13px; }
                input:focus, select:focus, textarea:focus { border-color: #b45309; box-shadow: 0 0 0 3px rgba(180,83,9,.12); }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main{ border: 1px solid #b45309; background: #b45309; color: #fff; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
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

function FooterButtons({ onPrev, onNext, accent = "amber" }) {
    const mainClass = accent === "amber" ? "btn-main" : "btn-main";
    return (
        <div className="flex justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
            {onPrev ? <button type="button" onClick={onPrev} className="btn-ghost">Retour</button> : <span />}
            <button type="button" onClick={onNext} className={mainClass}>Suivant</button>
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

function CheckRow({ checked, text, onChange }) {
    return (
        <label className="flex items-center gap-3 border border-slate-200 rounded-sm px-3 py-2 bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-amber-700" />
            <span className="text-sm text-slate-700">{text}</span>
        </label>
    );
}
