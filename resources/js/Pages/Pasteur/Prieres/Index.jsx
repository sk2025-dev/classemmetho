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
} from "lucide-react";

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
        reactions: request.reactions ?? [],
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

export default function PasteurPrieresIndex({ prayerRequests = [] }) {
    const [requests, setRequests] = useState(() =>
        normalizeRequests(prayerRequests),
    );
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        setRequests(normalizeRequests(prayerRequests));
    }, [prayerRequests]);

    const stats = useMemo(() => {
        const total = requests.length;
        const inPrayer = requests.filter(
            (request) => request.status === "En priere",
        ).length;
        const testimonyCount = requests.filter(
            (request) => request.status === "Exaucement",
        ).length;
        const anonymousCount = requests.filter(
            (request) => request.isAnonymous,
        ).length;

        return [
            {
                title: "Demandes recues",
                value: total,
                subtitle: "Toutes les demandes de priere recues depuis les differents espaces.",
                icon: MessageSquareHeart,
                iconClass: "bg-sky-100 text-sky-700",
            },
            {
                title: "En priere",
                value: inPrayer,
                subtitle: "Demandes actuellement suivies dans la priere pastorale.",
                icon: HeartHandshake,
                iconClass: "bg-blue-100 text-blue-700",
            },
            {
                title: "Mode anonyme",
                value: anonymousCount,
                subtitle: "Demandes preservees sans affichage du nom et prenom.",
                icon: EyeOff,
                iconClass: "bg-violet-100 text-violet-700",
            },
            {
                title: "Exaucements",
                value: testimonyCount,
                subtitle: "Demandes marquees comme exaucees ou accompagnees d'un retour.",
                icon: CheckCheck,
                iconClass: "bg-emerald-100 text-emerald-700",
            },
        ];
    }, [requests]);

    const updateRequestStatus = (requestId, status) => {
        router.patch(
            `/pasteur/prieres/${requestId}/status`,
            { statut: status },
            { preserveScroll: true },
        );
    };

    const toggleReaction = (requestId, emoji) => {
        router.patch(
            `/pasteur/prieres/${requestId}/reaction`,
            { emoji },
            { preserveScroll: true },
        );
    };

    const tabs = useMemo(
        () => [
            {
                id: "all",
                label: "Toutes les demandes",
                count: requests.length,
            },
            {
                id: "new",
                label: "Nouvelles demandes",
                count: requests.filter((request) => request.status === "Nouvelle")
                    .length,
            },
            {
                id: "in_prayer",
                label: "En priere",
                count: requests.filter((request) => request.status === "En priere")
                    .length,
            },
            {
                id: "fulfilled",
                label: "Exaucees",
                count: requests.filter((request) => request.status === "Exaucement")
                    .length,
            },
        ],
        [requests],
    );

    const filteredRequests = useMemo(() => {
        if (activeTab === "new") {
            return requests.filter((request) => request.status === "Nouvelle");
        }

        if (activeTab === "in_prayer") {
            return requests.filter((request) => request.status === "En priere");
        }

        if (activeTab === "fulfilled") {
            return requests.filter((request) => request.status === "Exaucement");
        }

        return requests;
    }, [activeTab, requests]);

    const activeTabContent = useMemo(() => {
        if (activeTab === "new") {
            return {
                title: "Nouvelles demandes de priere",
                description:
                    "Retrouvez ici les nouvelles demandes recues qui attendent encore une premiere prise en charge.",
            };
        }

        if (activeTab === "in_prayer") {
            return {
                title: "Demandes en priere",
                description:
                    "Retrouvez ici les demandes actuellement portees dans la priere pastorale.",
            };
        }

        if (activeTab === "fulfilled") {
            return {
                title: "Demandes exaucees",
                description:
                    "Retrouvez ici les demandes marquees comme exaucees ou accompagnees d'un retour.",
            };
        }

        return {
            title: "Toutes les demandes de priere",
            description:
                "Retrouvez ici les demandes recues et mettez a jour leur prise en charge.",
        };
    }, [activeTab]);

    return (
        <>
            <Head title="Prieres - Pasteur" />

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
                                href="/pasteur/dashboard"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Demandes de priere
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Vue pastorale centralisee pour suivre toutes les demandes recues.
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
                                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconClass}`}
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
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                        {activeTabContent.title}
                                    </h2>
                                    <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
                                        {activeTabContent.description}
                                    </p>
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
                                        Ajustez le filtre ou attendez de nouvelles demandes dans cette categorie.
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
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                                                request.status,
                                                            )}`}
                                                        >
                                                            {request.status}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                            {request.isAnonymous ? (
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            )}
                                                            {request.authorLabel}
                                                        </span>
                                                        {request.sourceLabel ? (
                                                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                                                                <Clock3 className="h-3.5 w-3.5" />
                                                                {request.sourceLabel}
                                                            </span>
                                                        ) : null}
                                                        {request.createdAt ? (
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                                                                {request.createdAt}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900">
                                                        {request.subject}
                                                    </h3>
                                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                        {request.message}
                                                    </p>

                                                    {request.testimony ? (
                                                        <div className="mt-3.5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                                                            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                                                                <MessageSquareHeart className="h-4 w-4 text-sky-700" />
                                                                Commentaire d'exaucement
                                                            </div>

                                                            <div className="mt-2.5 rounded-2xl border border-emerald-200 bg-white px-3.5 py-2.5 shadow-sm">
                                                                <div className="text-sm leading-6 text-emerald-900">
                                                                    {request.testimony}
                                                                </div>

                                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                    {AVAILABLE_REACTIONS.map((emoji) => {
                                                                        const reaction = request.reactions.find(
                                                                            (item) => item.emoji === emoji,
                                                                        );

                                                                        return (
                                                                            <button
                                                                                key={`${request.id}-${emoji}`}
                                                                                type="button"
                                                                                onClick={() => toggleReaction(request.id, emoji)}
                                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                                                                                    reaction
                                                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                                                                                }`}
                                                                            >
                                                                                <span>{emoji}</span>
                                                                                <span>{reaction?.count ?? 0}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="flex h-full w-full flex-col rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 shadow-sm">
                                                    <p className="text-[13px] font-semibold text-slate-900">
                                                        Actions pastorales
                                                    </p>
                                                    {request.status === "Nouvelle" || request.status === "Vu" ? (
                                                        <>
                                                            <p className="mt-1 text-sm leading-5 text-slate-600">
                                                                Mettez a jour l'etat de prise en charge de cette demande.
                                                            </p>

                                                            <div className="mt-auto grid gap-3 pt-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateRequestStatus(
                                                                            request.id,
                                                                            "En priere",
                                                                        )
                                                                    }
                                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:bg-blue-700"
                                                                >
                                                                    <HeartHandshake className="h-4 w-4" />
                                                                    Mettre en priere et marquer vue
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : request.status === "Exaucement" ? (
                                                        <p className="mt-1 text-sm leading-5 text-slate-600">
                                                            Cette priere a ete marquee comme exaucee par son auteur et apparait automatiquement dans les exaucements.
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-sm leading-5 text-slate-600">
                                                            Cette demande est deja prise en charge dans le suivi pastoral.
                                                        </p>
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
        </>
    );
}
