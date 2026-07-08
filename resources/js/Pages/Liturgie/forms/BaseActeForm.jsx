import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { ArrowLeft, Send, Upload } from "lucide-react";

const INPUT =
    "w-full h-11 border border-slate-200 rounded-lg px-4 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all duration-300 bg-white text-slate-800";

export default function BaseActeForm({
    typeActe,
    title,
    subtitle,
    backHref,
    submitUrl,
    fields,
    familyMembers = [],
    classes = [],
    canSelectMember = false,
}) {
    const defaultMemberId = familyMembers[0]?.id || "";
    const defaultClasseId = familyMembers[0]?.classe_id || "";

    const [processing, setProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        membre_id: defaultMemberId,
        classe_id: defaultClasseId,
        date_souhaitee: "",
        details: {},
        pieces_jointes: [],
    });

    const visibleFields = useMemo(
        () =>
            (fields || []).filter((f) => {
                if (!f.showWhen) return true;
                return f.showWhen(form.details);
            }),
        [fields, form.details],
    );

    const currentMember = familyMembers.find((m) => String(m.id) === String(form.membre_id));
    const currentClasse = classes.find((c) => String(c.id) === String(form.classe_id));

    const setDetail = (key, value) => {
        setForm((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        setSuccessMsg("");

        const payload = new FormData();
        payload.append("type_acte", typeActe);
        payload.append("membre_id", form.membre_id || "");
        payload.append("classe_id", form.classe_id || "");
        payload.append("date_souhaitee", form.date_souhaitee || "");
        Object.entries(form.details).forEach(([k, v]) => payload.append(`details[${k}]`, v ?? ""));
        form.pieces_jointes.forEach((file) => payload.append("pieces_jointes[]", file));

        try {
            const res = await axios.post(submitUrl, payload);
            setSuccessMsg(res.data?.message || "Demande soumise avec succes.");
            setForm({
                membre_id: defaultMemberId,
                classe_id: defaultClasseId,
                date_souhaitee: "",
                details: {},
                pieces_jointes: [],
            });
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
            style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}
        >
            <div className="max-w-5xl mx-auto mb-6">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 bg-white/95 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg border border-white shadow-sm font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Retour
                </Link>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white drop-shadow">{title}</h1>
                    <p className="text-white/90">{subtitle}</p>
                </div>

                <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl overflow-hidden border border-white/80">
                    <form onSubmit={submit} className="p-6 md:p-10 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Personne concernee">
                                <select
                                    className={INPUT}
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
                                {errors.membre_id && <p className="text-xs text-red-600 mt-1">{errors.membre_id}</p>}
                            </Field>

                            <Field label="Classe d'appartenance">
                                {classes.length > 0 ? (
                                    <select
                                        className={INPUT}
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
                                    <input className={`${INPUT} bg-gray-100`} readOnly value={currentMember?.classe_id || "-"} />
                                )}
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Date souhaitee">
                                <input
                                    className={INPUT}
                                    type="date"
                                    value={form.date_souhaitee}
                                    onChange={(e) => setForm((prev) => ({ ...prev, date_souhaitee: e.target.value }))}
                                />
                                {errors.date_souhaitee && <p className="text-xs text-red-600 mt-1">{errors.date_souhaitee}</p>}
                            </Field>
                            <Field label="Classe selectionnee">
                                <input className={`${INPUT} bg-gray-100`} readOnly value={currentClasse?.nom || "-"} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visibleFields.map((f) => (
                                <Field key={f.key} label={f.label}>
                                    {f.type === "select" ? (
                                        <select className={INPUT} value={form.details[f.key] || ""} onChange={(e) => setDetail(f.key, e.target.value)}>
                                            {(f.options || []).map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            className={INPUT}
                                            type={f.type || "text"}
                                            value={form.details[f.key] || ""}
                                            onChange={(e) => setDetail(f.key, e.target.value)}
                                        />
                                    )}
                                    {errors[`details.${f.key}`] && <p className="text-xs text-red-600 mt-1">{errors[`details.${f.key}`]}</p>}
                                </Field>
                            ))}
                        </div>

                        <Field label="Observations">
                            <textarea
                                className="w-full border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all duration-300 min-h-[100px] bg-white text-slate-800"
                                value={form.details.observations || ""}
                                onChange={(e) => setDetail("observations", e.target.value)}
                            />
                        </Field>

                        <Field label="Pieces jointes">
                            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                                <Upload className="w-4 h-4" />
                                Ajouter des fichiers
                                <input
                                    className="hidden"
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setForm((prev) => ({ ...prev, pieces_jointes: Array.from(e.target.files || []) }))}
                                />
                            </label>
                        </Field>

                        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
                        {successMsg && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">{successMsg}</div>}

                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 rounded-lg bg-white text-slate-800 border border-slate-300 font-semibold shadow-sm hover:bg-slate-50 transition-all duration-300 disabled:opacity-60"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    {processing ? "Soumission..." : "Soumettre la demande"}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">{label}</label>
            {children}
        </div>
    );
}
