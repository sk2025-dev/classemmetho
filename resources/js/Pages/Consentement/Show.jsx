import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { ShieldCheck, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { withBasePath } from "../../Utils/urlHelper";

export default function ConsentementShow({
    actif = false,
    texte = "",
    dejaValide = false,
    peutValider = true,
    familleNom = null,
    nomResponsable = null,
}) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const valider = () => {
        setSubmitting(true);
        setError(null);
        router.post(
            withBasePath("", "/consentement/valider"),
            {},
            {
                onError: () =>
                    setError("Une erreur est survenue. Réessayez."),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const goDashboard = () => router.get(withBasePath("", "/dashboard"));

    return (
        <>
            <Head title="Conditions d'utilisation des données personnelles" />
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-8 py-7 text-white">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/15 p-2.5">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black">
                                    Conditions d'utilisation des données personnelles
                                </h1>
                                <p className="text-xs text-indigo-100 mt-0.5">
                                    {familleNom
                                        ? `Famille ${familleNom}`
                                        : "Votre compte"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {!actif && (
                            <div className="text-center py-6">
                                <CheckCircle2
                                    className="mx-auto text-emerald-500 mb-3"
                                    size={36}
                                />
                                <p className="text-sm text-slate-600 mb-5">
                                    Cette validation n'est plus requise pour le
                                    moment.
                                </p>
                                <button
                                    type="button"
                                    onClick={goDashboard}
                                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                                >
                                    Retour au tableau de bord
                                </button>
                            </div>
                        )}

                        {actif && dejaValide && (
                            <div className="text-center py-6">
                                <CheckCircle2
                                    className="mx-auto text-emerald-500 mb-3"
                                    size={36}
                                />
                                <p className="text-sm text-slate-600 mb-5">
                                    Les conditions ont déjà été acceptées.
                                    Vous pouvez continuer.
                                </p>
                                <button
                                    type="button"
                                    onClick={goDashboard}
                                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                                >
                                    Retour au tableau de bord
                                </button>
                            </div>
                        )}

                        {actif && !dejaValide && (
                            <>
                                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap mb-6">
                                    {texte}
                                </div>

                                {peutValider ? (
                                    <>
                                        <p className="text-xs text-slate-500 mb-4">
                                            En cliquant sur « J'accepte », vous
                                            validez ces conditions pour vous-même
                                            {familleNom
                                                ? " et pour tous les membres de votre famille"
                                                : ""}
                                            . Tant que ce n'est pas fait, l'accès
                                            aux fonctionnalités de la plateforme
                                            reste bloqué.
                                        </p>
                                        {error && (
                                            <p className="text-xs text-red-600 mb-3">
                                                {error}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={valider}
                                            disabled={submitting}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {submitting && (
                                                <Loader2
                                                    className="animate-spin"
                                                    size={16}
                                                />
                                            )}
                                            J'accepte les conditions
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                        <Clock
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <p>
                                            Seul le responsable de votre famille
                                            {nomResponsable
                                                ? ` (${nomResponsable})`
                                                : ""}{" "}
                                            peut valider ces conditions.
                                            L'accès à la plateforme sera débloqué
                                            pour tout le foyer dès que ce sera
                                            fait.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
