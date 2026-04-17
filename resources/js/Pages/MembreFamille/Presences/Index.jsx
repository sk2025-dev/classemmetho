import { useMemo, useState } from "react";

const STATUT_CONFIG = {
    present: {
        label: "Présent(e)",
        dot: "#22c55e",
        bg: "#e6f4ea",
        color: "#1a7740",
    },
    absent: {
        label: "Absent(e)",
        dot: "#e53e3e",
        bg: "#fce8e8",
        color: "#c0392b",
    },
    excuse: {
        label: "Excusé(e)",
        dot: "#f6a821",
        bg: "#fff3e0",
        color: "#c45c00",
    },
};

// ─── Sous-composants ─────────────────────────────────────────────────────────
function KpiCard({
    icon,
    iconBg,
    value,
    label,
    badge,
    badgeColor,
    badgeBg,
    bar,
    barColor,
}) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: 20,
                padding: "20px 22px",
                position: "relative",
                flex: 1,
                minWidth: 0,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
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

            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    marginBottom: 14,
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#1e2070",
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: 13,
                    color: "#999",
                    marginTop: 6,
                    lineHeight: 1.4,
                }}
            >
                {label}
            </div>

            {bar !== undefined && (
                <div
                    style={{
                        marginTop: 14,
                        background: "#eee",
                        borderRadius: 20,
                        height: 6,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${bar}%`,
                            height: "100%",
                            borderRadius: 20,
                            background: barColor,
                            transition: "width 0.6s",
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function HistoriqueRow({ activite, date, classe, statut }) {
    const cfg = STATUT_CONFIG[statut];
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: "0.5px solid #f0f0f5",
            }}
        >
            <div
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: cfg.dot,
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1 }}>
                <div
                    style={{ fontSize: 15, fontWeight: 600, color: "#1e2070" }}
                >
                    {activite} — {date}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                    {classe} · {cfg.label}
                </div>
            </div>
            <span
                style={{
                    background: cfg.bg,
                    color: cfg.color,
                    borderRadius: 20,
                    padding: "5px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                }}
            >
                {cfg.label}
            </span>
        </div>
    );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function MembreFamilleView({ membre = {}, historique = [] }) {
    const [showAll, setShowAll] = useState(false);
    const [activityKindFilter, setActivityKindFilter] = useState("tous");

    const historiqueFiltree = useMemo(() => {
        if (activityKindFilter === "cultes") {
            return historique.filter(
                (h) =>
                    Boolean(h.is_culte) ||
                    String(h.type ?? "")
                        .toLowerCase()
                        .includes("culte"),
            );
        }

        if (activityKindFilter === "activites") {
            return historique.filter(
                (h) =>
                    !Boolean(h.is_culte) &&
                    !String(h.type ?? "")
                        .toLowerCase()
                        .includes("culte"),
            );
        }

        return historique;
    }, [historique, activityKindFilter]);

    const nbPresents = useMemo(
        () => historiqueFiltree.filter((h) => h.statut === "present").length,
        [historiqueFiltree],
    );
    const nbAbsents = useMemo(
        () => historiqueFiltree.filter((h) => h.statut === "absent").length,
        [historiqueFiltree],
    );
    const nbExcuses = useMemo(
        () => historiqueFiltree.filter((h) => h.statut === "excuse").length,
        [historiqueFiltree],
    );
    const taux = useMemo(() => {
        if (historiqueFiltree.length === 0) return 0;
        return Math.round((nbPresents / historiqueFiltree.length) * 100);
    }, [historiqueFiltree.length, nbPresents]);

    const currentMonth = new Date().getMonth() + 1;
    const ceMonthTot = useMemo(
        () => historiqueFiltree.filter((h) => h.mois === currentMonth).length,
        [historiqueFiltree, currentMonth],
    );
    const ceMonthPres = useMemo(
        () =>
            historiqueFiltree.filter(
                (h) => h.mois === currentMonth && h.statut === "present",
            ).length,
        [historiqueFiltree, currentMonth],
    );

    const displayed = showAll
        ? historiqueFiltree
        : historiqueFiltree.slice(0, 5);

    return (
        <div
            style={{
                background:
                    "linear-gradient(135deg, #1e2070 0%, #2d2f8f 60%, #3a3db0 100%)",
                minHeight: "100vh",
                fontFamily: "'Segoe UI', sans-serif",
                color: "white",
            }}
        >
            {/* Topbar */}
            <div style={{ padding: "14px 24px 0" }}>
                <div
                    style={{
                        fontSize: 11,
                        opacity: 0.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 10,
                    }}
                >
                    Vue membre de famille
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            fontSize: 15,
                            cursor: "pointer",
                            opacity: 0.8,
                        }}
                        onClick={() => window.history.back()}
                    >
                        ‹ Retour
                    </button>
                    <div style={{ fontSize: 26, fontWeight: 700 }}>
                        Mes présences
                    </div>
                    <span
                        style={{
                            background: "rgba(255,255,255,0.15)",
                            color: "white",
                            borderRadius: 20,
                            padding: "4px 16px",
                            fontSize: 13,
                        }}
                    >
                        Mon historique personnel
                    </span>
                </div>
            </div>

            {/* Avatar + Nom */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 24px 0",
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                    }}
                >
                    {membre.initiales ?? "--"}
                </div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {membre.prenom} {membre.nom}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                        {membre.classe} · {membre.conducteur}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div
                style={{
                    display: "flex",
                    gap: 14,
                    padding: "20px 24px 0",
                    flexWrap: "wrap",
                }}
            >
                <KpiCard
                    icon="📅"
                    iconBg="#e8f0fe"
                    value={historique.length}
                    label={"Activités auxquelles\nj'ai participé"}
                    badge="2026"
                    badgeBg="#dbeafe"
                    badgeColor="#1d4ed8"
                />
                <KpiCard
                    icon="✔️"
                    iconBg="#dcfce7"
                    value={ceMonthPres}
                    label="Présences ce mois-ci"
                    badge="Ce mois"
                    badgeBg="#dcfce7"
                    badgeColor="#15803d"
                    bar={
                        ceMonthTot > 0
                            ? Math.round((ceMonthPres / ceMonthTot) * 100)
                            : 0
                    }
                    barColor="#22c55e"
                />
                <KpiCard
                    icon="📈"
                    iconBg="#fef9c3"
                    value={`${taux}%`}
                    label="Mon taux d'assiduité"
                    badge="Taux perso"
                    badgeBg="#fef3c7"
                    badgeColor="#d97706"
                    bar={taux}
                    barColor="#f6a821"
                />
            </div>

            {/* Mini stats */}
            <div
                style={{
                    display: "flex",
                    gap: 10,
                    padding: "14px 24px 0",
                    flexWrap: "wrap",
                }}
            >
                {[
                    {
                        label: "Présences",
                        val: nbPresents,
                        ...STATUT_CONFIG.present,
                    },
                    {
                        label: "Absences",
                        val: nbAbsents,
                        ...STATUT_CONFIG.absent,
                    },
                    {
                        label: "Excusés",
                        val: nbExcuses,
                        ...STATUT_CONFIG.excuse,
                    },
                ].map(({ label, val, bg, color, dot }) => (
                    <div
                        key={label}
                        style={{
                            background: bg,
                            borderRadius: 14,
                            padding: "10px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                            minWidth: 90,
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: dot,
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color,
                                    lineHeight: 1,
                                }}
                            >
                                {val}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color,
                                    opacity: 0.8,
                                    marginTop: 2,
                                }}
                            >
                                {label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    padding: "14px 24px 0",
                    flexWrap: "wrap",
                }}
            >
                {[
                    { key: "tous", label: "Tous" },
                    { key: "activites", label: "Activités" },
                    { key: "cultes", label: "Cultes" },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => {
                            setActivityKindFilter(item.key);
                            setShowAll(false);
                        }}
                        style={{
                            border:
                                activityKindFilter === item.key
                                    ? "1px solid #ffffff"
                                    : "1px solid rgba(255,255,255,0.25)",
                            borderRadius: 20,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background:
                                activityKindFilter === item.key
                                    ? "rgba(255,255,255,0.95)"
                                    : "rgba(255,255,255,0.12)",
                            color:
                                activityKindFilter === item.key
                                    ? "#1e2070"
                                    : "white",
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Historique récent */}
            <div
                style={{
                    background: "white",
                    borderRadius: 20,
                    margin: "16px 24px 0",
                    padding: "22px 24px",
                    color: "#1e2070",
                }}
            >
                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#1e2070",
                        marginBottom: 4,
                    }}
                >
                    Mon historique récent
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>
                    {historiqueFiltree.length} activités enregistrées
                </div>

                {displayed.map((h) => (
                    <HistoriqueRow
                        key={h.id}
                        activite={h.activite}
                        date={h.date}
                        classe={h.is_culte ? "Culte" : membre.classe}
                        statut={h.statut}
                    />
                ))}

                {/* Voir plus / moins */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 18,
                    }}
                >
                    <button
                        onClick={() => setShowAll((p) => !p)}
                        style={{
                            background: "#f5f6ff",
                            border: "1.5px solid #e0e0f0",
                            borderRadius: 20,
                            padding: "8px 24px",
                            fontSize: 13,
                            color: "#2d2f8f",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "#e8f0fe",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                color: "#2d2f8f",
                            }}
                        >
                            {showAll ? "↑" : "↓"}
                        </span>
                        {showAll
                            ? "Voir moins"
                            : `Voir tout (${historiqueFiltree.length})`}
                    </button>
                </div>
            </div>

            {/* Encouragement card */}
            <div
                style={{
                    background:
                        taux >= 80
                            ? "rgba(34,197,94,0.15)"
                            : taux >= 60
                              ? "rgba(246,168,33,0.15)"
                              : "rgba(229,62,62,0.15)",
                    borderRadius: 16,
                    margin: "14px 24px 0",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span style={{ fontSize: 22 }}>
                    {taux >= 80 ? "🌟" : taux >= 60 ? "💪" : "🙏"}
                </span>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {taux >= 80
                            ? "Excellent ! Continuez comme ça."
                            : taux >= 60
                              ? "Bon effort, vous pouvez encore progresser !"
                              : "Votre présence est importante pour la famille."}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                        Taux d'assiduité : {taux}% sur {historique.length}{" "}
                        activités
                    </div>
                </div>
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
}
