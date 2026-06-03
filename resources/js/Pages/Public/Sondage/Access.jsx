import { Head, router, usePage } from "@inertiajs/react";
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

function formatDate(dateString) {
    if (!dateString) {
        return "Non definie";
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
}

export default function PublicSondageAccess({
    publicToken,
    survey,
}) {
    const { errors = {} } = usePage().props;
    const [form, setForm] = useState({
        codeFamille: "",
        codeMembre: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitAccess = () => {
        setIsSubmitting(true);

        router.post(
            `/sondages/public/${publicToken}/acces`,
            form,
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title={`${survey?.titre || "Sondage"} - Acces`} />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="mb-6 text-white">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Acces au sondage
                            </h1>
                            <p className="text-sm text-blue-100">
                                Confirmez d'abord le code famille et le code membre avant d'ouvrir le questionnaire.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                        <section className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Verification
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                        Identifiez le membre
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Cette etape autorise l'acces au questionnaire sans afficher ensuite la fiche personnelle du membre.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                            </div>

                            {errors.access ? (
                                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {errors.access}
                                </div>
                            ) : null}

                            <div className="mt-6 grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Code famille
                                    </label>
                                    <input
                                        value={form.codeFamille}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                codeFamille: event.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="Ex: CF12"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors.codeFamille ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors.codeFamille}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Code membre
                                    </label>
                                    <input
                                        value={form.codeMembre}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                codeMembre: event.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="Ex: A25"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors.codeMembre ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors.codeMembre}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={submitAccess}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    {isSubmitting ? "Verification..." : "Verifier et ouvrir"}
                                </button>
                            </div>
                        </section>

                        <aside className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Sondage cible
                            </p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                {survey?.titre || "Sondage"}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                {survey?.description || "Aucune description renseignee."}
                            </p>

                            <div className="mt-5 space-y-3 text-sm text-slate-600">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    Audience:{" "}
                                    <strong>{survey?.audience || "Non renseignee"}</strong>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    Date de cloture: {formatDate(survey?.dateEcheance)}
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    Code sondage: {survey?.code || "Non renseigne"}
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-4 text-sm text-blue-800">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Users className="h-4 w-4" />
                                    Ce qui se passe ensuite
                                </div>
                                <p className="mt-2 leading-6">
                                    Si les codes sont valides, le questionnaire s'ouvre directement avec une participation anonyme, sans afficher les informations personnelles du membre.
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
