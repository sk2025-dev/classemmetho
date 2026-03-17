import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";

export default function MariageForm({
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
        handleApiError,
    } = useToastWithErrorHandling();

    const defaultMemberId = familyMembers[0]?.id || "";
    const defaultClasseId = familyMembers[0]?.classe_id || "";

    const [form, setForm] = useState({
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        details: {
            epoux_nom: "",
            epoux_prenom: "",
            epoux_nat: "",
            epoux_prof: "",
            epoux_contact: "",
            epoux_membre: "",
            epoux_eglise: "",
            epoux_baptise: "",
            epoux_bapteme_lieu: "",
            epoux_bapteme_date: "",
            type_mariage: "",
            date: "",
            heure: "",
            lieu: "Église Méthodiste du Jubilé de Cocody",
            temoin_epoux: "",
            temoin_epouse: "",
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentClasse = classes.find(
        (c) => String(c.id) === String(form.classe_id),
    );
    const currentMember = familyMembers.find(
        (m) => String(m.id) === String(form.membre_id),
    );
    const isMemberFemale = currentMember?.genre === "F";
    const partnerTitle = isMemberFemale
        ? "Informations du fiancé"
        : "Informations de la fiancée";
    const partnerDescription = isMemberFemale
        ? "Renseignez les informations du fiancé et sélectionnez le membre concerné."
        : "Renseignez les informations de la future mariée et sélectionnez le membre concerné.";
    const memberRoleLabel = isMemberFemale ? "future mariée" : "futur marié";

    const recap = useMemo(
        () => {
            const partnerName = `${form.details.epoux_prenom || ""} ${form.details.epoux_nom || ""}`.trim() || "-";
            const memberName = currentMember
                ? `${currentMember.prenom || ""} ${currentMember.nom || ""}`.trim()
                : "-";
            return {
                membre: memberName || "-",
                classe: currentClasse?.nom || "-",
                partenaire: partnerName,
                type: form.details.type_mariage || "-",
                date: form.details.date || "-",
                lieu: form.details.lieu || "-",
            };
        },
        [form.details, currentClasse?.nom, currentMember],
    );

    const setDetail = (key, value) =>
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));

    /* ── Validation par étape ── */
    const next = () => {
        // Étape 1 : Époux
        if (step === 1) {
            const nextErrors = {};
            if (!form.details.epoux_nom) nextErrors.epoux_nom = "Champ requis.";
            if (!form.details.epoux_prenom)
                nextErrors.epoux_prenom = "Champ requis.";
            if (form.details.epoux_baptise === "oui") {
                if (!form.details.epoux_bapteme_lieu)
                    nextErrors.epoux_bapteme_lieu = "Champ requis.";
                if (!form.details.epoux_bapteme_date)
                    nextErrors.epoux_bapteme_date = "Champ requis.";
            }
            if (Object.keys(nextErrors).length)
                return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        // Étape 3 : Cérémonie
        if (step === 2) {
            const nextErrors = {};
            if (!form.details.type_mariage)
                nextErrors["details.type_mariage"] = "Champ requis.";
            if (!form.details.date)
                nextErrors["details.date"] = "Champ requis.";
            if (!form.details.lieu)
                nextErrors["details.lieu"] = "Champ requis.";
            if (Object.keys(nextErrors).length)
                return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        setErrors({});
        setStep((s) => Math.min(3, s + 1));
    };

    const prev = () => setStep((s) => Math.max(1, s - 1));

    /* ── Soumission ── */
    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", "mariage");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.details.date || "");
        const partnerFullName = `${form.details.epoux_prenom || ""} ${form.details.epoux_nom || ""}`.trim();
        const memberFullName = currentMember
            ? `${currentMember.prenom || ""} ${currentMember.nom || ""}`.trim()
            : "";
        payload.append("details[conjoint_1]", partnerFullName);
        payload.append(
            "details[conjoint_2]",
            memberFullName || partnerFullName,
        );
        payload.append("details[epoux_prenom]", form.details.epoux_prenom || "");
        payload.append("details[epoux_nom]", form.details.epoux_nom || "");
        payload.append("details[date]", form.details.date || "");
        payload.append("details[lieu]", form.details.lieu || "");
        payload.append(
            "details[type_mariage]",
            form.details.type_mariage || "",
        );
        payload.append(
            "details[epoux_contact]",
            form.details.epoux_contact || "",
        );
        payload.append(
            "details[epoux_eglise]",
            form.details.epoux_eglise || "",
        );
        payload.append(
            "details[epoux_baptise]",
            form.details.epoux_baptise || "",
        );
        payload.append(
            "details[epoux_bapteme_lieu]",
            form.details.epoux_bapteme_lieu || "",
        );
        payload.append(
            "details[epoux_bapteme_date]",
            form.details.epoux_bapteme_date || "",
        );
        payload.append("details[heure]", form.details.heure || "");
        payload.append(
            "details[temoins]",
            [form.details.temoin_epoux, form.details.temoin_epouse]
                .filter(Boolean)
                .join(" / "),
        );
        payload.append(
            "details[observations]",
            form.details.observations || "",
        );
        form.pieces_jointes.forEach((file) =>
            payload.append("pieces_jointes[]", file),
        );

        try {
            const res = await axios.post(submitUrl, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const msg = res.data?.message || "Demande de mariage soumise.";
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
            if (!Object.keys(flat).length && data.message)
                flat.submit = data.message;
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
                epoux_nom: "",
                epoux_prenom: "",
                epoux_nat: "",
                epoux_prof: "",
                epoux_contact: "",
                epoux_membre: "",
                epoux_eglise: "",
                epoux_baptise: "",
                epoux_bapteme_lieu: "",
                epoux_bapteme_date: "",
                type_mariage: "",
                date: "",
                heure: "",
                lieu: "Église Méthodiste du Jubilé de Cocody",
                temoin_epoux: "",
                temoin_epouse: "",
                observations: "",
            },
            pieces_jointes: [],
        });
    };

    /* ══════════════════════════════════════════ RENDER ══════════════════════════════════════════ */
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
                    <ArrowLeft size={16} /> Retour
                </Link>

                <div className="text-center mt-6 mb-6">
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-rose-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Demande de <em className="font-medium">Mariage</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">
                        Eglise Methodiste du Jubile de Cocody
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    {!success && (
                        <>
                            <div className="h-[4px] bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500" />
                            {/* 4 étapes au lieu de 5 */}
                            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                                {["Partenaire", "Cérémonie", "Confirmation"].map(
                                    (label, idx) => {
                                        const sn = idx + 1;
                                        const active = step === sn;
                                        const done = step > sn;
                                        return (
                                            <div
                                                key={label}
                                                className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                                    active
                                                        ? "text-rose-600 border-rose-500"
                                                        : done
                                                            ? "text-amber-600 border-amber-500"
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
                        {/* ══ ÉTAPE 1 : ÉPOUX ══ */}
                        {!success && step === 1 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    {partnerTitle}
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    {partnerDescription}
                                </p>

                                {/* Membre concerné + Classe (déplacés ici) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <Field label="Membre concerné">
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
                                        </select>
                                    </Field>
                                    <Field label="Classe">
                                        <select
                                            value={form.classe_id || ""}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    classe_id: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                Sélectionner
                                            </option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.classe_id && (
                                            <Err>{errors.classe_id}</Err>
                                        )}
                                    </Field>
                                </div>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <span className="text-xs italic text-slate-500">
                                        Identité du fiancé
                                    </span>
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom *">
                                        <input
                                            value={form.details.epoux_nom}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_nom",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.epoux_nom && (
                                            <Err>{errors.epoux_nom}</Err>
                                        )}
                                    </Field>
                                    <Field label="Prénoms *">
                                        <input
                                            value={form.details.epoux_prenom}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_prenom",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.epoux_prenom && (
                                            <Err>{errors.epoux_prenom}</Err>
                                        )}
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nationalité">
                                        <input
                                            value={form.details.epoux_nat}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_nat",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Profession">
                                        <input
                                            value={form.details.epoux_prof}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_prof",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>

                                <Field label="Contact (10 chiffres)">
                                    <input
                                        type="tel"
                                        placeholder="Ex: 0123456789"
                                        value={form.details.epoux_contact}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setDetail("epoux_contact", value);
                                        }}
                                        maxLength="10"
                                    />
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Field label="Membre de cette église ?">
                                        <select
                                            value={form.details.epoux_membre}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_membre",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="membre_actif">
                                                Oui, membre actif
                                            </option>
                                            <option value="catechumene">
                                                Oui, catéchumène
                                            </option>
                                            <option value="non">Non</option>
                                        </select>
                                    </Field>
                                    <Field label="A été baptisé ?">
                                        <select
                                            value={form.details.epoux_baptise}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_baptise",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="oui">Oui</option>
                                            <option value="non">Non</option>
                                        </select>
                                    </Field>
                                </div>
                                {form.details.epoux_membre === "non" && (
                                    <Field label="Église du fiancé(e)" className="mt-4">
                                        <input
                                            value={form.details.epoux_eglise}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_eglise",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nom de l'église ou de la communauté religieuse"
                                        />
                                    </Field>
                                )}
                                {form.details.epoux_baptise === "oui" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <Field label="Église de baptême *">
                                            <input
                                                value={form.details.epoux_bapteme_lieu}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "epoux_bapteme_lieu",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.epoux_bapteme_lieu && (
                                                <Err>
                                                    {errors.epoux_bapteme_lieu}
                                                </Err>
                                            )}
                                        </Field>
                                        <Field label="Date du baptême *">
                                            <input
                                                type="date"
                                                value={form.details.epoux_bapteme_date}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "epoux_bapteme_date",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.epoux_bapteme_date && (
                                                <Err>
                                                    {errors.epoux_bapteme_date}
                                                </Err>
                                            )}
                                        </Field>
                                    </div>
                                )}

                                <FooterButtons onNext={next} />
                            </section>
                        )}

                        {/* ══ ÉTAPE 2 : CÉRÉMONIE ══ */}
                        {!success && step === 2 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Détails de la cérémonie
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Date, type et informations pour la
                                    célébration.
                                </p>

                                <Field label="Type de mariage *">
                                    <div className="grid grid-cols-3 gap-2">
                                        <RadioTile
                                            name="type_mariage"
                                            value="religieux"
                                            label="Religieux"
                                            icon="⛪"
                                            checked={
                                                form.details.type_mariage ===
                                                "religieux"
                                            }
                                            onChange={(v) =>
                                                setDetail("type_mariage", v)
                                            }
                                        />
                                        <RadioTile
                                            name="type_mariage"
                                            value="civil"
                                            label="Civil seul"
                                            icon="📜"
                                            checked={
                                                form.details.type_mariage ===
                                                "civil"
                                            }
                                            onChange={(v) =>
                                                setDetail("type_mariage", v)
                                            }
                                        />
                                        <RadioTile
                                            name="type_mariage"
                                            value="les_deux"
                                            label="Les deux"
                                            icon="💍"
                                            checked={
                                                form.details.type_mariage ===
                                                "les_deux"
                                            }
                                            onChange={(v) =>
                                                setDetail("type_mariage", v)
                                            }
                                        />
                                    </div>
                                    {errors["details.type_mariage"] && (
                                        <Err>
                                            {errors["details.type_mariage"]}
                                        </Err>
                                    )}
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                                    <Field label="Date souhaitée *">
                                        <input
                                            type="date"
                                            value={form.details.date}
                                            onChange={(e) =>
                                                setDetail(
                                                    "date",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors["details.date"] && (
                                            <Err>{errors["details.date"]}</Err>
                                        )}
                                    </Field>
                                    <Field label="Heure">
                                        <input
                                            type="time"
                                            value={form.details.heure}
                                            onChange={(e) =>
                                                setDetail(
                                                    "heure",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 mb-4">
                                    <Field label="Lieu *">
                                        <input value={form.details.lieu} readOnly />
                                        {errors["details.lieu"] && (
                                            <Err>{errors["details.lieu"]}</Err>
                                        )}
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Témoin époux">
                                        <input
                                            value={form.details.temoin_epoux}
                                            onChange={(e) =>
                                                setDetail(
                                                    "temoin_epoux",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Témoin épouse">
                                        <input
                                            value={form.details.temoin_epouse}
                                            onChange={(e) =>
                                                setDetail(
                                                    "temoin_epouse",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>

                                <Field label="Observations">
                                    <textarea
                                        value={form.details.observations}
                                        onChange={(e) =>
                                            setDetail(
                                                "observations",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>

                                <Field label="Pièces jointes">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                pieces_jointes: Array.from(
                                                    e.target.files || [],
                                                ),
                                            }))
                                        }
                                    />
                                </Field>

                                <FooterButtons onPrev={prev} onNext={next} />
                            </section>
                        )}

                        {/* ══ ÉTAPE 3 : CONFIRMATION ══ */}
                        {!success && step === 3 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Récapitulatif de la demande
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Vérifiez avant de soumettre.
                                </p>

                                <RecapCard title="Demande de mariage">
                                    <RecapRow
                                        k={`Membre concerné (${memberRoleLabel})`}
                                        v={recap.membre}
                                    />
                                    <RecapRow k="Classe" v={recap.classe} />
                                </RecapCard>

                                <RecapCard title="Partenaire">
                                    <RecapRow
                                        k="Partenaire"
                                        v={recap.partenaire}
                                    />
                                    <RecapRow
                                        k="Membre concerné"
                                        v={recap.membre}
                                    />
                                </RecapCard>

                                <RecapCard title="Cérémonie">
                                    <RecapRow k="Type" v={recap.type} />
                                    <RecapRow
                                        k="Date souhaitée"
                                        v={recap.date}
                                    />
                                    <RecapRow k="Lieu" v={recap.lieu} />
                                    {form.details.temoin_epoux && (
                                        <RecapRow
                                            k="Témoin époux"
                                            v={form.details.temoin_epoux}
                                        />
                                    )}
                                    {form.details.temoin_epouse && (
                                        <RecapRow
                                            k="Témoin épouse"
                                            v={form.details.temoin_epouse}
                                        />
                                    )}
                                    <RecapRow k="Statut" v="SOUMISE" />
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
                                            : "Soumettre la demande"}
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* ══ SUCCÈS ══ */}
                        {success && (
                            <section className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Demande soumise avec succès
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Votre demande de mariage a été transmise à
                                    votre conducteur.
                                </p>
                                {successMsg && (
                                    <p className="text-sm text-rose-700 mt-3">
                                        {successMsg}
                                    </p>
                                )}
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="btn-main"
                                    >
                                        Nouvelle demande
                                    </button>
                                </div>
                            </section>
                        )}
                    </form>
                </div>
            </div>

            <style>{`
                input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 2px; padding: 10px 12px; background: #fff; color: #0f172a; outline: none; transition: all .2s; font-size: 13px; }
                input:focus, select:focus, textarea:focus { border-color: #e11d48; box-shadow: 0 0 0 3px rgba(225,29,72,.12); }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main { border: 1px solid #e11d48; background: #e11d48; color: #fff; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
                .btn-ghost { border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
            `}</style>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

/* ── Sub-components ── */
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
function RadioTile({ name, value, label, icon, checked, onChange }) {
    return (
        <label
            className={`border rounded-sm px-2 py-3 text-center cursor-pointer ${checked ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600"}`}
        >
            <input
                type="radio"
                name={name}
                className="hidden"
                checked={checked}
                onChange={() => onChange(value)}
            />
            <div className="text-lg">{icon}</div>
            <div className="text-xs font-semibold mt-1">{label}</div>
        </label>
    );
}
