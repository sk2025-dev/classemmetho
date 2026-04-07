import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Select2Single from "../../../Components/Select2Single";
import {
    ArrowLeft,
    CheckCircle2,
    FileHeart,
    HeartHandshake,
    Eye,
    EyeOff,
    MessageSquare,
    PlusCircle,
    Send,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

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

function formatReplySnippet(message) {
    const normalized = String(message || "").trim();

    if (normalized.length <= 90) {
        return normalized;
    }

    return `${normalized.slice(0, 90)}...`;
}

function commentRowClasses(actorType) {
    return actorType === "requester" ? "justify-end" : "justify-start";
}

function commentCardClasses(actorType) {
    if (actorType === "requester") {
        return "border-emerald-200 bg-emerald-50 text-emerald-950";
    }

    if (actorType === "pastor") {
        return "border-sky-200 bg-sky-50 text-sky-950";
    }

    return "border-slate-200 bg-white text-slate-900";
}

const DEFAULT_TARGET_MODES = [
    {
        value: "all_pasteurs",
        label: "Tous les pasteurs",
        description: "La priere sera visible par tous les pasteurs de toutes les classes.",
    },
    {
        value: "specific_pasteur",
        label: "Un pasteur specifique",
        description: "Choisissez un pasteur precis.",
    },
    {
        value: "all_conducteurs_classe",
        label: "Les conducteurs de ma classe",
        description: "La priere sera visible par les conducteurs de votre classe.",
    },
    {
        value: "specific_conducteur_classe",
        label: "Un conducteur de ma classe",
        description: "Choisissez un conducteur precis de votre classe.",
    },
    {
        value: "specific_membre_classe",
        label: "Un membre de ma classe",
        description: "Choisissez un membre precis de votre classe.",
    },
];

export default function ConducteurPrieresIndex({
    authUser = null,
    prayerRequests = [],
    receivedPrayerRequests = [],
    targeting = null,
}) {
    const normalizeRequest = (request) => ({
        ...request,
        comments:
            request.comments ??
            (request.testimony
                ? [{ message: request.testimony, reactions: request.reactions ?? [] }]
                : []),
        history: request.history ?? [],
        sourceLabel: request.sourceLabel ?? null,
        targetLabel: request.targetLabel ?? null,
    });

    const [requests, setRequests] = useState(() => prayerRequests.map(normalizeRequest));
    const [receivedRequests, setReceivedRequests] = useState(() =>
        receivedPrayerRequests.map(normalizeRequest),
    );
    const [scopeTab, setScopeTab] = useState("mine");
    const [activeTab, setActiveTab] = useState("all");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [identityMode, setIdentityMode] = useState("anonymous");
    const [visibleName, setVisibleName] = useState(
        [authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim(),
    );
    const [commentDrafts, setCommentDrafts] = useState({});
    const [replyTargets, setReplyTargets] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestToFulfill, setRequestToFulfill] = useState(null);
    const [targetType, setTargetType] = useState(
        targeting?.targetModes?.[0]?.value ?? "all_pasteurs",
    );
    const [targetUserId, setTargetUserId] = useState("");

    useEffect(() => {
        setRequests(prayerRequests.map(normalizeRequest));
    }, [prayerRequests]);
    useEffect(() => {
        setReceivedRequests(receivedPrayerRequests.map(normalizeRequest));
    }, [receivedPrayerRequests]);
    useEffect(() => {
        if (!targeting?.targetModes?.length) {
            return;
        }

        setTargetType((current) =>
            current || targeting.targetModes[0]?.value || "all_pasteurs",
        );
    }, [targeting]);

    const isAnonymous = identityMode === "anonymous";
    const visibleIdentity = requestIdentityLabel(authUser, false);
    const scopedRequests = scopeTab === "received" ? receivedRequests : requests;
    const isReadOnlyScope = scopeTab === "received";
    const currentTargetOptions = useMemo(() => {
        if (targetType === "specific_pasteur") return targeting?.pastors ?? [];
        if (targetType === "specific_conducteur_classe") return targeting?.conductors ?? [];
        if (targetType === "specific_membre_classe") return targeting?.members ?? [];
        return [];
    }, [targetType, targeting]);
    const selectedTargetMode = useMemo(
        () =>
            (targeting?.targetModes ?? DEFAULT_TARGET_MODES).find(
                (mode) => mode.value === targetType,
            ) ??
            null,
        [targetType, targeting],
    );
    const targetModeOptions = useMemo(
        () =>
            (targeting?.targetModes?.length
                ? targeting.targetModes
                : DEFAULT_TARGET_MODES
            ).map((mode) => ({
                value: mode.value,
                label: mode.label,
                description: mode.description,
            })),
        [targeting],
    );
    const targetUserOptions = useMemo(
        () =>
            currentTargetOptions.map((option) => ({
                value: option.id,
                label: option.label,
            })),
        [currentTargetOptions],
    );

    const stats = useMemo(() => {
        const total = scopedRequests.length;
        const inPrayerCount = scopedRequests.filter((request) =>
            ["Transmise", "En priere"].includes(request.status),
        ).length;
        const fulfilledCount = scopedRequests.filter(
            (request) => request.status === "Exaucement partage",
        ).length;
        const anonymousCount = scopedRequests.filter(
            (request) => request.isAnonymous,
        ).length;

        return [
            {
                title: "Demandes",
                value: total,
                subtitle:
                    "Demandes de priere deja formulees dans votre espace.",
                icon: FileHeart,
                iconWrapClass: "bg-sky-100 text-sky-700",
            },
            {
                title: "En priere",
                value: inPrayerCount,
                subtitle:
                    "Demandes actuellement en cours de prise en charge pastorale.",
                icon: HeartHandshake,
                iconWrapClass: "bg-blue-100 text-blue-700",
            },
            {
                title: "Exaucements",
<<<<<<< HEAD
                value: withComments,
                subtitle:
                    "Demandes ayant deja recu un retour ou un temoignage.",
=======
                value: fulfilledCount,
                subtitle: "Demandes explicitement marquees comme exaucees.",
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                icon: CheckCircle2,
                iconWrapClass: "bg-emerald-100 text-emerald-700",
            },
            {
                title: "Mode anonyme",
                value: anonymousCount,
                subtitle:
                    "Demandes preservees sans affichage du nom et prenom.",
                icon: EyeOff,
                iconWrapClass: "bg-violet-100 text-violet-700",
            },
        ];
    }, [scopedRequests]);

    const tabs = useMemo(
        () => [
            { id: "all", label: "Total des demandes", count: scopedRequests.length },
            {
                id: "in_prayer",
                label: "En priere",
                count: scopedRequests.filter((request) =>
                    ["Transmise", "En priere"].includes(request.status),
                ).length,
            },
            {
                id: "fulfilled",
                label: "Exaucees",
                count: scopedRequests.filter(
                    (request) =>
                    request.status === "Exaucement partage",
                ).length,
            },
        ],
        [scopedRequests],
    );

    const filteredRequests = useMemo(() => {
        if (activeTab === "in_prayer") {
            return scopedRequests.filter((request) =>
                ["Transmise", "En priere"].includes(request.status),
            );
        }

        if (activeTab === "fulfilled") {
            return scopedRequests.filter(
                (request) =>
                    request.status === "Exaucement partage",
            );
        }

        return scopedRequests;
    }, [activeTab, scopedRequests]);

    const activeTabContent = useMemo(() => {
        if (activeTab === "in_prayer") {
            return {
                title: "Demandes en priere",
                description:
                    "Retrouvez ici les demandes deja prises en charge et actuellement suivies dans la priere.",
            };
        }

        if (activeTab === "fulfilled") {
            return {
                title: "Demandes exaucees",
<<<<<<< HEAD
                description:
                    "Retrouvez ici les demandes ayant deja recu un retour, un temoignage ou un commentaire.",
=======
                description: "Retrouvez ici les demandes explicitement marquees comme exaucees.",
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
            };
        }

        return {
            title: "Total des demandes",
            description:
                "Retrouvez vos demandes, leur statut et ajoutez un commentaire en cas d'exaucement.",
        };
    }, [activeTab]);

    const resetForm = () => {
        setSubject("");
        setMessage("");
        setIdentityMode("anonymous");
<<<<<<< HEAD
        setVisibleName(
            [authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim(),
        );
=======
        setVisibleName([authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim());
        setTargetType(targeting?.targetModes?.[0]?.value ?? "all_pasteurs");
        setTargetUserId("");
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
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
            "/conducteur/prieres",
            {
                sujet: trimmedSubject,
                demande: trimmedMessage,
                mode_identite: isAnonymous ? "anonymous" : "visible",
                nom_affiche: isAnonymous ? null : trimmedVisibleName,
                type_cible: targetType,
                user_cible_id:
                    currentTargetOptions.length > 0 && targetUserId
                        ? Number(targetUserId)
                        : null,
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
            `/conducteur/prieres/${requestId}/commentaire`,
            {
                temoignage: draft,
                reply_to_comment_id: replyTargets[requestId] ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentDrafts((current) => ({
                        ...current,
                        [requestId]: "",
                    }));
                    setReplyTargets((current) => ({
                        ...current,
                        [requestId]: null,
                    }));
                },
            },
        );
    };

    const handleMarkFulfilled = (requestId) => {
        router.patch(
            `/conducteur/prieres/${requestId}/exaucee`,
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
            <Head title="Prieres - Conducteur" />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                                    Conducteur - formulez une demande de priere
                                    et suivez vos retours.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <div className="mb-4 flex flex-wrap gap-2">
                                {[
                                    { id: "mine", label: "Mes demandes", count: requests.length },
                                    { id: "received", label: "Demandes recues", count: receivedRequests.length },
                                ].map((tab) => {
                                    const isActive = scopeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setScopeTab(tab.id);
                                                setActiveTab("all");
                                            }}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition ${
                                                isActive
                                                    ? "border-teal-500 bg-teal-600 text-white shadow-[0_12px_28px_rgba(13,148,136,0.30)]"
                                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
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
                                    {!isReadOnlyScope ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(true)}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(13,148,136,0.22)] transition hover:bg-teal-700"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Nouvelle demande
                                        </button>
                                    ) : null}
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
                                        Aucune demande de priere dans cet
                                        onglet.
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Ajustez le filtre ou utilisez le bouton
                                        en haut a droite pour creer une nouvelle
                                        demande.
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
                                                            {
                                                                request.authorLabel
                                                            }
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
                                                    {request.sourceLabel ? (
                                                        <div className="mt-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                                            Source: {request.sourceLabel}
                                                        </div>
                                                    ) : null}
                                                    {request.targetLabel ? (
                                                        <div className="mt-3 inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                                                            Cible: {request.targetLabel}
                                                        </div>
                                                    ) : null}

                                                    <div className="mt-3.5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                                                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                                            <MessageSquare className="h-4 w-4 text-sky-700" />
                                                            Commentaires
                                                            d'exaucement
                                                        </div>

                                                        <div className="mt-2.5 space-y-2.5">
<<<<<<< HEAD
                                                            {request.comments
                                                                .length > 0 ? (
                                                                request.comments.map(
                                                                    (
                                                                        comment,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={`${request.id}-${index}`}
                                                                            className="rounded-2xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-emerald-900 shadow-sm"
                                                                        >
                                                                            <div>
                                                                                {
                                                                                    comment.message
                                                                                }
                                                                            </div>
                                                                            {comment
                                                                                .reactions
                                                                                ?.length >
                                                                            0 ? (
                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                    {comment.reactions.map(
                                                                                        (
                                                                                            reaction,
                                                                                        ) => (
                                                                                            <span
                                                                                                key={`${request.id}-${index}-${reaction.emoji}`}
                                                                                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                                                            >
                                                                                                <span>
                                                                                                    {
                                                                                                        reaction.emoji
                                                                                                    }
                                                                                                </span>
                                                                                                <span>
                                                                                                    {
                                                                                                        reaction.count
                                                                                                    }
                                                                                                </span>
                                                                                            </span>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    ),
                                                                )
=======
                                                            {request.comments.length > 0 ? (
                                                                request.comments.map((comment, index) => (
                                                                    <div key={`${request.id}-${index}`} className={`flex ${commentRowClasses(comment.actorType)}`}>
                                                                        <div className={`w-full max-w-[88%] rounded-[22px] border px-3.5 py-3 text-sm leading-6 shadow-sm ${commentCardClasses(comment.actorType)}`}>
                                                                            {comment.replyTo ? (
                                                                                <div className="mb-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600">
                                                                                    <div className="font-semibold text-slate-800">
                                                                                        Reponse a {comment.replyTo.actorLabel}
                                                                                    </div>
                                                                                    <div>{formatReplySnippet(comment.replyTo.message)}</div>
                                                                                </div>
                                                                            ) : null}
                                                                            <div>{comment.message}</div>
                                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                                                <span className="font-semibold">
                                                                                    {comment.actorLabel}
                                                                                </span>
                                                                                {comment.createdAt ? (
                                                                                    <span className="opacity-80">
                                                                                        {comment.createdAt}
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                            {comment.reactions?.length > 0 ? (
                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                    {comment.reactions.map((reaction) => (
                                                                                        <span
                                                                                            key={`${request.id}-${index}-${reaction.emoji}`}
                                                                                            className="inline-flex items-center gap-1.5 rounded-full border border-current/10 bg-white/70 px-2.5 py-1 text-xs font-semibold"
                                                                                        >
                                                                                            <span>{reaction.emoji}</span>
                                                                                            <span>{reaction.count}</span>
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : null}
                                                                            {!isReadOnlyScope ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setReplyTargets((current) => ({
                                                                                            ...current,
                                                                                            [request.id]: comment.id,
                                                                                        }))
                                                                                    }
                                                                                    className="mt-3 text-xs font-semibold text-blue-700 transition hover:text-blue-800"
                                                                                >
                                                                                    Repondre
                                                                                </button>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                ))
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                                            ) : (
                                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-500">
                                                                    Aucun
                                                                    commentaire
                                                                    ajoute pour
                                                                    le moment.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex h-full w-full flex-col rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-sm">
<<<<<<< HEAD
                                                    {request.comments.length >
                                                    0 ? (
=======
                                                    {isReadOnlyScope ? (
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                                        <>
                                                            <p className="text-[13px] font-semibold text-slate-900">
                                                                Consultation
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
<<<<<<< HEAD
                                                                Votre
                                                                commentaire a
                                                                deja ete
                                                                enregistre. Vous
                                                                pouvez
                                                                maintenant
                                                                confirmer que
                                                                cette priere est
                                                                exaucee.
                                                            </p>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    request.status ===
                                                                    "Exaucement partage"
                                                                }
                                                                onClick={() =>
                                                                    setRequestToFulfill(
                                                                        request,
                                                                    )
                                                                }
                                                                className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)] transition ${
                                                                    request.status ===
                                                                    "Exaucement partage"
                                                                        ? "cursor-not-allowed bg-slate-400 shadow-none"
                                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                                }`}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                {request.status ===
                                                                "Exaucement partage"
                                                                    ? "Priere deja exaucee"
                                                                    : "Marquer comme priere exaucee"}
                                                            </button>
=======
                                                                Cette demande vous a ete transmise et reste en lecture seule ici.
                                                            </p>
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-[13px] font-semibold text-slate-900">
<<<<<<< HEAD
                                                                Ajouter un
                                                                retour
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                                Partagez un
                                                                exaucement, une
                                                                evolution ou un
                                                                mot de
                                                                gratitude.
=======
                                                                Ajouter un commentaire
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                                Vous pouvez ajouter autant de commentaires que necessaire. Chaque ajout garde sa date.
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                                            </p>

                                                            {replyTargets[request.id] ? (
                                                                <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm text-blue-900">
                                                                    <div className="font-semibold">Reponse ciblee</div>
                                                                    <div className="mt-1 text-xs text-blue-800">
                                                                        {
                                                                            request.comments.find((comment) => comment.id === replyTargets[request.id])?.actorLabel
                                                                        }
                                                                    </div>
                                                                    <div className="mt-1 text-xs leading-5 text-blue-700">
                                                                        {formatReplySnippet(
                                                                            request.comments.find((comment) => comment.id === replyTargets[request.id])?.message,
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setReplyTargets((current) => ({
                                                                                ...current,
                                                                                [request.id]: null,
                                                                            }))
                                                                        }
                                                                        className="mt-2 text-xs font-semibold text-blue-700 transition hover:text-blue-800"
                                                                    >
                                                                        Annuler la reponse
                                                                    </button>
                                                                </div>
                                                            ) : null}

                                                            <textarea
                                                                rows={5}
                                                                value={
                                                                    commentDrafts[
                                                                        request
                                                                            .id
                                                                    ] || ""
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setCommentDrafts(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            [request.id]:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="Ex: Merci, la situation a evolue favorablement..."
                                                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCommentSubmit(
                                                                        request.id,
                                                                    )
                                                                }
                                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Enregistrer le
                                                                commentaire
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    request.status === "Exaucement partage" ||
                                                                    request.comments.length === 0
                                                                }
                                                                onClick={() => setRequestToFulfill(request)}
                                                                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)] transition ${
                                                                    request.status === "Exaucement partage" ||
                                                                    request.comments.length === 0
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
                                    Choisissez si votre nom est visible ou non
                                    avant l'envoi.
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

<<<<<<< HEAD
                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 space-y-5"
                        >
=======
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Visibilite de votre identite
                                </p>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <button
                                        type="button"
<<<<<<< HEAD
                                        onClick={() =>
                                            setIdentityMode("anonymous")
                                        }
                                        className={`rounded-[22px] border p-4 text-left transition ${
=======
                                        onClick={() => setIdentityMode("anonymous")}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                            isAnonymous
                                                ? "border-violet-500 bg-violet-50 text-violet-900"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <EyeOff className="h-4 w-4" />
                                            Rester anonyme
                                        </div>
<<<<<<< HEAD
                                        <p className="mt-2 text-sm leading-6 opacity-90">
                                            Votre demande est transmise sans
                                            afficher votre nom et prenom.
=======
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Votre demande est transmise sans afficher votre nom et prenom.
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                        </p>
                                    </button>

                                    <button
                                        type="button"
<<<<<<< HEAD
                                        onClick={() =>
                                            setIdentityMode("visible")
                                        }
                                        className={`rounded-[22px] border p-4 text-left transition ${
=======
                                        onClick={() => setIdentityMode("visible")}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                            !isAnonymous
                                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <UserRound className="h-4 w-4" />
                                            Afficher mon nom
                                        </div>
<<<<<<< HEAD
                                        <p className="mt-2 text-sm leading-6 opacity-90">
                                            La demande est envoyee avec votre
                                            identite visible pour les pasteurs.
=======
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Votre nom sera visible par les destinataires de cette priere.
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
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
                                            onChange={(event) =>
                                                setVisibleName(
                                                    event.target.value,
                                                )
                                            }
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
<<<<<<< HEAD
                                    onChange={(event) =>
                                        setSubject(event.target.value)
                                    }
=======
                                    onChange={(event) => setSubject(event.target.value)}
                                    maxLength={40}
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                    placeholder="Ex: Sante, famille, travail, etudes..."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    40 caracteres maximum.
                                </p>
                            </div>

                            <div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        A qui envoyer cette priere ?
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-slate-600">
                                        Vous pouvez l envoyer a un pasteur precis, a tous les
                                        pasteurs, a un conducteur precis de votre classe, aux
                                        conducteurs de votre classe, ou a un membre precis de
                                        votre classe.
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <label className="text-sm font-semibold text-slate-800">
                                        Destinataire
                                    </label>
                                    <div className="mt-2">
                                        <Select2Single
                                            name="target_type"
                                            value={targetType}
                                            onChange={(event) => {
                                                setTargetType(event.target.value);
                                                setTargetUserId("");
                                            }}
                                            options={targetModeOptions}
                                            placeholder="Selectionnez un destinataire"
                                            isClearable={false}
                                            allowClearOption={false}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        {selectedTargetMode?.description ??
                                            "Choisissez la cible de votre demande avant l envoi."}
                                    </p>
                                </div>
                            </div>

                            {currentTargetOptions.length > 0 ? (
                                <div>
                                    <label className="text-sm font-semibold text-slate-800">
                                        Choix precis du destinataire
                                    </label>
                                    <div className="mt-2">
                                        <Select2Single
                                            name="target_user_id"
                                            value={targetUserId}
                                            onChange={(event) => setTargetUserId(event.target.value)}
                                            options={targetUserOptions}
                                            placeholder="Selectionnez la personne concernee"
                                            isClearable
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Ce champ apparait seulement quand vous choisissez un
                                        destinataire unique.
                                    </p>
                                </div>
                            ) : null}

                            <div>
                                <label className="text-sm font-semibold text-slate-800">
                                    Details du sujet de priere *
                                </label>
                                <textarea
                                    rows={4}
                                    value={message}
<<<<<<< HEAD
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
=======
                                    onChange={(event) => setMessage(event.target.value)}
                                    required
>>>>>>> add0da1ba6e02c1b4547f1fd93fc2e7958b75869
                                    placeholder="Decrivez votre besoin de priere avec les details que vous souhaitez partager."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Resume
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Identite :{" "}
                                        <span className="font-semibold text-slate-900">
                                            {isAnonymous
                                                ? "Anonyme"
                                                : visibleName.trim() ||
                                                  visibleIdentity}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Destinataire :{" "}
                                        <span className="font-semibold text-slate-900">
                                            {currentTargetOptions.length > 0
                                                ? targetUserOptions.find(
                                                      (option) =>
                                                          String(option.value) ===
                                                          String(targetUserId),
                                                  )?.label ||
                                                  "Selection precise requise"
                                                : selectedTargetMode?.label ||
                                                  "Destinataire non precise"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end">
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
                            Cette action marquera definitivement la priere comme
                            exaucee et evitera tout doublon de confirmation.
                        </p>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">
                                {requestToFulfill.subject}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                                {requestToFulfill.createdAt}
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setRequestToFulfill(null)}
                                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleMarkFulfilled(requestToFulfill.id)
                                }
                                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
