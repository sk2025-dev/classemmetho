import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCheck,
    Clock3,
    Eye,
    EyeOff,
    HeartHandshake,
    MessageSquareHeart,
    ShieldCheck,
    X,
    Send,
    CornerDownRight,
    ChevronUp,
    SmilePlus,
} from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

function normalizeRequests(prayerRequests = []) {
    return prayerRequests.map((request, index) => ({
        id: request.id ?? `request-${index + 1}`,
        subject: request.subject ?? "Sans sujet",
        message: request.message ?? "",
        authorLabel: request.authorLabel ?? "Anonyme",
        isAnonymous: Boolean(request.isAnonymous),
        sourceLabel: request.sourceLabel ?? "Demande recue",
        status: request.status ?? "Nouvelle",
        createdAt: request.createdAt ?? "",
        testimony: request.testimony ?? "",
        comments: request.comments ?? [],
        canComment: Boolean(request.canComment),
    }));
}

const AVAILABLE_REACTIONS = ["🙏", "❤️", "🙌", "😊", "🔥"];

function statusBadgeClass(status) {
    if (status === "Exaucement" || status === "Exaucement partage") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }
    if (status === "En priere") {
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    }
    if (status === "Vu") {
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    }
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
}

function getMessagePreview(message) {
    const normalized = String(message || "")
        .replace(/\s+/g, " ")
        .trim();
    if (!normalized) return "";

    const [firstWord] = normalized.split(" ");
    if (!firstWord) return "";

    return normalized === firstWord ? firstWord : `${firstWord}...`;
}

function formatReplySnippet(message) {
    const normalized = String(message || "").trim();
    if (normalized.length <= 90) return normalized;
    return `${normalized.slice(0, 90)}...`;
}

function statusAccent(status) {
    if (status === "Exaucement" || status === "Exaucement partage") {
        return "from-emerald-500/15 via-emerald-500/5 to-transparent";
    }
    if (status === "En priere") {
        return "from-sky-500/15 via-sky-500/5 to-transparent";
    }
    if (status === "Vu") {
        return "from-amber-500/15 via-amber-500/5 to-transparent";
    }
    return "from-violet-500/15 via-violet-500/5 to-transparent";
}

function getStatusConfig(status) {
    if (status === "Exaucement" || status === "Exaucement partage") {
        return {
            dot: "#10b981",
            badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
            bar: "#10b981",
        };
    }
    if (status === "En priere") {
        return {
            dot: "#60a5fa",
            badge: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
            bar: "#60a5fa",
        };
    }
    if (status === "Vu") {
        return {
            dot: "#f59e0b",
            badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
            bar: "#f59e0b",
        };
    }
    return {
        dot: "#a78bfa",
        badge: "bg-violet-100 text-violet-800 ring-1 ring-violet-300",
        bar: "#a78bfa",
    };
}

export default function PasteurPrieresIndex({ prayerRequests = [] }) {
    const [requests, setRequests] = useState(() =>
        normalizeRequests(prayerRequests),
    );
    const [activeTab, setActiveTab] = useState("all");
    const [commentDrafts, setCommentDrafts] = useState({});
    const [expandedRequests, setExpandedRequests] = useState({});
    const [replyTargets, setReplyTargets] = useState({});

    // Nouveaux états pour le Drawer et la pagination des commentaires
    const [openThread, setOpenThread] = useState(null);
    const [visibleComments, setVisibleComments] = useState(5);
    const [showReactionPicker, setShowReactionPicker] = useState(null);

    useEffect(() => {
        setRequests(normalizeRequests(prayerRequests));
    }, [prayerRequests]);

    // Réinitialiser la pagination et le picker quand on change de fil
    useEffect(() => {
        setVisibleComments(5);
        setShowReactionPicker(null);
    }, [openThread]);

    const stats = useMemo(() => {
        const total = requests.length;
        const inPrayer = requests.filter(
            (r) => r.status === "En priere",
        ).length;
        const fulfilledCount = requests.filter(
            (r) =>
                r.status === "Exaucement" || r.status === "Exaucement partage",
        ).length;
        const anonymousCount = requests.filter((r) => r.isAnonymous).length;

        return [
            {
                title: "Demandes recues",
                value: total,
                subtitle:
                    "Toutes les demandes de priere recues depuis les differents espaces.",
                icon: MessageSquareHeart,
                iconClass: "bg-sky-100 text-sky-700",
            },
            {
                title: "En priere",
                value: inPrayer,
                subtitle:
                    "Demandes actuellement suivies dans la priere pastorale.",
                icon: HeartHandshake,
                iconClass: "bg-blue-100 text-blue-700",
            },
            {
                title: "Mode anonyme",
                value: anonymousCount,
                subtitle:
                    "Demandes preservees sans affichage du nom et prenom.",
                icon: EyeOff,
                iconClass: "bg-violet-100 text-violet-700",
            },
            {
                title: "Exaucements",
                value: fulfilledCount,
                subtitle: "Demandes explicitement marquees comme exaucees.",
                icon: CheckCheck,
                iconClass: "bg-emerald-100 text-emerald-700",
            },
        ];
    }, [requests]);

    const syncRequestStatus = (requestId, status) => {
        setRequests((current) =>
            current.map((request) =>
                request.id === requestId ? { ...request, status } : request,
            ),
        );
    };

    const updateRequestStatus = (requestId, status, e) => {
        e?.stopPropagation();
        syncRequestStatus(requestId, status);
        router.patch(
            withBasePath("", `/pasteur/prieres/${requestId}/status`),
            { statut: status },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    router.reload({
                        only: ["prayerRequests"],
                        preserveScroll: true,
                    });
                },
                onError: () => {
                    setRequests(normalizeRequests(prayerRequests));
                },
            },
        );
    };

    const toggleReaction = (requestId, commentId, emoji) => {
        router.patch(
            withBasePath("", `/pasteur/prieres/${requestId}/reaction`),
            { comment_id: commentId, emoji },
            { preserveScroll: true },
        );
        setShowReactionPicker(null);
    };

    const submitComment = (requestId) => {
        const draft = (commentDrafts[requestId] || "").trim();
        if (!draft) return;

        router.patch(
            withBasePath("", `/pasteur/prieres/${requestId}/commentaire`),
            {
                commentaire: draft,
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

    const handleToggleDetails = (request) => {
        const isExpanded = Boolean(expandedRequests[request.id]);
        setExpandedRequests((current) => ({
            ...current,
            [request.id]: !isExpanded,
        }));
        if (!isExpanded && ["Nouvelle", "Vu"].includes(request.status)) {
            updateRequestStatus(request.id, "En priere");
        }
    };

    const tabs = useMemo(
        () => [
            { id: "all", label: "Toutes les demandes", count: requests.length },
            {
                id: "new",
                label: "Nouvelles demandes",
                count: requests.filter((r) => r.status === "Nouvelle").length,
            },
            {
                id: "in_prayer",
                label: "En priere",
                count: requests.filter((r) => r.status === "En priere").length,
            },
            {
                id: "fulfilled",
                label: "Exaucees",
                count: requests.filter(
                    (r) =>
                        r.status === "Exaucement" ||
                        r.status === "Exaucement partage",
                ).length,
            },
        ],
        [requests],
    );

    const filteredRequests = useMemo(() => {
        if (activeTab === "new")
            return requests.filter((r) => r.status === "Nouvelle");
        if (activeTab === "in_prayer")
            return requests.filter((r) => r.status === "En priere");
        if (activeTab === "fulfilled")
            return requests.filter(
                (r) =>
                    r.status === "Exaucement" ||
                    r.status === "Exaucement partage",
            );
        return requests;
    }, [activeTab, requests]);

    const activeTabContent = useMemo(() => {
        const contents = {
            new: {
                title: "Nouvelles demandes de priere",
                description:
                    "Retrouvez ici les nouvelles demandes recues qui attendent encore une premiere prise en charge.",
            },
            in_prayer: {
                title: "Demandes en priere",
                description:
                    "Retrouvez ici les demandes actuellement portees dans la priere pastorale.",
            },
            fulfilled: {
                title: "Demandes exaucees",
                description:
                    "Retrouvez ici les demandes explicitement marquees comme exaucees.",
            },
            all: {
                title: "Toutes les demandes de priere",
                description:
                    "Retrouvez ici les demandes recues et mettez a jour leur prise en charge.",
            },
        };
        return contents[activeTab] || contents.all;
    }, [activeTab]);

    const currentThreadData = useMemo(() => {
        if (!openThread) return null;
        return requests.find((r) => r.id === openThread);
    }, [openThread, requests]);

    return (
        <>
            <Head title="Prieres - Pasteur" />

            <div
                className="min-h-screen px-4 py-8 sm:px-6 lg:px-10"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/8 blur-[120px]" />
                    <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-200/10 blur-[100px]" />
                    <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-lime-200/10 blur-[80px]" />
                </div>

                <div className="relative w-full">
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href={withBasePath("", "/pasteur/dashboard")}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4.5 w-4.5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Demandes de priere
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Vue pastorale centralisee pour suivre toutes
                                    les demandes recues.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
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
                                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
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

                    {/* LISTE PRINCIPALE */}
                    <section className="mt-8 overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.97)_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                        {activeTabContent.title}
                                    </h2>
                                    <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
                                        {activeTabContent.description}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {tabs.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveTab(tab.id)
                                                }
                                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition ${isActive ? "border-blue-500 bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.30)]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                                            >
                                                <span>{tab.label}</span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                                                >
                                                    {tab.count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-4">
                            {filteredRequests.length === 0 ? (
                                <div className="rounded-[30px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-6 py-14 text-center">
                                    <p className="text-base font-semibold text-slate-900">
                                        Aucune demande dans cet onglet.
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Ajustez le filtre ou attendez de
                                        nouvelles demandes.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredRequests.map((request) => {
                                        const lastComment =
                                            request.comments?.length > 0
                                                ? request.comments[
                                                      request.comments.length -
                                                          1
                                                  ]
                                                : null;
                                        const commentsCount =
                                            request.comments?.length ?? 0;
                                        const isExpanded = Boolean(
                                            expandedRequests[request.id],
                                        );
                                        const statusConfig = getStatusConfig(
                                            request.status,
                                        );

                                        return (
                                            <article
                                                key={request.id}
                                                className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.07)] transition hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                                            >
                                                <div className="grid gap-0 pl-3 xl:grid-cols-[1fr_280px]">
                                                    <div className="min-w-0">
                                                        <div className="p-5 xl:p-6">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span
                                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig.badge}`}
                                                                >
                                                                    <span
                                                                        className="h-1.5 w-1.5 rounded-full"
                                                                        style={{
                                                                            background:
                                                                                statusConfig.dot,
                                                                        }}
                                                                    />
                                                                    {
                                                                        request.status
                                                                    }
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                                    {request.isAnonymous ? (
                                                                        <ShieldCheck className="h-3 w-3" />
                                                                    ) : (
                                                                        <Eye className="h-3 w-3" />
                                                                    )}
                                                                    {
                                                                        request.authorLabel
                                                                    }
                                                                </span>
                                                                {request.sourceLabel && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                                                                        <Clock3 className="h-3.5 w-3.5" />
                                                                        {
                                                                            request.sourceLabel
                                                                        }
                                                                    </span>
                                                                )}
                                                                {request.createdAt && (
                                                                    <span className="ml-auto text-[11px] font-medium text-slate-500">
                                                                        {
                                                                            request.createdAt
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 sm:text-[1.02rem]">
                                                                {
                                                                    request.subject
                                                                }
                                                            </h3>

                                                            <div className="mt-3">
                                                                {isExpanded ? (
                                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                                                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                                                            {
                                                                                request.message
                                                                            }
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleToggleDetails(
                                                                                    request,
                                                                                )
                                                                            }
                                                                            className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                                                                        >
                                                                            Voir
                                                                            moins
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-sm italic text-slate-500">
                                                                            {getMessagePreview(
                                                                                request.message,
                                                                            )}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleToggleDetails(
                                                                                    request,
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                                                                        >
                                                                            Voir
                                                                            plus
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <aside className="flex flex-col justify-between border-t border-slate-200/80 bg-slate-50/50 p-5 xl:border-l xl:border-t-0 xl:p-6">
                                                        <div>
                                                            <div>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                            Echange
                                                                            pastoral
                                                                        </p>
                                                                        <p className="mt-2 text-sm font-bold text-slate-900">
                                                                            {commentsCount >
                                                                            0
                                                                                ? `${commentsCount} message${commentsCount > 1 ? "s" : ""}`
                                                                                : "Aucun echange"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                                                    {lastComment ? (
                                                                        <div className="space-y-2">
                                                                            <p className="text-xs font-semibold text-slate-600">
                                                                                {
                                                                                    lastComment.actorLabel
                                                                                }
                                                                            </p>
                                                                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                                                                                {
                                                                                    lastComment.message
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm leading-5 text-slate-500">
                                                                            Aucun
                                                                            echange
                                                                            pour
                                                                            l&apos;instant.
                                                                            Ouvrez
                                                                            le
                                                                            fil
                                                                            pour
                                                                            demarrer
                                                                            l&apos;accompagnement.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenThread(
                                                                        request.id,
                                                                    );
                                                                    if (
                                                                        [
                                                                            "Nouvelle",
                                                                            "Vu",
                                                                        ].includes(
                                                                            request.status,
                                                                        )
                                                                    ) {
                                                                        updateRequestStatus(
                                                                            request.id,
                                                                            "En priere",
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                            >
                                                                <MessageSquareHeart className="h-4 w-4" />
                                                                Ouvrir le fil
                                                            </button>
                                                        </div>
                                                    </aside>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* DRAWER DE DISCUSSION (LE NOUVEAU DESIGN PRO) */}
            {openThread && currentThreadData && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay flouté */}
                    <div
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={() => setOpenThread(null)}
                    />

                    {/* Panel */}
                    <div className="relative flex w-full max-w-[600px] flex-col overflow-hidden rounded-l-[28px] border-l border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                        {/* Header du Drawer */}
                        <div className="relative border-b border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                                        Fil de discussion
                                    </p>
                                    <h3 className="truncate text-[16px] font-bold text-slate-900">
                                        {currentThreadData.subject}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusConfig(currentThreadData.status).badge}`}
                                        >
                                            <span
                                                className="h-1.5 w-1.5 rounded-full"
                                                style={{
                                                    background: getStatusConfig(
                                                        currentThreadData.status,
                                                    ).dot,
                                                }}
                                            />
                                            {currentThreadData.status}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {currentThreadData.authorLabel}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOpenThread(null)}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Zone de Chat (Scrollable) */}
                        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)] px-6 py-6">
                            {/* Bouton Charger plus (Si > 5 commentaires) */}
                            {currentThreadData.comments.length >
                                visibleComments && (
                                <div className="mb-4 flex justify-center">
                                    <button
                                        onClick={() =>
                                            setVisibleComments(
                                                (prev) => prev + 10,
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                        Voir les messages precedents
                                    </button>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="space-y-4">
                                {currentThreadData.comments
                                    .slice(-visibleComments)
                                    .map((comment, index) => {
                                        const isPastor =
                                            comment.actorType === "pastor";
                                        return (
                                            <div
                                                key={`${openThread}-c-${comment.id ?? index}`}
                                                className={`flex ${isPastor ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`group relative max-w-[85%] ${isPastor ? "order-2" : "order-1"}`}
                                                >
                                                    {/* Citation de réponse */}
                                                    {comment.replyTo && (
                                                        <div
                                                            className={`mb-1.5 rounded-xl px-3 py-2 ${isPastor ? "border-r-2 border-slate-300 bg-slate-100/80 text-right" : "border-l-2 border-slate-300 bg-white/90"}`}
                                                        >
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                {
                                                                    comment
                                                                        .replyTo
                                                                        .actorLabel
                                                                }
                                                            </p>
                                                            <p className="line-clamp-1 text-[11px] text-slate-600">
                                                                {formatReplySnippet(
                                                                    comment
                                                                        .replyTo
                                                                        .message,
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Bulle du message */}
                                                    <div
                                                        className={`rounded-2xl px-4 py-3 ${isPastor ? "rounded-br-[6px] border border-slate-300 bg-[linear-gradient(180deg,#eef4ff_0%,#e2ebf8_100%)] text-slate-800 shadow-[0_10px_24px_rgba(148,163,184,0.18)]" : "rounded-bl-[6px] border border-slate-200 bg-white/95 text-slate-900 shadow-sm"}`}
                                                    >
                                                        <p className="text-sm leading-6 whitespace-pre-wrap">
                                                            {comment.message}
                                                        </p>
                                                    </div>

                                                    {/* Métadonnées et Actions sous le message */}
                                                    <div
                                                        className={`mt-1.5 flex items-center gap-3 px-1 ${isPastor ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <span className="text-[11px] text-slate-500">
                                                            {comment.actorLabel}{" "}
                                                            -{" "}
                                                            {comment.createdAt}
                                                        </span>

                                                        {/* Boutons d'actions (Répondre / Réagir) */}
                                                        {currentThreadData.canComment && (
                                                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                                                <button
                                                                    onClick={() =>
                                                                        setReplyTargets(
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                [openThread]:
                                                                                    comment.id,
                                                                            }),
                                                                        )
                                                                    }
                                                                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700"
                                                                >
                                                                    <CornerDownRight className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setShowReactionPicker(
                                                                            showReactionPicker ===
                                                                                comment.id
                                                                                ? null
                                                                                : comment.id,
                                                                        )
                                                                    }
                                                                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700"
                                                                >
                                                                    <SmilePlus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Réactions existantes */}
                                                    {comment.reactions?.length >
                                                        0 && (
                                                        <div
                                                            className={`mt-1 flex flex-wrap gap-1 ${isPastor ? "justify-end" : "justify-start"}`}
                                                        >
                                                            {comment.reactions.map(
                                                                (r) => (
                                                                    <span
                                                                        key={
                                                                            r.emoji
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] text-slate-700 shadow-sm"
                                                                    >
                                                                        {
                                                                            r.emoji
                                                                        }{" "}
                                                                        {
                                                                            r.count
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Picker de réactions */}
                                                    {showReactionPicker ===
                                                        comment.id &&
                                                        comment.canReact && (
                                                            <div
                                                                className={`absolute top-0 z-10 mt-[-52px] flex gap-1 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ${isPastor ? "right-0" : "left-0"}`}
                                                            >
                                                                {AVAILABLE_REACTIONS.map(
                                                                    (emoji) => (
                                                                        <button
                                                                            key={
                                                                                emoji
                                                                            }
                                                                            onClick={() =>
                                                                                toggleReaction(
                                                                                    openThread,
                                                                                    comment.id,
                                                                                    emoji,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                comment.hasPastorReaction
                                                                            }
                                                                            className="rounded-xl p-1.5 text-lg transition hover:scale-125 hover:bg-slate-100 disabled:opacity-30"
                                                                        >
                                                                            {
                                                                                emoji
                                                                            }
                                                                        </button>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Zone de saisie (Footer fixe) */}
                        {currentThreadData.canComment ? (
                            <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
                                {/* Indicateur de réponse ciblée */}
                                {replyTargets[openThread] && (
                                    <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-700">
                                                Reponse a{" "}
                                                {
                                                    currentThreadData.comments.find(
                                                        (c) =>
                                                            c.id ===
                                                            replyTargets[
                                                                openThread
                                                            ],
                                                    )?.actorLabel
                                                }
                                            </p>
                                            <p className="truncate text-[11px] text-slate-500">
                                                {formatReplySnippet(
                                                    currentThreadData.comments.find(
                                                        (c) =>
                                                            c.id ===
                                                            replyTargets[
                                                                openThread
                                                            ],
                                                    )?.message,
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setReplyTargets((current) => ({
                                                    ...current,
                                                    [openThread]: null,
                                                }))
                                            }
                                            className="ml-2 rounded-full p-1 text-slate-400 transition hover:text-slate-700"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-3">
                                    <textarea
                                        rows={2}
                                        value={commentDrafts[openThread] || ""}
                                        onChange={(e) =>
                                            setCommentDrafts((current) => ({
                                                ...current,
                                                [openThread]: e.target.value,
                                            }))
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                submitComment(openThread);
                                            }
                                        }}
                                        placeholder="Ecrire un message pastoral..."
                                        className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                    />
                                    <button
                                        onClick={() =>
                                            submitComment(openThread)
                                        }
                                        disabled={
                                            !commentDrafts[openThread]?.trim()
                                        }
                                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:opacity-30 disabled:shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-[12px] text-slate-500">
                                {currentThreadData.status === "Exaucement" ||
                                currentThreadData.status ===
                                    "Exaucement partage"
                                    ? "Cette priere est exaucee. Les echanges sont clos."
                                    : "Les commentaires ne sont pas autorises sur cette demande."}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
