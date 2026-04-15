import { useEffect, useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { withBasePath } from "@/Utils/urlHelper";

function countByStatus(records, status) {
    return Object.values(records ?? {}).filter((s) => s === status).length;
}

function parseDateValue(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    const raw = String(dateValue).trim();
    if (!raw) return null;

    const m = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    );

    if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]) - 1;
        const day = Number(m[3]);
        const hour = Number(m[4] ?? 0);
        const minute = Number(m[5] ?? 0);
        const second = Number(m[6] ?? 0);
        const localDate = new Date(year, month, day, hour, minute, second);
        return Number.isNaN(localDate.getTime()) ? null : localDate;
    }

    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function toMonthShort(dateValue) {
    if (!dateValue) return "";
    const d = parseDateValue(dateValue);
    if (!d) return "";
    return d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
}

function toDay(dateValue) {
    if (!dateValue) return "--";
    const d = parseDateValue(dateValue);
    if (!d) return "--";
    return String(d.getDate()).padStart(2, "0");
}

function toHour(dateValue) {
    if (!dateValue) return "";
    const d = parseDateValue(dateValue);
    if (!d) return "";
    return d
        .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        .replace(":", "h");
}

function toFullDate(dateValue) {
    if (!dateValue) return "";
    const d = parseDateValue(dateValue);
    if (!d) return "";
    return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function getActivityStatus(dateValue) {
    if (!dateValue) return { label: "Passée", bg: "#f0f0f0", color: "#666" };

    const date = parseDateValue(dateValue);
    if (!date) {
        return { label: "Passée", bg: "#f0f0f0", color: "#666" };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activityDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDay.getTime() === today.getTime()) {
        return { label: "Aujourd'hui", bg: "#fff3cd", color: "#8a6d00" };
    }

    if (activityDay.getTime() > today.getTime()) {
        return { label: "À venir", bg: "#e8f0fe", color: "#2d2f8f" };
    }

    return { label: "Passée", bg: "#f0f0f0", color: "#666" };
}

function StatusBadge({ status, count }) {
    if (!count) return null;
    const cfg = {
        present: { bg: "#e6f4ea", color: "#1a7740", label: "présent" },
        absent: { bg: "#fce8e8", color: "#c0392b", label: "absent" },
        excuse: { bg: "#fff3e0", color: "#c45c00", label: "excusé" },
    }[status];
    return (
        <span
            style={{
                background: cfg.bg,
                color: cfg.color,
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
            }}
        >
            {count} {count > 1 ? cfg.label + "s" : cfg.label}
        </span>
    );
}

function Avatar({ initiales, size = 36, bg = "#2d2f8f" }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 10,
                background: bg,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.33,
                fontWeight: 700,
                flexShrink: 0,
            }}
        >
            {initiales}
        </div>
    );
}

// ─── Onglet Historique ───────────────────────────────────────────────────────
function TabHistorique({ selected, onSelect, historique = [], famille }) {
    return (
        <div>
            {historique.map((evt) => {
                const nbPresent = countByStatus(evt.presences, "present");
                const nbAbsent = countByStatus(evt.presences, "absent");
                const nbExcuse = countByStatus(evt.presences, "excuse");
                const isOpen = selected === evt.id;

                return (
                    <div key={evt.id} style={{ marginBottom: 10 }}>
                        <div
                            onClick={() => onSelect(isOpen ? null : evt.id)}
                            style={{
                                background: isOpen ? "#f5f6ff" : "white",
                                border: `1px solid ${isOpen ? "#c0c4f0" : "#ebebf0"}`,
                                borderRadius: 14,
                                padding: "14px 18px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                cursor: "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            {/* Date bloc */}
                            <div
                                style={{
                                    background: evt.couleur,
                                    color: "white",
                                    borderRadius: 12,
                                    padding: "8px 12px",
                                    textAlign: "center",
                                    flexShrink: 0,
                                    minWidth: 52,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        lineHeight: 1,
                                    }}
                                >
                                    {evt.jour}
                                </div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        opacity: 0.85,
                                        marginTop: 2,
                                    }}
                                >
                                    {evt.mois}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: "#1e2070",
                                    }}
                                >
                                    {evt.activite}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#999",
                                        marginTop: 2,
                                    }}
                                >
                                    {famille?.classe} · {evt.heure}
                                </div>
                            </div>

                            {/* Badges */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                }}
                            >
                                <StatusBadge
                                    status="present"
                                    count={nbPresent}
                                />
                                <StatusBadge status="absent" count={nbAbsent} />
                                <StatusBadge status="excuse" count={nbExcuse} />
                                <span style={{ color: "#ccc", fontSize: 18 }}>
                                    ›
                                </span>
                            </div>
                        </div>

                        {/* Détail membres */}
                        {isOpen && (
                            <div
                                style={{
                                    background: "#f9f9ff",
                                    border: "1px solid #e0e0f5",
                                    borderRadius: "0 0 14px 14px",
                                    padding: "12px 18px",
                                    marginTop: -4,
                                }}
                            >
                                {(famille?.membres ?? []).map((m) => {
                                    const st = evt.presences[m.id];
                                    const cfg = {
                                        present: {
                                            bg: "#e6f4ea",
                                            color: "#1a7740",
                                            label: "Présent",
                                        },
                                        absent: {
                                            bg: "#fce8e8",
                                            color: "#c0392b",
                                            label: "Absent",
                                        },
                                        excuse: {
                                            bg: "#fff3e0",
                                            color: "#c45c00",
                                            label: "Excusé",
                                        },
                                    }[st] ?? {
                                        bg: "#f0f0f0",
                                        color: "#777",
                                        label: "Non marqué",
                                    };
                                    return (
                                        <div
                                            key={m.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "8px 0",
                                                borderBottom:
                                                    "0.5px solid #ebebf5",
                                            }}
                                        >
                                            <Avatar
                                                initiales={m.initiales}
                                                size={32}
                                                bg={evt.couleur}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: "#1e2070",
                                                    }}
                                                >
                                                    {m.prenom}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#aaa",
                                                    }}
                                                >
                                                    {m.role}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    background: cfg.bg,
                                                    color: cfg.color,
                                                    borderRadius: 20,
                                                    padding: "3px 12px",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {cfg.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Onglet Statistiques ─────────────────────────────────────────────────────
function TabStatistiques({ statsMembres = [] }) {
    return (
        <div>
            {/* Taux global famille */}
            <div
                style={{
                    background: "#f0f2ff",
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 18,
                }}
            >
                <div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                        Taux global famille
                    </div>
                    <div
                        style={{
                            fontSize: 30,
                            fontWeight: 800,
                            color: "#2d2f8f",
                        }}
                    >
                        76%
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "#1a7740",
                            background: "#e6f4ea",
                            display: "inline-block",
                            borderRadius: 20,
                            padding: "2px 10px",
                            marginTop: 4,
                        }}
                    >
                        ▲ +5% vs mois dernier
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            background: "#dde0ff",
                            borderRadius: 20,
                            height: 10,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: "76%",
                                height: "100%",
                                background: "#2d2f8f",
                                borderRadius: 20,
                            }}
                        />
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                        Sur les 5 dernières activités
                    </div>
                </div>
            </div>

            {/* Par membre */}
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1e2070",
                    marginBottom: 12,
                }}
            >
                Par membre
            </div>
            {statsMembres.map((m) => (
                <div
                    key={m.id}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 0",
                        borderBottom: "0.5px solid #f0f0f5",
                    }}
                >
                    <Avatar
                        initiales={m.initiales}
                        size={36}
                        bg={
                            m.pct >= 80
                                ? "#2d2f8f"
                                : m.pct >= 70
                                  ? "#7c3aed"
                                  : "#e53e3e"
                        }
                    />
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 5,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#1e2070",
                                }}
                            >
                                {m.prenom}
                            </span>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color:
                                        m.pct >= 80
                                            ? "#1a7740"
                                            : m.pct >= 70
                                              ? "#7c3aed"
                                              : "#c0392b",
                                }}
                            >
                                {m.pct}%
                            </span>
                        </div>
                        <div
                            style={{
                                background: "#eee",
                                borderRadius: 20,
                                height: 7,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${m.pct}%`,
                                    height: "100%",
                                    borderRadius: 20,
                                    background:
                                        m.pct >= 80
                                            ? "#2d2f8f"
                                            : m.pct >= 70
                                              ? "#7c3aed"
                                              : "#e53e3e",
                                    transition: "width 0.6s",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 4,
                                fontSize: 11,
                                color: "#aaa",
                            }}
                        >
                            <span style={{ color: "#1a7740" }}>
                                ✓ {m.presents} présents
                            </span>
                            {m.absents > 0 && (
                                <span style={{ color: "#c0392b" }}>
                                    ✗ {m.absents} absents
                                </span>
                            )}
                            {m.excuses > 0 && (
                                <span style={{ color: "#c45c00" }}>
                                    ~ {m.excuses} excusés
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Onglet Absences ─────────────────────────────────────────────────────────
function TabAbsences({ absences = [], famille }) {
    const grouped = absences.reduce((acc, a) => {
        if (!acc[a.prenom]) acc[a.prenom] = [];
        acc[a.prenom].push(a);
        return acc;
    }, {});

    return (
        <div>
            {Object.entries(grouped).map(([prenom, list]) => {
                const m = (famille?.membres ?? []).find(
                    (mb) => mb.prenom === prenom,
                ) || { initiales: prenom.slice(0, 2).toUpperCase() };
                const nbAbsent = list.filter((l) => l.type === "absent").length;
                return (
                    <div key={prenom} style={{ marginBottom: 14 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 8,
                            }}
                        >
                            <Avatar
                                initiales={m.initiales}
                                size={32}
                                bg={nbAbsent >= 3 ? "#e53e3e" : "#c45c00"}
                            />
                            <span
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: "#1e2070",
                                }}
                            >
                                {prenom}
                            </span>
                            {nbAbsent >= 3 && (
                                <span
                                    style={{
                                        background: "#fce8e8",
                                        color: "#c0392b",
                                        borderRadius: 20,
                                        padding: "2px 10px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                >
                                    ⚠ Absences répétées
                                </span>
                            )}
                        </div>
                        {list.map((l, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 14px",
                                    background: "#fafafa",
                                    borderRadius: 10,
                                    marginBottom: 4,
                                    borderLeft: `3px solid ${l.type === "absent" ? "#e53e3e" : "#f6a821"}`,
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{ fontSize: 13, color: "#333" }}
                                    >
                                        {l.activite}
                                    </div>
                                    <div
                                        style={{ fontSize: 11, color: "#aaa" }}
                                    >
                                        {l.date}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        borderRadius: 20,
                                        padding: "2px 10px",
                                        background:
                                            l.type === "absent"
                                                ? "#fce8e8"
                                                : "#fff3e0",
                                        color:
                                            l.type === "absent"
                                                ? "#c0392b"
                                                : "#c45c00",
                                    }}
                                >
                                    {l.type === "absent" ? "Absent" : "Excusé"}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Composant principal ─────────────────────────────────────────────────────
const TABS = [
    { id: "activites", label: "Activités", icon: "📅" },
    { id: "statistiques", label: "Statistiques", icon: "📊" },
    { id: "absences", label: "Absences", icon: "⚠️" },
    { id: "historique", label: "Historique", icon: "🕐" },
];

export default function RespoFamilleDashboard(props) {
    const famille = props.famille ?? {
        nom: "",
        classe: "",
        conducteur: "",
        membres: [],
    };
    const activites = props.activites ?? [];
    const presencesByActivity = props.presences ?? {};

    const [activeTab, setActiveTab] = useState("historique");
    const [selectedEvt, setSelectedEvt] = useState(null);
    const [selectedActiviteId, setSelectedActiviteId] = useState(
        activites[0]?.id ?? null,
    );
    const [apiActivites, setApiActivites] = useState([]);
    const [loadingApiActivites, setLoadingApiActivites] = useState(false);
    const [saving, setSaving] = useState(false);
    const dashboardHref =
        typeof window.route === "function"
            ? withBasePath(
                  window.route("responsable_famille.dashboard"),
                  "/responsable-famille/dashboard",
              )
            : withBasePath("", "/responsable-famille/dashboard");

    const activitesAffichables = useMemo(() => activites, [activites]);

    useEffect(() => {
        if (activeTab !== "activites") return;

        let cancelled = false;

        async function fetchApiActivites() {
            setLoadingApiActivites(true);
            try {
                const endpoint =
                    typeof window.route === "function"
                        ? window.route("responsable_famille.api.activites")
                        : withBasePath(
                              "",
                              "/api/responsable-famille/activites",
                          );

                const response = await fetch(endpoint, {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    throw new Error("Impossible de charger les activités");
                }

                const data = await response.json();
                const source = [
                    ...(Array.isArray(data?.current) ? data.current : []),
                    ...(Array.isArray(data?.history) ? data.history : []),
                    ...(Array.isArray(data?.all) ? data.all : []),
                ];

                const seen = new Set();
                const normalized = source
                    .map((item) => {
                        const datePart = item?.date ?? null;
                        const timePart = item?.time ?? item?.heure ?? "00:00:00";
                        const dateHeure =
                            item?.date_heure_debut ??
                            (datePart ? `${datePart} ${timePart}` : null);
                        const dateValue = parseDateValue(dateHeure);

                        return {
                            id: item?.id,
                            titre: item?.title ?? item?.titre ?? "Activite",
                            date_heure_debut: dateHeure,
                            heure:
                                item?.heure ??
                                (item?.time
                                    ? toHour(`1970-01-01 ${item.time}`)
                                    : ""),
                            dateValue,
                        };
                    })
                    .filter((item) => item.id && item.date_heure_debut)
                    .filter((item) => {
                        if (seen.has(item.id)) return false;
                        seen.add(item.id);
                        return true;
                    })
                    .sort(
                        (a, b) =>
                            (b.dateValue?.getTime() ?? 0) -
                            (a.dateValue?.getTime() ?? 0),
                    );

                if (!cancelled) {
                    setApiActivites(normalized);
                }
            } catch (error) {
                if (!cancelled) {
                    setApiActivites([]);
                }
                console.error("Erreur API activités responsable", error);
            } finally {
                if (!cancelled) {
                    setLoadingApiActivites(false);
                }
            }
        }

        fetchApiActivites();

        return () => {
            cancelled = true;
        };
    }, [activeTab]);

    const activitesOnglet =
        apiActivites.length > 0 ? apiActivites : activitesAffichables;

    // Données Marquer (état présences en cours)
    const initialForSelected = useMemo(() => {
        const initial = {};
        (famille.membres ?? []).forEach((m) => {
            initial[m.id] =
                presencesByActivity[selectedActiviteId]?.[m.id] ?? null;
        });
        return initial;
    }, [famille.membres, presencesByActivity, selectedActiviteId]);

    const [presences, setPresences] = useState(initialForSelected);

    const historique = useMemo(() => {
        return [...activites].map((a) => ({
            id: a.id,
            jour: toDay(a.date_heure_debut),
            mois: toMonthShort(a.date_heure_debut),
            couleur: "#2d2f8f",
            activite: a.titre,
            heure: a.heure ?? toHour(a.date_heure_debut),
            presences: presencesByActivity[a.id] ?? {},
        }));
    }, [activites, presencesByActivity]);

    const statsMembres = useMemo(() => {
        const totalActs = historique.length;
        return (famille.membres ?? []).map((m) => {
            let presents = 0;
            let absents = 0;
            let excuses = 0;
            historique.forEach((h) => {
                const st = h.presences[m.id];
                if (st === "present") presents += 1;
                if (st === "absent") absents += 1;
                if (st === "excuse") excuses += 1;
            });
            const pct =
                totalActs > 0 ? Math.round((presents / totalActs) * 100) : 0;
            return {
                id: m.id,
                prenom: m.prenom,
                initiales: m.initiales,
                presents,
                absents,
                excuses,
                pct,
            };
        });
    }, [famille.membres, historique]);

    const absences = useMemo(() => {
        const lines = [];
        historique.forEach((h) => {
            (famille.membres ?? []).forEach((m) => {
                const st = h.presences[m.id];
                if (st === "absent" || st === "excuse") {
                    lines.push({
                        prenom: m.prenom,
                        initiales: m.initiales,
                        activite: h.activite,
                        date: `${h.jour} ${h.mois}`,
                        type: st,
                    });
                }
            });
        });
        return lines;
    }, [famille.membres, historique]);

    const absencesRepetees = statsMembres.filter((m) => m.absents >= 3).length;

    const togglePresence = (id, status) => {
        setPresences((prev) => ({
            ...prev,
            [id]: prev[id] === status ? null : status,
        }));
    };

    const handleSelectActivite = (id) => {
        if (!id) {
            setSelectedActiviteId(null);
            setPresences({});
            return;
        }

        setSelectedActiviteId(id);
        const refreshed = {};
        (famille.membres ?? []).forEach((m) => {
            refreshed[m.id] = presencesByActivity[id]?.[m.id] ?? null;
        });
        setPresences(refreshed);
    };

    useEffect(() => {
        if (!activitesAffichables.length) {
            handleSelectActivite(null);
            return;
        }

        const stillVisible = activitesAffichables.some(
            (a) => a.id === selectedActiviteId,
        );
        if (!stillVisible) {
            handleSelectActivite(activitesAffichables[0].id);
        }
    }, [activitesAffichables, selectedActiviteId]);

    const handleSave = async () => {
        if (!selectedActiviteId) return;
        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        setSaving(true);
        try {
            const endpoint =
                typeof window.route === "function"
                    ? window.route(
                          "responsable_famille.presences.enregistrer",
                          selectedActiviteId,
                      )
                    : withBasePath(
                          "",
                          `/responsable-famille/presences/${selectedActiviteId}`,
                      );

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": token ?? "",
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
                body: JSON.stringify({ marquages: presences }),
            });
            if (!res.ok) throw new Error("Erreur enregistrement");
            window.location.reload();
        } catch {
            alert("Impossible d'enregistrer les présences.");
        } finally {
            setSaving(false);
        }
    };

    const nbMarques = Object.values(presences).filter(Boolean).length;
    const nbPresents = Object.values(presences).filter(
        (s) => s === "present",
    ).length;
    const nbAbsents = Object.values(presences).filter(
        (s) => s === "absent",
    ).length;
    const nbNonMarque = (famille.membres ?? []).length - nbMarques;

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
            <div
                style={{
                    background: "rgba(0,0,0,0.2)",
                    padding: "14px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link
                        href={dashboardHref}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(255,255,255,0.14)",
                            border: "1px solid rgba(255,255,255,0.24)",
                            color: "white",
                            borderRadius: 10,
                            padding: "9px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        <span aria-hidden="true">←</span>
                        <span>Retour</span>
                    </Link>
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                opacity: 0.6,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            {famille.classe} · Conducteur : {famille.conducteur}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>
                            Gestion des présences
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "white",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    Pointage reserve au conducteur
                </div>
            </div>

            {/* KPI Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14,
                    padding: "20px 24px 0",
                }}
            >
                {[
                    {
                        icon: "👥",
                        val: (famille.membres ?? []).length,
                        label: "Membres de la famille",
                        badge: "Total",
                        badgeBg: "#e8f0fe",
                        badgeColor: "#2d2f8f",
                    },
                    {
                        icon: "✔️",
                        val: nbPresents,
                        label: "Présents",
                        badge: `${Math.round((nbPresents / ((famille.membres ?? []).length || 1)) * 100) || 0}%`,
                        badgeBg: "#e6f4ea",
                        badgeColor: "#1a7740",
                    },
                    {
                        icon: "✖️",
                        val: nbAbsents,
                        label: "Absents / Excusés",
                        badge:
                            nbNonMarque > 0
                                ? `${nbNonMarque} non marqués`
                                : "OK",
                        badgeBg: nbNonMarque > 0 ? "#fff3e0" : "#e6f4ea",
                        badgeColor: nbNonMarque > 0 ? "#c45c00" : "#1a7740",
                    },
                    {
                        icon: "⚠️",
                        val: absencesRepetees,
                        label: "Absences répétées (3+)",
                        badge: "Alerte",
                        badgeBg: "#fce8e8",
                        badgeColor: "#c0392b",
                    },
                ].map(({ icon, val, label, badge, badgeBg, badgeColor }) => (
                    <div
                        key={label}
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
                        <div style={{ fontSize: 18, marginBottom: 6 }}>
                            {icon}
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: "#1e2070",
                            }}
                        >
                            {val}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: "#888",
                                marginTop: 4,
                            }}
                        >
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ padding: "18px 24px 0" }}>
                <div
                    style={{
                        background: "white",
                        borderRadius: 14,
                        padding: 8,
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                    }}
                >
                    {TABS.map(({ id, label, icon }) => (
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
                                background:
                                    activeTab === id
                                        ? "#2d2f8f"
                                        : "transparent",
                                color: activeTab === id ? "white" : "#555",
                                transition: "background 0.15s",
                            }}
                        >
                            <span style={{ fontSize: 14 }}>{icon}</span> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel */}
            <div
                style={{
                    background: "white",
                    borderRadius: 18,
                    margin: "16px 24px 0",
                    padding: "22px 24px",
                    color: "#1e2070",
                }}
            >
                {/* ── Marquer ─────────────────────────────────────────────────── */}
                {activeTab === "marquer" && (
                    <div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 6,
                            }}
                        >
                            Sélectionner une activité
                        </div>
                        <select
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: 10,
                                border: "1.5px solid #e0e0f0",
                                fontSize: 14,
                                color: "#333",
                                marginBottom: 18,
                                outline: "none",
                            }}
                            value={selectedActiviteId ?? ""}
                            onChange={(e) =>
                                handleSelectActivite(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                        >
                            <option value="">Choisir une activité...</option>
                            {(activitesAffichables ?? []).map((a) => (
                                <option key={a.id} value={a.id}>
                                    {`${a.titre} · ${a.heure ?? toHour(a.date_heure_debut)}`}
                                </option>
                            ))}
                        </select>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ fontSize: 14, color: "#555" }}>
                                Membres de la famille
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {[
                                    ["P", "#1a7740", "#e6f4ea", nbPresents],
                                    ["A", "#c0392b", "#fce8e8", nbAbsents],
                                    ["?", "#888", "#f0f0f0", nbNonMarque],
                                ].map(([l, c, bg, n]) => (
                                    <span
                                        key={l}
                                        style={{
                                            background: bg,
                                            color: c,
                                            borderRadius: 20,
                                            padding: "2px 10px",
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {n} {l}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {(famille.membres ?? []).map((m) => {
                            const st = presences[m.id];
                            return (
                                <div
                                    key={m.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "12px 0",
                                        borderBottom: "0.5px solid #f0f0f5",
                                    }}
                                >
                                    <Avatar
                                        initiales={m.initiales}
                                        size={40}
                                        bg="#2d2f8f"
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#1e2070",
                                            }}
                                        >
                                            {m.prenom}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "#aaa",
                                            }}
                                        >
                                            {m.role}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {[
                                            {
                                                s: "present",
                                                label: "Présent",
                                                bg:
                                                    st === "present"
                                                        ? "#1a7740"
                                                        : "#e6f4ea",
                                                color:
                                                    st === "present"
                                                        ? "white"
                                                        : "#1a7740",
                                            },
                                            {
                                                s: "absent",
                                                label: "Absent",
                                                bg:
                                                    st === "absent"
                                                        ? "#c0392b"
                                                        : "#fce8e8",
                                                color:
                                                    st === "absent"
                                                        ? "white"
                                                        : "#c0392b",
                                            },
                                            {
                                                s: "excuse",
                                                label: "Excusé",
                                                bg:
                                                    st === "excuse"
                                                        ? "#c45c00"
                                                        : "#fff3e0",
                                                color:
                                                    st === "excuse"
                                                        ? "white"
                                                        : "#c45c00",
                                            },
                                        ].map(({ s, label, bg, color }) => (
                                            <button
                                                key={s}
                                                onClick={() =>
                                                    togglePresence(m.id, s)
                                                }
                                                disabled={!selectedActiviteId}
                                                style={{
                                                    border: "none",
                                                    borderRadius: 20,
                                                    padding: "6px 14px",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: !selectedActiviteId
                                                        ? "not-allowed"
                                                        : "pointer",
                                                    opacity: !selectedActiviteId
                                                        ? 0.6
                                                        : 1,
                                                    background: bg,
                                                    color,
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        <div
                            style={{
                                marginTop: 16,
                                background: "#f5f6ff",
                                borderRadius: 10,
                                padding: "10px 16px",
                                fontSize: 13,
                                color: "#555",
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>
                                {nbMarques}/{(famille.membres ?? []).length}{" "}
                                membres marqués
                            </span>
                            <span style={{ color: "#2d2f8f", fontWeight: 600 }}>
                                {Math.round(
                                    (nbPresents /
                                        ((famille.membres ?? []).length || 1)) *
                                        100,
                                )}
                                % de présence
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Activités ────────────────────────────────────────────────── */}
                {activeTab === "activites" && (
                    <div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 16,
                            }}
                        >
                            Activités de votre conducteur
                        </div>
                        {loadingApiActivites && (
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "#667",
                                    padding: "6px 0 12px",
                                }}
                            >
                                Chargement des activités du conducteur...
                            </div>
                        )}
                        {activitesOnglet.map((a) => {
                            const status = getActivityStatus(a?.date_heure_debut);

                            return (
                                <div
                                    key={a.id}
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
                                            background: "#2d2f8f",
                                            color: "white",
                                            borderRadius: 12,
                                            padding: "8px 12px",
                                            textAlign: "center",
                                            minWidth: 52,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 800,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {toDay(a.date_heure_debut)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                opacity: 0.85,
                                                marginTop: 2,
                                            }}
                                        >
                                            {toMonthShort(a.date_heure_debut)}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#1e2070",
                                            }}
                                        >
                                            {a.titre}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "#aaa",
                                                marginTop: 2,
                                            }}
                                        >
                                            {famille.classe} ·{" "}
                                            {a.heure ??
                                                toHour(a.date_heure_debut)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "#7b7b90",
                                                marginTop: 3,
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {toFullDate(a.date_heure_debut)}
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            background: status.bg,
                                            color: status.color,
                                            borderRadius: 20,
                                            padding: "4px 14px",
                                            fontSize: 12,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {status.label}
                                    </span>
                                </div>
                            );
                        })}
                        {!loadingApiActivites && activitesOnglet.length === 0 && (
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "#667",
                                        background: "#f8f9ff",
                                        border: "1px solid #e8eafb",
                                        borderRadius: 10,
                                        padding: "12px 14px",
                                    }}
                                >
                                    Aucune activité trouvée pour votre classe.
                                </div>
                            )}
                    </div>
                )}

                {/* ── Statistiques ─────────────────────────────────────────────── */}
                {activeTab === "statistiques" && (
                    <TabStatistiques statsMembres={statsMembres} />
                )}

                {/* ── Absences ──────────────────────────────────────────────────── */}
                {activeTab === "absences" && (
                    <TabAbsences absences={absences} famille={famille} />
                )}

                {/* ── Historique ───────────────────────────────────────────────── */}
                {activeTab === "historique" && (
                    <div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 16,
                            }}
                        >
                            Historique des présences — Avril 2026
                        </div>
                        <TabHistorique
                            selected={selectedEvt}
                            onSelect={setSelectedEvt}
                            historique={historique}
                            famille={famille}
                        />
                    </div>
                )}
            </div>

            <div style={{ height: 40 }} />
        </div>
    );
}
