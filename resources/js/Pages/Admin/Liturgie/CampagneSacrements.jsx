import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";

function formatDate(iso) {
    if (!iso) return "—";
    const d = String(iso).slice(0, 10);
    const [y, m, day] = d.split("-");
    if (!y || !m || !day) return d;
    return `${day}/${m}/${y}`;
}

export default function CampagneSacrements({ campagnes = [], status = {} }) {
    const { flash, errors } = usePage().props;
    const open = !!status?.inscriptions_ouvertes;
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();

    const [openForm, setOpenForm] = useState({
        annee: year,
        titre: `Campagne baptême / 1ère communion ${year}`,
        date_ouverture: today,
        date_fermeture: `${year}-12-31`,
    });
    const [reopenForm, setReopenForm] = useState({
        campagneId: null,
        annee: year,
        titre: "",
        date_ouverture: today,
        date_fermeture: `${year}-12-31`,
        motif_reouverture: "",
    });
    const [processing, setProcessing] = useState(false);

    const active = status?.campagne;
    const sorted = useMemo(
        () => [...campagnes].sort((a, b) => (b.id || 0) - (a.id || 0)),
        [campagnes],
    );

    const submitOpen = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            withBasePath("", "/admin/liturgie/campagne-sacrements"),
            openForm,
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const fermer = (id) => {
        if (!confirm("Fermer la campagne ? Les nouvelles inscriptions baptême / 1ère communion seront bloquées.")) {
            return;
        }
        setProcessing(true);
        router.post(
            withBasePath("", `/admin/liturgie/campagne-sacrements/${id}/fermer`),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const startReopen = (c) => {
        setReopenForm({
            campagneId: c.id,
            annee: c.annee || year,
            titre: c.titre || `Campagne baptême / 1ère communion ${year}`,
            date_ouverture: today,
            date_fermeture: c.date_fermeture || `${year}-12-31`,
            motif_reouverture: "",
        });
    };

    const submitReopen = (e) => {
        e.preventDefault();
        if (!reopenForm.campagneId) return;
        setProcessing(true);
        router.post(
            withBasePath(
                "",
                `/admin/liturgie/campagne-sacrements/${reopenForm.campagneId}/reouvrir`,
            ),
            {
                annee: reopenForm.annee,
                titre: reopenForm.titre,
                date_ouverture: reopenForm.date_ouverture,
                date_fermeture: reopenForm.date_fermeture,
                motif_reouverture: reopenForm.motif_reouverture,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setReopenForm((prev) => ({ ...prev, campagneId: null }));
                },
            },
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title="Campagne baptême / 1ère communion" />

            <div className="bg-[#1e3a8a] text-white px-4 py-5 md:px-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
                    <Link
                        href={withBasePath("", "/admin/liturgie")}
                        className="text-sm font-semibold text-blue-100 hover:text-white"
                    >
                        ← Actes liturgiques
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold flex-1 text-center md:text-left">
                        Campagne baptême / 1ère communion
                    </h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {(flash?.success || flash?.error) && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                            flash.success
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                        }`}
                    >
                        {flash.success || flash.error}
                    </div>
                )}

                {errors?.campagne && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {errors.campagne}
                    </div>
                )}

                <div
                    className={`rounded-2xl border p-5 ${
                        open
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-amber-50 border-amber-200"
                    }`}
                >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        État actuel
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                        {open
                            ? "Inscriptions ouvertes"
                            : "Inscriptions fermées"}
                    </p>
                    {active && (
                        <p className="text-sm text-slate-600 mt-1">
                            {active.titre || `Campagne ${active.annee}`} ·{" "}
                            {formatDate(active.date_ouverture)} →{" "}
                            {formatDate(active.date_fermeture)}
                        </p>
                    )}
                    {!open && status?.message_fermee && (
                        <p className="text-sm text-amber-800 mt-2">
                            {status.message_fermee}
                        </p>
                    )}
                </div>

                {!open && (
                    <form
                        onSubmit={submitOpen}
                        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm"
                    >
                        <h2 className="text-lg font-bold text-slate-900">
                            Ouvrir une nouvelle campagne
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Année">
                                <input
                                    type="number"
                                    value={openForm.annee}
                                    onChange={(e) =>
                                        setOpenForm((p) => ({
                                            ...p,
                                            annee: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                            </Field>
                            <Field label="Titre">
                                <input
                                    value={openForm.titre}
                                    onChange={(e) =>
                                        setOpenForm((p) => ({
                                            ...p,
                                            titre: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                            </Field>
                            <Field label="Date d’ouverture">
                                <input
                                    type="date"
                                    required
                                    value={openForm.date_ouverture}
                                    onChange={(e) =>
                                        setOpenForm((p) => ({
                                            ...p,
                                            date_ouverture: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                                {errors?.date_ouverture && (
                                    <Err>{errors.date_ouverture}</Err>
                                )}
                            </Field>
                            <Field label="Date de fermeture">
                                <input
                                    type="date"
                                    required
                                    value={openForm.date_fermeture}
                                    onChange={(e) =>
                                        setOpenForm((p) => ({
                                            ...p,
                                            date_fermeture: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                                {errors?.date_fermeture && (
                                    <Err>{errors.date_fermeture}</Err>
                                )}
                            </Field>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {processing ? "Ouverture…" : "Ouvrir les inscriptions"}
                        </button>
                    </form>
                )}

                {open && active?.id && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Campagne active
                            </h2>
                            <p className="text-sm text-slate-600">
                                Fermer pour bloquer toute nouvelle inscription.
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => fermer(active.id)}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                        >
                            Fermer la campagne
                        </button>
                    </div>
                )}

                {reopenForm.campagneId && (
                    <form
                        onSubmit={submitReopen}
                        className="bg-white rounded-2xl border border-blue-200 p-6 space-y-4 shadow-sm"
                    >
                        <h2 className="text-lg font-bold text-slate-900">
                            Réouvrir la campagne #{reopenForm.campagneId}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Date d’ouverture">
                                <input
                                    type="date"
                                    required
                                    value={reopenForm.date_ouverture}
                                    onChange={(e) =>
                                        setReopenForm((p) => ({
                                            ...p,
                                            date_ouverture: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                            </Field>
                            <Field label="Date de fermeture">
                                <input
                                    type="date"
                                    required
                                    value={reopenForm.date_fermeture}
                                    onChange={(e) =>
                                        setReopenForm((p) => ({
                                            ...p,
                                            date_fermeture: e.target.value,
                                        }))
                                    }
                                    className="field"
                                />
                            </Field>
                            <Field label="Motif (optionnel)">
                                <input
                                    value={reopenForm.motif_reouverture}
                                    onChange={(e) =>
                                        setReopenForm((p) => ({
                                            ...p,
                                            motif_reouverture: e.target.value,
                                        }))
                                    }
                                    className="field"
                                    placeholder="Ex. prolongation pastorale"
                                />
                            </Field>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
                            >
                                Confirmer la réouverture
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setReopenForm((p) => ({
                                        ...p,
                                        campagneId: null,
                                    }))
                                }
                                className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">
                            Historique des campagnes
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Année</th>
                                    <th className="px-4 py-3 font-semibold">Période</th>
                                    <th className="px-4 py-3 font-semibold">Statut</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-slate-500"
                                        >
                                            Aucune campagne pour le moment.
                                        </td>
                                    </tr>
                                )}
                                {sorted.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {c.annee}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {c.titre}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {formatDate(c.date_ouverture)} →{" "}
                                            {formatDate(c.date_fermeture)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    c.est_ouverte
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : c.statut === "ouverte"
                                                          ? "bg-amber-100 text-amber-800"
                                                          : "bg-slate-100 text-slate-700"
                                                }`}
                                            >
                                                {c.est_ouverte
                                                    ? "Ouverte"
                                                    : c.statut === "ouverte"
                                                      ? "Expirée"
                                                      : "Fermée"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {!c.est_ouverte && (
                                                <button
                                                    type="button"
                                                    onClick={() => startReopen(c)}
                                                    className="text-sm font-semibold text-blue-700 hover:underline"
                                                >
                                                    Réouvrir
                                                </button>
                                            )}
                                            {c.est_ouverte && (
                                                <button
                                                    type="button"
                                                    onClick={() => fermer(c.id)}
                                                    className="text-sm font-semibold text-red-700 hover:underline"
                                                >
                                                    Fermer
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                .field {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 0.5rem;
                    padding: 0.6rem 0.75rem;
                    font-size: 0.875rem;
                    background: #fff;
                }
                .field:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37,99,235,.15);
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
            </span>
            {children}
        </label>
    );
}

function Err({ children }) {
    return <p className="text-xs text-red-600 mt-1">{children}</p>;
}
