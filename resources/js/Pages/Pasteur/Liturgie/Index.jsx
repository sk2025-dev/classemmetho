import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, usePage, router } from "@inertiajs/react";
import MiniCalendar from "@/Components/MiniCalendar";
import { withBasePath } from "../../../Utils/urlHelper";

function Pagination({ paginator }) {
    if (!paginator || !paginator.links) return null;
    return (
        <nav className="pagination" style={{ marginTop: "12px" }}>
            {paginator.links.map((l, idx) => (
                <a
                    key={idx}
                    href={l.url || "#"}
                    className={l.active ? "active" : ""}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </nav>
    );
}

/* ── ANNONCE TYPES (shared) ── */
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

function getPlaceholder(type) {
    const p = {
        priere: "Ex : Nous sollicitons les prières de la communauté pour la guérison de…",
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        deces: "Ex : La famille a la douleur de vous annoncer le rappel à Dieu de…",
        generale: "Rédigez votre annonce à destination de l'assemblée…",
    };
    return p[type] || "Rédigez votre message…";
}

const ACTE_TYPES = [
    { value: "bapteme", label: "Baptême" },
    { value: "premiere_communion", label: "Première Communion" },
    { value: "bapteme_premiere_communion", label: "Baptême + Première Communion" },
    { value: "confirmation", label: "Confirmation" },
    { value: "mariage", label: "Mariage" },
    { value: "naissance", label: "Naissance" },
    { value: "deces", label: "Décès" },
];

const TYPE_BADGE_CONFIG = {
    bapteme:                    { label: 'Baptême',               emoji: '💧', bg: '#dbeafe', color: '#1d4ed8' },
    mariage:                    { label: 'Mariage',               emoji: '💍', bg: '#fce7f3', color: '#be185d' },
    deces:                      { label: 'Décès',                 emoji: '🕯️', bg: '#f1f5f9', color: '#475569' },
    naissance:                  { label: 'Naissance',             emoji: '👶', bg: '#dcfce7', color: '#15803d' },
    premiere_communion:         { label: '1re Communion',         emoji: '🍞', bg: '#fef3c7', color: '#b45309' },
    confirmation:               { label: 'Confirmation',          emoji: '✝️', bg: '#ede9fe', color: '#6d28d9' },
    bapteme_premiere_communion: { label: 'Baptême + Communion',   emoji: '💧', bg: '#dbeafe', color: '#1d4ed8' },
    grace:                      { label: 'Action de grâce',       emoji: '🙌', bg: '#fef3c7', color: '#d97706' },
    priere:                     { label: "Prière d'intercession", emoji: '🙏', bg: '#ede9fe', color: '#7c3aed' },
};

const ACTE_REQUIRED_FIELDS = {
    bapteme: [],
    premiere_communion: ["date", "lieu"],
    bapteme_premiere_communion: ["date", "lieu"],
    confirmation: ["confirmand", "date", "lieu"],
    mariage: ["conjoint_1", "conjoint_2"],
    naissance: [],
    deces: ["date_deces"],
};

const ACTE_DETAIL_LABELS = {
    date: "Date de l'acte",
    lieu: "Lieu",
    confirmand: "Confirmand",
    conjoint_1: "Conjoint 1",
    conjoint_2: "Conjoint 2",
    date_naissance: "Date de naissance",
    date_deces: "Date du décès",
    lien_familial: "Lien familial",
};

const ACTE_DETAIL_INPUT_TYPES = {
    date: "date",
    date_naissance: "date",
    date_deces: "date",
};

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

export default function Index({
    actes = [],
    historique = [],
    familyMembers = [],
    annonces: rawAnnonces = [],
    annoncesHistorique: rawAnnoncesHistorique = [],
    calendarEvents = [],
    mesDemandes = [],
}) {
    const { url } = usePage();

    const [actesPaginator, setActesPaginator] = useState(
        Array.isArray(actes) || !actes?.data ? null : actes,
    );

    const [localActes, setLocalActes] = useState(
        Array.isArray(actes) ? actes : (actes?.data ?? []),
    );

    useEffect(() => {
        if (Array.isArray(actes)) {
            setLocalActes(actes);
            setActesPaginator(null);
        } else if (actes?.data) {
            setLocalActes(actes.data);
            setActesPaginator(actes);
        }
    }, [actes]);

    const currentPage = actesPaginator?.current_page || 1;
    const lastPage = actesPaginator?.last_page || 1;
    const totalActes = actesPaginator?.total || localActes.length;

    const [historiqueList, setHistoriqueList] = useState(historique);
    const [activeActe, setActiveActe] = useState(null);
    const [modal, setModal] = useState(null);
    const [detailTab, setDetailTab] = useState("infos");
    const [commentaire, setCommentaire] = useState("");
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState("");
    const [ficheModalOpen, setFicheModalOpen] = useState(false);
    const [sendingFiche, setSendingFiche] = useState(false);
    const [selectedFicheBatchDate, setSelectedFicheBatchDate] = useState("");
    const [ficheEmailForm, setFicheEmailForm] = useState({
        destinataire: "",
        subject: "Fiche finale des mariages",
        message:
            "Bonjour,\n\nVeuillez trouver en piece jointe la fiche finale des mariages.\n\nBien cordialement.",
    });

    // ── BAPTEME FICHE STATE ──
    const [ficheBaptemeModalOpen, setFicheBaptemeModalOpen] = useState(false);
    const [sendingFicheBapteme, setSendingFicheBapteme] = useState(false);
    const [ficheBaptemeEmailForm, setFicheBaptemeEmailForm] = useState({
        destinataire: "",
        subject: "Fiche finale des baptêmes",
        message:
            "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des baptêmes.\n\nBien cordialement.",
    });

    const pendingPerPage = actesPaginator?.per_page || 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
    const DONE_STATUSES = ["CELEBRE", "TERMINE"];
    const [historyPage, setHistoryPage] = useState(1);
    const historyPerPage = 6;
    const [dateHistorySearch, setDateHistorySearch] = useState("");
    const [dateHistoryClasseFilter, setDateHistoryClasseFilter] = useState("");
    const [dateHistoryStatutFilter, setDateHistoryStatutFilter] = useState("");
    const [dateHistoryPage, setDateHistoryPage] = useState(1);
    const dateHistoryPerPage = 6;
    const [selectedCeremonyIds, setSelectedCeremonyIds] = useState([]);

    const goToActesPage = (page) => {
        router.visit(url, {
            data: { actes_page: page },
            preserveState: true,
            only: ["actes"],
        });
    };
    const [createForm, setCreateForm] = useState({
        type_acte: "",
        membre_id: familyMembers[0]?.id || "",
        date_souhaitee: "",
        message: "",
        details: {},
    });
    const requiredActeFields = ACTE_REQUIRED_FIELDS[createForm.type_acte] || [];

    /* ── ANNONCES STATE ── */
    const [activeTab, setActiveTab] = useState("actes");
    const [annonces, setAnnonces] = useState(rawAnnonces);
    const [annoncesHistorique, setAnnoncesHistorique] = useState(
        rawAnnoncesHistorique,
    );
    const [annFilter, setAnnFilter] = useState("tous");
    const [quickFilter, setQuickFilter] = useState("all");
    const [selectedFamily, setSelectedFamily] = useState("all");
    const [selectedClasse, setSelectedClasse] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [historiqueSearchTerm, setHistoriqueSearchTerm] = useState("");
    const [annPage, setAnnPage] = useState(1);
    const annPerPage = 6;
    const [activeAnnonce, setActiveAnnonce] = useState(null);
    const [annModal, setAnnModal] = useState(null);
    const [annCommentaire, setAnnCommentaire] = useState("");
    const [selectedAnnIds, setSelectedAnnIds] = useState([]);
    const [annHistPage, setAnnHistPage] = useState(1);
    const annHistPerPage = 6;
    /* ── NOUVELLE ANNONCE (pasteur) ── */
    const [annonceForm, setAnnonceForm] = useState({
        type_annonce: "",
        motif: "",
        temoignage_public: false,
        membre_id: familyMembers[0]?.id || "",
        message: "",
        date_annonce: "",
        date_publication: "",
        date_expiration: "",
    });
    const [annonceStep, setAnnonceStep] = useState(1);
    const [annonceProcessing, setAnnonceProcessing] = useState(false);
    const selectedType = ANNONCE_TYPES.find(
        (t) => t.value === annonceForm.type_annonce,
    );
    const selectedMotifLabel = annonceForm.type_annonce === "grace"
        ? MOTIFS_GRACE.find((m) => m.value === annonceForm.motif)?.label
        : annonceForm.type_annonce === "priere"
        ? MOTIFS_INTERCESSION.find((m) => m.value === annonceForm.motif)?.label
        : null;

    useEffect(() => {
        setHistoriqueList(historique || []);
    }, [historique]);
    useEffect(() => {
        setAnnonces(rawAnnonces || []);
    }, [rawAnnonces]);
    const annHistKey = useMemo(
        () =>
            (rawAnnoncesHistorique || [])
                .map((item) => item?.id)
                .filter(Boolean)
                .join("-"),
        [rawAnnoncesHistorique],
    );
    useEffect(() => {
        setAnnoncesHistorique(rawAnnoncesHistorique || []);
    }, [annHistKey]);

    const getFamilyItem = (item) =>
        item?.family ||
        item?.famille ||
        item?.membre?.family ||
        item?.createur?.family ||
        null;
    const getFamilyId = (item) =>
        String(item?.family_id || getFamilyItem(item)?.id || "");
    const getFamilyName = (item) =>
        getFamilyItem(item)?.nom ||
        item?.details?.nom_famille ||
        item?.details?.family_name ||
        "";

    /* ── FAMILIES ET CLASSES POUR FILTRES ── */
    const availableFamilies = useMemo(() => {
        const familySet = new Set();
        [
            ...historiqueList,
            ...annoncesHistorique,
            ...localActes,
            ...annonces,
        ].forEach((item) => {
            const family = getFamilyItem(item);
            if (family?.nom || family?.id) {
                familySet.add(
                    JSON.stringify({
                        id: family?.id,
                        nom: family?.nom,
                    }),
                );
            }
        });
        return Array.from(familySet)
            .map((f) => JSON.parse(f))
            .filter((f) => f.id && f.nom)
            .sort((a, b) => a.nom.localeCompare(b.nom));
    }, [historiqueList, annoncesHistorique, localActes, annonces]);

    const availableClasses = useMemo(() => {
        const classeSet = new Set();
        [
            ...localActes,
            ...historiqueList,
            ...annonces,
            ...annoncesHistorique,
        ].forEach((item) => {
            if (item.classe?.id && item.classe?.nom) {
                classeSet.add(
                    JSON.stringify({
                        id: item.classe.id,
                        nom: item.classe.nom,
                    }),
                );
            }
        });
        return Array.from(classeSet)
            .map((c) => JSON.parse(c))
            .sort((a, b) => a.nom.localeCompare(b.nom));
    }, [localActes, historiqueList, annonces, annoncesHistorique]);

    /* ── FILTRES COMMUNS (ACTES + ANNONCES) ── */
    const VALID_STATUSES = [
        "VALIDEE",
        "PUBLIEE",
        "ARCHIVEE",
        "CELEBRE",
        "TERMINE",
    ];
    const HIDDEN_ALL_CONTENT_TYPES = new Set(["confirmation", "generale"]);
    const isHiddenInAllContentsFilter = (...types) =>
        types.some((type) =>
            HIDDEN_ALL_CONTENT_TYPES.has(
                String(type || "")
                    .trim()
                    .toLowerCase(),
            ),
        );
    const searchNeedle = searchTerm.trim().toLowerCase();

    const filteredActes = useMemo(() => {
        let result = [...localActes];

        // Afficher uniquement les actes en attente de validation du pasteur
        result = result.filter((a) => a.statut === "TRANSMISE_AU_PASTEUR");

        if (quickFilter === "all") {
            result = result.filter(
                (a) => !isHiddenInAllContentsFilter(a.type_acte),
            );
        }

        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                String(a.type_acte || "")
                    .toLowerCase()
                    .includes(quickFilter.toLowerCase()),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter((a) => getFamilyId(a) === selectedFamily);
        }

        if (selectedClasse && selectedClasse !== "all") {
            result = result.filter(
                (a) => String(a.classe?.id) === selectedClasse,
            );
        }

        if (searchNeedle) {
            result = result.filter((a) =>
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
                        .includes(searchNeedle),
                ),
            );
        }

        return result;
    }, [localActes, quickFilter, selectedFamily, selectedClasse, searchNeedle]);

    const unsentCeremonyActes = useMemo(() => {
        const isFicheMarkedAsSent = (value) => {
            if (value === true || value === 1) return true;
            if (typeof value === "string") {
                const normalized = value.trim().toLowerCase();
                return normalized === "1" || normalized === "true";
            }
            return false;
        };

        const mergedActs = new Map();
        const seedActs = [...localActes, ...historiqueList];
        seedActs.forEach((acte) => {
            if (!acte?.id) return;
            if (!mergedActs.has(acte.id)) {
                mergedActs.set(acte.id, acte);
            }
        });

        return Array.from(mergedActs.values())
            .filter((acte) => {
                const type = String(acte?.type_acte || "")
                    .trim()
                    .toLowerCase();
                const statut = String(acte?.statut || "")
                    .trim()
                    .toUpperCase();
                const details = acte?.details || {};
                const ceremonyStatut = String(details?.ceremonie_statut || "")
                    .trim()
                    .toUpperCase();

                const ceremonyEligible = [
                    "CEREMONIE_VALIDEE_PAR_PASTEUR",
                    "CEREMONIE_VALIDE_PAR_PASTEUR",
                ].includes(ceremonyStatut);

                return (
                    type === "mariage" &&
                    ceremonyEligible &&
                    !isFicheMarkedAsSent(details?.fiche_pasteur_envoyee)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a.date_souhaitee || a.details?.date_souhaitee || 0,
                ).valueOf();
                const dateB = new Date(
                    b.date_souhaitee || b.details?.date_souhaitee || 0,
                ).valueOf();
                return dateA - dateB;
            });
    }, [localActes, historiqueList]);

    const unsentClassNames = useMemo(() => {
        const classes = new Set();
        unsentCeremonyActes.forEach((acte) => {
            const label =
                acte.classe?.nom ||
                acte.classe_id ||
                acte.details?.classe ||
                acte.family?.nom;
            if (label) {
                classes.add(label);
            }
        });
        return Array.from(classes);
    }, [unsentCeremonyActes]);

    const toBatchDateKey = (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 10);
    };

    const unsentCeremonyBatchMap = useMemo(() => {
        const map = new Map();
        unsentCeremonyActes.forEach((acte) => {
            const batchDate =
                toBatchDateKey(acte?.created_at) ||
                toBatchDateKey(acte?.details?.date_souhaitee) ||
                toBatchDateKey(acte?.date_souhaitee) ||
                toBatchDateKey(acte?.validated_at) ||
                toBatchDateKey(acte?.updated_at);
            if (!batchDate) return;
            if (!map.has(batchDate)) {
                map.set(batchDate, []);
            }
            map.get(batchDate).push(acte);
        });
        return map;
    }, [unsentCeremonyActes]);

    const unsentBatchDates = useMemo(() => {
        return Array.from(unsentCeremonyBatchMap.keys()).sort((a, b) =>
            String(b).localeCompare(String(a)),
        );
    }, [unsentCeremonyBatchMap]);

    useEffect(() => {
        if (!ficheModalOpen) return;
        if (!unsentBatchDates.length) {
            setSelectedFicheBatchDate("");
            return;
        }
        if (
            !selectedFicheBatchDate ||
            !unsentCeremonyBatchMap.has(selectedFicheBatchDate)
        ) {
            setSelectedFicheBatchDate(unsentBatchDates[0]);
        }
    }, [
        ficheModalOpen,
        unsentBatchDates,
        selectedFicheBatchDate,
        unsentCeremonyBatchMap,
    ]);

    const selectedUnsentCeremonyActes = useMemo(() => {
        if (!selectedFicheBatchDate) return [];
        return unsentCeremonyBatchMap.get(selectedFicheBatchDate) || [];
    }, [selectedFicheBatchDate, unsentCeremonyBatchMap]);

    const selectedUnsentClassNames = useMemo(() => {
        const classes = new Set();
        selectedUnsentCeremonyActes.forEach((acte) => {
            const label =
                acte.classe?.nom ||
                acte.classe_id ||
                acte.details?.classe ||
                acte.family?.nom;
            if (label) {
                classes.add(label);
            }
        });
        return Array.from(classes);
    }, [selectedUnsentCeremonyActes]);

    const ficheMariageFinaleLink = useMemo(() => {
        if (!selectedUnsentCeremonyActes.length) {
            return null;
        }
        const firstId = selectedUnsentCeremonyActes[0]?.id;
        if (!firstId) {
            return null;
        }
        const params = new URLSearchParams({
            ids: selectedUnsentCeremonyActes.map((acte) => acte.id).join(","),
        });
        return `/pasteur/liturgie/${firstId}/fiche?${params.toString()}`;
    }, [selectedUnsentCeremonyActes]);

    const unsentBaptemeActes = useMemo(() => {
        const isSent = (value) => {
            if (value === true || value === 1) return true;
            if (typeof value === "string") {
                const n = value.trim().toLowerCase();
                return n === "1" || n === "true";
            }
            return false;
        };

        const merged = new Map();
        [...localActes, ...historiqueList].forEach((acte) => {
            if (acte?.id && !merged.has(acte.id)) merged.set(acte.id, acte);
        });

        return Array.from(merged.values()).filter((acte) => {
            const type = String(acte?.type_acte || "").trim().toLowerCase();
            const statut = String(acte?.statut || "").trim().toUpperCase();
            const details = acte?.details || {};
            const eligible = [
                "TRANSMISE_AU_PASTEUR",
                "VALIDEE",
                "PUBLIEE",
                "ARCHIVEE",
                "CELEBRE",
                "TERMINE",
            ].includes(statut);
            return type === "bapteme" && eligible && !isSent(details?.fiche_bapteme_envoyee);
        });
    }, [localActes, historiqueList]);

    const ficheBaptemeListLink = useMemo(() => {
        if (!unsentBaptemeActes.length) return null;
        return `/pasteur/liturgie/bapteme/liste-pdf`;
    }, [unsentBaptemeActes]);

    const ceremonyActs = useMemo(() => {
        return historiqueList
            .filter((acte) => {
                const type = String(acte?.type_acte || "")
                    .trim()
                    .toLowerCase();
                const statut = String(acte?.details?.ceremonie_statut || "")
                    .trim()
                    .toUpperCase();
                const date =
                    acte?.details?.date_souhaitee || acte?.date_souhaitee;
                return (
                    type === "mariage" &&
                    statut === "CEREMONIE_TRANSMISE_AU_PASTEUR" &&
                    Boolean(date)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a?.details?.date_souhaitee || a?.date_souhaitee || 0,
                ).valueOf();
                const dateB = new Date(
                    b?.details?.date_souhaitee || b?.date_souhaitee || 0,
                ).valueOf();
                return dateA - dateB;
            });
    }, [historiqueList]);

    const allCeremonySelected =
        ceremonyActs.length > 0 &&
        ceremonyActs.every((acte) => selectedCeremonyIds.includes(acte.id));

    const toggleCeremonySelect = (id) =>
        setSelectedCeremonyIds((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );

    const clearCeremonySelection = () => setSelectedCeremonyIds([]);

    const toggleSelectAllCeremony = () => {
        setSelectedCeremonyIds(
            allCeremonySelected ? [] : ceremonyActs.map((acte) => acte.id),
        );
    };

    const approveSelectedCeremony = async () => {
        if (!selectedCeremonyIds.length) {
            notify("Sélectionnez au moins une date.");
            return;
        }

        try {
            setProcessing(true);
            const responses = await Promise.all(
                selectedCeremonyIds.map((id) =>
                    axios.post(withBasePath("", `/pasteur/liturgie/${id}/ceremonie/decision`), {
                        statut: "CEREMONIE_VALIDEE_PAR_PASTEUR",
                        commentaire: "",
                    }),
                ),
            );

            const updatedById = new Map(
                responses
                    .map((response) => response?.data?.acte)
                    .filter(Boolean)
                    .map((acte) => [acte.id, acte]),
            );

            setHistoriqueList((prev) =>
                prev.map((item) => {
                    const updated = updatedById.get(item.id);
                    if (!updated) return item;

                    return {
                        ...item,
                        details: updated.details,
                        date_souhaitee:
                            updated.date_souhaitee || item.date_souhaitee,
                    };
                }),
            );

            setSelectedCeremonyIds([]);
            notify(
                `${responses.length} date${responses.length > 1 ? "s" : ""} validée${responses.length > 1 ? "s" : ""}.`,
            );
        } catch (error) {
            notify(
                error?.response?.data?.message ||
                    "Echec de la validation groupée des dates.",
            );
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        setSelectedCeremonyIds((prev) =>
            prev.filter((id) => ceremonyActs.some((acte) => acte.id === id)),
        );
    }, [ceremonyActs]);

    const ceremonyValidatedActs = useMemo(() => {
        return historiqueList
            .filter((acte) => {
                const type = String(acte?.type_acte || "")
                    .trim()
                    .toLowerCase();
                const statut = String(acte?.details?.ceremonie_statut || "")
                    .trim()
                    .toUpperCase();
                const date =
                    acte?.details?.date_souhaitee || acte?.date_souhaitee;
                return (
                    type === "mariage" &&
                    [
                        "CEREMONIE_VALIDEE_PAR_PASTEUR",
                        "CEREMONIE_VALIDE_PAR_PASTEUR",
                    ].includes(statut) &&
                    Boolean(date)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a?.details?.date_souhaitee || a?.date_souhaitee || 0,
                ).valueOf();
                const dateB = new Date(
                    b?.details?.date_souhaitee || b?.date_souhaitee || 0,
                ).valueOf();
                return dateB - dateA;
            });
    }, [historiqueList]);

    const ceremonyHistoryRows = useMemo(() => {
        const uniqueRows = new Map();

        ceremonyValidatedActs.forEach((acte) => {
            const details = acte?.details || {};
            const memberName =
                `${acte?.membre?.prenom || ""} ${acte?.membre?.nom || ""}`.trim() ||
                "Membre inconnu";
            const fianceName =
                [details?.conjoint_prenom, details?.conjoint_nom]
                    .filter(Boolean)
                    .join(" ") ||
                [details?.epoux_prenom, details?.epoux_nom]
                    .filter(Boolean)
                    .join(" ") ||
                [details?.conjoint_1, details?.conjoint_2]
                    .filter(Boolean)
                    .join(" ") ||
                "—";
            const witnesses =
                [details?.temoin_femme, details?.temoin_homme]
                    .filter(Boolean)
                    .join(" / ") ||
                details?.temoins ||
                "—";

            const dateChosen = details?.date_souhaitee || acte?.date_souhaitee;
            const validatedAt =
                details?.ceremonie_validee_pasteur_at ||
                details?.ceremonie_transmise_pasteur_at ||
                acte?.updated_at ||
                acte?.created_at;

            const signature = [
                acte.id,
                acte.reference || `ACTE-${acte.id}`,
                memberName,
                fianceName,
                witnesses,
                dateChosen || "",
                validatedAt || "",
            ].join("|");

            if (!uniqueRows.has(signature)) {
                uniqueRows.set(signature, {
                    rowKey: signature,
                    id: acte.id,
                    typeActe: acte.type_acte,
                    statut: acte.statut,
                    ceremonyStatut: details?.ceremonie_statut,
                    classeName: acte?.classe?.nom || "—",
                    reference: acte.reference || `ACTE-${acte.id}`,
                    memberName,
                    fianceName,
                    witnesses,
                    dateChosen,
                    validatedAt,
                });
            }
        });

        return Array.from(uniqueRows.values());
    }, [ceremonyValidatedActs]);

    const dateHistoryNeedle = dateHistorySearch.trim().toLowerCase();
    const dateHistoryClasseNeedle = dateHistoryClasseFilter.trim();
    const dateHistoryStatutNeedle = dateHistoryStatutFilter.trim();

    const dateHistoryClasses = useMemo(
        () =>
            Array.from(
                new Set(
                    ceremonyHistoryRows
                        .map((row) => row.classeName)
                        .filter(Boolean),
                ),
            ).sort((a, b) => a.localeCompare(b, "fr")),
        [ceremonyHistoryRows],
    );

    const dateHistoryStatuts = useMemo(
        () =>
            Array.from(
                new Set(
                    ceremonyHistoryRows
                        .map((row) => row.ceremonyStatut)
                        .filter(Boolean),
                ),
            ),
        [ceremonyHistoryRows],
    );

    const filteredCeremonyHistoryRows = useMemo(() => {
        return ceremonyHistoryRows.filter((row) =>
            (!dateHistoryNeedle ||
                [
                    row.reference,
                    row.memberName,
                    row.fianceName,
                    row.witnesses,
                    row.classeName,
                    formatDate(row.dateChosen),
                    formatDateTime(row.validatedAt),
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(dateHistoryNeedle),
                )) &&
            (!dateHistoryClasseNeedle ||
                row.classeName === dateHistoryClasseNeedle) &&
            (!dateHistoryStatutNeedle ||
                String(row.ceremonyStatut || "") === dateHistoryStatutNeedle),
        );
    }, [
        ceremonyHistoryRows,
        dateHistoryNeedle,
        dateHistoryClasseNeedle,
        dateHistoryStatutNeedle,
    ]);

    const dateHistoryTotalPages = Math.max(
        1,
        Math.ceil(filteredCeremonyHistoryRows.length / dateHistoryPerPage),
    );

    const pagedCeremonyHistoryRows = useMemo(() => {
        const start = (dateHistoryPage - 1) * dateHistoryPerPage;
        return filteredCeremonyHistoryRows.slice(
            start,
            start + dateHistoryPerPage,
        );
    }, [filteredCeremonyHistoryRows, dateHistoryPage]);

    useEffect(() => {
        setDateHistoryPage(1);
    }, [
        dateHistoryNeedle,
        dateHistoryClasseNeedle,
        dateHistoryStatutNeedle,
        ceremonyHistoryRows.length,
    ]);

    useEffect(() => {
        if (dateHistoryPage > dateHistoryTotalPages) {
            setDateHistoryPage(dateHistoryTotalPages);
        }
    }, [dateHistoryPage, dateHistoryTotalPages]);

    const filteredHistorique = useMemo(() => {
        let result = [...historiqueList];

        if (quickFilter === "all") {
            result = result.filter(
                (a) => !isHiddenInAllContentsFilter(a.type_acte),
            );
        }

        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                String(a.type_acte || "")
                    .toLowerCase()
                    .includes(quickFilter.toLowerCase()),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter((a) => getFamilyId(a) === selectedFamily);
        }

        if (selectedClasse && selectedClasse !== "all") {
            result = result.filter(
                (a) => String(a.classe_id || a.classe?.id) === selectedClasse,
            );
        }

        if (searchNeedle) {
            result = result.filter((a) =>
                [
                    a.type_acte,
                    a.reference,
                    a.statut,
                    a.membre?.prenom,
                    a.membre?.nom,
                    a.classe?.nom,
                    getFamilyName(a),
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(searchNeedle),
                ),
            );
        }

        const histNeedle = historiqueSearchTerm.trim().toLowerCase();
        if (histNeedle) {
            result = result.filter((a) =>
                [
                    a.type_acte,
                    a.reference,
                    a.statut,
                    a.membre?.prenom,
                    a.membre?.nom,
                    a.classe?.nom,
                    getFamilyName(a),
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(histNeedle),
                ),
            );
        }

        return result;
    }, [
        historiqueList,
        quickFilter,
        selectedFamily,
        selectedClasse,
        searchNeedle,
        historiqueSearchTerm,
    ]);
    const annFiltered = useMemo(() => {
        let result = [...annonces];

        // Afficher uniquement les annonces en attente de validation du pasteur
        result = result.filter((a) => a.statut === "TRANSMISE_AU_PASTEUR");

        // Note: Les annonces paroissiales ne doivent pas être filtrées par HIDDEN_ALL_CONTENT_TYPES
        // Ce filtre s'applique uniquement aux actes liturgiques

        // Filter by specific type
        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                [a.type_annonce, a.type_acte].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(quickFilter.toLowerCase()),
                ),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter((a) => getFamilyId(a) === selectedFamily);
        }

        if (selectedClasse && selectedClasse !== "all") {
            result = result.filter(
                (a) => String(a.classe?.id) === selectedClasse,
            );
        }

        // Filter by search term
        if (searchNeedle) {
            result = result.filter((a) =>
                [
                    a.type_annonce,
                    a.type_acte,
                    a.message,
                    a.details?.contenu,
                    a.statut,
                    a.createur?.prenom,
                    a.createur?.nom,
                    a.membre?.prenom,
                    a.membre?.nom,
                    getFamilyName(a),
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(searchNeedle),
                ),
            );
        }

        return result;
    }, [annonces, quickFilter, selectedFamily, selectedClasse, searchNeedle]);

    const combinedPending = useMemo(() => {
        const actes = filteredActes.map(a => ({ ...a, _source: 'acte' }));
        const ann = annFiltered.map(a => ({ ...a, _source: 'annonce' }));
        return [...actes, ...ann].sort((a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
    }, [filteredActes, annFiltered]);

    const annHistFiltered = useMemo(() => {
        let result = [...annoncesHistorique];

        // Note: Les annonces paroissiales ne doivent pas être filtrées par HIDDEN_ALL_CONTENT_TYPES
        // Ce filtre s'applique uniquement aux actes liturgiques

        // Filter by status (Toutes/En cours/Validées/Refusées)
        if (annFilter === "en_cours") {
            result = result.filter(
                (a) =>
                    !VALID_STATUSES.includes(a.statut) &&
                    !String(a.statut).startsWith("REFUSEE"),
            );
        } else if (annFilter === "validees") {
            result = result.filter((a) => VALID_STATUSES.includes(a.statut));
        } else if (annFilter === "refusees") {
            result = result.filter((a) =>
                String(a.statut).startsWith("REFUSEE"),
            );
        }

        // Filter by specific type
        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                [a.type_annonce, a.type_acte].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(quickFilter.toLowerCase()),
                ),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter((a) => getFamilyId(a) === selectedFamily);
        }

        if (selectedClasse && selectedClasse !== "all") {
            result = result.filter(
                (a) => String(a.classe?.id) === selectedClasse,
            );
        }

        // Filter by search term
        if (searchNeedle) {
            result = result.filter((a) =>
                [
                    a.type_annonce,
                    a.type_acte,
                    a.message,
                    a.details?.contenu,
                    a.statut,
                    a.createur?.prenom,
                    a.createur?.nom,
                    a.membre?.prenom,
                    a.membre?.nom,
                    getFamilyName(a),
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(searchNeedle),
                ),
            );
        }

        return result;
    }, [
        annoncesHistorique,
        annFilter,
        quickFilter,
        selectedFamily,
        selectedClasse,
        searchNeedle,
    ]);

    const historyTotalPages = Math.max(
        1,
        Math.ceil(filteredHistorique.length / historyPerPage),
    );
    const pagedHistorique = filteredHistorique.slice(
        (historyPage - 1) * historyPerPage,
        historyPage * historyPerPage,
    );
    useEffect(() => {
        if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
    }, [historyPage, historyTotalPages]);

    const combinedHistorique = useMemo(() => {
        const actes = filteredHistorique.map(a => ({ ...a, _histSource: 'acte' }));
        const ann = annHistFiltered.map(a => ({ ...a, _histSource: 'annonce' }));
        return [...actes, ...ann].sort((a, b) =>
            new Date(b.validated_at || 0) - new Date(a.validated_at || 0)
        );
    }, [filteredHistorique, annHistFiltered]);
    const combinedHistTotalPages = Math.max(1, Math.ceil(combinedHistorique.length / historyPerPage));
    const pagedCombinedHist = combinedHistorique.slice(
        (historyPage - 1) * historyPerPage,
        historyPage * historyPerPage,
    );

    const annTotalPages = Math.max(
        1,
        Math.ceil(annFiltered.length / annPerPage),
    );
    const pagedAnn = annFiltered.slice(
        (annPage - 1) * annPerPage,
        annPage * annPerPage,
    );
    const annHistTotalPages = Math.max(
        1,
        Math.ceil(annHistFiltered.length / annHistPerPage),
    );
    const pagedAnnHist = annHistFiltered.slice(
        (annHistPage - 1) * annHistPerPage,
        annHistPage * annHistPerPage,
    );

    useEffect(() => {
        if (annPage > annTotalPages) setAnnPage(annTotalPages);
    }, [annPage, annTotalPages]);

    useEffect(() => {
        if (annHistPage > annHistTotalPages) setAnnHistPage(annHistTotalPages);
    }, [annHistPage, annHistTotalPages]);
    // Reset pages when filters change
    useEffect(() => {
        setSelectedIds([]);
        setAnnPage(1);
    }, [quickFilter, searchTerm]);

    useEffect(() => {
        setAnnHistPage(1);
    }, [annFilter]);

    const annStats = useMemo(
        () => ({
            pending: annonces.filter((a) => a.statut === "TRANSMISE_AU_PASTEUR")
                .length,
            total: annonces.length + annoncesHistorique.length,
            validees: annoncesHistorique.filter((a) =>
                VALID_STATUSES.includes(a.statut),
            ).length,
            refusees: annoncesHistorique.filter((a) =>
                String(a.statut).startsWith("REFUSEE"),
            ).length,
        }),
        [annonces, annoncesHistorique],
    );
    /* ── ACTES HELPERS ── */
    const toggleSelect = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    const toggleHistorySelect = (id) =>
        setSelectedHistoryIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    const selectAllPending = () =>
        setSelectedIds(filteredActes.map((a) => a.id));
    const selectAllHistory = () =>
        setSelectedHistoryIds(historiqueList.map((h) => h.id));
    const clearSelection = () => setSelectedIds([]);
    const clearHistorySelection = () => setSelectedHistoryIds([]);

    const stats = useMemo(() => {
        const byClass = localActes.reduce((acc, acte) => {
            const key = acte.classe?.nom || `Classe ${acte.classe_id || "-"}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return {
            total: totalActes + historiqueList.length,
            pending: localActes.filter(
                (a) => a.statut === "TRANSMISE_AU_PASTEUR",
            ).length,
            classes: Object.entries(byClass).map(([name, count]) => ({
                name,
                count,
            })),
        };
    }, [localActes, historiqueList, totalActes]);

    const openModal = (name, acte) => {
        setActiveActe(acte || null);
        setCommentaire("");
        if (name === "create") {
            setCreateForm({
                type_acte: "",
                membre_id: familyMembers[0]?.id || "",
                date_souhaitee: "",
            });
        }
        if (name === "detail") {
            setDetailTab("infos");
        }
        setModal(name);
    };
    const closeModal = () => {
        if (processing) return;
        setModal(null);
        setActiveActe(null);
        setCommentaire("");
    };
    const notify = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 3500);
    };

    const openFicheModal = () => {
        setSelectedFicheBatchDate(unsentBatchDates[0] || "");
        setFicheEmailForm({
            destinataire: "",
            subject: "Fiche finale des mariages",
            message:
                "Bonjour,\n\nVeuillez trouver en piece jointe la fiche finale des mariages.\n\nBien cordialement.",
        });
        setFicheModalOpen(true);
    };

    const closeFicheModal = () => {
        if (sendingFiche) return;
        setFicheModalOpen(false);
    };

    const openFicheBaptemeModal = () => {
        setFicheBaptemeEmailForm({
            destinataire: "",
            subject: "Fiche finale des baptêmes",
            message:
                "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des baptêmes.\n\nBien cordialement.",
        });
        setFicheBaptemeModalOpen(true);
    };

    const closeFicheBaptemeModal = () => {
        if (sendingFicheBapteme) return;
        setFicheBaptemeModalOpen(false);
    };

    const handleSendFicheBapteme = async () => {
        if (!unsentBaptemeActes.length) {
            notify("Aucune fiche de baptême en attente d'envoi.");
            return;
        }
        if (!ficheBaptemeEmailForm.destinataire.trim()) {
            notify("Veuillez renseigner l'email du destinataire.");
            return;
        }
        try {
            setSendingFicheBapteme(true);
            const res = await axios.post(
                withBasePath("", "/pasteur/liturgie/bapteme/fiche/envoyer"),
                {
                    ids: unsentBaptemeActes.map((a) => a.id),
                    destinataire: ficheBaptemeEmailForm.destinataire.trim(),
                    subject: ficheBaptemeEmailForm.subject.trim(),
                    message: ficheBaptemeEmailForm.message.trim(),
                },
            );
            const updatedActes = Array.isArray(res.data?.actes) ? res.data.actes : [];
            if (updatedActes.length) {
                setLocalActes((prev) =>
                    prev.map((item) => {
                        const match = updatedActes.find((a) => a.id === item.id);
                        return match ? match : item;
                    }),
                );
                setHistoriqueList((prev) =>
                    prev.map((item) => {
                        const match = updatedActes.find((a) => a.id === item.id);
                        return match ? { ...item, ...match } : item;
                    }),
                );
            }
            notify(res.data?.message || "La fiche baptême a été envoyée.");
            setFicheBaptemeModalOpen(false);
        } catch (error) {
            notify(
                error?.response?.data?.message ||
                    "Impossible d'envoyer la fiche baptême.",
            );
        } finally {
            setSendingFicheBapteme(false);
        }
    };

    const handleSendFiche = async () => {
        if (!selectedUnsentCeremonyActes.length) {
            notify("Aucune fiche n'est en attente d'envoi.");
            return;
        }

        if (!ficheEmailForm.destinataire.trim()) {
            notify("Veuillez renseigner l'email du destinataire.");
            return;
        }

        try {
            setSendingFiche(true);
            const res = await axios.post(
                withBasePath("", "/pasteur/liturgie/fiche/envoyer"),
                {
                    ids: selectedUnsentCeremonyActes.map((acte) => acte.id),
                    destinataire: ficheEmailForm.destinataire.trim(),
                    subject: ficheEmailForm.subject.trim(),
                    message: ficheEmailForm.message.trim(),
                },
            );
            const updatedActes = Array.isArray(res.data?.actes)
                ? res.data.actes
                : [];
            if (updatedActes.length) {
                setLocalActes((prev) =>
                    prev.map((item) => {
                        const match = updatedActes.find(
                            (a) => a.id === item.id,
                        );
                        return match ? match : item;
                    }),
                );
                setHistoriqueList((prev) =>
                    prev.map((item) => {
                        const match = updatedActes.find(
                            (a) => a.id === item.id,
                        );
                        return match ? { ...item, ...match } : item;
                    }),
                );
            }
            notify(res.data?.message || "La fiche a été envoyée.");
            setFicheModalOpen(false);
        } catch (error) {
            notify(
                error?.response?.data?.message ||
                    "Impossible d'envoyer la fiche PDF.",
            );
        } finally {
            setSendingFiche(false);
        }
    };

    const submitDecision = async (statut) => {
        if (!activeActe) return;
        if (statut === "REFUSEE_PAR_PASTEUR" && !commentaire.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            await axios.post(
                withBasePath(
                    "",
                    `/pasteur/liturgie/${activeActe.id}/transition`,
                ),
                {
                    statut,
                    commentaire,
                },
            );
            setLocalActes((prev) =>
                prev.filter((item) => item.id !== activeActe.id),
            );
            setHistoriqueList((prev) => [
                {
                    ...activeActe,
                    statut,
                    note_pastorale: commentaire,
                    validated_at: new Date().toISOString(),
                },
                ...prev,
            ]);
            notify(
                statut === "VALIDEE"
                    ? "Approbation réussie."
                    : "Refus enregistré.",
            );
            closeModal();
        } catch (error) {
            notify(
                error?.response?.data?.errors?.commentaire?.[0] ||
                    error?.response?.data?.message ||
                    "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const submitCeremonyDecision = async (acteId, statut) => {
        const commentaire =
            statut === "CEREMONIE_REFUSEE_PAR_PASTEUR"
                ? window.prompt("Motif du refus de la date ?") || ""
                : "";

        if (statut === "CEREMONIE_REFUSEE_PAR_PASTEUR" && !commentaire.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }

        try {
            setProcessing(true);
            const { data } = await axios.post(
                `/pasteur/liturgie/${acteId}/ceremonie/decision`,
                {
                    statut,
                    commentaire,
                },
            );

            if (data?.acte) {
                setHistoriqueList((prev) =>
                    prev.map((item) =>
                        item.id === acteId
                            ? {
                                  ...item,
                                  details: data.acte.details,
                                  date_souhaitee:
                                      data.acte.date_souhaitee ||
                                      item.date_souhaitee,
                              }
                            : item,
                    ),
                );
                setActiveActe((prev) =>
                    prev?.id === acteId ? { ...prev, ...data.acte } : prev,
                );
            }

            notify(
                data?.message ||
                    "Décision sur la date de cérémonie enregistrée.",
            );
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const bulkApproveAll = async () => {
        if (!selectedIds.length && !selectedAnnIds.length) {
            notify("Sélectionnez au moins une demande.");
            return;
        }
        try {
            setProcessing(true);
            if (selectedIds.length) {
                const selectedActes = localActes.filter((a) => selectedIds.includes(a.id));
                await Promise.all(selectedIds.map((id) =>
                    axios.post(withBasePath("", `/pasteur/liturgie/${id}/transition`), { statut: "VALIDEE", commentaire: "" })
                ));
                setLocalActes((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
                setHistoriqueList((prev) => [
                    ...selectedActes.map((a) => ({ ...a, statut: "VALIDEE", note_pastorale: "", validated_at: new Date().toISOString() })),
                    ...prev,
                ]);
                clearSelection();
            }
            if (selectedAnnIds.length) {
                const selected = annonces.filter((a) => selectedAnnIds.includes(a.id));
                await Promise.all(selectedAnnIds.map((id) => getPasteurAnnonceAction("VALIDEE", id)));
                setAnnonces((prev) => prev.filter((a) => !selectedAnnIds.includes(a.id)));
                setAnnoncesHistorique((prev) => [
                    ...selected.map((a) => ({ ...a, statut: "VALIDEE", note_pastorale: "", validated_at: new Date().toISOString() })),
                    ...prev,
                ]);
                clearAnnSelection();
            }
            notify("Validation groupée réussie.");
        } catch (error) {
            notify(error?.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setProcessing(false);
        }
    };

    const bulkRefuseAll = async () => {
        if (!selectedIds.length && !selectedAnnIds.length) {
            notify("Sélectionnez au moins une demande.");
            return;
        }
        const motif = window.prompt("Motif du refus (obligatoire) :");
        if (!motif || !motif.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            if (selectedIds.length) {
                const selectedActes = localActes.filter((a) => selectedIds.includes(a.id));
                await Promise.all(selectedIds.map((id) =>
                    axios.post(withBasePath("", `/pasteur/liturgie/${id}/transition`), { statut: "REFUSEE_PAR_PASTEUR", commentaire: motif })
                ));
                setLocalActes((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
                setHistoriqueList((prev) => [
                    ...selectedActes.map((a) => ({ ...a, statut: "REFUSEE_PAR_PASTEUR", note_pastorale: motif, validated_at: new Date().toISOString() })),
                    ...prev,
                ]);
                clearSelection();
            }
            if (selectedAnnIds.length) {
                const selected = annonces.filter((a) => selectedAnnIds.includes(a.id));
                await Promise.all(selectedAnnIds.map((id) => getPasteurAnnonceAction("REFUSEE_PAR_PASTEUR", id, motif)));
                setAnnonces((prev) => prev.filter((a) => !selectedAnnIds.includes(a.id)));
                setAnnoncesHistorique((prev) => [
                    ...selected.map((a) => ({ ...a, statut: "REFUSEE_PAR_PASTEUR", note_pastorale: motif, validated_at: new Date().toISOString() })),
                    ...prev,
                ]);
                clearAnnSelection();
            }
            notify("Refus groupé enregistré.");
        } catch (error) {
            notify(error?.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setProcessing(false);
        }
    };

    const bulkApprove = async () => {
        if (!selectedIds.length) {
            notify("Sélectionnez au moins une demande.");
            return;
        }
        try {
            setProcessing(true);
            const selectedActes = localActes.filter((a) =>
                selectedIds.includes(a.id),
            );
            await Promise.all(
                selectedIds.map((id) =>
                    axios.post(
                        withBasePath("", `/pasteur/liturgie/${id}/transition`),
                        {
                            statut: "VALIDEE",
                            commentaire: "",
                        },
                    ),
                ),
            );
            setLocalActes((prev) =>
                prev.filter((item) => !selectedIds.includes(item.id)),
            );
            setHistoriqueList((prev) => [
                ...selectedActes.map((acte) => ({
                    ...acte,
                    statut: "VALIDEE",
                    note_pastorale: "",
                    validated_at: new Date().toISOString(),
                })),
                ...prev,
            ]);
            clearSelection();
            notify("Approbation réussie.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const bulkFinalizeHistory = async () => {
        if (!selectedHistoryIds.length) {
            notify("Sélectionnez au moins un élément historique.");
            return;
        }
        try {
            setProcessing(true);
            await Promise.all(
                selectedHistoryIds.map((id) => {
                    const acte = historiqueList.find((h) => h.id === id);
                    const statut = finalStatusForType(acte.type_acte);
                    if (!statut) return Promise.resolve();
                    return axios.post(
                        withBasePath("", `/pasteur/liturgie/${id}/transition`),
                        {
                            statut,
                            commentaire: "",
                        },
                    );
                }),
            );
            setHistoriqueList((prev) =>
                prev.map((h) =>
                    selectedHistoryIds.includes(h.id)
                        ? {
                              ...h,
                              statut:
                                  finalStatusForType(h.type_acte) || h.statut,
                          }
                        : h,
                ),
            );
            clearHistorySelection();
            notify("Éléments marqués comme effectués.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const bulkDownloadHistory = () => {
        if (!selectedHistoryIds.length) {
            notify("Sélectionnez au moins un élément.");
            return;
        }
        selectedHistoryIds.forEach((id) =>
            window.open(withBasePath("", `/pasteur/liturgie/${id}/certificat`), "_blank"),
        );
    };

    const bulkRefuse = async () => {
        if (!selectedIds.length) {
            notify("Sélectionnez au moins une demande.");
            return;
        }
        const motif = window.prompt("Motif du refus (obligatoire) :");
        if (!motif || !motif.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            const selectedActes = localActes.filter((a) =>
                selectedIds.includes(a.id),
            );
            await Promise.all(
                selectedIds.map((id) =>
                    axios.post(
                        withBasePath("", `/pasteur/liturgie/${id}/transition`),
                        {
                            statut: "REFUSEE_PAR_PASTEUR",
                            commentaire: motif,
                        },
                    ),
                ),
            );
            setLocalActes((prev) =>
                prev.filter((item) => !selectedIds.includes(item.id)),
            );
            setHistoriqueList((prev) => [
                ...selectedActes.map((acte) => ({
                    ...acte,
                    statut: "REFUSEE_PAR_PASTEUR",
                    note_pastorale: motif,
                    validated_at: new Date().toISOString(),
                })),
                ...prev,
            ]);
            clearSelection();
            notify("Refus groupé enregistré.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const submitCreate = async () => {
        if (!createForm.type_acte || !createForm.membre_id) {
            notify("Sélectionnez un type et un membre.");
            return;
        }
        if (!createForm.date_souhaitee) {
            notify("La date souhaitée est requise.");
            return;
        }
        for (const field of requiredActeFields) {
            if (!String(createForm.details?.[field] || "").trim()) {
                notify(`Le champ "${ACTE_DETAIL_LABELS[field] || field}" est requis.`);
                return;
            }
        }
        try {
            setProcessing(true);
            const member = familyMembers.find(
                (m) => String(m.id) === String(createForm.membre_id),
            );
            const payload = {
                type_acte: createForm.type_acte,
                membre_id: Number(createForm.membre_id),
                classe_id: member?.classe_id || null,
                date_souhaitee: createForm.date_souhaitee,
                details: {
                    message: createForm.message,
                    ...createForm.details,
                },
            };
            const res = await axios.post(
                withBasePath("", "/pasteur/liturgie"),
                payload,
            );
            const acte = res?.data?.acte;
            if (acte)
                setHistoriqueList((prev) => [
                    {
                        ...acte,
                        statut: "VALIDEE",
                        validated_at: new Date().toISOString(),
                    },
                    ...prev,
                ]);
            setCreateForm({ type_acte: "", membre_id: familyMembers[0]?.id || "", date_souhaitee: "", message: "", details: {} });
            notify("Acte créé et validé.");
            closeModal();
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const finalizeActe = async (acte) => {
        const statut = finalStatusForType(acte.type_acte);
        if (!statut) return;
        try {
            setProcessing(true);
            await axios.post(
                withBasePath("", `/pasteur/liturgie/${acte.id}/transition`),
                {
                    statut,
                    commentaire: "",
                },
            );
            setHistoriqueList((prev) =>
                prev.map((item) =>
                    item.id === acte.id ? { ...item, statut } : item,
                ),
            );
            notify("Acte marqué comme effectué.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    /* ── ANNONCES HANDLERS ── */
    const openAnnModal = (name, ann = null) => {
        setActiveAnnonce(ann);
        setAnnCommentaire("");
        setAnnModal(name);
        if (name === "create") {
            setAnnonceForm({
                type_annonce: "",
                motif: "",
                temoignage_public: false,
                membre_id: familyMembers[0]?.id || "",
                message: "",
                date_annonce: "",
                date_publication: "",
                date_expiration: "",
            });
            setAnnonceStep(1);
        }
    };
    const closeAnnModal = () => {
        if (processing || annonceProcessing) return;
        setAnnModal(null);
        setActiveAnnonce(null);
        setAnnCommentaire("");
        setAnnonceStep(1);
    };

    const getPasteurAnnonceAction = async (statut, id, commentaire = "") => {
        if (statut === "VALIDEE") {
            return axios.post(
                withBasePath("", `/pasteur/annonces/${id}/valider`),
                {
                    note: commentaire,
                },
            );
        }
        if (statut === "REFUSEE_PAR_PASTEUR") {
            return axios.post(
                withBasePath("", `/pasteur/annonces/${id}/rejeter`),
                {
                    motif_rejet: commentaire,
                },
            );
        }
        if (statut === "PUBLIEE") {
            return axios.post(
                withBasePath("", `/pasteur/annonces/${id}/publier`),
                {
                    commentaire,
                },
            );
        }
        return axios.post(withBasePath("", `/pasteur/annonces/${id}/valider`), {
            note: commentaire,
        });
    };

    const submitAnnDecision = async (statut) => {
        if (!activeAnnonce) return;
        if (statut === "REFUSEE_PAR_PASTEUR" && !annCommentaire.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        if (statut === "VALIDEE") {
            if (activeAnnonce?.statut !== "TRANSMISE_AU_PASTEUR") {
                notify(
                    "Cette annonce doit d'abord être transmise par le conducteur.",
                );
                return;
            }
        }
        try {
            setProcessing(true);
            await getPasteurAnnonceAction(
                statut,
                activeAnnonce.id,
                annCommentaire,
            );

            if (statut === "VALIDEE") {
                const validatedAnnonce = {
                    ...activeAnnonce,
                    statut: "PUBLIEE",
                    note_pastorale: annCommentaire,
                    date_publication: new Date().toISOString(),
                    validated_at: new Date().toISOString(),
                };
                setAnnonces((prev) =>
                    prev.filter((a) => a.id !== activeAnnonce.id),
                );
                setAnnoncesHistorique((prev) => [validatedAnnonce, ...prev]);
                closeAnnModal();
                notify("Demande de prière validée et publiée.");
                return;
            }

            if (statut === "PUBLIEE") {
                setAnnoncesHistorique((prev) =>
                    prev.map((a) =>
                        a.id === activeAnnonce.id
                            ? {
                                  ...a,
                                  statut: "PUBLIEE",
                                  date_publication:
                                      a.date_publication ||
                                      new Date().toISOString(),
                              }
                            : a,
                    ),
                );
                closeAnnModal();
                notify("Demande de prière publiée avec succès.");
                return;
            }

            if (statut === "REFUSEE_PAR_PASTEUR") {
                const refusedAnnonce = {
                    ...activeAnnonce,
                    statut: "REFUSEE_PAR_PASTEUR",
                    note_pastorale: annCommentaire,
                    validated_at: new Date().toISOString(),
                };
                setAnnonces((prev) =>
                    prev.filter((a) => a.id !== activeAnnonce.id),
                );
                setAnnoncesHistorique((prev) => [refusedAnnonce, ...prev]);
                closeAnnModal();
                notify("Demande de prière refusée.");
                return;
            }

            closeAnnModal();
            notify("Statut modifié.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    /* ── NOUVELLE ANNONCE (pasteur pour ses membres) ── */
    const submitAnnonce = async () => {
        if (!annonceForm.type_annonce || !annonceForm.message.trim()) {
            notify("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        if (
            (annonceForm.type_annonce === "grace" || annonceForm.type_annonce === "priere") &&
            !annonceForm.motif
        ) {
            notify("Veuillez sélectionner un motif.");
            return;
        }
        if (!annonceForm.membre_id) {
            notify("Veuillez sélectionner un membre concerné.");
            return;
        }
        if (!annonceForm.date_annonce) {
            notify("La date de l'annonce est requise.");
            return;
        }
        try {
            setAnnonceProcessing(true);
            const res = await axios.post(
                withBasePath("", "/pasteur/annonces"),
                annonceForm,
            );
            const newA = res.data?.annonce || {
                ...annonceForm,
                id: Date.now(),
                statut: "SOUMISE",
                created_at: new Date().toISOString(),
            };
            setAnnonces((prev) => [newA, ...prev]);
            closeAnnModal();
            setActiveTab("annonces");
            setQuickFilter("all");
            setSelectedFamily("all");
            setSelectedClasse("all");
            setSearchTerm("");
            notify("✅ Demande de prière créée avec succès.");
        } catch (e) {
            notify(e?.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    const toggleAnnSelect = (id) =>
        setSelectedAnnIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    const selectAllAnn = () => setSelectedAnnIds(annonces.map((a) => a.id));
    const clearAnnSelection = () => setSelectedAnnIds([]);

    const bulkApproveAnn = async () => {
        if (!selectedAnnIds.length) {
            notify("Sélectionnez au moins une demande de prière.");
            return;
        }
        try {
            setProcessing(true);
            const selected = annonces.filter((a) =>
                selectedAnnIds.includes(a.id),
            );
            await Promise.all(
                selectedAnnIds.map((id) =>
                    getPasteurAnnonceAction("VALIDEE", id),
                ),
            );
            setAnnonces((prev) =>
                prev.filter((a) => !selectedAnnIds.includes(a.id)),
            );
            setAnnoncesHistorique((prev) => [
                ...selected.map((a) => ({
                    ...a,
                    statut: "VALIDEE",
                    note_pastorale: "",
                    validated_at: new Date().toISOString(),
                })),
                ...prev,
            ]);
            clearAnnSelection();
            notify("Demandes de prière validées et publiées.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const bulkRefuseAnn = async () => {
        if (!selectedAnnIds.length) {
            notify("Sélectionnez au moins une demande de prière.");
            return;
        }
        const motif = window.prompt("Motif du refus (obligatoire) :");
        if (!motif || !motif.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            const selected = annonces.filter((a) =>
                selectedAnnIds.includes(a.id),
            );
            await Promise.all(
                selectedAnnIds.map((id) =>
                    getPasteurAnnonceAction("REFUSEE_PAR_PASTEUR", id, motif),
                ),
            );
            setAnnonces((prev) =>
                prev.filter((a) => !selectedAnnIds.includes(a.id)),
            );
            setAnnoncesHistorique((prev) => [
                ...selected.map((a) => ({
                    ...a,
                    statut: "REFUSEE_PAR_PASTEUR",
                    note_pastorale: motif,
                    validated_at: new Date().toISOString(),
                })),
                ...prev,
            ]);
            clearAnnSelection();
            notify("Refus groupé enregistré.");
        } catch (error) {
            notify(
                error?.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const maxClass = Math.max(1, ...stats.classes.map((c) => c.count));
    const sessionValides = historiqueList.filter(
        (h) => h.statut === "VALIDEE",
    ).length;
    const sessionRefuses = historiqueList.filter(
        (h) => h.statut === "REFUSEE_PAR_PASTEUR",
    ).length;

    const tableStyles = {
        borderCollapse: "collapse",
        width: "100%",
        borderSpacing: 0,
        marginTop: "12px",
    };

    return (
        <div className="pastor-page">
            <style>{styles}</style>
            <main className="main">
                <div className="content">
                    {/* ══════════════════════════════════
                        HERO HEADER BAR — Validation Pastorale
                    ══════════════════════════════════ */}
                    <div className="hero-header">
                        <div className="hero-header-bg" />
                        <div className="hero-header-inner">
                            <Link
                                href={withBasePath("", "/pasteur/dashboard")}
                                className="btn-back"
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                Retour
                            </Link>

                            <div className="hero-header-center">
                                <div className="hero-cross-wrap">
                                    <div className="hero-cross-ring" />
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 2v20M2 12h20"
                                        />
                                    </svg>
                                </div>
                                <div className="hero-title-block">
                                    <div className="hero-eyebrow">
                                        Interface Pastorale
                                    </div>
                                    <h1 className="hero-title">
                                        Validation & Gouvernance
                                    </h1>
                                    <div className="hero-subtitle">
                                        Actes liturgiques · Demandes de prière
                                        · Supervision communautaire
                                    </div>
                                </div>
                                <div className="hero-stats-row">
                                    <div className="hero-stat">
                                        <span className="hero-stat-n">
                                            {stats.pending}
                                        </span>
                                        <span className="hero-stat-l">
                                            Actes en attente
                                        </span>
                                    </div>
                                    <div className="hero-stat-sep" />
                                    <div className="hero-stat">
                                        <span className="hero-stat-n">
                                            {annStats.pending}
                                        </span>
                                        <span className="hero-stat-l">
                                            Demandes de prière en attente
                                        </span>
                                    </div>
                                    <div className="hero-stat-sep" />
                                    <div className="hero-stat">
                                        <span className="hero-stat-n">
                                            {sessionValides}
                                        </span>
                                        <span className="hero-stat-l">
                                            Validés aujourd'hui
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-header-actions">
                                <button
                                    className="btn-hero-annonce"
                                    onClick={() => {
                                        setActiveTab("annonces");
                                        setQuickFilter("all");
                                        setSelectedFamily("all");
                                        setSelectedClasse("all");
                                        setSearchTerm("");
                                        openAnnModal("create");
                                    }}
                                >
                                    <svg
                                        width="13"
                                        height="13"
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
                                    Nouvelle demande de prière
                                </button>
                                <button
                                    className="btn-hero-acte"
                                    onClick={() => openModal("create")}
                                >
                                    <svg
                                        width="13"
                                        height="13"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    Créer un acte
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ATTENTION BANNER */}
                    {stats.pending > 0 && (
                        <div className="attention-banner">
                            <div className="attention-icon-wrap">
                                <svg
                                    width="18"
                                    height="18"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                    />
                                </svg>
                            </div>
                            <div className="attention-text">
                                <div className="attention-title">
                                    {stats.pending} acte
                                    {stats.pending > 1 ? "s" : ""} attendent
                                    votre validation finale
                                </div>
                                <div className="attention-sub">
                                    Ces dossiers ont déjà été validés par les
                                    conducteurs et transmis au niveau pastoral.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KPI */}
                    <div className="kpi-row">
                        <div className="kpi kpi-violet">
                            <div className="kpi-top">
                                <div className="kpi-icon-wrap kpi-icon-violet">
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-violet">
                                    À valider
                                </span>
                            </div>
                            <div className="kpi-number">{stats.pending}</div>
                            <div className="kpi-label">Actes transmis</div>
                            <div className="kpi-progress">
                                <div
                                    className="kpi-progress-fill violet"
                                    style={{
                                        width: `${Math.min(100, stats.pending * 15)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="kpi kpi-gold">
                            <div className="kpi-top">
                                <div className="kpi-icon-wrap kpi-icon-gold">
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-gold">
                                    Total
                                </span>
                            </div>
                            <div className="kpi-number">{stats.total}</div>
                            <div className="kpi-label">Dossiers reçus</div>
                            <div className="kpi-progress">
                                <div
                                    className="kpi-progress-fill gold"
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>
                        <div className="kpi kpi-green">
                            <div className="kpi-top">
                                <div className="kpi-icon-wrap kpi-icon-green">
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-green">
                                    Session
                                </span>
                            </div>
                            <div className="kpi-number">{sessionValides}</div>
                            <div className="kpi-label">Validés</div>
                            <div className="kpi-progress">
                                <div
                                    className="kpi-progress-fill green"
                                    style={{
                                        width: `${stats.total ? Math.round((sessionValides / stats.total) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div
                            className="kpi kpi-ann"
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab("annonces")}
                        >
                            <div className="kpi-top">
                                <div className="kpi-icon-wrap kpi-icon-ann">
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-ann">
                                    {annStats.pending > 0
                                        ? `${annStats.pending} en attente`
                                        : "Demandes de prière"}
                                </span>
                            </div>
                            <div className="kpi-number">{annStats.total}</div>
                            <div className="kpi-label">Demandes de prière reçues</div>
                            <div className="kpi-progress">
                                <div
                                    className="kpi-progress-fill ann"
                                    style={{
                                        width: `${Math.min(100, annStats.pending * 15)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PASTORAL BOX */}
                    <div className="pastoral-box">
                        <div className="pastoral-cross-icon">
                            <svg
                                width="22"
                                height="22"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 2v20M2 12h20"
                                />
                            </svg>
                        </div>
                        <div className="pastoral-content">
                            <div className="pastoral-title">
                                le pastoral dans ce module
                            </div>
                            <div className="pastoral-text">
                                Vous exercez la{" "}
                                <strong>validation finale</strong> des actes
                                liturgiques et annonces transmis par les
                                conducteurs. Chaque décision — validation ou
                                refus — est accompagnée d'une note pastorale et
                                génère une notification automatique.
                            </div>
                        </div>
                        <div className="pastoral-stats">
                            <div className="pastoral-stat">
                                <div className="pastoral-stat-n">
                                    {sessionValides + sessionRefuses}
                                </div>
                                <div className="pastoral-stat-l">
                                    approbations
                                </div>
                            </div>
                            <div className="pastoral-stat-sep" />
                            <div className="pastoral-stat">
                                <div className="pastoral-stat-n">
                                    {stats.pending}
                                </div>
                                <div className="pastoral-stat-l">
                                    En attente
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TABS + FILTRES ── */}
                    <div className="tab-toolbar">
                        <div className="main-tabs">
                            <button
                                className={`ptab ${activeTab === "actes" ? "active" : ""}`}
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
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                                Actes liturgiques
                                {(stats.pending + annStats.pending) > 0 && (
                                    <span className="ptab-badge">
                                        {stats.pending + annStats.pending}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`ptab ${activeTab === "calendar" ? "active" : ""}`}
                                onClick={() => setActiveTab("calendar")}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect
                                        x="3"
                                        y="5"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />
                                    <path d="M3 9h18M7 3v4M17 3v4" />
                                </svg>
                                Calendrier
                            </button>
                            <button
                                className={`ptab ${activeTab === "dates" ? "active" : ""}`}
                                onClick={() => setActiveTab("dates")}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M8 7h8M8 11h8M8 15h8" />
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />
                                </svg>
                                Dates choisies
                                {ceremonyActs.length > 0 && (
                                    <span className="ptab-badge ptab-badge-sage">
                                        {ceremonyActs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`ptab ${activeTab === "mes_demandes" ? "active" : ""}`}
                                onClick={() => setActiveTab("mes_demandes")}
                            >
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Mes demandes
                                {mesDemandes.length > 0 && (
                                    <span className="ptab-badge">{mesDemandes.length}</span>
                                )}
                            </button>
                        </div>
                        <div className="quick-tools">
                            <select
                                className="quick-dropdown"
                                value={quickFilter}
                                onChange={(e) => setQuickFilter(e.target.value)}
                            >
                                <option value="all">
                                    🔍 Tous les contenus
                                </option>
                                <optgroup label="Types d'actes">
                                    <option value="bapteme">💧 Baptême</option>
                                    <option value="deces">🕯️ Décès</option>
                                    <option value="mariage">💍 Mariage</option>
                                    <option value="naissance">
                                        👶 Naissance
                                    </option>
                                    <option value="premiere_communion">
                                        🍞 Première Communion
                                    </option>
                                </optgroup>
                                <optgroup label="Demandes de prière">
                                    <option value="grace">
                                        🙌 Action de grâce
                                    </option>
                                    <option value="priere">🙏 Prière d'intercession</option>
                                </optgroup>
                                <optgroup label="Mes contenus">
                                    <option value="mes_annonces">
                                        🙏 Mes demandes de prière
                                    </option>
                                    <option value="mes_demandes">
                                        📋 Mes demandes
                                    </option>
                                </optgroup>
                            </select>
                            <select
                                className="quick-dropdown"
                                value={selectedFamily}
                                onChange={(e) =>
                                    setSelectedFamily(e.target.value)
                                }
                                title="Filtrer par famille"
                            >
                                <option value="all">
                                    👨‍👩‍👧‍👦 Toutes les familles
                                </option>
                                {availableFamilies.map((family) => (
                                    <option key={family.id} value={family.id}>
                                        👨‍👩‍👧‍👦 {family.nom}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="quick-dropdown"
                                value={selectedClasse}
                                onChange={(e) =>
                                    setSelectedClasse(e.target.value)
                                }
                                title="Filtrer par classe"
                            >
                                <option value="all">
                                    🎓 Toutes les classes
                                </option>
                                {availableClasses.map((classe) => (
                                    <option key={classe.id} value={classe.id}>
                                        🎓 {classe.nom}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="search"
                                className="quick-search"
                                placeholder="Recherche par nom, message, type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ════════════════ TAB ACTES ════════════════ */}
                    {activeTab === "actes" && (
                        <>
                            <div className="layout-grid">
                                <div className="panel">
                                    <div className="panel-head">
                                        <div>
                                            <div className="panel-title">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                                En attente de validation
                                            </div>
                                            <div className="panel-sub">
                                                Actes liturgiques et demandes de prière transmis — Votre validation est requise
                                            </div>
                                        </div>
                                        <div className="panel-actions">
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={() => { selectAllPending(); selectAllAnn(); }}
                                                disabled={combinedPending.length === 0}
                                            >
                                                Tout sélectionner
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={() => { clearSelection(); clearAnnSelection(); }}
                                                disabled={selectedIds.length === 0 && selectedAnnIds.length === 0}
                                            >
                                                Effacer
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini btn-mini-approve"
                                                onClick={bulkApproveAll}
                                                disabled={(selectedIds.length === 0 && selectedAnnIds.length === 0) || processing}
                                            >
                                                ✓ Valider ({selectedIds.length + selectedAnnIds.length})
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini btn-mini-refuse"
                                                onClick={bulkRefuseAll}
                                                disabled={(selectedIds.length === 0 && selectedAnnIds.length === 0) || processing}
                                            >
                                                ✕ Refuser ({selectedIds.length + selectedAnnIds.length})
                                            </button>
                                            <span className="panel-badge">
                                                {combinedPending.length}
                                            </span>
                                        </div>
                                    </div>
                                    {combinedPending.length === 0 && (
                                        <div className="empty-state">
                                            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Aucun élément en attente de validation</span>
                                        </div>
                                    )}
                                    {combinedPending.map((item) => {
                                        const typeKey = item.type_acte || item.type_annonce || '';
                                        const badge = TYPE_BADGE_CONFIG[typeKey] || { label: typeKey, emoji: '📋', bg: '#f3f4f6', color: '#374151' };
                                        const isActe = item._source === 'acte';
                                        return (
                                        <div
                                            key={`${item._source}-${item.id}`}
                                            className="acte-card"
                                            onClick={() => isActe ? openModal("detail", item) : openAnnModal("detail", item)}
                                        >
                                            {/* ── TYPE BADGE ── */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em' }}>
                                                    {badge.emoji} {badge.label}
                                                </span>
                                            </div>
                                            <div className="acte-card-top">
                                                <label className="acte-check" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isActe ? selectedIds.includes(item.id) : selectedAnnIds.includes(item.id)}
                                                        onChange={() => isActe ? toggleSelect(item.id) : toggleAnnSelect(item.id)}
                                                    />
                                                    <span />
                                                </label>
                                                <div className={`acte-emoji-box${!isActe ? ` atype-${badge.color === '#d97706' ? 'amber' : badge.color === '#7c3aed' ? 'violet' : ''}` : ''}`}>
                                                    {item.membre?.profile_photo_url ? (
                                                        <img src={item.membre.profile_photo_url} alt={`${item.membre?.prenom} ${item.membre?.nom}`} className="member-photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    ) : (
                                                        <span className="photo-fallback">
                                                            {isActe ? iconEmoji(item.type_acte) : badge.emoji}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="acte-info">
                                                    <div className="acte-name">
                                                        {isActe ? prettyType(item.type_acte) : badge.label}
                                                        {item.membre && ` — ${item.membre.prenom} ${item.membre.nom}`}
                                                    </div>
                                                    {!isActe && (() => {
                                                        const motifVal = item.details?.motif;
                                                        const motifLabel = motifVal
                                                            ? ([...MOTIFS_GRACE, ...MOTIFS_INTERCESSION].find(m => m.value === motifVal)?.label || motifVal)
                                                            : null;
                                                        return motifLabel ? (
                                                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#7c3aed', marginTop: 2, marginBottom: 2 }}>
                                                                {motifLabel}
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                    <div className="acte-meta">
                                                        <span>
                                                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                                                            </svg>
                                                            {item.classe?.nom || item.classe_id || '—'}
                                                        </span>
                                                        <span>
                                                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                            {formatDate(item.date_souhaitee || item.created_at)}
                                                        </span>
                                                        <span>{item.reference || '—'}</span>
                                                    </div>
                                                    {!isActe && (item.details?.contenu || item.message) && (
                                                        <div className="cn-text" style={{ marginTop: 4, fontStyle: 'normal' }}>
                                                            {(item.details?.contenu || item.message || '').slice(0, 100)}…
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="badge badge-transmis">
                                                    <span className="badge-dot" />
                                                    AU PASTEUR
                                                </span>
                                            </div>
                                            <div className="conductor-note">
                                                <div className="cn-label">
                                                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    Note du conducteur
                                                </div>
                                                <div className="cn-text">
                                                    {item.note_conducteur || 'Aucune note du conducteur pour ce dossier.'}
                                                </div>
                                            </div>
                                            <div className="acte-actions" onClick={(e) => e.stopPropagation()}>
                                                <button className="btn-validate" onClick={() => isActe ? openModal('validate', item) : openAnnModal('validate', item)}>
                                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    {isActe ? 'Accepté' : 'Valider'}
                                                </button>
                                                <button className="btn-see" onClick={() => isActe ? openModal('detail', item) : openAnnModal('detail', item)}>
                                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Voir détail
                                                </button>
                                                {isActe && (
                                                    <button className="btn-pdf" onClick={() => { const t = String(item.type_acte||'').toLowerCase(); window.open(t==='naissance'||t==='deces'?`/pasteur/liturgie/${item.id}/fiche?preview=1`:`/pasteur/liturgie/${item.id}/fiche-conducteur?preview=1`,'_blank'); }}>
                                                        Voir la fiche
                                                    </button>
                                                )}
                                                {!isActe && (
                                                    <button className="btn-pdf" onClick={(e) => { e.stopPropagation(); window.open(`/pasteur/liturgie/${item.id}/fiche-priere`, '_blank'); }}>
                                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        Télécharger fiche
                                                    </button>
                                                )}
                                                <button className="btn-refuse-sm" onClick={() => isActe ? openModal('refuse', item) : openAnnModal('refuse', item)}>
                                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Refuser
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                    {lastPage > 1 && (
                                        <div className="flex items-center justify-center gap-3 mt-4 py-2">
                                            <button
                                                type="button"
                                                onClick={() => goToActesPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                ← Précédent
                                            </button>
                                            <span className="text-xs text-gray-500 font-medium">
                                                Page {currentPage} / {lastPage}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => goToActesPage(currentPage + 1)}
                                                disabled={currentPage === lastPage}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Suivant →
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="side-col">
                                    <div className="panel">
                                        <div className="panel-head">
                                            <div className="panel-title">
                                                <svg
                                                    width="15"
                                                    height="15"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                    />
                                                </svg>
                                                Actes par classe
                                            </div>
                                        </div>
                                        <div className="stat-rows">
                                            {stats.classes.length === 0 && (
                                                <div className="empty-small">
                                                    Aucune donnée.
                                                </div>
                                            )}
                                            {stats.classes.map((c) => (
                                                <div
                                                    className="stat-item"
                                                    key={c.name}
                                                >
                                                    <div className="stat-item-top">
                                                        <span className="stat-label">
                                                            {c.name}
                                                        </span>
                                                        <span className="stat-count">
                                                            {c.count}
                                                        </span>
                                                    </div>
                                                    <div className="stat-bar">
                                                        <div
                                                            className="stat-bar-fill"
                                                            style={{
                                                                width: `${Math.round((c.count / maxClass) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="panel">
                                        <div className="panel-head">
                                            <div className="panel-title">
                                                <svg
                                                    width="15"
                                                    height="15"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                En attente par classe
                                            </div>
                                        </div>
                                        {stats.classes.length === 0 && (
                                            <div
                                                className="empty-small"
                                                style={{ padding: "16px 22px" }}
                                            >
                                                Aucune classe en attente.
                                            </div>
                                        )}
                                        {stats.classes.map((c) => (
                                            <div
                                                className="class-row"
                                                key={`pending-${c.name}`}
                                            >
                                                <div className="class-row-left">
                                                    <div className="class-dot" />
                                                    <div>
                                                        <div className="class-name">
                                                            {c.name}
                                                        </div>
                                                        <div className="class-sub">
                                                            Actes à traiter
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="class-count">
                                                    {c.count} acte
                                                    {c.count > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* HISTORIQUE ACTES */}
                            {/* HISTORIQUE UNIFIÉ */}
                            <div className="panel layout-full">
                                <div className="panel-head">
                                    <div>
                                        <div className="panel-title">
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Historique pastoral
                                        </div>
                                        <div className="panel-sub">Toutes les approbations et refus effectués</div>
                                    </div>
                                    {combinedHistorique.length > 0 && (
                                        <>
                                            <div className="panel-actions">
                                                <button type="button" className="btn-mini" onClick={selectAllHistory} disabled={filteredHistorique.length === 0}>Tout sélectionner (actes)</button>
                                                <button type="button" className="btn-mini" onClick={clearHistorySelection} disabled={selectedHistoryIds.length === 0}>Effacer</button>
                                                <button type="button" className="btn-mini btn-mini-approve" onClick={bulkFinalizeHistory} disabled={selectedHistoryIds.length === 0 || processing}>Finaliser</button>
                                                <button type="button" className="btn-mini" onClick={bulkDownloadHistory} disabled={selectedHistoryIds.length === 0}>Télécharger certifs</button>
                                                {unsentBaptemeActes.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn-mini btn-mini-approve"
                                                        onClick={openFicheBaptemeModal}
                                                        style={{ background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' }}
                                                    >
                                                        💧 Envoyer liste baptêmes ({unsentBaptemeActes.length})
                                                    </button>
                                                )}
                                                {unsentCeremonyActes.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn-mini btn-mini-approve"
                                                        onClick={openFicheModal}
                                                        style={{ background: '#ec4899', color: '#fff', borderColor: '#ec4899' }}
                                                    >
                                                        💍 Envoyer liste mariages ({unsentCeremonyActes.length})
                                                    </button>
                                                )}
                                                <span className="panel-badge">{combinedHistorique.length}</span>
                                            </div>
                                            <div className="hist-summary">
                                                <span className="hs-pill green">{combinedHistorique.filter(h => !String(h.statut||'').startsWith('REFUSEE')).length} validé(e)s</span>
                                                {combinedHistorique.filter(h => String(h.statut||'').startsWith('REFUSEE')).length > 0 && (
                                                    <span className="hs-pill red">{combinedHistorique.filter(h => String(h.statut||'').startsWith('REFUSEE')).length} refusé(e)s</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {combinedHistorique.length > 0 && (
                                    <div className="ann-filters-bar">
                                        {[{v:'tous',l:'Toutes'},{v:'en_cours',l:'En cours'},{v:'validees',l:'Validées'},{v:'refusees',l:'Refusées'}].map(f => (
                                            <button key={f.v} className={`ann-filter-btn ${annFilter === f.v ? 'active' : ''}`} onClick={() => { setAnnFilter(f.v); setHistoryPage(1); }}>{f.l}</button>
                                        ))}
                                    </div>
                                )}
                                {combinedHistorique.length > 0 && (
                                    <div style={{ position: 'relative', padding: '8px 24px 0' }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ position:'absolute', left:'34px', top:'50%', transform:'translateY(-30%)', color:'#9ca3af', pointerEvents:'none' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                                        </svg>
                                        <input type="search" placeholder="Rechercher dans l'historique (nom, type, référence…)" value={historiqueSearchTerm} onChange={(e) => { setHistoriqueSearchTerm(e.target.value); setHistoryPage(1); }} style={{ width:'100%', padding:'7px 12px 7px 32px', border:'1px solid #e5e7eb', borderRadius:'7px', fontSize:'13px', outline:'none', background:'#f9fafb', color:'#374151', boxSizing:'border-box' }} />
                                    </div>
                                )}
                                {combinedHistorique.length === 0 && (
                                    <div className="empty-state">
                                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Aucun élément traité pour le moment</span>
                                    </div>
                                )}
                                {pagedCombinedHist.map((item) => {
                                    const isActe = item._histSource === 'acte';
                                    const typeKey = isActe ? item.type_acte : (item.type_annonce || item.type_acte);
                                    const badge = TYPE_BADGE_CONFIG[typeKey] || { label: typeKey || '—', emoji: '📋', bg: '#f3f4f6', color: '#374151' };
                                    const isRefuse = String(item.statut || '').startsWith('REFUSEE');
                                    return (
                                        <div className="hist-item" key={`ch-${item._histSource}-${item.id}-${item.validated_at}`} style={{ flexWrap: 'wrap', gap: 10 }}>
                                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, background: badge.bg, color: badge.color, fontSize:11, fontWeight:700, letterSpacing:'0.02em', flexShrink:0 }}>
                                                {badge.emoji} {badge.label}
                                            </span>
                                            {isActe && (
                                                <label className="hist-check" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedHistoryIds.includes(item.id)} onChange={() => toggleHistorySelect(item.id)} />
                                                    <span />
                                                </label>
                                            )}
                                            <div className="hist-icon-box">
                                                {isActe ? (
                                                    item.membre?.profile_photo_url
                                                        ? <img src={item.membre.profile_photo_url} alt={`${item.membre?.prenom} ${item.membre?.nom}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                                                        : iconEmoji(item.type_acte)
                                                ) : (
                                                    <span style={{ fontSize: 18 }}>{badge.emoji}</span>
                                                )}
                                            </div>
                                            <div className="hist-info">
                                                <div className="hist-name">
                                                    {isActe ? prettyType(item.type_acte) : badge.label}
                                                    {item.membre && ` — ${item.membre.prenom} ${item.membre.nom}`}
                                                </div>
                                                <div className="hist-detail">
                                                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                                                    </svg>
                                                    Classe {item.classe?.nom || item.classe_id || '—'}
                                                    {isActe && item.note_pastorale && <> · <em>{item.note_pastorale}</em></>}
                                                </div>
                                            </div>
                                            <div className="hist-right">
                                                <span className={`badge ${isRefuse ? 'badge-refuse' : 'badge-valide'}`}>
                                                    <span className="badge-dot" />
                                                    {isActe ? historyStatusLabel(item.statut) : (isRefuse ? 'Refusé' : 'Publié')}
                                                </span>
                                                <div className="hist-date">{formatDate(item.validated_at)}</div>
                                                {isActe && String(item.type_acte||'').toLowerCase() === 'mariage' && item.details?.ceremonie_statut === 'CEREMONIE_TRANSMISE_AU_PASTEUR' && (
                                                    <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                                                        <button className="btn-pdf" onClick={() => submitCeremonyDecision(item.id, 'CEREMONIE_VALIDEE_PAR_PASTEUR')}>Valider la date</button>
                                                        <button className="btn-refuse-sm" onClick={() => submitCeremonyDecision(item.id, 'CEREMONIE_REFUSEE_PAR_PASTEUR')}>Refuser la date</button>
                                                    </div>
                                                )}
                                                {isActe && item.statut === 'VALIDEE' && ((item.type_acte === 'mariage' && item.details?.date_souhaitee && item.details?.fiche_pasteur_envoyee) || item.type_acte === 'bapteme') && (
                                                    <button className="btn-pdf" onClick={() => finalizeActe(item)}>Marquer {finalLabelForType(item.type_acte)}</button>
                                                )}
                                                {isActe && ['deces', 'naissance'].includes(item.type_acte) && (
                                                    <button className="btn-pdf" onClick={() => window.open(`/pasteur/liturgie/${item.id}/certificat`, '_blank')}>Télécharger la fiche</button>
                                                )}
                                                {!isActe && ['priere', 'grace'].includes(item.type_acte) && !item.statut?.includes('REFUS') && (
                                                    <button className="btn-pdf" onClick={() => window.open(`/pasteur/liturgie/${item.id}/fiche-priere`, '_blank')}>Télécharger la fiche</button>
                                                )}
                                                {isActe && item.type_acte === 'mariage' && ['CEREMONIE_VALIDE_PAR_PASTEUR', 'CEREMONIE_VALIDEE_PAR_PASTEUR'].includes(item.details?.ceremonie_statut) && (
                                                    <button className="btn-pdf" onClick={() => window.open(`/pasteur/liturgie/${item.id}/certificat`, '_blank')}>Télécharger certificat</button>
                                                )}
                                                {isActe && item.type_acte === 'bapteme' && item.details?.fiche_bapteme_envoyee && (
                                                    <button className="btn-pdf" onClick={() => window.open(`/pasteur/liturgie/${item.id}/certificat`, '_blank')}>Télécharger certificat</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {combinedHistTotalPages > 1 && (
                                    <div className="pager">
                                        <button type="button" className="pager-btn" onClick={() => setHistoryPage(historyPage - 1)} disabled={historyPage === 1}>Précédent</button>
                                        <div className="pager-info">Page {historyPage} / {combinedHistTotalPages}</div>
                                        <button type="button" className="pager-btn" onClick={() => setHistoryPage(historyPage + 1)} disabled={historyPage === combinedHistTotalPages}>Suivant</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "calendar" && (
                        <div className="calendar-tab-root">
                            <MiniCalendar
                                events={calendarEvents}
                                title="Calendrier des dates choisies"
                            />
                        </div>
                    )}

                    {activeTab === "dates" && (
                        <div className="date-tab-root">
                            <section className="date-section-panel">
                                <div className="date-shell">
                                    <div className="date-shell-head">
                                        <div>
                                            <div className="date-shell-title">
                                                Dates proposées en attente
                                                pastorale
                                            </div>
                                            <div className="date-shell-sub">
                                                Chaque fiche conserve ses
                                                données actuelles, avec un rendu
                                                plus lisible.
                                            </div>
                                        </div>
                                        <div className="date-shell-tools">
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={
                                                    toggleSelectAllCeremony
                                                }
                                                disabled={
                                                    ceremonyActs.length === 0
                                                }
                                            >
                                                {allCeremonySelected
                                                    ? "Désélectionner"
                                                    : "Tout sélectionner"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={clearCeremonySelection}
                                                disabled={
                                                    selectedCeremonyIds.length ===
                                                    0
                                                }
                                            >
                                                Effacer
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini btn-mini-approve"
                                                onClick={
                                                    approveSelectedCeremony
                                                }
                                                disabled={
                                                    selectedCeremonyIds.length ===
                                                        0 || processing
                                                }
                                            >
                                                Valider la sélection
                                            </button>
                                            <div className="date-shell-count">
                                                {ceremonyActs.length} dossier
                                                {ceremonyActs.length > 1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        </div>
                                    </div>
                                    {ceremonyActs.length === 0 ? (
                                        <div className="empty-state">
                                            <svg
                                                width="32"
                                                height="32"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 10h12"
                                                />
                                            </svg>
                                            <div className="empty-title">
                                                Aucune date de mariage choisie
                                            </div>
                                            <div className="empty-sub">
                                                Les responsables pourront
                                                proposer une date une fois leur
                                                dossier validé.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="date-grid">
                                            {ceremonyActs.map((acte) => {
                                                const statut = String(
                                                    acte.details
                                                        ?.ceremonie_statut ||
                                                        "",
                                                )
                                                    .trim()
                                                    .toUpperCase();
                                                const badgeClass =
                                                    statut.includes("REFUSEE")
                                                        ? "badge-refuse"
                                                        : statut ===
                                                            "CEREMONIE_VALIDEE_PAR_PASTEUR"
                                                          ? "badge-valide"
                                                          : "badge-transmis";

                                                return (
                                                    <article
                                                        className="date-card"
                                                        key={`date-${acte.id}`}
                                                    >
                                                        <label className="date-card-check">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCeremonyIds.includes(
                                                                    acte.id,
                                                                )}
                                                                onChange={() =>
                                                                    toggleCeremonySelect(
                                                                        acte.id,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                Sélectionner
                                                            </span>
                                                        </label>
                                                        <div className="date-card-main">
                                                            <div className="date-card-heading">
                                                                <div className="date-card-title">
                                                                    {
                                                                        acte
                                                                            .membre
                                                                            ?.prenom
                                                                    }{" "}
                                                                    {
                                                                        acte
                                                                            .membre
                                                                            ?.nom
                                                                    }
                                                                </div>
                                                                <div className="date-card-ref">
                                                                    {acte.reference ||
                                                                        "Référence indisponible"}
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={`badge ${badgeClass}`}
                                                            >
                                                                <span className="badge-dot" />
                                                                {historyStatusLabel(
                                                                    statut,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="date-card-meta">
                                                            <span>
                                                                {formatDate(
                                                                    acte.details
                                                                        ?.date_souhaitee ||
                                                                        acte.date_souhaitee,
                                                                )}
                                                            </span>
                                                            <span className="date-card-sep">
                                                                •
                                                            </span>
                                                            <span>
                                                                {acte.details
                                                                    ?.ceremonie_creneau ||
                                                                    "—"}
                                                            </span>
                                                        </div>
                                                        <div className="date-card-body">
                                                            <div className="date-card-field">
                                                                <span className="date-card-label">
                                                                    Lieu
                                                                </span>
                                                                <span className="date-card-value">
                                                                    {acte
                                                                        .details
                                                                        ?.lieu_ceremonie ||
                                                                        "—"}
                                                                </span>
                                                            </div>
                                                            <div className="date-card-field">
                                                                <span className="date-card-label">
                                                                    Témoins
                                                                </span>
                                                                <span className="date-card-value">
                                                                    {acte
                                                                        .details
                                                                        ?.temoins ||
                                                                        [
                                                                            acte
                                                                                .details
                                                                                ?.temoin_femme,
                                                                            acte
                                                                                .details
                                                                                ?.temoin_homme,
                                                                        ]
                                                                            .filter(
                                                                                Boolean,
                                                                            )
                                                                            .join(
                                                                                " / ",
                                                                            ) ||
                                                                        "—"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="date-card-actions">
                                                            <button
                                                                className="btn-see date-card-button"
                                                                type="button"
                                                                onClick={() =>
                                                                    openModal(
                                                                        "ceremony",
                                                                        acte,
                                                                    )
                                                                }
                                                            >
                                                                Voir la date
                                                                choisie
                                                            </button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="date-section-panel date-section-history">
                                <div className="date-history-shell">
                                    <div className="date-history-head">
                                        <div>
                                            <div className="date-history-title">
                                                Historique des dates validées
                                            </div>
                                            <div className="date-history-sub">
                                                Les dates que le pasteur a déjà
                                                validées sont listées ici de
                                                façon indépendante.
                                            </div>
                                        </div>
                                        <div className="date-history-tools">
                                            <input
                                                type="search"
                                                className="quick-search date-history-search"
                                                placeholder="Rechercher membre, témoin, référence..."
                                                value={dateHistorySearch}
                                                onChange={(e) =>
                                                    setDateHistorySearch(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <select
                                                className="quick-dropdown date-history-filter"
                                                value={dateHistoryClasseFilter}
                                                onChange={(e) =>
                                                    setDateHistoryClasseFilter(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Toutes les classes
                                                </option>
                                                {dateHistoryClasses.map(
                                                    (classeName) => (
                                                        <option
                                                            key={classeName}
                                                            value={classeName}
                                                        >
                                                            {classeName}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <select
                                                className="quick-dropdown date-history-filter"
                                                value={dateHistoryStatutFilter}
                                                onChange={(e) =>
                                                    setDateHistoryStatutFilter(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Tous les statuts
                                                </option>
                                                {dateHistoryStatuts.map(
                                                    (statut) => (
                                                        <option
                                                            key={statut}
                                                            value={statut}
                                                        >
                                                            {ceremonyStatusLabel(
                                                                statut,
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {(dateHistorySearch ||
                                                dateHistoryClasseFilter ||
                                                dateHistoryStatutFilter) && (
                                                <button
                                                    type="button"
                                                    className="btn-mini date-history-clear"
                                                    onClick={() => {
                                                        setDateHistorySearch(
                                                            "",
                                                        );
                                                        setDateHistoryClasseFilter(
                                                            "",
                                                        );
                                                        setDateHistoryStatutFilter(
                                                            "",
                                                        );
                                                    }}
                                                >
                                                    Effacer
                                                </button>
                                            )}
                                            <div className="date-history-count">
                                                {
                                                    filteredCeremonyHistoryRows.length
                                                }{" "}
                                                date
                                                {filteredCeremonyHistoryRows.length >
                                                1
                                                    ? "s"
                                                    : ""}
                                                {filteredCeremonyHistoryRows.length !==
                                                    ceremonyHistoryRows.length && (
                                                    <span className="date-history-muted">
                                                        /{" "}
                                                        {
                                                            ceremonyHistoryRows.length
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {ceremonyHistoryRows.length === 0 ? (
                                        <div className="empty empty-history">
                                            Aucune date validée pour le moment.
                                        </div>
                                    ) : filteredCeremonyHistoryRows.length ===
                                      0 ? (
                                        <div className="empty empty-history">
                                            Aucun résultat pour cette recherche.
                                        </div>
                                    ) : (
                                        <div className="table-scroll date-history-table-scroll">
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>N</th>
                                                        <th>Référence</th>
                                                        <th>Membre concerné</th>
                                                        <th>
                                                            Fiancé / fiancée
                                                        </th>
                                                        <th>Témoin(s)</th>
                                                        <th>Date choisie</th>
                                                        <th>Validée le</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagedCeremonyHistoryRows.map(
                                                        (row, idx) => {
                                                            const canMarkCelebrated =
                                                                String(
                                                                    row.typeActe ||
                                                                        "",
                                                                ).toLowerCase() ===
                                                                    "mariage" &&
                                                                String(
                                                                    row.statut ||
                                                                        "",
                                                                ).toUpperCase() !==
                                                                    "CELEBRE" &&
                                                                [
                                                                    "CEREMONIE_VALIDEE_PAR_PASTEUR",
                                                                    "CEREMONIE_VALIDE_PAR_PASTEUR",
                                                                ].includes(
                                                                    String(
                                                                        row.ceremonyStatut ||
                                                                            "",
                                                                    )
                                                                        .trim()
                                                                        .toUpperCase(),
                                                                );

                                                            const canDownloadCertificate =
                                                                String(
                                                                    row.statut ||
                                                                        "",
                                                                ).toUpperCase() ===
                                                                "CELEBRE";

                                                            return (
                                                                <tr
                                                                    key={
                                                                        row.rowKey
                                                                    }
                                                                >
                                                                    <td>
                                                                        {idx +
                                                                            1 +
                                                                            (dateHistoryPage -
                                                                                1) *
                                                                                dateHistoryPerPage}
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            row.reference
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            row.memberName
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            row.fianceName
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            row.witnesses
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {formatDate(
                                                                            row.dateChosen,
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {formatDateTime(
                                                                            row.validatedAt,
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="date-history-actions">
                                                                            {canMarkCelebrated && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn-mini btn-mini-approve"
                                                                                    onClick={() =>
                                                                                        finalizeActe(
                                                                                            {
                                                                                                id: row.id,
                                                                                                type_acte:
                                                                                                    row.typeActe,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        processing
                                                                                    }
                                                                                >
                                                                                    Marquer
                                                                                    célébré
                                                                                </button>
                                                                            )}
                                                                            {canDownloadCertificate && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn-pdf"
                                                                                    onClick={() =>
                                                                                        window.open(
                                                                                            `/pasteur/liturgie/${row.id}/certificat`,
                                                                                            "_blank",
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Télécharger
                                                                                    certificat
                                                                                </button>
                                                                            )}
                                                                            {!canMarkCelebrated &&
                                                                                !canDownloadCertificate && (
                                                                                    <span className="date-history-action-muted">
                                                                                        Déjà
                                                                                        traité
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {filteredCeremonyHistoryRows.length > 0 &&
                                        dateHistoryTotalPages > 1 && (
                                            <div className="pager">
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        setDateHistoryPage(
                                                            dateHistoryPage - 1,
                                                        )
                                                    }
                                                    disabled={
                                                        dateHistoryPage === 1
                                                    }
                                                >
                                                    Précédent
                                                </button>
                                                <div className="pager-info">
                                                    Page {dateHistoryPage} /{" "}
                                                    {dateHistoryTotalPages}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        setDateHistoryPage(
                                                            dateHistoryPage + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        dateHistoryPage ===
                                                        dateHistoryTotalPages
                                                    }
                                                >
                                                    Suivant
                                                </button>
                                            </div>
                                        )}
                                </div>
                            </section>
                        </div>
                    )}

                </div>
            </main>

            {/* ══════════════════════════════════════════════════
                MODALS ACTES
            ══════════════════════════════════════════════════ */}
            {modal === "detail" && activeActe && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon blue">
                                    <svg
                                        width="16"
                                        height="16"
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
                                </div>
                                <div className="modal-title">
                                    Dossier complet
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const isMariage =
                                    String(
                                        activeActe?.type_acte || "",
                                    ).toLowerCase() === "mariage";
                                return (
                                    <>
                                        {true && (
                                            <>
                                                <DetailRow
                                                    label="Référence"
                                                    value={activeActe.reference}
                                                    mono
                                                />
                                                <DetailRow
                                                    label="Type d'acte"
                                                    value={prettyType(
                                                        activeActe.type_acte,
                                                    )}
                                                />
                                                <DetailRow
                                                    label="Membre concerné"
                                                    value={`${activeActe.membre?.prenom || ""} ${activeActe.membre?.nom || ""}`.trim() || "—"}
                                                />
                                                <DetailRow
                                                    label="Classe"
                                                    value={activeActe.classe?.nom || activeActe.classe_id || "—"}
                                                />
                                                {activeActe.createur && (
                                                    <DetailRow
                                                        label="Soumis par"
                                                        value={
                                                            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                                {activeActe.createur.prenom} {activeActe.createur.nom}
                                                                {activeActe.createur.role && (
                                                                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'rgba(99,102,241,0.12)', color:'#4f46e5' }}>
                                                                        {{responsable_famille:'Responsable de famille',conducteur:'Conducteur',pasteur:'Pasteur',membre:'Membre'}[activeActe.createur.role] || activeActe.createur.role}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                <DetailRow
                                                    label="Soumis le"
                                                    value={formatDateTime(activeActe.created_at)}
                                                />
                                                {(() => {
                                                    const hist = Array.isArray(activeActe.historiques)
                                                        ? activeActe.historiques.find(h => h.statut_nouveau === 'TRANSMISE_AU_PASTEUR')
                                                        : null;
                                                    const conducteurActeur = hist?.acteur || activeActe.conducteur;
                                                    const validatedAt = hist?.created_at || activeActe.updated_at;
                                                    return (<>
                                                        {conducteurActeur && (
                                                            <DetailRow
                                                                label="Validé par (conducteur)"
                                                                value={`${conducteurActeur.prenom} ${conducteurActeur.nom}`}
                                                            />
                                                        )}
                                                        {conducteurActeur?.telephone && (
                                                            <DetailRow
                                                                label="Tél. conducteur"
                                                                value={
                                                                    <a href={`tel:${conducteurActeur.telephone}`} style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>
                                                                        📞 {conducteurActeur.telephone}
                                                                    </a>
                                                                }
                                                            />
                                                        )}
                                                        {conducteurActeur?.email && (
                                                            <DetailRow
                                                                label="Email conducteur"
                                                                value={
                                                                    <a href={`mailto:${conducteurActeur.email}`} style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>
                                                                        ✉️ {conducteurActeur.email}
                                                                    </a>
                                                                }
                                                            />
                                                        )}
                                                        {validatedAt && (
                                                            <DetailRow
                                                                label="Transmis au pasteur le"
                                                                value={formatDateTime(validatedAt)}
                                                            />
                                                        )}
                                                    </>);
                                                })()}
                                                <DetailRow
                                                    label="Date souhaitée"
                                                    value={formatDate(
                                                        activeActe.date_souhaitee ||
                                                        activeActe.details?.date_souhaitee ||
                                                        activeActe.details?.date_presentation ||
                                                        activeActe.details?.date_deces ||
                                                        activeActe.details?.date_naissance ||
                                                        activeActe.date_annonce,
                                                    )}
                                                />
                                                <div className="modal-sep">
                                                    Détails soumis
                                                </div>
                                                <div className="modal-detail-box">
                                                    {Object.keys(
                                                        activeActe.details ||
                                                            {},
                                                    ).length === 0 && (
                                                        <span className="modal-empty">
                                                            Aucun détail.
                                                        </span>
                                                    )}
                                                    {Object.entries(
                                                        activeActe.details || {},
                                                    ).filter(([k, v]) => {
                                                        // Exclure les champs techniques, booléens internes et valeurs vides
                                                        const SKIP = ['decl1','decl2','decl3','contenu','titre','message','heure_culte','temoignage_public','motif','ceremonie_statut','ceremonie_transmise_pasteur_at','fiche_conducteur_envoye','fiche_pasteur_envoyee','fiche_bapteme_envoyee'];
                                                        if (SKIP.includes(k)) return false;
                                                        if (v === null || v === undefined || v === '' || v === false) return false;
                                                        return true;
                                                    }).map(([k, v]) => (
                                                        <div
                                                            key={k}
                                                            className="modal-detail-row"
                                                        >
                                                            <span className="modal-key">
                                                                {prettyKey(k)}
                                                            </span>
                                                            <span className="modal-val">
                                                                {String(v)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <div className="modal-foot">
                            {activeActe?.statut === "TRANSMISE_AU_PASTEUR" && (
                                <button
                                    className="btn-modal btn-ghost"
                                    onClick={() => {
                                        const type = String(
                                            activeActe.type_acte || "",
                                        ).toLowerCase();
                                        const url =
                                            type === "naissance" ||
                                            type === "deces"
                                                ? `/pasteur/liturgie/${activeActe.id}/fiche?preview=1`
                                                : `/pasteur/liturgie/${activeActe.id}/fiche-conducteur?preview=1`;
                                        window.open(url, "_blank");
                                    }}
                                >
                                    Voir la fiche du conducteur
                                </button>
                            )}
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeModal}
                            >
                                Fermer
                            </button>
                            <button
                                className="btn-modal btn-refuse-modal"
                                onClick={() => setModal("refuse")}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                Refuser
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                onClick={() => setModal("validate")}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "ceremony" && activeActe && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon blue">
                                    <svg
                                        width="16"
                                        height="16"
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
                                </div>
                                <div className="modal-title">Date choisie</div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <DetailRow
                                label="Référence"
                                value={activeActe.reference}
                                mono
                            />
                            <DetailRow
                                label="Type d'acte"
                                value={prettyType(activeActe.type_acte)}
                            />
                            <DetailRow
                                label="Membre"
                                value={`${activeActe.membre?.prenom || ""} ${activeActe.membre?.nom || ""}`}
                            />
                            <DetailRow
                                label="Date choisie"
                                value={formatDate(
                                    activeActe.details?.date_souhaitee ||
                                        activeActe.date_souhaitee,
                                )}
                            />
                            <DetailRow
                                label="Créneau"
                                value={
                                    activeActe.details?.ceremonie_creneau ===
                                    "matin"
                                        ? "Matin"
                                        : activeActe.details
                                                ?.ceremonie_creneau ===
                                            "apres_midi"
                                          ? "Après-midi"
                                          : "—"
                                }
                            />
                            <DetailRow
                                label="Lieu"
                                value={
                                    activeActe.details?.lieu_ceremonie || "—"
                                }
                            />
                            <DetailRow
                                label="Témoins"
                                value={activeActe.details?.temoins || "—"}
                            />
                            {activeActe.details
                                ?.ceremonie_commentaire_conducteur && (
                                <DetailRow
                                    label="Commentaire conducteur"
                                    value={
                                        activeActe.details
                                            ?.ceremonie_commentaire_conducteur
                                    }
                                />
                            )}
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeModal}
                            >
                                Fermer
                            </button>
                            {activeActe.details?.ceremonie_statut ===
                                "CEREMONIE_TRANSMISE_AU_PASTEUR" && (
                                <>
                                    <button
                                        className="btn-modal btn-refuse-modal"
                                        onClick={() =>
                                            submitCeremonyDecision(
                                                activeActe.id,
                                                "CEREMONIE_REFUSEE_PAR_PASTEUR",
                                            )
                                        }
                                    >
                                        Refuser la date
                                    </button>
                                    <button
                                        className="btn-modal btn-gold"
                                        onClick={() =>
                                            submitCeremonyDecision(
                                                activeActe.id,
                                                "CEREMONIE_VALIDEE_PAR_PASTEUR",
                                            )
                                        }
                                    >
                                        Valider la date
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {modal === "create" && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon blue">
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                </div>
                                <div className="modal-title">Créer un acte</div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="acte-form-root">
                                <div className="acte-form">
                                    <Field label="Type d'acte" required>
                                        <select
                                            className="modal-input"
                                            value={createForm.type_acte}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    type_acte: e.target.value,
                                                    details: {},
                                                }))
                                            }
                                        >
                                            <option value="">— Sélectionner —</option>
                                            {ACTE_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Membre concerné" required>
                                        <select
                                            className="modal-input"
                                            value={createForm.membre_id}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">— Sélectionner un membre —</option>
                                            {familyMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom || ""} {m.nom || ""}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Date souhaitée" required>
                                        <input
                                            type="date"
                                            className="modal-input"
                                            value={createForm.date_souhaitee}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    date_souhaitee: e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Note / contexte">
                                        <textarea
                                            className="modal-textarea"
                                            rows={3}
                                            placeholder="Ajoutez un contexte ou des précisions..."
                                            value={createForm.message}
                                            onChange={(e) =>
                                                setCreateForm((prev) => ({
                                                    ...prev,
                                                    message: e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    {requiredActeFields.map((field) => (
                                        <Field
                                            key={field}
                                            label={ACTE_DETAIL_LABELS[field] || field}
                                            required
                                        >
                                            <input
                                                className="modal-input"
                                                type={ACTE_DETAIL_INPUT_TYPES[field] || "text"}
                                                value={createForm.details?.[field] || ""}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        details: {
                                                            ...(prev.details || {}),
                                                            [field]: e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                disabled={processing}
                                onClick={submitCreate}
                            >
                                {processing ? "Traitement..." : "Créer l'acte"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "validate" && activeActe && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon gold">
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <div className="modal-title">
                                    Validation pastorale
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-acte-recap">
                                {activeActe.membre?.profile_photo_url ? (
                                    <img
                                        src={
                                            activeActe.membre.profile_photo_url
                                        }
                                        alt={
                                            activeActe.membre?.prenom +
                                            " " +
                                            activeActe.membre?.nom
                                        }
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            marginRight: "12px",
                                        }}
                                    />
                                ) : (
                                    <span className="modal-acte-emoji">
                                        {iconEmoji(activeActe.type_acte)}
                                    </span>
                                )}
                                <div>
                                    <div className="modal-acte-name">
                                        {prettyType(activeActe.type_acte)} —{" "}
                                        {activeActe.membre?.prenom}{" "}
                                        {activeActe.membre?.nom}
                                    </div>
                                    <div className="modal-acte-ref">
                                        Réf. {activeActe.reference || "—"}
                                    </div>
                                </div>
                            </div>
                            <p className="modal-help">
                                <svg
                                    width="14"
                                    height="14"
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
                                </svg>
                                Cette action valide définitivement l'acte et
                                génère le certificat. Ajoutez une note
                                pastorale.
                            </p>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Note pastorale{" "}
                                    <span className="modal-optional">
                                        (optionnelle)
                                    </span>
                                </label>
                                <textarea
                                    className="modal-textarea"
                                    value={commentaire}
                                    onChange={(e) =>
                                        setCommentaire(e.target.value)
                                    }
                                    placeholder="Ex : Que la grâce de Dieu accompagne cette étape…"
                                />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                disabled={processing}
                                onClick={() => submitDecision("VALIDEE")}
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="spin"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Confirmer la validation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "refuse" && activeActe && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon red">
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </div>
                                <div className="modal-title">
                                    Refus pastoral
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-acte-recap">
                                {activeActe.membre?.profile_photo_url ? (
                                    <img
                                        src={
                                            activeActe.membre.profile_photo_url
                                        }
                                        alt={
                                            activeActe.membre?.prenom +
                                            " " +
                                            activeActe.membre?.nom
                                        }
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            marginRight: "12px",
                                        }}
                                    />
                                ) : (
                                    <span className="modal-acte-emoji">
                                        {iconEmoji(activeActe.type_acte)}
                                    </span>
                                )}
                                <div>
                                    <div className="modal-acte-name">
                                        {prettyType(activeActe.type_acte)} —{" "}
                                        {activeActe.membre?.prenom}{" "}
                                        {activeActe.membre?.nom}
                                    </div>
                                    <div className="modal-acte-ref">
                                        Réf. {activeActe.reference || "—"}
                                    </div>
                                </div>
                            </div>
                            <p className="modal-help warn">
                                <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                    />
                                </svg>
                                Le motif est obligatoire. Le conducteur et le
                                membre seront notifiés automatiquement.
                            </p>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Motif du refus{" "}
                                    <span className="modal-required">*</span>
                                </label>
                                <textarea
                                    className="modal-textarea"
                                    value={commentaire}
                                    onChange={(e) =>
                                        setCommentaire(e.target.value)
                                    }
                                    placeholder="Expliquez clairement la raison du refus pastoral…"
                                />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-modal btn-refuse-modal"
                                disabled={processing}
                                onClick={() =>
                                    submitDecision("REFUSEE_PAR_PASTEUR")
                                }
                            >
                                {processing ? (
                                    "Traitement..."
                                ) : (
                                    <>
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                        Confirmer le refus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ficheModalOpen && (
                <div className="modal-overlay open" onClick={closeFicheModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: 560, borderRadius: 20,
                        boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
                        overflow: "hidden", background: "#ffffff",
                    }}>
                        {/* HEADER */}
                        <div style={{
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                            padding: "22px 24px 20px", borderBottom: "1px solid #f0f0f0",
                            background: "linear-gradient(to bottom,#fafbff,#ffffff)",
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: "linear-gradient(135deg,#fce7f3,#ede9fe)",
                                    border: "1px solid #fbcfe8", display: "flex",
                                    alignItems: "center", justifyContent: "center", color: "#ec4899",
                                }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 3, letterSpacing: "-0.01em" }}>
                                        Fiche finale — Mariages
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                                        Envoi consolidé au pasteur ou responsable
                                    </div>
                                </div>
                            </div>
                            <button onClick={closeFicheModal} style={{
                                width: 32, height: 32, borderRadius: 8, background: "#f1f5f9",
                                border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* BODY */}
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {unsentCeremonyActes.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-title">Aucune fiche en attente</div>
                                    <div className="empty-sub">Les fiches ont toutes été envoyées.</div>
                                </div>
                            ) : (
                                <>
                                    {/* BATCH DATE SELECTOR */}
                                    {unsentBatchDates.length > 1 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                                Jour de demande
                                            </label>
                                            <select
                                                className="modal-select"
                                                value={selectedFicheBatchDate}
                                                onChange={(e) => setSelectedFicheBatchDate(e.target.value)}
                                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" }}
                                            >
                                                {unsentBatchDates.map((batchDate) => (
                                                    <option key={`batch-${batchDate}`} value={batchDate}>
                                                        {formatDate(`${batchDate}T00:00:00`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* PREVIEW BUTTON */}
                                    <button
                                        type="button"
                                        onClick={() => { if (ficheMariageFinaleLink) window.open(ficheMariageFinaleLink, "_blank"); }}
                                        disabled={!ficheMariageFinaleLink}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            width: "100%", padding: "11px 16px", borderRadius: 10,
                                            border: "1.5px dashed #cbd5e1", background: "transparent",
                                            color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        }}
                                    >
                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Consulter la fiche PDF
                                    </button>

                                    {/* SEPARATOR */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                                            Composition du mail
                                        </span>
                                        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                                    </div>

                                    {/* DESTINATAIRE */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Destinataire
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <input
                                                type="email"
                                                className="fbap-input"
                                                placeholder="contact@eglise.org"
                                                value={ficheEmailForm.destinataire}
                                                onChange={(e) => setFicheEmailForm((prev) => ({ ...prev, destinataire: e.target.value }))}
                                                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13.5, color: "#0f172a", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>

                                    {/* OBJET */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Objet
                                        </label>
                                        <input
                                            type="text"
                                            className="fbap-input"
                                            placeholder="Objet du mail"
                                            value={ficheEmailForm.subject}
                                            onChange={(e) => setFicheEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13.5, color: "#0f172a", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                                        />
                                    </div>

                                    {/* CONTENU */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Contenu du mail
                                        </label>
                                        <textarea
                                            className="fbap-input"
                                            rows={4}
                                            placeholder="Contenu du message"
                                            value={ficheEmailForm.message}
                                            onChange={(e) => setFicheEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                                            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13, color: "#334155", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.65, boxSizing: "border-box" }}
                                        />
                                    </div>

                                </>
                            )}
                        </div>

                        {/* FOOTER */}
                        {unsentCeremonyActes.length > 0 && (
                            <div style={{
                                display: "flex", justifyContent: "flex-end", gap: 10,
                                padding: "16px 24px", borderTop: "1px solid #f0f0f0", background: "#fafbff",
                            }}>
                                <button onClick={closeFicheModal} style={{
                                    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                                    background: "white", color: "#64748b", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", fontFamily: "inherit",
                                }}>
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSendFiche}
                                    disabled={sendingFiche}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 7,
                                        padding: "10px 22px", borderRadius: 10, border: "none",
                                        background: sendingFiche ? "#e2e8f0" : "linear-gradient(135deg,#ec4899,#a855f7)",
                                        color: sendingFiche ? "#94a3b8" : "white",
                                        fontSize: 13, fontWeight: 700, cursor: sendingFiche ? "not-allowed" : "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: sendingFiche ? "none" : "0 4px 14px rgba(168,85,247,0.35)",
                                    }}
                                >
                                    {sendingFiche ? (
                                        <>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Envoi en cours…
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Envoyer le mail
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                MODAL FICHE BAPTEME
            ══════════════════════════════════════════════════ */}
            {ficheBaptemeModalOpen && (
                <div className="modal-overlay open" onClick={closeFicheBaptemeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: 560, borderRadius: 20,
                        boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
                        overflow: "hidden", background: "#ffffff",
                    }}>
                        {/* HEADER */}
                        <div style={{
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                            padding: "22px 24px 20px", borderBottom: "1px solid #f0f0f0",
                            background: "linear-gradient(to bottom,#fafbff,#ffffff)",
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: "linear-gradient(135deg,#dbeafe,#ede9fe)",
                                    border: "1px solid #bfdbfe", display: "flex",
                                    alignItems: "center", justifyContent: "center", color: "#3b82f6",
                                }}>
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 3, letterSpacing: "-0.01em" }}>
                                        Fiche finale — Baptêmes
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                                        Envoi consolidé au pasteur ou responsable
                                    </div>
                                </div>
                            </div>
                            <button onClick={closeFicheBaptemeModal} style={{
                                width: 32, height: 32, borderRadius: 8, background: "#f1f5f9",
                                border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* BODY */}
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {unsentBaptemeActes.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-title">Aucune demande en attente</div>
                                    <div className="empty-sub">Toutes les fiches baptême ont été envoyées.</div>
                                </div>
                            ) : (
                                <>
                                    {/* PREVIEW BUTTON */}
                                    <button
                                        type="button"
                                        onClick={() => { if (ficheBaptemeListLink) window.open(ficheBaptemeListLink, "_blank"); }}
                                        disabled={!ficheBaptemeListLink}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            width: "100%", padding: "11px 16px", borderRadius: 10,
                                            border: "1.5px dashed #cbd5e1", background: "transparent",
                                            color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        }}
                                    >
                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Consulter la fiche PDF
                                    </button>

                                    {/* SEPARATOR */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                                            Composition du mail
                                        </span>
                                        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                                    </div>

                                    {/* DESTINATAIRE */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Destinataire
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <input
                                                type="email"
                                                className="fbap-input"
                                                placeholder="contact@eglise.org"
                                                value={ficheBaptemeEmailForm.destinataire}
                                                onChange={(e) => setFicheBaptemeEmailForm((prev) => ({ ...prev, destinataire: e.target.value }))}
                                                style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13.5, color: "#0f172a", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>

                                    {/* OBJET */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Objet
                                        </label>
                                        <input
                                            type="text"
                                            className="fbap-input"
                                            placeholder="Objet du mail"
                                            value={ficheBaptemeEmailForm.subject}
                                            onChange={(e) => setFicheBaptemeEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13.5, color: "#0f172a", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                                        />
                                    </div>

                                    {/* CONTENU */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            Contenu du mail
                                        </label>
                                        <textarea
                                            className="fbap-input"
                                            rows={4}
                                            placeholder="Contenu du message"
                                            value={ficheBaptemeEmailForm.message}
                                            onChange={(e) => setFicheBaptemeEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                                            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fafafa", fontSize: 13, color: "#334155", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.65, boxSizing: "border-box" }}
                                        />
                                    </div>

                                </>
                            )}
                        </div>

                        {/* FOOTER */}
                        {unsentBaptemeActes.length > 0 && (
                            <div style={{
                                display: "flex", justifyContent: "flex-end", gap: 10,
                                padding: "16px 24px", borderTop: "1px solid #f0f0f0", background: "#fafbff",
                            }}>
                                <button onClick={closeFicheBaptemeModal} style={{
                                    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                                    background: "white", color: "#64748b", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", fontFamily: "inherit",
                                }}>
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSendFicheBapteme}
                                    disabled={sendingFicheBapteme}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 7,
                                        padding: "10px 22px", borderRadius: 10, border: "none",
                                        background: sendingFicheBapteme ? "#e2e8f0" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                                        color: sendingFicheBapteme ? "#94a3b8" : "white",
                                        fontSize: 13, fontWeight: 700, cursor: sendingFicheBapteme ? "not-allowed" : "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: sendingFicheBapteme ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
                                    }}
                                >
                                    {sendingFicheBapteme ? (
                                        <>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Envoi en cours…
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Envoyer le mail
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

                    {/* ════════════════ TAB MES DEMANDES ════════════════ */}
                    {activeTab === "mes_demandes" && (
                        <div className="panel layout-full">
                            <div className="panel-head">
                                <div className="panel-title">Mes demandes d'actes liturgiques</div>
                                <div className="panel-sub">Actes que vous avez soumis pour les membres de votre famille</div>
                            </div>
                            {mesDemandes.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}>
                                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune demande</div>
                                    <div style={{ fontSize: 12 }}>Vous n'avez pas encore soumis de demande d'acte liturgique.</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ borderBottom: "2px solid #e8e8f0" }}>
                                                {["Référence", "Type", "Membre", "Classe", "Date souhaitée", "Soumis le", "Statut", "Télécharger"].map(h => (
                                                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#1e2070", whiteSpace: "nowrap" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mesDemandes.map((d, i) => {
                                                const statutColors = {
                                                    SOUMISE: ["#dbeafe","#1d4ed8"],
                                                    EN_ATTENTE_CONDUCTEUR: ["#fef3c7","#b45309"],
                                                    TRANSMISE_AU_PASTEUR: ["#e0e7ff","#4338ca"],
                                                    VALIDEE: ["#dcfce7","#15803d"],
                                                    CELEBRE: ["#d1fae5","#065f46"],
                                                    TERMINE: ["#f0fdf4","#166534"],
                                                    REFUSEE_PAR_CONDUCTEUR: ["#fee2e2","#dc2626"],
                                                    REFUSEE_PAR_PASTEUR: ["#fee2e2","#dc2626"],
                                                };
                                                const [bg, color] = statutColors[d.statut] || ["#f3f4f6","#374151"];
                                                const typeLabels = { bapteme:"Baptême", mariage:"Mariage", naissance:"Naissance", deces:"Décès", premiere_communion:"1re Communion", confirmation:"Confirmation", bapteme_premiere_communion:"Baptême + 1re Communion" };
                                                return (
                                                    <tr key={d.id} style={{ borderBottom: "1px solid #f0f0f8", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                                        <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#666", fontSize: 11 }}>{d.reference || "-"}</td>
                                                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e2070" }}>{typeLabels[d.type_acte] || d.type_acte}</td>
                                                        <td style={{ padding: "10px 14px" }}>{d.membre ? `${d.membre.prenom} ${d.membre.nom}` : "-"}</td>
                                                        <td style={{ padding: "10px 14px", color: "#666" }}>{d.classe?.nom || "-"}</td>
                                                        <td style={{ padding: "10px 14px", color: "#666" }}>{d.date_souhaitee || "-"}</td>
                                                        <td style={{ padding: "10px 14px", color: "#999", fontSize: 12 }}>{d.created_at}</td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>
                                                                {d.statut?.replace(/_/g, " ")}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "10px 14px" }}>
                                                            {d.can_download ? (
                                                                <a
                                                                    href={`/pasteur/liturgie/${d.id}/fiche`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "#1e2070", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                                                                >
                                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                    PDF
                                                                </a>
                                                            ) : (
                                                                <span style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>Non disponible</span>
                                                            )}
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

            {/* ══════════════════════════════════════════════════
                MODALS ANNONCES — VALIDATION
            ══════════════════════════════════════════════════ */}
            {annModal === "detail" && activeAnnonce && (
                <div className="modal-overlay open" onClick={closeAnnModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon blue">
                                    <svg
                                        width="16"
                                        height="16"
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
                                </div>
                                <div className="modal-title">
                                    Détail de l'annonce
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAnnModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const t = ANNONCE_TYPES.find(
                                    (x) =>
                                        x.value ===
                                        (activeAnnonce.type_annonce ||
                                            activeAnnonce.type_acte),
                                );
                                return (
                                    <div className="modal-acte-recap">
                                        <span
                                            className="modal-acte-emoji"
                                            style={{ fontSize: 26 }}
                                        >
                                            {t?.emoji || "📢"}
                                        </span>
                                        <div>
                                            <div className="modal-acte-name">
                                                {t?.label ||
                                                    activeAnnonce.type_annonce}
                                            </div>
                                            <div className="modal-acte-ref">
                                                {activeAnnonce.membre
                                                    ? `${activeAnnonce.membre.prenom} ${activeAnnonce.membre.nom}`
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {activeAnnonce.createur && (
                                <DetailRow
                                    label="Soumis par"
                                    value={
                                        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <span style={{ fontWeight: 700 }}>
                                                {activeAnnonce.createur.prenom} {activeAnnonce.createur.nom}
                                            </span>
                                            {activeAnnonce.createur.role && (
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: "2px 8px",
                                                    borderRadius: 20,
                                                    background: "rgba(99,102,241,0.12)",
                                                    color: "#4f46e5",
                                                    border: "1px solid rgba(99,102,241,0.25)",
                                                }}>
                                                    {{
                                                        responsable_famille: "Responsable de famille",
                                                        conducteur: "Conducteur",
                                                        pasteur: "Pasteur",
                                                        admin: "Administrateur",
                                                        membre: "Membre",
                                                    }[activeAnnonce.createur.role] || activeAnnonce.createur.role}
                                                </span>
                                            )}
                                        </span>
                                    }
                                />
                            )}
                            <DetailRow
                                label="Soumise le"
                                value={formatDateTime(activeAnnonce.created_at)}
                            />
                            <DetailRow
                                label="Statut"
                                value={activeAnnonce.statut}
                            />
                            <DetailRow
                                label="Classe"
                                value={activeAnnonce.classe?.nom || "—"}
                            />
                            <DetailRow
                                label="Transmis au pasteur le"
                                value={formatDateTime(activeAnnonce.updated_at || activeAnnonce.validated_at)}
                            />
                            <DetailRow
                                label="Validé par (conducteur)"
                                value={
                                    activeAnnonce.conducteur
                                        ? `${activeAnnonce.conducteur.prenom} ${activeAnnonce.conducteur.nom}`
                                        : "—"
                                }
                            />
                            {activeAnnonce.conducteur?.telephone && (
                                <DetailRow
                                    label="Tél. conducteur"
                                    value={
                                        <a
                                            href={`tel:${activeAnnonce.conducteur.telephone}`}
                                            style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                                        >
                                            📞 {activeAnnonce.conducteur.telephone}
                                        </a>
                                    }
                                />
                            )}
                            {activeAnnonce.conducteur?.email && (
                                <DetailRow
                                    label="Email conducteur"
                                    value={
                                        <a
                                            href={`mailto:${activeAnnonce.conducteur.email}`}
                                            style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                                        >
                                            ✉️ {activeAnnonce.conducteur.email}
                                        </a>
                                    }
                                />
                            )}
                            {activeAnnonce.date_annonce && (
                                <DetailRow
                                    label="Date événement"
                                    value={formatDate(
                                        activeAnnonce.date_annonce,
                                    )}
                                />
                            )}
                            {(() => {
                                const motifVal = activeAnnonce.details?.motif;
                                const motifLabel = motifVal
                                    ? ([...MOTIFS_GRACE, ...MOTIFS_INTERCESSION].find(m => m.value === motifVal)?.label || motifVal)
                                    : null;
                                return motifLabel ? (
                                    <DetailRow
                                        label="Motif"
                                        value={
                                            <span style={{ fontWeight: 700, color: '#7c3aed' }}>
                                                {motifLabel}
                                            </span>
                                        }
                                    />
                                ) : null;
                            })()}
                            {activeAnnonce.details?.heure_culte && (
                                <DetailRow
                                    label="Heure du culte"
                                    value={activeAnnonce.details.heure_culte}
                                />
                            )}
                            {activeAnnonce.details?.temoignage_public !== undefined && activeAnnonce.details?.temoignage_public !== null && (
                                <DetailRow
                                    label="Témoignage public"
                                    value={activeAnnonce.details.temoignage_public ? '✅ Oui' : '❌ Non'}
                                />
                            )}
                            <div className="modal-sep">Message</div>
                            <div
                                className="modal-detail-box"
                                style={{
                                    fontStyle: "normal",
                                    fontSize: 13.5,
                                    lineHeight: 1.7,
                                }}
                            >
                                {activeAnnonce.details?.contenu ||
                                    activeAnnonce.message ||
                                    "(Sans message)"}
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeAnnModal}
                            >
                                Fermer
                            </button>
                            <button
                                className="btn-modal btn-refuse-modal"
                                onClick={() => setAnnModal("refuse")}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                Refuser
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                onClick={() => setAnnModal("validate")}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                ★★★ MODAL NOUVELLE ANNONCE PASTEUR — 3 ÉTAPES ★★★
            ════════════════════════════════════════════ */}
            {annModal === "create" && (
                <div className="modal-overlay open" onClick={closeAnnModal}>
                    <div
                        className="modal ann-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head ann-modal-head">
                            <div>
                                <div className="modal-title">
                                    {annonceStep === 1 &&
                                        "✦ Nouvelle demande de prière pastorale"}
                                    {annonceStep === 2 &&
                                        `${selectedType?.emoji || "🙏"} ${selectedType?.label || "Demande de prière"}`}
                                    {annonceStep === 3 &&
                                        "✓ Confirmation avant soumission"}
                                </div>
                                <div className="modal-sub">
                                    Étape {annonceStep} / 3 · En tant que
                                    pasteur, vous pouvez créer une annonce pour
                                    vos membres
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAnnModal}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Steps bar */}
                        <div className="ann-steps-bar">
                            {["Type d'annonce", "Contenu", "Confirmation"].map(
                                (s, i) => (
                                    <div
                                        key={i}
                                        className={`asb-step ${annonceStep > i + 1 ? "done" : annonceStep === i + 1 ? "active" : ""}`}
                                    >
                                        <div className="asb-dot">
                                            {annonceStep > i + 1 ? "✓" : i + 1}
                                        </div>
                                        <span>{s}</span>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className="modal-body">
                            {/* ÉTAPE 1 — Choix du type */}
                            {annonceStep === 1 && (
                                <div>
                                    <p
                                        style={{
                                            fontSize: 12.5,
                                            color: "var(--text2)",
                                            marginBottom: 14,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Sélectionnez le type d'annonce que vous
                                        souhaitez créer pour un membre de votre
                                        communauté.
                                    </p>
                                    <div className="ann-type-grid">
                                        {ANNONCE_TYPES.map((t) => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                className={`ann-type-btn atype-${t.color} ${annonceForm.type_annonce === t.value ? "sel" : ""}`}
                                                onClick={() =>
                                                    setAnnonceForm((f) => ({
                                                        ...f,
                                                        type_annonce: t.value,
                                                        motif: "",
                                                    }))
                                                }
                                            >
                                                <span className="atb-emoji">
                                                    {t.emoji}
                                                </span>
                                                <span className="atb-label">
                                                    {t.label}
                                                </span>
                                                {annonceForm.type_annonce ===
                                                    t.value && (
                                                    <span className="atb-check">
                                                        ✓
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ÉTAPE 2 — Contenu */}
                            {annonceStep === 2 && (
                                <div className="ann-form">
                                    {(annonceForm.type_annonce === "grace" || annonceForm.type_annonce === "priere") && (
                                        <Field label="Motif" required>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                                {(annonceForm.type_annonce === "grace" ? MOTIFS_GRACE : MOTIFS_INTERCESSION).map((m) => (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        onClick={() => setAnnonceForm((f) => ({ ...f, motif: m.value }))}
                                                        style={{
                                                            padding: "6px 14px",
                                                            borderRadius: 20,
                                                            border: annonceForm.motif === m.value ? "2px solid #d97706" : "1.5px solid #d1d5db",
                                                            background: annonceForm.motif === m.value ? "#fffbeb" : "#fff",
                                                            color: annonceForm.motif === m.value ? "#b45309" : "#374151",
                                                            fontWeight: annonceForm.motif === m.value ? 700 : 400,
                                                            fontSize: 12,
                                                            cursor: "pointer",
                                                            transition: "all .15s",
                                                        }}
                                                    >
                                                        {annonceForm.motif === m.value && "✓ "}{m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </Field>
                                    )}
                                    {(annonceForm.type_annonce === "grace" || annonceForm.type_annonce === "priere") && (
                                        <Field label="Voulez-vous rendre publiquement témoignage ?">
                                            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                                {[{ val: true, label: "OUI" }, { val: false, label: "NON" }].map(({ val, label }) => (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => setAnnonceForm((f) => ({ ...f, temoignage_public: val }))}
                                                        style={{
                                                            padding: "6px 20px",
                                                            borderRadius: 20,
                                                            border: annonceForm.temoignage_public === val ? "2px solid #d97706" : "1.5px solid #d1d5db",
                                                            background: annonceForm.temoignage_public === val ? "#fffbeb" : "#fff",
                                                            color: annonceForm.temoignage_public === val ? "#b45309" : "#374151",
                                                            fontWeight: annonceForm.temoignage_public === val ? 700 : 400,
                                                            fontSize: 12,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                                Pour cas exceptionnel
                                            </div>
                                        </Field>
                                    )}
                                    <Field label="Membre concerné" required>
                                        <select
                                            className="ann-input"
                                            value={annonceForm.membre_id}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    membre_id: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                -- Sélectionnez un membre --
                                            </option>
                                            {familyMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.prenom} {m.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field
                                        label="Message de l'annonce"
                                        required
                                    >
                                        <textarea
                                            className="ann-textarea"
                                            rows={4}
                                            placeholder={getPlaceholder(
                                                annonceForm.type_annonce,
                                            )}
                                            value={annonceForm.message}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    message: e.target.value,
                                                }))
                                            }
                                        />
                                        <div className="ann-chars">
                                            {annonceForm.message.length}/500
                                        </div>
                                    </Field>
                                    <Field label="Date de l'événement" required>
                                        <input
                                            className="ann-input"
                                            type="date"
                                            value={annonceForm.date_annonce}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    date_annonce:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Date de publication">
                                        <input
                                            className="ann-input"
                                            type="date"
                                            value={annonceForm.date_publication}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    date_publication:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <Field label="Date d'expiration">
                                        <input
                                            className="ann-input"
                                            type="date"
                                            value={annonceForm.date_expiration}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({
                                                    ...f,
                                                    date_expiration:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                    <div className="ann-visibility">
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
                                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021.5 5.5v-1.565"
                                            />
                                        </svg>
                                        En tant que pasteur, cette annonce sera
                                        directement publiée sur le tableau
                                        paroissial
                                    </div>
                                </div>
                            )}

                            {/* ÉTAPE 3 — Récapitulatif */}
                            {annonceStep === 3 && (
                                <div className="ann-recap">
                                    <div
                                        className={`ann-recap-type atype-${selectedType?.color}`}
                                    >
                                        <span style={{ fontSize: 30 }}>
                                            {selectedType?.emoji}
                                        </span>
                                        <div>
                                            <div className="art-label">
                                                {selectedType?.label}
                                            </div>
                                            {selectedMotifLabel && (
                                                <div className="art-sub" style={{ fontWeight: 600 }}>
                                                    Motif : {selectedMotifLabel}
                                                </div>
                                            )}
                                            <div className="art-sub">
                                                Annonce pastorale
                                            </div>
                                        </div>
                                    </div>
                                    {annonceForm.membre_id && (
                                        <RecapRow
                                            label="Concerné(e)"
                                            value={(() => {
                                                const m = familyMembers.find(
                                                    (fm) =>
                                                        String(fm.id) ===
                                                        String(
                                                            annonceForm.membre_id,
                                                        ),
                                                );
                                                return m
                                                    ? `${m.prenom} ${m.nom}`
                                                    : "Membre";
                                            })()}
                                        />
                                    )}
                                    {annonceForm.date_annonce && (
                                        <RecapRow
                                            label="Date événement"
                                            value={formatDate(
                                                annonceForm.date_annonce,
                                            )}
                                        />
                                    )}
                                    {annonceForm.date_publication && (
                                        <RecapRow
                                            label="Publication"
                                            value={formatDate(
                                                annonceForm.date_publication,
                                            )}
                                        />
                                    )}
                                    {annonceForm.date_expiration && (
                                        <RecapRow
                                            label="Expiration"
                                            value={formatDate(
                                                annonceForm.date_expiration,
                                            )}
                                        />
                                    )}
                                    <div className="ann-recap-msg">
                                        <div className="arm-label">Message</div>
                                        <div className="arm-text">
                                            {annonceForm.message}
                                        </div>
                                    </div>
                                    <div className="ann-circuit-info ann-circuit-pastor">
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
                                                d="M12 2v20M2 12h20"
                                            />
                                        </svg>
                                        Publication directe par le{" "}
                                        <strong>Pasteur</strong> →{" "}
                                        <strong>Tableau paroissial</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-foot">
                            {annonceStep > 1 ? (
                                <button
                                    type="button"
                                    className="btn-mghost"
                                    onClick={() => setAnnonceStep((s) => s - 1)}
                                >
                                    ← Retour
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-mghost"
                                    onClick={closeAnnModal}
                                >
                                    Annuler
                                </button>
                            )}
                            {annonceStep < 3 ? (
                                <button
                                    type="button"
                                    className="btn-mnext"
                                    disabled={
                                        annonceStep === 1 &&
                                        !annonceForm.type_annonce
                                    }
                                    onClick={() => {
                                        if (
                                            annonceStep === 2 &&
                                            (annonceForm.type_annonce === "grace" || annonceForm.type_annonce === "priere") &&
                                            !annonceForm.motif
                                        ) {
                                            notify("Veuillez sélectionner un motif.");
                                            return;
                                        }
                                        if (
                                            annonceStep === 2 &&
                                            !annonceForm.membre_id
                                        ) {
                                            notify(
                                                "Veuillez sélectionner un membre.",
                                            );
                                            return;
                                        }
                                        if (
                                            annonceStep === 2 &&
                                            !annonceForm.message.trim()
                                        ) {
                                            notify(
                                                "Le message est obligatoire.",
                                            );
                                            return;
                                        }
                                        if (
                                            annonceStep === 2 &&
                                            !annonceForm.date_annonce
                                        ) {
                                            notify(
                                                "La date de l'annonce est requise.",
                                            );
                                            return;
                                        }
                                        setAnnonceStep((s) => s + 1);
                                    }}
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-msubmit"
                                    disabled={annonceProcessing}
                                    onClick={submitAnnonce}
                                >
                                    {annonceProcessing ? (
                                        <>
                                            <svg
                                                width="13"
                                                height="13"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="spin"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                            Publication...
                                        </>
                                    ) : (
                                        <>✦ Publier l'annonce</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {annModal === "validate" && activeAnnonce && (
                <div className="modal-overlay open" onClick={closeAnnModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon gold">
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <div className="modal-title">
                                    Validation pastorale — Annonce
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAnnModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const t = ANNONCE_TYPES.find(
                                    (x) =>
                                        x.value ===
                                        (activeAnnonce.type_annonce ||
                                            activeAnnonce.type_acte),
                                );
                                return (
                                    <div className="modal-acte-recap">
                                        <span
                                            className="modal-acte-emoji"
                                            style={{ fontSize: 26 }}
                                        >
                                            {t?.emoji || "📢"}
                                        </span>
                                        <div>
                                            <div className="modal-acte-name">
                                                {t?.label ||
                                                    activeAnnonce.type_annonce}
                                            </div>
                                            <div className="modal-acte-ref">
                                                {activeAnnonce.membre
                                                    ? `${activeAnnonce.membre.prenom} ${activeAnnonce.membre.nom}`
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <p className="modal-help">
                                <svg
                                    width="14"
                                    height="14"
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
                                </svg>
                                Cette action valide d'abord la demande de prière. La
                                publication sera choisie juste après.
                            </p>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Note pastorale{" "}
                                    <span className="modal-optional">
                                        (optionnelle)
                                    </span>
                                </label>
                                <textarea
                                    className="modal-textarea"
                                    value={annCommentaire}
                                    onChange={(e) =>
                                        setAnnCommentaire(e.target.value)
                                    }
                                    placeholder="Ex : Que la communauté accompagne cette famille dans la prière…"
                                />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeAnnModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                disabled={processing}
                                onClick={() => submitAnnDecision("VALIDEE")}
                            >
                                {processing ? (
                                    "Traitement..."
                                ) : (
                                    <>
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Valider
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {annModal === "publish_choice" && activeAnnonce && (
                <div className="modal-overlay open" onClick={closeAnnModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon violet">
                                    <svg
                                        width="16"
                                        height="16"
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
                                </div>
                                <div className="modal-title">
                                    Publication de l'annonce
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAnnModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-help">
                                L'annonce est validée par le pasteur.
                                Voulez-vous la publier sur le dashboard de tous
                                les membres connectés ?
                            </p>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeAnnModal}
                            >
                                Ne pas publier
                            </button>
                            <button
                                className="btn-modal btn-gold"
                                disabled={processing}
                                onClick={() => submitAnnDecision("PUBLIEE")}
                            >
                                {processing ? "Publication..." : "Publier"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {annModal === "refuse" && activeAnnonce && (
                <div className="modal-overlay open" onClick={closeAnnModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div className="modal-head-icon red">
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </div>
                                <div className="modal-title">
                                    Refus pastoral — Annonce
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAnnModal}
                            >
                                <svg
                                    width="13"
                                    height="13"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const t = ANNONCE_TYPES.find(
                                    (x) =>
                                        x.value ===
                                        (activeAnnonce.type_annonce ||
                                            activeAnnonce.type_acte),
                                );
                                return (
                                    <div className="modal-acte-recap">
                                        <span
                                            className="modal-acte-emoji"
                                            style={{ fontSize: 26 }}
                                        >
                                            {t?.emoji || "📢"}
                                        </span>
                                        <div>
                                            <div className="modal-acte-name">
                                                {t?.label ||
                                                    activeAnnonce.type_annonce}
                                            </div>
                                            <div className="modal-acte-ref">
                                                {activeAnnonce.membre
                                                    ? `${activeAnnonce.membre.prenom} ${activeAnnonce.membre.nom}`
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <p className="modal-help warn">
                                <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                    />
                                </svg>
                                Le motif est obligatoire. La famille sera
                                notifiée automatiquement.
                            </p>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Motif du refus{" "}
                                    <span className="modal-required">*</span>
                                </label>
                                <textarea
                                    className="modal-textarea"
                                    value={annCommentaire}
                                    onChange={(e) =>
                                        setAnnCommentaire(e.target.value)
                                    }
                                    placeholder="Expliquez clairement la raison du refus pastoral…"
                                />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-ghost"
                                onClick={closeAnnModal}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-modal btn-refuse-modal"
                                disabled={processing}
                                onClick={() =>
                                    submitAnnDecision("REFUSEE_PAR_PASTEUR")
                                }
                            >
                                {processing ? (
                                    "Traitement..."
                                ) : (
                                    <>
                                        <svg
                                            width="13"
                                            height="13"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                        Confirmer le refus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

/* ── HELPERS ── */
function DetailRow({ label, value, mono }) {
    return (
        <div className="modal-info-row">
            <span className="modal-key">{label}</span>
            <span className={`modal-val ${mono ? "mono" : ""}`}>
                {value || "—"}
            </span>
        </div>
    );
}
function ceremonyDecisionLabel(v) {
    const labels = {
        CEREMONIE_SOUMISE_AU_CONDUCTEUR:  "Date soumise au conducteur",
        CEREMONIE_TRANSMISE_AU_PASTEUR:   "Date transmise au pasteur",
        CEREMONIE_VALIDEE_PAR_PASTEUR:    "Date validée par le pasteur",
        CEREMONIE_REFUSEE_PAR_CONDUCTEUR: "Date refusée par le conducteur",
        CEREMONIE_REFUSEE_PAR_PASTEUR:    "Date refusée par le pasteur",
    };
    return labels[v] || v || "—";
}

function prettyType(type) {
    const m = {
        bapteme: "Baptême",
        premiere_communion: "Première Communion",
        confirmation: "Confirmation",
        mariage: "Mariage",
        naissance: "Naissance",
        deces: "Décès",
    };
    return m[type] || type || "Acte";
}
function finalStatusForType(type) {
    return type === "mariage" || type === "bapteme" ? "CELEBRE" : "TERMINE";
}
function finalLabelForType(type) {
    return type === "mariage" || type === "bapteme" ? "célébré" : "terminé";
}
function isFicheType(type) {
    const t = String(type || "").toLowerCase();
    return t === "naissance" || t === "deces";
}
function historyStatusLabel(status) {
    if (status === "VALIDEE") return "VALIDÉE";
    if (status === "CEREMONIE_TRANSMISE_AU_PASTEUR") return "DATE TRANSMISE";
    if (status === "CEREMONIE_VALIDEE_PAR_PASTEUR") return "DATE ACCEPTÉE";
    if (status === "CEREMONIE_REFUSEE_PAR_PASTEUR") return "DATE REFUSÉE";
    if (status === "REFUSEE_PAR_PASTEUR") return "REFUSÉE";
    if (status === "CELEBRE") return "CÉLÉBRÉ";
    if (status === "TERMINE") return "TERMINÉ";
    return status || "-";
}
function ceremonyStatusLabel(status) {
    if (status === "CEREMONIE_TRANSMISE_AU_PASTEUR") return "DATE TRANSMISE";
    if (status === "CEREMONIE_VALIDEE_PAR_PASTEUR") return "DATE ACCEPTÉE";
    if (status === "CEREMONIE_VALIDE_PAR_PASTEUR") return "DATE VALIDÉE";
    if (status === "CEREMONIE_REFUSEE_PAR_PASTEUR") return "DATE REFUSÉE";
    return historyStatusLabel(status);
}
function iconEmoji(type) {
    const m = {
        bapteme: "🕊️",
        premiere_communion: "🍞",
        confirmation: "✝️",
        mariage: "💍",
        naissance: "👶",
        deces: "🕯️",
    };
    return m[type] || "📜";
}
function prettyKey(key) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("fr-FR");
}

/* ── STYLES ── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box}

.pastor-page{
  --grad:linear-gradient(135deg,#6B46C1 0%,#1E40AF 50%,#B6C01A 100%);
  --surface:rgba(243,70,70,0.84);--surface2:rgba(255,255,255,0.9);--surface3:rgba(255,255,255,0.96);--surface-solid:rgba(255,255,255,0.98);
  --border:rgba(15,23,42,0.14);--border2:rgba(15,23,42,0.2);
  --gold:#EC7E7E;--gold2:#912424;--gold-dim:rgba(245,242,237,0.94);--gold-glow:rgba(239,236,228,0.92);--gold-border:rgba(201,168,76,0.3);
  --text:#0f172a;--text2:#334155;--text3:#3675F1;
  --violet:#9D8FE0;--violet-dim:rgba(157,143,224,0.12);--violet-border:rgba(157,143,224,0.28);
  --green:#4ADE80;--green-dim:rgba(74,222,128,0.1);--green-border:rgba(74,222,128,0.25);
  --red:#F87171;--red-dim:rgba(248,113,113,0.1);--red-border:rgba(248,113,113,0.25);
  --blue:#7EB6FF;--blue-dim:rgba(126,182,255,0.12);--blue-border:rgba(126,182,255,0.28);
  --ann:#A090D8;--ann-dim:rgba(160,144,216,0.12);--ann-border:rgba(160,144,216,0.28);
  background:var(--grad);color:var(--text);min-height:100vh;font-family:'Outfit',system-ui,sans-serif;position:relative;
}
.pastor-page::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;z-index:0}
.pastor-page::after{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 50% at 10% 10%,rgba(124,111,205,0.1),transparent 55%),radial-gradient(ellipse 50% 40% at 90% 90%,rgba(182,192,26,0.08),transparent 50%);pointer-events:none;z-index:0}
.main{position:relative;z-index:1;min-height:100vh}
.content{padding:28px 38px}

/* ════════════════════════════════════
   ★ HERO HEADER — Titre Validation
════════════════════════════════════ */
.hero-header{
  position:relative;margin-bottom:24px;border-radius:20px;overflow:hidden;
  border:1px solid rgba(255,255,255,0.18);
  box-shadow:0 20px 60px rgba(0,0,0,0.35),0 1px 0 rgba(255,255,255,0.1) inset;
}
.hero-header-bg{
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(107,70,193,0.95) 0%,rgba(30,64,175,0.92) 45%,rgba(16,36,70,0.98) 100%);
  backdrop-filter:blur(20px);
}
.hero-header-bg::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 60% 80% at 20% 50%,rgba(157,143,224,0.2),transparent 60%),
             radial-gradient(ellipse 40% 60% at 80% 20%,rgba(182,192,26,0.12),transparent 50%),
             radial-gradient(circle at 50% 100%,rgba(30,64,175,0.3),transparent 60%);
}
.hero-header-bg::after{
  content:'';position:absolute;inset:0;
  background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);
  background-size:20px 20px;
}
.hero-header-inner{
  position:relative;z-index:1;
  display:flex;align-items:center;gap:20px;
  padding:28px 32px;
  flex-wrap:wrap;
}
.btn-back{
  display:inline-flex;align-items:center;gap:7px;padding:9px 16px;
  border-radius:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);
  color:rgba(255,255,255,0.85);font-size:12.5px;font-weight:600;text-decoration:none;
  backdrop-filter:blur(8px);transition:all .2s;flex-shrink:0;
}
.btn-back:hover{background:rgba(255,255,255,0.18);color:#fff;border-color:rgba(255,255,255,0.35)}

.hero-header-center{
  flex:1;display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center;min-width:0;
}
.hero-cross-wrap{
  position:relative;width:52px;height:52px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.9);
}
.hero-cross-ring{
  position:absolute;inset:0;border-radius:50%;
  border:1.5px solid rgba(255,255,255,0.25);
  animation:crossPulse 3s ease-in-out infinite;
}
@keyframes crossPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.15)}50%{box-shadow:0 0 0 10px rgba(255,255,255,0)}}

.hero-title-block{text-align:center}
.hero-eyebrow{
  font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(182,192,26,0.9);margin-bottom:6px;
  display:inline-flex;align-items:center;gap:8px;
}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';width:20px;height:1px;background:rgba(182,192,26,0.4)}
h1.hero-title{
  font-size:26px;font-weight:800;color:#fff;line-height:1.15;margin:0 0 6px;
  text-shadow:0 2px 12px rgba(0,0,0,0.3);letter-spacing:-.3px;
}
.hero-subtitle{font-size:12px;color:rgba(255,255,255,0.55);letter-spacing:.04em}

.hero-stats-row{
  display:flex;align-items:center;gap:0;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
  border-radius:12px;overflow:hidden;backdrop-filter:blur(8px);
}
.hero-stat{padding:10px 20px;text-align:center}
.hero-stat-sep{width:1px;height:36px;background:rgba(255,255,255,0.12)}
.hero-stat-n{display:block;font-size:22px;font-weight:800;color:#fff;line-height:1}
.hero-stat-l{display:block;font-size:9.5px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;white-space:nowrap}

.hero-header-actions{display:flex;flex-direction:column;gap:8px;flex-shrink:0}
.btn-hero-annonce{
  display:inline-flex;align-items:center;gap:8px;padding:10px 18px;
  border-radius:10px;border:none;cursor:pointer;font-size:12.5px;font-weight:700;
  font-family:'Outfit',system-ui,sans-serif;transition:all .2s;white-space:nowrap;
  background:linear-gradient(90deg,rgba(157,143,224,0.9),rgba(91,63,175,0.9));
  color:#fff;box-shadow:0 4px 16px rgba(91,63,175,0.3);
}
.btn-hero-annonce:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(91,63,175,0.45)}
.btn-hero-acte{
  display:inline-flex;align-items:center;gap:8px;padding:10px 18px;
  border-radius:10px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;font-size:12.5px;font-weight:700;
  font-family:'Outfit',system-ui,sans-serif;transition:all .2s;white-space:nowrap;
  background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.9);
}
.btn-hero-acte:hover{background:rgba(255,255,255,0.18);color:#fff;transform:translateY(-1px)}

/* ════ BANNER ════ */
.attention-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--surface2);border:1px solid var(--border2);border-left:3px solid var(--gold);border-radius:12px;padding:16px 22px;margin-bottom:24px;backdrop-filter:blur(12px)}
.attention-icon-wrap{width:36px;height:36px;border-radius:9px;background:rgba(201,168,76,0.15);border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;color:var(--gold2);flex-shrink:0}
.attention-text{flex:1}.attention-title{font-size:13.5px;font-weight:700;color:var(--gold2);margin-bottom:3px}.attention-sub{font-size:12px;color:var(--text2)}

/* KPI */
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:22px 20px 18px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.08) inset;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden}
.kpi::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.05) 0%,transparent 60%);pointer-events:none}
.kpi:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.3)}
.kpi-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.kpi-icon-wrap{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.1)}
.kpi-icon-violet{background:var(--violet-dim);color:var(--violet)}.kpi-icon-gold{background:var(--gold-dim);color:var(--gold2)}.kpi-icon-green{background:var(--green-dim);color:var(--green)}.kpi-icon-ann{background:var(--ann-dim);color:var(--ann)}
.kpi-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}
.kpi-badge-violet{background:var(--violet-dim);color:var(--violet);border:1px solid var(--violet-border)}.kpi-badge-gold{background:var(--gold-dim);color:var(--gold2);border:1px solid var(--gold-border)}.kpi-badge-green{background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)}.kpi-badge-ann{background:var(--ann-dim);color:var(--ann);border:1px solid var(--ann-border)}
.kpi-number{font-size:40px;font-weight:700;line-height:1;color:var(--text);margin-bottom:4px}.kpi-label{font-size:12px;color:var(--text2);font-weight:500;margin-bottom:14px}
.kpi-progress{height:3px;background:rgba(255,255,255,0.08);border-radius:10px;overflow:hidden}
.kpi-progress-fill{height:100%;border-radius:10px;transition:width .7s ease}
.kpi-progress-fill.violet{background:var(--violet)}.kpi-progress-fill.gold{background:var(--gold)}.kpi-progress-fill.green{background:var(--green)}.kpi-progress-fill.ann{background:var(--ann)}

/* PASTORAL BOX */
.pastoral-box{display:flex;align-items:center;gap:20px;background:var(--surface2);border:1px solid var(--border2);border-radius:14px;padding:20px 26px;margin-bottom:24px;backdrop-filter:blur(12px)}
.pastoral-cross-icon{width:48px;height:48px;border-radius:13px;background:var(--gold-dim);border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;color:var(--gold2);flex-shrink:0}
.pastoral-content{flex:1}.pastoral-title{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}.pastoral-text{font-size:13px;color:var(--text2);line-height:1.7}.pastoral-text strong{color:var(--text);font-weight:600}
.pastoral-stats{display:flex;align-items:center;gap:0;flex-shrink:0}.pastoral-stat{text-align:center;padding:0 18px}.pastoral-stat-n{font-size:28px;font-weight:800;color:var(--gold2);line-height:1}.pastoral-stat-l{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:3px}.pastoral-stat-sep{width:1px;height:36px;background:var(--border2)}

/* TABS + FILTRES */
.tab-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.main-tabs{display:flex;gap:3px;background:var(--surface2);border:1px solid var(--border);border-radius:11px;padding:4px;width:fit-content;backdrop-filter:blur(12px)}
.quick-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.quick-dropdown{min-width:300px;height:35px;background:#ECEFF4;border:2px solid #D9DEE8;border-radius:10px;padding:0 48px 0 46px;font-size:16px;font-weight:800;color:#111827;cursor:pointer;font-family:'Outfit',system-ui,sans-serif;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23586A84' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat,no-repeat;background-position:left 16px center,right 16px center;background-size:18px 18px,18px 18px}
.calendar-panel-root{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.18)}
.quick-dropdown:focus{outline:none;border-color:var(--primary)}
.quick-search{padding:8px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:12px;font-family:'Outfit',system-ui,sans-serif;min-width:280px;backdrop-filter:blur(12px)}
.quick-search:focus{outline:none;border-color:var(--primary)}
.quick-search::placeholder{color:var(--text3)}
.ptab{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text2);background:none;border:none;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:'Outfit',system-ui,sans-serif}
.ptab:hover{background:rgba(255,255,255,.15);color:var(--text)}.ptab.active{background:var(--surface-solid);color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,.15)}
.ptab-ann.active{color:#7C3AED}
.ptab-badge{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:800;background:var(--gold-dim);color:var(--gold2);border:1px solid var(--gold-border)}
.ptab-badge-ann{background:var(--ann-dim);color:var(--ann);border:1px solid var(--ann-border)}

/* LAYOUT */
.layout-grid{display:grid;grid-template-columns:1fr 300px;gap:20px;margin-bottom:20px}
.side-col{display:flex;flex-direction:column;gap:16px}.layout-full{margin-bottom:20px}

/* PANELS */
.panel{background:var(--surface2);border:1px solid var(--border);border-radius:14px;overflow:hidden;backdrop-filter:blur(16px);box-shadow:0 8px 30px rgba(0,0,0,.2),0 1px 0 rgba(255,255,255,.06) inset}
.panel-head{padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.panel-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.btn-mini{border:1px solid var(--border2);background:rgba(255,255,255,0.08);color:var(--text2);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-mini:disabled{opacity:.5;cursor:not-allowed}.btn-mini-approve{background:var(--green-dim);color:var(--green);border-color:var(--green-border)}.btn-mini-refuse{background:var(--red-dim);color:var(--red);border-color:var(--red-border)}.btn-mini-send{background:var(--blue);color:#fff;border-color:var(--blue-border)}
.panel-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:var(--text)}.panel-sub{font-size:11.5px;color:var(--text2);margin-top:3px}
.panel-badge{font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;background:var(--gold-dim);color:var(--gold2);border:1px solid var(--gold-border)}

/* DATES CHOISIES */
.date-tab-root{display:flex;flex-direction:column;gap:20px}
.date-section-panel{background:var(--surface2);border:1px solid var(--border);border-radius:18px;padding:18px;backdrop-filter:blur(16px);box-shadow:0 8px 30px rgba(0,0,0,.18)}
.date-section-history{border-color:rgba(15,23,42,0.22);box-shadow:0 10px 36px rgba(0,0,0,.2)}
.date-shell{display:flex;flex-direction:column;gap:18px}
.date-shell-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:8px 6px 2px}
.date-shell-title{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.date-shell-sub{font-size:12.5px;color:var(--text2);margin-top:6px;max-width:620px;line-height:1.55}
.date-shell-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.date-shell-count{display:inline-flex;align-items:center;justify-content:center;min-width:112px;padding:9px 14px;border-radius:999px;background:rgba(126,182,255,.16);border:1px solid rgba(126,182,255,.28);color:#22437a;font-size:12px;font-weight:800}
.date-history-shell{display:flex;flex-direction:column;gap:12px}
.date-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:6px 6px 4px}
.date-history-title{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.date-history-sub{font-size:12.5px;color:var(--text2);margin-top:6px;max-width:680px;line-height:1.55}
.date-history-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.date-history-search{min-width:270px}
.date-history-clear{height:35px}
.date-history-count{display:inline-flex;align-items:center;justify-content:center;min-width:112px;padding:9px 14px;border-radius:999px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.25);color:#166534;font-size:12px;font-weight:800}
.date-history-muted{margin-left:4px;color:#166534;opacity:.75;font-weight:700}
.date-history-table-scroll{margin-top:2px}
.date-history-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.date-history-action-muted{font-size:11px;color:var(--text3);font-weight:600}
.date-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,360px));gap:18px}
.date-card{padding:20px;border-radius:18px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,247,251,.96));display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 34px rgba(15,23,42,.12);min-height:246px}
.date-card-check{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:var(--text3);width:fit-content}
.date-card-check input{width:15px;height:15px;accent-color:var(--violet);cursor:pointer}
.date-card-check span{user-select:none}
.date-card-main{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.date-card-heading{display:flex;flex-direction:column;gap:6px;min-width:0}
.date-card-title{font-size:17px;font-weight:800;color:var(--text);line-height:1.15;text-transform:none}
.date-card-ref{font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.04em;text-transform:uppercase}
.date-card-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:#475569;font-weight:600}
.date-card-sep{color:#cbd5e1}
.date-card-body{display:flex;flex-direction:column;gap:12px;padding-top:4px}
.date-card-field{display:flex;flex-direction:column;gap:4px}
.date-card-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
.date-card-value{font-size:14px;font-weight:700;color:var(--text);line-height:1.45;word-break:break-word}
.date-card-actions{display:flex;justify-content:flex-end;align-items:flex-end;margin-top:auto}
.date-card-button{padding-inline:18px;font-weight:700;background:rgba(255,255,255,.88)}

/* ★ BOUTON NOUVELLE ANNONCE */
.btn-nouvelle-annonce{
  display:inline-flex;align-items:center;gap:7px;padding:8px 16px;
  border-radius:9px;border:none;cursor:pointer;font-size:12px;font-weight:700;
  font-family:'Outfit',system-ui,sans-serif;transition:all .2s;white-space:nowrap;
  background:linear-gradient(90deg,rgba(124,58,237,0.85),rgba(79,70,229,0.85));
  color:#fff;box-shadow:0 3px 12px rgba(124,58,237,0.25);
}
.btn-nouvelle-annonce:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,0.38)}
.btn-nouvelle-annonce:disabled{opacity:.5;cursor:not-allowed}

/* ACTE CARD */
.acte-card{padding:20px 24px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s}.acte-card:last-child{border-bottom:none}.acte-card:hover{background:rgba(255,255,255,0.04)}
.acte-card-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.acte-check{display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.acte-check input{position:absolute;opacity:0;pointer-events:none}
.acte-check span{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border2);background:rgba(255,255,255,0.08);display:inline-block;position:relative}
.acte-check input:checked + span{background:var(--gold);border-color:var(--gold)}
.acte-check input:checked + span::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:2px solid #1a1100;border-top:none;border-left:none;transform:rotate(45deg)}
.acte-emoji-box{width:46px;height:46px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--gold-dim);border:1px solid var(--gold-border)}
.acte-info{flex:1}.acte-name{font-size:15px;font-weight:600;color:var(--text);margin-bottom:5px}.acte-meta{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--text2)}.acte-meta span{display:flex;align-items:center;gap:4px}
.conductor-note{display:flex;flex-direction:column;gap:5px;background:rgba(255,255,255,.78);border-left:2px solid var(--violet);border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:15px}
.cn-label{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--violet)}.cn-text{font-size:12.5px;color:var(--text2);line-height:1.65;font-style:italic}
.acte-actions{display:flex;gap:8px}
.btn-validate{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 16px;border-radius:9px;background:var(--gold);color:#1a1100;border:none;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px var(--gold-glow);transition:all .2s;font-family:inherit}
.btn-validate:hover{transform:translateY(-1px);box-shadow:0 6px 16px var(--gold-glow)}
.btn-see{display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:9px;background:var(--surface3);color:var(--text2);border:1px solid var(--border2);font-size:12px;cursor:pointer;transition:all .2s;font-family:inherit}
.btn-see:hover{background:rgba(255,255,255,.2);color:var(--text)}
.btn-refuse-sm{display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:9px;background:var(--red-dim);color:var(--red);border:1px solid var(--red-border);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit}
.btn-refuse-sm:hover{background:var(--red);color:white}

/* BADGE */
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em}.badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor}
.badge-transmis{background:var(--violet-dim);color:var(--violet);border:1px solid var(--violet-border)}.badge-valide{background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)}.badge-refuse{background:var(--red-dim);color:var(--red);border:1px solid var(--red-border)}

/* STAT */
.stat-rows{padding:16px 22px;display:flex;flex-direction:column;gap:14px}
.stat-item-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.stat-label{font-size:12.5px;font-weight:600;color:var(--text2)}.stat-count{font-size:15px;font-weight:800;color:var(--text)}
.stat-bar{background:rgba(255,255,255,.07);border-radius:4px;height:5px;overflow:hidden}.stat-bar-fill{height:100%;border-radius:4px;background:var(--gold);transition:width .6s ease}
.class-row{display:flex;align-items:center;justify-content:space-between;padding:12px 22px;border-bottom:1px solid var(--border)}.class-row:last-child{border-bottom:none}
.class-row-left{display:flex;align-items:center;gap:11px}.class-dot{width:8px;height:8px;border-radius:50%;background:var(--blue-dim);border:2px solid var(--blue)}.class-name{font-size:13px;font-weight:600;color:var(--text)}.class-sub{font-size:11px;color:var(--text3);margin-top:2px}.class-count{font-size:11px;font-weight:700;color:var(--gold2);background:var(--gold-dim);border:1px solid var(--gold-border);padding:3px 10px;border-radius:10px}

/* HIST */
.hist-summary{display:flex;gap:8px;align-items:center}.hs-pill{font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px}.hs-pill.green{background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)}.hs-pill.red{background:var(--red-dim);color:var(--red);border:1px solid var(--red-border)}
.hs-gmail-btn{display:inline-flex;gap:6px;align-items:center;padding:6px 12px;border-radius:900px;border:2px solid rgba(58, 182, 56, 0.78);background:linear-gradient(120deg,#258E08);color:#ECF0F5;font-weight:700;font-size:12px;cursor:pointer;font-family:'Outfit',system-ui,sans-serif;transition:all .2s}
.hs-gmail-btn:disabled{opacity:.6;cursor:not-allowed}
.hs-gmail-btn svg{color:#E7E0E0}
.hist-item{display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid var(--border)}.hist-item:last-child{border-bottom:none}
.hist-check{display:inline-flex;align-items:center;cursor:pointer}.hist-check input{position:absolute;opacity:0;pointer-events:none}.hist-check span{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border2);background:rgba(255,255,255,0.08);display:inline-block;position:relative}.hist-check input:checked + span{background:var(--gold);border-color:var(--gold)}.hist-check input:checked + span::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:2px solid #1a1100;border-top:none;border-left:none;transform:rotate(45deg)}
.hist-icon-box{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;background:var(--gold-dim);border:1px solid var(--gold-border);flex-shrink:0}
.hist-info{flex:1;min-width:0}.hist-name{font-size:13px;font-weight:600;color:var(--text)}.hist-detail{font-size:11.5px;color:var(--text2);margin-top:3px;display:flex;align-items:center;gap:5px}.hist-detail em{font-style:italic;color:var(--text3)}
.hist-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}.hist-date{font-size:10.5px;color:var(--text3)}
.btn-pdf{font-size:10px;font-weight:700;color:var(--gold);background:var(--gold-dim);border:1px solid var(--gold-border);padding:3px 9px;border-radius:5px;cursor:pointer;font-family:inherit}

  /* ANNONCES TAB */
  .ann-tab-root{display:flex;flex-direction:column;gap:20px}

/* FILTRES */
.ann-filters-bar{display:flex;gap:4px;flex-wrap:wrap;padding:12px 22px;border-bottom:1px solid var(--border)}
.ann-filter-btn{padding:6px 13px;border-radius:7px;font-size:11.5px;font-weight:700;color:var(--text2);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .15s;font-family:inherit}
.ann-filter-btn:hover{background:rgba(255,255,255,.12);color:var(--text)}.ann-filter-btn.active{background:var(--ann-dim);color:var(--ann);border-color:var(--ann-border)}

/* TYPE COLORS */
.atype-violet{background:rgba(157,143,224,.12);border:1px solid rgba(157,143,224,.2)}.atype-amber{background:rgba(184,122,32,.1);border:1px solid rgba(184,122,32,.18)}.atype-slate{background:rgba(90,90,90,.08);border:1px solid rgba(90,90,90,.15)}.atype-terra{background:rgba(192,96,64,.08);border:1px solid rgba(192,96,64,.18)}.atype-sage{background:rgba(74,124,94,.08);border:1px solid rgba(74,124,94,.18)}

/* EMPTY */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:var(--text2);font-size:13px}.empty-state svg{opacity:.3}
.empty-small{padding:14px 22px;color:var(--text2);font-size:12px}

/* PAGER */
.pager{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--border);background:rgba(255,255,255,0.03)}
.pager-btn{border:1px solid var(--border2);background:rgba(255,255,255,0.08);color:var(--text2);border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}.pager-btn:disabled{opacity:.5;cursor:not-allowed}
.pager-info{font-size:11.5px;color:var(--text3);font-weight:700}

/* ════════════════════════════════════
   MODAL SHARED
════════════════════════════════════ */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(10px)}.modal-overlay.open{display:flex}
.modal{background:var(--surface-solid);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:520px;margin:20px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.6);animation:mIn .3s cubic-bezier(.34,1.56,.64,1) both;display:flex;flex-direction:column;max-height:90vh}
@keyframes mIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-head{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-head-left{display:flex;align-items:center;gap:12px}
.modal-head-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.modal-head-icon.gold{background:var(--gold-dim);color:var(--gold2)}.modal-head-icon.red{background:var(--red-dim);color:var(--red)}.modal-head-icon.blue{background:var(--blue-dim);color:var(--blue)}
.modal-title{font-size:17px;font-weight:700;color:var(--text)}
.modal-sub{font-size:11.5px;color:var(--text2);margin-top:3px}
.modal-close{width:30px;height:30px;border-radius:8px;background:var(--surface3);border:1px solid var(--border);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:inherit}
.modal-close:hover{background:rgba(255,255,255,.2);color:var(--text)}
.modal-body{padding:22px 24px;overflow-y:auto;flex:1}
.modal-acte-recap{display:flex;align-items:center;gap:12px;background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:10px;padding:13px 16px;margin-bottom:16px}
.modal-acte-emoji{font-size:22px;flex-shrink:0}.modal-acte-name{font-size:13.5px;font-weight:600;color:var(--text)}.modal-acte-ref{font-size:11px;color:var(--text3);margin-top:2px;font-family:monospace}
.modal-sep{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);font-weight:800;margin:16px 0 10px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.modal-info-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;gap:10px}.modal-info-row:last-child{border-bottom:none}
.modal-key{color:var(--text2);font-weight:600}.modal-val{color:var(--text);text-align:right}.modal-val.mono{font-family:monospace;font-size:11.5px;background:rgba(255,255,255,.06);padding:2px 7px;border-radius:4px}
.modal-detail-box{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:12px 14px}
.modal-detail-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12.5px;gap:10px}.modal-detail-row:last-child{border-bottom:none}
.modal-empty{font-size:12px;color:var(--text3);font-style:italic}
.modal-help{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--text2);line-height:1.7;margin-bottom:16px;padding:12px 14px;background:rgba(126,182,255,0.07);border:1px solid var(--blue-border);border-radius:8px}
.modal-help.warn{background:var(--red-dim);border-color:var(--red-border);color:var(--text)}
.modal-help svg{flex-shrink:0;margin-top:2px;color:var(--blue)}.modal-help.warn svg{color:var(--red)}
.modal-field{margin-bottom:14px}.modal-label{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--text2);font-weight:700;margin-bottom:8px;display:block}
.modal-optional{font-size:9px;color:var(--text3);text-transform:none;letter-spacing:0;font-weight:500}.modal-required{color:var(--red)}
.modal-textarea{width:100%;min-height:100px;background:rgba(255,255,255,.06);border:1.5px solid var(--border2);border-radius:9px;padding:12px 14px;color:var(--text);font-family:'Outfit',system-ui,sans-serif;font-size:13.5px;outline:none;resize:vertical;line-height:1.6;transition:border-color .2s,box-shadow .2s}
.modal-textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim)}.modal-textarea::placeholder{color:var(--text3)}
.modal-select,.modal-input{width:100%;background:rgba(255,255,255,.06);border:1.5px solid var(--border2);border-radius:9px;padding:10px 14px;color:var(--text);font-family:'Outfit',system-ui,sans-serif;font-size:13.5px;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:4px}
.modal-select:focus,.modal-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim)}
.modal-foot{padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;background:rgba(0,0,0,.15)}
.fiche-list{display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow:auto}
.fiche-item{border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface3);display:flex;flex-direction:column;gap:10px}
.fiche-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:13px;color:var(--text2)}
.fiche-actions{display:flex;flex-direction:column;gap:8px}
.fiche-email-field{width:100%;border:1px solid var(--border2);border-radius:8px;padding:10px;font-size:14px;font-family:'Outfit',system-ui,sans-serif;background:var(--surface2);color:var(--text)}
.fiche-buttons{display:flex;gap:10px;flex-wrap:wrap}
.btn-modal{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-size:12.5px;font-weight:700;font-family:'Outfit',system-ui,sans-serif;transition:all .2s}
.btn-modal:disabled{opacity:.55;cursor:not-allowed;transform:none!important}
.btn-ghost{background:rgba(255,255,255,.08);color:var(--text2);border:1px solid var(--border2)}.btn-ghost:hover{background:rgba(255,255,255,.15);color:var(--text)}
.btn-gold{background:var(--gold);color:#1a1100;box-shadow:0 3px 10px var(--gold-glow)}.btn-gold:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 16px var(--gold-glow)}
.btn-refuse-modal{background:var(--red-dim);color:var(--red);border:1px solid var(--red-border)}.btn-refuse-modal:hover:not(:disabled){background:var(--red);color:white}

/* ════ MODAL ANNONCE 3 ÉTAPES ════ */
.ann-modal{max-width:560px}
.ann-modal-head{background:linear-gradient(135deg,rgba(91,63,175,0.06),rgba(79,70,229,0.04))}
.ann-steps-bar{display:flex;padding:14px 24px;border-bottom:1px solid var(--border);gap:0;background:rgba(255,255,255,0.02)}
.asb-step{flex:1;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text2);font-weight:600;position:relative}
.asb-step:not(:last-child)::after{content:"→";position:absolute;right:-4px;color:rgba(255,255,255,0.3)}
.asb-step.active{color:var(--ann)}.asb-step.done{color:var(--green)}
.asb-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:rgba(255,255,255,0.06);border:2px solid var(--border2);color:var(--text2);flex-shrink:0}
.asb-step.active .asb-dot{background:var(--ann-dim);border-color:var(--ann);color:var(--ann)}.asb-step.done .asb-dot{background:var(--green-dim);border-color:var(--green);color:var(--green)}
.ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ann-type-btn{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:10px;border:2px solid var(--border2);background:rgba(255,255,255,0.04);cursor:pointer;transition:all .2s;text-align:left;position:relative}
.ann-type-btn:hover{border-color:var(--ann);background:var(--ann-dim)}.ann-type-btn.sel{border-color:var(--ann);background:var(--ann-dim);box-shadow:0 0 0 3px rgba(160,144,216,0.15)}
.atb-emoji{font-size:24px;flex-shrink:0}.atb-label{font-size:12.5px;font-weight:700;color:var(--text);line-height:1.3;flex:1}
.atb-check{width:20px;height:20px;border-radius:50%;background:var(--ann);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.ann-form{display:flex;flex-direction:column;gap:14px}
.ann-field{display:flex;flex-direction:column;gap:6px}.ann-label{font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--text2)}.ann-req{color:var(--red)}
.ann-input{padding:10px 14px;background:rgba(255,255,255,.06);border:1.5px solid var(--border2);border-radius:8px;font-size:13.5px;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
.ann-input:focus{border-color:var(--ann);box-shadow:0 0 0 3px var(--ann-dim);background:rgba(255,255,255,.08)}
.ann-textarea{padding:10px 14px;background:rgba(255,255,255,.06);border:1.5px solid var(--border2);border-radius:8px;font-size:13px;color:var(--text);outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.ann-textarea:focus{border-color:var(--ann);box-shadow:0 0 0 3px var(--ann-dim);background:rgba(255,255,255,.08)}
.ann-chars{font-size:10.5px;color:var(--text3);text-align:right}
.ann-visibility{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(160,144,216,.08);border:1px solid rgba(160,144,216,.2);border-radius:8px;font-size:12px;color:var(--ann);font-weight:600}
.ann-recap{display:flex;flex-direction:column;gap:12px}
.ann-recap-type{display:flex;align-items:center;gap:14px;padding:16px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--border2)}
.art-label{font-size:16px;font-weight:800;color:var(--text)}.art-sub{font-size:11px;color:var(--text2);margin-top:2px}
.ann-recap-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border);font-size:12.5px;gap:10px}
.arr-label{color:var(--text2);font-weight:600}.arr-value{color:var(--text);font-weight:700;text-align:right}
.ann-recap-msg{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:13px}
.arm-label{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.arm-text{font-size:13px;color:var(--text);line-height:1.7}
.ann-circuit-info{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2);background:var(--ann-dim);border:1px solid var(--ann-border);border-radius:8px;padding:10px 14px}
.ann-circuit-info strong{color:var(--ann)}
.ann-circuit-pastor{background:rgba(157,143,224,.08);border-color:rgba(157,143,224,.25)}
.ann-circuit-pastor strong{color:var(--violet)}

/* MODAL BUTTONS */
.btn-mghost{padding:9px 18px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid var(--border2);color:var(--text2);font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-mnext{padding:9px 22px;border-radius:8px;background:var(--ann);color:#fff;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-mnext:disabled{opacity:.4;cursor:not-allowed}.btn-mnext:hover:not(:disabled){background:rgba(160,144,216,.9);transform:translateY(-1px)}
.btn-msubmit{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:8px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.btn-msubmit:disabled{opacity:.5;cursor:not-allowed}.btn-msubmit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}

/* TOAST */
.toast{position:fixed;right:24px;bottom:24px;background:rgba(255,255,255,0.96);border:1px solid var(--border2);border-left:4px solid #ef4444;color:#111827;padding:13px 18px;border-radius:11px;z-index:220;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:tIn .35s cubic-bezier(.34,1.56,.64,1) both}
@keyframes tIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.spin{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.fbap-input:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important;background:white!important;outline:none!important}

@media(max-width:1100px){.kpi-row{grid-template-columns:repeat(2,1fr)}.layout-grid{grid-template-columns:1fr}.hero-header-inner{flex-wrap:wrap;justify-content:center}.hero-header-center{order:1;width:100%}.hero-header-actions{order:2;flex-direction:row}}
@media(max-width:700px){.content{padding:14px}.kpi-row{grid-template-columns:1fr 1fr}.acte-actions{flex-direction:column}.pastoral-box{flex-wrap:wrap}.pastoral-stats{width:100%;justify-content:center}.tab-toolbar{align-items:stretch}.main-tabs{width:100%}.quick-tools{width:100%;justify-content:flex-start}.quick-dropdown{width:100%;min-width:0}.quick-search{width:100%;min-width:0}.ann-type-grid{grid-template-columns:1fr}.hero-stats-row{flex-wrap:wrap}.h1.hero-title{font-size:20px}.date-shell-head{flex-direction:column;align-items:flex-start}.date-shell-tools{width:100%;justify-content:flex-start}.date-shell-count{min-width:0}.date-card{min-height:auto;padding:18px}.date-history-head{flex-direction:column;align-items:flex-start}.date-history-tools{width:100%;justify-content:flex-start}.date-history-search{min-width:0;width:100%}.date-history-count{min-width:0}}
@media(max-width:480px){.kpi-row{grid-template-columns:1fr}.hero-header-actions{flex-direction:column;width:100%}.btn-hero-annonce,.btn-hero-acte{width:100%;justify-content:center}}

/* ════════════════ FORMATIONS HISTORIQUE TABLE ════════════════ */
table{border-collapse:collapse;width:100%;margin:16px 0;background:rgba(255,255,255,0.94);border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}
table thead{background:linear-gradient(135deg,rgba(0,71,171,0.95) 0%,rgba(30,64,175,0.95) 100%);color:#fff;font-weight:600;font-size:12px}
table thead tr th{padding:12px 16px;text-align:left;border-bottom:2px solid rgba(0,71,171,0.3);white-space:nowrap}
table tbody tr{border-bottom:1px solid rgba(0,0,0,0.08);transition:background .15s}
table tbody tr:nth-child(odd){background:rgba(248,250,252,0.5)}
table tbody tr:hover{background:rgba(248,250,252,1)}
table tbody td{padding:11px 16px;font-size:13px;color:#0f172a;vertical-align:top}
table tbody input[type="checkbox"]{cursor:pointer}
`
