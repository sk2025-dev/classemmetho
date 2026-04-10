import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

function PrayerList({
    title,
    description,
    requests,
    commentDrafts,
    setCommentDrafts,
    routeBase,
    readOnly = false,
}) {
    return (
        <section className="rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>

            {requests.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm text-slate-500">
                    Aucune priere dans cette section.
                </div>
            ) : (
                <div className="mt-4 grid gap-4">
                    {requests.map((request) => (
                        <article
                            key={request.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                    {request.status}
                                </span>
                                <span>{request.createdAt}</span>
                                {request.targetLabel ? (
                                    <span>• {request.targetLabel}</span>
                                ) : null}
                            </div>
                            <h3 className="mt-3 text-base font-bold text-slate-900">
                                {request.subject}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {request.message}
                            </p>
                            {request.sourceLabel ? (
                                <p className="mt-2 text-xs font-medium text-blue-700">
                                    Source: {request.sourceLabel}
                                </p>
                            ) : null}
                            {request.testimony ? (
                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                                    {request.testimony}
                                </div>
                            ) : null}
                            {request.history?.length > 0 ? (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Historique
                                    </p>
                                    <div className="mt-2 space-y-2">
                                        {request.history.map((item) => (
                                            <div
                                                key={item.id}
                                                className="text-sm text-slate-600"
                                            >
                                                <span className="font-semibold text-slate-900">
                                                    {item.description}
                                                </span>
                                                <span className="ml-2 text-xs text-slate-500">
                                                    {item.createdAt}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {!readOnly ? (
                                request.comments?.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.patch(
                                                `${routeBase}/${request.id}/exaucee`,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Marquer comme exaucee
                                    </button>
                                ) : (
                                    <div className="mt-4">
                                        <textarea
                                            rows={4}
                                            value={
                                                commentDrafts[request.id] || ""
                                            }
                                            onChange={(event) =>
                                                setCommentDrafts((current) => ({
                                                    ...current,
                                                    [request.id]:
                                                        event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                            placeholder="Ajoutez un commentaire d'exaucement"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.patch(
                                                    `${routeBase}/${request.id}/commentaire`,
                                                    {
                                                        temoignage:
                                                            commentDrafts[
                                                                request.id
                                                            ] || "",
                                                    },
                                                    { preserveScroll: true },
                                                )
                                            }
                                            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Enregistrer
                                        </button>
                                    </div>
                                )
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default function ConducteurPrieresInboxIndex({
    authUser = null,
    prayerRequests = [],
    receivedPrayerRequests = [],
}) {
    const [ownRequests, setOwnRequests] = useState(prayerRequests);
    const [inboxRequests, setInboxRequests] = useState(receivedPrayerRequests);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [commentDrafts, setCommentDrafts] = useState({});

    useEffect(() => setOwnRequests(prayerRequests), [prayerRequests]);
    useEffect(
        () => setInboxRequests(receivedPrayerRequests),
        [receivedPrayerRequests],
    );

    return (
        <>
            <Head title="Prieres - Conducteur" />
            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="flex items-center gap-3 text-white">
                        <Link
                            href={withBasePath("", "/conducteur/dashboard")}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Demandes de priere
                            </h1>
                            <p className="text-sm text-blue-100">
                                Vos demandes personnelles et les prières reçues
                                de votre classe.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                        <section className="rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                            <h2 className="text-lg font-bold text-slate-900">
                                Nouvelle demande
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                {authUser?.prenom} {authUser?.nom}, vous pouvez
                                toujours envoyer votre propre demande.
                            </p>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.post(
                                        withBasePath("", "/conducteur/prieres"),
                                        {
                                            sujet: subject,
                                            demande: message,
                                            mode_identite: "anonymous",
                                            nom_affiche: null,
                                        },
                                    );
                                }}
                                className="mt-4 space-y-3"
                            >
                                <input
                                    value={subject}
                                    onChange={(event) =>
                                        setSubject(event.target.value)
                                    }
                                    placeholder="Sujet"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                                <textarea
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    rows={5}
                                    placeholder="Votre demande"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
                                >
                                    <Send className="h-4 w-4" />
                                    Envoyer
                                </button>
                            </form>
                        </section>

                        <div className="grid gap-4">
                            <PrayerList
                                title="Demandes recues"
                                description="Prières ciblées vers vous ou vers les conducteurs de votre classe."
                                requests={inboxRequests}
                                commentDrafts={commentDrafts}
                                setCommentDrafts={setCommentDrafts}
                                routeBase={withBasePath(
                                    "",
                                    "/conducteur/prieres",
                                )}
                                readOnly
                            />
                            <PrayerList
                                title="Mes demandes"
                                description="Vos demandes personnelles avec leur commentaire d'exaucement."
                                requests={ownRequests}
                                commentDrafts={commentDrafts}
                                setCommentDrafts={setCommentDrafts}
                                routeBase={withBasePath(
                                    "",
                                    "/conducteur/prieres",
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
