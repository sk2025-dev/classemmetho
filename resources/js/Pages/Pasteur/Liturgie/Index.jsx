import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, usePage, router } from "@inertiajs/react";

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
        value: "priere",
        label: "Demande de prière",
        emoji: "🙏",
        color: "violet",
    },
    {
        value: "grace",
        label: "Action de grâce / Remerciement",
        emoji: "🙌",
        color: "amber",
    },
    {
        value: "deces",
        label: "Avis de décès / Assistance deuil",
        emoji: "⚰️",
        color: "slate",
    },
    {
        value: "felicitations",
        label: "Félicitations",
        emoji: "🎉",
        color: "terra",
    },
    {
        value: "generale",
        label: "Annonce générale",
        emoji: "📢",
        color: "sage",
    },
];

function getPlaceholder(type) {
    const p = {
        priere: "Ex : Nous sollicitons les prières de la communauté pour la guérison de…",
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        deces: "Ex : La famille a la douleur de vous annoncer le rappel à Dieu de…",
        felicitations:
            "Ex : Nous félicitons chaleureusement les époux… pour leur union sacrée.",
        generale: "Rédigez votre annonce à destination de l'assemblée…",
    };
    return p[type] || "Rédigez votre message…";
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

export default function Index({
    actes = [],
    historique = [],
    familyMembers = [],
    annonces: rawAnnonces = [],
    annoncesHistorique: rawAnnoncesHistorique = [],
}) {
    const { url } = usePage();

    const [actesPaginator] = useState(
        Array.isArray(actes) || !actes?.data ? null : actes,
    );

    const [localActes, setLocalActes] = useState(
        actesPaginator?.data || (Array.isArray(actes) ? actes : []),
    );
    const currentPage = actesPaginator?.current_page || 1;
    const lastPage = actesPaginator?.last_page || 1;
    const totalActes = actesPaginator?.total || localActes.length;

    const [historiqueList, setHistoriqueList] = useState(historique);
    const [activeActe, setActiveActe] = useState(null);
    const [modal, setModal] = useState(null);
    const [commentaire, setCommentaire] = useState("");
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState("");
    const pendingPerPage = actesPaginator?.per_page || 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
    const DONE_STATUSES = ["CELEBRE", "TERMINE"];
    const [historyPage, setHistoryPage] = useState(1);
    const historyPerPage = 6;

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
    });

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

    /* ── FAMILIES ET CLASSES POUR FILTRES ── */
    const availableFamilies = useMemo(() => {
        const familySet = new Set();
        [
            ...localActes,
            ...historiqueList,
            ...annonces,
            ...annoncesHistorique,
        ].forEach((item) => {
            if (item.family?.nom || item.family?.id) {
                familySet.add(
                    JSON.stringify({
                        id: item.family?.id,
                        nom: item.family?.nom,
                    }),
                );
            }
        });
        return Array.from(familySet)
            .map((f) => JSON.parse(f))
            .filter((f) => f.id && f.nom)
            .sort((a, b) => a.nom.localeCompare(b.nom));
    }, [localActes, historiqueList, annonces, annoncesHistorique]);

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
    const searchNeedle = searchTerm.trim().toLowerCase();

    const filteredActes = useMemo(() => {
        let result = [...localActes];

        // Afficher uniquement les actes en attente de validation du pasteur
        result = result.filter((a) => a.statut === "TRANSMISE_AU_PASTEUR");

        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                String(a.type_acte || "")
                    .toLowerCase()
                    .includes(quickFilter.toLowerCase()),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter(
                (a) => String(a.family?.id) === selectedFamily,
            );
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

    const filteredHistorique = useMemo(() => {
        let result = [...historiqueList];

        if (quickFilter && quickFilter !== "all") {
            result = result.filter((a) =>
                String(a.type_acte || "")
                    .toLowerCase()
                    .includes(quickFilter.toLowerCase()),
            );
        }

        if (selectedFamily && selectedFamily !== "all") {
            result = result.filter(
                (a) => String(a.family_id || a.family?.id) === selectedFamily,
            );
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
                    a.family?.nom,
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(searchNeedle),
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
    ]);
    const annFiltered = useMemo(() => {
        let result = [...annonces];

        // Afficher uniquement les annonces en attente de validation du pasteur
        result = result.filter((a) => a.statut === "TRANSMISE_AU_PASTEUR");

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
            result = result.filter(
                (a) => String(a.family?.id) === selectedFamily,
            );
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
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(searchNeedle),
                ),
            );
        }

        return result;
    }, [annonces, quickFilter, selectedFamily, selectedClasse, searchNeedle]);

    const annHistFiltered = useMemo(() => {
        let result = [...annoncesHistorique];

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
            result = result.filter(
                (a) => String(a.family?.id) === selectedFamily,
            );
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

    const submitDecision = async (statut) => {
        if (!activeActe) return;
        if (statut === "REFUSEE_PAR_PASTEUR" && !commentaire.trim()) {
            notify("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            await axios.post(`/pasteur/liturgie/${activeActe.id}/transition`, {
                statut,
                commentaire,
            });
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
                    axios.post(`/pasteur/liturgie/${id}/transition`, {
                        statut: "VALIDEE",
                        commentaire: "",
                    }),
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
                    return axios.post(`/pasteur/liturgie/${id}/transition`, {
                        statut,
                        commentaire: "",
                    });
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
            window.open(`/pasteur/liturgie/${id}/certificat`, "_blank"),
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
                    axios.post(`/pasteur/liturgie/${id}/transition`, {
                        statut: "REFUSEE_PAR_PASTEUR",
                        commentaire: motif,
                    }),
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
        try {
            setProcessing(true);
            const member = familyMembers.find(
                (m) => String(m.id) === String(createForm.membre_id),
            );
            const payload = {
                ...createForm,
                membre_id: Number(createForm.membre_id),
                classe_id: member?.classe_id || null,
                details: {},
            };
            const res = await axios.post("/pasteur/liturgie", payload);
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
            await axios.post(`/pasteur/liturgie/${acte.id}/transition`, {
                statut,
                commentaire: "",
            });
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
            return axios.post(`/pasteur/annonces/${id}/valider`, {
                note: commentaire,
            });
        }
        if (statut === "REFUSEE_PAR_PASTEUR") {
            return axios.post(`/pasteur/annonces/${id}/rejeter`, {
                motif_rejet: commentaire,
            });
        }
        if (statut === "PUBLIEE") {
            return axios.post(`/pasteur/annonces/${id}/publier`, {
                commentaire,
            });
        }
        return axios.post(`/pasteur/annonces/${id}/valider`, {
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
                notify("Annonce validée et publiée.");
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
                notify("Annonce publiée avec succès.");
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
                notify("Annonce refusée.");
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
            const res = await axios.post("/pasteur/annonces", annonceForm);
            const newA = res.data?.annonce || {
                ...annonceForm,
                id: Date.now(),
                statut: "SOUMISE",
                created_at: new Date().toISOString(),
            };
            setAnnonces((prev) => [newA, ...prev]);
            closeAnnModal();
            setActiveTab("annonces");
            notify("✅ Annonce créée avec succès.");
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
            notify("Sélectionnez au moins une annonce.");
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
            notify("Annonces validées et publiées.");
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
            notify("Sélectionnez au moins une annonce.");
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
                                href="/pasteur/dashboard"
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
                                        Actes liturgiques · Annonces
                                        paroissiales · Supervision communautaire
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
                                            Annonces en attente
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
                                    Nouvelle annonce
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
                                        : "Annonces"}
                                </span>
                            </div>
                            <div className="kpi-number">{annStats.total}</div>
                            <div className="kpi-label">Annonces reçues</div>
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
                                {stats.pending > 0 && (
                                    <span className="ptab-badge">
                                        {stats.pending}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`ptab ptab-ann ${activeTab === "annonces" ? "active" : ""}`}
                                onClick={() => setActiveTab("annonces")}
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
                                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                    />
                                </svg>
                                Annonces paroissiales
                                {annStats.pending > 0 && (
                                    <span className="ptab-badge ptab-badge-ann">
                                        {annStats.pending}
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
                                <option value="all">
                                    🔍 Tous les contenus
                                </option>
                                <optgroup label="Types d'actes">
                                    <option value="bapteme">💧 Baptême</option>
                                    <option value="mariage">💍 Mariage</option>
                                    <option value="premiere_communion">
                                        🍞 Première Communion
                                    </option>
                                    <option value="confirmation">
                                        ✝️ Confirmation
                                    </option>
                                    <option value="naissance">
                                        👶 Naissance
                                    </option>
                                    <option value="deces">🕯️ Décès</option>
                                </optgroup>
                                <optgroup label="Types d'annonces">
                                    <option value="priere">🙏 Prière</option>
                                    <option value="grace">
                                        🙌 Action de grâce
                                    </option>
                                    <option value="deces">⚰️ Décès</option>
                                    <option value="felicitations">
                                        🎉 Félicitations
                                    </option>
                                    <option value="generale">
                                        📢 Générale
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
                                                Actes en attente de validation
                                            </div>
                                            <div className="panel-sub">
                                                Transmis par les conducteurs —
                                                Votre validation est requise
                                            </div>
                                        </div>
                                        <div className="panel-actions">
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={selectAllPending}
                                                disabled={
                                                    filteredActes.length === 0
                                                }
                                            >
                                                Tout sélectionner
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini"
                                                onClick={clearSelection}
                                                disabled={
                                                    selectedIds.length === 0
                                                }
                                            >
                                                Effacer
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini btn-mini-approve"
                                                onClick={bulkApprove}
                                                disabled={
                                                    selectedIds.length === 0 ||
                                                    processing
                                                }
                                            >
                                                Approuver
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-mini btn-mini-refuse"
                                                onClick={bulkRefuse}
                                                disabled={
                                                    selectedIds.length === 0 ||
                                                    processing
                                                }
                                            >
                                                Refuser
                                            </button>
                                            <span className="panel-badge">
                                                {filteredActes.length}
                                            </span>
                                        </div>
                                    </div>
                                    {filteredActes.length === 0 && (
                                        <div className="empty-state">
                                            <svg
                                                width="36"
                                                height="36"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span>
                                                Aucun acte en attente de
                                                validation
                                            </span>
                                        </div>
                                    )}
                                    {filteredActes.map((acte) => (
                                        <div
                                            key={acte.id}
                                            className="acte-card"
                                            onClick={() =>
                                                openModal("detail", acte)
                                            }
                                        >
                                            <div className="acte-card-top">
                                                <label
                                                    className="acte-check"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(
                                                            acte.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelect(
                                                                acte.id,
                                                            )
                                                        }
                                                    />
                                                    <span />
                                                </label>
                                                <div className="acte-emoji-box">
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
                                                            className="member-photo"
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
                                                        <span className="photo-fallback">
                                                            {iconEmoji(
                                                                acte.type_acte,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="acte-info">
                                                    <div className="acte-name">
                                                        {prettyType(
                                                            acte.type_acte,
                                                        )}{" "}
                                                        — {acte.membre?.prenom}{" "}
                                                        {acte.membre?.nom}
                                                    </div>
                                                    <div className="acte-meta">
                                                        <span>
                                                            <svg
                                                                width="10"
                                                                height="10"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                                                                />
                                                            </svg>
                                                            {acte.classe?.nom ||
                                                                acte.classe_id ||
                                                                "—"}
                                                        </span>
                                                        <span>
                                                            <svg
                                                                width="10"
                                                                height="10"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <rect
                                                                    x="3"
                                                                    y="4"
                                                                    width="18"
                                                                    height="18"
                                                                    rx="2"
                                                                    ry="2"
                                                                />
                                                                <line
                                                                    x1="16"
                                                                    y1="2"
                                                                    x2="16"
                                                                    y2="6"
                                                                />
                                                                <line
                                                                    x1="8"
                                                                    y1="2"
                                                                    x2="8"
                                                                    y2="6"
                                                                />
                                                                <line
                                                                    x1="3"
                                                                    y1="10"
                                                                    x2="21"
                                                                    y2="10"
                                                                />
                                                            </svg>
                                                            {formatDate(
                                                                acte.date_souhaitee,
                                                            )}
                                                        </span>
                                                        <span>
                                                            {acte.reference ||
                                                                "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="badge badge-transmis">
                                                    <span className="badge-dot" />
                                                    AU PASTEUR
                                                </span>
                                            </div>
                                            <div className="conductor-note">
                                                <div className="cn-label">
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
                                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                        />
                                                    </svg>
                                                    Note du conducteur
                                                </div>
                                                <div className="cn-text">
                                                    {acte.note_conducteur ||
                                                        "Aucune note du conducteur pour ce dossier."}
                                                </div>
                                            </div>
                                            <div
                                                className="acte-actions"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    className="btn-validate"
                                                    onClick={() =>
                                                        openModal(
                                                            "validate",
                                                            acte,
                                                        )
                                                    }
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
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    Accepté
                                                </button>
                                                <button
                                                    className="btn-see"
                                                    onClick={() =>
                                                        openModal(
                                                            "detail",
                                                            acte,
                                                        )
                                                    }
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
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    Dossier complet
                                                </button>
                                                <button
                                                    className="btn-refuse-sm"
                                                    onClick={() =>
                                                        openModal(
                                                            "refuse",
                                                            acte,
                                                        )
                                                    }
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
                                                    Refuser
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredActes.length > 0 &&
                                        lastPage > 1 && (
                                            <div className="pager">
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        goToActesPage(
                                                            currentPage - 1,
                                                        )
                                                    }
                                                    disabled={currentPage === 1}
                                                >
                                                    Précédent
                                                </button>
                                                <div className="pager-info">
                                                    Page {currentPage} /{" "}
                                                    {lastPage}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        goToActesPage(
                                                            currentPage + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        currentPage === lastPage
                                                    }
                                                >
                                                    Suivant
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
                            <div className="panel layout-full">
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
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Historique pastoral
                                        </div>
                                        <div className="panel-sub">
                                            Toutes les approbations et refus
                                            effectués
                                        </div>
                                    </div>
                                    {historiqueList.length > 0 && (
                                        <>
                                            <div className="panel-actions">
                                                <button
                                                    type="button"
                                                    className="btn-mini"
                                                    onClick={selectAllHistory}
                                                    disabled={
                                                        historiqueList.length ===
                                                        0
                                                    }
                                                >
                                                    Tout sélectionner
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-mini"
                                                    onClick={
                                                        clearHistorySelection
                                                    }
                                                    disabled={
                                                        selectedHistoryIds.length ===
                                                        0
                                                    }
                                                >
                                                    Effacer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-mini btn-mini-approve"
                                                    onClick={
                                                        bulkFinalizeHistory
                                                    }
                                                    disabled={
                                                        selectedHistoryIds.length ===
                                                            0 || processing
                                                    }
                                                >
                                                    Finaliser
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-mini"
                                                    onClick={
                                                        bulkDownloadHistory
                                                    }
                                                    disabled={
                                                        selectedHistoryIds.length ===
                                                        0
                                                    }
                                                >
                                                    Télécharger certifs
                                                </button>
                                                <span className="panel-badge">
                                                    {historiqueList.length}
                                                </span>
                                            </div>
                                            <div className="hist-summary">
                                                <span className="hs-pill green">
                                                    {sessionValides} validé
                                                    {sessionValides > 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                                {sessionRefuses > 0 && (
                                                    <span className="hs-pill red">
                                                        {sessionRefuses} refusé
                                                        {sessionRefuses > 1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {historiqueList.length === 0 && (
                                    <div className="empty-state">
                                        <svg
                                            width="36"
                                            height="36"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>
                                            Aucun acte traité pour le moment
                                        </span>
                                    </div>
                                )}
                                {pagedHistorique.map((item) => (
                                    <div
                                        className="hist-item"
                                        key={`hist-${item.id}-${item.validated_at}`}
                                    >
                                        <label
                                            className="hist-check"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedHistoryIds.includes(
                                                    item.id,
                                                )}
                                                onChange={() =>
                                                    toggleHistorySelect(item.id)
                                                }
                                            />
                                            <span />
                                        </label>
                                        <div className="hist-icon-box">
                                            {item.membre?.profile_photo_url ? (
                                                <img
                                                    src={
                                                        item.membre
                                                            .profile_photo_url
                                                    }
                                                    alt={
                                                        item.membre?.prenom +
                                                        " " +
                                                        item.membre?.nom
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: "50%",
                                                    }}
                                                />
                                            ) : (
                                                iconEmoji(item.type_acte)
                                            )}
                                        </div>
                                        <div className="hist-info">
                                            <div className="hist-name">
                                                {prettyType(item.type_acte)} —{" "}
                                                {item.membre?.prenom}{" "}
                                                {item.membre?.nom}
                                            </div>
                                            <div className="hist-detail">
                                                <svg
                                                    width="10"
                                                    height="10"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                                                    />
                                                </svg>
                                                Classe{" "}
                                                {item.classe?.nom ||
                                                    item.classe_id ||
                                                    "—"}
                                                {item.note_pastorale && (
                                                    <>
                                                        {" "}
                                                        ·{" "}
                                                        <em>
                                                            {
                                                                item.note_pastorale
                                                            }
                                                        </em>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="hist-right">
                                            <span
                                                className={`badge ${item.statut === "REFUSEE_PAR_PASTEUR" ? "badge-refuse" : "badge-valide"}`}
                                            >
                                                <span className="badge-dot" />
                                                {historyStatusLabel(
                                                    item.statut,
                                                )}
                                            </span>
                                            <div className="hist-date">
                                                {formatDate(item.validated_at)}
                                            </div>
                                            {item.statut === "VALIDEE" && (
                                                <button
                                                    className="btn-pdf"
                                                    onClick={() =>
                                                        finalizeActe(item)
                                                    }
                                                >
                                                    Marquer{" "}
                                                    {finalLabelForType(
                                                        item.type_acte,
                                                    )}
                                                </button>
                                            )}
                                            {DONE_STATUSES.includes(
                                                item.statut,
                                            ) && (
                                                <button
                                                    className="btn-pdf"
                                                    onClick={() =>
                                                        window.open(
                                                            `/pasteur/liturgie/${item.id}/certificat`,
                                                            "_blank",
                                                        )
                                                    }
                                                >
                                                    Télécharger certificat
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {historiqueList.length > 0 &&
                                    historyTotalPages > 1 && (
                                        <div className="pager">
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setHistoryPage(
                                                        historyPage - 1,
                                                    )
                                                }
                                                disabled={historyPage === 1}
                                            >
                                                Précédent
                                            </button>
                                            <div className="pager-info">
                                                Page {historyPage} /{" "}
                                                {historyTotalPages}
                                            </div>
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setHistoryPage(
                                                        historyPage + 1,
                                                    )
                                                }
                                                disabled={
                                                    historyPage ===
                                                    historyTotalPages
                                                }
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    )}
                            </div>
                        </>
                    )}

                    {/* ════════════════ TAB ANNONCES ════════════════ */}
                    {activeTab === "annonces" && (
                        <div className="ann-tab-root">
                            {/* HÉRO */}
                            <div className="ann-hero">
                                <div className="ann-hero-left">
                                    <div className="ann-hero-pulse">
                                        <svg
                                            width="26"
                                            height="26"
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
                                    <div>
                                        <div className="ann-hero-title">
                                            Validation des annonces paroissiales
                                        </div>
                                        <div className="ann-hero-sub">
                                            Annonces transmises par les
                                            conducteurs · Votre approbation les
                                            publie sur le tableau paroissial
                                        </div>
                                    </div>
                                </div>
                                <div className="ann-hero-stats">
                                    <div className="ann-mini-stat ann-mini-orange">
                                        <div className="ann-mini-n">
                                            {annStats.pending}
                                        </div>
                                        <div className="ann-mini-l">
                                            En attente
                                        </div>
                                    </div>
                                    <div className="ann-mini-stat ann-mini-sage">
                                        <div className="ann-mini-n">
                                            {annStats.validees}
                                        </div>
                                        <div className="ann-mini-l">
                                            Validées
                                        </div>
                                    </div>
                                    <div className="ann-mini-stat ann-mini-terra">
                                        <div className="ann-mini-n">
                                            {annStats.refusees}
                                        </div>
                                        <div className="ann-mini-l">
                                            Refusées
                                        </div>
                                    </div>
                                    <div className="ann-mini-stat ann-mini-sky">
                                        <div className="ann-mini-n">
                                            {annStats.total}
                                        </div>
                                        <div className="ann-mini-l">Total</div>
                                    </div>
                                </div>
                            </div>

                            {/* ANNONCES EN ATTENTE */}
                            <div className="panel layout-full">
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
                                                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                                />
                                            </svg>
                                            Annonces en attente de validation
                                        </div>
                                        <div className="panel-sub">
                                            Transmises par les conducteurs —
                                            Votre validation les publie
                                        </div>
                                    </div>
                                    <div className="panel-actions">
                                        {/* ★ BOUTON NOUVELLE ANNONCE PASTEUR ★ */}
                                        <button
                                            type="button"
                                            className="btn-nouvelle-annonce"
                                            onClick={() =>
                                                openAnnModal("create")
                                            }
                                            disabled={annonceProcessing}
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
                                            Nouvelle annonce
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-mini"
                                            onClick={selectAllAnn}
                                            disabled={annFiltered.length === 0}
                                        >
                                            Tout sélectionner
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-mini"
                                            onClick={clearAnnSelection}
                                            disabled={
                                                selectedAnnIds.length === 0
                                            }
                                        >
                                            Effacer
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-mini btn-mini-approve"
                                            onClick={bulkApproveAnn}
                                            disabled={
                                                selectedAnnIds.length === 0 ||
                                                processing
                                            }
                                        >
                                            Approuver
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-mini btn-mini-refuse"
                                            onClick={bulkRefuseAnn}
                                            disabled={
                                                selectedAnnIds.length === 0 ||
                                                processing
                                            }
                                        >
                                            Refuser
                                        </button>
                                        <span className="panel-badge">
                                            {annFiltered.length}
                                        </span>
                                    </div>
                                </div>

                                {annFiltered.length === 0 && (
                                    <div className="empty-state">
                                        <svg
                                            width="36"
                                            height="36"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                            />
                                        </svg>
                                        <span>
                                            Aucune annonce en attente de
                                            validation
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-nouvelle-annonce"
                                            style={{ marginTop: 14 }}
                                            onClick={() =>
                                                openAnnModal("create")
                                            }
                                        >
                                            Créer la première annonce
                                        </button>
                                    </div>
                                )}

                                {pagedAnn.map((ann) => {
                                    const t = ANNONCE_TYPES.find(
                                        (x) =>
                                            x.value ===
                                            (ann.type_annonce || ann.type_acte),
                                    );
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
                                            className="acte-card"
                                            onClick={() =>
                                                openAnnModal("detail", ann)
                                            }
                                        >
                                            <div className="acte-card-top">
                                                <label
                                                    className="acte-check"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAnnIds.includes(
                                                            ann.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleAnnSelect(
                                                                ann.id,
                                                            )
                                                        }
                                                    />
                                                    <span />
                                                </label>
                                                <div
                                                    className={`acte-emoji-box atype-${t?.color}`}
                                                    style={{ fontSize: 22 }}
                                                >
                                                    {t?.emoji || "📢"}
                                                </div>
                                                <div className="acte-info">
                                                    <div className="acte-name">
                                                        {t?.label ||
                                                            ann.type_annonce}
                                                        {member &&
                                                            ` — ${member}`}
                                                    </div>
                                                    <div className="acte-meta">
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
                                                        {ann.classe?.nom && (
                                                            <span>
                                                                👥{" "}
                                                                {ann.classe.nom}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="cn-text"
                                                        style={{
                                                            marginTop: 6,
                                                            fontStyle: "normal",
                                                        }}
                                                    >
                                                        {msg.slice(0, 120)}
                                                        {msg.length > 120
                                                            ? "…"
                                                            : ""}
                                                    </div>
                                                </div>
                                                <span className="badge badge-transmis">
                                                    <span className="badge-dot" />
                                                    AU PASTEUR
                                                </span>
                                            </div>
                                            {ann.note_conducteur && (
                                                <div className="conductor-note">
                                                    <div className="cn-label">
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
                                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                            />
                                                        </svg>
                                                        Note du conducteur
                                                    </div>
                                                    <div className="cn-text">
                                                        {ann.note_conducteur}
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className="acte-actions"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    className="btn-validate"
                                                    onClick={() =>
                                                        openAnnModal(
                                                            "validate",
                                                            ann,
                                                        )
                                                    }
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
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    Valider
                                                </button>
                                                <button
                                                    className="btn-see"
                                                    onClick={() =>
                                                        openAnnModal(
                                                            "detail",
                                                            ann,
                                                        )
                                                    }
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
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    Voir détail
                                                </button>
                                                <button
                                                    className="btn-refuse-sm"
                                                    onClick={() =>
                                                        openAnnModal(
                                                            "refuse",
                                                            ann,
                                                        )
                                                    }
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
                                                    Refuser
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {annFiltered.length > 0 &&
                                    annTotalPages > 1 && (
                                        <div className="pager">
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setAnnPage(annPage - 1)
                                                }
                                                disabled={annPage === 1}
                                            >
                                                Précédent
                                            </button>
                                            <div className="pager-info">
                                                Page {annPage} / {annTotalPages}
                                            </div>
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setAnnPage(annPage + 1)
                                                }
                                                disabled={
                                                    annPage === annTotalPages
                                                }
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    )}
                            </div>

                            {/* HISTORIQUE ANNONCES */}
                            <div className="panel layout-full">
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
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Historique des annonces
                                        </div>
                                        <div className="panel-sub">
                                            Toutes les annonces validées et
                                            refusées
                                        </div>
                                    </div>
                                    {annoncesHistorique.length > 0 && (
                                        <div className="hist-summary">
                                            <span className="hs-pill green">
                                                {annStats.validees} validée
                                                {annStats.validees > 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                            {annStats.refusees > 0 && (
                                                <span className="hs-pill red">
                                                    {annStats.refusees} refusée
                                                    {annStats.refusees > 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {annoncesHistorique.length === 0 && (
                                    <div className="empty-state">
                                        <svg
                                            width="36"
                                            height="36"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>
                                            Aucune annonce traitée pour le
                                            moment
                                        </span>
                                    </div>
                                )}
                                {annoncesHistorique.length > 0 && (
                                    <div className="ann-filters-bar">
                                        {[
                                            { v: "tous", l: "Toutes" },
                                            { v: "en_cours", l: "En cours" },
                                            { v: "validees", l: "Validées" },
                                            { v: "refusees", l: "Refusées" },
                                        ].map((f) => (
                                            <button
                                                key={f.v}
                                                className={`ann-filter-btn ${annFilter === f.v ? "active" : ""}`}
                                                onClick={() => {
                                                    setAnnFilter(f.v);
                                                    setAnnHistPage(1);
                                                }}
                                            >
                                                {f.l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {pagedAnnHist.map((item) => {
                                    const t = ANNONCE_TYPES.find(
                                        (x) =>
                                            x.value ===
                                            (item.type_annonce ||
                                                item.type_acte),
                                    );
                                    const isRefuse = String(
                                        item.statut,
                                    ).startsWith("REFUSEE");
                                    return (
                                        <div
                                            className="hist-item"
                                            key={`ann-hist-${item.id}-${item.validated_at}`}
                                        >
                                            <div
                                                className={`hist-icon-box atype-${t?.color}`}
                                                style={{ fontSize: 18 }}
                                            >
                                                {t?.emoji || "📢"}
                                            </div>
                                            <div className="hist-info">
                                                <div className="hist-name">
                                                    {t?.label ||
                                                        item.type_annonce}{" "}
                                                    {item.membre &&
                                                        `— ${item.membre.prenom} ${item.membre.nom}`}
                                                </div>
                                                <div className="hist-detail">
                                                    {item.classe?.nom && (
                                                        <>
                                                            <svg
                                                                width="10"
                                                                height="10"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                                                                />
                                                            </svg>
                                                            Classe{" "}
                                                            {item.classe.nom}{" "}
                                                            ·{" "}
                                                        </>
                                                    )}
                                                    {item.note_pastorale && (
                                                        <em>
                                                            {
                                                                item.note_pastorale
                                                            }
                                                        </em>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hist-right">
                                                <span
                                                    className={`badge ${isRefuse ? "badge-refuse" : "badge-valide"}`}
                                                >
                                                    <span className="badge-dot" />
                                                    {isRefuse
                                                        ? "REFUSÉE"
                                                        : "PUBLIÉE"}
                                                </span>
                                                <div className="hist-date">
                                                    {formatDate(
                                                        item.validated_at,
                                                    )}
                                                </div>
                                                {!isRefuse && (
                                                    <button
                                                        className="btn-pdf"
                                                        onClick={() =>
                                                            window.open(
                                                                `/pasteur/annonces/${item.id}/fiche`,
                                                                "_blank",
                                                            )
                                                        }
                                                    >
                                                        Télécharger fiche
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {annHistFiltered.length > 0 &&
                                    annHistTotalPages > 1 && (
                                        <div className="pager">
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setAnnHistPage(
                                                        annHistPage - 1,
                                                    )
                                                }
                                                disabled={annHistPage === 1}
                                            >
                                                Précédent
                                            </button>
                                            <div className="pager-info">
                                                Page {annHistPage} /{" "}
                                                {annHistTotalPages}
                                            </div>
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setAnnHistPage(
                                                        annHistPage + 1,
                                                    )
                                                }
                                                disabled={
                                                    annHistPage ===
                                                    annHistTotalPages
                                                }
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    )}
                            </div>
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
                                label="Classe"
                                value={
                                    activeActe.classe?.nom ||
                                    activeActe.classe_id ||
                                    "—"
                                }
                            />
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
                            <div className="modal-sep">Détails soumis</div>
                            <div className="modal-detail-box">
                                {Object.keys(activeActe.details || {})
                                    .length === 0 && (
                                    <span className="modal-empty">
                                        Aucun détail.
                                    </span>
                                )}
                                {Object.entries(activeActe.details || {}).map(
                                    ([k, v]) => (
                                        <div
                                            key={k}
                                            className="modal-detail-row"
                                        >
                                            <span className="modal-key">
                                                {prettyKey(k)}
                                            </span>
                                            <span className="modal-val">
                                                {String(v || "—")}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="modal-foot">
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
                            <div className="modal-field">
                                <label className="modal-label">
                                    Type d'acte
                                </label>
                                <select
                                    className="modal-select"
                                    value={createForm.type_acte}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            type_acte: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="bapteme">Baptême</option>
                                    <option value="mariage">Mariage</option>
                                    <option value="naissance">Naissance</option>
                                    <option value="deces">Décès</option>
                                    <option value="premiere_communion">
                                        Première communion
                                    </option>
                                    <option value="confirmation">
                                        Confirmation
                                    </option>
                                </select>
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Membre concerné
                                </label>
                                <select
                                    className="modal-select"
                                    value={createForm.membre_id}
                                    onChange={(e) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            membre_id: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Sélectionner</option>
                                    {familyMembers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.prenom || ""} {m.nom || ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-field">
                                <label className="modal-label">
                                    Date souhaitée{" "}
                                    <span className="modal-optional">
                                        (optionnel)
                                    </span>
                                </label>
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
                            <DetailRow
                                label="Statut"
                                value={activeAnnonce.statut}
                            />
                            <DetailRow
                                label="Classe"
                                value={activeAnnonce.classe?.nom || "—"}
                            />
                            <DetailRow
                                label="Soumise le"
                                value={formatDate(activeAnnonce.created_at)}
                            />
                            {activeAnnonce.date_annonce && (
                                <DetailRow
                                    label="Date événement"
                                    value={formatDate(
                                        activeAnnonce.date_annonce,
                                    )}
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
                                        "✦ Nouvelle annonce pastorale"}
                                    {annonceStep === 2 &&
                                        `${selectedType?.emoji || "📢"} ${selectedType?.label || "Annonce"}`}
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
                                Cette action valide d'abord l'annonce. La
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
function historyStatusLabel(status) {
    if (status === "VALIDEE") return "VALIDÉE";
    if (status === "REFUSEE_PAR_PASTEUR") return "REFUSÉE";
    if (status === "CELEBRE") return "CÉLÉBRÉ";
    if (status === "TERMINE") return "TERMINÉ";
    return status || "-";
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
.content{padding:28px 38px;max-width:1400px}

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
.quick-dropdown{min-width:300px;height:54px;background:#ECEFF4;border:2px solid #D9DEE8;border-radius:22px;padding:0 48px 0 46px;font-size:16px;font-weight:800;color:#111827;cursor:pointer;font-family:'Outfit',system-ui,sans-serif;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23586A84' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat,no-repeat;background-position:left 16px center,right 16px center;background-size:18px 18px,18px 18px}
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
.btn-mini:disabled{opacity:.5;cursor:not-allowed}.btn-mini-approve{background:var(--green-dim);color:var(--green);border-color:var(--green-border)}.btn-mini-refuse{background:var(--red-dim);color:var(--red);border-color:var(--red-border)}
.panel-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:var(--text)}.panel-sub{font-size:11.5px;color:var(--text2);margin-top:3px}
.panel-badge{font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;background:var(--gold-dim);color:var(--gold2);border:1px solid var(--gold-border)}

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
.hist-summary{display:flex;gap:8px}.hs-pill{font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px}.hs-pill.green{background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)}.hs-pill.red{background:var(--red-dim);color:var(--red);border:1px solid var(--red-border)}
.hist-item{display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid var(--border)}.hist-item:last-child{border-bottom:none}
.hist-check{display:inline-flex;align-items:center;cursor:pointer}.hist-check input{position:absolute;opacity:0;pointer-events:none}.hist-check span{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border2);background:rgba(255,255,255,0.08);display:inline-block;position:relative}.hist-check input:checked + span{background:var(--gold);border-color:var(--gold)}.hist-check input:checked + span::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:2px solid #1a1100;border-top:none;border-left:none;transform:rotate(45deg)}
.hist-icon-box{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;background:var(--gold-dim);border:1px solid var(--gold-border);flex-shrink:0}
.hist-info{flex:1;min-width:0}.hist-name{font-size:13px;font-weight:600;color:var(--text)}.hist-detail{font-size:11.5px;color:var(--text2);margin-top:3px;display:flex;align-items:center;gap:5px}.hist-detail em{font-style:italic;color:var(--text3)}
.hist-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}.hist-date{font-size:10.5px;color:var(--text3)}
.btn-pdf{font-size:10px;font-weight:700;color:var(--gold);background:var(--gold-dim);border:1px solid var(--gold-border);padding:3px 9px;border-radius:5px;cursor:pointer;font-family:inherit}

/* ANNONCES TAB */
.ann-tab-root{display:flex;flex-direction:column;gap:20px}
.ann-hero{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;background:linear-gradient(135deg,rgba(222,217,232,0.96) 100%,rgba(30,64,175,.14) 60%,rgba(235,241,237,0.91) 100%);border:1px solid rgba(124,58,237,.2);border-radius:14px;padding:20px 26px;box-shadow:0 8px 28px rgba(124,58,237,.1)}
.ann-hero-left{display:flex;align-items:center;gap:16px}
.ann-hero-pulse{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,rgba(229,224,238,0.91),rgba(193,196,206,0.91));border:1px solid rgba(225,220,235,0.9);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0}
.ann-hero-title{font-size:19px;font-weight:800;color:white;text-shadow:0 1px 4px rgba(0,0,0,.2)}.ann-hero-sub{font-size:11.5px;color:rgba(255,255,255,.6);margin-top:4px;line-height:1.5}
.ann-hero-stats{display:flex;gap:10px;flex-wrap:wrap}
.ann-mini-stat{text-align:center;padding:10px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.2);min-width:64px;backdrop-filter:blur(8px)}
.ann-mini-n{font-size:20px;font-weight:800;line-height:1}.ann-mini-l{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-top:3px;opacity:.75}
.ann-mini-orange{background:rgba(236,105,35,.86);color:#e8a060;border-color:rgba(32,21,232,.91)}.ann-mini-sage{background:rgba(74,124,94,.12);color:#70B888;border-color:rgba(74,124,94,.18)}.ann-mini-terra{background:rgba(192,96,64,.12);color:#D89080;border-color:rgba(192,96,64,.18)}.ann-mini-sky{background:rgba(58,124,168,.12);color:#D8AD80EA;border-color:rgba(58,124,168,.18)}

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
.modal{background:var(--surface-solid);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:520px;margin:20px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.6);animation:mIn .3s cubic-bezier(.34,1.56,.64,1) both}
@keyframes mIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-head{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-head-left{display:flex;align-items:center;gap:12px}
.modal-head-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.modal-head-icon.gold{background:var(--gold-dim);color:var(--gold2)}.modal-head-icon.red{background:var(--red-dim);color:var(--red)}.modal-head-icon.blue{background:var(--blue-dim);color:var(--blue)}
.modal-title{font-size:17px;font-weight:700;color:var(--text)}
.modal-sub{font-size:11.5px;color:var(--text2);margin-top:3px}
.modal-close{width:30px;height:30px;border-radius:8px;background:var(--surface3);border:1px solid var(--border);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:inherit}
.modal-close:hover{background:rgba(255,255,255,.2);color:var(--text)}
.modal-body{padding:22px 24px}
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

@media(max-width:1100px){.kpi-row{grid-template-columns:repeat(2,1fr)}.layout-grid{grid-template-columns:1fr}.hero-header-inner{flex-wrap:wrap;justify-content:center}.hero-header-center{order:1;width:100%}.hero-header-actions{order:2;flex-direction:row}}
@media(max-width:700px){.content{padding:14px}.kpi-row{grid-template-columns:1fr 1fr}.acte-actions{flex-direction:column}.pastoral-box{flex-wrap:wrap}.pastoral-stats{width:100%;justify-content:center}.tab-toolbar{align-items:stretch}.main-tabs{width:100%}.quick-tools{width:100%;justify-content:flex-start}.quick-dropdown{width:100%;min-width:0}.quick-search{width:100%;min-width:0}.ann-type-grid{grid-template-columns:1fr}.hero-stats-row{flex-wrap:wrap}.h1.hero-title{font-size:20px}}
@media(max-width:480px){.kpi-row{grid-template-columns:1fr}.hero-header-actions{flex-direction:column;width:100%}.btn-hero-annonce,.btn-hero-acte{width:100%;justify-content:center}}
`;
