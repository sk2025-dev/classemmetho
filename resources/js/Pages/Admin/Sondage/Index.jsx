import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    ClipboardList,
    Clock3,
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

function getStatusClasses(statut) {
    if (statut === "Actif") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (statut === "Cloture") {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function normalizeSondage(sondage, authUser, index) {
    const titre =
        sondage.titre || sondage.title || sondage.nom || `Sondage ${index + 1}`;

    const participants =
        Number(sondage.participants ?? sondage.participant_count ?? 0) || 0;
    const reponses =
        Number(sondage.reponses ?? sondage.response_count ?? 0) || 0;

    const dateCreation =
        sondage.dateCreation ||
        sondage.date_creation ||
        sondage.created_at ||
        null;

    const dateEcheance =
        sondage.dateEcheance ||
        sondage.date_echeance ||
        sondage.deadline ||
        sondage.expires_at ||
        null;

    const statut =
        sondage.statut ||
        sondage.status ||
        (dateEcheance && new Date(dateEcheance) < new Date()
            ? "Cloture"
            : "Actif");

    const createur =
        sondage.createur ||
        sondage.created_by_name ||
        [sondage.created_by_prenom, sondage.created_by_nom]
            .filter(Boolean)
            .join(" ") ||
        [authUser?.prenom, authUser?.nom].filter(Boolean).join(" ") ||
        "Non renseigne";

    const tauxParticipation =
        Number(
            sondage.tauxParticipation ??
                sondage.taux_participation ??
                (participants > 0
                    ? Math.round((reponses / participants) * 100)
                    : 0),
        ) || 0;

    return {
        id: sondage.id ?? index,
        code: sondage.code || null,
        titre,
        createur,
        classe: sondage.classe || "Classe non renseignee",
        cible: sondage.audience || "Non renseignee",
        dateCreation,
        dateEcheance,
        statut,
        participants,
        reponses,
        tauxParticipation,
        isNew: Boolean(sondage.isNew),
    };
}

export default function AdminSondageIndex({
    sondages = [],
    authUser = null,
    seenSurveyIds = [],
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [classeFilter, setClasseFilter] = useState("all");
    const [cibleFilter, setCibleFilter] = useState("all");

    const sondagesNormalises = Array.isArray(sondages)
        ? sondages.map((sondage, index) =>
              normalizeSondage(
                  {
                      ...sondage,
                      isNew: !seenSurveyIds.includes(sondage.id),
                  },
                  authUser,
                  index,
              ),
          )
        : [];

    const statusOptions = [
        ...new Set(sondagesNormalises.map((sondage) => sondage.statut)),
    ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));

    const classeOptions = [
        ...new Set(sondagesNormalises.map((sondage) => sondage.classe)),
    ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));

    const cibleOptions = [
        ...new Set(sondagesNormalises.map((sondage) => sondage.cible)),
    ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));

    const sondagesFiltres = sondagesNormalises.filter((sondage) => {
        const term = search.trim().toLowerCase();
        const matchesSearch =
            !term ||
            (sondage.code || "").toLowerCase().includes(term) ||
            sondage.titre.toLowerCase().includes(term) ||
            sondage.createur.toLowerCase().includes(term) ||
            sondage.classe.toLowerCase().includes(term) ||
            sondage.cible.toLowerCase().includes(term) ||
            sondage.statut.toLowerCase().includes(term);

        const matchesStatus =
            statusFilter === "all" || sondage.statut === statusFilter;

        const matchesClasse =
            classeFilter === "all" || sondage.classe === classeFilter;

        const matchesCible =
            cibleFilter === "all" || sondage.cible === cibleFilter;

        return matchesSearch && matchesStatus && matchesClasse && matchesCible;
    });

    const totalSondages = sondagesNormalises.length;
    const sondagesActifs = sondagesNormalises.filter(
        (sondage) => sondage.statut === "Actif",
    ).length;
    const totalReponses = sondagesNormalises.reduce(
        (sum, sondage) => sum + sondage.reponses,
        0,
    );
    const tauxMoyen =
        totalSondages > 0
            ? Math.round(
                  sondagesNormalises.reduce(
                      (sum, sondage) => sum + sondage.tauxParticipation,
                      0,
                  ) / totalSondages,
              )
            : 0;

    return (
        <>
            <Head title="Sondages - Admin" />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Link
                                href={withBasePath("", "/admin/dashboard")}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Gestion des sondages
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Vue globale des sondages sur toutes les
                                    classes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Sondages"
                            value={totalSondages}
                            subtitle="Sondages remontes par le backend"
                            icon={ClipboardList}
                            accent="rounded-2xl bg-blue-50 text-blue-700"
                        />
                        <StatCard
                            title="Sondages Actifs"
                            value={sondagesActifs}
                            subtitle="Encore ouverts ou exploitables"
                            icon={TrendingUp}
                            accent="rounded-2xl bg-green-50 text-green-700"
                        />
                        <StatCard
                            title="Nombre de Reponses"
                            value={totalReponses}
                            subtitle="Reponses cumulees sur les sondages"
                            icon={Users}
                            accent="rounded-2xl bg-amber-50 text-amber-700"
                        />
                        <StatCard
                            title="Taux Moyen"
                            value={`${tauxMoyen}%`}
                            subtitle="Participation moyenne observee"
                            icon={BarChart3}
                            accent="rounded-2xl bg-purple-50 text-purple-700"
                        />
                    </div>

                    <div className="mt-8 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.10)] sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Liste des sondages
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Recherche et filtres par titre, createur,
                                    classe, cible ou statut.
                                </p>
                            </div>

                            <div className="grid w-full gap-3 lg:max-w-5xl lg:grid-cols-4">
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

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="all">
                                        Tous les statuts
                                    </option>
                                    {statusOptions.map((statut) => (
                                        <option key={statut} value={statut}>
                                            {statut}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={classeFilter}
                                    onChange={(event) =>
                                        setClasseFilter(event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="all">
                                        Toutes les classes
                                    </option>
                                    {classeOptions.map((classe) => (
                                        <option key={classe} value={classe}>
                                            {classe}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={cibleFilter}
                                    onChange={(event) =>
                                        setCibleFilter(event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="all">
                                        Toutes les cibles
                                    </option>
                                    {cibleOptions.map((cible) => (
                                        <option key={cible} value={cible}>
                                            {cible}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-[#B6C01A] text-left text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                        <tr>
                                            <th className="px-5 py-4">#</th>
                                            <th className="px-5 py-4">
                                                Code sondage
                                            </th>
                                            <th className="px-5 py-4">
                                                Nom du sondage
                                            </th>
                                            <th className="px-5 py-4">
                                                Createur
                                            </th>
                                            <th className="px-5 py-4">
                                                Classe
                                            </th>
                                            <th className="px-5 py-4">Cible</th>
                                            <th className="px-5 py-4">
                                                Statut
                                            </th>
                                            <th className="px-5 py-4">
                                                Date creation
                                            </th>
                                            <th className="px-5 py-4">
                                                Date de cloture
                                            </th>
                                            <th className="px-5 py-4">
                                                Reponses
                                            </th>
                                            <th className="px-5 py-4">
                                                Taux participation
                                            </th>
                                            <th className="px-5 py-4">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {sondagesFiltres.length > 0 ? (
                                            sondagesFiltres.map(
                                                (sondage, index) => (
                                                    <tr
                                                        key={sondage.id}
                                                        className="transition hover:bg-slate-50"
                                                    >
                                                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                                            #{index + 1}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="font-mono text-xs font-semibold tracking-[0.16em] text-slate-700">
                                                                {sondage.code ||
                                                                    "Non genere"}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="font-semibold text-slate-900">
                                                                    {
                                                                        sondage.titre
                                                                    }
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                    {sondage.isNew ? (
                                                                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 ring-1 ring-rose-200">
                                                                            Nouveau
                                                                        </span>
                                                                    ) : null}
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
                                                                        <Users className="h-3.5 w-3.5" />
                                                                        {
                                                                            sondage.participants
                                                                        }{" "}
                                                                        participants
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-700">
                                                            {sondage.createur}
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-700">
                                                            {sondage.classe}
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-700">
                                                            {sondage.cible}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${getStatusClasses(sondage.statut)}`}
                                                            >
                                                                {sondage.statut}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600">
                                                            <span className="inline-flex items-center gap-2">
                                                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                                                {formatDate(
                                                                    sondage.dateCreation,
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-slate-600">
                                                            <span className="inline-flex items-center gap-2">
                                                                <Clock3 className="h-4 w-4 text-slate-400" />
                                                                {formatDate(
                                                                    sondage.dateEcheance,
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 ring-1 ring-blue-200">
                                                                {
                                                                    sondage.reponses
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200">
                                                                {
                                                                    sondage.tauxParticipation
                                                                }
                                                                %
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                <Link
                                                                    href={`/admin/sondages/${sondage.id}`}
                                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                                >
                                                                    {sondage.statut ===
                                                                    "Cloture"
                                                                        ? "Voir l'historique"
                                                                        : "Voir"}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="12"
                                                    className="px-5 py-12 text-center text-sm text-slate-500"
                                                >
                                                    Aucun sondage disponible
                                                    pour le moment.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
