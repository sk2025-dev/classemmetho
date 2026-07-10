import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Select2Single from "../../../Components/Select2Single";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CornerDownRight,
    FileHeart,
    HeartHandshake,
    Eye,
    EyeOff,
    MessageSquare,
    PlusCircle,
    Send,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

function badgeClasses(status) {
    if (status === "Exaucement partage") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "Non exaucee") {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
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

function getMessagePreview(message) {
    const normalized = String(message || "").replace(/\s+/g, " ").trim();

    if (!normalized) {
        return "";
    }

    const [firstWord] = normalized.split(" ");

    return normalized === firstWord ? firstWord : `${firstWord}...`;
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

function isResolvedPrayer(status) {
    return ["Exaucement partage", "Non exaucee"].includes(status);
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
    const [expandedRequests, setExpandedRequests] = useState({});
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
    const [openThread, setOpenThread] = useState(null);
    const [visibleComments, setVisibleComments] = useState(5);
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
    useEffect(() => {
        setVisibleComments(5);
    }, [openThread]);

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
        const profileRequests = [...requests, ...receivedRequests];
        const receivedCount = receivedRequests.length;
        const inPrayerCount = profileRequests.filter(
            (request) => request.status === "En priere",
        ).length;
        const fulfilledCount = profileRequests.filter(
            (request) => request.status === "Exaucement partage",
        ).length;
        const unfulfilledCount = profileRequests.filter(
            (request) => request.status === "Non exaucee",
        ).length;
        const anonymousCount = profileRequests.filter(
            (request) => request.isAnonymous,
        ).length;

        return [
            {
                title: "Demandes recues",
                value: receivedCount,
                subtitle:
                    "Demandes de priere adressees a votre profil dans cet espace.",
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
                value: fulfilledCount,
                subtitle: "Demandes explicitement marquees comme exaucees.",
                icon: CheckCircle2,
                iconWrapClass: "bg-emerald-100 text-emerald-700",
            },
            {
                title: "Non exaucees",
                value: unfulfilledCount,
                subtitle: "Demandes explicitement marquees comme non exaucees.",
                icon: X,
                iconWrapClass: "bg-rose-100 text-rose-700",
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
    }, [receivedRequests, requests]);

    const tabs = useMemo(
        () => [
            { id: "all", label: "Total des demandes", count: scopedRequests.length },
            {
                id: "in_prayer",
                label: "En priere",
                count: scopedRequests.filter(
                    (request) => request.status === "En priere",
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
            {
                id: "unfulfilled",
                label: "Non exaucees",
                count: scopedRequests.filter(
                    (request) => request.status === "Non exaucee",
                ).length,
            },
        ],
        [scopedRequests],
    );

    const filteredRequests = useMemo(() => {
        if (activeTab === "in_prayer") {
            return scopedRequests.filter(
                (request) => request.status === "En priere",
            );
        }

        if (activeTab === "fulfilled") {
            return scopedRequests.filter(
                (request) =>
                    request.status === "Exaucement partage",
            );
        }

        if (activeTab === "unfulfilled") {
            return scopedRequests.filter(
                (request) => request.status === "Non exaucee",
            );
        }

        return scopedRequests;
    }, [activeTab, scopedRequests]);

    const REQUESTS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, scopeTab]);

    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * REQUESTS_PER_PAGE;
        return filteredRequests.slice(start, start + REQUESTS_PER_PAGE);
    }, [filteredRequests, currentPage]);

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
                description: "Retrouvez ici les demandes explicitement marquees comme exaucees.",
            };
        }

        if (activeTab === "unfulfilled") {
            return {
                title: "Demandes non exaucees",
                description: "Retrouvez ici les demandes explicitement marquees comme non exaucees.",
            };
        }

        return {
            title: "Total des demandes",
            description:
                "Retrouvez vos demandes, leur statut et ajoutez un commentaire en cas d'exaucement.",
        };
    }, [activeTab]);

    const syncRequestStatus = (requestId, status) => {
        const updater = (collection) =>
            collection.map((request) =>
                request.id === requestId ? { ...request, status } : request,
            );

        setRequests((current) => updater(current));
        setReceivedRequests((current) => updater(current));
    };

    const updateRequestStatus = (requestId, status) => {
        syncRequestStatus(requestId, status);

        router.patch(
            withBasePath("", `/conducteur/prieres/${requestId}/status`),
            { statut: status },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setRequests(prayerRequests.map(normalizeRequest));
                    setReceivedRequests(receivedPrayerRequests.map(normalizeRequest));
                },
            },
        );
    };

    const handleToggleDetails = (request) => {
        const isExpanded = Boolean(expandedRequests[request.id]);

        setExpandedRequests((current) => ({
            ...current,
            [request.id]: !isExpanded,
        }));
    };

    const currentThreadData = useMemo(() => {
        if (!openThread?.id) {
            return null;
        }

        return [...requests, ...receivedRequests].find(
            (request) => request.id === openThread.id,
        ) ?? null;
    }, [openThread, requests, receivedRequests]);

    const resetForm = () => {
        setSubject("");
        setMessage("");
        setIdentityMode("anonymous");
        setVisibleName([authUser?.prenom, authUser?.nom].filter(Boolean).join(" ").trim());
        setTargetType(targeting?.targetModes?.[0]?.value ?? "all_pasteurs");
        setTargetUserId("");
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
            withBasePath("", "/conducteur/prieres"),
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
            withBasePath("", `/conducteur/prieres/${requestId}/commentaire`),
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
            withBasePath("", `/conducteur/prieres/${requestId}/exaucee`),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRequestToFulfill(null);
                },
            },
        );
    };

    const handleMarkUnfulfilled = (requestId) => {
        router.patch(
            withBasePath("", `/conducteur/prieres/${requestId}/non-exaucee`),
            {},
            { preserveScroll: true },
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

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                                    {paginatedRequests.map((request) => (
                                        <article
                                            key={request.id}
                                            className="rounded-[20px] border border-slate-200/90 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
                                        >
                                            <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
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

                                                    <h3 className="mt-2.5 text-base font-bold tracking-tight text-slate-900">
                                                        {request.subject}
                                                    </h3>
                                                    <div className="mt-2">
                                                        {request.direction === "received" ? (
                                                            expandedRequests[request.id] ? (
                                                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                                                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                                                        {request.message}
                                                                    </p>
                                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleDetails(request)}
                                                                            className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                                                                        >
                                                                            Voir moins
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                request.status === "En priere" ||
                                                                                isResolvedPrayer(request.status)
                                                                            }
                                                                            onClick={() => updateRequestStatus(request.id, "En priere")}
                                                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                                                request.status === "En priere" ||
                                                                                isResolvedPrayer(request.status)
                                                                                    ? "cursor-not-allowed bg-emerald-100 text-emerald-700"
                                                                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                            }`}
                                                                        >
                                                                            <HeartHandshake className="h-3.5 w-3.5" />
                                                                            {request.status === "En priere" ||
                                                                            isResolvedPrayer(request.status)
                                                                                ? "Marquee comme en priere"
                                                                                : "Marquer comme en priere"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm italic text-slate-500">
                                                                        {getMessagePreview(request.message)}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleDetails(request)}
                                                                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                                                    >
                                                                        Voir plus
                                                                    </button>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <>
                                                                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                                                    {request.message}
                                                                </p>
                                                                {request.status === "En priere" ? (
                                                                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                                                        <HeartHandshake className="h-3.5 w-3.5" />
                                                                        Un destinataire prie pour cette demande
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
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
                                                </div>

                                                <div className="flex h-full w-full flex-col rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-sm">
                                                    <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3.5 shadow-sm">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                            Dernier commentaire
                                                        </p>
                                                        <p className="mt-2 text-sm leading-5 text-slate-600">
                                                            {request.comments.length > 0
                                                                ? request.comments[request.comments.length - 1]?.message
                                                                : "Aucun commentaire pour le moment."}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                request.direction === "received" &&
                                                                ["Nouvelle", "Vu", "Transmise"].includes(request.status)
                                                            ) {
                                                                updateRequestStatus(request.id, "En priere");
                                                            }

                                                            setOpenThread({
                                                                id: request.id,
                                                            });
                                                        }}
                                                        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[16px] bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        Faire un commentaire
                                                    </button>

                                                    {!isReadOnlyScope ? (
                                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isResolvedPrayer(request.status) ||
                                                                    request.comments.length === 0
                                                                }
                                                                onClick={() => setRequestToFulfill(request)}
                                                                className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-3.5 py-2.5 text-[13px] font-semibold text-white transition ${
                                                                    isResolvedPrayer(request.status) ||
                                                                    request.comments.length === 0
                                                                        ? "cursor-not-allowed bg-slate-400"
                                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                                }`}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                {request.status === "Exaucement partage"
                                                                    ? "Priere deja exaucee"
                                                                    : request.status === "Non exaucee"
                                                                      ? "Priere deja non exaucee"
                                                                      : "Marquer exaucee"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isResolvedPrayer(request.status)}
                                                                onClick={() => handleMarkUnfulfilled(request.id)}
                                                                className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-3.5 py-2.5 text-[13px] font-semibold text-white transition ${
                                                                    isResolvedPrayer(request.status)
                                                                        ? "cursor-not-allowed bg-slate-400"
                                                                        : "bg-rose-600 hover:bg-rose-700"
                                                                }`}
                                                            >
                                                                <X className="h-4 w-4" />
                                                                {request.status === "Non exaucee"
                                                                    ? "Priere deja non exaucee"
                                                                    : request.status === "Exaucement partage"
                                                                      ? "Priere deja exaucee"
                                                                      : "Marquer non exaucee"}
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {filteredRequests.length > REQUESTS_PER_PAGE ? (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Page {currentPage} sur {totalPages} ({filteredRequests.length} demande{filteredRequests.length > 1 ? "s" : ""})
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                            disabled={currentPage === 1}
                                            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                                currentPage === 1
                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            Precedent
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                                currentPage === totalPages
                                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            Suivant
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>
            </div>

            {openThread && currentThreadData ? (
                <div className="fixed inset-0 z-[9997] flex justify-end">
                    <div
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setOpenThread(null)}
                    />

                    <div className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-l-[28px] border-l border-slate-200 bg-[#f8fafc] shadow-[0_26px_64px_rgba(15,23,42,0.18)]">
                        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                                        Fil de discussion
                                    </p>
                                    <h3 className="truncate text-[17px] font-bold text-slate-900">
                                        {currentThreadData.subject}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClasses(
                                                currentThreadData.status,
                                            )}`}
                                        >
                                            {currentThreadData.status}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {currentThreadData.authorLabel}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOpenThread(null)}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto px-6 py-6"
                            style={{
                                backgroundColor: "#e9f0e8",
                                backgroundImage:
                                    "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.55) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(15,23,42,0.03) 2px, transparent 0), linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
                                backgroundSize: "100px 100px, 100px 100px, 100% 100%",
                                backgroundPosition: "0 0, 0 0, 0 0",
                            }}
                        >
                            <div className="mb-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Sujet de priere
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {currentThreadData.subject}
                                </p>
                                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Demande
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                    {currentThreadData.message}
                                </p>
                            </div>

                            {currentThreadData.comments.length > visibleComments ? (
                                <div className="mb-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleComments((prev) => prev + 10)}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                        Voir les messages precedents
                                    </button>
                                </div>
                            ) : null}

                            <div className="mb-3 flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Echanges
                                </span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <div className="space-y-5">
                                {currentThreadData.comments.length > 0 ? (
                                    currentThreadData.comments
                                        .slice(-visibleComments)
                                        .map((comment, index) => (
                                            <div
                                                key={`${openThread.id}-c-${comment.id ?? index}`}
                                                className={`flex ${commentRowClasses(comment.actorType)}`}
                                            >
                                                <div className="max-w-[88%]">
                                                    {comment.replyTo ? (
                                                        <div className="mb-2 rounded-[10px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                {comment.replyTo.actorLabel}
                                                            </p>
                                                            <p className="line-clamp-1 text-[11px] text-slate-600">
                                                                {formatReplySnippet(comment.replyTo.message)}
                                                            </p>
                                                        </div>
                                                    ) : null}

                                                    <div
                                                        className={`rounded-[12px] border px-4 py-3.5 shadow-sm ${commentCardClasses(
                                                            comment.actorType,
                                                        )}`}
                                                    >
                                                        <p className="whitespace-pre-wrap text-sm leading-6">
                                                            {comment.message}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`mt-2 flex items-center gap-3 px-1 ${commentRowClasses(
                                                            comment.actorType,
                                                        )}`}
                                                    >
                                                        <span className="text-[11px] text-slate-500">
                                                            {comment.actorLabel}
                                                            {comment.createdAt ? ` - ${comment.createdAt}` : ""}
                                                        </span>
                                                        {currentThreadData.canComment ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReplyTargets((current) => ({
                                                                        ...current,
                                                                        [openThread.id]: comment.id,
                                                                    }))
                                                                }
                                                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700"
                                                            >
                                                                <CornerDownRight className="h-3 w-3" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                        Aucun commentaire pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentThreadData.canComment ? (
                            <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f8fb_100%)] px-5 py-4">
                                {replyTargets[openThread.id] ? (
                                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-700">
                                                Reponse a {currentThreadData.comments.find((comment) => comment.id === replyTargets[openThread.id])?.actorLabel}
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {formatReplySnippet(
                                                    currentThreadData.comments.find((comment) => comment.id === replyTargets[openThread.id])?.message,
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReplyTargets((current) => ({
                                                    ...current,
                                                    [openThread.id]: null,
                                                }))
                                            }
                                            className="ml-2 rounded-full p-1 text-slate-400 transition hover:text-slate-700"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : null}

                                <div className="flex items-end gap-3">
                                    <textarea
                                        rows={2}
                                        value={commentDrafts[openThread.id] || ""}
                                        onChange={(event) =>
                                            setCommentDrafts((current) => ({
                                                ...current,
                                                [openThread.id]: event.target.value,
                                            }))
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                                event.preventDefault();
                                                handleCommentSubmit(openThread.id);
                                            }
                                        }}
                                        placeholder="Ecrire un commentaire..."
                                        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCommentSubmit(openThread.id)}
                                        disabled={!commentDrafts[openThread.id]?.trim()}
                                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:opacity-30 disabled:shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        disabled={
                                            isResolvedPrayer(currentThreadData.status) ||
                                            currentThreadData.comments.length === 0
                                        }
                                        onClick={() => setRequestToFulfill(currentThreadData)}
                                        className={`inline-flex min-h-[56px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                                            isResolvedPrayer(currentThreadData.status) ||
                                            currentThreadData.comments.length === 0
                                                ? "cursor-not-allowed bg-slate-400"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {currentThreadData.status === "Exaucement partage"
                                            ? "Priere deja exaucee"
                                            : currentThreadData.status === "Non exaucee"
                                              ? "Priere deja non exaucee"
                                              : "Marquer comme priere exaucee"}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isResolvedPrayer(currentThreadData.status)}
                                        onClick={() =>
                                            handleMarkUnfulfilled(currentThreadData.id)
                                        }
                                        className={`inline-flex min-h-[56px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                                            isResolvedPrayer(currentThreadData.status)
                                                ? "cursor-not-allowed bg-slate-400"
                                                : "bg-rose-600 hover:bg-rose-700"
                                        }`}
                                    >
                                        <X className="h-4 w-4" />
                                        {currentThreadData.status === "Non exaucee"
                                            ? "Priere deja non exaucee"
                                            : currentThreadData.status === "Exaucement partage"
                                              ? "Priere deja exaucee"
                                              : "Marquer non exaucee"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-[12px] text-slate-500">
                                Cette demande est affichee en lecture seule dans cet espace.
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

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

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Visibilite de votre identite
                                </p>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setIdentityMode("anonymous")}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                                            isAnonymous
                                                ? "border-violet-500 bg-violet-50 text-violet-900"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <EyeOff className="h-4 w-4" />
                                            Rester anonyme
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Votre demande est transmise sans afficher votre nom et prenom.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIdentityMode("visible")}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                                            !isAnonymous
                                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <UserRound className="h-4 w-4" />
                                            Afficher mon nom
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Votre nom sera visible par les destinataires de cette priere.
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
                                    onChange={(event) => setSubject(event.target.value)}
                                    maxLength={40}
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
                                    onChange={(event) => setMessage(event.target.value)}
                                    required
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
