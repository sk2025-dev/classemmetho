import { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { withBasePath } from "@/Utils/urlHelper";

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
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [presencePage, setPresencePage] = useState(1);
    const [marquerPage, setMarquerPage] = useState(1);
    const [programmeSummary, setProgrammeSummary] = useState(null);
    const [programmeActivites, setProgrammeActivites] = useState([]);
    const [loadingProgrammeActivites, setLoadingProgrammeActivites] =
        useState(false);
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

        return presents.filter((presence) => presence.methode === "qr_code");
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

        return presents.filter((presence) => presence.methode !== "qr_code");
    }, [programmeSummary]);

    const membresParPage = 12;
    const totalPresencePages = Math.max(
        1,
        Math.ceil(membresScannes.length / membresParPage),
    );
    const totalMarquerPages = Math.max(
        1,
        Math.ceil(membresAMarquer.length / membresParPage),
    );
    const presencePageSafe = Math.min(
        Math.max(presencePage, 1),
        totalPresencePages,
    );
    const marquerPageSafe = Math.min(
        Math.max(marquerPage, 1),
        totalMarquerPages,
    );
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
                if (!cancelled) {
                    setLoadingProgrammeActivites(false);
                }
            }
        }

        loadProgrammeActivites();

        return () => {
            cancelled = true;
        };
    }, [activitesEndpoint, selectedActiviteId]);

    async function loadProgrammeSummary() {
        if (!selectedActiviteId) return;

        setSummaryLoading(true);
        try {
            const endpoint = withBasePath(
                "",
                programmeSummaryTemplate.replace(
                    "{id}",
                    String(selectedActiviteId),
                ),
            );
            const response = await window.axios.get(endpoint);

            if (!response?.data?.success) return;

            setProgrammeSummary(response.data);
            const mapByMember = {};
            for (const membre of response.data.membres ?? []) {
                mapByMember[membre.id] = membre.statut ?? null;
            }
            setMarquages((prev) => ({
                ...prev,
                [selectedActiviteId]: mapByMember,
            }));
        } catch (error) {
            console.error("Erreur chargement resume programme", error);
            showToast("Erreur de chargement des présences.", "error");
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {
        if (!selectedActiviteId) return;

        const run = async () => {
            await loadProgrammeSummary();
        };

        run();
        const timer = window.setInterval(run, 10000);

        return () => {
            window.clearInterval(timer);
        };
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

            showToast(
                response?.data?.message || "Présence marquée manuellement.",
                "success",
            );
            setSummaryReloadKey((value) => value + 1);
        } catch (error) {
            showToast(
                error?.response?.data?.message ||
                    "Impossible de marquer cette présence.",
                "error",
            );
        } finally {
            setMarkingMemberId(null);
        }
    }

    return (
        <AppLayout>
            <Head title="Marquage de presence" />

            <div style={S.page}>
                {toast && (
                    <div
                        style={{
                            ...S.toast,
                            ...(toast.type === "error"
                                ? S.toastError
                                : S.toastSuccess),
                        }}
                    >
                        {toast.message}
                    </div>
                )}

                <div style={S.header}>
                    <button
                        style={S.backBtn}
                        onClick={() => window.history.back()}
                    >
                        Retour
                    </button>
                    <div>
                        <h1 style={S.title}>Marquage de presence</h1>
                        <p style={S.subTitle}>
                            {conducteur?.classe?.nom ?? "Ma classe"} ·{" "}
                            {viewerLabel} : {conducteur?.prenom}{" "}
                            {conducteur?.nom}
                        </p>
                    </div>
                </div>

                <div style={S.kpiGrid}>
                    <KpiCard
                        label="Membres"
                        value={stats.total_membres ?? membres.length}
                    />
                    <KpiCard label="Présences QR" value={nbPresentsQr} />
                    <KpiCard
                        label="Présences manuelles"
                        value={nbPresentsManuels}
                    />
                    <KpiCard label="Absents" value={nbAbsents} />
                    <KpiCard label="A marquer" value={nbNonScannes} />
                    <KpiCard label="Taux" value={`${taux}%`} />
                </div>

                <div style={S.selectorRow}>
                    <span style={S.selectorLabel}>Activite :</span>
                    <select
                        value={selectedActiviteId ?? ""}
                        onChange={(e) =>
                            setSelectedActiviteId(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        style={S.selectInput}
                    >
                        <option value="">Choisir une activite...</option>
                        {activitesSource.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.titre}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={S.tabsBar}>
                    <button
                        style={{
                            ...S.tabBtn,
                            ...(activeTab === "presence" ? S.tabBtnActive : {}),
                        }}
                        onClick={() => setActiveTab("presence")}
                    >
                        Présence
                    </button>
                    <button
                        style={{
                            ...S.tabBtn,
                            ...(activeTab === "marquer" ? S.tabBtnActive : {}),
                        }}
                        onClick={() => setActiveTab("marquer")}
                    >
                        Marquer
                    </button>
                    <button
                        style={{
                            ...S.tabBtn,
                            ...(activeTab === "activites"
                                ? S.tabBtnActive
                                : {}),
                        }}
                        onClick={() => setActiveTab("activites")}
                    >
                        Activités
                    </button>
                </div>

                {activeTab === "presence" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>
                            {activiteSelectionnee?.titre ??
                                "Sélectionner une activité"}
                        </p>
                        <p style={S.cardSub}>
                            {summaryLoading
                                ? "Chargement des présences..."
                                : programmeSummary?.programme?.is_closed
                                  ? "Activité clôturée"
                                  : "Présences uniquement via scan QR"}
                        </p>
                        <p style={S.cardSub}>
                            Membres scannés: {membresScannes.length}
                        </p>

                        <div style={{ overflowX: "auto", marginTop: 14 }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Membre</th>
                                        <th style={S.th}>Famille</th>
                                        <th style={S.th}>Activité</th>
                                        <th style={S.th}>Scanné le</th>
                                        <th style={S.th}>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membresScannes.length === 0 ? (
                                        <tr>
                                            <td style={S.emptyTd} colSpan={5}>
                                                Aucun membre scanné
                                            </td>
                                        </tr>
                                    ) : (
                                        membresScannesPagines.map((m) => (
                                            <tr key={m.id}>
                                                <td style={S.td}>
                                                    {m.prenom} {m.nom}
                                                </td>
                                                <td style={S.td}>
                                                    {m.famille?.nom ?? "-"}
                                                </td>
                                                <td style={S.td}>
                                                    {programmeSummary?.programme
                                                        ?.title ??
                                                        activiteSelectionnee?.titre ??
                                                        "-"}
                                                </td>
                                                <td style={S.td}>
                                                    {formatDateTime(
                                                        m.marquee_le,
                                                    )}
                                                </td>
                                                <td style={S.td}>
                                                    <span style={S.badgeScan}>
                                                        QR
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {membresScannes.length > membresParPage && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 12,
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <span style={S.cardSub}>
                                    Page {presencePageSafe} /{" "}
                                    {totalPresencePages}
                                </span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={S.pageBtn}
                                        onClick={() =>
                                            setPresencePage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={presencePageSafe <= 1}
                                    >
                                        Précédent
                                    </button>
                                    <button
                                        style={S.pageBtn}
                                        onClick={() =>
                                            setPresencePage((p) =>
                                                Math.min(
                                                    totalPresencePages,
                                                    p + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            presencePageSafe >=
                                            totalPresencePages
                                        }
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "marquer" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>Marquer manuellement</p>
                        <p style={S.cardSub}>
                            Membres de la classe qui n'ont pas encore scanné.
                        </p>
                        <p style={S.cardSub}>
                            Membres à marquer: {membresAMarquer.length}
                        </p>
                        <div style={{ overflowX: "auto", marginTop: 14 }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Membre</th>
                                        <th style={S.th}>Famille</th>
                                        <th style={S.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membresAMarquer.length === 0 ? (
                                        <tr>
                                            <td style={S.emptyTd} colSpan={3}>
                                                Aucun membre à marquer
                                            </td>
                                        </tr>
                                    ) : (
                                        membresAMarquerPagines.map((m) => (
                                            <tr key={m.id}>
                                                <td style={S.td}>
                                                    {m.prenom} {m.nom}
                                                </td>
                                                <td style={S.td}>
                                                    {m.famille?.nom ?? "-"}
                                                </td>
                                                <td style={S.td}>
                                                    <button
                                                        style={
                                                            markingMemberId ===
                                                            m.id
                                                                ? S.actionBtnDisabled
                                                                : S.actionBtn
                                                        }
                                                        disabled={
                                                            markingMemberId ===
                                                            m.id
                                                        }
                                                        onClick={() =>
                                                            handleManualMark(m)
                                                        }
                                                    >
                                                        {markingMemberId ===
                                                        m.id
                                                            ? "Marquage..."
                                                            : "Marquer présent"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {membresAMarquer.length > membresParPage && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 12,
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <span style={S.cardSub}>
                                    Page {marquerPageSafe} / {totalMarquerPages}
                                </span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={S.pageBtn}
                                        onClick={() =>
                                            setMarquerPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={marquerPageSafe <= 1}
                                    >
                                        Précédent
                                    </button>
                                    <button
                                        style={S.pageBtn}
                                        onClick={() =>
                                            setMarquerPage((p) =>
                                                Math.min(
                                                    totalMarquerPages,
                                                    p + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            marquerPageSafe >= totalMarquerPages
                                        }
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "activites" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>Activités</p>
                        {loadingProgrammeActivites ? (
                            <p style={S.cardSub}>Chargement des activités...</p>
                        ) : activitesSource.length === 0 ? (
                            <p style={S.cardSub}>Aucune activité disponible.</p>
                        ) : (
                            <div style={S.activityList}>
                                {activitesSource.map((a) => (
                                    <button
                                        key={a.id}
                                        style={{
                                            ...S.activityRow,
                                            ...(selectedActiviteId === a.id
                                                ? S.activityRowActive
                                                : {}),
                                        }}
                                        onClick={() => {
                                            setSelectedActiviteId(a.id);
                                            setActiveTab("presence");
                                        }}
                                    >
                                        <span style={S.activityTitle}>
                                            {a.titre}
                                        </span>
                                        <span style={S.activityDate}>
                                            {formatDateTime(a.date_heure_debut)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function KpiCard({ label, value }) {
    return (
        <div style={S.kpiCard}>
            <p style={S.kpiLabel}>{label}</p>
            <p style={S.kpiValue}>{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === "present")
        return <span style={S.badgePresent}>Present</span>;
    if (status === "absent") return <span style={S.badgeAbsent}>Absent</span>;
    if (status === "excuse") return <span style={S.badgeExcuse}>Excuse</span>;
    return <span style={S.badgePending}>Non scanne</span>;
}

function formatDateTime(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const S = {
    page: { padding: 24, minHeight: "100vh" },
    header: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
    },
    backBtn: {
        border: "1px solid #d1d5db",
        background: "white",
        borderRadius: 8,
        padding: "7px 10px",
        cursor: "pointer",
        fontSize: 12,
    },
    title: { margin: 0, fontSize: 22, color: "#111827", fontWeight: 700 },
    subTitle: { margin: "3px 0 0", color: "#6b7280", fontSize: 12 },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10,
        marginBottom: 16,
    },
    kpiCard: {
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
    },
    kpiLabel: { margin: 0, color: "#6b7280", fontSize: 11 },
    kpiValue: {
        margin: "4px 0 0",
        color: "#111827",
        fontSize: 20,
        fontWeight: 700,
    },
    selectorRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        flexWrap: "wrap",
    },
    selectorLabel: { color: "#374151", fontSize: 12, fontWeight: 600 },
    selectInput: {
        minWidth: 280,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        background: "white",
    },
    tabsBar: { display: "flex", gap: 8, marginBottom: 14 },
    tabBtn: {
        border: "1px solid #d1d5db",
        background: "white",
        color: "#374151",
        borderRadius: 999,
        padding: "7px 14px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
    },
    tabBtnActive: {
        borderColor: "#1d4ed8",
        background: "#eff6ff",
        color: "#1d4ed8",
    },
    card: {
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
    },
    cardTitle: { margin: 0, color: "#111827", fontWeight: 700, fontSize: 14 },
    cardSub: { margin: "4px 0 0", color: "#6b7280", fontSize: 12 },
    toast: {
        position: "sticky",
        top: 12,
        zIndex: 20,
        marginBottom: 12,
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid transparent",
    },
    toastSuccess: {
        background: "#ecfdf5",
        color: "#065f46",
        borderColor: "#a7f3d0",
    },
    toastError: {
        background: "#fef2f2",
        color: "#991b1b",
        borderColor: "#fecaca",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
        textAlign: "left",
        fontSize: 11,
        color: "#6b7280",
        borderBottom: "1px solid #f3f4f6",
        padding: "8px 6px",
    },
    td: {
        fontSize: 12,
        color: "#111827",
        borderBottom: "1px solid #f9fafb",
        padding: "9px 6px",
    },
    emptyTd: {
        textAlign: "center",
        color: "#9ca3af",
        padding: "14px 0",
        fontSize: 12,
    },
    badgePresent: {
        background: "#dcfce7",
        color: "#166534",
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
    },
    badgeAbsent: {
        background: "#fee2e2",
        color: "#991b1b",
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
    },
    badgeExcuse: {
        background: "#fff7ed",
        color: "#9a3412",
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
    },
    badgePending: {
        background: "#f3f4f6",
        color: "#4b5563",
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
    },
    badgeScan: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
        background: "#dbeafe",
        color: "#1d4ed8",
    },
    actionBtn: {
        border: "1px solid #1d4ed8",
        background: "#1d4ed8",
        color: "white",
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
    },
    actionBtnDisabled: {
        border: "1px solid #bfdbfe",
        background: "#eff6ff",
        color: "#6b7280",
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "wait",
    },
    activityList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10,
    },
    activityRow: {
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "white",
        padding: "10px 12px",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    activityRowActive: {
        borderColor: "#93c5fd",
        background: "#eff6ff",
    },
    activityTitle: { color: "#111827", fontSize: 13, fontWeight: 600 },
    activityDate: { color: "#6b7280", fontSize: 11 },
    pageBtn: {
        border: "1px solid #d1d5db",
        background: "#f9fafb",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        color: "#374151",
        cursor: "pointer",
    },
};
