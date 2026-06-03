import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link, usePage } from "@inertiajs/react";
import { ArrowLeft, ArrowRight, CheckCircle, Home, User, Send, Upload } from "lucide-react";

const ACTE_TYPES = [
    { value: "bapteme", label: "Baptême", icon: "BT" },
    { value: "premiere_communion", label: "Première Communion", icon: "PC" },
    { value: "mariage", label: "Mariage", icon: "MG" },
    { value: "naissance", label: "Déclaration de naissance", icon: "NS" },
    { value: "deces", label: "Déclaration de décès", icon: "DC" },
];

const TYPE_FIELDS = {
    bapteme: [
        { key: "personne", label: "Nom de la personne à baptiser", required: true },
        { key: "date", label: "Date du baptême", type: "date", required: true },
        { key: "lieu", label: "Lieu du baptême", required: true },
        { key: "celebrant", label: "Nom du célébrant" },
        { key: "parents", label: "Nom des parents (si enfant)" },
    ],
    premiere_communion: [
        { key: "personne", label: "Nom complet", required: true },
        { key: "date", label: "Date de la communion", type: "date", required: true },
        { key: "lieu", label: "Lieu de la cérémonie", required: true },
        { key: "deja_baptise", label: "A déjà été baptisé(e) ?" },
    ],
    mariage: [
        { key: "conjoint_1", label: "Nom de l'époux", required: true },
        { key: "conjoint_2", label: "Nom de la fiancée", required: true },
        { key: "date", label: "Date du mariage", type: "date", required: true },
        { key: "lieu", label: "Lieu du mariage", required: true },
        { key: "type_mariage", label: "Type de mariage", required: true },
        {
            key: "epoux_baptise",
            label: "Époux baptisé ?",
            type: "select",
            options: [
                { value: "", label: "Choisir" },
                { value: "oui", label: "Oui" },
                { value: "non", label: "Non" },
            ],
        },
        { key: "epoux_date_bapteme", label: "Date du baptême (époux)", type: "date" },
        { key: "epoux_lieu_bapteme", label: "Lieu du baptême (époux)" },
        {
            key: "fiancee_baptisee",
            label: "Fiancée baptisée ?",
            type: "select",
            options: [
                { value: "", label: "Choisir" },
                { value: "oui", label: "Oui" },
                { value: "non", label: "Non" },
            ],
        },
        { key: "fiancee_date_bapteme", label: "Date du baptême (fiancée)", type: "date" },
        { key: "fiancee_lieu_bapteme", label: "Lieu du baptême (fiancée)" },
        { key: "temoins", label: "Nom des temoins" },
    ],
    naissance: [
        { key: "nom_enfant", label: "Nom de l'enfant", required: true },
        { key: "date_naissance", label: "Date de naissance", type: "date", required: true },
        { key: "parents", label: "Parents", required: true },
        { key: "lieu_naissance", label: "Lieu de naissance" },
    ],
    deces: [
        { key: "nom_defunt", label: "Nom du défunt", required: true },
        { key: "date_deces", label: "Date du décès", type: "date", required: true },
        { key: "lieu_deces", label: "Lieu du décès" },
        { key: "lien_familial", label: "Lien familial" },
        { key: "contact", label: "Contact principal" },
    ],
};

const STYLES = {
    button: {
        primary:
            "px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] active:scale-95",
        secondary:
            "px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:shadow-md hover:bg-gray-300 transition-all duration-300",
    },
    input:
        "w-full h-12 border border-gray-300 rounded-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300",
};

function FormStepper({ currentStep, labels }) {
    const icons = [Home, User, CheckCircle];

    return (
        <div className="w-full px-6 py-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {labels.map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;
                    const Icon = icons[idx] || CheckCircle;

                    return (
                        <React.Fragment key={stepNum}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg ${
                                        isActive
                                            ? "bg-blue-600 text-white scale-105 shadow-blue-300"
                                            : isCompleted
                                              ? "bg-green-500 text-white"
                                              : "bg-gray-200 text-gray-500"
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                </div>
                                <span
                                    className={`mt-2 text-xs sm:text-sm font-semibold text-center ${
                                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                                    }`}
                                >
                                    {label}
                                </span>
                            </div>
                            {stepNum < labels.length && (
                                <div
                                    className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-300 ${
                                        isCompleted ? "bg-green-500" : "bg-gray-300"
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

function Field({ label, children, required = false }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            {children}
        </div>
    );
}

export default function ActeLiturgiqueRequestWizard({
    title,
    subtitle,
    backHref,
    submitUrl,
    actes = [],
    familyMembers = [],
    classes = [],
    canSelectMember = false,
    initialType = null,
}) {
    const { auth } = usePage().props;
    const connectedUser = auth?.user || null;

    const defaultMemberId = familyMembers[0]?.id || connectedUser?.id || "";
    const defaultClasseId = familyMembers[0]?.classe_id || connectedUser?.classe_id || "";

    const normalizedInitialType = ACTE_TYPES.some((item) => item.value === initialType) ? initialType : "";

    const [step, setStep] = useState(normalizedInitialType ? 2 : 1);
    const [processing, setProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errors, setErrors] = useState({});
    const [localActes, setLocalActes] = useState(actes);

    const [form, setForm] = useState({
        type_acte: normalizedInitialType,
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        date_souhaitee: "",
        details: {},
        pieces_jointes: [],
    });

    const labels = ["Type d'acte", "Informations", "Verification"];

    const selectedTypeLabel = useMemo(
        () => ACTE_TYPES.find((x) => x.value === form.type_acte)?.label || "Non selectionne",
        [form.type_acte],
    );

    const dynamicFields = useMemo(() => {
        const fields = TYPE_FIELDS[form.type_acte] || [];
        if (form.type_acte !== "mariage") return fields;

        return fields.filter((field) => {
            if (["epoux_date_bapteme", "epoux_lieu_bapteme"].includes(field.key)) {
                return form.details.epoux_baptise === "oui";
            }
            if (["fiancee_date_bapteme", "fiancee_lieu_bapteme"].includes(field.key)) {
                return form.details.fiancee_baptisee === "oui";
            }
            return true;
        });
    }, [form.type_acte, form.details]);
    const currentMember = familyMembers.find((m) => String(m.id) === String(form.membre_id));
    const currentClasse = classes.find((c) => String(c.id) === String(form.classe_id));

    const setDetail = (key, value) => {
        setForm((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
    };

    const validateStepOne = () => {
        const next = {};
        if (!form.type_acte) next.type_acte = "Selectionnez un type d'acte.";
        if (!form.membre_id) next.membre_id = "Selectionnez la personne concernee.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const validateStepTwo = () => {
        const next = {};
        if (!form.date_souhaitee) next.date_souhaitee = "La date souhaitee est obligatoire.";
        dynamicFields.forEach((f) => {
            if (f.required && !form.details[f.key]) next[`details.${f.key}`] = `${f.label} est obligatoire.`;
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const goNext = () => {
        if (step === 1 && !validateStepOne()) return;
        if (step === 2 && !validateStepTwo()) return;
        setStep((s) => Math.min(3, s + 1));
    };

    const goPrev = () => setStep((s) => Math.max(1, s - 1));

    const resetForm = () => {
        setForm({
            type_acte: normalizedInitialType,
            membre_id: defaultMemberId,
            classe_id: defaultClasseId,
            date_souhaitee: "",
            details: {},
            pieces_jointes: [],
        });
        setErrors({});
        setStep(normalizedInitialType ? 2 : 1);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validateStepTwo()) {
            setStep(2);
            return;
        }

        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", form.type_acte);
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.date_souhaitee || "");
        Object.entries(form.details).forEach(([k, v]) => payload.append(`details[${k}]`, v ?? ""));
        form.pieces_jointes.forEach((file) => payload.append("pieces_jointes[]", file));

        try {
            const res = await axios.post(submitUrl, payload);
            if (res.data?.acte) setLocalActes((prev) => [res.data.acte, ...prev]);
            setSuccessMsg(res.data?.message || "Demande soumise avec succes.");
            resetForm();
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
        <div
            className="min-h-screen py-10 px-4"
            style={{
                background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-5xl mx-auto mb-6">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 text-white hover:text-yellow-300 font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Retour
                </Link>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                    <p className="text-yellow-100">{subtitle}</p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <FormStepper currentStep={step} labels={labels} />

                    <form onSubmit={submit} className="p-6 md:p-10 space-y-6">
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-xl font-bold text-gray-800">Type d'acte</h2>
                                <p className="text-sm text-gray-500">Choisissez l'acte liturgique a demander.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ACTE_TYPES.map((type) => {
                                        const selected = form.type_acte === type.value;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setForm((prev) => ({ ...prev, type_acte: type.value, details: {} }))}
                                                className={`rounded-lg border p-4 text-left transition-all ${
                                                    selected
                                                        ? "border-blue-500 bg-blue-50 shadow"
                                                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                                }`}
                                            >
                                                <div className="text-xs text-blue-700 font-bold">{type.icon}</div>
                                                <div className="text-sm font-semibold text-gray-900 mt-1">{type.label}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.type_acte && <p className="text-sm text-red-600">{errors.type_acte}</p>}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Personne concernee" required>
                                        <select
                                            className={STYLES.input}
                                            value={form.membre_id}
                                            onChange={(e) => {
                                                const member = familyMembers.find((m) => String(m.id) === e.target.value);
                                                setForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                    classe_id: member?.classe_id || prev.classe_id,
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
                                        {!canSelectMember && (
                                            <p className="text-xs text-gray-500">Vous soumettez pour votre propre profil.</p>
                                        )}
                                        {errors.membre_id && <p className="text-xs text-red-600">{errors.membre_id}</p>}
                                    </Field>

                                    <Field label="Classe d'appartenance" required>
                                        {classes.length > 0 ? (
                                            <select
                                                className={STYLES.input}
                                                value={form.classe_id || ""}
                                                onChange={(e) => setForm((prev) => ({ ...prev, classe_id: e.target.value }))}
                                            >
                                                <option value="">Selectionner une classe</option>
                                                {classes.map((classe) => (
                                                    <option key={classe.id} value={classe.id}>
                                                        {classe.nom}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input className={`${STYLES.input} bg-gray-100`} value={currentMember?.classe_id || "-"} readOnly />
                                        )}
                                    </Field>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-xl font-bold text-gray-800">Informations</h2>
                                <p className="text-sm text-gray-500">
                                    Renseignez les informations pour: <span className="font-semibold">{selectedTypeLabel}</span>
                                </p>

                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Circuit de validation:</span> Conducteur puis Pasteur.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Date souhaitee" required>
                                        <input
                                            className={STYLES.input}
                                            type="date"
                                            value={form.date_souhaitee}
                                            onChange={(e) => setForm((prev) => ({ ...prev, date_souhaitee: e.target.value }))}
                                        />
                                        {errors.date_souhaitee && <p className="text-xs text-red-600">{errors.date_souhaitee}</p>}
                                    </Field>

                                    <Field label="Classe d'appartenance">
                                        <input className={`${STYLES.input} bg-gray-100`} value={currentClasse?.nom || "-"} readOnly />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dynamicFields.map((f) => (
                                        <Field key={f.key} label={f.label} required={!!f.required}>
                                            {f.type === "select" ? (
                                                <select
                                                    className={STYLES.input}
                                                    value={form.details[f.key] || ""}
                                                    onChange={(e) => setDetail(f.key, e.target.value)}
                                                >
                                                    {(f.options || []).map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    className={STYLES.input}
                                                    type={f.type || "text"}
                                                    value={form.details[f.key] || ""}
                                                    onChange={(e) => setDetail(f.key, e.target.value)}
                                                />
                                            )}
                                            {errors[`details.${f.key}`] && (
                                                <p className="text-xs text-red-600">{errors[`details.${f.key}`]}</p>
                                            )}
                                        </Field>
                                    ))}
                                </div>

                                <Field label="Informations complementaires">
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300 min-h-[100px]"
                                        value={form.details.observations || ""}
                                        onChange={(e) => setDetail("observations", e.target.value)}
                                    />
                                </Field>

                                <Field label="Pieces jointes (PDF/JPG/PNG - max 5)">
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer transition">
                                        <Upload className="w-4 h-4" />
                                        Ajouter des fichiers
                                        <input
                                            className="hidden"
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    pieces_jointes: Array.from(e.target.files || []),
                                                }))
                                            }
                                        />
                                    </label>
                                    {form.pieces_jointes.length > 0 && (
                                        <ul className="mt-2 text-xs text-gray-600 space-y-1">
                                            {form.pieces_jointes.map((f, i) => (
                                                <li key={`${f.name}-${i}`}>{f.name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </Field>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-fadeIn">
                                <h2 className="text-xl font-bold text-gray-800">Verification finale</h2>

                                <RecapBlock title="Type d'acte">
                                    <RecapLine k="Acte demande" v={selectedTypeLabel} />
                                    <RecapLine k="Date souhaitee" v={form.date_souhaitee || "-"} />
                                    <RecapLine k="Classe" v={currentClasse?.nom || "-"} />
                                    <RecapLine
                                        k="Personne concernee"
                                        v={currentMember ? `${currentMember.prenom} ${currentMember.nom}` : "-"}
                                    />
                                </RecapBlock>

                                <RecapBlock title="Informations specifiques">
                                    {Object.entries(form.details).length === 0 && (
                                        <p className="text-sm text-gray-500">Aucune information specifique.</p>
                                    )}
                                    {Object.entries(form.details).map(([k, v]) => (
                                        <RecapLine key={k} k={prettyKey(k)} v={v || "-"} />
                                    ))}
                                </RecapBlock>

                                <RecapBlock title="Statut apres soumission">
                                    <RecapLine k="Statut initial" v="SOUMISE" />
                                    <RecapLine k="Prochaine etape" v="Conducteur de classe" />
                                </RecapBlock>
                            </div>
                        )}

                        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
                        {successMsg && (
                            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
                                {successMsg}
                            </div>
                        )}

                        <div className={`flex mt-8 gap-4 ${step === 1 ? "justify-end" : "justify-between"}`}>
                            {step > 1 && (
                                <button type="button" onClick={goPrev} disabled={processing} className={STYLES.button.secondary}>
                                    <span className="inline-flex items-center gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </span>
                                </button>
                            )}

                            {step < 3 ? (
                                <button type="button" onClick={goNext} className={`${STYLES.button.primary} ml-auto`}>
                                    <span className="inline-flex items-center gap-2">
                                        Continuer
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`${STYLES.button.primary} ml-auto disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Send className="w-4 h-4" />
                                        {processing ? "Soumission..." : "Soumettre"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-xl mt-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
                        <h2 className="text-lg font-bold text-gray-900">Mes demandes recentes</h2>
                    </div>

                    {localActes.length === 0 && (
                        <div className="p-6 text-sm text-gray-500">Aucune demande enregistree pour le moment.</div>
                    )}

                    {localActes.map((acte) => (
                        <div
                            key={acte.id}
                            className="px-6 py-4 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {prettyType(acte.type_acte)} - {acte.reference || `ACTE-${acte.id}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {acte.membre?.prenom} {acte.membre?.nom} - {acte.date_souhaitee || "-"}
                                </p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                {acte.statut}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RecapBlock({ title, children }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">{title}</h3>
            {children}
        </div>
    );
}

function RecapLine({ k, v }) {
    return (
        <div className="py-2 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{k}</span>
            <span className="text-sm text-gray-800 text-right">{typeof v === "string" || typeof v === "number" ? v : v}</span>
        </div>
    );
}

function prettyType(type) {
    return ACTE_TYPES.find((t) => t.value === type)?.label || type || "Acte";
}

function prettyKey(key) {
    const map = {
        conjoint_1: "Époux",
        conjoint_2: "Fiancée",
        fiancee_baptisee: "Fiancée baptisée",
        fiancee_date_bapteme: "Date du baptême (fiancée)",
        fiancee_lieu_bapteme: "Lieu du baptême (fiancée)",
    };
    if (map[key]) return map[key];

    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
