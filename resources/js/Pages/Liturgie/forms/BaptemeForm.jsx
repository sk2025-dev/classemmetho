import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToastWithErrorHandling } from "../../../Hooks/useToastWithErrorHandling";
import ToastContainer from "../../../Components/ToastContainer";

export default function BaptemeForm({
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
    const currentClasse = classes.find(
        (c) => String(c.id) === String(form.classe_id),
    );

    const recap = useMemo(
        () => ({
            classe: currentClasse?.nom || "-",
            personne: form.details.personne || "-",
            ddn: form.details.date_naissance || "-",
        }),
        [form.details, currentClasse?.nom],
    );

    const setDetail = (key, value) => {
        setForm((prev) => ({
            ...prev,
            details: { ...prev.details, [key]: value },
        }));
    };

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
                date_naissance: dateNaissance,
            },
        }));
    };

    useEffect(() => {
        if (!form.membre_id) return;
        const member = familyMembers.find(
            (m) => String(m.id) === String(form.membre_id),
        );
        if (!member) return;
        const hasAny = form.details.personne || form.details.date_naissance;
        if (hasAny) return;
        applyMemberDefaults(member);
    }, [form.membre_id, familyMembers]);

    const next = () => {
        if (step === 2) {
            const missing = [];
            if (form.details.want_communion === "Oui") {
                if (!form.details.can_baptise)
                    missing.push("details.can_baptise");
                if (!form.details.decl1) missing.push("details.declarations");
            }
            if (missing.length) {
                setErrors((prev) => ({
                    ...prev,
                    "details.can_baptise": !form.details.can_baptise
                        ? "Champ requis."
                        : prev["details.can_baptise"],
                    "details.declarations": !form.details.decl1
                        ? "Veuillez confirmer."
                        : prev["details.declarations"],
                }));
                return;
            }
        }
        setErrors({});
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
                    <ArrowLeft size={16} />
                    Retour
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
                    {!success && (
                        <>
                            <div className="h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                                {[
                                    "A baptiser",
                                    "Ceremonie",
                                    "Confirmation",
                                ].map((label, idx) => {
                                    const sn = idx + 1;
                                    const active = step === sn;
                                    const done = step > sn;
                                    return (
                                        <div
                                            key={label}
                                            className={`text-center py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 ${
                                                active
                                                    ? "text-blue-600 border-blue-500"
                                                    : done
                                                      ? "text-amber-600 border-amber-500"
                                                      : "text-slate-400 border-transparent"
                                            }`}
                                        >
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <form onSubmit={submit} className="p-6 md:p-10">
                        {/* ══ ÉTAPE 1 : A BAPTISER ══ */}
                        {!success && step === 1 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Personne a baptiser
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Renseignez les informations completes de la
                                    personne concernee.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Personne concernee">
                                        <select
                                            value={form.membre_id}
                                            onChange={(e) => {
                                                const member =
                                                    familyMembers.find(
                                                        (m) =>
                                                            String(m.id) ===
                                                            e.target.value,
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
                                    </Field>
                                    <Field label="Nom complet">
                                        <input
                                            value={form.details.personne}
                                            onChange={(e) =>
                                                setDetail(
                                                    "personne",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                                {/* ── Déjà baptisé ── */}
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <Field label="A deja recu un bapteme ?">
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
                                                Non - premier bapteme
                                            </option>
                                            <option value="Oui autre eglise">
                                                Oui, autre eglise
                                            </option>
                                        </select>
                                    </Field>
                                </div>

                                {form.details.deja_baptise ===
                                    "Oui autre eglise" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Field label="Nom de l'eglise">
                                            <input
                                                value={
                                                    form.details.bapteme_eglise
                                                }
                                                onChange={(e) =>
                                                    setDetail(
                                                        "bapteme_eglise",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field label="Date du bapteme">
                                            <input
                                                type="date"
                                                value={
                                                    form.details.bapteme_date
                                                }
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

                                {/* ── Première communion ── */}
                                <div className="flex items-center gap-2 my-6">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <span className="text-xs italic text-slate-500">
                                        Premiere communion
                                    </span>
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <Field label="Souhaitez-vous faire la premiere communion ?">
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
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <Field label="A ete baptise(e) ? *">
                                                <select
                                                    value={
                                                        form.details.can_baptise
                                                    }
                                                    onChange={(e) =>
                                                        setDetail(
                                                            "can_baptise",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Choisir
                                                    </option>
                                                    <option value="Oui autre eglise">
                                                        Oui - autre eglise
                                                    </option>
                                                    <option value="Non">
                                                        Non
                                                    </option>
                                                </select>
                                                {errors[
                                                    "details.can_baptise"
                                                ] && (
                                                    <Err>
                                                        {
                                                            errors[
                                                                "details.can_baptise"
                                                            ]
                                                        }
                                                    </Err>
                                                )}
                                            </Field>
                                            <Field label="Date du bapteme">
                                                <input
                                                    type="date"
                                                    value={
                                                        form.details
                                                            .can_date_bap
                                                    }
                                                    onChange={(e) =>
                                                        setDetail(
                                                            "can_date_bap",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Anciennete dans l'eglise">
                                            <select
                                                value={
                                                    form.details.can_anciennete
                                                }
                                                onChange={(e) =>
                                                    setDetail(
                                                        "can_anciennete",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Choisir
                                                </option>
                                                <option value="<6m">
                                                    Moins de 6 mois
                                                </option>
                                                <option value="6m-1a">
                                                    6 mois a 1 an
                                                </option>
                                                <option value="1a-3a">
                                                    1 a 3 ans
                                                </option>
                                                <option value=">3a">
                                                    Plus de 3 ans
                                                </option>
                                            </select>
                                        </Field>
                                    </>
                                )}

                                <FooterButtons onNext={next} />
                            </section>
                        )}

                        {/* ══ ÉTAPE 2 : CÉRÉMONIE ══ */}
                        {!success && step === 2 && (
                            <section>
                                {/* <h2 className="text-2xl font-semibold text-slate-800 mb-1">Details de la ceremonie</h2> */}
                                {/* <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Informations pour la celebration.
                                </p> */}

                                {/* ── Parrains & Marraines ── */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-px bg-slate-200 flex-1" />
                                    <span className="text-xs italic text-slate-500">
                                        Parrains & Marraines
                                    </span>
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Field label="Parrain">
                                        <input
                                            value={form.details.parrain}
                                            onChange={(e) =>
                                                setDetail(
                                                    "parrain",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Marraine">
                                        <input
                                            value={form.details.marraine}
                                            onChange={(e) =>
                                                setDetail(
                                                    "marraine",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>

                                <Field label="Observations / Precisions">
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

                                {/* ── Communion : déclaration uniquement si want_communion = Oui ── */}
                                {form.details.want_communion === "Oui" && (
                                    <>
                                        <div className="flex items-center gap-2 my-6">
                                            <div className="h-px bg-slate-200 flex-1" />
                                            <span className="text-xs italic text-slate-500">
                                                Preparation a la communion
                                            </span>
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <CheckRow
                                                checked={form.details.decl1}
                                                text="Je confirme que les informations sont exactes"
                                                onChange={(v) =>
                                                    setDetail("decl1", v)
                                                }
                                            />
                                            {errors["details.declarations"] && (
                                                <Err>
                                                    {
                                                        errors[
                                                            "details.declarations"
                                                        ]
                                                    }
                                                </Err>
                                            )}
                                        </div>
                                    </>
                                )}

                                <FooterButtons onPrev={prev} onNext={next} />
                            </section>
                        )}

                        {/* ══ ÉTAPE 3 : RÉCAPITULATIF ══ */}
                        {!success && step === 3 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                                    Recapitulatif de la demande
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-200">
                                    Verifiez attentivement avant de soumettre.
                                </p>

                                <RecapCard title="Personne a baptiser">
                                    <RecapRow k="Identite" v={recap.personne} />
                                    <RecapRow
                                        k="Date de naissance"
                                        v={recap.ddn}
                                    />
                                    {form.details.deja_baptise && (
                                        <RecapRow
                                            k="Bapteme anterieur"
                                            v={form.details.deja_baptise}
                                        />
                                    )}
                                    {form.details.bapteme_eglise && (
                                        <RecapRow
                                            k="Eglise du bapteme"
                                            v={form.details.bapteme_eglise}
                                        />
                                    )}
                                </RecapCard>

                                <RecapCard title="Premiere communion">
                                    <RecapRow
                                        k="Souhait communion"
                                        v={form.details.want_communion || "-"}
                                    />
                                    {form.details.want_communion === "Oui" && (
                                        <>
                                            <RecapRow
                                                k="Deja baptise(e)"
                                                v={
                                                    form.details.can_baptise ||
                                                    "-"
                                                }
                                            />
                                            <RecapRow
                                                k="Anciennete eglise"
                                                v={
                                                    form.details
                                                        .can_anciennete || "-"
                                                }
                                            />
                                        </>
                                    )}
                                </RecapCard>

                                <RecapCard title="Ceremonie">
                                    {form.details.parrain && (
                                        <RecapRow
                                            k="Parrain"
                                            v={form.details.parrain}
                                        />
                                    )}
                                    {form.details.marraine && (
                                        <RecapRow
                                            k="Marraine"
                                            v={form.details.marraine}
                                        />
                                    )}
                                    {form.details.observations && (
                                        <RecapRow
                                            k="Observations"
                                            v={form.details.observations}
                                        />
                                    )}
                                    <RecapRow k="Statut initial" v="SOUMISE" />
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
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-semibold text-slate-800 mb-2">
                                    Demande soumise avec succes
                                </h2>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Votre demande de bapteme a ete transmise a
                                    votre conducteur. Vous serez notifie a
                                    chaque etape.
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
            `}</style>{" "}
            <ToastContainer toasts={toasts} removeToast={removeToast} />{" "}
        </div>
    );
}

/* ── Sub-components (identiques) ── */
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
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-3">
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
