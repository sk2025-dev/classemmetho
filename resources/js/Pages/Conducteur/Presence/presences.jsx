import { useState, useMemo } from "react";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { withBasePath } from "@/Utils/urlHelper";

/**
 * Page Présences — Vue Conducteur de classe
 *
 * Props Inertia (depuis le contrôleur Laravel) :
 *   - conducteur         : { id, prenom, nom, classe: { id, nom } }
 *   - activites          : [{ id, titre, type, date_heure_debut, statut, presence_obligatoire }]
 *   - membres            : [{ id, prenom, nom, famille: { nom }, avatar_initiales, couleur }]
 *   - presences          : { [activite_id]: { [membre_id]: 'present'|'absent'|'excuse'|null } }
 *   - stats              : { total_membres, presents_dernier, absences_recurrentes, taux_moyen }
 *   - activite_active_id : number|null
 */
export default function Presences({
    conducteur,
    activites = [],
    membres = [],
    presences: initialPresences = {},
    stats = {},
    activite_active_id = null,
}) {
    const [activeTab, setActiveTab] = useState("marquer");
    const [selectedActiviteId, setSelectedActiviteId] = useState(
        activite_active_id ?? activites[0]?.id ?? null,
    );
    const [marquages, setMarquages] = useState(initialPresences);
    const [filterMembre, setFilterMembre] = useState("tous");
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [notes, setNotes] = useState({});

    const activiteSelectionnee = activites.find(
        (a) => a.id === selectedActiviteId,
    );
    const marquagesActivite = marquages[selectedActiviteId] ?? {};

    const membresFiltres = useMemo(() => {
        let list = membres;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (m) =>
                    `${m.prenom} ${m.nom}`.toLowerCase().includes(q) ||
                    m.famille?.nom?.toLowerCase().includes(q),
            );
        }
        if (filterMembre === "presents")
            list = list.filter((m) => marquagesActivite[m.id] === "present");
        else if (filterMembre === "absents")
            list = list.filter((m) => marquagesActivite[m.id] === "absent");
        else if (filterMembre === "non_marques")
            list = list.filter((m) => !marquagesActivite[m.id]);
        return list;
    }, [membres, searchQuery, filterMembre, marquagesActivite]);

    const nbPresents = Object.values(marquagesActivite).filter(
        (v) => v === "present",
    ).length;
    const nbAbsents = Object.values(marquagesActivite).filter(
        (v) => v === "absent",
    ).length;
    const nbExcuses = Object.values(marquagesActivite).filter(
        (v) => v === "excuse",
    ).length;
    const nbNonMarques = membres.length - nbPresents - nbAbsents - nbExcuses;
    const taux =
        membres.length > 0
            ? Math.round((nbPresents / membres.length) * 100)
            : 0;

    function setStatut(membreId, statut) {
        setMarquages((prev) => {
            const curr = prev[selectedActiviteId]?.[membreId];
            return {
                ...prev,
                [selectedActiviteId]: {
                    ...(prev[selectedActiviteId] ?? {}),
                    [membreId]: curr === statut ? null : statut,
                },
            };
        });
        setSaved(false);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const endpoint =
                typeof window.route === "function"
                    ? window.route("presences.enregistrer", selectedActiviteId)
                    : withBasePath(
                          "",
                          `/conducteur/presences/${selectedActiviteId}`,
                      );

            await window.axios.post(endpoint, {
                marquages: marquages[selectedActiviteId] ?? {},
                notes: notes[selectedActiviteId] ?? {},
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatHeure(dateStr) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <AppLayout>
            <Head title="Gestion des présences" />
            <div style={S.page}>
                {/* ── En-tête ── */}
                <div style={S.pageHeader}>
                    <div style={S.pageHeaderLeft}>
                        <button
                            style={S.backBtn}
                            onClick={() => window.history.back()}
                        >
                            ‹ Retour
                        </button>
                        <div>
                            <h1 style={S.pageTitle}>Gestion des présences</h1>
                            <p style={S.pageSubtitle}>
                                {conducteur?.classe?.nom ?? "Ma classe"} ·
                                Conducteur : {conducteur?.prenom}{" "}
                                {conducteur?.nom}
                            </p>
                        </div>
                    </div>
                    <button
                        style={{
                            ...S.btnPrimary,
                            ...(saving ? S.btnDisabled : {}),
                        }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? "Enregistrement…"
                            : saved
                              ? "✓ Enregistré"
                              : "Enregistrer les présences"}
                    </button>
                </div>

                {/* ── Stats ── */}
                <div style={S.statsGrid}>
                    <StatCard
                        icon="👥"
                        value={stats.total_membres ?? membres.length}
                        label="Membres dans la classe"
                        badge="Total"
                        badgeStyle={{ background: "#e8eaf6", color: "#283593" }}
                        barValue={100}
                        barColor="#1a237e"
                    />
                    <StatCard
                        icon="✔"
                        value={nbPresents}
                        label="Présents"
                        badge={`${taux}%`}
                        badgeStyle={
                            taux >= 70
                                ? { background: "#e8f5e9", color: "#2e7d32" }
                                : { background: "#fff3e0", color: "#e65100" }
                        }
                        barValue={taux}
                        barColor={taux >= 70 ? "#43a047" : "#ff9800"}
                    />
                    <StatCard
                        icon="✗"
                        value={nbAbsents + nbExcuses}
                        label="Absents / Excusés"
                        badge={
                            nbNonMarques > 0
                                ? `${nbNonMarques} non marqués`
                                : "Complet"
                        }
                        badgeStyle={
                            nbNonMarques > 0
                                ? { background: "#fff3e0", color: "#e65100" }
                                : { background: "#e8f5e9", color: "#2e7d32" }
                        }
                        barValue={Math.round(
                            ((nbAbsents + nbExcuses) /
                                Math.max(membres.length, 1)) *
                                100,
                        )}
                        barColor="#e53935"
                    />
                    <StatCard
                        icon="⚠"
                        value={stats.absences_recurrentes ?? 0}
                        label="Absences répétées (3+)"
                        badge="Alerte"
                        badgeStyle={{ background: "#ffebee", color: "#c62828" }}
                        barValue={Math.min(
                            Math.round(
                                ((stats.absences_recurrentes ?? 0) /
                                    Math.max(membres.length, 1)) *
                                    100,
                            ),
                            100,
                        )}
                        barColor="#e53935"
                    />
                </div>

                {/* ── Sélecteur activité ── */}
                <div style={S.activiteSelector}>
                    <span style={S.activiteSelectorLabel}>Activité :</span>
                    <div style={S.activitePills}>
                        {activites.map((a) => (
                            <button
                                key={a.id}
                                style={{
                                    ...S.activitePill,
                                    ...(selectedActiviteId === a.id
                                        ? S.activitePillActive
                                        : {}),
                                }}
                                onClick={() => setSelectedActiviteId(a.id)}
                            >
                                {typeIcon(a.type)} {a.titre}
                                <span style={S.activiteDate}>
                                    {a.date_heure_debut
                                        ? new Date(
                                              a.date_heure_debut,
                                          ).toLocaleDateString("fr-FR", {
                                              day: "numeric",
                                              month: "short",
                                          })
                                        : ""}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Onglets ── */}
                <div style={S.tabsBar}>
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            style={{
                                ...S.tab,
                                ...(activeTab === t.key ? S.tabActive : {}),
                            }}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>

                {/* ════════════════ ONGLET : MARQUER ════════════════ */}
                {activeTab === "marquer" && (
                    <div style={S.card}>
                        <div style={S.tableHeader}>
                            <div>
                                <p style={S.cardTitle}>
                                    {activiteSelectionnee?.titre ??
                                        "Sélectionner une activité"}
                                </p>
                                {activiteSelectionnee && (
                                    <p style={S.cardSub}>
                                        {formatDate(
                                            activiteSelectionnee.date_heure_debut,
                                        )}{" "}
                                        ·{" "}
                                        {formatHeure(
                                            activiteSelectionnee.date_heure_debut,
                                        )}{" "}
                                        · {membres.length} membres
                                    </p>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <MiniCounter
                                    val={nbPresents}
                                    label="P"
                                    color="#43a047"
                                    bg="#e8f5e9"
                                />
                                <MiniCounter
                                    val={nbAbsents}
                                    label="A"
                                    color="#e53935"
                                    bg="#ffebee"
                                />
                                <MiniCounter
                                    val={nbExcuses}
                                    label="E"
                                    color="#f57c00"
                                    bg="#fff3e0"
                                />
                                <MiniCounter
                                    val={nbNonMarques}
                                    label="?"
                                    color="#888"
                                    bg="#f5f5f5"
                                />
                            </div>
                        </div>

                        {/* Recherche + filtres */}
                        <div style={S.filterBar}>
                            <input
                                type="text"
                                placeholder="Rechercher un membre ou une famille…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={S.searchInput}
                            />
                            <div style={{ display: "flex", gap: 6 }}>
                                {FILTRES.map((f) => (
                                    <button
                                        key={f.key}
                                        style={{
                                            ...S.filterBtn,
                                            ...(filterMembre === f.key
                                                ? S.filterBtnActive
                                                : {}),
                                        }}
                                        onClick={() => setFilterMembre(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Barre progression */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <div style={S.progressBar}>
                                <div
                                    style={{
                                        ...S.progressFill,
                                        width: `${taux}%`,
                                        background:
                                            taux >= 70 ? "#43a047" : "#ff9800",
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "#888",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {taux}% de présence
                            </span>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: "auto" }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Membre</th>
                                        <th style={S.th}>Famille</th>
                                        <th
                                            style={{
                                                ...S.th,
                                                textAlign: "center",
                                            }}
                                        >
                                            Présence
                                        </th>
                                        <th style={S.th}>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membresFiltres.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                style={{
                                                    textAlign: "center",
                                                    color: "#aaa",
                                                    padding: "32px 0",
                                                    fontSize: 13,
                                                }}
                                            >
                                                Aucun membre trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        membresFiltres.map((m) => {
                                            const statut =
                                                marquagesActivite[m.id] ?? null;
                                            const rowBg =
                                                statut === "present"
                                                    ? "#f9fff9"
                                                    : statut === "absent"
                                                      ? "#fff9f9"
                                                      : statut === "excuse"
                                                        ? "#fffdf5"
                                                        : "transparent";
                                            return (
                                                <tr
                                                    key={m.id}
                                                    style={{
                                                        background: rowBg,
                                                    }}
                                                >
                                                    <td style={S.td}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    ...S.avatar,
                                                                    background:
                                                                        m.couleur ??
                                                                        "#1a237e",
                                                                }}
                                                            >
                                                                {m.avatar_initiales ??
                                                                    `${m.prenom[0]}${m.nom[0]}`}
                                                            </div>
                                                            <span
                                                                style={{
                                                                    fontSize: 13,
                                                                    fontWeight: 500,
                                                                    color: "#222",
                                                                }}
                                                            >
                                                                {m.prenom}{" "}
                                                                {m.nom}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            fontSize: 12,
                                                            color: "#888",
                                                        }}
                                                    >
                                                        {m.famille?.nom ?? "—"}
                                                    </td>
                                                    <td style={S.td}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 4,
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <PresenceBtn
                                                                active={
                                                                    statut ===
                                                                    "present"
                                                                }
                                                                color="#43a047"
                                                                bg="#e8f5e9"
                                                                label="Présent"
                                                                onClick={() =>
                                                                    setStatut(
                                                                        m.id,
                                                                        "present",
                                                                    )
                                                                }
                                                            />
                                                            <PresenceBtn
                                                                active={
                                                                    statut ===
                                                                    "absent"
                                                                }
                                                                color="#e53935"
                                                                bg="#ffebee"
                                                                label="Absent"
                                                                onClick={() =>
                                                                    setStatut(
                                                                        m.id,
                                                                        "absent",
                                                                    )
                                                                }
                                                            />
                                                            <PresenceBtn
                                                                active={
                                                                    statut ===
                                                                    "excuse"
                                                                }
                                                                color="#f57c00"
                                                                bg="#fff3e0"
                                                                label="Excusé"
                                                                onClick={() =>
                                                                    setStatut(
                                                                        m.id,
                                                                        "excuse",
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={S.td}>
                                                        <input
                                                            type="text"
                                                            placeholder="Note…"
                                                            value={
                                                                notes[
                                                                    selectedActiviteId
                                                                ]?.[m.id] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                setNotes(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [selectedActiviteId]:
                                                                            {
                                                                                ...(prev[
                                                                                    selectedActiviteId
                                                                                ] ??
                                                                                    {}),
                                                                                [m.id]: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            style={S.noteInput}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer actions */}
                        <div style={S.cardFooter}>
                            <button
                                style={S.btnSecondary}
                                onClick={() =>
                                    setMarquages((prev) => ({
                                        ...prev,
                                        [selectedActiviteId]: membres.reduce(
                                            (acc, m) => ({
                                                ...acc,
                                                [m.id]: "present",
                                            }),
                                            {},
                                        ),
                                    }))
                                }
                            >
                                Tous présents
                            </button>
                            <button
                                style={S.btnSecondary}
                                onClick={() =>
                                    setMarquages((prev) => ({
                                        ...prev,
                                        [selectedActiviteId]: {},
                                    }))
                                }
                            >
                                Réinitialiser
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                style={{
                                    ...S.btnPrimary,
                                    ...(saving ? S.btnDisabled : {}),
                                }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? "Enregistrement…"
                                    : saved
                                      ? "✓ Enregistré"
                                      : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════════════ ONGLET : ACTIVITÉS ════════════════ */}
                {activeTab === "activites" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>Activités de la classe</p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                marginTop: 16,
                            }}
                        >
                            {activites.map((a) => (
                                <div
                                    key={a.id}
                                    style={S.activiteRow}
                                    onClick={() => {
                                        setSelectedActiviteId(a.id);
                                        setActiveTab("marquer");
                                    }}
                                >
                                    <div
                                        style={{
                                            ...S.activiteDateBox,
                                            background: statutColor(a.statut),
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 500,
                                                color: "white",
                                                lineHeight: 1,
                                            }}
                                        >
                                            {a.date_heure_debut
                                                ? new Date(
                                                      a.date_heure_debut,
                                                  ).getDate()
                                                : "—"}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "rgba(255,255,255,0.8)",
                                            }}
                                        >
                                            {a.date_heure_debut
                                                ? new Date(a.date_heure_debut)
                                                      .toLocaleDateString(
                                                          "fr-FR",
                                                          { month: "short" },
                                                      )
                                                      .toUpperCase()
                                                : ""}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                color: "#222",
                                                margin: 0,
                                            }}
                                        >
                                            {a.titre}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: 12,
                                                color: "#888",
                                                marginTop: 2,
                                            }}
                                        >
                                            {typeIcon(a.type)} {a.type} ·{" "}
                                            {formatHeure(a.date_heure_debut)}
                                            {a.presence_obligatoire && (
                                                <span
                                                    style={{
                                                        marginLeft: 8,
                                                        background: "#fce4ec",
                                                        color: "#880e4f",
                                                        fontSize: 10,
                                                        padding: "2px 7px",
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    Obligatoire
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <StatutBadge statut={a.statut} />
                                    <span style={{ color: "#bbb" }}>›</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════════ ONGLET : STATISTIQUES ════════════════ */}
                {activeTab === "statistiques" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>
                            Statistiques de participation —{" "}
                            {conducteur?.classe?.nom}
                        </p>
                        <p style={S.cardSub}>
                            Taux moyen : {stats.taux_moyen ?? taux}%
                        </p>
                        <div style={{ marginTop: 20 }}>
                            {activites.slice(0, 8).map((a) => {
                                const presencesAct = marquages[a.id] ?? {};
                                const nbP = Object.values(presencesAct).filter(
                                    (v) => v === "present",
                                ).length;
                                const pct =
                                    membres.length > 0
                                        ? Math.round(
                                              (nbP / membres.length) * 100,
                                          )
                                        : 0;
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "10px 0",
                                            borderBottom: "1px solid #f5f5f5",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: "#222",
                                                minWidth: 160,
                                            }}
                                        >
                                            {a.titre}
                                        </span>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 8,
                                                background: "#e8eaf6",
                                                borderRadius: 4,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${pct}%`,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    background:
                                                        pct >= 70
                                                            ? "#1a237e"
                                                            : pct >= 50
                                                              ? "#ff9800"
                                                              : "#e53935",
                                                    transition: "width 0.4s",
                                                }}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color:
                                                    pct >= 70
                                                        ? "#1a237e"
                                                        : pct >= 50
                                                          ? "#e65100"
                                                          : "#c62828",
                                                minWidth: 40,
                                                textAlign: "right",
                                            }}
                                        >
                                            {pct}%
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: "#888",
                                                minWidth: 55,
                                                textAlign: "right",
                                            }}
                                        >
                                            {nbP}/{membres.length}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ════════════════ ONGLET : ABSENCES ════════════════ */}
                {activeTab === "absences" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>
                            Membres avec absences répétées
                        </p>
                        <p style={S.cardSub}>
                            Absents 3 fois ou plus au cours du mois
                        </p>
                        <div
                            style={{
                                marginTop: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {membres
                                .map((m) => ({
                                    ...m,
                                    nbAbs: Object.values(marquages).filter(
                                        (act) => act[m.id] === "absent",
                                    ).length,
                                }))
                                .filter((m) => m.nbAbs >= 3)
                                .map((m) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "10px 14px",
                                            background: "#fff5f5",
                                            borderRadius: 10,
                                            border: "1px solid #ffcdd2",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...S.avatar,
                                                background:
                                                    m.couleur ?? "#e53935",
                                            }}
                                        >
                                            {m.avatar_initiales ??
                                                `${m.prenom[0]}${m.nom[0]}`}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    color: "#222",
                                                    margin: 0,
                                                }}
                                            >
                                                {m.prenom} {m.nom}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: "#888",
                                                    margin: 0,
                                                }}
                                            >
                                                {m.famille?.nom}
                                            </p>
                                        </div>
                                        <span
                                            style={{
                                                background: "#ffebee",
                                                color: "#c62828",
                                                fontSize: 12,
                                                padding: "4px 12px",
                                                borderRadius: 12,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {m.nbAbs} absences
                                        </span>
                                    </div>
                                ))}
                            {membres.filter(
                                (m) =>
                                    Object.values(marquages).filter(
                                        (act) => act[m.id] === "absent",
                                    ).length >= 3,
                            ).length === 0 && (
                                <p
                                    style={{
                                        color: "#888",
                                        textAlign: "center",
                                        padding: "24px 0",
                                    }}
                                >
                                    Aucune absence répétée détectée 🎉
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════ ONGLET : HISTORIQUE ════════════════ */}
                {activeTab === "historique" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>
                            Historique complet des présences
                        </p>
                        <div
                            style={{
                                marginTop: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {activites.map((a) => {
                                const presencesAct = marquages[a.id] ?? {};
                                const nbP = Object.values(presencesAct).filter(
                                    (v) => v === "present",
                                ).length;
                                const nbAb = Object.values(presencesAct).filter(
                                    (v) => v === "absent",
                                ).length;
                                const nbEx = Object.values(presencesAct).filter(
                                    (v) => v === "excuse",
                                ).length;
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 14,
                                            padding: "10px 0",
                                            borderBottom: "1px solid #f5f5f5",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...S.activiteDateBox,
                                                background: "#1a237e",
                                                minWidth: 48,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 500,
                                                    color: "white",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {a.date_heure_debut
                                                    ? new Date(
                                                          a.date_heure_debut,
                                                      ).getDate()
                                                    : "—"}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                {a.date_heure_debut
                                                    ? new Date(
                                                          a.date_heure_debut,
                                                      )
                                                          .toLocaleDateString(
                                                              "fr-FR",
                                                              {
                                                                  month: "short",
                                                              },
                                                          )
                                                          .toUpperCase()
                                                    : ""}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: "#222",
                                                    margin: 0,
                                                }}
                                            >
                                                {a.titre}
                                            </p>
                                        </div>
                                        <div
                                            style={{ display: "flex", gap: 6 }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    padding: "3px 8px",
                                                    borderRadius: 10,
                                                    background: "#e8f5e9",
                                                    color: "#2e7d32",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {nbP} P
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    padding: "3px 8px",
                                                    borderRadius: 10,
                                                    background: "#ffebee",
                                                    color: "#c62828",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {nbAb} A
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    padding: "3px 8px",
                                                    borderRadius: 10,
                                                    background: "#fff3e0",
                                                    color: "#e65100",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {nbEx} E
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatCard({
    icon,
    value,
    label,
    badge,
    badgeStyle,
    barValue,
    barColor,
}) {
    return (
        <div style={S.statCard}>
            <span style={{ ...S.statBadge, ...badgeStyle }}>{badge}</span>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
            <div style={S.statNum}>{value}</div>
            <div style={S.statLabel}>{label}</div>
            <div style={S.statBarWrap}>
                <div
                    style={{
                        ...S.statBarFill,
                        width: `${Math.min(barValue, 100)}%`,
                        background: barColor,
                    }}
                />
            </div>
        </div>
    );
}

function MiniCounter({ val, label, color, bg }) {
    return (
        <div
            style={{
                background: bg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 8,
                padding: "6px 10px",
                minWidth: 36,
            }}
        >
            <span style={{ color, fontWeight: 500, fontSize: 14 }}>{val}</span>
            <span style={{ color, fontSize: 10 }}>{label}</span>
        </div>
    );
}

function PresenceBtn({ active, color, bg, label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 12,
                border: `1px solid ${active ? color : "#e0e0e0"}`,
                cursor: "pointer",
                background: active ? bg : "white",
                color: active ? color : "#999",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s",
            }}
        >
            {label}
        </button>
    );
}

function StatutBadge({ statut }) {
    const map = {
        planifiee: { bg: "#e3f2fd", color: "#1565c0", label: "Planifiée" },
        en_cours: { bg: "#e8f5e9", color: "#2e7d32", label: "En cours" },
        terminee: { bg: "#f3e5f5", color: "#6a1b9a", label: "Terminée" },
        annulee: { bg: "#ffebee", color: "#c62828", label: "Annulée" },
    };
    const s = map[statut] ?? { bg: "#f5f5f5", color: "#888", label: statut };
    return (
        <span
            style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 12,
                background: s.bg,
                color: s.color,
                fontWeight: 500,
            }}
        >
            {s.label}
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type) {
    return (
        { culte: "⛪", reunion: "👥", formation: "📚", evenement: "🎉" }[
            type
        ] ?? "📅"
    );
}

function statutColor(statut) {
    return (
        {
            planifiee: "#283593",
            en_cours: "#2e7d32",
            terminee: "#4a148c",
            annulee: "#b71c1c",
        }[statut] ?? "#1a237e"
    );
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS = [
    { key: "marquer", label: "Marquer", icon: "📋" },
    { key: "activites", label: "Activités", icon: "📅" },
    { key: "statistiques", label: "Statistiques", icon: "📊" },
    { key: "absences", label: "Absences", icon: "⚠" },
    { key: "historique", label: "Historique", icon: "🕐" },
];

const FILTRES = [
    { key: "tous", label: "Tous" },
    { key: "presents", label: "Présents" },
    { key: "absents", label: "Absents" },
    { key: "non_marques", label: "Non marqués" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    page: { padding: "24px", minHeight: "100vh" },
    pageHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 16,
        flexWrap: "wrap",
    },
    pageHeaderLeft: { display: "flex", alignItems: "center", gap: 14 },
    backBtn: {
        background: "rgba(255,255,255,0.15)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 8,
        padding: "7px 14px",
        fontSize: 13,
        cursor: "pointer",
    },
    pageTitle: { color: "white", fontSize: 22, fontWeight: 500, margin: 0 },
    pageSubtitle: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        marginTop: 3,
        margin: 0,
    },
    btnPrimary: {
        background: "#c6a800",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    btnSecondary: {
        background: "#f5f5f5",
        color: "#555",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        cursor: "pointer",
    },
    btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 20,
    },
    statCard: {
        background: "white",
        borderRadius: 14,
        padding: "18px 20px",
        position: "relative",
    },
    statBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 12,
        fontWeight: 500,
    },
    statNum: {
        fontSize: 28,
        fontWeight: 500,
        color: "#1a237e",
        marginBottom: 4,
    },
    statLabel: { fontSize: 12, color: "#888", lineHeight: 1.4 },
    statBarWrap: {
        height: 4,
        background: "#eeeeee",
        borderRadius: 2,
        marginTop: 12,
        overflow: "hidden",
    },
    statBarFill: { height: 4, borderRadius: 2, transition: "width 0.4s ease" },
    activiteSelector: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    activiteSelectorLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        whiteSpace: "nowrap",
    },
    activitePills: { display: "flex", gap: 8, flexWrap: "wrap" },
    activitePill: {
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 20,
        padding: "6px 14px",
        fontSize: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    activitePillActive: {
        background: "white",
        color: "#1a237e",
        border: "1px solid white",
        fontWeight: 500,
    },
    activiteDate: { fontSize: 11, opacity: 0.7, marginLeft: 4 },
    tabsBar: {
        background: "white",
        borderRadius: 14,
        padding: 6,
        display: "flex",
        gap: 4,
        marginBottom: 20,
        overflowX: "auto",
    },
    tab: {
        padding: "8px 16px",
        borderRadius: 10,
        fontSize: 13,
        cursor: "pointer",
        color: "#666",
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
    },
    tabActive: { background: "#1a237e", color: "white", fontWeight: 500 },
    card: {
        background: "white",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 20,
    },
    tableHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 16,
        flexWrap: "wrap",
    },
    cardTitle: { fontSize: 15, fontWeight: 500, color: "#1a237e", margin: 0 },
    cardSub: { fontSize: 12, color: "#888", marginTop: 4, margin: 0 },
    filterBar: {
        display: "flex",
        gap: 10,
        marginBottom: 14,
        flexWrap: "wrap",
        alignItems: "center",
    },
    searchInput: {
        flex: 1,
        minWidth: 200,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 13,
        outline: "none",
    },
    filterBtn: {
        background: "#f5f5f5",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "7px 12px",
        fontSize: 12,
        color: "#555",
        cursor: "pointer",
    },
    filterBtnActive: {
        background: "#e8eaf6",
        borderColor: "#3949ab",
        color: "#1a237e",
        fontWeight: 500,
    },
    progressBar: {
        flex: 1,
        height: 6,
        background: "#eeeeee",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: { height: 6, borderRadius: 3, transition: "width 0.4s ease" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
        fontSize: 12,
        color: "#888",
        fontWeight: 400,
        textAlign: "left",
        padding: "8px 10px",
        borderBottom: "1px solid #f0f0f0",
    },
    td: {
        padding: "10px 10px",
        borderBottom: "1px solid #fafafa",
        fontSize: 13,
        verticalAlign: "middle",
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 11,
        fontWeight: 500,
        flexShrink: 0,
    },
    noteInput: {
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        padding: "5px 8px",
        fontSize: 12,
        width: 110,
        outline: "none",
    },
    cardFooter: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 18,
        paddingTop: 16,
        borderTop: "1px solid #f0f0f0",
        flexWrap: "wrap",
    },
    activiteRow: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        background: "#f8f9ff",
        borderRadius: 10,
        border: "1px solid #e8eaf6",
        cursor: "pointer",
    },
    activiteDateBox: {
        minWidth: 44,
        textAlign: "center",
        borderRadius: 8,
        padding: "6px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
};
