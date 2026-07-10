import React, { useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";
import { sanitizeUppercasePrenom } from "../../../Helpers/nameSanitizers";
import { withBasePath } from "../../../Utils/urlHelper";

export default function MariageForm({
    backHref: backHrefProp,
    submitUrl: submitUrlProp,
    familyMembers = [],
    classes = [],
    canSelectMember = false,
}) {
    const backHref = withBasePath("", backHrefProp);
    const submitUrl = withBasePath("", submitUrlProp);
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
            epoux_date_naissance: "",
            epoux_nat: "",
            epoux_prof: "",
            epoux_contact: "",
            epoux_membre: "",
            epoux_eglise: "",
            epoux_baptise: "",
            epoux_bapteme_lieu: "",
            epoux_bapteme_date: "",
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentMember = familyMembers.find(
        (m) => String(m.id) === String(form.membre_id),
    );
    const isMemberFemale = currentMember?.genre === "F";
    const partnerTitle = isMemberFemale
        ? "Informations du fiancé"
        : "Informations du conjoint";
    const partnerDescription = isMemberFemale
        ? "Completez les informations du fiancé et sélectionnez le membre concerné"
        : "Completez les informations du conjoint et sélectionnez le membre concerné";

    const setDetail = (key, value) =>
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));

    const submit = async (event) => {
        event.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", "mariage");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("details[epoux_nom]", form.details.epoux_nom || "");
        payload.append(
            "details[epoux_prenom]",
            form.details.epoux_prenom || "",
        );
        payload.append(
            "details[epoux_date_naissance]",
            form.details.epoux_date_naissance || "",
        );
        payload.append("details[epoux_nat]", form.details.epoux_nat || "");
        payload.append("details[epoux_prof]", form.details.epoux_prof || "");
        payload.append(
            "details[epoux_contact]",
            form.details.epoux_contact || "",
        );
        payload.append(
            "details[epoux_membre]",
            form.details.epoux_membre || "",
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
        payload.append(
            "details[epoux_eglise]",
            form.details.epoux_eglise || "",
        );
        payload.append(
            "details[observations]",
            form.details.observations || "",
        );
        form.pieces_jointes.forEach((file) =>
            payload.append("pieces_jointes[]", file),
        );

        try {
            const res = await axios.post(submitUrl, payload);
            const msg = res.data?.message || "Inscription de mariage soumise.";
            setSuccessMsg(msg);
            setSuccess(true);
            showSuccess(msg);
        } catch (error) {
            const data = error?.response?.data || {};
            handleApiError(data);
            const serverErrors = data.errors || {};
            const flat = {};
            Object.keys(serverErrors).forEach((key) => {
                flat[key] = serverErrors[key][0];
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
        setErrors({});
        setSuccessMsg("");
        setForm({
            membre_id: defaultMemberId,
            classe_id: defaultClasseId,
            details: {
                epoux_nom: "",
                epoux_prenom: "",
                epoux_date_naissance: "",
                epoux_nat: "",
                epoux_prof: "",
                epoux_contact: "",
                epoux_membre: "",
                epoux_eglise: "",
                epoux_baptise: "",
                epoux_bapteme_lieu: "",
                epoux_bapteme_date: "",
                observations: "",
            },
            pieces_jointes: [],
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
                    <ArrowLeft size={16} /> Retour
                </Link>

                <div className="text-center mt-6 mb-6">
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-rose-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Inscription de <em className="font-medium">Mariage</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">
                        Eglise Methodiste du Jubile de Cocody
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    <div className="h-[4px] bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500" />
                    <form onSubmit={submit} className="p-6 md:p-10">
                        {!success ? (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    {partnerTitle}
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    {partnerDescription}
                                </p>

                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    <Field label="Membre concerné *">
                                        <select
                                            value={form.membre_id}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                }))
                                            } 
                                        >
                                        <option value="">-- Sélectionner un membre --</option> 
                                            {familyMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom} {m.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.membre_id && (
                                            <Err>{errors.membre_id}</Err>
                                        )}
                                    </Field>
                                </div>

                                {/* Si membre inscrit : afficher les infos juste en dessous du select */}
                                {form.membre_id && currentMember && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
                                        <p className="text-sm text-blue-800 font-medium mb-2">
                                            ✓ Informations du membre préremplies automatiquement
                                        </p>
                                        <p className="text-xs text-blue-700 mb-3">
                                            Les informations ci-dessous proviennent du profil du membre.
                                        </p>
                                        <div className="bg-white border border-blue-200 rounded-sm p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase">Prénom</p>
                                                <p className="text-sm text-slate-800">{currentMember.prenom}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase">Nom</p>
                                                <p className="text-sm text-slate-800">{currentMember.nom}</p>
                                            </div>
                                            {currentMember.genre && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Sexe</p>
                                                    <p className="text-sm text-slate-800">{currentMember.genre}</p>
                                                </div>
                                            )}
                                            {currentMember.classe?.nom && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Classe</p>
                                                    <p className="text-sm text-slate-800">{currentMember.classe.nom}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <span className="text-xs italic text-slate-500">
                                        Identité du conjoint
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
                                                    sanitizeUppercasePrenom(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                        />
                                        {errors.epoux_prenom && (
                                            <Err>{errors.epoux_prenom}</Err>
                                        )}
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                                    <Field label="Date de naissance">
                                        <input
                                            type="date"
                                            value={
                                                form.details
                                                    .epoux_date_naissance
                                            }
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_date_naissance",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.epoux_date_naissance && (
                                            <Err>
                                                {errors.epoux_date_naissance}
                                            </Err>
                                        )}
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
                                            const clean = e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 10);
                                            setDetail("epoux_contact", clean);
                                        }}
                                        maxLength="10"
                                    />
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Field label="Membre de cette eglise ?">
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
                                                Oui, catechumene
                                            </option>
                                            <option value="non">Non</option>
                                        </select>
                                    </Field>
                                    <Field label="A ete baptise ?">
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
                                    <Field label="Eglise du conjoint">
                                        <input
                                            value={form.details.epoux_eglise}
                                            onChange={(e) =>
                                                setDetail(
                                                    "epoux_eglise",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nom de l'eglise ou de la communaute"
                                        />
                                    </Field>
                                )}
                                {form.details.epoux_baptise === "oui" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <Field label="Eglise de bapteme *">
                                            <input
                                                value={
                                                    form.details
                                                        .epoux_bapteme_lieu
                                                }
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
                                        <Field label="Date du bapteme *">
                                            <input
                                                type="date"
                                                value={
                                                    form.details
                                                        .epoux_bapteme_date
                                                }
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

                                <Field label="Observations" className="mt-6">
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

                                {errors.submit && <Err>{errors.submit}</Err>}

                                <div className="flex justify-end mt-8 pt-5 border-t border-slate-200">
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
                        ) : (
                            <section className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Inscription soumise avec succes
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Votre inscription de mariage a ete transmise
                                    a votre conducteur.
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
                                        Nouvelle inscription
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

function Field({ label, children, className }) {
    return (
        <div className={`space-y-1.5 ${className || ""}`}>
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
