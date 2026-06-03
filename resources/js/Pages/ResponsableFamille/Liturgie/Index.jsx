import React, { useEffect, useMemo, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { ArrowLeft, Download, Eye } from "lucide-react";
import axios from "axios";
import { resolveMemberPhotoUrl } from "../../../Helpers/PhotoHelper";
import { withBasePath } from "../../../Utils/urlHelper";

/* ── CONSTANTS ── */
const IN_PROGRESS = [
    "SOUMISE",
    "EN_ATTENTE_CONDUCTEUR",
    "TRANSMISE_AU_PASTEUR",
];
const VALID = ["VALIDEE", "PUBLIEE", "ARCHIVEE", "CELEBRE", "TERMINE"];
const DONE = ["CELEBRE", "TERMINE"];
const ACTE_PER_PAGE = 2;
const FAMILY_PER_PAGE = 6;
const ANN_PER_PAGE = 2;
const ANNONCE_TYPES = [
    {
        value: "grace",
        label: "Prière d'action de grâce / remerciement",
        emoji: "🙌",
        color: "amber",
    },
    {
        value: "priere",
        label: "Prière d'intercession",
        emoji: "🙏",
        color: "violet",
    },
    {
        value: "generale",
        label: "Demande de prière générale",
        emoji: "🙏",
        color: "sage",
    },
];

const MOTIFS_GRACE = [
    { value: "guerison", label: "Guérison" },
    { value: "deuil", label: "Deuil" },
    { value: "mariage", label: "Bénédiction de Mariage" },
    { value: "autres_bienfaits", label: "Autre(s) bienfait(s)" },
];

const MOTIFS_INTERCESSION = [
    { value: "soutien_assistance", label: "Soutien et assistance" },
    { value: "maladie", label: "Maladie" },
    { value: "autre_probleme", label: "Autre(s) problème(s)" },
];

const ANNONCE_ACTE_TYPES = [
    "annonce",
    "annonce_liturgique",
    "priere",
    "grace",
    "generale",
];
function isAnnonceRecord(item) {
    const type = String(item?.type_acte || item?.type_annonce || "")
        .trim()
        .toLowerCase();
    const reference = String(item?.reference || "")
        .trim()
        .toUpperCase();

    return (
        item?.est_annonce === true ||
        !!item?.type_annonce ||
        ANNONCE_ACTE_TYPES.includes(type) ||
        reference.startsWith("ANN-")
    );
}

const normalizeActe = (acte) => {
    if (!acte) return acte;
    const type = String(acte.type_acte || "")
        .trim()
        .toLowerCase();
    const statut = String(acte.statut || "")
        .trim()
        .toUpperCase();
    const details = acte.details || {};
    const ceremonyStatut = String(details.ceremonie_statut || "").toUpperCase();
    const validStatuts = ["VALIDEE", "PUBLIEE"];
    const blockedCeremonyStatuts = [
        "CEREMONIE_SOUMISE_AU_CONDUCTEUR",
        "CEREMONIE_TRANSMISE_AU_PASTEUR",
    ];
    const hasFicheEnvoyee = Boolean(details.fiche_pasteur_envoyee);

    const canChooseDate =
        type === "mariage" &&
        validStatuts.includes(statut) &&
        !blockedCeremonyStatuts.includes(ceremonyStatut) &&
        hasFicheEnvoyee;

    return {
        ...acte,
        can_choose_date: canChooseDate,
    };
};

const normalizeActes = (actes = []) =>
    Array.isArray(actes) ? actes.map(normalizeActe) : [];

/* ════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════ */
export default function Index({
    actes = [],
    familyMembers: rawFamilyMembers = [],
    conducteurs = {},
    annonces: rawAnnonces = [],
    flashAnnonces = [],
}) {
    /* ── acte array défensif ── */
    const [localActes, setLocalActes] = useState(() => normalizeActes(actes));
    useEffect(() => {
        setLocalActes(normalizeActes(actes));
    }, [actes]);

    const needsFicheRefresh = useMemo(() => {
        return localActes.some((acte) => {
            const type = String(acte.type_acte || "")
                .trim()
                .toLowerCase();
            const statut = String(acte.statut || "")
                .trim()
                .toUpperCase();
            const details = acte.details || {};
            return (
                type === "mariage" &&
                ["VALIDEE", "PUBLIEE"].includes(statut) &&
                !Boolean(details.fiche_pasteur_envoyee)
            );
        });
    }, [localActes]);

    useEffect(() => {
        if (!needsFicheRefresh) {
            return;
        }
        const interval = setInterval(() => {
            router.reload({
                only: ["actes"],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [needsFicheRefresh, router]);

    /* ── état actes ── */
    const [selectedActe, setSelectedActe] = useState(null);
    const [previewActe, setPreviewActe] = useState(null);
    const [ceremonyActe, setCeremonyActe] = useState(null);
    const [ceremonyProcessing, setCeremonyProcessing] = useState(false);
    const [ceremonyForm, setCeremonyForm] = useState({
        date_souhaitee: "",
        ceremonie_creneau: "",
        lieu_ceremonie: "",
        temoin_homme: "",
        temoin_femme: "",
    });
    const [detailTab, setDetailTab] = useState("infos");
    const [page, setPage] = useState(1);
    const [contactConducteurs, setContact] = useState(null);
    const [memberPage, setMemberPage] = useState(1);

    /* ── état annonces ── */
    const [annonces, setAnnonces] = useState([]);
    const [showAnnonceModal, setShowAnnonceModal] = useState(false);
    const [selectedAnnonce, setSelectedAnnonce] = useState(null);
    const [annonceStep, setAnnonceStep] = useState(1);
    const [annonceProcessing, setAnnonceProcessing] = useState(false);
    const [annonceForm, setAnnonceForm] = useState({ titre: "", contenu: "" });
    const [localFlashAnnonces, setLocalFlashAnnonces] = useState(flashAnnonces);
    const [annPage, setAnnPage] = useState(1);
    const [flashPage, setFlashPage] = useState(1);
    const [annFilter, setAnnFilter] = useState("tous");

    /* ── tabs principal ── */
    const [activeTab, setActiveTab] = useState("actes");
    const [quickFilter, setQuickFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    /* ── toast ── */
    const [toast, setToast] = useState(null);

    const annonceRecordsFromActes = useMemo(
        () => localActes.filter((a) => isAnnonceRecord(a)),
        [localActes],
    );

    useEffect(() => {
        const fromProps = Array.isArray(rawAnnonces) ? rawAnnonces : [];
        const merged = [...fromProps, ...annonceRecordsFromActes].reduce(
            (acc, item) => {
                const key =
                    item?.id ||
                    item?.reference ||
                    `${item?.type_acte || item?.type_annonce}-${item?.created_at || Math.random()}`;
                if (!acc.has(key)) {
                    acc.set(key, item);
                }
                return acc;
            },
            new Map(),
        );

        setAnnonces(Array.from(merged.values()));
    }, [rawAnnonces, annonceRecordsFromActes]);

    useEffect(() => {
        if (quickFilter === "mes_demandes") {
            setActiveTab("actes");
        }
        if (quickFilter === "mes_annonces") {
            setActiveTab("actes");
        }
    }, [quickFilter]);

    useEffect(() => {
        setPage(1);
    }, [quickFilter, searchTerm]);

    useEffect(() => {
        if (selectedActe) {
            setDetailTab("infos");
        }
    }, [selectedActe]);

    useEffect(() => {
        setAnnPage(1);
    }, [quickFilter, searchTerm, annFilter]);

    /* ── computed ── */
    const familyMembers = Array.isArray(rawFamilyMembers)
        ? rawFamilyMembers
        : [];
    const acteRequests = useMemo(
        () => localActes.filter((a) => !isAnnonceRecord(a)),
        [localActes],
    );
    const total = acteRequests.length;
    const enCours = acteRequests.filter((a) =>
        IN_PROGRESS.includes(
            String(a.statut || "")
                .trim()
                .toUpperCase(),
        ),
    ).length;
    const valides = acteRequests.filter((a) =>
        VALID.includes(
            String(a.statut || "")
                .trim()
                .toUpperCase(),
        ),
    ).length;
    const familyName = guessFamilyName(familyMembers);
    const detailRows = useMemo(
        () => formatDetails(selectedActe?.details),
        [selectedActe],
    );
    const celebrationRows = useMemo(
        () => detailRows.filter((row) => CELEBRATION_FIELDS.includes(row.key)),
        [detailRows],
    );
    const HIDDEN_ALL_CONTENT_ACTE_TYPES = new Set(["confirmation"]);
    const isHiddenInAllContentsActesFilter = (...types) =>
        types.some((type) =>
            HIDDEN_ALL_CONTENT_ACTE_TYPES.has(
                String(type || "")
                    .trim()
                    .toLowerCase(),
            ),
        );
    const ALLOWED_ANNONCE_TYPES = new Set(["grace", "priere", "generale"]);
    const isAllowedAnnonceType = (...types) =>
        types.some((type) =>
            ALLOWED_ANNONCE_TYPES.has(
                String(type || "")
                    .trim()
                    .toLowerCase(),
            ),
        );
    const annoncesForTab = useMemo(
        () =>
            annonces.filter((a) =>
                isAllowedAnnonceType(a.type_annonce, a.type_acte),
            ),
        [annonces],
    );
    const filterNeedle = searchTerm.trim().toLowerCase();
    const filteredActes = useMemo(() => {
        let result = [...acteRequests];

        if (quickFilter === "all") {
            result = result.filter(
                (a) => !isHiddenInAllContentsActesFilter(a.type_acte),
            );
        }

        if (quickFilter === "mes_demandes") {
            result = result.filter((a) => !isAnnonceRecord(a));
        }

        if (
            quickFilter &&
            quickFilter !== "all" &&
            quickFilter !== "mes_demandes" &&
            quickFilter !== "mes_annonces"
        ) {
            result = result.filter((a) =>
                String(a.type_acte || "")
                    .toLowerCase()
                    .includes(quickFilter.toLowerCase()),
            );
        }

        if (!filterNeedle) return result;
        return result.filter((a) =>
            [
                a.type_acte,
                a.reference,
                a.statut,
                a.membre?.prenom,
                a.membre?.nom,
                a.classe?.nom,
            ].some((field) =>
                String(field || "")
                    .toLowerCase()
                    .includes(filterNeedle),
            ),
        );
    }, [acteRequests, quickFilter, filterNeedle]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredActes.length / ACTE_PER_PAGE),
    );
    const pagedActes = filteredActes.slice(
        (page - 1) * ACTE_PER_PAGE,
        page * ACTE_PER_PAGE,
    );
    const memberTotalPages = Math.max(
        1,
        Math.ceil(familyMembers.length / FAMILY_PER_PAGE),
    );
    const pagedMembers = familyMembers.slice(
        (memberPage - 1) * FAMILY_PER_PAGE,
        memberPage * FAMILY_PER_PAGE,
    );
    const annoncesEnCours = annoncesForTab.filter(
        (a) =>
            !VALID.includes(
                String(a.statut || "")
                    .trim()
                    .toUpperCase(),
            ),
    ).length;
    const selectedType = ANNONCE_TYPES.find(
        (t) => t.value === annonceForm.type_annonce,
    );
    const selectedMotifLabel = annonceForm.type_annonce === "grace"
        ? MOTIFS_GRACE.find((m) => m.value === annonceForm.motif)?.label
        : annonceForm.type_annonce === "priere"
        ? MOTIFS_INTERCESSION.find((m) => m.value === annonceForm.motif)?.label
        : null;

    /* ── computed annonces filtrées ── */
    const annFiltered = useMemo(() => {
        let result = [...annoncesForTab];

        if (annFilter === "en_cours") {
            result = result.filter((a) =>
                IN_PROGRESS.includes(
                    String(a.statut || "")
                        .trim()
                        .toUpperCase(),
                ),
            );
        } else if (annFilter === "validees") {
            result = result.filter((a) =>
                VALID.includes(
                    String(a.statut || "")
                        .trim()
                        .toUpperCase(),
                ),
            );
        } else if (annFilter === "refusees") {
            result = result.filter((a) =>
                String(a.statut || "")
                    .trim()
                    .toUpperCase()
                    .startsWith("REFUSEE"),
            );
        }

        // Filter by specific type
        if (
            quickFilter &&
            quickFilter !== "all" &&
            quickFilter !== "mes_demandes" &&
            quickFilter !== "mes_annonces"
        ) {
            result = result.filter((a) =>
                [a.type_annonce, a.type_acte].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(quickFilter.toLowerCase()),
                ),
            );
        }

        if (!filterNeedle) return result;
        return result.filter((a) =>
            [
                a.type_annonce,
                a.type_acte,
                a.message,
                a.details?.contenu,
                a.statut,
                a.membre?.prenom,
                a.membre?.nom,
            ].some((field) =>
                String(field || "")
                    .toLowerCase()
                    .includes(filterNeedle),
            ),
        );
    }, [annoncesForTab, annFilter, quickFilter, filterNeedle]);
    const annTotalPages = Math.max(
        1,
        Math.ceil(annFiltered.length / ANN_PER_PAGE),
    );
    const pagedAnn = annFiltered.slice(
        (annPage - 1) * ANN_PER_PAGE,
        annPage * ANN_PER_PAGE,
    );

    /* ── stats annonces ── */
    const annStats = useMemo(
        () => ({
            total: annoncesForTab.length,
            enCours: annoncesForTab.filter((a) =>
                IN_PROGRESS.includes(
                    String(a.statut || "")
                        .trim()
                        .toUpperCase(),
                ),
            ).length,
            validees: annoncesForTab.filter((a) =>
                VALID.includes(
                    String(a.statut || "")
                        .trim()
                        .toUpperCase(),
                ),
            ).length,
            refusees: annoncesForTab.filter((a) =>
                String(a.statut || "")
                    .trim()
                    .toUpperCase()
                    .startsWith("REFUSEE"),
            ).length,
        }),
        [annoncesForTab],
    );

    /* ── helpers ── */
    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };
    const goTo = (n) => setPage(Math.max(1, Math.min(totalPages, n)));
    const goToMember = (n) =>
        setMemberPage(Math.max(1, Math.min(memberTotalPages, n)));
    const goToAnn = (n) => setAnnPage(Math.max(1, Math.min(annTotalPages, n)));

    const openAnnonce = () => {
        setAnnonceForm({ titre: "", contenu: "" });
        setShowAnnonceModal(true);
    };
    const closeAnnonce = () => {
        if (annonceProcessing) return;
        setShowAnnonceModal(false);
        setAnnonceForm({ titre: "", contenu: "" });
    };
    const submitAnnonce = async () => {
        if (!annonceForm.titre.trim() || !annonceForm.contenu.trim()) {
            notify("Veuillez remplir le titre et le contenu.", "error");
            return;
        }
        try {
            setAnnonceProcessing(true);
            const res = await axios.post(
                withBasePath("", "/responsable-famille/flash-annonces"),
                annonceForm,
            );
            const newA = res.data?.annonce || {
                id: Date.now(),
                statut: "SOUMISE",
                details: { titre: annonceForm.titre, contenu: annonceForm.contenu },
                created_at: new Date().toISOString(),
                date_publication: null,
                date_expiration: null,
                reference: null,
            };
            setLocalFlashAnnonces((prev) => [newA, ...prev]);
            setFlashPage(1);
            setActiveTab("annonces");
            closeAnnonce();
            notify("✅ Annonce soumise ! Elle sera publiée après validation par l'administrateur.");
        } catch (e) {
            notify(e?.response?.data?.message || "Une erreur est survenue.", "error");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    const openCeremonyModal = (acte) => {
        setCeremonyActe(acte);
        setCeremonyForm({
            date_souhaitee: acte?.date_souhaitee
                ? String(acte.date_souhaitee).slice(0, 10)
                : "",
            ceremonie_creneau: acte?.details?.ceremonie_creneau || "",
            lieu_ceremonie: acte?.details?.lieu_ceremonie || "",
            temoin_homme:
                acte?.details?.temoin_homme || acte?.details?.temoins || "",
            temoin_femme: acte?.details?.temoin_femme || "",
        });
    };
    const closeCeremonyModal = () => {
        if (ceremonyProcessing) return;
        setCeremonyActe(null);
    };
    const submitCeremonyDetails = async () => {
        if (!ceremonyActe) return;

        if (
            !ceremonyForm.date_souhaitee ||
            !ceremonyForm.ceremonie_creneau ||
            !ceremonyForm.lieu_ceremonie.trim() ||
            !ceremonyForm.temoin_homme.trim() ||
            !ceremonyForm.temoin_femme.trim()
        ) {
            notify(
                "Renseignez la date, le créneau, le lieu de la cérémonie ainsi que les deux témoins.",
                "error",
            );
            return;
        }

        const temoinHomme = ceremonyForm.temoin_homme.trim();
        const temoinFemme = ceremonyForm.temoin_femme.trim();

        try {
            setCeremonyProcessing(true);
            const res = await axios.put(
                withBasePath("", `/responsable-famille/liturgie/${ceremonyActe.id}/ceremonie`),
                {
                    date_souhaitee: ceremonyForm.date_souhaitee,
                    ceremonie_creneau: ceremonyForm.ceremonie_creneau,
                    lieu_ceremonie: ceremonyForm.lieu_ceremonie.trim(),
                    temoin_homme: temoinHomme,
                    temoin_femme: temoinFemme,
                    temoins: `Témoin femme: ${temoinFemme} | Témoin homme: ${temoinHomme}`,
                },
            );
            const updatedActe = res.data?.acte;

            if (updatedActe) {
                setLocalActes((prev) =>
                    prev.map((item) =>
                        item.id === updatedActe.id
                            ? normalizeActe(updatedActe)
                            : item,
                    ),
                );
                setSelectedActe((prev) =>
                    prev?.id === updatedActe.id ? updatedActe : prev,
                );
            }

            closeCeremonyModal();
            notify(
                res.data?.message ||
                    "Les informations de cérémonie ont été enregistrées.",
                "success",
            );
        } catch (e) {
            notify(
                e?.response?.data?.message || "Une erreur est survenue.",
                "error",
            );
        } finally {
            setCeremonyProcessing(false);
        }
    };

    /* ════════════════════════ RENDER ════════════════════════ */
    return (
        <div className="rf-page">
            <style>{styles}</style>
            <div className="rf-wrap">
                {/* ── BARRE ACTIONS ── */}
                <div className="rf-actions">
                    <Link
                        href={withBasePath(
                            "",
                            "/responsable-famille/dashboard",
                        )}
                        className="btn-ghost"
                    >
                        <ArrowLeft size={16} /> Retour
                    </Link>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            type="button"
                            className="btn-terra"
                            onClick={() => {
                                const first = familyMembers[0] || null;
                                const classeId =
                                    first?.classe_id ||
                                    first?.classe?.id ||
                                    null;
                                const list =
                                    getConducteursList(conducteurs, classeId) ||
                                    [];
                                if (!list.length) {
                                    notify(
                                        "Aucun conducteur trouvé pour votre classe.",
                                        "error",
                                    );
                                    return;
                                }
                                setContact(list);
                            }}
                        >
                            Contacter conducteurs
                        </button>
                    </div>
                </div>

                {/* ── WELCOME ── */}
                <div className="welcome">
                    <div className="welcome-text">
                        <div className="welcome-title">
                            Bonjour, <span>{familyName}</span>
                        </div>
                        <div className="welcome-sub">
                            {enCours} demande(s) en cours · {valides} acte(s)
                            validé(s) · Certificats disponibles au
                            téléchargement
                        </div>
                    </div>
                    <div className="chips">
                        <span className="chip chip-terra">
                            {enCours} en cours
                        </span>
                        <span className="chip chip-sage">
                            {valides} validés
                        </span>
                        <span className="chip chip-amber">
                            {familyMembers.length} membres
                        </span>
                    </div>
                </div>

                {/* ── KPI ── */}
                <div className="kpi-row">
                    <Kpi
                        tone="terra"
                        tag="Total"
                        value={total}
                        label="Demandes soumises"
                    />
                    <Kpi
                        tone="amber"
                        tag="En cours"
                        value={enCours}
                        label="En attente de validation"
                    />
                    <Kpi
                        tone="sage"
                        tag="Validés"
                        value={valides}
                        label="Actes validés & certifiés"
                    />
                    <Kpi
                        tone="violet"
                        tag="Mes annonces"
                        value={localFlashAnnonces.length}
                        label="Annonces soumises au flash info"
                        clickable
                        onClick={() => setActiveTab("annonces")}
                    />
                </div>

                {/* ── TABS PRINCIPAL ── */}
                <div className="tabs-tools">
                    <div className="main-tabs">
                        <button
                            className={`mtab ${activeTab === "annonces" ? "active" : ""}`}
                            onClick={() => setActiveTab("annonces")}
                        >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            Mes annonces
                            {localFlashAnnonces.filter(a => a.statut === 'SOUMISE').length > 0 && (
                                <span className="tbadge tbadge-terra">
                                    {localFlashAnnonces.filter(a => a.statut === 'SOUMISE').length}
                                </span>
                            )}
                        </button>
                        <button
                            className={`mtab ${activeTab === "actes" ? "active" : ""}`}
                            onClick={() => setActiveTab("actes")}
                        >
                            <svg
                                width="13"
                                height="13"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Mes actes
                            {enCours > 0 && (
                                <span className="tbadge tbadge-terra">
                                    {enCours}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="quick-tools">
                        <select
                            className="quick-dropdown"
                            value={quickFilter}
                            onChange={(e) => setQuickFilter(e.target.value)}
                        >
                            <option value="all">🔍 Tous les contenus</option>
                            <optgroup label="Actes liturgiques">
                                <option value="bapteme">💧 Baptême</option>
                                <option value="mariage">💍 Mariage</option>
                                <option value="premiere_communion">
                                    🍞 Première Communion
                                </option>
                                <option value="naissance">👶 Naissance</option>
                                <option value="deces">🕯️ Décès</option>
                            </optgroup>
                            <optgroup label="Demandes de prière">
                                <option value="grace">
                                    🙌 Action de grâce
                                </option>
                                <option value="generale">📢 Générale</option>
                            </optgroup>
                            <optgroup label="Mes contenus">
                                <option value="mes_demandes">
                                    📋 Mes demandes
                                </option>
                                <option value="mes_annonces">
                                    🙏 Mes demandes de prière
                                </option>
                            </optgroup>
                        </select>
                        <input
                            type="search"
                            className="quick-search"
                            placeholder="Recherche par nom, référence..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* ══════════ TAB ACTES ══════════ */}
                {activeTab === "actes" && (
                    <div className="grid-main">
                        <div>
                            {/* LISTE ACTES */}
                            <section className="panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="ph-title">
                                            Mes demandes d'actes
                                        </div>
                                        <div className="ph-sub">
                                            Suivi en temps réel de chaque étape
                                        </div>
                                    </div>
                                    <Link
                                        href={withBasePath(
                                            "",
                                            "/responsable-famille/liturgie/nouvelle",
                                        )}
                                        className="ph-link ph-link-green"
                                    >
                                        + Nouvelle demande
                                    </Link>
                                </div>
                                {filteredActes.length === 0 && annFiltered.length === 0 && (
                                    <div className="empty">
                                        Aucune demande pour le moment.
                                    </div>
                                )}
                                {pagedActes.map((acte) => {
                                    const statut = String(acte?.statut || "")
                                        .trim()
                                        .toUpperCase();
                                    const canChooseDate =
                                        Boolean(acte?.can_choose_date) ||
                                        ["CELEBRE", "TERMINE"].includes(
                                            String(acte?.statut || "")
                                                .trim()
                                                .toUpperCase(),
                                        );
                                    const isMarriage =
                                        String(acte.type_acte || "")
                                            .trim()
                                            .toLowerCase() === "mariage";
                                    const hist = Array.isArray(acte.historiques)
                                        ? [...acte.historiques].sort(
                                              (a, b) =>
                                                  new Date(a.created_at) -
                                                  new Date(b.created_at),
                                          )
                                        : [];
                                    const datesSoumise = acte.created_at
                                        ? formatDateTime(acte.created_at)
                                        : null;
                                    const histMap = {};
                                    hist.forEach((h) => {
                                        histMap[h.statut_nouveau] = h;
                                    });
                                    const refusConducteur =
                                        histMap["REFUSEE_PAR_CONDUCTEUR"];
                                    const refusPasteur =
                                        histMap["REFUSEE_PAR_PASTEUR"];
                                    const celebrationEntry =
                                        histMap[
                                            "CEREMONIE_VALIDEE_PAR_PASTEUR"
                                        ] ||
                                        histMap["CEREMONIE_VALIDE_PAR_PASTEUR"];
                                    const celebrationRefus =
                                        histMap[
                                            "CEREMONIE_REFUSEE_PAR_PASTEUR"
                                        ] ||
                                        histMap[
                                            "CEREMONIE_REFUSEE_PAR_CONDUCTEUR"
                                        ];
                                    const ceremonyStatut = String(
                                        acte.details?.ceremonie_statut || "",
                                    )
                                        .trim()
                                        .toUpperCase();
                                    const celebrationDate = celebrationEntry
                                        ? formatDateTime(
                                              celebrationEntry.created_at,
                                          )
                                        : celebrationRefus
                                          ? formatDateTime(
                                                celebrationRefus.created_at,
                                            )
                                          : null;
                                    const celebrationValidated = [
                                        "CEREMONIE_VALIDEE_PAR_PASTEUR",
                                        "CEREMONIE_VALIDE_PAR_PASTEUR",
                                    ].includes(ceremonyStatut);
                                    const getEtape = (key) => {
                                        const h = histMap[key];
                                        if (!h) return null;
                                        const acteur = h.acteur
                                            ? `${h.acteur.prenom || ""} ${h.acteur.nom || ""}`.trim()
                                            : null;
                                        return {
                                            date: formatDateTime(h.created_at),
                                            acteur,
                                        };
                                    };
                                    const etapeConducteur = getEtape(
                                        "TRANSMISE_AU_PASTEUR",
                                    );
                                    const etapePasteur = getEtape("VALIDEE");
                                    const celebrationDone =
                                        celebrationValidated ||
                                        DONE.includes(statut);
                                    const celebrationActive =
                                        ceremonyStatut ===
                                        "CEREMONIE_TRANSMISE_AU_PASTEUR";
                                    const celebrationRefused =
                                        ceremonyStatut.includes("REFUSEE");
                                    const canSeeCertificate =
                                        DONE.includes(statut);
                                    const validFicheStatuses =
                                        String(acte.type_acte).toLowerCase() ===
                                        "naissance"
                                            ? [
                                                  "VALIDEE",
                                                  "PUBLIEE",
                                                  "ARCHIVEE",
                                                  "CELEBRE",
                                                  "TERMINE",
                                              ]
                                            : String(
                                                    acte.type_acte,
                                                ).toLowerCase() === "deces"
                                              ? [
                                                    "VALIDEE",
                                                    "PUBLIEE",
                                                    "ARCHIVEE",
                                                    "CELEBRE",
                                                    "TERMINE",
                                                ]
                                              : [
                                                    "SOUMISE",
                                                    "EN_ATTENTE_CONDUCTEUR",
                                                    "TRANSMISE_AU_PASTEUR",
                                                    "VALIDEE",
                                                    "PUBLIEE",
                                                    "ARCHIVEE",
                                                    "CELEBRE",
                                                    "TERMINE",
                                                ];
                                    const canSeeFiche =
                                        isFicheType(acte.type_acte) &&
                                        validFicheStatuses.includes(statut);
                                    const etapeFinal =
                                        getEtape("CELEBRE") ||
                                        getEtape("TERMINE");
                                    return (
                                        <article
                                            key={acte.id}
                                            className="demande"
                                        >
                                            <div className="d-top">
                                                <div
                                                    className={`d-icon ${typeTone(acte.type_acte)}`}
                                                >
                                                    {acte.membre
                                                        ?.profile_photo_url ? (
                                                        <img
                                                            src={
                                                                acte.membre
                                                                    .profile_photo_url
                                                            }
                                                            alt={
                                                                acte.membre
                                                                    ?.prenom +
                                                                " " +
                                                                acte.membre?.nom
                                                            }
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                                borderRadius:
                                                                    "50%",
                                                            }}
                                                        />
                                                    ) : (
                                                        typeIcon(acte.type_acte)
                                                    )}
                                                </div>
                                                <div className="d-content">
                                                    <div className="d-name">
                                                        {prettyType(
                                                            acte.type_acte,
                                                        )}{" "}
                                                        — {acte.membre?.prenom}{" "}
                                                        {acte.membre?.nom}
                                                    </div>
                                                    <div className="d-meta">
                                                        <span>
                                                            DATE{" "}
                                                            {formatDate(
                                                                acte.date_souhaitee,
                                                            )}
                                                        </span>
                                                        <span>
                                                            RÉF:{" "}
                                                            {acte.reference ||
                                                                `ACTE-${acte.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`badge ${statusBadgeClass(statut)}`}
                                                >
                                                    <span className="bdot" />
                                                    {statusLabel(statut)}
                                                </span>
                                            </div>
                                            <div className="st-track">
                                                <StatusStep
                                                    label="Soumise"
                                                    done={true}
                                                    active={false}
                                                    date={datesSoumise}
                                                />
                                                <StatusStep
                                                    label="Validation du conducteur"
                                                    done={
                                                        statut ===
                                                            "TRANSMISE_AU_PASTEUR" ||
                                                        statut ===
                                                            "REFUSEE_PAR_CONDUCTEUR" ||
                                                        VALID.includes(statut)
                                                    }
                                                    active={
                                                        statut ===
                                                        "EN_ATTENTE_CONDUCTEUR"
                                                    }
                                                    refused={
                                                        statut ===
                                                        "REFUSEE_PAR_CONDUCTEUR"
                                                    }
                                                    date={
                                                        refusConducteur
                                                            ? formatDateTime(
                                                                  refusConducteur.created_at,
                                                              )
                                                            : etapeConducteur?.date
                                                    }
                                                />
                                                <StatusStep
                                                    label="Validation du pasteur"
                                                    done={
                                                        VALID.includes(
                                                            statut,
                                                        ) ||
                                                        statut ===
                                                            "REFUSEE_PAR_PASTEUR" ||
                                                        DONE.includes(statut)
                                                    }
                                                    active={
                                                        statut ===
                                                        "TRANSMISE_AU_PASTEUR"
                                                    }
                                                    refused={
                                                        statut ===
                                                        "REFUSEE_PAR_PASTEUR"
                                                    }
                                                    date={
                                                        refusPasteur
                                                            ? formatDateTime(
                                                                  refusPasteur.created_at,
                                                              )
                                                            : etapePasteur?.date
                                                    }
                                                />
                                                {isMarriage && (
                                                    <StatusStep
                                                        label="Célébration"
                                                        done={celebrationDone}
                                                        active={
                                                            celebrationActive
                                                        }
                                                        refused={
                                                            celebrationRefused
                                                        }
                                                        date={celebrationDate}
                                                    />
                                                )}
                                            </div>
                                            <div className="d-actions">
                                                <button
                                                    type="button"
                                                    className="btn-see"
                                                    onClick={() =>
                                                        setSelectedActe(acte)
                                                    }
                                                >
                                                    Voir le détail
                                                </button>
                                                {String(acte.type_acte) ===
                                                    "mariage" &&
                                                    !DONE.includes(statut) && (
                                                        <button
                                                            type="button"
                                                            className={`btn-pdf ${!canChooseDate ? "btn-disabled" : ""}`}
                                                            disabled={
                                                                !canChooseDate
                                                            }
                                                            title={
                                                                !canChooseDate
                                                                    ? "Le pasteur doit envoyer la fiche PDF avant que vous puissiez choisir une date."
                                                                    : "Choisir une date"
                                                            }
                                                            onClick={() =>
                                                                canChooseDate &&
                                                                openCeremonyModal(
                                                                    acte,
                                                                )
                                                            }
                                                        >
                                                            Choisir une date
                                                        </button>
                                                    )}
                                                {isFicheType(acte.type_acte) ? (
                                                    <button
                                                        type="button"
                                                        className={`btn-pdf ${!canSeeFiche ? "btn-disabled" : ""}`}
                                                        disabled={!canSeeFiche}
                                                        title={
                                                            canSeeFiche
                                                                ? "Voir la fiche"
                                                                : "La fiche sera disponible après validation finale du pasteur."
                                                        }
                                                        onClick={() =>
                                                            canSeeFiche &&
                                                            setPreviewActe(acte)
                                                        }
                                                    >
                                                        <Download size={13} />{" "}
                                                        Voir la fiche
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={`btn-pdf ${!canSeeCertificate ? "btn-disabled" : ""}`}
                                                        disabled={
                                                            !canSeeCertificate
                                                        }
                                                        title={
                                                            canSeeCertificate
                                                                ? "Voir le certificat"
                                                                : "Le certificat sera disponible après validation de la date de célébration."
                                                        }
                                                        onClick={() =>
                                                            canSeeCertificate &&
                                                            setPreviewActe(acte)
                                                        }
                                                    >
                                                        <Download size={13} />{" "}
                                                        Voir le certificat
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                                {totalPages > 1 && (
                                    <div className="pager">
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() => goTo(page - 1)}
                                            disabled={page === 1}
                                        >
                                            Précédent
                                        </button>
                                        <span className="pager-info">
                                            Page {page} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() => goTo(page + 1)}
                                            disabled={page === totalPages}
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                )}

                            </section>

                            {/* MEMBRES */}
                            <section className="panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="ph-title">
                                            Membres de la famille
                                        </div>
                                        <div className="ph-sub">
                                            Actes associés à chaque membre
                                        </div>
                                    </div>
                                </div>
                                {familyMembers.length === 0 && (
                                    <div className="empty">
                                        Aucun membre disponible.
                                    </div>
                                )}
                                {pagedMembers.map((member) => {
                                    const count = localActes.filter(
                                        (a) => a.membre_id === member.id,
                                    ).length;
                                    const memberPhotoUrl =
                                        resolveMemberPhotoUrl(member);
                                    return (
                                        <div key={member.id} className="mbr">
                                            <div className="mbr-av">
                                                {memberPhotoUrl ? (
                                                    <img
                                                        src={memberPhotoUrl}
                                                        alt={`${member.prenom || ""} ${member.nom || ""}`.trim()}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    initials(
                                                        member.prenom,
                                                        member.nom,
                                                    )
                                                )}
                                            </div>
                                            <div>
                                                <div className="mbr-name">
                                                    {member.prenom} {member.nom}
                                                </div>
                                                <div className="mbr-role">
                                                    Membre de la famille
                                                </div>
                                            </div>
                                            <span
                                                className={`mbr-count ${count === 0 ? "none" : ""}`}
                                            >
                                                {count > 0
                                                    ? `${count} acte(s)`
                                                    : "—"}
                                            </span>
                                        </div>
                                    );
                                })}
                                {memberTotalPages > 1 && (
                                    <div className="pager">
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() =>
                                                goToMember(memberPage - 1)
                                            }
                                            disabled={memberPage === 1}
                                        >
                                            Précédent
                                        </button>
                                        <span className="pager-info">
                                            Page {memberPage} /{" "}
                                            {memberTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() =>
                                                goToMember(memberPage + 1)
                                            }
                                            disabled={
                                                memberPage === memberTotalPages
                                            }
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* COLONNE DROITE */}
                        <aside className="right-col">

                        <section className="guide-card">
                                <div className="guide-title">
                                    Comment ça marche ?
                                </div>
                                {[
                                    {
                                        n: "g-n1",
                                        t: "Vous soumettez",
                                        s: "Remplissez le formulaire selon le type d'acte souhaité.",
                                    },
                                    {
                                        n: "g-n2",
                                        t: "Conducteur analyse",
                                        s: "Le conducteur vérifie le dossier puis le transmet.",
                                    },
                                    {
                                        n: "g-n3",
                                        t: "Pasteur valide",
                                        s: "Validation pastorale finale ou refus motivé.",
                                    },
                                    {
                                        n: "g-n4",
                                        t: "Document PDF disponible",
                                        s: "Certificat pour baptême/mariage, fiche pour naissance/décès.",
                                    },
                                ].map((s, i) => (
                                    <div key={i} className="g-step">
                                        <span className={`g-num ${s.n}`}>
                                            {i + 1}
                                        </span>
                                        <div>
                                            <div className="g-step-title">
                                                {s.t}
                                            </div>
                                            <div className="g-step-sub">
                                                {s.s}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                            <section className="cta-annonce-card">
                                <div className="cta-ann-header">
                                    <div className="cta-ann-icon">📢</div>
                                    <div className="cta-ann-lbl">
                                        Tableau Paroissial
                                    </div>
                                </div>
                                <div className="cta-ann-title">
                                    Faire une annonce
                                </div>
                                <div className="cta-ann-sub">
                                    Partagez une information avec toute
                                    l'assemblée. Votre annonce sera publiée
                                    dans le flash info après validation.
                                </div>
                                <button
                                    type="button"
                                    className="btn-cta-ann"
                                    onClick={openAnnonce}
                                >
                                    <svg
                                        width="15"
                                        height="15"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                        />
                                    </svg>
                                    + Faire une annonce
                                </button>
                                <div className="cta-ann-note">
                                    <svg
                                        width="11"
                                        height="11"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>{" "}
                                    Validée par l'administrateur · Publiée dans le flash info
                                </div>
                            </section>
                            <section className="cta-card">
                                <div className="cta-lbl">
                                    Démarche liturgique
                                </div>
                                <div className="cta-title">
                                    Nouvelle demande d'acte
                                </div>
                                <div className="cta-sub">
                                    Soumettez votre demande en quelques étapes.
                                    Elle sera traitée par votre conducteur puis
                                    validée par le pasteur.
                                </div>
                                <div className="cta-types">
                                    {[
                                        "Baptême",
                                        "Communion",
                                        "Mariage",
                                        "Naissance",
                                        "Décès",
                                    ].map((t) => (
                                        <span key={t} className="cta-type">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <Link
                                    href={withBasePath(
                                        "",
                                        "/responsable-famille/liturgie/nouvelle",
                                    )}
                                    className="btn-cta"
                                >
                                    + Nouvelle demande d'acte
                                </Link>
                            </section>
                            
                        </aside>
                    </div>
                )}

                {/* ══════════ TAB MES ANNONCES ══════════ */}
                {activeTab === "annonces" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Mes annonces</span>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>({localFlashAnnonces.length})</span>
                            </div>
                            <button type="button" className="btn-cta-ann btn-cta-ann-sm" onClick={openAnnonce}>
                                + Nouvelle annonce
                            </button>
                        </div>

                        {/* Liste */}
                        {localFlashAnnonces.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Aucune annonce soumise</div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>Cliquez sur "+ Nouvelle annonce" pour soumettre une annonce au flash info.</div>
                            </div>
                        ) : (() => {
                            const FLASH_PER_PAGE = 5;
                            const flashTotalPages = Math.ceil(localFlashAnnonces.length / FLASH_PER_PAGE);
                            const pagedFlash = localFlashAnnonces.slice((flashPage - 1) * FLASH_PER_PAGE, flashPage * FLASH_PER_PAGE);
                            return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {pagedFlash.map((ann) => {
                                    const titre = ann.details?.titre || "(Sans titre)";
                                    const contenu = ann.details?.contenu || "";
                                    const statut = ann.statut || "SOUMISE";
                                    const isExpired = ann.date_expiration && new Date(ann.date_expiration) < new Date();

                                    const fmtDate = (val) => {
                                        if (!val) return null;
                                        const d = new Date(val);
                                        return isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                                    };

                                    const statutConfig = {
                                        SOUMISE:  { label: "En attente", bg: "#fef9c3", color: "#92400e", border: "#fde68a" },
                                        PUBLIEE:  { label: "Publiée",    bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
                                        ARCHIVEE: { label: "Archivée",   bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
                                    };
                                    const cfg = statutConfig[statut] || { label: statut, bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" };

                                    return (
                                        <div key={ann.id} style={{
                                            background: "#fff",
                                            borderRadius: 12,
                                            border: `1px solid ${statut === "PUBLIEE" ? "#bbf7d0" : "#e5e7eb"}`,
                                            boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
                                            padding: "16px 20px",
                                            display: "flex", flexDirection: "column", gap: 8,
                                            opacity: isExpired ? 0.6 : 1,
                                        }}>
                                            {/* Titre + statut */}
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="2.5" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titre}</span>
                                                    {isExpired && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", flexShrink: 0 }}>Expiré</span>}
                                                </div>
                                                <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            {/* Contenu */}
                                            {contenu && (
                                                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                    {contenu}
                                                </p>
                                            )}

                                            {/* Footer méta */}
                                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 2 }}>
                                                {fmtDate(statut === "PUBLIEE" ? ann.date_publication : ann.created_at) && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                                        {statut === "PUBLIEE" ? "Publiée le " : "Soumise le "}{fmtDate(statut === "PUBLIEE" ? ann.date_publication : ann.created_at)}
                                                    </span>
                                                )}
                                                {ann.date_expiration && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: isExpired ? "#f97316" : "#9ca3af" }}>
                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                                        Expire le {new Date(ann.date_expiration).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                )}
                                                {ann.reference && (
                                                    <span style={{ color: "#d1d5db" }}>Réf. {ann.reference}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {flashTotalPages > 1 && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => setFlashPage(p => Math.max(1, p - 1))}
                                            disabled={flashPage === 1}
                                            style={{ padding: "6px 14px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", cursor: flashPage === 1 ? "not-allowed" : "pointer", opacity: flashPage === 1 ? 0.4 : 1 }}
                                        >← Précédent</button>
                                        {Array.from({ length: flashTotalPages }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setFlashPage(n)}
                                                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "1px solid", background: flashPage === n ? "#2563eb" : "#fff", color: flashPage === n ? "#fff" : "#374151", borderColor: flashPage === n ? "#2563eb" : "#e5e7eb", cursor: "pointer" }}
                                            >{n}</button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFlashPage(p => Math.min(flashTotalPages, p + 1))}
                                            disabled={flashPage === flashTotalPages}
                                            style={{ padding: "6px 14px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", cursor: flashPage === flashTotalPages ? "not-allowed" : "pointer", opacity: flashPage === flashTotalPages ? 0.4 : 1 }}
                                        >Suivant →</button>
                                    </div>
                                )}
                            </div>
                            );
                        })()}
                    </div>
                )}

                {/* ══════════ PANEL ANNONCES ANCIEN (désactivé) ══════════ */}
                {false && (
                    <div className="ann-tab-root">
                        <div className="ann-subtabs-bar" style={{ borderTop: '2px solid #ede9fe', paddingTop: 10, marginTop: 4 }}>
                            <div className="ann-subtabs">
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    🙏 Mes demandes de prière
                                    {annStats.total > 0 && (
                                        <span className="ann-stab-badge">{annStats.total}</span>
                                    )}
                                </span>
                            </div>
                            <div className="ann-filters">
                                {[
                                    { v: "tous", l: "Toutes" },
                                    { v: "en_cours", l: "En cours" },
                                    { v: "validees", l: "Validées" },
                                    { v: "refusees", l: "Refusées" },
                                ].map((f) => (
                                    <button
                                        key={f.v}
                                        className={`ann-filter-btn ${annFilter === f.v ? "active" : ""}`}
                                        onClick={() => { setAnnFilter(f.v); setAnnPage(1); }}
                                    >
                                        {f.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="ann-grid-layout">
                            {/* LISTE */}
                            <div className="panel">
                                <div className="panel-head">
                                    <div>
                                        <div className="ph-title">
                                            Mes demandes de prière
                                        </div>
                                        <div className="ph-sub">
                                            {annFilter === "tous"
                                                ? "Toutes vos demandes de prière"
                                                : annFilter === "en_cours"
                                                  ? "En attente de validation"
                                                  : annFilter === "validees"
                                                    ? "Demandes de prière publiées"
                                                    : "Demandes de prière refusées"}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="ph-link"
                                        onClick={openAnnonce}
                                    >
                                        + Nouvelle demande de prière
                                    </button>
                                </div>

                                {annFiltered.length === 0 && (
                                    <div className="ann-empty">
                                        <div className="ann-empty-icon">
                                            {annFilter === "refusees"
                                                ? "😔"
                                                : "📢"}
                                        </div>
                                        <div className="ann-empty-title">
                                            {annFilter === "tous"
                                                ? "Aucune demande de prière pour le moment"
                                                : annFilter === "en_cours"
                                                  ? "Aucune demande de prière en cours"
                                                  : annFilter === "validees"
                                                    ? "Aucune demande de prière validée"
                                                    : "Aucune demande de prière refusée"}
                                        </div>
                                        <div className="ann-empty-sub">
                                            Partagez une prière, une action de
                                            grâce ou des félicitations avec la
                                            paroisse.
                                        </div>
                                        {annFilter === "tous" && (
                                            <button
                                                type="button"
                                                className="btn-cta-ann"
                                                style={{
                                                    width: "auto",
                                                    marginTop: 16,
                                                }}
                                                onClick={openAnnonce}
                                            >
                                                Faire ma première demande de prière
                                            </button>
                                        )}
                                    </div>
                                )}

                                {pagedAnn.map((ann) => {
                                    const t = ANNONCE_TYPES.find(
                                        (x) =>
                                            x.value === ann.type_annonce ||
                                            x.value === ann.type_acte,
                                    );
                                    const isValid = VALID.includes(ann.statut);
                                    const isRefuse = String(
                                        ann.statut,
                                    ).startsWith("REFUSEE");
                                    const isCours = !isValid && !isRefuse;
                                    const msg =
                                        ann.details?.contenu ||
                                        ann.message ||
                                        "";
                                    const member = ann.membre
                                        ? `${ann.membre.prenom} ${ann.membre.nom}`
                                        : null;
                                    return (
                                        <div
                                            key={ann.id}
                                            className={`ann-item-rf ${isRefuse ? "ann-item-refuse" : isValid ? "ann-item-valid" : ""}`}
                                            onClick={() =>
                                                setSelectedAnnonce(ann)
                                            }
                                        >
                                            <div
                                                className={`ann-item-icon atype-${t?.color}`}
                                            >
                                                {t?.emoji || "📢"}
                                            </div>
                                            <div className="ann-item-body">
                                                <div className="ann-item-header">
                                                    <span className="ann-item-name">
                                                        {t?.label ||
                                                            ann.type_annonce}
                                                    </span>
                                                    {member && (
                                                        <span className="ann-item-who">
                                                            — {member}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ann-item-msg">
                                                    {msg.slice(0, 100)}
                                                    {msg.length > 100
                                                        ? "…"
                                                        : ""}
                                                </div>
                                                <div className="ann-item-meta">
                                                    {ann.created_at && (
                                                        <span>
                                                            📅{" "}
                                                            {formatDate(
                                                                ann.created_at,
                                                            )}
                                                        </span>
                                                    )}
                                                    {ann.date_annonce && (
                                                        <span>
                                                            🗓{" "}
                                                            {formatDate(
                                                                ann.date_annonce,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Progress tracker */}
                                                <AnnonceDotTrack
                                                    statut={ann.statut}
                                                    ann={ann}
                                                />
                                            </div>
                                            <div className="ann-item-right">
                                                {isCours && (
                                                    <span className="ann-badge ann-badge-orange">
                                                        EN COURS
                                                    </span>
                                                )}
                                                {isValid && (
                                                    <span className="ann-badge ann-badge-sage">
                                                        PUBLIÉE
                                                    </span>
                                                )}
                                                {isRefuse && (
                                                    <span className="ann-badge ann-badge-terra">
                                                        REFUSÉE
                                                    </span>
                                                )}
                                                {isValid && (
                                                    <button
                                                        type="button"
                                                        className="btn-pdf btn-pdf-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(
                                                                withBasePath("", `/responsable-famille/annonces/${ann.id}/fiche`),
                                                                "_blank",
                                                            );
                                                        }}
                                                    >
                                                        <Eye size={11} /> Voir
                                                        la fiche
                                                    </button>
                                                )}
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    style={{
                                                        color: "#9C9484",
                                                    }}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })}
                                {annTotalPages > 1 && (
                                    <div className="pager">
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() => goToAnn(annPage - 1)}
                                            disabled={annPage === 1}
                                        >
                                            Précédent
                                        </button>
                                        <span className="pager-info">
                                            Page {annPage} / {annTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="pager-btn"
                                            onClick={() => goToAnn(annPage + 1)}
                                            disabled={annPage === annTotalPages}
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* SIDEBAR */}
                            <aside
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {/* Circuit */}
                                <div className="panel">
                                    <div className="panel-head">
                                        <div
                                            className="ph-title"
                                            style={{ fontSize: 14 }}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                style={{ marginRight: 6 }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Circuit de la demande de prière
                                        </div>
                                    </div>
                                    <div className="ann-circuit-steps">
                                        <div className="ann-cs-step done">
                                            <div className="ann-cs-dot done">
                                                <svg
                                                    width="9"
                                                    height="9"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ann-cs-line done" />
                                            <div className="ann-cs-text">
                                                <strong>Vous soumettez</strong>
                                                <span>Demande de prière enregistrée</span>
                                            </div>
                                        </div>
                                        <div className="ann-cs-step">
                                            <div
                                                className="ann-cs-dot active"
                                                style={{ fontSize: 12 }}
                                            >
                                                📋
                                            </div>
                                            <div className="ann-cs-line" />
                                            <div className="ann-cs-text">
                                                <strong>
                                                    Conducteur valide
                                                </strong>
                                                <span>Analyse du contenu</span>
                                            </div>
                                        </div>
                                        <div className="ann-cs-step">
                                            <div className="ann-cs-dot pending">
                                                ✝
                                            </div>
                                            <div className="ann-cs-line" />
                                            <div className="ann-cs-text">
                                                <strong>
                                                    Pasteur approuve
                                                </strong>
                                                <span>Validation finale</span>
                                            </div>
                                        </div>
                                        <div className="ann-cs-step">
                                            <div
                                                className="ann-cs-dot pending"
                                                style={{ fontSize: 10 }}
                                            >
                                                🌍
                                            </div>
                                            <div className="ann-cs-text">
                                                <strong>Publication</strong>
                                                <span>
                                                    Visible à la paroisse
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Répartition types */}
                                <div className="panel">
                                    <div className="panel-head">
                                        <div
                                            className="ph-title"
                                            style={{ fontSize: 14 }}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                style={{ marginRight: 6 }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                />
                                            </svg>
                                            Mes demandes de prière par type
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            padding: "14px 18px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {ANNONCE_TYPES.map((t) => {
                                            const cnt = annonces.filter(
                                                (a) =>
                                                    (a.type_annonce ||
                                                        a.type_acte) ===
                                                    t.value,
                                            ).length;
                                            const pct = annStats.total
                                                ? Math.round(
                                                      (cnt / annStats.total) *
                                                          100,
                                                  )
                                                : 0;
                                            return (
                                                <div
                                                    key={t.value}
                                                    className="ann-stat-row"
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 18,
                                                            width: 24,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {t.emoji}
                                                    </span>
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 11.5,
                                                                fontWeight: 700,
                                                                color: "#1E1B16",
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            {t.label
                                                                .split("/")[0]
                                                                .trim()}
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: 4,
                                                                background:
                                                                    "rgba(30,27,22,.07)",
                                                                borderRadius: 6,
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    height: "100%",
                                                                    borderRadius: 6,
                                                                    background:
                                                                        t.color ===
                                                                        "violet"
                                                                            ? "#7C6FCD"
                                                                            : t.color ===
                                                                                "amber"
                                                                              ? "#B87A20"
                                                                              : t.color ===
                                                                                  "slate"
                                                                                ? "#909090"
                                                                                : t.color ===
                                                                                    "terra"
                                                                                  ? "#C06040"
                                                                                  : "#4A7C5E",
                                                                    width: `${pct}%`,
                                                                    transition:
                                                                        "width .5s",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: 14,
                                                            fontWeight: 800,
                                                            color: "#1E1B16",
                                                            width: 20,
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        {cnt}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════ MODAL : FLASH ANNONCE ══════════ */}
            {showAnnonceModal && (
                <div className="modal-overlay" onClick={closeAnnonce}>
                    <div
                        className="modal ann-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">📢 Faire une annonce</div>
                                <div className="modal-sub">
                                    Sera publiée dans le flash info après validation de l'admin
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAnnonce}
                            >
                                ×
                            </button>
                        </div>


                        <div className="modal-body">
                            <div className="ann-form">
                                <Field label="Titre de l'annonce" required>
                                    <input
                                        className="ann-input"
                                        type="text"
                                        placeholder="Ex: Cérémonie de mariage, Annonce de naissance..."
                                        value={annonceForm.titre}
                                        onChange={(e) => setAnnonceForm((f) => ({ ...f, titre: e.target.value }))}
                                        maxLength={255}
                                    />
                                </Field>
                                <Field label="Contenu de l'annonce" required>
                                    <textarea
                                        className="ann-textarea"
                                        rows={5}
                                        placeholder="Décrivez votre annonce en détail..."
                                        value={annonceForm.contenu}
                                        onChange={(e) => setAnnonceForm((f) => ({ ...f, contenu: e.target.value }))}
                                        maxLength={2000}
                                    />
                                    <div className="ann-chars">{annonceForm.contenu.length}/2000</div>
                                </Field>
                                <div className="ann-visibility">
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Visible par toute la paroisse après validation de l'administrateur
                                </div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button type="button" className="btn-mghost" onClick={closeAnnonce}>Annuler</button>
                            <button
                                type="button"
                                className="btn-msubmit"
                                disabled={annonceProcessing || !annonceForm.titre.trim() || !annonceForm.contenu.trim()}
                                onClick={submitAnnonce}
                            >
                                {annonceProcessing ? (
                                    <><svg width="13" height="13" className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Envoi...</>
                                ) : <>📢 Soumettre l'annonce</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewActe && (
                <div
                    className="modal-overlay"
                    onClick={() => setPreviewActe(null)}
                >
                    <div
                        className="modal modal-pdf-preview"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">
                                    Aperçu du document
                                </div>
                                <div className="modal-sub">
                                    {prettyType(previewActe.type_acte)} —{" "}
                                    {previewActe.membre?.prenom}{" "}
                                    {previewActe.membre?.nom}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setPreviewActe(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="pdf-frame-wrap">
                                <iframe
                                    title="Aperçu certificat"
                                    className="pdf-frame"
                                    src={withBasePath(
                                        "",
                                        `/responsable-famille/liturgie/${previewActe.id}/certificat?preview=1`,
                                    )}
                                />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                type="button"
                                className="btn-mghost"
                                onClick={() => setPreviewActe(null)}
                            >
                                Fermer
                            </button>
                            <button
                                type="button"
                                className="btn-msubmit"
                                onClick={() =>
                                    window.open(
                                        withBasePath(
                                            "",
                                            `/responsable-famille/liturgie/${previewActe.id}/certificat`,
                                        ),
                                        "_blank",
                                    )
                                }
                            >
                                Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ceremonyActe && (
                <div className="modal-overlay" onClick={closeCeremonyModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">
                                    Choisir une date de mariage
                                </div>
                                <div className="modal-sub">
                                    {ceremonyActe.membre?.prenom}{" "}
                                    {ceremonyActe.membre?.nom}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeCeremonyModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="rf-info-grid">
                                <Field label="Date choisie" required>
                                    <input
                                        type="date"
                                        className="ann-input"
                                        value={ceremonyForm.date_souhaitee}
                                        onChange={(e) =>
                                            setCeremonyForm((prev) => ({
                                                ...prev,
                                                date_souhaitee: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                                <Field label="Créneau horaire" required>
                                    <select
                                        className="ann-input"
                                        value={ceremonyForm.ceremonie_creneau}
                                        onChange={(e) =>
                                            setCeremonyForm((prev) => ({
                                                ...prev,
                                                ceremonie_creneau:
                                                    e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            Sélectionner un créneau
                                        </option>
                                        <option value="matin">Matin</option>
                                        <option value="apres_midi">
                                            Après-midi
                                        </option>
                                    </select>
                                </Field>
                                <Field label="Lieu de la cérémonie" required>
                                    <input
                                        type="text"
                                        className="ann-input"
                                        placeholder="Temple, paroisse, commune..."
                                        value={ceremonyForm.lieu_ceremonie}
                                        onChange={(e) =>
                                            setCeremonyForm((prev) => ({
                                                ...prev,
                                                lieu_ceremonie: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Témoin femme" required>
                                    <input
                                        type="text"
                                        className="ann-input"
                                        placeholder="Nom du témoin femme"
                                        value={ceremonyForm.temoin_femme}
                                        onChange={(e) =>
                                            setCeremonyForm((prev) => ({
                                                ...prev,
                                                temoin_femme: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                                <Field label="Témoin homme" required>
                                    <input
                                        type="text"
                                        className="ann-input"
                                        placeholder="Nom du témoin homme"
                                        value={ceremonyForm.temoin_homme}
                                        onChange={(e) =>
                                            setCeremonyForm((prev) => ({
                                                ...prev,
                                                temoin_homme: e.target.value,
                                            }))
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                type="button"
                                className="btn-mghost"
                                onClick={closeCeremonyModal}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="btn-msubmit"
                                disabled={ceremonyProcessing}
                                onClick={submitCeremonyDetails}
                            >
                                {ceremonyProcessing
                                    ? "Enregistrement..."
                                    : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DÉTAIL ACTE ── */}
            {selectedActe && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedActe(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">
                                    Détail de la demande
                                </div>
                                <div className="modal-sub">
                                    {prettyType(selectedActe.type_acte)}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setSelectedActe(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-tabs">
                                <button
                                    type="button"
                                    className={`detail-tab ${detailTab === "infos" ? "active" : ""}`}
                                    onClick={() => setDetailTab("infos")}
                                >
                                    Informations
                                </button>
                                {isMarriage && (
                                    <button
                                        type="button"
                                        className={`detail-tab ${detailTab === "celebration" ? "active" : ""}`}
                                        onClick={() =>
                                            setDetailTab("celebration")
                                        }
                                    >
                                        Célébration
                                    </button>
                                )}
                            </div>
                            {detailTab === "infos" && (
                                <>
                                    <div className="rf-info-grid">
                                        <InfoRow
                                            label="Référence"
                                            value={
                                                selectedActe.reference ||
                                                `ACTE-${selectedActe.id}`
                                            }
                                        />
                                        <InfoRow
                                            label="Statut"
                                            value={statusLabel(
                                                selectedActe.statut,
                                            )}
                                        />
                                        <InfoRow
                                            label="Date souhaitée"
                                            value={formatDate(
                                                selectedActe.date_souhaitee,
                                            )}
                                        />
                                        <InfoRow
                                            label="Membre concerné"
                                            value={
                                                `${selectedActe.membre?.prenom || ""} ${selectedActe.membre?.nom || ""}`.trim() ||
                                                "—"
                                            }
                                        />
                                        <InfoRow
                                            label="Demandé par"
                                            value={getRequesterName(
                                                selectedActe,
                                            )}
                                        />
                                        <InfoRow
                                            label="Créée le"
                                            value={formatDate(
                                                selectedActe.created_at,
                                            )}
                                        />
                                    </div>
                                    <div className="rf-details-title">
                                        Informations renseignées
                                    </div>
                                    {detailRows.length === 0 && (
                                        <div className="rf-empty-details">
                                            Aucun détail enregistré.
                                        </div>
                                    )}
                                    {detailRows.map((r) => (
                                        <InfoRow
                                            key={r.key}
                                            label={r.label}
                                            value={r.value}
                                        />
                                    ))}
                                </>
                            )}
                            {isMarriage && detailTab === "celebration" && (
                                <div className="celebration-tab">
                                    <div className="celebration-summary">
                                        <div>
                                            <strong>Date proposée</strong>
                                            <div className="celebration-value">
                                                {formatDate(
                                                    selectedActe.date_souhaitee,
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <strong>Créneau</strong>
                                            <div className="celebration-value">
                                                {selectedActe.details
                                                    ?.ceremonie_creneau || "—"}
                                            </div>
                                        </div>
                                        <div>
                                            <strong>Statut</strong>
                                            <div className="celebration-value">
                                                {ceremonyDecisionLabel(
                                                    selectedActe.details
                                                        ?.ceremonie_statut,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rf-details-title">
                                        Détails de la cérémonie
                                    </div>
                                    {celebrationRows.length === 0 && (
                                        <div className="rf-empty-details">
                                            Aucune information de célébration.
                                        </div>
                                    )}
                                    {celebrationRows.map((r) => (
                                        <InfoRow
                                            key={r.key}
                                            label={r.label}
                                            value={r.value}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DÉTAIL ANNONCE ── */}
            {selectedAnnonce && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedAnnonce(null)}
                >
                    <div
                        className="modal ann-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div>
                                <div
                                    className="modal-title"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ fontSize: 22 }}>
                                        {ANNONCE_TYPES.find(
                                            (t) =>
                                                t.value ===
                                                (selectedAnnonce.type_annonce ||
                                                    selectedAnnonce.type_acte),
                                        )?.emoji || "📢"}
                                    </span>
                                    Détail de l'annonce
                                </div>
                                <div className="modal-sub">
                                    {
                                        ANNONCE_TYPES.find(
                                            (t) =>
                                                t.value ===
                                                (selectedAnnonce.type_annonce ||
                                                    selectedAnnonce.type_acte),
                                        )?.label
                                    }
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setSelectedAnnonce(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Preview infos */}
                            <div className="ann-detail-preview">
                                {selectedAnnonce.membre && (
                                    <InfoRow
                                        label="Concerné(e)"
                                        value={`${selectedAnnonce.membre.prenom} ${selectedAnnonce.membre.nom}`}
                                    />
                                )}
                                <InfoRow
                                    label="Statut"
                                    value={annStatutLabel(
                                        selectedAnnonce.statut,
                                    )}
                                />
                                <InfoRow
                                    label="Soumise le"
                                    value={formatDate(
                                        selectedAnnonce.created_at,
                                    )}
                                />
                                {selectedAnnonce.date_annonce && (
                                    <InfoRow
                                        label="Date événement"
                                        value={formatDate(
                                            selectedAnnonce.date_annonce,
                                        )}
                                    />
                                )}
                            </div>

                            {/* Progress bar */}
                            <div style={{ margin: "14px 0 6px" }}>
                                <div className="ann-detail-progress-label">
                                    Avancement
                                </div>
                            </div>
                            <AnnonceDotTrack
                                statut={selectedAnnonce.statut}
                                ann={selectedAnnonce}
                                expanded
                            />

                            {/* Message */}
                            <div style={{ margin: "16px 0 6px" }}>
                                <div className="rf-details-title">Message</div>
                            </div>
                            <div className="ann-detail-msg">
                                {selectedAnnonce.details?.contenu ||
                                    selectedAnnonce.details?.titre ||
                                    selectedAnnonce.message ||
                                    "(Sans message)"}
                            </div>

                            {/* Motif refus si applicable */}
                            {String(selectedAnnonce.statut).startsWith(
                                "REFUSEE",
                            ) &&
                                (selectedAnnonce.note_conducteur ||
                                    selectedAnnonce.motif_refus) && (
                                    <div className="ann-detail-refus">
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Motif :{" "}
                                        {selectedAnnonce.note_conducteur ||
                                            selectedAnnonce.motif_refus}
                                    </div>
                                )}

                            {/* PDF si validée */}
                            {VALID.includes(selectedAnnonce.statut) && (
                                <button
                                    type="button"
                                    className="btn-pdf"
                                    style={{
                                        marginTop: 16,
                                        width: "100%",
                                        justifyContent: "center",
                                    }}
                                    onClick={() =>
                                        window.open(
                                            withBasePath("", `/responsable-famille/annonces/${selectedAnnonce.id}/fiche`),
                                            "_blank",
                                        )
                                    }
                                >
                                    <Eye size={13} /> Voir la fiche PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CONTACT CONDUCTEUR ── */}
            {contactConducteurs && (
                <div className="modal-overlay" onClick={() => setContact(null)}>
                    <div
                        className="modal rf-contact-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">
                                    Contacter le(s) conducteur(s)
                                </div>
                                <div className="modal-sub">
                                    Classe concernée
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setContact(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            {contactConducteurs.map((c) => (
                                <div key={c.id} className="contact-row">
                                    <div>
                                        <div className="contact-name">
                                            {c.prenom} {c.nom}
                                        </div>
                                        <div className="contact-sub">
                                            {c.telephone ||
                                                "Tél. non renseigné"}{" "}
                                            · {c.email || "Email non renseigné"}
                                        </div>
                                    </div>
                                    <div className="contact-actions">
                                        {c.telephone && (
                                            <button
                                                type="button"
                                                className="btn-contact-mini"
                                                onClick={() =>
                                                    contactConducteur(c)
                                                }
                                            >
                                                Appeler
                                            </button>
                                        )}
                                        {c.email && (
                                            <button
                                                type="button"
                                                className="btn-contact-mini"
                                                onClick={() =>
                                                    contactConducteur({
                                                        email: c.email,
                                                    })
                                                }
                                            >
                                                Email
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOAST ── */}
            {toast && (
                <div
                    className={`rf-toast ${toast.type === "error" ? "rf-toast-err" : ""}`}
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
}

/* ════════ SUB-COMPONENTS ════════ */

function fmtDT(val) {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function AnnonceDotTrack({ statut, expanded, ann }) {
    const steps = [
        { key: "SOUMISE",               label: "Soumise",    icon: "📝" },
        { key: "EN_ATTENTE_CONDUCTEUR",  label: "Conducteur", icon: "📋" },
        { key: "TRANSMISE_AU_PASTEUR",   label: "Pasteur",    icon: "✝" },
        { key: "PUBLIEE",               label: "Acte validé", icon: "🌍" },
    ];

    const isRefuse = String(statut).startsWith("REFUSEE");
    const effectiveStatus = (statut === "VALIDEE" || statut === "ARCHIVEE") ? "PUBLIEE" : statut;
    const idx = steps.findIndex((s) => s.key === effectiveStatus);
    const activeIdx = isRefuse
        ? statut === "REFUSEE_PAR_CONDUCTEUR" ? 1 : 2
        : idx === -1 ? 0 : idx;

    // Build timestamp info from historiques
    const hists = Array.isArray(ann?.historiques) ? ann.historiques : [];
    const findHist = (statuts) => hists
        .filter(h => statuts.includes(h.statut_nouveau))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    const histConducteur = findHist(["EN_ATTENTE_CONDUCTEUR", "TRANSMISE_AU_PASTEUR"]);
    const histPasteur    = findHist(["VALIDEE", "PUBLIEE"]);
    const histPublie     = findHist(["PUBLIEE", "VALIDEE"]);

    // Fallback conducteur name/date for records created before historique tracking was added
    const conducteurFallbackDate = !histConducteur && ["TRANSMISE_AU_PASTEUR"].includes(statut)
        ? fmtDT(ann?.updated_at) : null;
    const conducteurName = histConducteur?.acteur
        ? `${histConducteur.acteur.prenom} ${histConducteur.acteur.nom}`
        : (ann?.conducteur ? `${ann.conducteur.prenom} ${ann.conducteur.nom}` : null);

    const stepMeta = [
        {
            date: fmtDT(ann?.created_at),
            who: null,
        },
        {
            date: fmtDT(histConducteur?.created_at) || conducteurFallbackDate,
            who: conducteurName,
        },
        {
            date: fmtDT(histPasteur?.created_at),
            who: histPasteur?.acteur ? `${histPasteur.acteur.prenom} ${histPasteur.acteur.nom}` : null,
        },
        {
            date: fmtDT(histPublie?.created_at),
            who: null,
        },
    ];

    return (
        <div className={`ann-track ${expanded ? "ann-track-exp" : ""}`}>
            {steps.map((s, i) => {
                const isDone   = !isRefuse && i < activeIdx;
                const isActive = i === activeIdx;
                const isRef    = isRefuse && isActive;
                const meta     = stepMeta[i];
                const showMeta = (isDone || isActive) && (meta.date || meta.who);
                return (
                    <div key={s.key} className="ann-track-step">
                        {/* Dot + connecting line on same horizontal row */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <div className={`ann-track-dot ${isDone ? "done" : isRef ? "refuse" : isActive ? "active" : ""}`}>
                                {isDone ? "✓" : isRef ? "✕" : s.icon}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`ann-track-line ${isDone ? "done-line" : ""}`} />
                            )}
                        </div>
                        {/* Label + meta below dot */}
                        <div className={`ann-track-lbl ${isDone ? "done-lbl" : isRef ? "refuse-lbl" : isActive ? "active-lbl" : ""}`}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, marginTop: 4 }}>
                            <span style={{ fontWeight: isActive ? 700 : 500 }}>{s.label}</span>
                            {showMeta && meta.who && (
                                <span style={{ fontSize: 9.5, color: '#64748b', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.who}</span>
                            )}
                            {showMeta && meta.date && (
                                <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>{meta.date}</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ParoisseCard({ annonce }) {
    const t = ANNONCE_TYPES.find((x) => x.value === annonce.type_annonce);
    return (
        <div className={`pc-card pc-${t?.color}`}>
            <div className="pc-top">
                <span className="pc-emoji">{t?.emoji || "📢"}</span>
                <span className={`pc-badge pcb-${t?.color}`}>{t?.label}</span>
            </div>
            {annonce.nom_concerne && (
                <div className="pc-name">{annonce.nom_concerne}</div>
            )}
            <div className="pc-msg">{annonce.message}</div>
            <div className="pc-foot">
                {annonce.destinataire && (
                    <span className="pc-dest">→ {annonce.destinataire}</span>
                )}
                {annonce.date_annonce && (
                    <span className="pc-date">
                        {formatDate(annonce.date_annonce)}
                    </span>
                )}
                {annonce.classe?.nom && (
                    <span className="pc-classe">{annonce.classe.nom}</span>
                )}
            </div>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div className="ann-field">
            <label className="ann-label">
                {label}
                {required && <span className="ann-req"> *</span>}
            </label>
            {children}
        </div>
    );
}
function RecapRow({ label, value }) {
    return (
        <div className="ann-recap-row">
            <span className="arr-label">{label}</span>
            <span className="arr-value">{value}</span>
        </div>
    );
}
function InfoRow({ label, value }) {
    return (
        <div className="rf-info-row">
            <span className="rf-info-label">{label}</span>
            <span className="rf-info-value">{value || "—"}</span>
        </div>
    );
}
function StatusStep({ label, done, active, refused, date }) {
    const cls = refused
        ? "refused"
        : done
          ? "done"
          : active
            ? "active"
            : "wait";
    const icon = refused ? "✕" : done ? "✓" : ""; // Empty circle for active/wait
    return (
        <div className="st-step">
            <div className={`st-dot ${cls}`}>{icon}</div>
            <div className="st-content">
                <span className={`st-label ${cls}`}>{label}</span>
                {date ? (
                    <span className="st-date">{date}</span>
                ) : cls === "wait" ? (
                    <span className="st-date st-waiting">En attente</span>
                ) : null}
            </div>
        </div>
    );
}
function TimelineEvent({ icon, label, date, motif, tone }) {
    return (
        <div className={`tl-event tl-${tone}`}>
            <div className="tl-left">
                <div className={`tl-dot tl-dot-${tone}`}>{icon}</div>
                <div className="tl-vline" />
            </div>
            <div className="tl-body">
                <div className="tl-header">
                    <span className="tl-label">{label}</span>
                    {date && <span className="tl-date">{date}</span>}
                </div>
                {motif && (
                    <div className="tl-motif">
                        <svg
                            width="11"
                            height="11"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>{" "}
                        Motif : {motif}
                    </div>
                )}
            </div>
        </div>
    );
}
function Kpi({ tone, tag, value, label, clickable, onClick }) {
    return (
        <div
            className="kpi"
            style={clickable ? { cursor: "pointer" } : {}}
            onClick={clickable ? onClick : undefined}
        >
            <div className={`kpi-bar ${tone}`} />
            <div className="kpi-inner">
                <div className="kpi-top">
                    <span className={`kpi-tag ${tone}`}>{tag}</span>
                </div>
                <div className="kpi-n">{value}</div>
                <div className="kpi-l">{label}</div>
            </div>
        </div>
    );
}

/* ════════ HELPERS ════════ */
function getPlaceholder(type) {
    const p = {
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        generale: "Rédigez votre annonce à destination de l'assemblée…",
    };
    return p[type] || "Rédigez votre message…";
}
function annStatutLabel(s) {
    const m = {
        SOUMISE: "Soumise — en attente du conducteur",
        EN_ATTENTE_CONDUCTEUR: "En attente du conducteur",
        TRANSMISE_AU_PASTEUR: "Transmise au pasteur",
        VALIDEE: "Validée par le pasteur",
        PUBLIEE: "Publiée par le pasteur",
        CELEBRE: "Publiée",
        TERMINE: "Terminée",
        REFUSEE_PAR_CONDUCTEUR: "Refusée par le conducteur",
        REFUSEE_PAR_PASTEUR: "Refusée par le pasteur",
    };
    return m[s] || s;
}
function statusBadgeClass(s) {
    if (s === "EN_ATTENTE_CONDUCTEUR") return "b-cond";
    if (s === "TRANSMISE_AU_PASTEUR") return "b-pastor";
    if (VALID.includes(s)) return "b-valid";
    if (String(s).startsWith("REFUSEE")) return "b-refuse";
    return "b-cond";
}
function statusLabel(s) {
    const m = {
        SOUMISE: "SOUMISE",
        EN_ATTENTE_CONDUCTEUR: "CONDUCTEUR",
        TRANSMISE_AU_PASTEUR: "PASTEUR",
        VALIDEE: "VALIDÉE",
        CELEBRE: "CÉLÉBRÉ",
        TERMINE: "TERMINÉ",
        ARCHIVEE: "VALIDÉE",
        REFUSEE_PAR_CONDUCTEUR: "REFUSÉE",
        REFUSEE_PAR_PASTEUR: "REFUSÉE",
    };
    return m[s] || s;
}
function finalStepLabel(t) {
    return t === "mariage" || t === "bapteme"
        ? "Célébré"
        : t === "deces"
          ? "Terminé"
          : "Effectué";
}
function prettyType(t) {
    const m = {
        bapteme: "Baptême",
        premiere_communion: "Première Communion",
        confirmation: "Confirmation",
        mariage: "Mariage",
        naissance: "Naissance",
        deces: "Décès",
    };
    return m[t] || t || "Acte";
}
function isFicheType(type) {
    const t = String(type || "").toLowerCase();
    return t === "naissance" || t === "deces";
}
function typeTone(t) {
    const m = {
        bapteme: "sage",
        premiere_communion: "amber",
        confirmation: "sage",
        mariage: "terra",
        naissance: "amber",
        deces: "terra",
    };
    return m[t] || "terra";
}
function typeIcon(type) {
    const icons = {
        bapteme: (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z" />
            </svg>
        ),
        premiere_communion: (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M8 3h8l-2 7H10L8 3z" />
                <path d="M10 10a4 4 0 008 0" />
                <line x1="12" y1="14" x2="12" y2="20" />
                <line x1="8" y1="20" x2="16" y2="20" />
            </svg>
        ),
        mariage: (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="9" cy="13" r="5" />
                <circle cx="15" cy="13" r="5" />
            </svg>
        ),
        naissance: (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="9" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
        ),
        deces: (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <line x1="12" y1="3" x2="12" y2="21" />
                <line x1="6" y1="8" x2="18" y2="8" />
            </svg>
        ),
    };
    return (
        icons[type] || (
            <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        )
    );
}
function formatDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString("fr-FR");
}
function formatDateTime(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function isDone(cur, ms) {
    const o = [
        "SOUMISE",
        "EN_ATTENTE_CONDUCTEUR",
        "TRANSMISE_AU_PASTEUR",
        "VALIDEE",
        "CELEBRE",
        "TERMINE",
        "ARCHIVEE",
    ];
    return (
        o.indexOf(cur) >= o.indexOf(ms) &&
        o.indexOf(cur) !== -1 &&
        o.indexOf(ms) !== -1
    );
}
function initials(f, l) {
    return (
        `${String(f || "").charAt(0)}${String(l || "").charAt(0)}`.toUpperCase() ||
        "?"
    );
}
function guessFamilyName(m) {
    const n = m.find((x) => x?.nom)?.nom;
    return n ? `Famille ${n}` : "Famille";
}
function getRequesterName(a) {
    if (a?.createur?.prenom || a?.createur?.nom)
        return `${a.createur.prenom || ""} ${a.createur.nom || ""}`.trim();
    const d = a?.details || {};
    const f =
        `${d.declarant_prenom || d.demandeur_prenom || ""} ${d.declarant_nom || d.demandeur_nom || ""}`.trim();
    return f || "Responsable de la demande";
}
function getConducteursList(c, id) {
    if (!id) return [];
    const k = String(id);
    return c?.[k] || c?.[id] || [];
}
function contactConducteur(c) {
    const t = String(c.telephone || "").replace(/\D/g, "");
    if (t) {
        window.location.href = `tel:${t}`;
        return;
    }
    if (c.email) window.location.href = `mailto:${c.email}`;
}
function formatDetails(d) {
    if (!d || typeof d !== "object") return [];
    return Object.entries(d)
        .filter(([, v]) => v !== null && v !== "" && v !== false)
        .map(([k, v]) => ({
            key: k,
            label: DETAIL_LABELS[k] || prettifyKey(k),
            value: formatDetailValue(v),
        }));
}
function formatDetailValue(v) {
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "boolean") return v ? "Oui" : "Non";
    if (v === "1") return "Oui";
    if (v === "0") return "Non";
    if (typeof v === "string" && v.startsWith("CEREMONIE_")) {
        return ceremonyDecisionLabel(v);
    }
    if (
        typeof v === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)
    ) {
        return formatDateTime(v);
    }
    return String(v);
}
function prettifyKey(k) {
    return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function ceremonyDecisionLabel(v) {
    const labels = {
        CEREMONIE_SOUMISE_AU_CONDUCTEUR: "Date soumise au conducteur",
        CEREMONIE_TRANSMISE_AU_PASTEUR: "Date transmise au pasteur",
        CEREMONIE_VALIDEE_PAR_PASTEUR: "Date validée par le pasteur",
        CEREMONIE_REFUSEE_PAR_CONDUCTEUR: "Date refusée par le conducteur",
        CEREMONIE_REFUSEE_PAR_PASTEUR: "Date refusée par le pasteur",
    };

    return labels[v] || v;
}
const DETAIL_LABELS = {
    declarant_nom: "Nom du déclarant",
    declarant_prenom: "Prénom du déclarant",
    declarant_tel: "Téléphone du déclarant",
    declarant_lien: "Lien du déclarant",
    demandeur_nom: "Nom du demandeur",
    demandeur_prenom: "Prénom du demandeur",
    demandeur_tel: "Téléphone du demandeur",
    demandeur_lien: "Lien du demandeur",
    personne: "Personne concernée",
    date: "Date de l'acte",
    lieu: "Lieu",
    lieu_ceremonie: "Lieu de la cérémonie",
    temoin_homme: "Témoin homme",
    temoin_femme: "Témoin femme",
    temoins: "Témoins",
    ceremonie_statut: "Validation de la cérémonie",
    ceremonie_soumise_at: "Date de soumission de la cérémonie",
    ceremonie_transmise_pasteur_at: "Transmission au pasteur",
    ceremonie_validee_pasteur_at: "Validation du pasteur",
    ceremonie_commentaire_conducteur: "Commentaire du conducteur",
    ceremonie_commentaire_pasteur: "Commentaire du pasteur",
    celebrant: "Célébrant",
    parents: "Parents",
    conjoint_1: "Conjoint 1",
    conjoint_2: "Conjoint 2",
    type_mariage: "Type de mariage",
    nom_defunt: "Nom du défunt",
    date_deces: "Date du décès",
    lien_familial: "Lien familial",
    nom_enfant: "Nom de l'enfant",
    date_naissance: "Date de naissance",
    lieu_naissance: "Lieu de naissance",
    confirmand: "Confirmand",
    niveau_catechese: "Niveau de catéchèse",
    observations: "Observations",
};

const CELEBRATION_FIELDS = [
    "lieu_ceremonie",
    "temoin_femme",
    "temoin_homme",
    "ceremonie_creneau",
    "ceremonie_statut",
    "ceremonie_soumise_at",
    "ceremonie_transmise_pasteur_at",
    "ceremonie_validee_pasteur_at",
    "ceremonie_commentaire_conducteur",
    "ceremonie_commentaire_pasteur",
];

/* ════════ STYLES ════════ */
const styles = `
*{box-sizing:border-box}
.rf-page{min-height:100vh;background:linear-gradient(135deg,#6B46C1 0%,#1E40AF 52%,#B6C01A 100%);color:#1E1B16}
.rf-page::before{content:"";position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.14) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
.rf-wrap{position:relative;z-index:1;margin:0 auto;padding:26px}

/* ── actions ── */
.rf-actions{display:flex;justify-content:space-between;gap:10px;margin-bottom:18px;align-items:center}
.btn-ghost,.btn-terra{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:9px;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;border:none}
.btn-ghost{background:rgba(255,255,255,.9);color:#334155;border:1px solid rgba(255,255,255,.7)}
.btn-terra{background:#C06040;color:#fff}
.btn-annonce-top{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:700;background:rgba(255,255,255,.95);color:#5B3FAF;border:1.5px solid rgba(91,63,175,.3);cursor:pointer;box-shadow:0 4px 14px rgba(91,63,175,.15);transition:all .2s}
.btn-annonce-top:hover{background:#fff;transform:translateY(-1px)}

/* ── welcome ── */
.welcome{display:flex;align-items:center;gap:20px;background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.72);border-radius:14px;padding:22px 26px;margin-bottom:26px;box-shadow:0 12px 30px rgba(15,23,42,.18);backdrop-filter:blur(8px)}
.welcome-text{flex:1}.welcome-title{font-size:22px;font-weight:700}.welcome-title span{color:#C06040}
.welcome-sub{font-size:13px;color:#9C9484;margin-top:4px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;transition:all .2s}
.chip-terra{background:rgba(192,96,64,.08);color:#C06040;border:1px solid rgba(192,96,64,.2)}
.chip-sage{background:rgba(74,124,94,.08);color:#4A7C5E;border:1px solid rgba(74,124,94,.2)}
.chip-amber{background:rgba(184,122,32,.08);color:#B87A20;border:1px solid rgba(184,122,32,.22)}
.chip-violet{background:rgba(91,63,175,.08);color:#5B3FAF;border:1px solid rgba(91,63,175,.2)}
.chip-violet:hover{background:rgba(91,63,175,.15)}

/* ── kpi ── */
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.kpi{background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.7);border-radius:12px;padding:18px;position:relative;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,.16);backdrop-filter:blur(8px);transition:transform .2s,box-shadow .2s}
.kpi:hover{transform:translateY(-2px)}
.kpi-bar{position:absolute;left:0;top:0;bottom:0;width:4px}
.kpi-bar.terra{background:#C06040}.kpi-bar.amber{background:#B87A20}.kpi-bar.sage{background:#4A7C5E}.kpi-bar.sky{background:#3A7CA8}.kpi-bar.violet{background:#5B3FAF}
.kpi-inner{padding-left:12px}.kpi-top{display:flex;justify-content:flex-end;margin-bottom:8px}
.kpi-tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px}
.kpi-tag.terra{background:rgba(192,96,64,.08);color:#C06040}.kpi-tag.amber{background:rgba(184,122,32,.08);color:#B87A20}.kpi-tag.sage{background:rgba(74,124,94,.08);color:#4A7C5E}.kpi-tag.sky{background:rgba(58,124,168,.08);color:#3A7CA8}.kpi-tag.violet{background:rgba(91,63,175,.08);color:#5B3FAF}
.kpi-n{font-size:36px;font-weight:800;line-height:1}.kpi-l{font-size:12px;color:#9C9484;margin-top:4px}

/* ── tabs ── */
.tabs-tools{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:20px}
.main-tabs{display:flex;gap:3px;background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.7);border-radius:11px;padding:4px;width:fit-content;backdrop-filter:blur(10px)}
.mtab{display:inline-flex;align-items:center;gap:7px;padding:9px 22px;border-radius:8px;font-size:13px;font-weight:600;color:#5C5748;background:none;border:none;cursor:pointer;transition:all .2s;white-space:nowrap}
.mtab:hover{background:rgba(255,255,255,.6);color:#1E1B16}.mtab.active{background:#fff;color:#1E1B16;box-shadow:0 1px 6px rgba(0,0,0,.1)}
.mtab-ann.active{color:#5B3FAF}
.tbadge{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:800}
.tbadge-terra{background:rgba(192,96,64,.12);color:#C06040}.tbadge-violet{background:rgba(91,63,175,.1);color:#5B3FAF}.tbadge-sage{background:rgba(74,124,94,.1);color:#4A7C5E}
.quick-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.quick-dropdown{min-width:300px;height:35px;background:#ECEFF4;border:2px solid #D9DEE8;border-radius:10px;padding:0 48px 0 46px;font-size:16px;font-weight:800;color:#111827;cursor:pointer;transition:all .2s;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23586A84' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat,no-repeat;background-position:left 16px center,right 16px center;background-size:18px 18px,18px 18px}
.quick-dropdown:hover{border-color:#8FA0BC;background-color:#F1F4F9}
.quick-dropdown:focus{outline:none;border-color:#5B3FAF;box-shadow:0 0 0 4px rgba(91,63,175,.14)}
.quick-search{min-width:220px;background:#fff;border:1px solid #E8E4DC;border-radius:8px;padding:9px 12px;font-size:13px;color:#1E1B16}
.quick-search:focus{outline:none;border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.12)}

/* ── grids ── */
.grid-main{display:grid;grid-template-columns:1fr 308px;gap:20px}

/* ── panels ── */
.panel{background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.74);border-radius:14px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,.16);margin-bottom:18px;backdrop-filter:blur(8px)}
.panel-head{padding:17px 22px;border-bottom:1px solid #E8E4DC;display:flex;justify-content:space-between;align-items:center}
.ph-title{font-size:16px;font-weight:700;display:flex;align-items:center}.ph-sub{font-size:11px;color:#9C9484}
.ph-link{font-size:12px;font-weight:700;color:#F3F0EFE3;text-decoration:none;background:rgba(197, 130, 6, 0.86);border:1px solid rgba(91,63,175,.18);border-radius:7px;padding:6px 12px;cursor:pointer}
.empty{padding:22px;color:#9C9484;font-size:13px}

/* ── demandes ── */
.demande{padding:18px 22px;border-bottom:1px solid #E8E4DC}.demande:last-child{border-bottom:none}
.d-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:12px}
.d-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.d-icon.terra{background:rgba(192,96,64,.08);border:1px solid rgba(192,96,64,.2);color:#C06040}.d-icon.sage{background:rgba(74,124,94,.08);border:1px solid rgba(74,124,94,.2);color:#4A7C5E}.d-icon.amber{background:rgba(184,122,32,.08);border:1px solid rgba(184,122,32,.22);color:#B87A20}
.d-content{flex:1;min-width:0}.d-name{font-size:14px;font-weight:700}.d-meta{font-size:11.5px;color:#9C9484;display:flex;gap:12px;flex-wrap:wrap;margin-top:4px}
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;letter-spacing:.04em}
.bdot{width:5px;height:5px;border-radius:50%;background:currentColor}
.b-cond{background:rgba(58,124,168,.08);color:#3A7CA8;border:1px solid rgba(58,124,168,.2)}.b-pastor{background:rgba(124,111,205,.08);color:#7C6FCD;border:1px solid rgba(124,111,205,.22)}.b-valid{background:rgba(74,124,94,.08);color:#4A7C5E;border:1px solid rgba(74,124,94,.2)}.b-refuse{background:rgba(192,96,64,.08);color:#C06040;border:1px solid rgba(192,96,64,.2)}
.st-track{display:flex;align-items:center;background:#F5F4F0;border:1px solid #E8E4DC;border-radius:8px;padding:15px 20px ;margin-top:10px }
.st-step{display:flex;align-items:flex-start;gap:6px;flex:1}.st-step:not(:last-child)::after{content:"→";color:#D6D1C7;font-size:11px;margin-left:5px;margin-top:2px}
.st-dot{width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;border:2px solid transparent;flex-shrink:0;margin-top:2px}
.st-dot.done{background:#4A7C5E;color:#fff}.st-dot.active{background:#fff;color:#B87A20;border-color:#B87A20}.st-dot.wait{background:#fff;color:#9C9484;border-color:#D6D1C7}.st-dot.refused{background:#C06040;color:#fff}
.st-content{display:flex;flex-direction:column;gap:2px}
.st-label{font-size:10px;font-weight:700;color:#9C9484}.st-label.done{color:#4A7C5E}.st-label.active{color:#B87A20}.st-label.refused{color:#C06040}
.st-date{font-size:9px;color:#7E7A70;font-weight:600}
.st-date.st-waiting{color:#9C9484;font-style:italic}

/* ── timeline ── */
.acte-timeline{margin-top:10px;padding:0 2px}
.tl-event{display:flex;gap:10px;align-items:flex-start;min-height:36px}.tl-event:last-child .tl-vline{display:none}
.tl-left{display:flex;flex-direction:column;align-items:center;width:24px;flex-shrink:0}
.tl-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:2px solid transparent}
.tl-dot-neutral{background:#F5F4F0;border-color:#D6D1C7;color:#9C9484}.tl-dot-sage{background:rgba(74,124,94,.1);border-color:#4A7C5E;color:#4A7C5E}.tl-dot-violet{background:rgba(91,63,175,.1);border-color:#5B3FAF;color:#5B3FAF}.tl-dot-amber{background:rgba(184,122,32,.1);border-color:#B87A20;color:#B87A20}.tl-dot-refuse{background:rgba(192,96,64,.1);border-color:#C06040;color:#C06040}
.tl-vline{flex:1;width:2px;background:#E8E4DC;margin-top:3px;min-height:14px;border-radius:2px}
.tl-body{flex:1;padding-bottom:10px}.tl-header{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tl-label{font-size:12px;font-weight:700;color:#1E1B16;line-height:1.4}.tl-date{font-size:10.5px;color:#9C9484;font-weight:600;white-space:nowrap}
.tl-motif{display:flex;align-items:flex-start;gap:6px;margin-top:6px;padding:8px 10px;background:rgba(192,96,64,.06);border:1px solid rgba(192,96,64,.18);border-left:3px solid #C06040;border-radius:6px;font-size:11.5px;color:#C06040;font-weight:600;line-height:1.5}
.d-actions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
.btn-see,.btn-pdf{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer}
.btn-see{background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748}.btn-pdf{background:#C06040;border:none;color:#fff}.btn-pdf-sm{padding:5px 10px;font-size:11px}
.btn-pdf:disabled,.btn-disabled{opacity:.55;cursor:not-allowed;filter:grayscale(.15)}
.pager{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 22px;border-top:1px solid #E8E4DC;background:#FBFAF8}
.pager-btn{border:1px solid #D6D1C7;background:#F5F4F0;color:#5C5748;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer}.pager-btn:disabled{opacity:.5;cursor:not-allowed}
.pager-info{font-size:11.5px;color:#9C9484;font-weight:700}

/* ── membres ── */
.mbr{display:flex;align-items:center;gap:12px;padding:12px 22px;border-bottom:1px solid #E8E4DC}.mbr:last-child{border-bottom:none}
.mbr-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;background:#C06040}
.mbr-name{font-size:13px;font-weight:700}.mbr-role{font-size:10.5px;color:#9C9484;margin-top:2px}
.mbr-count{font-size:11px;font-weight:700;color:#B87A20;background:rgba(184,122,32,.08);border:1px solid rgba(184,122,32,.22);padding:3px 9px;border-radius:10px;margin-left:auto}
.mbr-count.none{color:#9C9484;background:#F5F4F0;border-color:#E8E4DC}
.right-col{display:flex;flex-direction:column;gap:16px}

/* ── CTA cards (inchangés) ── */
.cta-annonce-card{background:linear-gradient(145deg,#2D1B69 0%,#1A2E6B 55%,#1E3A1A 100%);border-radius:14px;padding:24px 22px;color:#fff}
.cta-ann-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}.cta-ann-icon{font-size:28px}.cta-ann-lbl{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#A090D8}
.cta-ann-title{font-size:18px;font-weight:800;line-height:1.25;margin-bottom:8px}.cta-ann-sub{font-size:12px;color:rgba(255,255,255,.55);line-height:1.65;margin-bottom:14px}
.cta-ann-types{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.cann-pill{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:6px;font-size:10.5px;font-weight:600}
.cann-violet{background:rgba(157,143,224,.12);border:1px solid rgba(157,143,224,.2);color:#C0B0F0}.cann-amber{background:rgba(184,122,32,.12);border:1px solid rgba(184,122,32,.2);color:#E8C070}.cann-slate{background:rgba(180,180,180,.1);border:1px solid rgba(180,180,180,.18);color:#C0C0C0}.cann-terra{background:rgba(192,96,64,.12);border:1px solid rgba(192,96,64,.2);color:#E09070}.cann-sage{background:rgba(74,124,94,.12);border:1px solid rgba(74,124,94,.2);color:#80C090}
.btn-cta-ann{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.btn-cta-ann:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
.btn-cta-ann-sm{width:auto;padding:10px 18px}
.cta-ann-note{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:10.5px;color:rgba(255,255,255,.35)}
.cta-card{background:linear-gradient(135deg,#1E1B16 0%,#2E2820 100%);border-radius:14px;padding:22px;color:#fff}
.cta-lbl{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#B87A20;margin-bottom:8px}.cta-title{font-size:16px;font-weight:700;margin-bottom:8px}.cta-sub{font-size:12px;color:rgba(255,255,255,.55);line-height:1.6;margin-bottom:14px}
.cta-types{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.cta-type{padding:4px 9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:6px;font-size:11px;color:rgba(255,255,255,.65)}
.btn-cta{display:flex;align-items:center;justify-content:center;width:100%;padding:11px;background:#C06040;color:#fff;border-radius:9px;text-decoration:none;font-size:12.5px;font-weight:700}
.guide-card{background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.74);border-radius:14px;padding:18px 22px;box-shadow:0 12px 28px rgba(15,23,42,.16);backdrop-filter:blur(8px)}
.guide-title{font-size:14px;font-weight:700;margin-bottom:14px}
.g-step{display:flex;gap:11px;align-items:flex-start;margin-bottom:12px}.g-step:last-child{margin-bottom:0}
.g-num{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;margin-top:1px}
.g-n1{background:rgba(184,122,32,.08);color:#B87A20;border:1px solid rgba(184,122,32,.22)}.g-n2{background:rgba(58,124,168,.08);color:#3A7CA8;border:1px solid rgba(58,124,168,.2)}.g-n3{background:rgba(124,111,205,.08);color:#7C6FCD;border:1px solid rgba(124,111,205,.22)}.g-n4{background:rgba(74,124,94,.08);color:#4A7C5E;border:1px solid rgba(74,124,94,.2)}
.g-step-title{font-size:12px;font-weight:700}.g-step-sub{font-size:11px;color:#9C9484;line-height:1.5}

/* ════════════════════════════════════
   ★ ONGLET ANNONCES
════════════════════════════════════ */
.ann-tab-root{display:flex;flex-direction:column;gap:16px}

/* HÉRO */
.ann-hero{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;background:linear-gradient(135deg,rgba(91,63,175,.18) 0%,rgba(30,64,175,.16) 60%,rgba(74,124,94,.1) 100%);border:1px solid rgba(91,63,175,.25);border-radius:14px;padding:20px 26px;backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(91,63,175,.12)}
.ann-hero-left{display:flex;align-items:center;gap:16px}
.ann-hero-pulse{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,rgba(91,63,175,.28),rgba(30,64,175,.28));border:1px solid rgba(91,63,175,.35);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;animation:heroPulse 3s ease-in-out infinite}
@keyframes heroPulse{0%,100%{box-shadow:0 0 0 0 rgba(91,63,175,.25)}50%{box-shadow:0 0 0 10px rgba(91,63,175,0)}}
.ann-hero-title{font-size:19px;font-weight:800;color:white;text-shadow:0 1px 4px rgba(0,0,0,.2)}.ann-hero-sub{font-size:11.5px;color:rgba(255,255,255,.6);margin-top:4px;line-height:1.5}
.ann-hero-right{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.ann-hero-stats{display:flex;gap:10px}
.ann-mini-stat{text-align:center;padding:10px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.2);min-width:64px;backdrop-filter:blur(8px)}
.ann-mini-n{font-size:20px;font-weight:800;line-height:1}.ann-mini-l{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-top:3px;opacity:.75}
.ann-mini-orange{background:rgba(234,88,12,.12);color:#e8a060;border-color:rgba(234,88,12,.18)}.ann-mini-sage{background:rgba(74,124,94,.12);color:#70B888;border-color:rgba(74,124,94,.18)}.ann-mini-terra{background:rgba(192,96,64,.12);color:#D89080;border-color:rgba(192,96,64,.18)}.ann-mini-sky{background:rgba(58,124,168,.12);color:#80B0D8;border-color:rgba(58,124,168,.18)}

/* SOUS-TABS */
.ann-subtabs-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.7);border-radius:12px;padding:8px 14px;backdrop-filter:blur(10px)}
.ann-subtabs{display:inline-flex;gap:3px;padding:2px;background:rgba(30,27,22,.06);border-radius:9px}
.ann-stab{padding:8px 18px;border-radius:7px;font-size:12.5px;font-weight:700;color:#5C5748;background:none;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:7px}
.ann-stab:hover{background:rgba(255,255,255,.6);color:#1E1B16}.ann-stab.active{background:#fff;color:#5B3FAF;box-shadow:0 1px 6px rgba(91,63,175,.12)}
.ann-stab-badge{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:800;background:rgba(91,63,175,.12);color:#5B3FAF}
.ann-stab-badge-sage{background:rgba(74,124,94,.1);color:#4A7C5E}
.ann-filters{display:flex;gap:4px;flex-wrap:wrap}
.ann-filter-btn{padding:6px 13px;border-radius:7px;font-size:11.5px;font-weight:700;color:#5C5748;background:transparent;border:1px solid transparent;cursor:pointer;transition:all .15s}
.ann-filter-btn:hover{background:rgba(255,255,255,.6);color:#1E1B16}.ann-filter-btn.active{background:rgba(91,63,175,.08);color:#5B3FAF;border-color:rgba(91,63,175,.22)}

/* GRILLE annonces */
.ann-grid-layout{display:grid;grid-template-columns:1fr 280px;gap:20px}

/* ITEMS ANNONCES */
.ann-item-rf{display:flex;align-items:flex-start;gap:14px;padding:16px 22px;border-bottom:1px solid #E8E4DC;cursor:pointer;transition:background .15s;position:relative}
.ann-item-rf:hover{background:#FAFAF7}.ann-item-rf:last-child{border-bottom:none}
.ann-item-refuse{border-left:3px solid #C06040;background:rgba(192,96,64,.02)}
.ann-item-valid{border-left:3px solid #4A7C5E}
.ann-item-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.ann-item-body{flex:1;min-width:0}
.ann-item-header{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
.ann-item-name{font-size:13.5px;font-weight:800;color:#1E1B16}.ann-item-who{font-size:13px;color:#5C5748}
.ann-item-msg{font-size:12px;color:#9C9484;line-height:1.55;margin-bottom:7px}
.ann-item-meta{display:flex;gap:10px;font-size:11px;color:#9C9484;margin-bottom:8px}
.ann-item-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;min-width:90px}
.ann-badge{font-size:9.5px;font-weight:800;letter-spacing:.07em;padding:4px 10px;border-radius:20px}
.ann-badge-orange{background:rgba(234,88,12,.08);color:#C06040;border:1px solid rgba(234,88,12,.2)}
.ann-badge-sage{background:rgba(74,124,94,.08);color:#4A7C5E;border:1px solid rgba(74,124,94,.2)}
.ann-badge-terra{background:rgba(192,96,64,.08);color:#C06040;border:1px solid rgba(192,96,64,.2)}

/* PROGRESS TRACKER */
.ann-track{display:flex;align-items:flex-start;gap:0}
.ann-track-exp{gap:0}
.ann-track-step{display:flex;flex-direction:column;align-items:center;flex:1}
.ann-track-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #D6D1C7;background:#F5F4F0;color:#9C9484;flex-shrink:0;transition:all .3s}
.ann-track-dot.done{background:#4A7C5E;border-color:#4A7C5E;color:#fff}.ann-track-dot.active{background:rgba(184,122,32,.08);border-color:#B87A20;color:#B87A20;animation:activePulse 2s infinite}.ann-track-dot.refuse{background:#C06040;border-color:#C06040;color:#fff}
@keyframes activePulse{0%,100%{box-shadow:0 0 0 0 rgba(184,122,32,.3)}50%{box-shadow:0 0 0 5px rgba(184,122,32,0)}}
.ann-track-line{width:100%;height:2px;background:#E8E4DC;transition:background .3s;margin:11px 0 0}.ann-track-line.done-line{background:#4A7C5E;opacity:.4}
.ann-track-lbl{font-size:9.5px;font-weight:700;text-align:center;margin-top:5px;color:#9C9484;white-space:nowrap}
.ann-track-lbl.done-lbl{color:#4A7C5E}.ann-track-lbl.active-lbl{color:#B87A20}.ann-track-lbl.refuse-lbl{color:#C06040}
.ann-track-exp .ann-track-step{flex-direction:column;gap:4px;flex:1}
.ann-track-exp .ann-track-line{width:100%;height:2px;align-self:flex-start;margin-top:11px}

/* CIRCUIT SIDEBAR */
.ann-circuit-steps{padding:16px 18px;display:flex;flex-direction:column}
.ann-cs-step{display:flex;align-items:flex-start;gap:10px;position:relative;padding-bottom:14px}.ann-cs-step:last-child{padding-bottom:0}
.ann-cs-dot{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid transparent;position:relative;z-index:1}
.ann-cs-dot.done{background:#4A7C5E;color:#fff;border-color:#4A7C5E}.ann-cs-dot.active{background:rgba(91,63,175,.1);color:#5B3FAF;border:2px solid #5B3FAF;animation:pulse 2s infinite}.ann-cs-dot.pending{background:rgba(100,116,139,.08);color:#9C9484;border:2px dashed rgba(100,116,139,.3);font-size:8px}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(91,63,175,.3)}50%{box-shadow:0 0 0 5px rgba(91,63,175,0)}}
.ann-cs-line{position:absolute;left:10px;top:24px;width:2px;height:calc(100% - 10px);background:#E8E4DC;z-index:0}.ann-cs-line.done{background:#4A7C5E;opacity:.35}
.ann-cs-text{padding-top:1px}.ann-cs-text strong{display:block;font-size:12px;font-weight:700;color:#1E1B16}.ann-cs-text span{font-size:10.5px;color:#9C9484}

/* STAT ROW */
.ann-stat-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(30,27,22,.05)}.ann-stat-row:last-child{border-bottom:none}

/* SIDE CTA */
.ann-side-cta{display:flex;align-items:center;gap:12px;background:linear-gradient(90deg,rgba(91,63,175,.08),rgba(30,64,175,.06));border:1px solid rgba(91,63,175,.15);border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s}
.ann-side-cta:hover{background:linear-gradient(90deg,rgba(91,63,175,.14),rgba(30,64,175,.1));transform:translateY(-1px)}
.ann-side-cta-icon{font-size:24px;flex-shrink:0}
.ann-side-cta-title{font-size:13px;font-weight:800;color:#1E1B16}.ann-side-cta-sub{font-size:11px;color:#9C9484;margin-top:2px}
.ann-side-cta-text{flex:1}

/* EMPTY STATE */
.ann-empty{display:flex;flex-direction:column;align-items:center;padding:48px 24px;text-align:center}
.ann-empty-icon{font-size:44px;margin-bottom:12px}.ann-empty-title{font-size:16px;font-weight:700;margin-bottom:6px}.ann-empty-sub{font-size:13px;color:#9C9484;line-height:1.6;max-width:340px}

/* TABLEAU PAROISSIAL */
.paroisse-wrap{width:100%}
.paroisse-banner{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.95);border-radius:14px;padding:20px 26px;margin-bottom:18px;box-shadow:0 8px 24px rgba(15,23,42,.15)}
.paroisse-title{font-size:20px;font-weight:800}.paroisse-sub{font-size:12.5px;color:#9C9484;margin-top:3px}
.paroisse-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.pc-card{background:rgba(255,255,255,.97);border-radius:14px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.13);border-top:3px solid transparent;transition:transform .2s,box-shadow .2s}
.pc-card:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(15,23,42,.18)}
.pc-violet{border-top-color:#9D8FE0}.pc-amber{border-top-color:#B87A20}.pc-slate{border-top-color:#909090}.pc-terra{border-top-color:#C06040}.pc-sage{border-top-color:#4A7C5E}
.pc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.pc-emoji{font-size:24px}
.pc-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}
.pcb-violet{background:rgba(157,143,224,.12);color:#7C6FCD;border:1px solid rgba(157,143,224,.25)}.pcb-amber{background:rgba(184,122,32,.1);color:#B87A20;border:1px solid rgba(184,122,32,.22)}.pcb-slate{background:rgba(90,90,90,.08);color:#606060;border:1px solid rgba(90,90,90,.18)}.pcb-terra{background:rgba(192,96,64,.08);color:#C06040;border:1px solid rgba(192,96,64,.2)}.pcb-sage{background:rgba(74,124,94,.08);color:#4A7C5E;border:1px solid rgba(74,124,94,.2)}
.pc-name{font-size:15px;font-weight:800;margin-bottom:8px}.pc-msg{font-size:13px;color:#5C5748;line-height:1.65;margin-bottom:12px}
.pc-foot{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:#9C9484}.pc-dest{font-weight:600}.pc-date{color:#B87A20}.pc-classe{color:#4A7C5E}

/* TYPE COLORS for icons */
.atype-violet{background:rgba(157,143,224,.1)}.atype-amber{background:rgba(184,122,32,.08)}.atype-slate{background:rgba(90,90,90,.07)}.atype-terra{background:rgba(192,96,64,.08)}.atype-sage{background:rgba(74,124,94,.08)}

/* ── MODAL ANNONCE ── */
.ann-modal{max-width:540px}
.ann-steps-bar{display:flex;padding:12px 24px;border-bottom:1px solid #E8E4DC;gap:0}
.asb-step{flex:1;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#9C9484;font-weight:600;position:relative}
.asb-step:not(:last-child)::after{content:"→";position:absolute;right:-4px;color:#D6D1C7}
.asb-step.active{color:#5B3FAF}.asb-step.done{color:#4A7C5E}
.asb-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:#F5F4F0;border:2px solid #D6D1C7;color:#9C9484;flex-shrink:0}
.asb-step.active .asb-dot{background:rgba(91,63,175,.1);border-color:#5B3FAF;color:#5B3FAF}.asb-step.done .asb-dot{background:#4A7C5E;border-color:#4A7C5E;color:#fff}
.ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ann-type-btn{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:2px solid #E8E4DC;background:#FAFAF7;cursor:pointer;transition:all .2s;text-align:left;position:relative}
.ann-type-btn:hover{border-color:#5B3FAF;background:rgba(91,63,175,.04)}.ann-type-btn.sel{border-color:#5B3FAF;background:rgba(91,63,175,.06);box-shadow:0 0 0 3px rgba(91,63,175,.1)}
.atb-emoji{font-size:24px;flex-shrink:0}.atb-label{font-size:12.5px;font-weight:700;color:#1E1B16;line-height:1.3;flex:1}
.atb-check{width:20px;height:20px;border-radius:50%;background:#5B3FAF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.ann-form{display:flex;flex-direction:column;gap:14px}
.ann-field{display:flex;flex-direction:column;gap:6px}.ann-switches{display:flex;gap:12px}.ann-switch{display:flex;align-items:center;gap:6px;font-size:12px;color:#1E1B16;font-weight:600;cursor:pointer;position:relative;padding:6px 12px;border-radius:8px;border:1px solid #D6D1C7;background:#F5F4F0}.ann-switch input{position:absolute;opacity:0;pointer-events:none}.ann-switch span{position:relative;z-index:1}.ann-switch input:checked + span{color:#5B3FAF}.ann-label{font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#5C5748}.ann-req{color:#C06040}
.ann-input{padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13.5px;color:#1E1B16;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
.ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-textarea{padding:10px 14px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:13px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-chars{font-size:10.5px;color:#9C9484;text-align:right}
.ann-visibility{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(74,124,94,.06);border:1px solid rgba(74,124,94,.18);border-radius:8px;font-size:12px;color:#4A7C5E;font-weight:600}
.ann-recap{display:flex;flex-direction:column;gap:12px}
.ann-recap-type{display:flex;align-items:center;gap:14px;padding:16px;border-radius:10px;background:#F5F4F0;border:1px solid #E8E4DC}
.art-label{font-size:16px;font-weight:800}.art-sub{font-size:11px;color:#9C9484;margin-top:2px}
.ann-recap-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #E8E4DC;font-size:12.5px;gap:10px}
.arr-label{color:#9C9484;font-weight:600}.arr-value{color:#1E1B16;font-weight:700;text-align:right}
.ann-recap-msg{background:#F5F4F0;border-radius:8px;padding:13px}
.arm-label{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:6px}
.arm-text{font-size:13px;color:#1E1B16;line-height:1.7}
.ann-circuit-info{display:flex;align-items:center;gap:7px;font-size:12px;color:#9C9484;background:rgba(91,63,175,.05);border:1px solid rgba(91,63,175,.15);border-radius:8px;padding:10px 14px}
.ann-circuit-info strong{color:#5B3FAF}

/* MODAL DÉTAIL ANNONCE */
.ann-detail-modal{max-width:520px}
.ann-detail-preview{background:rgba(91,63,175,.04);border:1px solid rgba(91,63,175,.12);border-radius:10px;padding:12px 16px;margin-bottom:4px}
.ann-detail-progress-label{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:8px}
.ann-detail-msg{background:#F5F4F0;border:1px solid #E8E4DC;border-left:3px solid #5B3FAF;border-radius:8px;padding:14px;font-size:13.5px;color:#1E1B16;line-height:1.7}
.ann-detail-refus{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 14px;background:rgba(192,96,64,.05);border:1px solid rgba(192,96,64,.18);border-left:3px solid #C06040;border-radius:8px;font-size:12.5px;color:#C06040;font-weight:600;line-height:1.5}

/* ── MODAL SHARED ── */
.detail-tabs{display:flex;gap:8px;margin-bottom:12px}
.detail-tab{padding:6px 12px;border-radius:10px;border:1px solid #e0dfe0;background:#f5f5f5;font-size:12px;font-weight:700;color:#5c5748;cursor:pointer;transition:all .2s}
.detail-tab.active{background:#5b3faf;color:#fff;border-color:transparent;box-shadow:0 4px 12px rgba(91,63,175,.2)}
.celebration-tab{display:flex;flex-direction:column;gap:10px}
.celebration-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;padding:12px 14px;border-radius:10px;background:#f5f4f0;border:1px solid #e8e4dc}
.celebration-summary strong{display:block;font-size:11px;color:#9c9484;margin-bottom:4px}
.celebration-value{font-size:14px;font-weight:700;color:#1e1b16}
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:120;backdrop-filter:blur(6px)}
.modal{width:100%;max-width:760px;max-height:90vh;overflow:auto;background:#fff;border:1px solid #E8E4DC;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.3);animation:mIn .28s cubic-bezier(.34,1.56,.64,1) both}
.modal-pdf-preview{max-width:1020px}
@keyframes mIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-head{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #E8E4DC}
.modal-title{font-size:18px;font-weight:800;color:#1E1B16}.modal-sub{font-size:12px;color:#9C9484;margin-top:3px}
.modal-close{width:30px;height:30px;border-radius:7px;border:1px solid #D6D1C7;background:#F5F4F0;color:#5C5748;cursor:pointer;font-size:18px;line-height:1}
.modal-body{padding:18px 22px}.modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid #E8E4DC;background:#FBFAF8}
.pdf-frame-wrap{border:1px solid #E8E4DC;border-radius:12px;overflow:hidden;background:#F8FAFC}
.pdf-frame{width:100%;height:min(70vh,760px);border:none;background:#fff}
.btn-mghost{padding:9px 18px;border-radius:8px;background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-mnext{padding:9px 22px;border-radius:8px;background:#5B3FAF;color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-mnext:disabled{opacity:.4;cursor:not-allowed}.btn-mnext:hover:not(:disabled){background:#4C34A0;transform:translateY(-1px)}
.btn-msubmit{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.btn-msubmit:disabled{opacity:.5;cursor:not-allowed}.btn-msubmit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
.rf-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rf-info-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #ECE8E2}
.rf-info-label{font-size:12px;color:#9C9484;font-weight:600}.rf-info-value{font-size:12.5px;color:#1E1B16;font-weight:700;text-align:right}
.rf-details-title{margin-top:14px;margin-bottom:6px;font-size:13px;font-weight:800;color:#5C5748}.rf-empty-details{font-size:12px;color:#9C9484;padding:10px 0}
.rf-contact-modal{max-width:520px}
.contact-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px dashed #ECE8E2}.contact-row:last-child{border-bottom:none}
.contact-name{font-size:13px;font-weight:800}.contact-sub{font-size:11.5px;color:#9C9484;margin-top:2px}
.contact-actions{display:flex;gap:8px}
.btn-contact-mini{background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748;border-radius:7px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}

/* ── TOAST ── */
.rf-toast{position:fixed;right:22px;bottom:22px;background:#fff;border:1px solid #E8E4DC;border-left:4px solid #4A7C5E;color:#1E1B16;padding:13px 18px;border-radius:11px;z-index:220;font-size:13px;font-weight:600;box-shadow:0 8px 28px rgba(15,23,42,.18);animation:tIn .3s cubic-bezier(.34,1.56,.64,1) both}
.rf-toast-err{border-left-color:#C06040}
@keyframes tIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.spin{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

@media(max-width:1100px){.kpi-row{grid-template-columns:repeat(2,1fr)}.grid-main,.ann-grid-layout{grid-template-columns:1fr}.paroisse-grid{grid-template-columns:1fr 1fr}}
@media(max-width:768px){.rf-wrap{padding:16px}.welcome{flex-direction:column;align-items:flex-start}.rf-actions{flex-wrap:wrap}.kpi-row{grid-template-columns:1fr 1fr}.tabs-tools{align-items:stretch}.main-tabs{width:100%;overflow-x:auto}.quick-tools{width:100%;justify-content:flex-start}.quick-dropdown{width:100%;min-width:0}.quick-search{width:100%;min-width:0}.ann-type-grid{grid-template-columns:1fr}.paroisse-grid{grid-template-columns:1fr}.ann-subtabs-bar{flex-direction:column;align-items:flex-start}.ann-hero{flex-direction:column;align-items:flex-start}.ann-hero-right{flex-direction:column;align-items:flex-start}}
@media(max-width:480px){.kpi-row{grid-template-columns:1fr}}
`;
