import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";

export default function NaissanceForm({
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

    const [form, setForm] = useState({
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        details: {
            lien_enfant: "",
            nom_enfant: "",
            date_naissance: "",
            lieu_naissance: "",
            sexe_enfant: "",
            parents: "",
            date_presentation: "",
            lieu_ceremonie: "",
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentClasse = classes.find(
        (c) => String(c.id) === String(form.classe_id),
    );
    const selectedMember = useMemo(
        () =>
            familyMembers.find(
                (m) => String(m.id) === String(form.membre_id || defaultMemberId),
            ),
        [familyMembers, form.membre_id, defaultMemberId],
    );

    const recap = useMemo(
        () => ({
            membre:
                selectedMember
                    ? `${selectedMember.prenom || ""} ${
                          selectedMember.nom || ""
                      }`.trim()
                    : "-",
            lien: form.details.lien_enfant || "-",
            enfant: form.details.nom_enfant || "-",
            dnais: form.details.date_naissance || "-",
            lnais: form.details.lieu_naissance || "-",
            parents: form.details.parents || "-",
            datePres: form.details.date_presentation || "-",
            lieuCer: form.details.lieu_ceremonie || "-",
            classe: currentClasse?.nom || "-",
        }),
        [form.details, currentClasse?.nom, selectedMember],
    );

    const setDetail = (key, value) =>
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));
    const onlyLetters = (value) =>
        value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, "");
    const next = () => {
        if (step === 1) {
            const nextErrors = {};
            if (!form.details.lien_enfant)
                nextErrors["details.lien_enfant"] = "Champ requis.";
            if (!form.details.nom_enfant)
                nextErrors["details.nom_enfant"] = "Champ requis.";
            if (!form.details.date_naissance)
                nextErrors["details.date_naissance"] = "Champ requis.";
            if (!form.details.parents)
                nextErrors["details.parents"] = "Champ requis.";
            if (Object.keys(nextErrors).length)
                return setErrors((prev) => ({ ...prev, ...nextErrors }));
        }
        setStep((s) => Math.min(3, s + 1));
    };

    const prev = () => setStep((s) => Math.max(1, s - 1));

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", "naissance");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.details.date_presentation || "");
        payload.append("details[nom_enfant]", form.details.nom_enfant || "");
        payload.append(
            "details[date_naissance]",
            form.details.date_naissance || "",
        );
        payload.append("details[parents]", form.details.parents || "");
        payload.append(
            "details[lieu_naissance]",
            form.details.lieu_naissance || "",
        );
        payload.append("details[sexe_enfant]", form.details.sexe_enfant || "");
        payload.append("details[lien_enfant]", form.details.lien_enfant || "");
        payload.append(
            "details[date_presentation]",
            form.details.date_presentation || "",
        );
        payload.append(
            "details[lieu_ceremonie]",
            form.details.lieu_ceremonie || "",
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
            const msg =
                res.data?.message || "Declaration de naissance soumise.";
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
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-emerald-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Declaration de{" "}
                        <em className="font-medium">Naissance</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">
                        Eglise Methodiste du Jubile de Cocody
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    {!success && (
                        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                            {["Enfant", "Ceremonie", "Confirmation"].map(
                                (label, idx) => {
                                    const sn = idx + 1;
                                    const active = step === sn;
                                    const done = step > sn;
                                    return (
                                        <div
                                            key={label}
                                            className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                                active
                                                    ? "text-emerald-700 border-emerald-600"
                                                    : done
                                                      ? "text-blue-700 border-blue-600"
                                                      : "text-slate-400 border-transparent"
                                            }`}
                                        >
                                            {label}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}

                    <form onSubmit={submit} className="p-6 md:p-10">
                        {!success && step === 1 && (
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-slate-800">
                                        Informations du membre concerné
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Les informations du déclarant sont déjà
                                        enregistrées en base. Vous pouvez
                                        préciser ici le lien et le membre
                                        concerné par la déclaration.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <Field label="Lien avec l'enfant *">
                                        <select
                                            value={form.details.lien_enfant}
                                            onChange={(e) =>
                                                setDetail(
                                                    "lien_enfant",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="Pere">Pere</option>
                                            <option value="Mere">Mere</option>
                                            <option value="Tuteur legal">
                                                Tuteur legal
                                            </option>
                                            <option value="Membre famille">
                                                Membre famille
                                            </option>
                                        </select>
                                        {errors["details.lien_enfant"] && (
                                            <Err>
                                                {
                                                    errors[
                                                        "details.lien_enfant"
                                                    ]
                                                }
                                            </Err>
                                        )}
                                    </Field>
                                    <Field label="Membre concerne">
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
                                                <option
                                                    key={m.id}
                                                    value={m.id}
                                                >
                                                    {m.prenom} {m.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                <div className="mt-8 pb-4 border-b border-slate-200 mb-6">
                                    <h3 className="text-2xl font-semibold text-slate-800 mb-1">
                                        Informations de l'enfant
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Renseignez les informations de
                                        naissance.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom complet de l'enfant *">
                                        <input
                                            value={form.details.nom_enfant}
                                            onChange={(e) =>
                                                setDetail(
                                                    "nom_enfant",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors["details.nom_enfant"] && (
                                            <Err>
                                                {errors["details.nom_enfant"]}
                                            </Err>
                                        )}
                                    </Field>
                                    <Field label="Date de naissance *">
                                        <input
                                            type="date"
                                            value={form.details.date_naissance}
                                            onChange={(e) =>
                                                setDetail(
                                                    "date_naissance",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors["details.date_naissance"] && (
                                            <Err>
                                                {
                                                    errors[
                                                        "details.date_naissance"
                                                    ]
                                                }
                                            </Err>
                                        )}
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Lieu de naissance">
                                        <input
                                            value={form.details.lieu_naissance}
                                            onChange={(e) =>
                                                setDetail(
                                                    "lieu_naissance",
                                                    onlyLetters(e.target.value),
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Sexe">
                                        <select
                                            value={form.details.sexe_enfant}
                                            onChange={(e) =>
                                                setDetail(
                                                    "sexe_enfant",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="Masculin">
                                                Masculin
                                            </option>
                                            <option value="Feminin">
                                                Feminin
                                            </option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Parents *">
                                    <input
                                        value={form.details.parents}
                                        onChange={(e) =>
                                            setDetail("parents", e.target.value)
                                        }
                                    />
                                    {errors["details.parents"] && (
                                        <Err>{errors["details.parents"]}</Err>
                                    )}
                                </Field>
                                <FooterButtons onNext={next} />
                            </section>
                        )}

                        {!success && step === 2 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Ceremonie de presentation
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Date et lieu souhaites pour la presentation.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Date souhaitee">
                                        <input
                                            type="date"
                                            value={
                                                form.details.date_presentation
                                            }
                                            onChange={(e) =>
                                                setDetail(
                                                    "date_presentation",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Lieu de ceremonie">
                                        <input
                                            value={form.details.lieu_ceremonie}
                                            onChange={(e) =>
                                                setDetail(
                                                    "lieu_ceremonie",
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
                                <Field label="Pieces jointes">
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

                        {!success && step === 3 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Recapitulatif de la declaration
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Verifiez attentivement avant de soumettre.
                                </p>
                                <RecapCard title="Declaration de Naissance">
                                    <RecapRow
                                        k="Membre concerné"
                                        v={recap.membre}
                                    />
                                    <RecapRow k="Lien" v={recap.lien} />
                                    <RecapRow k="Classe" v={recap.classe} />
                                </RecapCard>
                                <RecapCard title="Enfant">
                                    <RecapRow k="Nom" v={recap.enfant} />
                                    <RecapRow
                                        k="Date de naissance"
                                        v={recap.dnais}
                                    />
                                    <RecapRow
                                        k="Lieu de naissance"
                                        v={recap.lnais}
                                    />
                                    <RecapRow k="Parents" v={recap.parents} />
                                </RecapCard>
                                <RecapCard title="Ceremonie">
                                    <RecapRow
                                        k="Date souhaitee"
                                        v={recap.datePres}
                                    />
                                    <RecapRow k="Lieu" v={recap.lieuCer} />
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
                                            : "Soumettre la declaration"}
                                    </button>
                                </div>
                            </section>
                        )}

                        {success && (
                            <section className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Declaration soumise
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Votre declaration de naissance a ete
                                    transmise a votre conducteur.
                                </p>
                                {successMsg && (
                                    <p className="text-sm text-emerald-700 mt-3">
                                        {successMsg}
                                    </p>
                                )}
                            </section>
                        )}
                    </form>
                </div>
            </div>

            <style>{`
                input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 2px; padding: 10px 12px; background: #fff; color: #0f172a; outline: none; transition: all .2s; font-size: 13px; }
                input:focus, select:focus, textarea:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,.12); }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main{ border: 1px solid #059669; background: #059669; color: #fff; border-radius: 2px; padding: 10px 18px; font-size: 13px; font-weight: 700; }
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
