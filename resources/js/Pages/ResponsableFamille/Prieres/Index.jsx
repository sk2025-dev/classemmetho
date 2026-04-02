import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    FileHeart,
    EyeOff,
    Eye,
    MessageSquare,
    PlusCircle,
    Send,
    UserRound,
} from "lucide-react";

function badgeClasses(status) {
    if (status === "Exaucement partage") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "Transmise") {
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function requestIdentityLabel(authUser, isAnonymous) {
    if (isAnonymous) {
        return "Anonyme";
    }

    const visibleName = [authUser?.prenom, authUser?.nom]
        .filter(Boolean)
        .join(" ")
        .trim();

    return visibleName || "Nom visible";
}

export default function ResponsableFamillePrieresIndex({
    authUser = null,
    prayerRequests = [],
}) {
    const [requests, setRequests] = useState(() => prayerRequests);
    const [activeTab, setActiveTab] = useState("all");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [identityMode, setIdentityMode] = useState("anonymous");
    const [visibleName, setVisibleName] = useState(
        [authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim(),
    );
    const [commentDrafts, setCommentDrafts] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestToFulfill, setRequestToFulfill] = useState(null);

    useEffect(() => {
        setRequests(prayerRequests);
    }, [prayerRequests]);

    const isAnonymous = identityMode === "anonymous";
    const visibleIdentity = requestIdentityLabel(authUser, false);

    const stats = useMemo(() => {
        const total = requests.length;
        const withComments = requests.filter(
            (request) => request.comments.length > 0,
        ).length;
        const anonymousCount = requests.filter(
            (request) => request.isAnonymous,
        ).length;

        return [
            {
                title: "Demandes",
                value: total,
                subtitle: "Demandes de priere deja formulees dans votre espace.",
                icon: FileHeart,
                iconWrapClass: "bg-sky-100 text-sky-700",
            },
            {
                title: "Exaucements",
                value: withComments,
                subtitle: "Demandes ayant deja recu un retour ou un temoignage.",
                icon: CheckCircle2,
                iconWrapClass: "bg-emerald-100 text-emerald-700",
            },
            {
                title: "Mode anonyme",
                value: anonymousCount,
                subtitle: "Demandes preservees sans affichage du nom et prenom.",
                icon: EyeOff,
                iconWrapClass: "bg-violet-100 text-violet-700",
            },
        ];
    }, [requests]);

    const tabs = useMemo(
        () => [
            { id: "all", label: "Total des demandes", count: requests.length },
            {
                id: "in_prayer",
                label: "En priere",
                count: requests.filter((request) =>
                    ["Transmise", "En priere"].includes(request.status),
                ).length,
            },
            {
                id: "fulfilled",
                label: "Exaucees",
                count: requests.filter(
                    (request) =>
                        request.status === "Exaucement partage" ||
                        request.comments.length > 0,
                ).length,
            },
        ],
        [requests],
    );

    const filteredRequests = useMemo(() => {
        if (activeTab === "in_prayer") {
            return requests.filter((request) =>
                ["Transmise", "En priere"].includes(request.status),
            );
        }

        if (activeTab === "fulfilled") {
            return requests.filter(
                (request) =>
                    request.status === "Exaucement partage" ||
                    request.comments.length > 0,
            );
        }

        return requests;
    }, [activeTab, requests]);

    const activeTabContent = useMemo(() => {
        if (activeTab === "in_prayer") {
            return {
                title: "Demandes en priere",
                description: "Retrouvez ici les demandes deja prises en charge et actuellement suivies dans la priere.",
            };
        }

        if (activeTab === "fulfilled") {
            return {
                title: "Demandes exaucees",
                description: "Retrouvez ici les demandes ayant deja recu un retour, un temoignage ou un commentaire.",
            };
        }

        return {
            title: "Total des demandes",
            description: "Retrouvez vos demandes, leur statut et ajoutez un commentaire en cas d'exaucement.",
        };
    }, [activeTab]);

    const resetForm = () => {
        setSubject("");
        setMessage("");
        setIdentityMode("anonymous");
        setVisibleName([authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim());
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const trimmedSubject = subject.trim();
        const trimmedMessage = message.trim();
        const trimmedVisibleName = visibleName.trim();

        if (
            !trimmedSubject ||
            !trimmedMessage ||
            (!isAnonymous && !trimmedVisibleName)
        ) {
            return;
        }

        router.post(
            "/responsable-famille/prieres",
            {
                sujet: trimmedSubject,
                demande: trimmedMessage,
                mode_identite: isAnonymous ? "anonymous" : "visible",
                nom_affiche: isAnonymous ? null : trimmedVisibleName,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
            },
        );
    };

    const handleCommentSubmit = (requestId) => {
        const draft = (commentDrafts[requestId] || "").trim();

        if (!draft) {
            return;
        }

        router.patch(
            `/responsable-famille/prieres/${requestId}/commentaire`,
            {
                temoignage: draft,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentDrafts((current) => ({
                        ...current,
                        [requestId]: "",
                    }));
                },
            },
        );
    };

    const handleMarkFulfilled = (requestId) => {
        router.patch(
            `/responsable-famille/prieres/${requestId}/exaucee`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRequestToFulfill(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="Prieres - Responsable Famille" />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Link
                                href="/responsable-famille/dashboard"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Demandes de priere
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Responsable de famille - formulez une demande de priere et suivez vos retours.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {stats.map((stat) => (
                            <div
                                key={stat.title}
                                className="flex h-full flex-col rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        {stat.title}
                                    </p>
                                    <span
                                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconWrapClass}`}
                                    >
                                        <stat.icon className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                                    {stat.value}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {stat.subtitle}
                                </p>
                            </div>
                        ))}
                    </div>

                    <section className="mt-8 overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.97)_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-4 py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                        {activeTabContent.title}
                                    </h2>
                                    <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
                                        {activeTabContent.description}
                                    </p>
                                </div>

                                <div className="flex w-full justify-center md:w-auto md:min-w-[240px] md:justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(13,148,136,0.22)] transition hover:bg-teal-700"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Nouvelle demande
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition ${
                                            isActive
                                                ? "border-blue-500 bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.30)]"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        </div>

                        <div className="px-4 py-4">
                            {filteredRequests.length === 0 ? (
                                <div className="rounded-[30px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-6 py-14 text-center">
                                    <p className="text-base font-semibold text-slate-900">
                                        Aucune demande de priere dans cet onglet.
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Ajustez le filtre ou utilisez le bouton en haut a droite pour creer une nouvelle demande.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredRequests.map((request) => (
                                        <article
                                            key={request.id}
                                            className="rounded-[24px] border border-slate-200/90 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
                                        >
                                            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-stretch">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses(
                                                                request.status,
                                                            )}`}
                                                        >
                                                            {request.status}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                            {request.isAnonymous ? (
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            )}
                                                            {request.authorLabel}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                                                            {request.createdAt}
                                                        </span>
                                                    </div>

                                                    <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900">
                                                        {request.subject}
                                                    </h3>
                                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                        {request.message}
                                                    </p>

                                                    <div className="mt-3.5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                                                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                                            <MessageSquare className="h-4 w-4 text-sky-700" />
                                                            Commentaires d'exaucement
                                                        </div>

                                                        <div className="mt-2.5 space-y-2.5">
                                                            {request.comments.length > 0 ? (
                                                                request.comments.map((comment, index) => (
                                                                    <div
                                                                        key={`${request.id}-${index}`}
                                                                        className="rounded-2xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-emerald-900 shadow-sm"
                                                                    >
                                                                        <div>{comment.message}</div>
                                                                        {comment.reactions?.length > 0 ? (
                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                {comment.reactions.map((reaction) => (
                                                                                    <span
                                                                                        key={`${request.id}-${index}-${reaction.emoji}`}
                                                                                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                                                    >
                                                                                        <span>{reaction.emoji}</span>
                                                                                        <span>{reaction.count}</span>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-500">
                                                                    Aucun commentaire ajoute pour le moment.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex h-full w-full flex-col rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-sm">
                                                    {request.comments.length > 0 ? (
                                                        <>
                                                            <p className="text-[13px] font-semibold text-slate-900">
                                                                Priere exaucee
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                                Votre commentaire a deja ete enregistre. Vous pouvez maintenant confirmer que cette priere est exaucee.
                                                            </p>

                                                            <button
                                                                type="button"
                                                                disabled={request.status === "Exaucement partage"}
                                                                onClick={() => setRequestToFulfill(request)}
                                                                className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)] transition ${
                                                                    request.status === "Exaucement partage"
                                                                        ? "cursor-not-allowed bg-slate-400 shadow-none"
                                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                                }`}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                {request.status === "Exaucement partage"
                                                                    ? "Priere deja exaucee"
                                                                    : "Marquer comme priere exaucee"}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-[13px] font-semibold text-slate-900">
                                                                Ajouter un retour
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                                Partagez un exaucement, une evolution ou un mot de gratitude.
                                                            </p>

                                                            <textarea
                                                                rows={5}
                                                                value={commentDrafts[request.id] || ""}
                                                                onChange={(event) =>
                                                                    setCommentDrafts((current) => ({
                                                                        ...current,
                                                                        [request.id]: event.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Ex: Merci, la situation a evolue favorablement..."
                                                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() => handleCommentSubmit(request.id)}
                                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Enregistrer le commentaire
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/55 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    Nouvelle demande
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    Envoyer une demande de priere
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Choisissez si votre nom est visible ou non avant l'envoi.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-full bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                            >
                                Fermer
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Visibilite de votre identite
                                </p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setIdentityMode("anonymous")}
                                        className={`rounded-[22px] border p-4 text-left transition ${
                                            isAnonymous
                                                ? "border-violet-600 bg-violet-600 text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <EyeOff className="h-4 w-4" />
                                            Rester anonyme
                                        </div>
                                        <p className="mt-2 text-sm leading-6 opacity-90">
                                            Votre demande est transmise sans afficher votre nom et prenom.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIdentityMode("visible")}
                                        className={`rounded-[22px] border p-4 text-left transition ${
                                            !isAnonymous
                                                ? "border-teal-600 bg-teal-600 text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <UserRound className="h-4 w-4" />
                                            Afficher mon nom
                                        </div>
                                        <p className="mt-2 text-sm leading-6 opacity-90">
                                            La demande est envoyee avec votre identite visible pour les pasteurs.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {!isAnonymous ? (
                                <div>
                                    <label className="text-sm font-semibold text-slate-800">
                                        Nom
                                    </label>
                                    <div className="relative mt-2">
                                        <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                                        <input
                                            type="text"
                                            value={visibleName}
                                            onChange={(event) => setVisibleName(event.target.value)}
                                            placeholder="Saisissez le nom a afficher"
                                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <label className="text-sm font-semibold text-slate-800">
                                    Sujet de priere
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(event) => setSubject(event.target.value)}
                                    placeholder="Ex: Sante, famille, travail, etudes..."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800">
                                    Demande
                                </label>
                                <textarea
                                    rows={4}
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder="Decrivez votre besoin de priere avec les details que vous souhaitez partager."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Apercu avant envoi
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Identite envoyee :{" "}
                                        <span className="font-semibold text-slate-900">
                                            {isAnonymous
                                                ? "Anonyme"
                                                : visibleName.trim() || visibleIdentity}
                                        </span>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                                >
                                    <Send className="h-4 w-4" />
                                    Envoyer la demande
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {requestToFulfill ? (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/55 p-4">
                    <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
                        <h3 className="text-lg font-bold text-slate-900">
                            Confirmer la priere exaucee
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Cette action marquera definitivement la priere comme exaucee et evitera tout doublon de confirmation.
                        </p>
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">{requestToFulfill.subject}</div>
                            <div className="mt-1 text-sm text-slate-600">{requestToFulfill.createdAt}</div>
                        </div>
                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={() => setRequestToFulfill(null)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
                            <button type="button" onClick={() => handleMarkFulfilled(requestToFulfill.id)} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Confirmer</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
