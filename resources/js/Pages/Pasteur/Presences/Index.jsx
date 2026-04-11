import { useState } from "react";
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
        name: "Culte dominical",
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
    { id: "alertes", label: "Alertes", icon: "⚠️" },
    { id: "tendances", label: "Tendances", icon: "📈" },
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

export default function AdminPresenceDashboard({
    stats = {},
    classesData = [],
    activitesData = [],
    periodesData = [],
    alertesData = [],
    tendancesData = [],
}) {
    const [activeTab, setActiveTab] = useState("classe");
    const [activePeriod, setActivePeriod] = useState("avril");

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href =
            typeof window.route === "function"
                ? window.route("pasteur.dashboard")
                : withBasePath("", "/pasteur/dashboard");
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

    const classesRows = classesData.length > 0 ? classesData : CLASSES;
    const activitesRows = activitesData.length > 0 ? activitesData : ACTIVITES;
    const periodesRows = periodesData.length > 0 ? periodesData : PERIODES;
    const alertesRows = alertesData.length > 0 ? alertesData : ALERTES;
    const tendancesRows = tendancesData.length > 0 ? tendancesData : TENDANCES;

    const totalPeriode = periodesRows.reduce(
        (acc, row) => acc + (row.total ?? 0),
        0,
    );
    const presentPeriode = periodesRows.reduce(
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
                            Vue Admin / Pasteur — Vision globale
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
                                Toutes les classes
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    style={styles.exportBtn}
                    onClick={() => {
                        window.location.href =
                            typeof window.route === "function"
                                ? window.route("pasteur.presences.export")
                                : withBasePath("", "/pasteur/presences/export");
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
                    label="Présents dernier culte"
                    badge="Ce dim."
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
                        Taux de participation par classe
                        <div style={styles.periodBtns}>
                            {periodBtn("avril", "Avril 2026")}
                            {periodBtn("trimestre", "Ce trimestre")}
                            {periodBtn("annuel", "Annuel")}
                        </div>
                    </div>
                    {classesRows.map((c) => (
                        <BarRow key={c.name} {...c} />
                    ))}
                </div>
            )}

            {/* Panel: Par activité */}
            {activeTab === "activite" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Taux de participation par activité
                    </div>
                    {activitesRows.map((a) => (
                        <BarRow key={a.name} {...a} />
                    ))}
                </div>
            )}

            {/* Panel: Par période */}
            {activeTab === "periode" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Évolution mensuelle — 2026
                    </div>
                    {periodesRows.map(({ mois, pct, present, total }) => (
                        <BarRow
                            key={mois}
                            name={mois}
                            pct={pct}
                            present={
                                present ??
                                Math.round(((total ?? 312) * pct) / 100)
                            }
                            total={total ?? 312}
                            color="#2d2f8f"
                        />
                    ))}
                    <div
                        style={{
                            marginTop: 16,
                            padding: "12px 16px",
                            background: "#f5f6ff",
                            borderRadius: 10,
                        }}
                    >
                        <span style={{ fontSize: 13, color: "#555" }}>
                            Moyenne trimestrielle :{" "}
                        </span>
                        <span style={{ fontWeight: 700, color: "#2d2f8f" }}>
                            {moyennePeriode}%
                        </span>
                        <span
                            style={{
                                fontSize: 12,
                                color: "#1a7740",
                                marginLeft: 10,
                                background: "#e6f4ea",
                                padding: "2px 10px",
                                borderRadius: 12,
                            }}
                        >
                            Données en temps réel
                        </span>
                    </div>
                </div>
            )}

            {/* Panel: Alertes */}
            {activeTab === "alertes" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>
                        Membres avec absences répétées (3+)
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
                            {alertesRows.length} membres
                        </span>
                    </div>
                    {alertesRows.map(({ name, classe, absences, level }) => (
                        <div
                            key={name}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "11px 0",
                                borderBottom: "0.5px solid #f0f0f0",
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    background:
                                        level === "high"
                                            ? "#e53e3e"
                                            : "#f6a821",
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        color: "#222",
                                        fontWeight: 500,
                                    }}
                                >
                                    {name}
                                </div>
                                <div style={{ fontSize: 11, color: "#999" }}>
                                    {classe}
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color:
                                        level === "high"
                                            ? "#e53e3e"
                                            : "#c45c00",
                                    background:
                                        level === "high"
                                            ? "#fce8e8"
                                            : "#fff3e0",
                                    padding: "3px 12px",
                                    borderRadius: 20,
                                }}
                            >
                                {absences} absences
                            </div>
                            <button
                                style={{
                                    border: "1px solid #e0e0f0",
                                    borderRadius: 8,
                                    background: "white",
                                    color: "#2d2f8f",
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                Contacter
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Panel: Tendances */}
            {activeTab === "tendances" && (
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>Tendances hebdomadaires</div>
                    {tendancesRows.map(({ semaine, pct }) => (
                        <div
                            key={semaine}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "8px 0",
                                borderBottom: "0.5px solid #f0f0f0",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#999",
                                    width: 64,
                                    flexShrink: 0,
                                }}
                            >
                                {semaine}
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    background: "#f0f0fa",
                                    borderRadius: 10,
                                    height: 10,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        borderRadius: 10,
                                        background: "#2d2f8f",
                                        transition: "width 0.6s",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#2d2f8f",
                                    width: 36,
                                    textAlign: "right",
                                }}
                            >
                                {pct}%
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: 20 }}>
                        <div
                            style={{
                                fontSize: 13,
                                color: "#888",
                                marginBottom: 10,
                            }}
                        >
                            Résumé
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 10,
                            }}
                        >
                            {[
                                {
                                    label: "Pic",
                                    value: "92%",
                                    sub: "Classe Grâce",
                                    color: "#1a7740",
                                    bg: "#e6f4ea",
                                },
                                {
                                    label: "Moyenne",
                                    value: "75%",
                                    sub: "Ce mois",
                                    color: "#2d2f8f",
                                    bg: "#e8f0fe",
                                },
                                {
                                    label: "Plancher",
                                    value: "58%",
                                    sub: "Classe Foi",
                                    color: "#c0392b",
                                    bg: "#fce8e8",
                                },
                            ].map(({ label, value, sub, color, bg }) => (
                                <div
                                    key={label}
                                    style={{
                                        background: bg,
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color,
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color,
                                        }}
                                    >
                                        {value}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {sub}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ height: 40 }} />
        </div>
    );
}
