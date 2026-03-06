import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";

export default function DecesForm({
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

    const {
        toasts,
        removeToast,
        success: showSuccess,
        error: showError,
        handleApiError,
    } = useToastWithErrorHandling();

    const defaultMemberId = familyMembers[0]?.id || "";
    const defaultClasseId = familyMembers[0]?.classe_id || "";
    const today = new Date().toISOString().split("T")[0];

    const [form, setForm] = useState({
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        details: {
            dec_lien: "lui-meme",
            nom_defunt: "",
            prenom_defunt: "",
            date_naissance_defunt: "",
            date_deces: "",
            lieu_deces: "",
            genre_defunt: "",
            def_membre: "",
            def_classe: "",
            def_baptise: "",
            lien_familial: "lui-meme",
            programme_obseques: "",
        },
        programme_piece: null,
    });

    // Pré-remplir les infos du défunt quand un membre inscrit est sélectionné
    useEffect(() => {
        if (form.membre_id && form.membre_id !== "autre") {
            const selectedMember = familyMembers.find(
                (m) => String(m.id) === String(form.membre_id)
            );
            
            if (selectedMember) {
                setForm((prev) => ({
                    ...prev,
                    classe_id: selectedMember.classe_id || prev.classe_id,
                    details: {
                        ...prev.details,
                        nom_defunt: selectedMember.nom || "",
                        prenom_defunt: selectedMember.prenom || "",
                        date_naissance_defunt: selectedMember.date_naissance || "",
                        genre_defunt: selectedMember.genre || "",
                        def_classe: selectedMember.classe?.nom || "",
                        def_baptise: selectedMember.sacrements?.baptise ? "oui" : "non",
                        def_membre: "membre_actif",
                        dec_lien: "lui-meme",
                        lien_familial: "lui-meme",
                    },
                }));
            }
        } else if (form.membre_id === "autre") {
            // Réinitialiser les champs pour "Autre membre"
            setForm((prev) => ({
                ...prev,
                details: {
                    ...prev.details,
                    nom_defunt: "",
                    prenom_defunt: "",
                    date_naissance_defunt: "",
                    genre_defunt: "",
                    def_classe: "",
                    def_baptise: "",
                    def_membre: "",
                    dec_lien: "",
                    lien_familial: "",
                },
            }));
        }
    }, [form.membre_id, familyMembers]);

    const recap = useMemo(
        () => {
            let lienText = form.details.dec_lien || "-";
            if (lienText === "lui-meme") {
                lienText = "Le membre lui-même / elle-même";
            }
            
            return {
                lien: lienText,
                defunt:
                    `${form.details.prenom_defunt || ""} ${form.details.nom_defunt || ""}`.trim() ||
                    "-",
                ddec: form.details.date_deces || "-",
                lieu: form.details.lieu_deces || "-",
                membre: form.details.def_membre || "-",
            };
        },
        [form.details],
    );

    const setDetail = (key, value) =>
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));
    const next = () => {
        if (step === 1) {
            const nextErrors = {};
            
            // Si "Autre membre" est sélectionné, "dec_lien" est requis
            if (form.membre_id === "autre" && !form.details.dec_lien) {
                nextErrors["details.dec_lien"] = "Champ requis.";
            }
            
            if (!form.details.nom_defunt)
                nextErrors["details.nom_defunt"] = "Champ requis.";
            if (!form.details.prenom_defunt)
                nextErrors["details.prenom_defunt"] = "Champ requis.";
            if (!form.details.date_deces)
                nextErrors["details.date_deces"] = "Champ requis.";
            
            if (Object.keys(nextErrors).length)
                return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        setStep((s) => Math.min(2, s + 1));
    };

    const prev = () => setStep((s) => Math.max(1, s - 1));

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", "deces");
        
        // Si "autre" est sélectionné, utiliser le premier membre de la famille comme déclarant
        const membreIdToSend = form.membre_id === "autre" 
            ? (familyMembers[0]?.id || "") 
            : form.membre_id;
        
        payload.append("membre_id", membreIdToSend || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append(
            "details[nom_defunt]",
            `${form.details.prenom_defunt} ${form.details.nom_defunt}`.trim(),
        );
        payload.append("details[date_deces]", form.details.date_deces || "");
        payload.append(
            "details[lien_familial]",
            form.details.lien_familial || form.details.dec_lien || "lui-meme",
        );
        payload.append("details[lieu_deces]", form.details.lieu_deces || "");
        payload.append("details[sexe_defunt]", form.details.genre_defunt || "");
        payload.append(
            "details[date_naissance_defunt]",
            form.details.date_naissance_defunt || "",
        );
        payload.append("details[def_membre]", form.details.def_membre || "");
        payload.append("details[def_classe]", form.details.def_classe || "");
        payload.append("details[def_baptise]", form.details.def_baptise || "");
        payload.append(
            "details[programme_obseques]",
            form.details.programme_obseques || "",
        );
        if (form.programme_piece) {
            payload.append("programme_file", form.programme_piece);
        }
        payload.append("details[declarant_lien]", form.details.dec_lien || "lui-meme");

        try {
            const res = await axios.post(submitUrl, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const msg = res.data?.message || "Declaration de deces soumise.";
            setSuccessMsg(msg);
            setSuccess(true);
            showSuccess(msg);
        } catch (error) {
            const data = error?.response?.data || {};
            handleApiError(data);
            const serverErrors = data.errors || {};
            const flat = {};
            Object.keys(serverErrors).forEach((k) => {
                flat[k] = serverErrors[k][0];
            });
            if (!Object.keys(flat).length && data.message) {
                flat.submit = data.message;
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
        
        // Réinitialiser le formulaire au membre par défaut
        setForm({
            membre_id: defaultMemberId,
            classe_id: defaultClasseId,
            details: {
                dec_lien: "lui-meme",
                nom_defunt: "",
                prenom_defunt: "",
                date_naissance_defunt: "",
                date_deces: "",
                lieu_deces: "",
                genre_defunt: "",
                def_membre: "",
                def_classe: "",
                def_baptise: "",
                lien_familial: "lui-meme",
                programme_obseques: "",
            },
            programme_piece: null,
        });
    };

    return (
        <div
            className="min-h-screen py-10 px-4"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-3xl mx-auto">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-sm font-semibold"
                >
                    <ArrowLeft size={16} />
                    Retour
                </Link>

                <div className="text-center mt-6 mb-6">
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-slate-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Declaration de <em className="font-medium">Deces</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">
                        Eglise Methodiste du Jubile de Cocody
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    {!success && (
                        <>
                            <div className="h-[3px] bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
                                {["Defunt(e)", "Confirmation"].map(
                                    (label, idx) => {
                                        const sn = idx + 1;
                                        const active = step === sn;
                                        const done = step > sn;
                                        return (
                                            <div
                                                key={label}
                                                className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                                    active
                                                        ? "text-slate-700 border-slate-600"
                                                        : done
                                                          ? "text-amber-700 border-amber-600"
                                                          : "text-slate-400 border-transparent"
                                                }`}
                                            >
                                                {label}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </>
                    )}

                    <form onSubmit={submit} className="p-6 md:p-10">

                        {!success && step === 1 && (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                        Informations du défunt / de la défunte
                                    </h2>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Sélectionnez le membre concerné. Si la personne décédée n'est pas inscrite, choisissez "Autre membre".
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 text-sm text-slate-700 mb-6">
                                    L'église vous présente ses sincères condoléances et vous accompagne dans cette épreuve.
                                </div>

                                {/* Sélection du membre concerné */}
                                <div className="mb-6">
                                    <Field label="Membre concerné (personne décédée) *">
                                        <select
                                            value={form.membre_id}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                }))
                                            }
                                            disabled={!canSelectMember}
                                        >
                                            {familyMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom} {m.nom}
                                                </option>
                                            ))}
                                            <option value="autre">
                                                ➕ Autre membre / Personne non inscrite
                                            </option>
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1.5">
                                            {form.membre_id === "autre" 
                                                ? "Vous pouvez saisir les informations d'une personne non inscrite"
                                                : "Les informations du membre sélectionné seront utilisées"}
                                        </p>
                                    </Field>
                                </div>

                                {/* Si membre inscrit : afficher les infos en lecture seule */}
                                {form.membre_id && form.membre_id !== "autre" && (
                                    <>
                                        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
                                            <p className="text-sm text-blue-800 font-medium mb-2">
                                                ✓ Informations du membre préremplies automatiquement
                                            </p>
                                            <p className="text-xs text-blue-700">
                                                Les informations ci-dessous proviennent du profil du membre. 
                                                Si vous souhaitez déclarer une autre personne, sélectionnez "Autre membre".
                                            </p>
                                        </div>

                                        {/* Résumé des infos pré-remplies */}
                                        <div className="bg-white border border-blue-200 rounded-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-slate-500 uppercase">Identité pré-remplie</p>
                                                <p className="text-sm text-slate-800">
                                                    {form.details.prenom_defunt} {form.details.nom_defunt}
                                                </p>
                                            </div>
                                            {form.details.genre_defunt && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Sexe</p>
                                                    <p className="text-sm text-slate-800">
                                                        {form.details.genre_defunt}
                                                    </p>
                                                </div>
                                            )}
                                            {form.details.def_classe && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Classe</p>
                                                    <p className="text-sm text-slate-800">
                                                        {form.details.def_classe}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Si Autre membre : afficher le champ lien */}
                                {form.membre_id === "autre" && (
                                    <div className="mb-6">
                                        <Field label="Lien avec le défunt *">
                                            <select
                                                value={form.details.dec_lien}
                                                onChange={(e) => {
                                                    setDetail("dec_lien", e.target.value);
                                                    setDetail("lien_familial", e.target.value);
                                                }}
                                            >
                                                <option value="">Choisir</option>
                                                <option value="conjoint">
                                                    Epoux / Epouse
                                                </option>
                                                <option value="enfant">
                                                    Enfant
                                                </option>
                                                <option value="parent">
                                                    Parent
                                                </option>
                                                <option value="frere_soeur">
                                                    Frère / Sœur
                                                </option>
                                                <option value="autre">
                                                    Autre membre de la famille
                                                </option>
                                                <option value="ami">
                                                    Ami(e)
                                                </option>
                                                <option value="connaissance">
                                                    Connaissance
                                                </option>
                                            </select>
                                            {errors["details.dec_lien"] && (
                                                <Err>{errors["details.dec_lien"]}</Err>
                                            )}
                                        </Field>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom *">
                                        <input
                                            value={form.details.nom_defunt}
                                            onChange={(e) =>
                                                setDetail("nom_defunt", e.target.value)
                                            }
                                            readOnly={form.membre_id !== "autre"}
                                            className={form.membre_id !== "autre" ? "bg-slate-100" : ""}
                                        />
                                        {errors["details.nom_defunt"] && (
                                            <Err>{errors["details.nom_defunt"]}</Err>
                                        )}
                                    </Field>
                                    <Field label="Prenoms *">
                                        <input
                                            value={form.details.prenom_defunt}
                                            onChange={(e) =>
                                                setDetail("prenom_defunt", e.target.value)
                                            }
                                            readOnly={form.membre_id !== "autre"}
                                            className={form.membre_id !== "autre" ? "bg-slate-100" : ""}
                                        />
                                        {errors["details.prenom_defunt"] && (
                                            <Err>
                                                {errors["details.prenom_defunt"]}
                                            </Err>
                                        )}
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Date de deces *">
                                        <input
                                            type="date"
                                            max={today}
                                            value={form.details.date_deces}
                                            onChange={(e) =>
                                                setDetail("date_deces", e.target.value)
                                            }
                                        />
                                        {errors["details.date_deces"] && (
                                            <Err>{errors["details.date_deces"]}</Err>
                                        )}
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Lieu du deces">
                                        <input
                                            value={form.details.lieu_deces}
                                            onChange={(e) =>
                                                setDetail("lieu_deces", e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>

                                {/* AFFICHER SEULEMENT POUR "AUTRE MEMBRE" */}
                                {form.membre_id === "autre" && (
                                    <>
                                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                                            <p className="text-xs text-amber-800">
                                                ℹ️ Complétez les informations de la personne décédée
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Field label="Sexe">
                                                <select
                                                    value={form.details.genre_defunt}
                                                    onChange={(e) =>
                                                        setDetail("genre_defunt", e.target.value)
                                                    }
                                                >
                                                    <option value="">Choisir</option>
                                                    <option value="Masculin">Masculin</option>
                                                    <option value="Feminin">Feminin</option>
                                                </select>
                                            </Field>
                                            <Field label="Classe d'appartenance">
                                                <select
                                                    value={form.details.def_classe}
                                                    onChange={(e) =>
                                                        setDetail("def_classe", e.target.value)
                                                    }
                                                >
                                                    <option value="">Choisir</option>
                                                    {classes.map((c) => (
                                                        <option key={c.id} value={c.nom}>
                                                            {c.nom}
                                                        </option>
                                                    ))}
                                                    <option value="aucune classe">
                                                        Aucune classe
                                                    </option>
                                                </select>
                                            </Field>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Field label="Etait membre de l'eglise ?">
                                                <select
                                                    value={form.details.def_membre}
                                                    onChange={(e) =>
                                                        setDetail("def_membre", e.target.value)
                                                    }
                                                >
                                                    <option value="">Choisir</option>
                                                    <option value="membre_actif">
                                                        Oui, membre actif
                                                    </option>
                                                    <option value="membre_longue_date">
                                                        Oui, membre de longue date
                                                    </option>
                                                    <option value="ami">
                                                        Ami(e) de l'eglise
                                                    </option>
                                                    <option value="non_membre">Non membre</option>
                                                </select>
                                            </Field>
                                            <Field label="A recu le bapteme ?">
                                                <select
                                                    value={form.details.def_baptise}
                                                    onChange={(e) =>
                                                        setDetail("def_baptise", e.target.value)
                                                    }
                                                >
                                                    <option value="">Choisir</option>
                                                    <option value="Oui cette eglise">
                                                        Oui - dans cette eglise
                                                    </option>
                                                    <option value="Oui autre eglise">
                                                        Oui - autre eglise
                                                    </option>
                                                    <option value="Non">Non</option>
                                                    <option value="Inconnu">Inconnu</option>
                                                </select>
                                            </Field>
                                        </div>

                                        <Field label="Lien familial">
                                            <select
                                                value={form.details.lien_familial}
                                                onChange={(e) =>
                                                    setDetail("lien_familial", e.target.value)
                                                }
                                            >
                                                <option value="">Choisir</option>
                                                <option value="conjoint">Conjoint(e)</option>
                                                <option value="parent">Parent</option>
                                                <option value="enfant">Enfant</option>
                                                <option value="frere_soeur">
                                                    Frere / Soeur
                                                </option>
                                                <option value="autre">Autre</option>
                                            </select>
                                            {errors["details.lien_familial"] && (
                                                <Err>{errors["details.lien_familial"]}</Err>
                                            )}
                                        </Field>
                                    </>
                                )}

                                <Field label="Disposez-vous d'un programme d'enterrement ?">
                                    <select
                                        value={form.details.programme_obseques}
                                        onChange={(e) =>
                                            setDetail(
                                                "programme_obseques",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Choisir</option>
                                        <option value="oui">Oui</option>
                                        <option value="non">Non</option>
                                    </select>
                                </Field>
                                {form.details.programme_obseques === "oui" && (
                                    <Field label="Joindre le programme (PDF)">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    programme_piece:
                                                        (e.target.files || [])[0] ||
                                                        null,
                                                }))
                                            }
                                        />
                                        {form.programme_piece && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {form.programme_piece.name}
                                            </p>
                                        )}
                                    </Field>
                                )}
                                <FooterButtons onNext={next} />
                            </section>
                        )}

                        {!success && step === 2 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Recapitulatif de la declaration
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Verifiez attentivement avant de soumettre.
                                </p>
                                <RecapCard title="Declaration de Deces">
                                    <RecapRow k="Lien" v={recap.lien} />
                                </RecapCard>
                                <RecapCard title="Defunt / Defunte">
                                    <RecapRow k="Identite" v={recap.defunt} />
                                    <RecapRow
                                        k="Date de deces"
                                        v={recap.ddec}
                                    />
                                    <RecapRow
                                        k="Lieu du deces"
                                        v={recap.lieu}
                                    />
                                    <RecapRow
                                        k="Membre de l'eglise"
                                        v={recap.membre}
                                    />
                                </RecapCard>
                                <RecapCard title="Obseques">
                                    <RecapRow
                                        k="Statut"
                                        v="SOUMISE"
                                    />
                                </RecapCard>
                                {errors.submit && <Err>{errors.submit}</Err>}
                                <div className="flex justify-between gap-3 mt-8 pt-5 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={prev}
                                        className="btn-ghost"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn-main"
                                    >
                                        {processing
                                            ? "Soumission..."
                                            : "Soumettre la declaration"}
                                    </button>
                                </div>
                            </section>
                        )}

                        {success && (
                            <section className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Declaration soumise
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    La declaration de deces a ete transmise a
                                    votre conducteur. L'eglise reste a vos
                                    cotes.
                                </p>
                                <p className="text-sm italic text-slate-500 mt-4">
                                    "L'Eternel est proche de ceux qui ont le
                                    coeur brise." - Psaume 34.19
                                </p>
                                {successMsg && (
                                    <p className="text-sm text-slate-700 mt-3">
                                        {successMsg}
                                    </p>
                                )}
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="btn-main"
                                    >
                                        Nouvelle declaration
                                    </button>
                                </div>
                            </section>
                        )}
                    </form>
                </div>
            </div>

            <style>{`
                input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 2px; padding: 10px 12px; background: #fff; color: #0f172a; outline: none; transition: all .2s; font-size: 13px; }
                input:focus, select:focus, textarea:focus { border-color: #475569; box-shadow: 0 0 0 3px rgba(71,85,105,.12); }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main{ border: 1px solid #475569; background: #475569; color: #fff; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
                .btn-ghost{ border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
            `}</style>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider uppercase font-bold text-slate-500">
                {label}
            </label>
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
            {onPrev ? (
                <button type="button" onClick={onPrev} className="btn-ghost">
                    Retour
                </button>
            ) : (
                <span />
            )}
            <button type="button" onClick={onNext} className="btn-main">
                Suivant
            </button>
        </div>
    );
}

function RecapCard({ title, children }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 mb-3">
            <h3 className="text-base font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">
                {title}
            </h3>
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
