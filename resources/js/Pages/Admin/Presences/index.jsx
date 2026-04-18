import { useMemo, useState } from "react";
import { withBasePath } from "@/Utils/urlHelper";

const CLASSES = [
    {
        name: "Classe Espérance",
        pct: 81,
        present: 34,
        total: 42,
        color: "#2d2f8f",
    },
    {
        name: "Classe Victoire",
        pct: 74,
        present: 37,
        total: 50,
        color: "#4a4db8",
    },
    { name: "Classe Grâce", pct: 92, present: 46, total: 50, color: "#7c3aed" },
    { name: "Classe Foi", pct: 58, present: 29, total: 50, color: "#e53e3e" },
    {
        name: "Classe Lumière",
        pct: 85,
        present: 51,
        total: 60,
        color: "#2d2f8f",
    },
    {
        name: "Classe Éphèse",
        pct: 67,
        present: 18,
        total: 27,
        color: "#4a4db8",
    },
];

const ACTIVITES = [
    {
        name: "Activite dominicale",
        pct: 79,
        present: 247,
        total: 312,
        color: "#2d2f8f",
    },
    {
        name: "École du dimanche",
        pct: 65,
        present: 203,
        total: 312,
        color: "#4a4db8",
    },
    {
        name: "Réunion de prière",
        pct: 48,
        present: 150,
        total: 312,
        color: "#7c3aed",
    },
    {
        name: "Groupe de cellule",
        pct: 55,
        present: 172,
        total: 312,
        color: "#4a4db8",
    },
    {
        name: "Louange & Adoration",
        pct: 72,
        present: 225,
        total: 312,
        color: "#2d2f8f",
    },
];

const ALERTES = [
    {
        name: "Jean-Baptiste Koné",
        classe: "Classe Foi",
        absences: 5,
        level: "high",
    },
    {
        name: "Marie-Claire Assoua",
        classe: "Classe Victoire",
        absences: 4,
        level: "high",
    },
    {
        name: "Samuel Ouédraogo",
        classe: "Classe Éphèse",
        absences: 4,
        level: "high",
    },
    {
        name: "Esther Bamba",
        classe: "Classe Foi",
        absences: 3,
        level: "medium",
    },
    {
        name: "David Tano",
        classe: "Classe Lumière",
        absences: 3,
        level: "medium",
    },
    {
        name: "Rachel Kouamé",
        classe: "Classe Espérance",
        absences: 3,
        level: "medium",
    },
];

const TENDANCES = [
    { semaine: "Sem. 10", pct: 71 },
    { semaine: "Sem. 11", pct: 74 },
    { semaine: "Sem. 12", pct: 69 },
    { semaine: "Sem. 13", pct: 78 },
    { semaine: "Sem. 14", pct: 76 },
    { semaine: "Sem. 15", pct: 79 },
];

const PERIODES = [
    { mois: "Janvier", pct: 73 },
    { mois: "Février", pct: 76 },
    { mois: "Mars", pct: 71 },
    { mois: "Avril", pct: 79 },
];

const TABS = [
    { id: "classe", label: "Par classe", icon: "📊" },
    { id: "activite", label: "Par activité", icon: "📅" },
    { id: "periode", label: "Par période", icon: "📆" },
    { id: "participants", label: "Participants", icon: "👥" },
    { id: "alertes", label: "Alertes", icon: "⚠️" },
];

function BarRow({ name, pct, present, total, color }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
            }}
        >
            <div
                style={{
                    width: 150,
                    fontSize: 14,
                    color: "#333",
                    flexShrink: 0,
                }}
            >
                {name}
            </div>
            <div
                style={{
                    flex: 1,
                    background: "#eee",
                    borderRadius: 20,
                    height: 12,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 20,
                        background: color,
                        transition: "width 0.6s",
                    }}
                />
            </div>
            <div
                style={{
                    fontSize: 15,
                    fontWeight: 700,
                    width: 44,
                    textAlign: "right",
                    color,
                }}
            >
                {pct}%
            </div>
            <div style={{ fontSize: 12, color: "#aaa", width: 44 }}>
                {present}/{total}
            </div>
        </div>
    );
}

function KpiCard({ icon, value, label, badge, badgeColor, badgeBg }) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: 16,
                padding: "18px 20px",
                position: "relative",
                minHeight: 110,
                color: "#1e2070",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: badgeBg,
                    color: badgeColor,
                    borderRadius: 20,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                }}
            >
                {badge}
            </span>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1e2070" }}>
                {value}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {label}
            </div>
        </div>
    );
}

function normalizeActivityLabel(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function parseFlexibleDateTime(dateValue, timeValue = null) {
    const rawDate = String(dateValue ?? "").trim();
    const rawTime = String(timeValue ?? "").trim();

    if (!rawDate) return null;

    // Handles ISO values such as 2026-04-16T15:00:00.000000Z
    const directDate = new Date(rawDate);
    if (!Number.isNaN(directDate.getTime())) {
        return directDate;
    }

    // Handles values like "2026-04-16 15:00:00"
    const normalizedDate = rawDate.includes(" ")
        ? rawDate.replace(" ", "T")
        : rawDate;
    const normalizedDirect = new Date(normalizedDate);
    if (!Number.isNaN(normalizedDirect.getTime())) {
        return normalizedDirect;
    }

    if (rawTime) {
        const timeAsDate = new Date(rawTime);
        if (!Number.isNaN(timeAsDate.getTime())) {
            return timeAsDate;
        }

        const merged = new Date(`${rawDate}T${rawTime}`);
        if (!Number.isNaN(merged.getTime())) {
            return merged;
        }
    }

    return null;
}

function formatEventDate(dateValue, timeValue = null) {
    const d = parseFlexibleDateTime(dateValue, timeValue);
    if (!d || Number.isNaN(d.getTime())) return "-";

    const datePart = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    const timePart = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${datePart} ${timePart}`;
}

function getEventTimingStatus(dateValue, startTime, endTime) {
    if (!dateValue) return "à_venir";

    const start =
        parseFlexibleDateTime(dateValue, startTime) ??
        parseFlexibleDateTime(dateValue, "00:00:00");

    let end = null;
    if (endTime && String(endTime).trim()) {
        end = parseFlexibleDateTime(dateValue, endTime);
    } else if (startTime && String(startTime).trim()) {
        end = parseFlexibleDateTime(dateValue, startTime);
    }

    const now = new Date();

    if (start && !Number.isNaN(start.getTime()) && now < start) {
        return "a_venir";
    }

    if (end && !Number.isNaN(end.getTime()) && now > end) {
        return "passee";
    }

    if (
        start &&
        !Number.isNaN(start.getTime()) &&
        now >= start &&
        (!end || now <= end)
    ) {
        return "en_cours";
    }

    return "passee";
}

export default function AdminPresenceDashboard({
    stats = {},
    classesData = [],
    activitesData = [],
    periodesData = [],
    participantsData = [],
    activitesParMois2026 = {},
    alertesData = [],
    tendancesData = [],
    classInsights = {},
}) {
    const [activeTab, setActiveTab] = useState("classe");
    const [activePeriod, setActivePeriod] = useState("avril");
    const [selectedClasseId, setSelectedClasseId] = useState(null);
    const [selectedMonth2026, setSelectedMonth2026] = useState("2026-01");
    const [selectedActiviteKey, setSelectedActiviteKey] = useState(null);
    const [participantsActivitePage, setParticipantsActivitePage] = useState(1);
    const [participantsActiviteSearch, setParticipantsActiviteSearch] =
        useState("");
    const [participantsSearch, setParticipantsSearch] = useState("");
    const [participantsStatusFilter, setParticipantsStatusFilter] =
        useState("all");
    const [alertesSearch, setAlertesSearch] = useState("");
    const [alertesLevelFilter, setAlertesLevelFilter] = useState("all");
    const [alertesSortBy, setAlertesSortBy] = useState("absences_desc");

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href =
            typeof window.route === "function"
                ? window.route("admin.dashboard")
                : withBasePath("", "/admin/dashboard");
    };

    const styles = {
        dash: {
            background:
                "linear-gradient(135deg, #1e2070 0%, #2d2f8f 60%, #3a3db0 100%)",
            minHeight: "100vh",
            fontFamily: "'Segoe UI', sans-serif",
            color: "white",
        },
        topbar: {
            background: "rgba(0,0,0,0.2)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
        },
        kpiGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            padding: "20px 24px 0",
        },
        tabsWrap: { padding: "18px 24px 0" },
        tabs: {
            background: "white",
            borderRadius: 14,
            padding: 8,
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
        },
        panel: {
            background: "white",
            borderRadius: 18,
            margin: "16px 24px 0",
            padding: "22px 24px",
            color: "#1e2070",
        },
        panelTitle: {
            fontSize: 17,
            fontWeight: 700,
            color: "#1e2070",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
        },
        periodBtns: { display: "flex", gap: 6 },
        exportBtn: {
            background: "white",
            color: "#2d2f8f",
            border: "none",
            borderRadius: 10,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
        },
        backBtn: {
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
        },
    };

    const tab = (id, label, icon) => (
        <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: activeTab === id ? "#2d2f8f" : "transparent",
                color: activeTab === id ? "white" : "#555",
                transition: "background 0.15s",
            }}
        >
            <span style={{ fontSize: 14 }}>{icon}</span> {label}
        </button>
    );

    const periodBtn = (id, label) => (
        <button
            key={id}
            onClick={() => setActivePeriod(id)}
            style={{
                border: `1.5px solid ${activePeriod === id ? "#2d2f8f" : "#e0e0f0"}`,
                borderRadius: 20,
                padding: "5px 16px",
                fontSize: 12,
                cursor: "pointer",
                background: activePeriod === id ? "#2d2f8f" : "white",
                color: activePeriod === id ? "white" : "#555",
            }}
        >
            {label}
        </button>
    );

    const classesRows =
        classesData.length > 0
            ? classesData
            : CLASSES.map((c, index) => ({ ...c, id: `mock-${index}` }));
    const activitesRows = activitesData.length > 0 ? activitesData : ACTIVITES;
    const periodesRows = periodesData.length > 0 ? periodesData : PERIODES;
    const alertesRows = alertesData;
    const tendancesRows = tendancesData.length > 0 ? tendancesData : TENDANCES;

    const selectedClassKey =
        selectedClasseId === null ? null : String(selectedClasseId);
    const selectedClass = useMemo(
        () =>
            selectedClassKey === null
                ? null
                : (classesRows.find((c) => String(c.id) === selectedClassKey) ??
                  null),
        [classesRows, selectedClassKey],
    );
    const selectedInsights = selectedClassKey
        ? (classInsights?.[selectedClassKey] ?? null)
        : null;

    const activitesRowsFiltres = useMemo(() => {
        if (!selectedClass) return activitesRows;
        return selectedInsights?.activitesData ?? [];
    }, [activitesRows, selectedClass, selectedInsights]);

    const activitesRowsCartes = useMemo(
        () =>
            activitesRowsFiltres.map((row, index) => ({
                ...row,
                uiKey: `${row.name}-${row.type ?? "x"}-${index}`,
            })),
        [activitesRowsFiltres],
    );

    const activiteSelectionnee = useMemo(() => {
        if (!selectedActiviteKey) return null;
        return (
            activitesRowsCartes.find((a) => a.uiKey === selectedActiviteKey) ??
            null
        );
    }, [activitesRowsCartes, selectedActiviteKey]);

    const activitesGlobalStats = useMemo(() => {
        const present = activitesRowsCartes.reduce(
            (acc, row) => acc + Number(row.present ?? 0),
            0,
        );
        const total = activitesRowsCartes.reduce(
            (acc, row) => acc + Number(row.total ?? 0),
            0,
        );
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;

        return { present, total, pct };
    }, [activitesRowsCartes]);

    const participantsRows = useMemo(() => {
        if (!selectedClass) return participantsData;
        return selectedInsights?.participantsData ?? [];
    }, [participantsData, selectedClass, selectedInsights]);

    const participantsActiviteSelectionnee = useMemo(() => {
        if (!activiteSelectionnee?.name) {
            return [...participantsRows].sort((a, b) => {
                const dateA = new Date(a?.date || 0).getTime();
                const dateB = new Date(b?.date || 0).getTime();
                return dateB - dateA;
            });
        }

        const selectedName = normalizeActivityLabel(activiteSelectionnee.name);

        return participantsRows
            .filter((row) => {
                const activityName = normalizeActivityLabel(row?.activite);
                if (!activityName || !selectedName) return false;

                return (
                    activityName === selectedName ||
                    activityName.includes(selectedName) ||
                    selectedName.includes(activityName)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(a?.date || 0).getTime();
                const dateB = new Date(b?.date || 0).getTime();
                return dateB - dateA;
            });
    }, [participantsRows, activiteSelectionnee]);

    const participantsActiviteStats = useMemo(() => {
        const total = participantsActiviteSelectionnee.length;
        const presents = participantsActiviteSelectionnee.filter(
            (row) => String(row?.statut ?? "").toLowerCase() === "present",
        ).length;
        const absents = Math.max(total - presents, 0);

        return { total, presents, absents };
    }, [participantsActiviteSelectionnee]);

    const participantsActiviteFiltres = useMemo(() => {
        const needle = participantsActiviteSearch.trim().toLowerCase();
        if (!needle) return participantsActiviteSelectionnee;

        return participantsActiviteSelectionnee.filter((row) => {
            const participant = String(row?.participant ?? "").toLowerCase();
            const statut = String(row?.statut ?? "").toLowerCase();
            return participant.includes(needle) || statut.includes(needle);
        });
    }, [participantsActiviteSelectionnee, participantsActiviteSearch]);

    const participantsActiviteParPage = 12;
    const totalParticipantsActivitePages = Math.max(
        1,
        Math.ceil(
            participantsActiviteFiltres.length / participantsActiviteParPage,
        ),
    );
    const participantsActivitePageSafe = Math.min(
        Math.max(participantsActivitePage, 1),
        totalParticipantsActivitePages,
    );
    const participantsActivitePagines = useMemo(() => {
        const start =
            (participantsActivitePageSafe - 1) * participantsActiviteParPage;
        return participantsActiviteFiltres.slice(
            start,
            start + participantsActiviteParPage,
        );
    }, [
        participantsActiviteFiltres,
        participantsActivitePageSafe,
        participantsActiviteParPage,
    ]);

    const periodesRowsFiltres = useMemo(() => {
        if (!selectedClass) return periodesRows;
        return selectedInsights?.periodesData ?? [];
    }, [periodesRows, selectedClass, selectedInsights]);

    const months2026 = useMemo(
        () => [
            { key: "2026-01", label: "Janvier" },
            { key: "2026-02", label: "Février" },
            { key: "2026-03", label: "Mars" },
            { key: "2026-04", label: "Avril" },
            { key: "2026-05", label: "Mai" },
            { key: "2026-06", label: "Juin" },
            { key: "2026-07", label: "Juillet" },
            { key: "2026-08", label: "Août" },
            { key: "2026-09", label: "Septembre" },
            { key: "2026-10", label: "Octobre" },
            { key: "2026-11", label: "Novembre" },
            { key: "2026-12", label: "Décembre" },
        ],
        [],
    );

    const periodesMap = useMemo(() => {
        const map = {};
        for (const row of periodesRowsFiltres) {
            const key = String(row?.mois ?? "").toLowerCase();
            if (key) {
                map[key] = row;
            }
        }
        return map;
    }, [periodesRowsFiltres]);

    const activitesParMoisSourceGlobal = useMemo(
        () => activitesParMois2026 ?? {},
        [activitesParMois2026],
    );

    const activitesParMoisSourceClasse = useMemo(() => {
        if (!selectedClass) return {};
        return selectedInsights?.activitesParMois2026 ?? {};
    }, [selectedClass, selectedInsights]);

    const activitesMoisSelectionne = useMemo(() => {
        const globalListRaw =
            activitesParMoisSourceGlobal?.[selectedMonth2026] ?? [];
        const classeListRaw =
            activitesParMoisSourceClasse?.[selectedMonth2026] ?? [];

        const globalList = Array.isArray(globalListRaw) ? globalListRaw : [];
        const classeList = Array.isArray(classeListRaw) ? classeListRaw : [];

        if (selectedClass) {
            return classeList.length > 0 ? classeList : globalList;
        }

        return globalList;
    }, [
        activitesParMoisSourceGlobal,
        activitesParMoisSourceClasse,
        selectedMonth2026,
        selectedClass,
    ]);

    const alertesRowsFiltres = useMemo(() => {
        const baseRows = !selectedClass
            ? alertesRows
            : (selectedInsights?.alertesData ?? []);

        const needle = alertesSearch.trim().toLowerCase();

        const filtered = baseRows.filter((row) => {
            const level = String(row?.level ?? "").toLowerCase();
            if (alertesLevelFilter !== "all" && level !== alertesLevelFilter) {
                return false;
            }

            if (!needle) return true;

            const name = String(row?.name ?? "").toLowerCase();
            const classe = String(row?.classe ?? "").toLowerCase();
            const absences = String(row?.absences ?? "");
            const activites = String(row?.activites ?? "");

            return (
                name.includes(needle) ||
                classe.includes(needle) ||
                absences.includes(needle) ||
                activites.includes(needle)
            );
        });

        return [...filtered].sort((a, b) => {
            if (alertesSortBy === "absences_asc") {
                return (a?.absences ?? 0) - (b?.absences ?? 0);
            }
            if (alertesSortBy === "activites_desc") {
                return (b?.activites ?? 0) - (a?.activites ?? 0);
            }
            if (alertesSortBy === "activites_asc") {
                return (a?.activites ?? 0) - (b?.activites ?? 0);
            }

            return (b?.absences ?? 0) - (a?.absences ?? 0);
        });
    }, [
        alertesRows,
        selectedClass,
        selectedInsights,
        alertesSearch,
        alertesLevelFilter,
        alertesSortBy,
    ]);

    const participantsRowsFiltres = useMemo(() => {
        const needle = participantsSearch.trim().toLowerCase();

        return participantsRows.filter((row) => {
            const statut = String(row?.statut ?? "").toLowerCase();
            if (
                participantsStatusFilter === "present" &&
                statut !== "present"
            ) {
                return false;
            }
            if (participantsStatusFilter === "absent" && statut !== "absent") {
                return false;
            }

            if (!needle) return true;

            const participant = String(row?.participant ?? "").toLowerCase();
            const activite = String(row?.activite ?? "").toLowerCase();
            const classe = String(row?.classe ?? "").toLowerCase();
            const statutText = String(row?.statut ?? "").toLowerCase();
            const dateText = formatParticipantDate(row?.date).toLowerCase();

            return (
                participant.includes(needle) ||
                activite.includes(needle) ||
                classe.includes(needle) ||
                statutText.includes(needle) ||
                dateText.includes(needle)
            );
        });
    }, [participantsRows, participantsSearch, participantsStatusFilter]);

    const totalPeriode = periodesRowsFiltres.reduce(
        (acc, row) => acc + (row.total ?? 0),
        0,
    );
    const presentPeriode = periodesRowsFiltres.reduce(
        (acc, row) => acc + (row.present ?? 0),
        0,
    );
    const moyennePeriode =
        totalPeriode > 0
            ? Math.round((presentPeriode / totalPeriode) * 100)
            : 0;

    return (
        <div style={styles.dash}>
            {/* Topbar */}
            <div style={styles.topbar}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button style={styles.backBtn} onClick={handleBack}>
                        ‹ Retour
                    </button>
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                opacity: 0.6,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            Vue Administrateur
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            Présences — Vue globale
                            <span
                                style={{
                                    background: "rgba(255,255,255,0.15)",
                                    borderRadius: 20,
                                    padding: "3px 14px",
                                    fontSize: 13,
                                    fontWeight: 400,
                                }}
                            >
                                {selectedClass
                                    ? `Classe: ${selectedClass.name}`
                                    : "Toutes les classes"}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    style={styles.exportBtn}
                    onClick={() => {
                        window.location.href =
                            typeof window.route === "function"
                                ? window.route("admin.presences.export")
                                : withBasePath("", "/admin/presences/export");
                    }}
                >
                    Exporter
                </button>
            </div>

            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
                <KpiCard
                    icon="🏛️"
                    value={String(stats.total_classes ?? 8)}
                    label="Classes actives"
                    badge="Global"
                    badgeBg="#e8f0fe"
                    badgeColor="#2d2f8f"
                />
                <KpiCard
                    icon="👥"
                    value={String(stats.total_membres ?? 312)}
                    label="Total membres"
                    badge="+3%"
                    badgeBg="#e6f4ea"
                    badgeColor="#1a7740"
                />
                <KpiCard
                    icon="✔️"
                    value={String(stats.presents_dernier ?? 247)}
                    label="Présents dernière activité"
                    badge="Récent"
                    badgeBg="#fff3e0"
                    badgeColor="#c45c00"
                />
                <KpiCard
                    icon="⚠️"
                    value={String(stats.absences_recurrentes ?? 18)}
                    label="Absences récurrentes"
                    badge="Alerte"
                    badgeBg="#fce8e8"
                    badgeColor="#c0392b"
                />
            </div>

            {/* Tabs */}
            <div style={styles.tabsWrap}>
                <div style={styles.tabs}>
                    {TABS.map(({ id, label, icon }) => tab(id, label, icon))}
                </div>
            </div>

            {/* Panel: Par classe */}
            {activeTab === "classe" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Classes (cartes cliquables)
                        <div style={styles.periodBtns}>
                            {periodBtn("avril", "Avril 2026")}
                            {periodBtn("trimestre", "Ce trimestre")}
                            {periodBtn("annuel", "Annuel")}
                        </div>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(210px, 1fr))",
                            gap: 12,
                            marginBottom: 20,
                        }}
                    >
                        <button
                            onClick={() => setSelectedClasseId(null)}
                            style={{
                                border:
                                    selectedClasseId === null
                                        ? "2px solid #2d2f8f"
                                        : "1px solid #e6e7f7",
                                borderRadius: 14,
                                background:
                                    selectedClasseId === null
                                        ? "#f3f4ff"
                                        : "#fff",
                                padding: "14px",
                                textAlign: "left",
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginBottom: 6,
                                }}
                            >
                                Vue globale
                            </div>
                            <div
                                style={{
                                    fontWeight: 700,
                                    color: "#1e2070",
                                    fontSize: 15,
                                }}
                            >
                                Toutes les classes
                            </div>
                        </button>

                        {classesRows.map((c) => {
                            const isActive =
                                selectedClassKey !== null &&
                                String(c.id) === selectedClassKey;

                            return (
                                <button
                                    key={c.id ?? c.name}
                                    onClick={() => setSelectedClasseId(c.id)}
                                    style={{
                                        border: isActive
                                            ? "2px solid #2d2f8f"
                                            : "1px solid #e6e7f7",
                                        borderRadius: 14,
                                        background: isActive
                                            ? "#f3f4ff"
                                            : "#fff",
                                        padding: "14px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#666",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {c.pct}% de participation
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: "#1e2070",
                                            fontSize: 15,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {c.name}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            height: 6,
                                            borderRadius: 20,
                                            background: "#ececf8",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${c.pct}%`,
                                                height: "100%",
                                                background: c.color,
                                                borderRadius: 20,
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            marginBottom: 10,
                            fontSize: 13,
                            color: "#666",
                        }}
                    >
                        {selectedClass
                            ? `Classe sélectionnée: ${selectedClass.name}`
                            : "Sélectionnez une classe pour filtrer les autres onglets."}
                    </div>
                </div>
            )}

            {/* Panel: Par activité */}
            {activeTab === "activite" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Activités (cartes cliquables)
                    </div>

                    {activitesRowsFiltres.length === 0 && (
                        <div style={{ fontSize: 13, color: "#888" }}>
                            Aucune donnée d'activité pour cette classe.
                        </div>
                    )}

                    {activitesRowsFiltres.length > 0 && (
                        <>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(210px, 1fr))",
                                    gap: 12,
                                    marginBottom: 20,
                                }}
                            >
                                <button
                                    onClick={() => {
                                        setSelectedActiviteKey(null);
                                        setParticipantsActivitePage(1);
                                        setParticipantsActiviteSearch("");
                                    }}
                                    style={{
                                        border:
                                            selectedActiviteKey === null ||
                                            !activiteSelectionnee
                                                ? "2px solid #2d2f8f"
                                                : "1px solid #e6e7f7",
                                        borderRadius: 14,
                                        background:
                                            selectedActiviteKey === null ||
                                            !activiteSelectionnee
                                                ? "#f3f4ff"
                                                : "#fff",
                                        padding: "14px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#666",
                                            marginBottom: 6,
                                        }}
                                    >
                                        Vue globale
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: "#1e2070",
                                            fontSize: 15,
                                            marginBottom: 8,
                                        }}
                                    >
                                        Toutes les activités
                                    </div>
                                    <div
                                        style={{ fontSize: 12, color: "#555" }}
                                    >
                                        {activitesGlobalStats.present}/
                                        {activitesGlobalStats.total}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            height: 6,
                                            borderRadius: 20,
                                            background: "#ececf8",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${activitesGlobalStats.pct}%`,
                                                height: "100%",
                                                background: "#2d2f8f",
                                                borderRadius: 20,
                                            }}
                                        />
                                    </div>
                                </button>

                                {activitesRowsCartes.map((a) => {
                                    const isActive =
                                        selectedActiviteKey !== null &&
                                        a.uiKey === selectedActiviteKey;

                                    return (
                                        <button
                                            key={a.uiKey}
                                            onClick={() => {
                                                setSelectedActiviteKey(a.uiKey);
                                                setParticipantsActivitePage(1);
                                                setParticipantsActiviteSearch(
                                                    "",
                                                );
                                            }}
                                            style={{
                                                border: isActive
                                                    ? "2px solid #2d2f8f"
                                                    : "1px solid #e6e7f7",
                                                borderRadius: 14,
                                                background: isActive
                                                    ? "#f3f4ff"
                                                    : "#fff",
                                                padding: "14px",
                                                textAlign: "left",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "#666",
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {a.pct}% de participation
                                            </div>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#1e2070",
                                                    fontSize: 15,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                {a.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "#555",
                                                }}
                                            >
                                                {a.present}/{a.total}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    height: 6,
                                                    borderRadius: 20,
                                                    background: "#ececf8",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${a.pct}%`,
                                                        height: "100%",
                                                        background:
                                                            a.color ??
                                                            "#2d2f8f",
                                                        borderRadius: 20,
                                                    }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                style={{
                                    padding: "12px 16px",
                                    background: "#f5f6ff",
                                    borderRadius: 10,
                                    marginBottom: 8,
                                }}
                            >
                                {activiteSelectionnee ? (
                                    <>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "#555",
                                            }}
                                        >
                                            Activité sélectionnée :
                                        </span>{" "}
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: "#1e2070",
                                            }}
                                        >
                                            {activiteSelectionnee.name}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: 10,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: "#2d2f8f",
                                                background: "#e8f0fe",
                                                borderRadius: 12,
                                                padding: "2px 10px",
                                            }}
                                        >
                                            Taux: {activiteSelectionnee.pct}% (
                                            {activiteSelectionnee.present}/
                                            {activiteSelectionnee.total})
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "#555",
                                            }}
                                        >
                                            Taux global des activités :
                                        </span>{" "}
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: "#2d2f8f",
                                            }}
                                        >
                                            {activitesGlobalStats.pct}%
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "#666",
                                                marginLeft: 8,
                                            }}
                                        >
                                            ({activitesGlobalStats.present}/
                                            {activitesGlobalStats.total})
                                        </span>
                                    </>
                                )}
                            </div>

                            {participantsRows.length > 0 && (
                                <div
                                    style={{
                                        marginTop: 14,
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 12,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "12px 14px",
                                            background: "#fafbff",
                                            borderBottom: "1px solid #e5e7eb",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: "#1e2070",
                                        }}
                                    >
                                        {activiteSelectionnee
                                            ? `Participants de l'activité: ${activiteSelectionnee.name}`
                                            : "Participants de toutes les activités"}
                                        <span
                                            style={{
                                                marginLeft: 10,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#1e2070",
                                                background: "#e8f0fe",
                                                borderRadius: 999,
                                                padding: "2px 9px",
                                            }}
                                        >
                                            Total:{" "}
                                            {participantsActiviteStats.total}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#166534",
                                                background: "#dcfce7",
                                                borderRadius: 999,
                                                padding: "2px 9px",
                                            }}
                                        >
                                            Présents:{" "}
                                            {participantsActiviteStats.presents}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#991b1b",
                                                background: "#fee2e2",
                                                borderRadius: 999,
                                                padding: "2px 9px",
                                            }}
                                        >
                                            Absents:{" "}
                                            {participantsActiviteStats.absents}
                                        </span>
                                    </div>

                                    {participantsActiviteSelectionnee.length >
                                        0 && (
                                        <div
                                            style={{
                                                padding: "10px 12px",
                                                borderBottom:
                                                    "1px solid #eef0f7",
                                                background: "#fff",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    participantsActiviteSearch
                                                }
                                                onChange={(e) => {
                                                    setParticipantsActiviteSearch(
                                                        e.target.value,
                                                    );
                                                    setParticipantsActivitePage(
                                                        1,
                                                    );
                                                }}
                                                placeholder="Rechercher un nom ou un statut..."
                                                style={{
                                                    width: "100%",
                                                    border: "1px solid #d9dcf2",
                                                    borderRadius: 8,
                                                    padding: "8px 10px",
                                                    fontSize: 12,
                                                }}
                                            />
                                        </div>
                                    )}

                                    {participantsActiviteSelectionnee.length ===
                                    0 ? (
                                        <div
                                            style={{
                                                padding: "14px",
                                                fontSize: 13,
                                                color: "#777",
                                            }}
                                        >
                                            Aucun participant trouvé pour cette
                                            activité.
                                        </div>
                                    ) : participantsActiviteFiltres.length ===
                                      0 ? (
                                        <div
                                            style={{
                                                padding: "14px",
                                                fontSize: 13,
                                                color: "#777",
                                            }}
                                        >
                                            Aucun participant trouvé pour cette
                                            recherche.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse: "collapse",
                                                    fontSize: 13,
                                                }}
                                            >
                                                <thead>
                                                    <tr>
                                                        <th style={thStyle}>
                                                            Participant
                                                        </th>
                                                        <th style={thStyle}>
                                                            Activité
                                                        </th>
                                                        <th style={thStyle}>
                                                            Statut
                                                        </th>
                                                        <th style={thStyle}>
                                                            Date
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {participantsActivitePagines.map(
                                                        (row, index) => {
                                                            const isPresent =
                                                                String(
                                                                    row?.statut ??
                                                                        "",
                                                                ).toLowerCase() ===
                                                                "present";

                                                            return (
                                                                <tr
                                                                    key={`${row.participant}-${row.activite}-${index}`}
                                                                >
                                                                    <td
                                                                        style={
                                                                            tdStyle
                                                                        }
                                                                    >
                                                                        {
                                                                            row.participant
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        style={
                                                                            tdStyle
                                                                        }
                                                                    >
                                                                        {row.activite ||
                                                                            "-"}
                                                                    </td>
                                                                    <td
                                                                        style={
                                                                            tdStyle
                                                                        }
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                display:
                                                                                    "inline-block",
                                                                                borderRadius: 999,
                                                                                padding:
                                                                                    "3px 10px",
                                                                                fontSize: 11,
                                                                                fontWeight: 700,
                                                                                color: isPresent
                                                                                    ? "#166534"
                                                                                    : "#991b1b",
                                                                                background:
                                                                                    isPresent
                                                                                        ? "#dcfce7"
                                                                                        : "#fee2e2",
                                                                            }}
                                                                        >
                                                                            {isPresent
                                                                                ? "Présent"
                                                                                : "Absent"}
                                                                        </span>
                                                                    </td>
                                                                    <td
                                                                        style={
                                                                            tdStyle
                                                                        }
                                                                    >
                                                                        {formatParticipantDate(
                                                                            row?.date,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>

                                            {participantsActiviteFiltres.length >
                                                participantsActiviteParPage && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        padding: "10px 12px",
                                                        borderTop:
                                                            "1px solid #eef0f7",
                                                        gap: 10,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#666",
                                                        }}
                                                    >
                                                        Page{" "}
                                                        {
                                                            participantsActivitePageSafe
                                                        }{" "}
                                                        /{" "}
                                                        {
                                                            totalParticipantsActivitePages
                                                        }
                                                    </span>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            style={{
                                                                border: "1px solid #d9dcf2",
                                                                borderRadius: 8,
                                                                background:
                                                                    "white",
                                                                color: "#2d2f8f",
                                                                padding:
                                                                    "6px 10px",
                                                                fontSize: 12,
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                setParticipantsActivitePage(
                                                                    (p) =>
                                                                        Math.max(
                                                                            1,
                                                                            p -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                            disabled={
                                                                participantsActivitePageSafe <=
                                                                1
                                                            }
                                                        >
                                                            Précédent
                                                        </button>
                                                        <button
                                                            type="button"
                                                            style={{
                                                                border: "1px solid #d9dcf2",
                                                                borderRadius: 8,
                                                                background:
                                                                    "white",
                                                                color: "#2d2f8f",
                                                                padding:
                                                                    "6px 10px",
                                                                fontSize: 12,
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                setParticipantsActivitePage(
                                                                    (p) =>
                                                                        Math.min(
                                                                            totalParticipantsActivitePages,
                                                                            p +
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                            disabled={
                                                                participantsActivitePageSafe >=
                                                                totalParticipantsActivitePages
                                                            }
                                                        >
                                                            Suivant
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Panel: Par période */}
            {activeTab === "periode" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Mois 2026 (cartes cliquables)
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(210px, 1fr))",
                            gap: 12,
                            marginBottom: 18,
                        }}
                    >
                        {months2026.map((month) => {
                            const monthRow =
                                periodesMap[
                                    String(month.label).toLowerCase()
                                ] ?? null;
                            const isActive = selectedMonth2026 === month.key;

                            return (
                                <button
                                    key={month.key}
                                    onClick={() =>
                                        setSelectedMonth2026(month.key)
                                    }
                                    style={{
                                        border: isActive
                                            ? "2px solid #2d2f8f"
                                            : "1px solid #e6e7f7",
                                        borderRadius: 14,
                                        background: isActive
                                            ? "#f3f4ff"
                                            : "#fff",
                                        padding: "14px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#666",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {month.key}
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: "#1e2070",
                                            fontSize: 15,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {month.label}
                                    </div>
                                    <div
                                        style={{ fontSize: 12, color: "#555" }}
                                    >
                                        {monthRow
                                            ? `${monthRow.present ?? 0}/${monthRow.total ?? 0}`
                                            : "0/0"}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 8,
                                            height: 6,
                                            borderRadius: 20,
                                            background: "#ececf8",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${monthRow?.pct ?? 0}%`,
                                                height: "100%",
                                                background: "#2d2f8f",
                                                borderRadius: 20,
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 8,
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "12px 14px",
                                background: "#fafbff",
                                borderBottom: "1px solid #e5e7eb",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#1e2070",
                            }}
                        >
                            Activités du mois:{" "}
                            {
                                months2026.find(
                                    (m) => m.key === selectedMonth2026,
                                )?.label
                            }
                        </div>

                        {activitesMoisSelectionne.length === 0 ? (
                            <div
                                style={{
                                    padding: "14px",
                                    fontSize: 13,
                                    color: "#777",
                                }}
                            >
                                Aucune activité pour ce mois.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: 13,
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>Activité</th>
                                            <th style={thStyle}>Date</th>
                                            <th style={thStyle}>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activitesMoisSelectionne.map(
                                            (item, index) => {
                                                const timingStatus =
                                                    getEventTimingStatus(
                                                        item.date,
                                                        item.heure,
                                                        item.heure_fin,
                                                    );

                                                const statusLabel =
                                                    timingStatus === "en_cours"
                                                        ? "En cours"
                                                        : timingStatus ===
                                                            "passee"
                                                          ? "Passée"
                                                          : "À venir";

                                                const statusStyle =
                                                    timingStatus === "en_cours"
                                                        ? {
                                                              color: "#065f46",
                                                              background:
                                                                  "#d1fae5",
                                                          }
                                                        : timingStatus ===
                                                            "passee"
                                                          ? {
                                                                color: "#7c2d12",
                                                                background:
                                                                    "#ffedd5",
                                                            }
                                                          : {
                                                                color: "#1d4ed8",
                                                                background:
                                                                    "#dbeafe",
                                                            };

                                                return (
                                                    <tr
                                                        key={`${item.id}-${index}`}
                                                    >
                                                        <td style={tdStyle}>
                                                            {item.titre}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            {formatEventDate(
                                                                item.date,
                                                                item.heure,
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-block",
                                                                    borderRadius: 999,
                                                                    padding:
                                                                        "3px 10px",
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    ...statusStyle,
                                                                }}
                                                            >
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Panel: Participants */}
            {activeTab === "participants" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Participants et présences
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            marginBottom: 16,
                        }}
                    >
                        <input
                            type="text"
                            value={participantsSearch}
                            onChange={(e) =>
                                setParticipantsSearch(e.target.value)
                            }
                            placeholder="Rechercher un participant, une activité ou une classe..."
                            style={{
                                flex: 1,
                                minWidth: 260,
                                border: "1px solid #d9dcf2",
                                borderRadius: 10,
                                padding: "9px 12px",
                                fontSize: 13,
                            }}
                        />

                        <select
                            value={participantsStatusFilter}
                            onChange={(e) =>
                                setParticipantsStatusFilter(e.target.value)
                            }
                            style={{
                                border: "1px solid #d9dcf2",
                                borderRadius: 10,
                                padding: "9px 12px",
                                fontSize: 13,
                                minWidth: 160,
                            }}
                        >
                            <option value="present">Présents</option>
                            <option value="all">Tous les statuts</option>
                            <option value="absent">Absents</option>
                        </select>
                    </div>

                    {participantsRowsFiltres.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#888" }}>
                            Aucun participant trouvé pour ce filtre.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 13,
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Participant</th>
                                        <th style={thStyle}>Activité</th>
                                        <th style={thStyle}>Statut</th>
                                        <th style={thStyle}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participantsRowsFiltres.map(
                                        (row, index) => {
                                            const isPresent =
                                                String(
                                                    row?.statut ?? "",
                                                ).toLowerCase() === "present";

                                            return (
                                                <tr
                                                    key={`${row.participant}-${row.activite}-${index}`}
                                                >
                                                    <td style={tdStyle}>
                                                        {row.participant}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        {row.activite}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                borderRadius: 999,
                                                                padding:
                                                                    "3px 10px",
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: isPresent
                                                                    ? "#166534"
                                                                    : "#991b1b",
                                                                background:
                                                                    isPresent
                                                                        ? "#dcfce7"
                                                                        : "#fee2e2",
                                                            }}
                                                        >
                                                            {isPresent
                                                                ? "Présent"
                                                                : "Absent"}
                                                        </span>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        {formatParticipantDate(
                                                            row?.date,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Panel: Alertes */}
            {activeTab === "alertes" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Membres en retard sur 3 activités ou plus
                        <span
                            style={{
                                background: "#fce8e8",
                                color: "#c0392b",
                                borderRadius: 20,
                                padding: "3px 14px",
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {alertesRowsFiltres.length} membres
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            marginBottom: 14,
                        }}
                    >
                        <input
                            type="text"
                            value={alertesSearch}
                            onChange={(e) => setAlertesSearch(e.target.value)}
                            placeholder="Rechercher un membre ou une classe..."
                            style={{
                                flex: 1,
                                minWidth: 260,
                                border: "1px solid #d9dcf2",
                                borderRadius: 10,
                                padding: "9px 12px",
                                fontSize: 13,
                            }}
                        />
                        <select
                            value={alertesLevelFilter}
                            onChange={(e) =>
                                setAlertesLevelFilter(e.target.value)
                            }
                            style={{
                                border: "1px solid #d9dcf2",
                                borderRadius: 10,
                                padding: "9px 12px",
                                fontSize: 13,
                                minWidth: 150,
                            }}
                        >
                            <option value="all">Tous niveaux</option>
                            <option value="high">Élevé</option>
                            <option value="medium">Moyen</option>
                        </select>
                        <select
                            value={alertesSortBy}
                            onChange={(e) => setAlertesSortBy(e.target.value)}
                            style={{
                                border: "1px solid #d9dcf2",
                                borderRadius: 10,
                                padding: "9px 12px",
                                fontSize: 13,
                                minWidth: 180,
                            }}
                        >
                            <option value="absences_desc">
                                Absences décroissantes
                            </option>
                            <option value="absences_asc">
                                Absences croissantes
                            </option>
                        </select>
                    </div>

                    {alertesRowsFiltres.length === 0 && (
                        <div style={{ fontSize: 13, color: "#888" }}>
                            Aucun membre en retard sur 3 activités distinctes.
                        </div>
                    )}
                    {alertesRowsFiltres.length > 0 && (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 13,
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Membre</th>
                                        <th style={thStyle}>Classe</th>
                                        <th style={thStyle}>
                                            Activités concernées
                                        </th>
                                        <th style={thStyle}>
                                            Retards/absences
                                        </th>
                                        <th style={thStyle}>Niveau</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alertesRowsFiltres.map((row, index) => {
                                        const isHigh =
                                            String(row?.level ?? "") === "high";
                                        return (
                                            <tr
                                                key={`${row?.id ?? row?.name}-${index}`}
                                            >
                                                <td style={tdStyle}>
                                                    {row?.name}
                                                </td>
                                                <td style={tdStyle}>
                                                    {row?.classe}
                                                </td>
                                                <td style={tdStyle}>
                                                    {row?.activites ?? 0}
                                                </td>
                                                <td style={tdStyle}>
                                                    {row?.absences ?? 0}
                                                </td>
                                                <td style={tdStyle}>
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            borderRadius: 999,
                                                            padding: "3px 10px",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: isHigh
                                                                ? "#991b1b"
                                                                : "#92400e",
                                                            background: isHigh
                                                                ? "#fee2e2"
                                                                : "#fef3c7",
                                                        }}
                                                    >
                                                        {isHigh
                                                            ? "Élevé"
                                                            : "Moyen"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div style={{ height: 40 }} />
        </div>
    );
}

const thStyle = {
    textAlign: "left",
    padding: "10px 8px",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
    padding: "10px 8px",
    color: "#1f2937",
    borderBottom: "1px solid #f3f4f6",
};

function formatParticipantDate(dateValue) {
    if (!dateValue) return "-";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
