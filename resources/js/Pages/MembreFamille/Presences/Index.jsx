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

const STATUT_ACTIVITE = {
    a_venir:  { label: "À venir",  bg: "#e8f0fe", color: "#1d4ed8", dot: "#3b82f6" },
    en_cours: { label: "En cours", bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    passe:    { label: "Passée",   bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
};

function ActiviteRow({ titre, date_debut, date_fin, heure, lieu, statut }) {
    const cfg = STATUT_ACTIVITE[statut] ?? STATUT_ACTIVITE.passe;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "0.5px solid #f0f0f5" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2070" }}>{titre}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                    {date_debut}{date_fin && date_fin !== date_debut ? ` → ${date_fin}` : ""}{heure ? ` · ${heure}` : ""}{lieu ? ` · ${lieu}` : ""}
                </div>
            </div>
            <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                {cfg.label}
            </span>
        </div>
    );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function MembreFamilleView({ membre = {}, historique = [], activites = [] }) {
    const [showAll, setShowAll] = useState(false);
    const [activeTab, setActiveTab] = useState("presences");
    const [activiteFilter, setActiviteFilter] = useState("a_venir");
    const historiqueFiltree = useMemo(() => historique, [historique]);

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

    const listePresences = useMemo(
        () => historiqueFiltree.filter((h) => h.statut === "present"),
        [historiqueFiltree],
    );
    const listeAbsences = useMemo(
        () => historiqueFiltree.filter((h) => h.statut === "absent" || h.statut === "excuse"),
        [historiqueFiltree],
    );

    const listeActive = activeTab === "presences" ? listePresences : listeAbsences;
    const displayed = showAll ? listeActive : listeActive.slice(0, 5);

    const activitesFiltrees = useMemo(
        () => activites.filter((a) => a.statut === activiteFilter),
        [activites, activiteFilter],
    );

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

            {/* Historique avec onglets */}
            <div
                style={{
                    background: "white",
                    borderRadius: 20,
                    margin: "16px 24px 0",
                    color: "#1e2070",
                    overflow: "hidden",
                }}
            >
                {/* Onglets */}
                <div style={{ display: "flex", borderBottom: "1.5px solid #f0f0f5" }}>
                    {[
                        { key: "presences", label: "Présences", count: listePresences.length, dot: "#22c55e", activeBg: "#e6f4ea", activeColor: "#1a7740" },
                        { key: "absences",  label: "Absences",  count: listeAbsences.length,  dot: "#e53e3e", activeBg: "#fce8e8", activeColor: "#c0392b" },
                        { key: "activites", label: "Activités", count: activites.length,       dot: "#3b82f6", activeBg: "#e8f0fe", activeColor: "#1d4ed8" },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setShowAll(false); }}
                                style={{
                                    flex: 1,
                                    padding: "16px 12px",
                                    background: isActive ? tab.activeBg : "transparent",
                                    border: "none",
                                    borderBottom: isActive ? `2.5px solid ${tab.dot}` : "2.5px solid transparent",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: 14,
                                    color: isActive ? tab.activeColor : "#999",
                                    transition: "all 0.2s",
                                }}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: tab.dot, flexShrink: 0 }} />
                                {tab.label}
                                <span style={{
                                    background: isActive ? tab.dot : "#eee",
                                    color: isActive ? "white" : "#999",
                                    borderRadius: 20,
                                    padding: "1px 9px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Contenu — Activités */}
                {activeTab === "activites" && (
                    <div style={{ padding: "16px 24px" }}>
                        {/* Sous-filtres */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                            {[
                                { key: "a_venir",  label: "À venir",  dot: "#3b82f6" },
                                { key: "en_cours", label: "En cours", dot: "#22c55e" },
                                { key: "passe",    label: "Passées",  dot: "#9ca3af" },
                            ].map((f) => {
                                const cnt = activites.filter((a) => a.statut === f.key).length;
                                const isActive = activiteFilter === f.key;
                                return (
                                    <button key={f.key} onClick={() => setActiviteFilter(f.key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: isActive ? `1.5px solid ${f.dot}` : "1.5px solid #e5e7eb", background: isActive ? f.dot : "white", color: isActive ? "white" : "#555", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                                        {f.label}
                                        <span style={{ background: isActive ? "rgba(255,255,255,0.3)" : "#eee", color: isActive ? "white" : "#888", borderRadius: 20, padding: "0 7px", fontSize: 11 }}>{cnt}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {activitesFiltrees.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 14 }}>
                                Aucune activité dans cette catégorie.
                            </div>
                        ) : (
                            activitesFiltrees.map((a) => (
                                <ActiviteRow key={`${a.type}-${a.id}`} {...a} />
                            ))
                        )}
                    </div>
                )}

                {/* Contenu — Présences / Absences */}
                {activeTab !== "activites" && (
                <div style={{ padding: "16px 24px" }}>
                    {listeActive.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 14 }}>
                            {activeTab === "presences" ? "Aucune présence enregistrée." : "Aucune absence enregistrée."}
                        </div>
                    ) : (
                        <>
                            {displayed.map((h) => (
                                <HistoriqueRow
                                    key={h.id}
                                    activite={h.activite}
                                    date={h.date}
                                    classe={membre.classe}
                                    statut={h.statut}
                                />
                            ))}
                            {listeActive.length > 5 && (
                                <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
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
                                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#2d2f8f" }}>
                                            {showAll ? "↑" : "↓"}
                                        </span>
                                        {showAll ? "Voir moins" : `Voir tout (${listeActive.length})`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                )}
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
