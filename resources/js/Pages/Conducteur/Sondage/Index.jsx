import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    ClipboardList,
    Clock3,
    Plus,
    Search,
    Send,
    TrendingUp,
    Users,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { ToastContainer } from "../../../Components/Toast";
import useToast from "../../../Hooks/useToast";

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

function canConducteurRespondToSurvey(cible) {
    const normalizedCible = (cible || "").trim();

    return [
        "Tous les membres",
        "Tout le monde (tous les membres)",
        "Responsables de famille",
        "Conducteurs de classe",
    ].includes(normalizedCible);
}

function normalizeSondage(sondage, authUser, index) {
    const titre =
        sondage.titre ||
        sondage.title ||
        sondage.nom ||
        `Sondage ${index + 1}`;

    const participants =
        Number(sondage.participants ?? sondage.participant_count ?? 0) || 0;
    const reponses = Number(sondage.reponses ?? sondage.response_count ?? 0) || 0;

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
                (participants > 0 ? Math.round((reponses / participants) * 100) : 0),
        ) || 0;

    return {
        id: sondage.id ?? index,
        code: sondage.code || null,
        titre,
        createur,
        cible: sondage.audience || "Non renseignee",
        dateCreation,
        dateEcheance,
        statut,
        participants,
        reponses,
        tauxParticipation,
        canEdit: Boolean(sondage.canEdit),
        canPublish: Boolean(sondage.canPublish),
    };
}

export default function ConducteurSondageIndex({
    sondages = [],
    authUser = null,
}) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cibleFilter, setCibleFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [publishTarget, setPublishTarget] = useState(null);
    const {
        toasts,
        removeToast,
        success: showSuccess,
        error: showError,
    } = useToast();
    const lastSuccessRef = useRef(null);
    const lastErrorRef = useRef(null);

    useEffect(() => {
        if (flash?.success && flash.success !== lastSuccessRef.current) {
            lastSuccessRef.current = flash.success;
            showSuccess(flash.success);
        }
    }, [flash?.success, showSuccess]);

    useEffect(() => {
        if (flash?.error && flash.error !== lastErrorRef.current) {
            lastErrorRef.current = flash.error;
            showError(flash.error);
        }
    }, [flash?.error, showError]);

    const sondagesNormalises = Array.isArray(sondages)
        ? sondages.map((sondage, index) =>
              normalizeSondage(sondage, authUser, index),
          )
        : [];

    const cibleOptions = [...new Set(sondagesNormalises.map((sondage) => sondage.cible))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));

    const sondagesFiltres = sondagesNormalises.filter((sondage) => {
        const term = search.trim().toLowerCase();

        if (statusFilter !== "all" && sondage.statut !== statusFilter) {
            return false;
        }

        if (cibleFilter !== "all" && sondage.cible !== cibleFilter) {
            return false;
        }

        if (!term) {
            return true;
        }

        return (
            (sondage.code || "").toLowerCase().includes(term) ||
            sondage.titre.toLowerCase().includes(term) ||
            sondage.createur.toLowerCase().includes(term) ||
            sondage.cible.toLowerCase().includes(term) ||
            sondage.statut.toLowerCase().includes(term)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, cibleFilter]);

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

    const itemsPerPage = 8;
    const totalPages = Math.max(1, Math.ceil(sondagesFiltres.length / itemsPerPage));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const paginatedSondages = sondagesFiltres.slice(
        (currentPageSafe - 1) * itemsPerPage,
        currentPageSafe * itemsPerPage,
    );

    const confirmPublish = () => {
        if (!publishTarget) {
            return;
        }

        router.post(`/conducteur/sondages/${publishTarget.id}/publish`, {}, {
            preserveScroll: true,
            onSuccess: () => setPublishTarget(null),
        });
    };

    return (
        <>
            <Head title="Sondages - Conducteur" />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

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
                                href="/conducteur/dashboard"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Gestion des sondages
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Suivez les sondages et leurs indicateurs.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/conducteur/sondages/create"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#B6C01A] px-5 py-2.5 font-medium text-white shadow-lg transition hover:bg-[#a4ae17]"
                            >
                                <Plus className="h-4 w-4" />
                                Nouveau sondage
                            </Link>
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
                                    Recherche par titre, createur, cible ou statut.
                                </p>
                            </div>

                            <div className="grid w-full gap-3 lg:max-w-4xl lg:grid-cols-3">
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

                                <label className="relative block">
                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="Actif">Actif</option>
                                        <option value="Brouillon">Brouillon</option>
                                        <option value="Cloture">Cloture</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={cibleFilter}
                                        onChange={(event) =>
                                            setCibleFilter(event.target.value)
                                        }
                                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="all">Toutes les cibles</option>
                                        {cibleOptions.map((cible) => (
                                            <option key={cible} value={cible}>
                                                {cible}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </label>
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
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
                                                Cible
                                            </th>
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
                                        {paginatedSondages.length > 0 ? (
                                            paginatedSondages.map((sondage, index) => (
                                                <tr
                                                    key={sondage.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                                        #{(currentPageSafe - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-xs font-semibold tracking-[0.16em] text-slate-700">
                                                            {sondage.code || "Non genere"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="font-semibold text-slate-900">
                                                                {sondage.titre}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
                                                                    <Users className="h-3.5 w-3.5" />
                                                                    {sondage.participants} participants
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-700">
                                                        {sondage.createur}
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
                                                            {sondage.reponses}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200">
                                                            {sondage.tauxParticipation}%
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Link
                                                                href={`/conducteur/sondages/${sondage.id}`}
                                                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                            >
                                                                {sondage.statut === "Cloture"
                                                                    ? "Voir l'historique"
                                                                    : "Voir"}
                                                            </Link>
                                                            {sondage.statut !== "Cloture" &&
                                                            sondage.statut !== "Brouillon" &&
                                                            canConducteurRespondToSurvey(
                                                                sondage.cible,
                                                            ) ? (
                                                                <Link
                                                                    href={`/conducteur/sondages/${sondage.id}/repondre`}
                                                                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                                >
                                                                    Repondre
                                                                </Link>
                                                            ) : null}
                                                            {sondage.canEdit ? (
                                                                <Link
                                                                    href={`/conducteur/sondages/${sondage.id}/edit`}
                                                                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                                >
                                                                    Modifier
                                                                </Link>
                                                            ) : null}
                                                            {sondage.canPublish ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPublishTarget(sondage)}
                                                                    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                                                                >
                                                                    Publier
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="11"
                                                    className="px-5 py-12 text-center text-sm text-slate-500"
                                                >
                                                    Aucun sondage disponible pour le
                                                    moment. La page utilise les donnees
                                                    reelles envoyees par Inertia.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {sondagesFiltres.length > 0 ? (
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-600">
                                    Affichage de{" "}
                                    <span className="font-semibold text-slate-900">
                                        {(currentPageSafe - 1) * itemsPerPage + 1}
                                    </span>
                                    {" "}a{" "}
                                    <span className="font-semibold text-slate-900">
                                        {Math.min(currentPageSafe * itemsPerPage, sondagesFiltres.length)}
                                    </span>
                                    {" "}sur{" "}
                                    <span className="font-semibold text-slate-900">
                                        {sondagesFiltres.length}
                                    </span>
                                    {" "}sondage(s)
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) => Math.max(1, page - 1))
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
                                            setCurrentPage((page) => Math.min(totalPages, page + 1))
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
                </div>
            </div>

            {publishTarget ? (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 px-4">
                    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Confirmer la publication
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Voulez-vous publier le sondage{" "}
                                    <span className="font-semibold text-slate-900">
                                        {publishTarget.titre}
                                    </span>
                                    {" "}?
                                </p>
                                {publishTarget.code ? (
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        {publishTarget.code}
                                    </p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPublishTarget(null)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPublishTarget(null)}
                                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={confirmPublish}
                                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                            >
                                <Send className="h-4 w-4" />
                                Publier le sondage
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
