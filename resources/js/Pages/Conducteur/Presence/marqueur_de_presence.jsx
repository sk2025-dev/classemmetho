import { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { withBasePath } from "@/Utils/urlHelper";
import {
    Users,
    QrCode,
    Hand,
    UserX,
    Clock,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    ArrowLeft,
    AlertTriangle,
    Ban,
    Timer,
} from "lucide-react";

const GRACE_HOURS = 2;

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function getMarquageStatus(activite, programmeSummary, nowDate = new Date()) {
    const start = programmeSummary?.programme?.start_at
        ? new Date(programmeSummary.programme.start_at)
        : activite?.date_heure_debut ? new Date(activite.date_heure_debut) : null;

    const actEnd = programmeSummary?.programme?.end_at
        ? new Date(programmeSummary.programme.end_at)
        : activite?.date_heure_fin ? new Date(activite.date_heure_fin) : null;

    const graceEnd = programmeSummary?.programme?.grace_end_at
        ? new Date(programmeSummary.programme.grace_end_at)
        : actEnd
            ? new Date(actEnd.getTime() + GRACE_HOURS * 3600 * 1000)
            : start
                ? new Date(start.getTime() + GRACE_HOURS * 3600 * 1000)
                : null;

    if (!start) return { code: "unknown", canMark: false };

    const today = isSameDay(start, nowDate);

    // Activité passée (délai expiré) ou autre jour passé → grisée, aucune action
    if (graceEnd && nowDate > graceEnd) return { code: "past", canMark: false };

    // Jour futur (pas aujourd'hui)
    if (!today && nowDate < start) return { code: "future", canMark: false, start };

    // Aujourd'hui, pas encore commencé → compte à rebours
    if (nowDate < start) return { code: "today_waiting", canMark: false, start, msLeft: start - nowDate };

    // Activité en cours (avant fin)
    if (!actEnd || nowDate <= actEnd) return { code: "in_progress", canMark: true, graceEnd };

    // Activité terminée, délai encore en cours
    if (graceEnd && nowDate <= graceEnd) return { code: "grace", canMark: true, graceEnd };

    return { code: "past", canMark: false };
}

function formatCountdown(ms) {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function MarqueurDePresence({
    conducteur,
    activites = [],
    membres = [],
    presences: initialPresences = {},
    stats = {},
    activite_active_id = null,
    viewerLabel = "Marqueur",
    presenceEndpoints = {},
}) {
    const [activeTab, setActiveTab] = useState("presence");
    const [selectedActiviteId, setSelectedActiviteId] = useState(
        activite_active_id ?? activites[0]?.id ?? null,
    );
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [presencePage, setPresencePage] = useState(1);
    const [activitesPage, setActivitesPage] = useState(1);
    const [marquerPage, setMarquerPage] = useState(1);
    const [programmeSummary, setProgrammeSummary] = useState(null);
    const [programmeActivites, setProgrammeActivites] = useState([]);
    const [loadingProgrammeActivites, setLoadingProgrammeActivites] = useState(false);
    const [marquages, setMarquages] = useState(initialPresences);
    const [summaryReloadKey, setSummaryReloadKey] = useState(0);
    const [toast, setToast] = useState(null);
    const [markingMemberId, setMarkingMemberId] = useState(null);

    const activitesEndpoint =
        presenceEndpoints?.activitesProgramme ||
        "/membre-famille/presences/marquage/programmes-activites";
    const programmeSummaryTemplate =
        presenceEndpoints?.programmeSummary ||
        "/membre-famille/presences/marquage/programmes/{id}/presences";
    const manualMarkEndpoint =
        presenceEndpoints?.manualMark ||
        "/membre-famille/presences/marquage/marquer";

    const activitesSource =
        programmeActivites.length > 0 ? programmeActivites : activites;
    const activiteSelectionnee = activitesSource.find(
        (a) => a.id === selectedActiviteId,
    );

    const membresScannes = useMemo(() => {
        const presents = Array.isArray(programmeSummary?.presents)
            ? programmeSummary.presents
            : [];
        return presents.filter((p) => p.methode === "qr_code");
    }, [programmeSummary]);

    const membresAMarquer = useMemo(
        () =>
            Array.isArray(programmeSummary?.non_scannes)
                ? programmeSummary.non_scannes
                : [],
        [programmeSummary],
    );

    const membresMarquesManuellement = useMemo(() => {
        const presents = Array.isArray(programmeSummary?.presents)
            ? programmeSummary.presents
            : [];
        return presents.filter((p) => p.methode !== "qr_code");
    }, [programmeSummary]);

    const membresParPage = 12;
    const totalPresencePages = Math.max(1, Math.ceil(membresScannes.length / membresParPage));
    const totalMarquerPages = Math.max(1, Math.ceil(membresAMarquer.length / membresParPage));
    const presencePageSafe = Math.min(Math.max(presencePage, 1), totalPresencePages);
    const marquerPageSafe = Math.min(Math.max(marquerPage, 1), totalMarquerPages);

    const membresScannesPagines = useMemo(() => {
        const start = (presencePageSafe - 1) * membresParPage;
        return membresScannes.slice(start, start + membresParPage);
    }, [membresScannes, presencePageSafe]);

    const membresAMarquerPagines = useMemo(() => {
        const start = (marquerPageSafe - 1) * membresParPage;
        return membresAMarquer.slice(start, start + membresParPage);
    }, [membresAMarquer, marquerPageSafe]);

    const nbPresentsQr = membresScannes.length;
    const nbPresentsManuels = membresMarquesManuellement.length;
    const nbAbsents = Array.isArray(programmeSummary?.absents)
        ? programmeSummary.absents.length
        : 0;
    const nbNonScannes = membresAMarquer.length;
    const totalPresents = nbPresentsQr + nbPresentsManuels;
    const taux =
        membres.length > 0
            ? Math.round((totalPresents / membres.length) * 100)
            : 0;

    function showToast(message, type = "success") {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 2500);
    }

    useEffect(() => {
        setPresencePage(1);
        setMarquerPage(1);
        setActivitesPage(1);
    }, [selectedActiviteId, activeTab]);

    useEffect(() => {
        let cancelled = false;
        async function loadProgrammeActivites() {
            setLoadingProgrammeActivites(true);
            try {
                const endpoint = withBasePath("", activitesEndpoint);
                const response = await window.axios.get(endpoint);
                if (!cancelled && response?.data?.success) {
                    const next = response.data.activites ?? [];
                    setProgrammeActivites(next);
                    if (!selectedActiviteId && next[0]?.id) {
                        setSelectedActiviteId(next[0].id);
                    }
                }
            } catch (error) {
                console.error("Erreur chargement activites (marqueur)", error);
            } finally {
                if (!cancelled) setLoadingProgrammeActivites(false);
            }
        }
        loadProgrammeActivites();
        return () => { cancelled = true; };
    }, [activitesEndpoint, selectedActiviteId]);

    async function loadProgrammeSummary() {
        if (!selectedActiviteId) return;
        setSummaryLoading(true);
        try {
            const endpoint = withBasePath(
                "",
                programmeSummaryTemplate.replace("{id}", String(selectedActiviteId)),
            );
            const response = await window.axios.get(endpoint);
            if (!response?.data?.success) return;
            setProgrammeSummary(response.data);
            const mapByMember = {};
            for (const membre of response.data.membres ?? []) {
                mapByMember[membre.id] = membre.statut ?? null;
            }
            setMarquages((prev) => ({ ...prev, [selectedActiviteId]: mapByMember }));
        } catch (error) {
            console.error("Erreur chargement resume programme", error);
            showToast("Erreur de chargement des présences.", "error");
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {
        if (!selectedActiviteId) return;
        const run = async () => { await loadProgrammeSummary(); };
        run();
        const timer = window.setInterval(run, 10000);
        return () => { window.clearInterval(timer); };
    }, [selectedActiviteId, programmeSummaryTemplate, summaryReloadKey]);

    async function handleManualMark(member) {
        if (!selectedActiviteId) {
            showToast("Sélectionnez une activité.", "error");
            return;
        }
        setMarkingMemberId(member.id);
        try {
            const endpoint = withBasePath("", manualMarkEndpoint);
            const response = await window.axios.post(endpoint, {
                event_id: selectedActiviteId,
                member_id: member.id,
            });
            showToast(response?.data?.message || "Présence marquée manuellement.", "success");
            setSummaryReloadKey((v) => v + 1);
        } catch (error) {
            showToast(
                error?.response?.data?.message || "Impossible de marquer cette présence.",
                "error",
            );
        } finally {
            setMarkingMemberId(null);
        }
    }

    const kpis = [
        { label: "Membres", value: stats.total_membres ?? membres.length, icon: Users, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-500", valueColor: "text-blue-700" },
        { label: "Présences QR", value: nbPresentsQr, icon: QrCode, color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500", valueColor: "text-emerald-700" },
        { label: "Présences manuelles", value: nbPresentsManuels, icon: Hand, color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500", valueColor: "text-violet-700" },
        { label: "Absents", value: nbAbsents, icon: UserX, color: "bg-red-50 border-red-200", iconColor: "text-red-500", valueColor: "text-red-700" },
        { label: "À marquer", value: nbNonScannes, icon: Clock, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500", valueColor: "text-amber-700" },
        { label: "Taux", value: `${taux}%`, icon: TrendingUp, color: "bg-sky-50 border-sky-200", iconColor: "text-sky-500", valueColor: "text-sky-700" },
    ];

    return (
        <AppLayout>
            <Head title="Marquage de présence" />

            <div className="min-h-screen p-4 sm:p-6">
                {/* Toast */}
                {toast && (
                    <div className={`sticky top-3 z-20 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-md ${
                        toast.type === "error"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                        {toast.type === "error" ? "⚠" : "✓"} {toast.message}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 border border-white/40 rounded-lg text-sm font-semibold text-white hover:bg-white/30 backdrop-blur-sm shadow-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white drop-shadow">
                            Marquage de présence
                        </h1>
                        <p className="text-sm text-white/80 mt-0.5">
                            <span className="font-medium text-white">{conducteur?.classe?.nom ?? "Ma classe"}</span>
                            {" · "}
                            {viewerLabel} :{" "}
                            <span className="font-medium text-white">
                                {conducteur?.prenom} {conducteur?.nom}
                            </span>
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {kpis.map(({ label, value, icon: Icon, color, iconColor, valueColor }) => (
                        <div key={label} className={`flex items-start justify-between rounded-xl border p-4 ${color} shadow-sm`}>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    {label}
                                </p>
                                <p className={`text-3xl font-black ${valueColor}`}>{value}</p>
                            </div>
                            <Icon className={`w-5 h-5 mt-1 ${iconColor}`} />
                        </div>
                    ))}
                </div>

                {/* Selector + Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                            Activité :
                        </label>
                        <select
                            value={selectedActiviteId ?? ""}
                            onChange={(e) =>
                                setSelectedActiviteId(
                                    e.target.value ? Number(e.target.value) : null,
                                )
                            }
                            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Choisir une activité...</option>
                            {activitesSource.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.titre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {[
                            { key: "presence", label: "Présence" },
                            { key: "marquer", label: "Marquer" },
                            { key: "activites", label: "Activités" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                    activeTab === key
                                        ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab: Présence (QR) */}
                {activeTab === "presence" && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    {activiteSelectionnee?.titre ?? "Sélectionner une activité"}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {summaryLoading
                                        ? "Chargement des présences..."
                                        : programmeSummary?.programme?.is_closed
                                          ? "Activité clôturée"
                                          : "Présences uniquement via scan QR"}
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                <QrCode className="w-4 h-4" />
                                {membresScannes.length} scanné{membresScannes.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {["Membre", "Famille", "Activité", "Scanné le", "Source"].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {membresScannes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                                                Aucun membre scanné
                                            </td>
                                        </tr>
                                    ) : (
                                        membresScannesPagines.map((m, i) => (
                                            <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                                <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                                    {m.prenom} {m.nom}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-600">
                                                    {m.famille?.nom ?? "—"}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-600">
                                                    {programmeSummary?.programme?.title ??
                                                        activiteSelectionnee?.titre ?? "—"}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-600">
                                                    {formatDateTime(m.marquee_le)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                        <QrCode className="w-3 h-3" /> QR
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            current={presencePageSafe}
                            total={totalPresencePages}
                            count={membresScannes.length}
                            perPage={membresParPage}
                            onPrev={() => setPresencePage((p) => Math.max(1, p - 1))}
                            onNext={() => setPresencePage((p) => Math.min(totalPresencePages, p + 1))}
                        />
                    </div>
                )}

                {/* Tab: Marquer */}
                {activeTab === "marquer" && (() => {
                    const status = getMarquageStatus(activiteSelectionnee, programmeSummary, now);
                    const { canMark } = status;

                    const statusBanner = {
                        future: {
                            cls: "bg-gray-100 border-gray-300 text-gray-700",
                            icon: <Timer className="w-5 h-5 shrink-0" />,
                            text: `Cette activité est planifiée pour le ${fmtDate(status.start)}. Le marquage ne sera disponible que ce jour-là.`,
                        },
                        today_waiting: {
                            cls: "bg-blue-50 border-blue-300 text-blue-800",
                            icon: <Timer className="w-5 h-5 shrink-0" />,
                            text: `L'activité commence dans ${formatCountdown(status.msLeft)}. Le marquage sera disponible dès le début.`,
                        },
                        in_progress: {
                            cls: "bg-emerald-50 border-emerald-300 text-emerald-800",
                            icon: <CheckCircle className="w-5 h-5 shrink-0" />,
                            text: `Activité en cours — marquage autorisé jusqu'à ${fmtDate(status.graceEnd)} (délai de ${GRACE_HOURS}h après la fin).`,
                        },
                        grace: {
                            cls: "bg-amber-50 border-amber-300 text-amber-800",
                            icon: <Clock className="w-5 h-5 shrink-0" />,
                            text: `Activité terminée — délai de ${GRACE_HOURS}h en cours. Vous pouvez encore marquer jusqu'à ${fmtDate(status.graceEnd)}.`,
                        },
                        past: {
                            cls: "bg-red-50 border-red-300 text-red-800",
                            icon: <Ban className="w-5 h-5 shrink-0" />,
                            text: `Le délai de marquage est expiré. Il n'est plus possible de marquer des présences pour cette activité.`,
                        },
                        unknown: {
                            cls: "bg-gray-100 border-gray-300 text-gray-600",
                            icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
                            text: "Sélectionnez une activité pour activer le marquage.",
                        },
                    }[status.code];

                    return (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Marquer manuellement
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Membres de la classe qui n'ont pas encore scanné
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                                    <Clock className="w-4 h-4" />
                                    {membresAMarquer.length} à marquer
                                </span>
                            </div>

                            {/* Bannière de statut */}
                            {statusBanner && (
                                <div className={`mx-4 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${statusBanner.cls}`}>
                                    {statusBanner.icon}
                                    <span>{statusBanner.text}</span>
                                </div>
                            )}

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            {["Membre", "Famille", "Action"].map((h) => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {membresAMarquer.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">
                                                    Aucun membre à marquer
                                                </td>
                                            </tr>
                                        ) : (
                                            membresAMarquerPagines.map((m, i) => (
                                                <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                                        {m.prenom} {m.nom}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-gray-600">
                                                        {m.famille?.nom ?? "—"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {canMark ? (
                                                            <button
                                                                disabled={markingMemberId === m.id}
                                                                onClick={() => handleManualMark(m)}
                                                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                                    markingMemberId === m.id
                                                                        ? "bg-gray-100 text-gray-400 cursor-wait"
                                                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                                }`}
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                {markingMemberId === m.id ? "Marquage..." : "Marquer présent"}
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                                                                <Ban className="w-4 h-4" />
                                                                {status.code === "not_started" ? "Pas encore" : "Expiré"}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                current={marquerPageSafe}
                                total={totalMarquerPages}
                                count={membresAMarquer.length}
                                perPage={membresParPage}
                                onPrev={() => setMarquerPage((p) => Math.max(1, p - 1))}
                                onNext={() => setMarquerPage((p) => Math.min(totalMarquerPages, p + 1))}
                            />
                        </div>
                    );
                })()}

                {/* Tab: Activités */}
                {activeTab === "activites" && (() => {
                    const ACT_PER_PAGE = 8;
                    const totalActPages = Math.max(1, Math.ceil(activitesSource.length / ACT_PER_PAGE));
                    const actPageSafe = Math.min(Math.max(activitesPage, 1), totalActPages);
                    const activitesPaginees = activitesSource.slice(
                        (actPageSafe - 1) * ACT_PER_PAGE,
                        actPageSafe * ACT_PER_PAGE,
                    );

                    return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900">
                                Liste des activités
                            </h2>
                            <span className="text-sm text-gray-500">
                                {activitesSource.length} activité{activitesSource.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {loadingProgrammeActivites ? (
                            <p className="text-sm text-gray-500 px-6 py-8">Chargement des activités...</p>
                        ) : activitesSource.length === 0 ? (
                            <p className="text-sm text-gray-500 px-6 py-8">Aucune activité disponible.</p>
                        ) : (
                            <>
                            <div className="flex flex-col gap-2 p-4">
                                {activitesPaginees.map((a) => {
                                    const s = getMarquageStatus(a, null, now);
                                    const isActive    = s.code === "in_progress" || s.code === "grace";
                                    const isWaiting   = s.code === "today_waiting";
                                    const isPast      = s.code === "past";
                                    const isSelected  = selectedActiviteId === a.id;

                                    const rowCls = isPast
                                        ? "border-gray-200 bg-gray-50 opacity-50"
                                        : isActive
                                            ? "border-emerald-400 bg-emerald-50 shadow-sm"
                                            : isWaiting
                                                ? "border-blue-300 bg-blue-50/60"
                                                : isSelected
                                                    ? "border-blue-300 bg-blue-50"
                                                    : "border-gray-200 bg-white hover:bg-gray-50";

                                    const statusBadge = {
                                        future:        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200"><Timer className="w-3 h-3" />Planifiée</span>,
                                        today_waiting: <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300"><Timer className="w-3 h-3" />Aujourd'hui</span>,
                                        in_progress:   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300"><CheckCircle className="w-3 h-3" />En cours</span>,
                                        grace:         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300"><Clock className="w-3 h-3" />Délai en cours</span>,
                                        past:          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500 border border-gray-300"><Ban className="w-3 h-3" />Passée</span>,
                                        unknown:       null,
                                    }[s.code];

                                    return (
                                        <div
                                            key={a.id}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${rowCls}`}
                                        >
                                            {/* Infos */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-sm font-bold ${isPast ? "text-gray-400" : isActive ? "text-emerald-900" : "text-gray-900"}`}>
                                                        {a.titre}
                                                    </span>
                                                    {statusBadge}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <span className={`text-xs ${isPast ? "text-gray-400" : "text-gray-500"}`}>
                                                        Début : {formatDateTime(a.date_heure_debut)}
                                                    </span>
                                                    {a.date_heure_fin && (
                                                        <span className={`text-xs ${isPast ? "text-gray-400" : "text-gray-500"}`}>
                                                            Fin : {formatDateTime(a.date_heure_fin)}
                                                        </span>
                                                    )}
                                                    {/* Compte à rebours */}
                                                    {isWaiting && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                                            <Timer className="w-3 h-3" />
                                                            Début dans {formatCountdown(s.msLeft)}
                                                        </span>
                                                    )}
                                                    {isActive && s.graceEnd && (
                                                        <span className="text-xs text-emerald-600 font-medium">
                                                            Marquage ouvert jusqu'à {fmtDate(s.graceEnd)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                                {!isPast && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedActiviteId(a.id);
                                                            setActiveTab("presence");
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors"
                                                    >
                                                        Présence
                                                    </button>
                                                )}

                                                {/* Bouton Marquer — actif si en cours, désactivé si aujourd'hui en attente, absent si passé/futur */}
                                                {(isActive || isWaiting) && (
                                                    <button
                                                        disabled={!isActive}
                                                        onClick={() => {
                                                            if (!isActive) return;
                                                            setSelectedActiviteId(a.id);
                                                            setActiveTab("marquer");
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                                                            isActive
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Marquer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Pagination
                                current={actPageSafe}
                                total={totalActPages}
                                count={activitesSource.length}
                                perPage={ACT_PER_PAGE}
                                onPrev={() => setActivitesPage((p) => Math.max(1, p - 1))}
                                onNext={() => setActivitesPage((p) => Math.min(totalActPages, p + 1))}
                            />
                            </>
                        )}
                    </div>
                    );
                })()}
            </div>
        </AppLayout>
    );
}

function Pagination({ current, total, count, perPage, onPrev, onNext }) {
    if (count <= perPage) return null;
    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{current}</span> / {total}
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrev}
                    disabled={current <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                </button>
                <button
                    onClick={onNext}
                    disabled={current >= total}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Suivant <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function fmtDate(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
