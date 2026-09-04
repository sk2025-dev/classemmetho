import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    ShieldCheck,
    Clock,
    CheckCircle2,
    Loader2,
    LogOut,
    Lock,
    Users,
    FileEdit,
    Sparkles,
} from "lucide-react";
import { withBasePath } from "../../Utils/urlHelper";

const HIGHLIGHTS = [
    {
        icon: Users,
        title: "Usage communautaire",
        desc: "Présences, cotisations, actes liturgiques — rien d'autre.",
    },
    {
        icon: Lock,
        title: "Aucune revente",
        desc: "Jamais transmises à un tiers hors de l'administration de la classe.",
    },
    {
        icon: FileEdit,
        title: "Vos droits",
        desc: "Rectification ou suppression sur simple demande au secrétariat.",
    },
];

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
    const deconnexion = () => router.post(withBasePath("", "/logout"));

    return (
        <>
            <Head title="Conditions d'utilisation des données personnelles" />
            <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#312e81,_#0f0c29_65%)] px-4 py-10 flex items-center justify-center">
                {/* Décor : formes floutées en arrière-plan */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
                <div className="pointer-events-none absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                        backgroundSize: "22px 22px",
                    }}
                />

                <div className="relative w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2 text-indigo-200/80 text-xs font-semibold tracking-wide uppercase">
                            <Sparkles size={13} />
                            Église Méthodiste · Classe Jubilé de Cocody
                        </div>
                        <button
                            type="button"
                            onClick={deconnexion}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200/80 hover:text-white transition"
                        >
                            <LogOut size={14} /> Se déconnecter
                        </button>
                    </div>

                    <div className="rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(49,46,129,0.6)] ring-1 ring-white/10 overflow-hidden">
                        <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 px-8 py-9 text-white overflow-hidden">
                            <div
                                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
                            />
                            <div
                                className="pointer-events-none absolute right-16 bottom-[-2.5rem] h-24 w-24 rounded-full bg-white/10"
                            />
                            <div className="relative flex items-center gap-4">
                                <div className="rounded-2xl bg-white/15 p-3.5 shadow-inner backdrop-blur">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black tracking-tight">
                                        Vos données personnelles
                                    </h1>
                                    <p className="text-sm text-indigo-100/90 mt-1">
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
                                        size={40}
                                    />
                                    <p className="text-sm text-slate-600 mb-6">
                                        Cette validation n'est plus requise pour
                                        le moment.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={goDashboard}
                                        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition"
                                    >
                                        Retour au tableau de bord
                                    </button>
                                </div>
                            )}

                            {actif && dejaValide && (
                                <div className="text-center py-6">
                                    <CheckCircle2
                                        className="mx-auto text-emerald-500 mb-3"
                                        size={40}
                                    />
                                    <p className="text-sm text-slate-600 mb-6">
                                        Les conditions ont déjà été acceptées.
                                        Vous pouvez continuer.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={goDashboard}
                                        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition"
                                    >
                                        Retour au tableau de bord
                                    </button>
                                </div>
                            )}

                            {actif && !dejaValide && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                        {HIGHLIGHTS.map(
                                            ({ icon: Icon, title, desc }) => (
                                                <div
                                                    key={title}
                                                    className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"
                                                >
                                                    <div className="inline-flex rounded-xl bg-indigo-600 p-2 text-white shadow-sm mb-2.5">
                                                        <Icon size={15} />
                                                    </div>
                                                    <p className="text-[13px] font-bold text-slate-800 leading-tight">
                                                        {title}
                                                    </p>
                                                    <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">
                                                        {desc}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                            {texte}
                                        </div>
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl bg-gradient-to-t from-slate-50 to-transparent" />
                                    </div>

                                    {peutValider ? (
                                        <>
                                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                                En cliquant sur «&nbsp;J'accepte&nbsp;»,
                                                vous validez ces conditions pour
                                                vous-même
                                                {familleNom
                                                    ? " et pour tous les membres de votre famille"
                                                    : ""}
                                                . Tant que ce n'est pas fait,
                                                l'accès aux fonctionnalités de
                                                la plateforme reste bloqué.
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
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                                            >
                                                {submitting ? (
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={17}
                                                    />
                                                ) : (
                                                    <ShieldCheck size={17} />
                                                )}
                                                J'accepte les conditions
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-sm text-amber-900">
                                            <div className="rounded-lg bg-amber-400/20 p-1.5 shrink-0">
                                                <Clock size={16} />
                                            </div>
                                            <p className="leading-relaxed">
                                                Seul le responsable de votre
                                                famille
                                                {nomResponsable
                                                    ? ` (${nomResponsable})`
                                                    : ""}{" "}
                                                peut valider ces conditions.
                                                L'accès à la plateforme sera
                                                débloqué pour tout le foyer dès
                                                que ce sera fait.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/80 px-6 py-3 text-[11px] text-slate-400">
                            <Lock size={11} />
                            Vos données sont traitées avec confidentialité,
                            conformément à ces conditions.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
