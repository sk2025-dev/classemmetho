import { useEffect, useMemo, useState } from "react";
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
    viewerLabel = "Conducteur",
    canManagePresenceMarker = false,
    presenceMarkerClasse = null,
    presenceEndpoints = {},
}) {
    const [activeTab, setActiveTab] = useState("marquer");
    const [selectedActiviteId, setSelectedActiviteId] = useState(
        activite_active_id ?? activites[0]?.id ?? null,
    );
    const [marquages, setMarquages] = useState(initialPresences);
    const [filterMembre, setFilterMembre] = useState("tous");
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [marquagePage, setMarquagePage] = useState(1);
    const [absencesPage, setAbsencesPage] = useState(1);
    const ABSENCES_PER_PAGE = 10;
    const [historiquePage, setHistoriquePage] = useState(1);
    const HISTORIQUE_PER_PAGE = 10;
    const [selectedAbsentMembre, setSelectedAbsentMembre] = useState(null);
    const [programmeSummary, setProgrammeSummary] = useState(null);
    const [programmeActivites, setProgrammeActivites] = useState([]);
    const [loadingProgrammeActivites, setLoadingProgrammeActivites] =
        useState(false);
    const [modalMarqueurPresence, setModalMarqueurPresence] = useState(false);
    const [selectedMemberMarqueur, setSelectedMemberMarqueur] = useState("");
    const [marqueurPresenceActuel, setMarqueurPresenceActuel] =
        useState(presenceMarkerClasse);

    const activitesEndpoint =
        presenceEndpoints?.activitesProgramme ||
        "/conducteur/presences/programmes-activites";
    const programmeSummaryTemplate =
        presenceEndpoints?.programmeSummary ||
        "/conducteur/programmes/{id}/presences";
    const assignPresenceMarkerEndpoint =
        presenceEndpoints?.assignPresenceMarker ||
        "/conducteur/presences/assign-marqueur";
    const unassignPresenceMarkerEndpoint =
        presenceEndpoints?.unassignPresenceMarker ||
        "/conducteur/presences/unassign-marqueur";
    const [showAllActivites, setShowAllActivites] = useState(false);

    const activiteSelectionnee = activites.find(
        (a) => a.id === selectedActiviteId,
    );
    const marquagesActivite = marquages[selectedActiviteId] ?? {};
    const activitesOnglet =
        programmeActivites.length > 0 ? programmeActivites : activites;

    useEffect(() => {
        setMarqueurPresenceActuel(presenceMarkerClasse ?? null);
    }, [presenceMarkerClasse]);

    const isInCurrentMonth = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return false;
        const now = new Date();
        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    };

    const activitesMoisCourant = useMemo(
        () => activites.filter((a) => isInCurrentMonth(a.date_heure_debut)),
        [activites],
    );

    const activitesOngletMoisCourant = useMemo(
        () =>
            activitesOnglet.filter((a) => isInCurrentMonth(a.date_heure_debut)),
        [activitesOnglet],
    );

    const activitesAffichables = useMemo(() => {
        const base = showAllActivites
            ? activites
            : activitesMoisCourant.slice(0, 3);

        if (
            selectedActiviteId &&
            !base.some((a) => a.id === selectedActiviteId)
        ) {
            const selected = activites.find((a) => a.id === selectedActiviteId);
            return selected ? [selected, ...base] : base;
        }

        return base;
    }, [showAllActivites, activites, activitesMoisCourant, selectedActiviteId]);

    const activitesOngletAffichables = useMemo(
        () =>
            showAllActivites
                ? activitesOnglet
                : activitesOngletMoisCourant.slice(0, 3),
        [showAllActivites, activitesOnglet, activitesOngletMoisCourant],
    );

    const canToggleSelectionActivites =
        activites.length > activitesMoisCourant.slice(0, 3).length;
    const canToggleOngletActivites =
        activitesOnglet.length > activitesOngletMoisCourant.slice(0, 3).length;

    useEffect(() => {
        if (activeTab !== "activites") return;
        if (loadingProgrammeActivites) return;

        let isCancelled = false;

        async function loadProgrammeActivites() {
            setLoadingProgrammeActivites(true);
            try {
                const endpoint = withBasePath("", activitesEndpoint);

                const response = await window.axios.get(endpoint);
                if (!isCancelled && response?.data?.success) {
                    setProgrammeActivites(response.data.activites ?? []);
                }
            } catch (error) {
                console.error("Erreur chargement activités programme", error);
            } finally {
                if (!isCancelled) {
                    setLoadingProgrammeActivites(false);
                }
            }
        }

        loadProgrammeActivites();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, loadingProgrammeActivites, activitesEndpoint]);

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

    const membresParPage = 12;
    const totalMarquagePages = Math.max(
        1,
        Math.ceil(membresFiltres.length / membresParPage),
    );
    const marquagePageSafe = Math.min(
        Math.max(marquagePage, 1),
        totalMarquagePages,
    );
    const membresFiltresPagines = useMemo(() => {
        const start = (marquagePageSafe - 1) * membresParPage;
        return membresFiltres.slice(start, start + membresParPage);
    }, [membresFiltres, marquagePageSafe]);

    useEffect(() => {
        setMarquagePage(1);
    }, [searchQuery, filterMembre, selectedActiviteId, activeTab]);

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

    // Stats globales du mois en cours
    const nbActivitesMois = activitesMoisCourant.length;
    const totalPossibleMois = membres.length * Math.max(nbActivitesMois, 1);
    const nbPresentsMois = activitesMoisCourant.reduce(
        (sum, a) => sum + Object.values(marquages[a.id] ?? {}).filter((v) => v === "present").length,
        0,
    );
    const nbAbsentsMois = activitesMoisCourant.reduce(
        (sum, a) => sum + Object.values(marquages[a.id] ?? {}).filter((v) => v === "absent").length,
        0,
    );
    const tauxMois = totalPossibleMois > 0
        ? Math.round((nbPresentsMois / totalPossibleMois) * 100)
        : 0;
    const now = new Date();
    const moisLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    function showToast(message, type = "success") {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    }

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
        } catch (e) {
            console.error(e);
            showToast("Erreur de chargement des présences QR", "error");
        } finally {
            setSummaryLoading(false);
        }
    }

    async function handleAssignPresenceMarker() {
        if (!selectedMemberMarqueur) {
            showToast("Veuillez sélectionner un membre.", "error");
            return;
        }

        try {
            const endpoint = withBasePath("", assignPresenceMarkerEndpoint);
            const response = await window.axios.post(endpoint, {
                user_id: selectedMemberMarqueur,
            });

            showToast(
                response?.data?.message ||
                    "Marqueur de présence assigné avec succès.",
                "success",
            );
            setMarqueurPresenceActuel(response?.data?.data ?? null);
            setModalMarqueurPresence(false);
            setSelectedMemberMarqueur("");
        } catch (error) {
            showToast(
                error?.response?.data?.message ||
                    "Erreur lors de l'assignation du marqueur.",
                "error",
            );
        }
    }

    async function handleUnassignPresenceMarker() {
        if (!marqueurPresenceActuel?.id) {
            showToast("Aucun marqueur de présence assigné.", "error");
            return;
        }

        try {
            const endpoint = withBasePath("", unassignPresenceMarkerEndpoint);
            const response = await window.axios.post(endpoint, {
                user_id: marqueurPresenceActuel.id,
            });

            showToast(
                response?.data?.message ||
                    "Marqueur de présence retiré avec succès.",
                "success",
            );
            setMarqueurPresenceActuel(null);
            setModalMarqueurPresence(false);
        } catch (error) {
            showToast(
                error?.response?.data?.message ||
                    "Erreur lors du retrait du marqueur.",
                "error",
            );
        }
    }

    function openPresenceMarkerModal() {
        setSelectedMemberMarqueur(
            marqueurPresenceActuel?.id ? String(marqueurPresenceActuel.id) : "",
        );
        setModalMarqueurPresence(true);
    }

    useEffect(() => {
        if (!selectedActiviteId) return;

        loadProgrammeSummary();
        const timer = window.setInterval(loadProgrammeSummary, 10000);

        return () => {
            window.clearInterval(timer);
        };
    }, [selectedActiviteId]);

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
                {toast && (
                    <div
                        style={{
                            ...S.toast,
                            ...(toast.type === "success"
                                ? S.toastSuccess
                                : S.toastError),
                        }}
                    >
                        {toast.message}
                    </div>
                )}

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
                                {viewerLabel} : {conducteur?.prenom}{" "}
                                {conducteur?.nom}
                            </p>
                        </div>
                    </div>
                    <button
                        style={{
                            ...S.btnPrimary,
                            opacity: 0.9,
                            cursor: "default",
                        }}
                        disabled
                    >
                        QR automatique (lecture seule)
                    </button>
                </div>

                {canManagePresenceMarker && (
                    <div style={S.markerManagerWrap}>
                        <div style={S.markerManagerText}>
                            Marqueur actuel :{" "}
                            <strong>
                                {marqueurPresenceActuel
                                    ? `${marqueurPresenceActuel.nom} (${marqueurPresenceActuel.famille})`
                                    : "Aucun"}
                            </strong>
                        </div>
                        <button
                            style={S.btnSecondary}
                            onClick={openPresenceMarkerModal}
                        >
                            Ajouter un marqueur de présence
                        </button>
                    </div>
                )}

                {/* ── Stats mois en cours ── */}
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
                        value={<span>{nbPresentsMois} <span style={{ fontSize: 14, fontWeight: 500, color: tauxMois >= 70 ? "#2e7d32" : "#e65100" }}>· {tauxMois}%</span></span>}
                        label="Présences ce mois"
                        badge={`${tauxMois}%`}
                        badgeStyle={
                            tauxMois >= 70
                                ? { background: "#e8f5e9", color: "#2e7d32" }
                                : { background: "#fff3e0", color: "#e65100" }
                        }
                        barValue={tauxMois}
                        barColor={tauxMois >= 70 ? "#43a047" : "#ff9800"}
                    />
                    <StatCard
                        icon="✗"
                        value={<span>{nbAbsentsMois} <span style={{ fontSize: 14, fontWeight: 500, color: "#c62828" }}>· {totalPossibleMois > 0 ? Math.round((nbAbsentsMois / totalPossibleMois) * 100) : 0}%</span></span>}
                        label="Absences ce mois"
                        badge={`${totalPossibleMois > 0 ? Math.round((nbAbsentsMois / totalPossibleMois) * 100) : 0}%`}
                        badgeStyle={{ background: "#ffebee", color: "#c62828" }}
                        barValue={totalPossibleMois > 0 ? Math.round((nbAbsentsMois / totalPossibleMois) * 100) : 0}
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

                {/* ── Top 3 activités du mois ── */}
                {activitesMoisCourant.length > 0 && (() => {
                    const top3 = activitesMoisCourant
                        .map((a) => ({
                            ...a,
                            nbPresents: Object.values(marquages[a.id] ?? {}).filter((v) => v === "present").length,
                        }))
                        .sort((a, b) => b.nbPresents - a.nbPresents)
                        .slice(0, 3);

                    const medals = ["🥇", "🥈", "🥉"];
                    const maxPresents = Math.max(top3[0]?.nbPresents ?? 1, 1);

                    return (
                        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8eaf6", padding: "16px 20px", marginBottom: 16 }}>
                            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a237e" }}>
                                🏆 Top activités du mois
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {top3.map((a, i) => {
                                    const taux = membres.length > 0 ? Math.round((a.nbPresents / membres.length) * 100) : 0;
                                    const barPct = Math.round((a.nbPresents / maxPresents) * 100);
                                    const barColor = i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#b45309";
                                    return (
                                        <div key={a.id}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 18 }}>{medals[i]}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{a.titre}</span>
                                                    {a.date_heure_debut && (
                                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                                            {new Date(a.date_heure_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a237e", whiteSpace: "nowrap" }}>
                                                    {a.nbPresents} présents · {taux}%
                                                </span>
                                            </div>
                                            <div style={{ height: 7, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 10, transition: "width 0.4s ease" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* ── Sélecteur activité ── */}
                <div style={S.activiteSelector}>
                    <span
                        style={{ ...S.activiteSelectorLabel, marginLeft: 10 }}
                    >
                        Sélection :
                    </span>
                    <select
                        value={selectedActiviteId ?? ""}
                        onChange={(e) =>
                            setSelectedActiviteId(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        style={S.selectInput}
                    >
                        <option value="">Choisir une activité...</option>
                        {activitesAffichables.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.titre}
                            </option>
                        ))}
                    </select>
                    <div style={S.activitePills}>
                        {activitesAffichables.map((a) => (
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
                    {canToggleSelectionActivites && (
                        <button
                            style={{ ...S.btnSecondary, marginLeft: 8 }}
                            onClick={() => setShowAllActivites((prev) => !prev)}
                        >
                            {showAllActivites ? "Voir moins" : "Voir plus"}
                        </button>
                    )}
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
                        {!selectedActiviteId && (
                            <div style={S.selectionNotice}>
                                Choisissez d'abord une activité pour marquer les
                                présences.
                            </div>
                        )}

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
                                        {activiteSelectionnee.date_heure_fin && (
                                            <>
                                                →{" "}
                                                {formatHeure(
                                                    activiteSelectionnee.date_heure_fin,
                                                )}
                                            </>
                                        )}
                                        {programmeSummary?.programme && (
                                            <>
                                                {" "}
                                                ·{" "}
                                                {programmeSummary.programme
                                                    .is_closed
                                                    ? "Activité clôturée"
                                                    : "En attente des scans"}
                                            </>
                                        )}
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
                                    label={
                                        programmeSummary?.programme?.is_closed
                                            ? "?"
                                            : "NS"
                                    }
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
                                            Statut (QR)
                                        </th>
                                        <th style={S.th}>Scan</th>
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
                                        membresFiltresPagines.map((m) => {
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
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    padding:
                                                                        "5px 11px",
                                                                    borderRadius: 20,
                                                                    background:
                                                                        statut ===
                                                                        "present"
                                                                            ? "#e8f5e9"
                                                                            : statut ===
                                                                                "absent"
                                                                              ? "#ffebee"
                                                                              : "#f5f5f5",
                                                                    color:
                                                                        statut ===
                                                                        "present"
                                                                            ? "#2e7d32"
                                                                            : statut ===
                                                                                "absent"
                                                                              ? "#c62828"
                                                                              : "#777",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {statut ===
                                                                "present"
                                                                    ? "Présent"
                                                                    : statut ===
                                                                        "absent"
                                                                      ? "Absent"
                                                                      : "Non scanné"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={S.td}>
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                color: "#666",
                                                            }}
                                                        >
                                                            {statut ===
                                                            "present"
                                                                ? "Scan validé"
                                                                : programmeSummary
                                                                        ?.programme
                                                                        ?.is_closed
                                                                  ? "Absent automatique"
                                                                  : "En attente de scan"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {membresFiltres.length > membresParPage && (
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
                                <span style={{ fontSize: 12, color: "#777" }}>
                                    Page {marquagePageSafe} /{" "}
                                    {totalMarquagePages}
                                </span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={S.btnSecondary}
                                        onClick={() =>
                                            setMarquagePage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={marquagePageSafe <= 1}
                                    >
                                        Précédent
                                    </button>
                                    <button
                                        style={S.btnSecondary}
                                        onClick={() =>
                                            setMarquagePage((p) =>
                                                Math.min(
                                                    totalMarquagePages,
                                                    p + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            marquagePageSafe >=
                                            totalMarquagePages
                                        }
                                    >
                                        Suivant
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={S.cardFooter}>
                            <span style={{ fontSize: 12, color: "#777" }}>
                                Marquage 100% automatique par QR code. Aucun
                                pointage manuel autorisé.
                            </span>
                            <div style={{ flex: 1 }} />
                            <button
                                style={S.btnSecondary}
                                onClick={loadProgrammeSummary}
                                disabled={!selectedActiviteId || summaryLoading}
                            >
                                {summaryLoading
                                    ? "Actualisation..."
                                    : "Actualiser"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════════════ ONGLET : ACTIVITÉS ════════════════ */}
                {activeTab === "activites" && (
                    <div style={S.card}>
                        <p style={S.cardTitle}>Activités de la classe</p>
                        {loadingProgrammeActivites && (
                            <p style={{ ...S.cardSub, marginTop: 8 }}>
                                Chargement des activités du programme...
                            </p>
                        )}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                marginTop: 16,
                            }}
                        >
                            {activitesOngletAffichables.map((a) => (
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
                                            {a.source === "programme" && (
                                                <span
                                                    style={{
                                                        marginLeft: 8,
                                                        background: "#e8eaf6",
                                                        color: "#1a237e",
                                                        fontSize: 10,
                                                        padding: "2px 7px",
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    Depuis Programmes
                                                </span>
                                            )}
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
                                    <span style={{ color: "#bbb" }}>
                                        {a.source === "programme" ? "•" : "›"}
                                    </span>
                                </div>
                            ))}
                            {canToggleOngletActivites && (
                                <button
                                    style={{
                                        ...S.btnSecondary,
                                        alignSelf: "flex-start",
                                    }}
                                    onClick={() =>
                                        setShowAllActivites((prev) => !prev)
                                    }
                                >
                                    {showAllActivites
                                        ? "Voir moins"
                                        : "Voir plus"}
                                </button>
                            )}
                            {!loadingProgrammeActivites &&
                                activitesOngletAffichables.length === 0 && (
                                    <p
                                        style={{
                                            color: "#888",
                                            textAlign: "center",
                                            padding: "16px 0",
                                        }}
                                    >
                                        {activitesOnglet.length > 0
                                            ? "Aucune activité du mois en cours. Cliquez sur Voir plus pour afficher toutes les activités."
                                            : "Aucune activité créée dans le module Programmes pour le moment."}
                                    </p>
                                )}
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
                {activeTab === "absences" && (() => {
                    const absentsRepetes = membres
                        .map((m) => ({
                            ...m,
                            nbAbs: Object.values(marquages).filter(
                                (act) => act[m.id] === "absent",
                            ).length,
                        }))
                        .filter((m) => m.nbAbs >= 3)
                        .sort((a, b) => b.nbAbs - a.nbAbs);

                    const totalPagesAbs = Math.max(1, Math.ceil(absentsRepetes.length / ABSENCES_PER_PAGE));
                    const paginatedAbs = absentsRepetes.slice(
                        (absencesPage - 1) * ABSENCES_PER_PAGE,
                        absencesPage * ABSENCES_PER_PAGE,
                    );

                    return (
                        <div style={S.card}>
                            <p style={S.cardTitle}>
                                Membres avec absences répétées
                            </p>
                            <p style={S.cardSub}>
                                Absents 3 fois ou plus au cours du mois
                                {absentsRepetes.length > 0 && (
                                    <span style={{ marginLeft: 8, fontWeight: 600, color: "#c62828" }}>
                                        ({absentsRepetes.length})
                                    </span>
                                )}
                            </p>
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                                {paginatedAbs.map((m) => (
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
                                        <div style={{ ...S.avatar, background: m.couleur ?? "#e53935" }}>
                                            {m.avatar_initiales ?? `${m.prenom[0]}${m.nom[0]}`}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: "#222", margin: 0 }}>
                                                {m.prenom} {m.nom}
                                            </p>
                                            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                                                {m.famille?.nom}
                                            </p>
                                        </div>
                                        <span style={{ background: "#ffebee", color: "#c62828", fontSize: 12, padding: "4px 12px", borderRadius: 12, fontWeight: 500 }}>
                                            {m.nbAbs} absences
                                        </span>
                                        <button
                                            onClick={() => setSelectedAbsentMembre(m)}
                                            style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #1a237e", background: "#fff", color: "#1a237e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            Voir
                                        </button>
                                    </div>
                                ))}

                                {absentsRepetes.length === 0 && (
                                    <p style={{ color: "#888", textAlign: "center", padding: "24px 0" }}>
                                        Aucune absence répétée détectée 🎉
                                    </p>
                                )}

                                {totalPagesAbs > 1 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #ffcdd2" }}>
                                        <span style={{ fontSize: 12, color: "#888" }}>
                                            Page {absencesPage}/{totalPagesAbs} — {absentsRepetes.length} membre{absentsRepetes.length > 1 ? "s" : ""}
                                        </span>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => setAbsencesPage((p) => Math.max(1, p - 1))}
                                                disabled={absencesPage === 1}
                                                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #ffcdd2", background: "#fff", cursor: absencesPage === 1 ? "not-allowed" : "pointer", fontSize: 12, opacity: absencesPage === 1 ? 0.4 : 1 }}
                                            >
                                                Précédent
                                            </button>
                                            {Array.from({ length: totalPagesAbs }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setAbsencesPage(page)}
                                                    style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #ffcdd2", background: page === absencesPage ? "#e53935" : "#fff", color: page === absencesPage ? "#fff" : "#333", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setAbsencesPage((p) => Math.min(totalPagesAbs, p + 1))}
                                                disabled={absencesPage === totalPagesAbs}
                                                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #ffcdd2", background: "#fff", cursor: absencesPage === totalPagesAbs ? "not-allowed" : "pointer", fontSize: 12, opacity: absencesPage === totalPagesAbs ? 0.4 : 1 }}
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ════════════════ ONGLET : HISTORIQUE ════════════════ */}
                {activeTab === "historique" && (() => {
                    const totalPagesHist = Math.max(1, Math.ceil(activites.length / HISTORIQUE_PER_PAGE));
                    const paginatedActivites = activites.slice(
                        (historiquePage - 1) * HISTORIQUE_PER_PAGE,
                        historiquePage * HISTORIQUE_PER_PAGE,
                    );
                    return (
                        <div style={S.card}>
                            <p style={S.cardTitle}>
                                Historique complet des présences
                                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: "#888" }}>
                                    ({activites.length})
                                </span>
                            </p>
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                {paginatedActivites.map((a) => {
                                    const presencesAct = marquages[a.id] ?? {};
                                    const nbP = Object.values(presencesAct).filter((v) => v === "present").length;
                                    const nbAb = Object.values(presencesAct).filter((v) => v === "absent").length;
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
                                            <div style={{ ...S.activiteDateBox, background: "#1a237e", minWidth: 48 }}>
                                                <span style={{ fontSize: 18, fontWeight: 500, color: "white", lineHeight: 1 }}>
                                                    {a.date_heure_debut ? new Date(a.date_heure_debut).getDate() : "—"}
                                                </span>
                                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
                                                    {a.date_heure_debut
                                                        ? new Date(a.date_heure_debut).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                                                        : ""}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 14, fontWeight: 500, color: "#222", margin: 0 }}>
                                                    {a.titre}
                                                </p>
                                            </div>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>
                                                    {nbP} Présents
                                                </span>
                                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#ffebee", color: "#c62828", fontWeight: 500 }}>
                                                    {nbAb} Absents
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {activites.length === 0 && (
                                    <p style={{ color: "#888", textAlign: "center", padding: "24px 0" }}>
                                        Aucune activité enregistrée.
                                    </p>
                                )}

                                {totalPagesHist > 1 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                                        <span style={{ fontSize: 12, color: "#888" }}>
                                            Page {historiquePage}/{totalPagesHist} — {activites.length} activité{activites.length > 1 ? "s" : ""}
                                        </span>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => setHistoriquePage((p) => Math.max(1, p - 1))}
                                                disabled={historiquePage === 1}
                                                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: historiquePage === 1 ? "not-allowed" : "pointer", fontSize: 12, opacity: historiquePage === 1 ? 0.4 : 1 }}
                                            >
                                                Précédent
                                            </button>
                                            {Array.from({ length: totalPagesHist }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setHistoriquePage(page)}
                                                    style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e0e0e0", background: page === historiquePage ? "#1a237e" : "#fff", color: page === historiquePage ? "#fff" : "#333", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setHistoriquePage((p) => Math.min(totalPagesHist, p + 1))}
                                                disabled={historiquePage === totalPagesHist}
                                                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: historiquePage === totalPagesHist ? "not-allowed" : "pointer", fontSize: 12, opacity: historiquePage === totalPagesHist ? 0.4 : 1 }}
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ── MODAL : Absences d'un membre ── */}
            {selectedAbsentMembre && (() => {
                const activitesAbsences = activites.filter(
                    (a) => (marquages[a.id] ?? {})[selectedAbsentMembre.id] === "absent",
                );
                return (
                    <div style={S.modalBackdrop} onClick={() => setSelectedAbsentMembre(null)}>
                        <div style={{ ...S.modalCard, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div>
                                    <h3 style={S.modalTitle}>
                                        {selectedAbsentMembre.prenom} {selectedAbsentMembre.nom}
                                    </h3>
                                    <p style={{ ...S.modalSubTitle, margin: "4px 0 0" }}>
                                        {activitesAbsences.length} absence{activitesAbsences.length > 1 ? "s" : ""} enregistrée{activitesAbsences.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedAbsentMembre(null)}
                                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", lineHeight: 1 }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                                {activitesAbsences.map((a) => (
                                    <div
                                        key={a.id}
                                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#fff5f5", borderRadius: 10, border: "1px solid #ffcdd2" }}
                                    >
                                        <div style={{ ...S.activiteDateBox, background: "#c62828", minWidth: 44 }}>
                                            <span style={{ fontSize: 16, fontWeight: 600, color: "white", lineHeight: 1 }}>
                                                {a.date_heure_debut ? new Date(a.date_heure_debut).getDate() : "—"}
                                            </span>
                                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)" }}>
                                                {a.date_heure_debut
                                                    ? new Date(a.date_heure_debut).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                                                    : ""}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: "#222", margin: 0 }}>
                                                {a.titre}
                                            </p>
                                            {a.date_heure_debut && (
                                                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                                                    {new Date(a.date_heure_debut).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{ background: "#ffebee", color: "#c62828", fontSize: 11, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>
                                            Absent
                                        </span>
                                    </div>
                                ))}
                                {activitesAbsences.length === 0 && (
                                    <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>
                                        Aucune absence trouvée.
                                    </p>
                                )}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                                <button
                                    onClick={() => setSelectedAbsentMembre(null)}
                                    style={{ padding: "8px 20px", borderRadius: 8, background: "#1a237e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {canManagePresenceMarker && modalMarqueurPresence && (
                <div
                    style={S.modalBackdrop}
                    onClick={() => setModalMarqueurPresence(false)}
                >
                    <div
                        style={S.modalCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={S.modalTitle}>Assigner un marqueur</h3>
                        <p style={S.modalSubTitle}>
                            Le marqueur de présence pourra effectuer la
                            vérification finale des présences de votre classe.
                        </p>
                        <p style={S.modalCurrentMarkerText}>
                            Marqueur actuel :{" "}
                            <strong>
                                {marqueurPresenceActuel
                                    ? `${marqueurPresenceActuel.nom} (${marqueurPresenceActuel.famille})`
                                    : "Aucun"}
                            </strong>
                        </p>
                        <select
                            value={selectedMemberMarqueur}
                            onChange={(e) =>
                                setSelectedMemberMarqueur(e.target.value)
                            }
                            style={{ ...S.selectInput, width: "100%" }}
                        >
                            <option value="">Choisir un membre...</option>
                            {membres.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.prenom} {m.nom}
                                    {marqueurPresenceActuel?.id === m.id
                                        ? " (Marqueur actuel)"
                                        : ""}
                                </option>
                            ))}
                        </select>

                        <div style={S.modalActions}>
                            <button
                                style={S.btnSecondary}
                                onClick={() => setModalMarqueurPresence(false)}
                            >
                                Fermer
                            </button>
                            {marqueurPresenceActuel && (
                                <button
                                    style={{
                                        ...S.btnSecondary,
                                        borderColor: "#ef9a9a",
                                        color: "#c62828",
                                    }}
                                    onClick={handleUnassignPresenceMarker}
                                >
                                    Retirer
                                </button>
                            )}
                            <button
                                style={S.btnPrimary}
                                onClick={handleAssignPresenceMarker}
                            >
                                {marqueurPresenceActuel
                                    ? "Mettre à jour"
                                    : "Assigner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    return { reunion: "👥", formation: "📚", evenement: "🎉" }[type] ?? "📅";
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
    toast: {
        position: "fixed",
        top: 18,
        right: 18,
        zIndex: 2000,
        color: "white",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    },
    toastSuccess: {
        background: "linear-gradient(135deg, #2e7d32, #43a047)",
    },
    toastError: {
        background: "linear-gradient(135deg, #c62828, #e53935)",
    },
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
    markerManagerWrap: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    markerManagerText: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 13,
    },
    modalBackdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 520,
        background: "white",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 16,
        boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
    },
    modalTitle: {
        margin: 0,
        color: "#1a237e",
        fontSize: 17,
        fontWeight: 600,
    },
    modalSubTitle: {
        margin: "8px 0 12px",
        color: "#6b7280",
        fontSize: 13,
    },
    modalCurrentMarkerText: {
        margin: "0 0 10px",
        color: "#374151",
        fontSize: 13,
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 14,
        flexWrap: "wrap",
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
    selectInput: {
        border: "1px solid #d7dbeb",
        borderRadius: 10,
        padding: "8px 10px",
        fontSize: 13,
        minWidth: 280,
        background: "#fff",
        color: "#1f2937",
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
    selectionNotice: {
        background: "#fff8e1",
        color: "#8d6e63",
        border: "1px solid #ffe0b2",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 12,
        marginBottom: 12,
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
