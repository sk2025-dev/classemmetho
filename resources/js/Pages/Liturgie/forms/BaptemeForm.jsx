import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";

export default function BaptemeForm({
    backHref,
    submitUrl,
    familyMembers = [],
    canSelectMember = false,
}) {
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
        date_souhaitee: "",
        details: {
            personne: "",
            date_naissance: "",
            deja_baptise: "",
            bapteme_eglise: "",
            bapteme_date: "",
            want_communion: "",
            can_baptise: "",
            can_date_bap: "",
            can_anciennete: "",
            decl1: false,
            parrain: "",
            marraine: "",
            observations: "",
        },
        pieces_jointes: [],
    });

    const currentMember = familyMembers.find(
        (m) => String(m.id) === String(form.membre_id),
    );

    const setDetail = (key, value) =>
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));

    const applyMemberDefaults = (member) => {
        if (!member) return;
        const fullName = `${member.prenom || ""} ${member.nom || ""}`.trim();
        const dateNaissance = member.date_naissance
            ? String(member.date_naissance).split("T")[0]
            : "";
        setForm((prev) => ({
            ...prev,
            membre_id: String(member.id ?? prev.membre_id),
            classe_id: member.classe_id || prev.classe_id,
            details: {
                ...prev.details,
                personne: fullName || prev.details.personne,
                date_naissance: dateNaissance || prev.details.date_naissance,
            },
        }));
    };

    useEffect(() => {
        if (!form.membre_id) return;
        const member = familyMembers.find(
            (m) => String(m.id) === String(form.membre_id),
        );
        if (!member) return;
        const hasInfo = form.details.personne || form.details.date_naissance;
        if (hasInfo) return;
        applyMemberDefaults(member);
    }, [form.membre_id, familyMembers]);

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        if (form.details.want_communion === "Oui") {
            const validationErrors = {};
            if (!form.details.can_baptise) {
                validationErrors["details.can_baptise"] = "Champ requis.";
            }
            if (!form.details.decl1) {
                validationErrors["details.declarations"] =
                    "Veuillez confirmer.";
            }
            if (Object.keys(validationErrors).length) {
                setErrors((prev) => ({ ...prev, ...validationErrors }));
                setProcessing(false);
                return;
            }
        }

        const payload = new FormData();
        payload.append("type_acte", "bapteme");
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.date_souhaitee || "");
        payload.append("details[personne]", form.details.personne || "");
        payload.append(
            "details[date_naissance]",
            form.details.date_naissance || "",
        );
        payload.append(
            "details[deja_baptise]",
            form.details.deja_baptise || "",
        );
        payload.append(
            "details[bapteme_eglise]",
            form.details.bapteme_eglise || "",
        );
        payload.append(
            "details[bapteme_date]",
            form.details.bapteme_date || "",
        );
        payload.append(
            "details[want_communion]",
            form.details.want_communion || "",
        );
        payload.append(
            "details[deja_baptise_communion]",
            form.details.can_baptise || "",
        );
        payload.append(
            "details[date_bapteme_communion]",
            form.details.can_date_bap || "",
        );
        payload.append(
            "details[anciennete_communion]",
            form.details.can_anciennete || "",
        );
        payload.append("details[decl1]", form.details.decl1 ? "1" : "");
        payload.append("details[parrain]", form.details.parrain || "");
        payload.append("details[marraine]", form.details.marraine || "");
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
            const msg = res.data?.message || "Demande de bapteme soumise.";
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
            date_souhaitee: "",
            details: {
                personne: "",
                date_naissance: "",
                deja_baptise: "",
                bapteme_eglise: "",
                bapteme_date: "",
                want_communion: "",
                can_baptise: "",
                can_date_bap: "",
                can_anciennete: "",
                decl1: false,
                parrain: "",
                marraine: "",
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
                    <p className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider bg-white text-blue-700">
                        Acte liturgique
                    </p>
                    <h1 className="text-4xl font-light text-white mt-4">
                        Demande de <em className="font-medium">Bapteme</em>
                    </h1>
                    <p className="text-white/90 text-sm mt-2">
                        Eglise Methodiste du Jubile de Cocody
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xl">
                    <div className="h-[4px] bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500" />
                    <form onSubmit={submit} className="p-6 md:p-10">
                        {!success ? (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Personne à baptiser
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Renseignez les informations complétes de la personne concernée.
                                </p>

                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    <Field label="Personne concernée">
                                        <select
                                            value={form.membre_id}
                                            onChange={(e) => {
                                                const member = familyMembers.find(
                                                    (m) => String(m.id) === e.target.value,
                                                );
                                                if (member) {
                                                    applyMemberDefaults(member);
                                                    return;
                                                }
                                                setForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                }));
                                            }}
                                            disabled={!canSelectMember}
                                        >
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Nom complet">
                                        <input
                                            value={form.details.personne}
                                            onChange={(e) =>
                                                setDetail("personne", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Date de naissance">
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
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <Field label="A déjà reçu un baptéme ?">
                                        <select
                                            value={form.details.deja_baptise}
                                            onChange={(e) =>
                                                setDetail(
                                                    "deja_baptise",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="Non">
                                                Non - premier baptême
                                            </option>
                                            <option value="Oui autre eglise">
                                                Oui, autre église
                                            </option>
                                        </select>
                                    </Field>
                                </div>

                                {form.details.deja_baptise === "Oui autre eglise" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Field label="Nom de l'église">
                                            <input
                                                value={form.details.bapteme_eglise}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "bapteme_eglise",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field label="Date du baptême">
                                            <input
                                                type="date"
                                                value={form.details.bapteme_date}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "bapteme_date",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 my-6">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <span className="text-xs italic text-slate-500">
                                        Première communion
                                    </span>
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <Field label="Souhaitez-vous faire la premiére communion ?">
                                        <select
                                            value={form.details.want_communion}
                                            onChange={(e) =>
                                                setDetail(
                                                    "want_communion",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="Oui">Oui</option>
                                            <option value="Non">Non</option>
                                        </select>
                                    </Field>
                                </div>

                                {form.details.want_communion === "Oui" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Field label="A été baptisé(e) ?">
                                            <select
                                                value={form.details.can_baptise}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "can_baptise",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">Choisir</option>
                                                <option value="Oui autre eglise">
                                                    Oui - autre église
                                                </option>
                                                <option value="Non">
                                                    Non
                                                </option>
                                            </select>
                                            {errors["details.can_baptise"] && (
                                                <Err>
                                                    {errors["details.can_baptise"]}
                                                </Err>
                                            )}
                                        </Field>
                                        <Field label="Date du baptême">
                                            <input
                                                type="date"
                                                value={form.details.can_date_bap}
                                                onChange={(e) =>
                                                    setDetail(
                                                        "can_date_bap",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                )}

                                {form.details.want_communion === "Oui" && (
                                    <Field label="Ancienneté dans l'église">
                                        <select
                                            value={form.details.can_anciennete}
                                            onChange={(e) =>
                                                setDetail(
                                                    "can_anciennete",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Choisir</option>
                                            <option value="<6m">Moins de 6 mois</option>
                                            <option value="6m-1a">6 mois-1 an</option>
                                            <option value="1a-3a">1-3 ans</option>
                                            <option value=">3a">Plus de 3 ans</option>
                                        </select>
                                    </Field>
                                )}

                                <p className="text-sm text-slate-500 mb-3 mt-4">
                                    Parrains & marraines
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Parrain">
                                        <input
                                            value={form.details.parrain}
                                            onChange={(e) =>
                                                setDetail("parrain", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Marraine">
                                        <input
                                            value={form.details.marraine}
                                            onChange={(e) =>
                                                setDetail("marraine", e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>

                                <Field label="Observations / Précisions">
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

                                <Field label="Piéces jointes">
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

                                {form.details.want_communion === "Oui" && (
                                    <div className="space-y-2 mt-4 mb-4">
                                        <CheckRow
                                            checked={form.details.decl1}
                                            text="Je confirme que les informations sont exactes"
                                            onChange={(v) =>
                                                setDetail("decl1", v)
                                            }
                                        />
                                        {errors["details.declarations"] && (
                                            <Err>
                                                {errors["details.declarations"]}
                                            </Err>
                                        )}
                                    </div>
                                )}

                                {errors.submit && <Err>{errors.submit}</Err>}

                                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-200">
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
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Demande soumise avec succés
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Votre demande de baptême a été transmise à votre conducteur. Vous serez notifie à chaque étape.
                                </p>
                                {successMsg && (
                                    <p className="text-sm text-blue-700 mt-3">
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
                input, select, textarea {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    padding: 10px 12px;
                    background: #fff;
                    color: #0f172a;
                    outline: none;
                    transition: all .2s;
                    font-size: 13px;
                }
                input:focus, select:focus, textarea:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59,130,246,.14);
                }
                textarea { min-height: 90px; resize: vertical; }
                .btn-main {
                    border: 1px solid #3b82f6;
                    background: #3b82f6;
                    color: white;
                    border-radius: 4px;
                    padding: 10px 18px;
                    font-size: 13px;
                    font-weight: 700;
                }
                .btn-ghost {
                    border: 1px solid #cbd5e1;
                    background: #fff;
                    color: #475569;
                    border-radius: 4px;
                    padding: 10px 18px;
                    font-size: 13px;
                    font-weight: 700;
                }
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

function CheckRow({ checked, text, onChange }) {
    return (
        <label className="flex items-center gap-3 border border-amber-200 rounded-sm px-3 py-2 bg-amber-50 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 accent-blue-700"
            />
            <span className="text-sm text-slate-700">{text}</span>
        </label>
    );
}
