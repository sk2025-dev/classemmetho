import { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import Select2Single from "../../../Components/Select2Single";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    formatFixedTruncated,
    formatPercentage,
    truncateDecimal,
} from "../../../Utils/percentage";
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Search,
    TrendingUp,
    Users,
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, accent }) {
    return (
        <div className="rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {title}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
                </div>
                <div
                    className={`flex h-12 w-12 items-center justify-center ${accent}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

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

function formatDateTime(dateString) {
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
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsedDate);
}

function statusStyles(status) {
    if (status === "Actif") {
        return {
            label: "Actif",
            badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
            progress: "bg-emerald-500",
        };
    }

    if (status === "Brouillon") {
        return {
            label: "Brouillon",
            badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
            progress: "bg-amber-500",
        };
    }

    if (status === "Cloture") {
        return {
            label: "Cloture",
            badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
            progress: "bg-rose-500",
        };
    }

    return {
        label: status || "Cloture",
        badge: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
        progress: "bg-slate-500",
    };
}

export default function MembreFamilleSondageIndex({
    sondages = [],
    classe = null,
    headTitle = "Sondages - Membre Famille",
    backHref = withBasePath("", "/membre-famille/dashboard"),
    detailBaseHref = withBasePath("", "/membre-famille/sondages"),
    showAudienceFilter = false,
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [audienceFilter, setAudienceFilter] = useState("all");
    const totalSondages = sondages.length;
    const sondagesActifs = sondages.filter(
        (sondage) => sondage.statut === "Actif",
    ).length;
    const totalReponses = sondages.reduce(
        (sum, sondage) => sum + Number(sondage.reponses ?? 0),
        0,
    );
    const tauxMoyen =
        totalSondages > 0
            ? truncateDecimal(
                  sondages.reduce(
                      (sum, sondage) =>
                          sum + Number(sondage.tauxParticipation ?? 0),
                      0,
                  ) / totalSondages,
              )
            : 0;

    const stats = [
        {
            title: "Total Sondages",
            value: totalSondages,
            subtitle: classe?.nom
                ? `Sondages visibles dans la classe ${classe.nom}`
                : "Consultations visibles par la famille",
            icon: ClipboardList,
            accent: "rounded-2xl bg-blue-50 text-blue-700",
        },
        {
            title: "Sondages Actifs",
            value: sondagesActifs,
            subtitle: "Encore ouverts a la participation",
            icon: TrendingUp,
            accent: "rounded-2xl bg-green-50 text-green-700",
        },
        {
            title: "Nombre de Reponses",
            value: totalReponses,
            subtitle: "Reponses cumulees sur les sondages",
            icon: Users,
            accent: "rounded-2xl bg-amber-50 text-amber-700",
        },
        {
            title: "Taux Moyen",
            value: formatPercentage(tauxMoyen),
            subtitle: "Participation moyenne observee",
            icon: BarChart3,
            accent: "rounded-2xl bg-purple-50 text-purple-700",
        },
    ];

    const audienceOptions = [...new Set(sondages.map((sondage) => sondage.audience))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));

    const statusFilterOptions = [
        { value: "all", label: "Tous les statuts" },
        { value: "Actif", label: "Actif" },
        { value: "Cloture", label: "Cloture" },
    ];

    const audienceFilterOptions = [
        { value: "all", label: "Toutes les audiences" },
        ...audienceOptions.map((audience) => ({
            value: audience,
            label: audience,
        })),
    ];

    const filteredSondages = sondages.filter((survey) => {
        const term = search.trim().toLowerCase();
        const matchesSearch =
            !term ||
            (survey.code || "").toLowerCase().includes(term) ||
            (survey.titre || "").toLowerCase().includes(term) ||
            (survey.description || "").toLowerCase().includes(term) ||
            (survey.createur || "").toLowerCase().includes(term) ||
            (survey.audience || "").toLowerCase().includes(term) ||
            (survey.statut || "").toLowerCase().includes(term);

        const matchesStatus =
            statusFilter === "all" || survey.statut === statusFilter;

        const matchesAudience =
            !showAudienceFilter ||
            audienceFilter === "all" ||
            survey.audience === audienceFilter;

        return matchesSearch && matchesStatus && matchesAudience;
    });

    const itemsPerPage = 6;
    const totalPages = Math.max(1, Math.ceil(filteredSondages.length / itemsPerPage));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const paginatedSondages = filteredSondages.slice(
        (currentPageSafe - 1) * itemsPerPage,
        currentPageSafe * itemsPerPage,
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, audienceFilter, sondages.length]);

    return (
        <>
            <Head title={headTitle} />

            <div
                className="relative min-h-screen overflow-hidden text-slate-900"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <main className="relative w-full px-5 py-6 sm:px-8 lg:px-10 xl:px-14 xl:py-8">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <Link
                                    href={backHref}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Gestion des sondages
                                </h1>
                                <p className="text-sm text-blue-100">
                                    {classe?.nom
                                        ? `Sondages diffuses dans la classe ${classe.nom}.`
                                        : "Suivez les consultations et leurs indicateurs."}
                                </p>
                            </div>
                        </div>

                    </div>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => {
                            return (
                                <StatCard
                                    key={stat.title}
                                    title={stat.title}
                                    value={stat.value}
                                    subtitle={stat.subtitle}
                                    icon={stat.icon}
                                    accent={stat.accent}
                                />
                            );
                        })}
                    </section>

                    <section className="mt-8">
                        <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-7">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                        Vue recente
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                        Sondages a suivre
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Retrouvez rapidement les sondages visibles.
                                    </p>
                                </div>

                                <div
                                    className={`grid gap-3 lg:min-w-[420px] ${
                                    showAudienceFilter
                                        ? "lg:grid-cols-3"
                                        : "lg:grid-cols-2"
                                    }`}
                                >
                                    <label className="relative block">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Rechercher un sondage..."
                                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </label>

                                    <Select2Single
                                        name="status_filter"
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        options={statusFilterOptions}
                                        placeholder="Tous les statuts"
                                        allowClearOption={false}
                                    />

                                    {showAudienceFilter ? (
                                        <Select2Single
                                            name="audience_filter"
                                            value={audienceFilter}
                                            onChange={(event) =>
                                                setAudienceFilter(event.target.value)
                                            }
                                            options={audienceFilterOptions}
                                            placeholder="Toutes les audiences"
                                            allowClearOption={false}
                                        />
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {paginatedSondages.length > 0 ? (
                                    paginatedSondages.map((survey) => {
                                        const status = statusStyles(
                                            survey.statut,
                                        );

                                        return (
                                            <article
                                                key={survey.id}
                                                className="group rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            {survey.code ? (
                                                                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                                                                    {survey.code}
                                                                </span>
                                                            ) : null}
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                                                            >
                                                                {status.label}
                                                            </span>
                                                            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                                                <CalendarDays className="h-4 w-4" />
                                                                Cree le{" "}
                                                                {formatDate(
                                                                    survey.dateCreation,
                                                                )}
                                                            </span>
                                                            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                                                <CalendarDays className="h-4 w-4" />
                                                                Date de cloture :{" "}
                                                                {formatDate(
                                                                    survey.dateEcheance,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                                                            {survey.titre}
                                                        </h3>
                                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                                            {survey.description ||
                                                                "Aucune description renseignee pour ce sondage."}
                                                        </p>

                                                        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                                                            <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                                                Audience:{" "}
                                                                {survey.audience}
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                                                Par{" "}
                                                                {survey.createur}
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                                                {
                                                                    survey.reponses
                                                                }{" "}
                                                                reponses
                                                            </span>
                                                            {survey.aDejaRepondu ? (
                                                                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
                                                                    {survey.dateParticipation
                                                                        ? `Participation le ${formatDateTime(survey.dateParticipation)}`
                                                                        : "Participation enregistree"}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="w-full rounded-[24px] bg-slate-50 p-4 lg:w-[280px]">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-medium text-slate-500">
                                                                Participation
                                                            </span>
                                                            <span className="font-bold text-slate-900">
                                                                {formatPercentage(
                                                                    survey.tauxParticipation,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                                                            <div
                                                                className={`h-full rounded-full ${status.progress}`}
                                                                style={{
                                                                    width: `${formatFixedTruncated(survey.tauxParticipation)}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                                                            <span className="inline-flex items-center gap-2">
                                                                <Users className="h-4 w-4" />
                                                                Repondants
                                                            </span>
                                                            <span>
                                                                {
                                                                    survey.reponses
                                                                }
                                                                /
                                                                {
                                                                    survey.participants
                                                                }
                                                            </span>
                                                        </div>

                                                        <Link
                                                            href={`${detailBaseHref}/${survey.id}`}
                                                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                        >
                                                            {survey.aDejaRepondu
                                                                ? "Voir mes reponses"
                                                                : "Repondre au sondage"}
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                                        Aucun sondage ne correspond aux filtres
                                        appliques.
                                    </div>
                                )}
                            </div>

                            {filteredSondages.length > itemsPerPage ? (
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-slate-600">
                                        Affichage de{" "}
                                        <span className="font-semibold text-slate-900">
                                            {(currentPageSafe - 1) * itemsPerPage + 1}
                                        </span>
                                        {" "}a{" "}
                                        <span className="font-semibold text-slate-900">
                                            {Math.min(
                                                currentPageSafe * itemsPerPage,
                                                filteredSondages.length,
                                            )}
                                        </span>
                                        {" "}sur{" "}
                                        <span className="font-semibold text-slate-900">
                                            {filteredSondages.length}
                                        </span>
                                        {" "}sondage(s)
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1),
                                                )
                                            }
                                            disabled={currentPageSafe === 1}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Precedent
                                        </button>

                                        <span className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                                            Page {currentPageSafe}/{totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(totalPages, page + 1),
                                                )
                                            }
                                            disabled={currentPageSafe === totalPages}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Suivant
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
