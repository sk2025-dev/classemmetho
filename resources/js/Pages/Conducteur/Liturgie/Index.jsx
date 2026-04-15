import React, { useEffect, useMemo, useState } from "react";
import { normalizePhotoUrl } from "@/Helpers/PhotoUrlHelper";
import { withBasePath } from "../../../Utils/urlHelper";

// Composant pour visualiser les fiches PDF par date
function FichesMariageModal({ open, onClose, acte, ids, onEdit, onSent }) {
    const [dates, setDates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [pdfUrl, setPdfUrl] = useState("");
    const [destinataire, setDestinataire] = useState("");
    const [subject, setSubject] = useState("Fiche finale des mariages");
    const [message, setMessage] = useState(
        "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des mariages.\n\nBien cordialement.",
    );
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");

    useEffect(() => {
        if (!open) return;
        setSendError("");
        setDestinataire("");
        setSubject("Fiche finale des mariages");
        setMessage(
            "Bonjour,\n\nVeuillez trouver en pièce jointe la fiche finale des mariages.\n\nBien cordialement.",
        );

        if (acte) {
            setLoading(false);
            setSelectedDate(null);
            const type = String(acte.type_acte || "").toLowerCase();
            const previewUrl =
                type === "naissance" || type === "deces"
                    ? withBasePath(
                          "",
                          `/conducteur/liturgie/${acte.id}/fiche?preview=1`,
                      )
                    : withBasePath(
                          "",
                          `/conducteur/liturgie/${acte.id}/fiche-conducteur?preview=1`,
                      );
            setPdfUrl(previewUrl);
            return;
        }
        if (ids?.length > 0) {
            setLoading(false);
            setSelectedDate(null);
            setPdfUrl(
                withBasePath(
                    "",
                    `/conducteur/liturgie/${ids[0]}/fiche-conducteur?preview=1&ids=${ids.join(",")}`,
                ),
            );
            return;
        }
        setLoading(true);
        setSelectedDate(null);
        setPdfUrl("");
        axios
            .get(withBasePath("", "/api/conducteur/liturgie/fiches-dates"))
            .then((res) => setDates(res.data?.dates || []))
            .finally(() => setLoading(false));
    }, [open, acte, ids]);

    const handleSendFromApp = async () => {
        const targetIds =
            Array.isArray(ids) && ids.length > 0
                ? ids
                : acte?.id
                  ? [acte.id]
                  : [];

        if (!targetIds.length) {
            setSendError("Aucune demande sélectionnée pour l'envoi.");
            return;
        }

        if (!destinataire.trim()) {
            setSendError("L'adresse email du destinataire est obligatoire.");
            return;
        }

        try {
            setSending(true);
            setSendError("");
            const res = await axios.post(
                withBasePath("", "/conducteur/liturgie/fiche/envoyer"),
                {
                    ids: targetIds,
                    destinataire: destinataire.trim(),
                    subject: subject.trim(),
                    message: message.trim(),
                },
            );
            onSent?.(res.data);
            onClose?.();
        } catch (error) {
            setSendError(
                error?.response?.data?.message ||
                    "Impossible d'envoyer l'email depuis l'application.",
            );
        } finally {
            setSending(false);
        }
    };

    const renderSendForm = () => (
        <div
            style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #dbeafe",
                borderRadius: 8,
                background: "#f8fbff",
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1e40af",
                    marginBottom: 10,
                }}
            >
                Envoyer la fiche par email depuis l'application
            </div>
            <div style={{ display: "grid", gap: 10 }}>
                <input
                    type="email"
                    value={destinataire}
                    onChange={(event) => setDestinataire(event.target.value)}
                    placeholder="Destinataire (ex: contact@eglise.org)"
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                    }}
                />
                <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Objet"
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                    }}
                />
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    placeholder="Message"
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        resize: "vertical",
                    }}
                />
            </div>
            {sendError ? (
                <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 12 }}>
                    {sendError}
                </div>
            ) : null}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 10,
                }}
            >
                <button
                    type="button"
                    onClick={handleSendFromApp}
                    disabled={sending}
                    style={{
                        background: sending ? "#94a3b8" : "#1e40af",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 14px",
                        cursor: sending ? "not-allowed" : "pointer",
                        fontWeight: 600,
                    }}
                >
                    {sending
                        ? "Envoi en cours..."
                        : "Envoyer depuis l'application"}
                </button>
            </div>
        </div>
    );

    const handleVoirFiche = (date) => {
        setSelectedDate(date);
        setPdfUrl(
            withBasePath("", `/api/conducteur/liturgie/fiche-pdf?date=${date}`),
        );
    };
    if (!open) return null;
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.35)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 24,
                    minWidth: 350,
                    maxWidth: 700,
                    width: "90%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: 20 }}>
                        Fiches des demandes de mariage par jour
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            fontSize: 22,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        &times;
                    </button>
                </div>
                {loading ? (
                    <div>Chargement…</div>
                ) : acte ? (
                    <div>
                        <div
                            style={{
                                marginBottom: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div>
                                <strong>
                                    Fiche de la demande de{" "}
                                    {prettyType(acte.type_acte)}
                                </strong>
                                <div>
                                    {acte.membre?.prenom} {acte.membre?.nom}
                                </div>
                            </div>
                            {onEdit && (
                                <button
                                    className="btn"
                                    onClick={() => onEdit(acte)}
                                    style={{
                                        padding: "8px 14px",
                                        fontSize: 13,
                                        cursor: "pointer",
                                    }}
                                >
                                    Voir / modifier la demande
                                </button>
                            )}
                        </div>
                        {pdfUrl ? (
                            <div
                                style={{
                                    height: 600,
                                    border: "1px solid #ccc",
                                }}
                            >
                                <iframe
                                    src={pdfUrl}
                                    title="Fiche PDF"
                                    width="100%"
                                    height="100%"
                                    style={{ border: "none" }}
                                    allow="autoplay"
                                />
                            </div>
                        ) : (
                            <div>Chargement de la fiche…</div>
                        )}
                        {renderSendForm()}
                    </div>
                ) : ids?.length > 0 ? (
                    <div>
                        <div
                            style={{
                                marginBottom: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div>
                                <strong>
                                    Fiche des demandes sélectionnées
                                </strong>
                                <div>{ids.length} demande(s)</div>
                            </div>
                        </div>
                        {pdfUrl ? (
                            <div
                                style={{
                                    height: 600,
                                    border: "1px solid #ccc",
                                }}
                            >
                                <iframe
                                    src={pdfUrl}
                                    title="Fiche PDF"
                                    width="100%"
                                    height="100%"
                                    style={{ border: "none" }}
                                    allow="autoplay"
                                />
                            </div>
                        ) : (
                            <div>Chargement de la fiche…</div>
                        )}
                        {renderSendForm()}
                    </div>
                ) : (
                    <div>
                        <ul style={{ marginBottom: 16 }}>
                            {dates.length === 0 && (
                                <li>Aucune fiche disponible.</li>
                            )}
                            {dates.map((date) => (
                                <li key={date} style={{ marginBottom: 8 }}>
                                    <button
                                        onClick={() => handleVoirFiche(date)}
                                        style={{ marginRight: 8 }}
                                    >
                                        Voir la fiche du {date}
                                    </button>
                                    {selectedDate === date && pdfUrl && (
                                        <span style={{ color: "green" }}>
                                            {" "}
                                            (ouverte ci-dessous)
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {pdfUrl && (
                            <div
                                style={{
                                    height: 600,
                                    border: "1px solid #ccc",
                                }}
                            >
                                <iframe
                                    src={pdfUrl}
                                    title="Fiche PDF"
                                    width="100%"
                                    height="100%"
                                    style={{ border: "none" }}
                                    allow="autoplay"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
import axios from "axios";
import { Link } from "@inertiajs/react";
import MiniCalendar from "../../../Components/MiniCalendar";

const SOUMISES_PER_PAGE = 6;
const HISTO_PER_PAGE = 8;
const ANNONCES_PER_PAGE = 8;

const ACTE_TYPES = [
    { value: "bapteme", label: "Baptême" },
    { value: "premiere_communion", label: "Première Communion" },
    {
        value: "bapteme_premiere_communion",
        label: "Baptême + Première Communion",
    },
    { value: "confirmation", label: "Confirmation" },
    { value: "mariage", label: "Mariage" },
    { value: "naissance", label: "Naissance" },
    { value: "deces", label: "Décès" },
];

const ACTE_REQUIRED_FIELDS = {
    bapteme: [],
    premiere_communion: ["date", "lieu"],
    bapteme_premiere_communion: ["date", "lieu"],
    confirmation: ["confirmand", "date", "lieu"],
    // Le membre concerne est deja l'un des conjoints
    mariage: ["date", "lieu", "type_mariage"],
    naissance: ["nom_enfant", "date_naissance", "parents"],
    // Le membre concerne est deja le defunt
    deces: ["date_deces"],
};

const ACTE_DETAIL_LABELS = {
    date: "Date de l'acte",
    lieu: "Lieu",
    confirmand: "Confirmand",
    conjoint_1: "Conjoint 1",
    conjoint_2: "Conjoint 2",
    type_mariage: "Type de mariage",
    nom_enfant: "Nom de l'enfant",
    date_naissance: "Date de naissance",
    parents: "Parents",
    nom_defunt: "Nom du défunt",
    date_deces: "Date du décès",
    lien_familial: "Lien familial",
};

const ACTE_DETAIL_INPUT_TYPES = {
    date: "date",
    date_naissance: "date",
    date_deces: "date",
};

const ANNONCE_TYPES = [
    {
        value: "priere",
        label: "Demande de prière",
        emoji: "🙏",
        color: "violet",
    },
    { value: "grace", label: "Action de grâce", emoji: "🙌", color: "gold" },
    { value: "deces", label: "Avis de décès", emoji: "⚰️", color: "slate" },
    {
        value: "generale",
        label: "Annonce générale",
        emoji: "📢",
        color: "green",
    },
];

export default function Index({
    actes = [],
    familyMembers = [],
    classes = [],
    annonces: rawAnnonces = [],
    calendarEvents = [],
}) {
    // ...existing code...
    // Modal pour fiches PDF mariage
    const [ficheModalOpen, setFicheModalOpen] = useState(false);
    const [ficheModalActe, setFicheModalActe] = useState(null);
    const [ficheModalSelectedIds, setFicheModalSelectedIds] = useState([]);
    const closeFicheModal = () => {
        setFicheModalOpen(false);
        setFicheModalActe(null);
        setFicheModalSelectedIds([]);
    };
    const openFicheModalForSelected = () => {
        if (selectedIds.size === 0) {
            showToast(
                "Sélectionnez au moins une demande pour afficher la fiche.",
            );
            return;
        }
        setFicheModalActe(null);
        setFicheModalSelectedIds(Array.from(selectedIds));
        setFicheModalOpen(true);
    };
    const openFicheModalForActe = (acte) => {
        setFicheModalSelectedIds([]);
        setFicheModalActe(acte);
        setFicheModalOpen(true);
    };
    /* ── ACTES state ── */
    const [localActes, setLocalActes] = useState(actes);
    const [tab, setTab] = useState("soumises");
    const [modal, setModal] = useState(null);
    const [detailTab, setDetailTab] = useState("infos");
    const [selected, setSelected] = useState(null);
    const [commentaire, setCommentaire] = useState("");
    const [processing, setProcessing] = useState(false);
    const selectedIsMariage =
        String(selected?.type_acte || "").toLowerCase() === "mariage";
    const [toast, setToast] = useState("");
    const [soumisesPage, setSoumisesPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [historiquePage, setHistoriquePage] = useState(1);
    const [selectedCeremonyIds, setSelectedCeremonyIds] = useState(
        () => new Set(),
    );
    const [quickFilter, setQuickFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const defaultCreateForm = () => ({
        type_acte: "",
        membre_id: familyMembers[0]?.id || "",
        classe_id: familyMembers[0]?.classe_id || classes[0]?.id || "",
        date_souhaitee: "",
        message: "",
        details: {},
    });
    const [createForm, setCreateForm] = useState(defaultCreateForm);
    const [acteProcessing, setActeProcessing] = useState(false);
    /* ── ANNONCES state ── */
    const [localAnnonces, setLocalAnnonces] = useState(rawAnnonces);
    const [annoncesSubTab, setAnnoncesSubTab] = useState("pending"); // pending | done | mine
    const [annoncesPage, setAnnoncesPage] = useState(1);
    const [selectedAnnonce, setSelectedAnnonce] = useState(null);
    const [annonceModal, setAnnonceModal] = useState(null);
    const [annonceComment, setAnnonceComment] = useState("");
    const [annonceProcessing, setAnnonceProcessing] = useState(false);
    const [annSelectedIds, setAnnSelectedIds] = useState(() => new Set());
    const [myAnnonceCreator, setMyAnnonceCreator] = useState(null); // Track who is creating annonces
    // création d'annonces par le conducteur
    const [annonceForm, setAnnonceForm] = useState({
        type_annonce: "",
        membre_id: familyMembers[0]?.id || "",
        message: "",
        date_annonce: "",
        date_publication: "",
        date_expiration: "",
    });
    const [annonceStep, setAnnonceStep] = useState(1);
    const selectedType = ANNONCE_TYPES.find(
        (t) => t.value === annonceForm.type_annonce,
    );
    const selectedActeType = ACTE_TYPES.find(
        (t) => t.value === createForm.type_acte,
    );
    const requiredActeFields = ACTE_REQUIRED_FIELDS[createForm.type_acte] || [];

    /* ── COMPUTED actes ── */
    const stats = useMemo(() => {
        const soumises = localActes.filter(
            (a) => a.statut === "SOUMISE",
        ).length;
        const transmises = localActes.filter(
            (a) => a.statut === "TRANSMISE_AU_PASTEUR",
        ).length;
        const valides = localActes.filter((a) =>
            ["VALIDEE", "PUBLIEE", "ARCHIVEE"].includes(a.statut),
        ).length;
        return { soumises, transmises, valides, total: localActes.length };
    }, [localActes]);

    const searchNeedle = searchTerm.trim().toLowerCase();
    const filteredActes = useMemo(() => {
        return localActes.filter((a) => {
            if (quickFilter === "mes_annonces") return false;
            if (
                quickFilter !== "all" &&
                quickFilter !== "mes_demandes" &&
                String(a.type_acte || "").toLowerCase() !==
                    quickFilter.toLowerCase()
            ) {
                return false;
            }
            if (!searchNeedle) return true;
            return [
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
            );
        });
    }, [localActes, quickFilter, searchNeedle]);

    // Types d'annonces à exclure de l'onglet soumises (deces est un acte liturgique, pas une annonce)
    const ANNONCE_TYPE_VALUES = ["priere", "grace", "generale"];

    const soumises = filteredActes.filter(
        (a) =>
            a.statut === "SOUMISE" &&
            !ANNONCE_TYPE_VALUES.includes(
                String(a.type_acte || "").toLowerCase(),
            ),
    );
    const transmises = filteredActes.filter(
        (a) =>
            a.statut === "TRANSMISE_AU_PASTEUR" &&
            !ANNONCE_TYPE_VALUES.includes(
                String(a.type_acte || "").toLowerCase(),
            ),
    );
    const historique = filteredActes.filter(
        (a) =>
            [
                "VALIDEE",
                "PUBLIEE",
                "ARCHIVEE",
                "REFUSEE_PAR_CONDUCTEUR",
                "REFUSEE_PAR_PASTEUR",
            ].includes(a.statut) &&
            !ANNONCE_TYPE_VALUES.includes(
                String(a.type_acte || "").toLowerCase(),
            ),
    );

    const soumisesTotalPages = Math.max(
        1,
        Math.ceil(soumises.length / SOUMISES_PER_PAGE),
    );
    const pagedSoumises = soumises.slice(
        (soumisesPage - 1) * SOUMISES_PER_PAGE,
        soumisesPage * SOUMISES_PER_PAGE,
    );
    const historiqueTotalPages = Math.max(
        1,
        Math.ceil(historique.length / HISTO_PER_PAGE),
    );
    const pagedHistorique = historique.slice(
        (historiquePage - 1) * HISTO_PER_PAGE,
        historiquePage * HISTO_PER_PAGE,
    );

    const allPageSelected =
        pagedSoumises.length > 0 &&
        pagedSoumises.every((a) => selectedIds.has(a.id));

    const ceremonyActs = useMemo(() => {
        return [...localActes]
            .filter((act) => {
                const date = act.date_souhaitee || act.details?.date_souhaitee;
                return (
                    String(act.type_acte || "").toLowerCase() === "mariage" &&
                    act.details?.ceremonie_statut ===
                        "CEREMONIE_SOUMISE_AU_CONDUCTEUR" &&
                    Boolean(date)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a.details?.ceremonie_soumise_at || a.updated_at,
                ).getTime();
                const dateB = new Date(
                    b.details?.ceremonie_soumise_at || b.updated_at,
                ).getTime();
                return dateB - dateA;
            });
    }, [localActes]);

    const allCeremonySelected =
        ceremonyActs.length > 0 &&
        ceremonyActs.every((a) => selectedCeremonyIds.has(a.id));

    const toggleCeremonySelect = (id) =>
        setSelectedCeremonyIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const clearCeremonySelection = () => setSelectedCeremonyIds(new Set());

    const toggleSelectAllCeremony = () =>
        setSelectedCeremonyIds((prev) => {
            const next = new Set(prev);
            if (allCeremonySelected) {
                ceremonyActs.forEach((a) => next.delete(a.id));
            } else {
                ceremonyActs.forEach((a) => next.add(a.id));
            }
            return next;
        });

    const approveSelectedCeremony = async () => {
        const ids = Array.from(selectedCeremonyIds);
        if (!ids.length) {
            showToast("Sélectionnez au moins une date.");
            return;
        }

        try {
            setProcessing(true);
            const results = await Promise.all(
                ids.map((id) =>
                    axios.post(
                        withBasePath(
                            "",
                            `/conducteur/liturgie/${id}/ceremonie/decision`,
                        ),
                        {
                            statut: "CEREMONIE_TRANSMISE_AU_PASTEUR",
                            commentaire: "",
                        },
                    ),
                ),
            );

            const updatedById = new Map(
                results
                    .map((r) => r?.data?.acte)
                    .filter(Boolean)
                    .map((a) => [a.id, a]),
            );

            setLocalActes((prev) =>
                prev.map((a) => updatedById.get(a.id) || a),
            );

            clearCeremonySelection();
            showToast(
                `${ids.length} date${ids.length > 1 ? "s" : ""} transmise${ids.length > 1 ? "s" : ""} au pasteur.`,
            );
        } catch (e) {
            showToast(
                e?.response?.data?.message ||
                    "Echec de la validation groupée des dates.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const conducteurClasseId = useMemo(
        () => String(classes?.[0]?.id || familyMembers?.[0]?.classe_id || ""),
        [classes, familyMembers],
    );

    const ceremonyHistoryRows = useMemo(() => {
        const uniqueRows = new Map();

        localActes.forEach((acte) => {
            const type = String(acte?.type_acte || "")
                .trim()
                .toLowerCase();
            if (type !== "mariage") return;

            const details = acte?.details || {};
            const ceremonyStatut = String(details?.ceremonie_statut || "")
                .trim()
                .toUpperCase();
            const classId = String(acte?.classe_id || acte?.classe?.id || "");

            if (conducteurClasseId && classId && classId !== conducteurClasseId)
                return;

            const validatedByConducteur =
                ceremonyStatut === "CEREMONIE_TRANSMISE_AU_PASTEUR" ||
                [
                    "CEREMONIE_VALIDEE_PAR_PASTEUR",
                    "CEREMONIE_VALIDE_PAR_PASTEUR",
                    "CEREMONIE_REFUSEE_PAR_PASTEUR",
                ].includes(ceremonyStatut) ||
                Boolean(details?.ceremonie_transmise_pasteur_at);

            if (!validatedByConducteur) return;

            const dateChosen =
                details?.date_souhaitee || acte?.date_souhaitee || null;
            if (!dateChosen) return;

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
            const conducteurValidatedAt =
                details?.ceremonie_transmise_pasteur_at ||
                details?.ceremonie_soumise_at ||
                acte?.updated_at ||
                acte?.created_at;

            const rowKey = [
                acte?.id,
                dateChosen,
                ceremonyStatut,
                conducteurValidatedAt || "",
            ].join("|");

            if (!uniqueRows.has(rowKey)) {
                uniqueRows.set(rowKey, {
                    rowKey,
                    id: acte?.id,
                    reference: acte?.reference || `ACTE-${acte?.id}`,
                    memberName,
                    fianceName,
                    witnesses,
                    dateChosen,
                    ceremonyStatut,
                    conducteurValidatedAt,
                    classeName: acte?.classe?.nom || "—",
                });
            }
        });

        return Array.from(uniqueRows.values()).sort((a, b) => {
            const dateA = new Date(a?.conducteurValidatedAt || 0).getTime();
            const dateB = new Date(b?.conducteurValidatedAt || 0).getTime();
            return dateB - dateA;
        });
    }, [localActes, conducteurClasseId]);

    /* ── COMPUTED annonces ── */
    const filteredAnnonces = useMemo(() => {
        return localAnnonces.filter((a) => {
            if (quickFilter === "mes_demandes") return false;
            if (
                quickFilter !== "all" &&
                quickFilter !== "mes_annonces" &&
                ![a.type_annonce, a.type_acte]
                    .map((field) => String(field || "").toLowerCase())
                    .includes(quickFilter.toLowerCase())
            ) {
                return false;
            }
            if (!searchNeedle) return true;
            return [
                a.type_annonce,
                a.type_acte,
                a.statut,
                a.message,
                a.details?.contenu,
                a.createur?.prenom,
                a.createur?.nom,
                a.nom_concerne,
            ].some((field) =>
                String(field || "")
                    .toLowerCase()
                    .includes(searchNeedle),
            );
        });
    }, [localAnnonces, quickFilter, searchNeedle]);

    // Helper pour identifier les annonces créées par le conducteur
    const isMyAnnonce = (ann) => {
        if (!myAnnonceCreator) return false;
        return (
            ann.createur?.id === myAnnonceCreator.id ||
            (ann.createur?.prenom === myAnnonceCreator.prenom &&
                ann.createur?.nom === myAnnonceCreator.nom)
        );
    };

    const annEnAttente = filteredAnnonces.filter(
        (a) => a.statut === "SOUMISE" && !isMyAnnonce(a),
    );
    const annTraitees = filteredAnnonces.filter(
        (a) => a.statut !== "SOUMISE" && !isMyAnnonce(a),
    );
    const annMines = filteredAnnonces.filter((a) => isMyAnnonce(a));
    const annDisplay =
        annoncesSubTab === "pending"
            ? annEnAttente
            : annoncesSubTab === "done"
              ? annTraitees
              : annMines;
    const annTotalPages = Math.max(
        1,
        Math.ceil(annDisplay.length / ANNONCES_PER_PAGE),
    );
    const pagedAnn = annDisplay.slice(
        (annoncesPage - 1) * ANNONCES_PER_PAGE,
        annoncesPage * ANNONCES_PER_PAGE,
    );
    const allAnnSel =
        pagedAnn.filter((a) => a.statut === "SOUMISE").length > 0 &&
        pagedAnn
            .filter((a) => a.statut === "SOUMISE")
            .every((a) => annSelectedIds.has(a.id));

    useEffect(() => {
        if (soumisesPage > soumisesTotalPages)
            setSoumisesPage(soumisesTotalPages);
    }, [soumisesPage, soumisesTotalPages]);
    useEffect(() => {
        if (historiquePage > historiqueTotalPages)
            setHistoriquePage(historiqueTotalPages);
    }, [historiquePage, historiqueTotalPages]);
    useEffect(() => {
        if (annoncesPage > annTotalPages) setAnnoncesPage(annTotalPages);
    }, [annoncesPage, annTotalPages]);
    useEffect(() => {
        if (quickFilter === "mes_demandes") {
            setTab("soumises");
        }
        if (quickFilter === "mes_annonces") {
            setTab("annonces");
            setAnnoncesSubTab("pending");
        }
    }, [quickFilter]);
    useEffect(() => {
        setSoumisesPage(1);
        setHistoriquePage(1);
        setAnnoncesPage(1);
    }, [quickFilter, searchTerm]);
    // Sync localAnnonces with rawAnnonces when props change (e.g. page reload)
    useEffect(() => {
        setLocalAnnonces(rawAnnonces);
    }, [rawAnnonces]);

    // Detect conductor's own annonces on initial load
    useEffect(() => {
        if (!myAnnonceCreator && rawAnnonces.length > 0) {
            // Look for an annonce created by a conductor (not a responsable)
            const conductorAnnonce = rawAnnonces.find(
                (a) =>
                    a.createur?.role === "conducteur" ||
                    a.createur?.fonction?.nom
                        ?.toLowerCase()
                        .includes("conducteur"),
            );
            if (conductorAnnonce?.createur) {
                setMyAnnonceCreator(conductorAnnonce.createur);
            }
        }
    }, [rawAnnonces]);

    useEffect(() => {
        setCreateForm((prev) => ({
            ...prev,
            membre_id: familyMembers[0]?.id || prev.membre_id,
            classe_id:
                familyMembers[0]?.classe_id || classes[0]?.id || prev.classe_id,
        }));
    }, [familyMembers, classes]);
    /* ── HELPERS ── */
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3500);
    };

    const submitActe = async () => {
        if (acteProcessing) return;
        if (!createForm.type_acte) {
            showToast("Sélectionnez un type d'acte.");
            return;
        }
        if (!createForm.membre_id) {
            showToast("Sélectionnez un membre concerné.");
            return;
        }
        if (!createForm.date_souhaitee) {
            showToast("La date souhaitée est requise.");
            return;
        }
        if (!createForm.message.trim()) {
            showToast("Ajoutez un message ou une note.");
            return;
        }
        for (const field of requiredActeFields) {
            const value = String(createForm.details?.[field] || "").trim();
            if (!value) {
                showToast(
                    `Le champ \"${ACTE_DETAIL_LABELS[field] || field}\" est requis.`,
                );
                return;
            }
        }
        try {
            setActeProcessing(true);
            const selectedMember = familyMembers.find(
                (member) => String(member.id) === String(createForm.membre_id),
            );
            const selectedMemberName = selectedMember
                ? `${selectedMember.prenom || ""} ${selectedMember.nom || ""}`.trim()
                : "";

            // Compatibilite aval: certains ecrans utilisent encore ces cles detail.
            const normalizedDetails = {
                ...(createForm.details || {}),
            };
            if (createForm.type_acte === "mariage" && selectedMemberName) {
                normalizedDetails.conjoint_1 = selectedMemberName;
            }
            if (createForm.type_acte === "deces" && selectedMemberName) {
                normalizedDetails.nom_defunt = selectedMemberName;
            }

            const payload = {
                type_acte: createForm.type_acte,
                membre_id: createForm.membre_id,
                classe_id: createForm.classe_id || null,
                date_souhaitee: createForm.date_souhaitee,
                details: {
                    message: createForm.message,
                    ...normalizedDetails,
                },
            };
            const res = await axios.post(
                withBasePath("", "/conducteur/liturgie"),
                payload,
            );
            const acte = res.data?.acte;
            if (acte) {
                setLocalActes((prev) => [acte, ...prev]);
            }
            setCreateForm(defaultCreateForm());
            closeModal();
            showToast(res.data?.message || "Demande transmise au pasteur.");
        } catch (e) {
            showToast(
                e?.response?.data?.message || "Échec de la création de l'acte.",
            );
        } finally {
            setActeProcessing(false);
        }
    };

    /* ── ACTES actions ── */
    const openModal = (name, acte = null) => {
        setSelected(acte);
        setCommentaire("");
        if (name === "create") {
            setCreateForm(defaultCreateForm());
        }
        if (name === "detail") {
            setDetailTab("infos");
        }
        if (name === "ceremony") {
            setDetailTab("ceremony");
        }
        setModal(name);
    };
    const closeModal = () => {
        setSelected(null);
        setCommentaire("");
        setModal(null);
        setCreateForm(defaultCreateForm());
    };

    const toggleSelected = (id) =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    const clearSelection = () => setSelectedIds(new Set());
    const toggleSelectAllPage = () =>
        setSelectedIds((prev) => {
            const n = new Set(prev);
            allPageSelected
                ? pagedSoumises.forEach((a) => n.delete(a.id))
                : pagedSoumises.forEach((a) => n.add(a.id));
            return n;
        });

    const approveSelected = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        try {
            setProcessing(true);
            for (const id of ids)
                await axios.post(
                    withBasePath("", `/conducteur/liturgie/${id}/transition`),
                    {
                        statut: "TRANSMISE_AU_PASTEUR",
                        commentaire: "",
                    },
                );
            setLocalActes((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "TRANSMISE_AU_PASTEUR",
                              updated_at: new Date().toISOString(),
                          }
                        : a,
                ),
            );
            clearSelection();
            showToast("✅ Demandes transmises au pasteur.");
        } catch (e) {
            showToast(
                e?.response?.data?.message || "Echec de la validation groupée.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const refuseSelected = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        const reason = window.prompt("Motif du refus ?");
        if (!reason?.trim()) return;
        try {
            setProcessing(true);
            for (const id of ids)
                await axios.post(
                    withBasePath("", `/conducteur/liturgie/${id}/transition`),
                    {
                        statut: "REFUSEE_PAR_CONDUCTEUR",
                        commentaire: reason,
                    },
                );
            setLocalActes((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "REFUSEE_PAR_CONDUCTEUR",
                              updated_at: new Date().toISOString(),
                              note_conducteur: reason,
                          }
                        : a,
                ),
            );
            clearSelection();
            showToast("Demandes refusées.");
        } catch (e) {
            showToast(e?.response?.data?.message || "Echec du refus groupé.");
        } finally {
            setProcessing(false);
        }
    };

    const submitTransition = async (statut) => {
        if (!selected?.id) return;
        if (statut === "REFUSEE_PAR_CONDUCTEUR" && !commentaire.trim()) {
            showToast("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            await axios.post(
                withBasePath(
                    "",
                    `/conducteur/liturgie/${selected.id}/transition`,
                ),
                {
                    statut,
                    commentaire,
                },
            );
            setLocalActes((prev) =>
                prev.map((a) =>
                    a.id === selected.id
                        ? {
                              ...a,
                              statut,
                              updated_at: new Date().toISOString(),
                              note_conducteur: commentaire || a.note_conducteur,
                          }
                        : a,
                ),
            );
            closeModal();
            showToast(
                statut === "TRANSMISE_AU_PASTEUR"
                    ? "✅ Demande transmise au pasteur."
                    : "Demande refusée.",
            );
        } catch (e) {
            showToast(
                e?.response?.data?.errors?.commentaire?.[0] ||
                    e?.response?.data?.message ||
                    "Echec de la mise à jour.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const submitCeremonyDecision = async (statut, acte = selected) => {
        if (!acte?.id) return;
        if (
            statut === "CEREMONIE_REFUSEE_PAR_CONDUCTEUR" &&
            !commentaire.trim()
        ) {
            showToast("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setProcessing(true);
            const { data } = await axios.post(
                withBasePath(
                    "",
                    `/conducteur/liturgie/${acte.id}/ceremonie/decision`,
                ),
                {
                    statut,
                    commentaire,
                },
            );
            if (data?.acte) {
                setLocalActes((prev) =>
                    prev.map((a) => (a.id === acte.id ? data.acte : a)),
                );
                setSelected(data.acte);
            }
            closeModal();
            showToast(
                statut === "CEREMONIE_TRANSMISE_AU_PASTEUR"
                    ? "La date choisie a été transmise au pasteur."
                    : "La demande de date a été refusée.",
            );
        } catch (e) {
            showToast(
                e?.response?.data?.message ||
                    "Echec de l'envoi de la decision de ceremonie.",
            );
        } finally {
            setProcessing(false);
        }
    };

    const hasCeremonyChoice = (acte) =>
        acte?.type_acte === "mariage" &&
        acte?.details?.ceremonie_creneau &&
        acte?.details?.ceremonie_statut;

    /* ── ANNONCES actions ── */
    const openAnnonceModal = (name, ann = null) => {
        setSelectedAnnonce(ann);
        setAnnonceComment("");
        setAnnonceModal(name);
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
    const closeAnnonceModal = () => {
        setSelectedAnnonce(null);
        setAnnonceComment("");
        setAnnonceModal(null);
        // reset creation state
        setAnnonceStep(1);
        setAnnonceForm({
            type_annonce: "",
            membre_id: familyMembers[0]?.id || "",
            message: "",
            date_annonce: "",
            date_publication: "",
            date_expiration: "",
        });
    };

    const toggleAnnSel = (id) =>
        setAnnSelectedIds((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    const toggleAllAnnPage = () =>
        setAnnSelectedIds((prev) => {
            const n = new Set(prev);
            const pending = pagedAnn.filter((a) => a.statut === "SOUMISE");
            allAnnSel
                ? pending.forEach((a) => n.delete(a.id))
                : pending.forEach((a) => n.add(a.id));
            return n;
        });

    const getAnnonceAction = (statut, id, commentaire = "") => {
        if (statut === "TRANSMISE_AU_PASTEUR") {
            return axios.post(
                withBasePath("", `/conducteur/annonces/${id}/valider`),
                {
                    note: commentaire,
                },
            );
        }
        if (statut === "REFUSEE_PAR_CONDUCTEUR") {
            return axios.post(
                withBasePath("", `/conducteur/annonces/${id}/rejeter`),
                {
                    motif_rejet: commentaire,
                },
            );
        }
        // fallback : valider
        return axios.post(
            withBasePath("", `/conducteur/annonces/${id}/valider`),
            {
                note: commentaire,
            },
        );
    };

    const submitAnnonceTransition = async (statut) => {
        if (!selectedAnnonce?.id) return;
        if (statut === "REFUSEE_PAR_CONDUCTEUR" && !annonceComment.trim()) {
            showToast("Le motif du refus est obligatoire.");
            return;
        }
        try {
            setAnnonceProcessing(true);
            await getAnnonceAction(statut, selectedAnnonce.id, annonceComment);
            setLocalAnnonces((prev) =>
                prev.map((a) =>
                    a.id === selectedAnnonce.id
                        ? { ...a, statut, updated_at: new Date().toISOString() }
                        : a,
                ),
            );
            // Sync with localActes
            setLocalActes((prev) =>
                prev.map((a) =>
                    a.id === selectedAnnonce.id
                        ? { ...a, statut, updated_at: new Date().toISOString() }
                        : a,
                ),
            );
            closeAnnonceModal();
            showToast(
                statut === "TRANSMISE_AU_PASTEUR"
                    ? "✅ Annonce transmise au pasteur."
                    : "Annonce refusée.",
            );
        } catch (e) {
            showToast(e?.response?.data?.message || "Echec.");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    const approveAnnonces = async () => {
        const ids = Array.from(annSelectedIds).filter(
            (id) =>
                localAnnonces.find((a) => a.id === id)?.statut === "SOUMISE",
        );
        if (!ids.length) return;
        try {
            setAnnonceProcessing(true);
            for (const id of ids)
                await getAnnonceAction("TRANSMISE_AU_PASTEUR", id);
            setLocalAnnonces((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "TRANSMISE_AU_PASTEUR",
                              updated_at: new Date().toISOString(),
                          }
                        : a,
                ),
            );
            // Sync with localActes
            setLocalActes((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "TRANSMISE_AU_PASTEUR",
                              updated_at: new Date().toISOString(),
                          }
                        : a,
                ),
            );
            setAnnSelectedIds(new Set());
            showToast("✅ Annonces transmises au pasteur.");
        } catch (e) {
            showToast("Echec de la validation groupée.");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    const refuseAnnonces = async () => {
        const ids = Array.from(annSelectedIds).filter(
            (id) =>
                localAnnonces.find((a) => a.id === id)?.statut === "SOUMISE",
        );
        if (!ids.length) return;
        const reason = window.prompt(
            "Motif du refus pour toutes les annonces sélectionnées ?",
        );
        if (!reason?.trim()) return;
        try {
            setAnnonceProcessing(true);
            for (const id of ids)
                await getAnnonceAction("REFUSEE_PAR_CONDUCTEUR", id, reason);
            setLocalAnnonces((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "REFUSEE_PAR_CONDUCTEUR",
                              updated_at: new Date().toISOString(),
                          }
                        : a,
                ),
            );
            // Sync with localActes
            setLocalActes((prev) =>
                prev.map((a) =>
                    ids.includes(a.id)
                        ? {
                              ...a,
                              statut: "REFUSEE_PAR_CONDUCTEUR",
                              updated_at: new Date().toISOString(),
                          }
                        : a,
                ),
            );
            setAnnSelectedIds(new Set());
            showToast("Annonces refusées.");
        } catch (e) {
            showToast("Echec du refus groupé.");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    // création d'une annonce
    const submitAnnonce = async () => {
        if (!annonceForm.type_annonce || !annonceForm.message.trim()) {
            showToast("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        if (!annonceForm.membre_id) {
            showToast("Veuillez sélectionner un membre concerné.");
            return;
        }
        if (!annonceForm.date_annonce) {
            showToast("La date de l'annonce est requise.");
            return;
        }
        try {
            setAnnonceProcessing(true);
            const res = await axios.post(
                withBasePath("", "/conducteur/annonces"),
                annonceForm,
            );
            const newA = res.data?.annonce || {
                ...annonceForm,
                id: Date.now(),
                statut: "SOUMISE",
                created_at: new Date().toISOString(),
            };
            // Track the creator of this annonce for filtering later
            if (!myAnnonceCreator && newA.createur) {
                setMyAnnonceCreator(newA.createur);
            }
            setLocalAnnonces((prev) => [newA, ...prev]);
            closeAnnonceModal();
            setAnnoncesSubTab("mine");
            setAnnoncesPage(1);
            showToast("✅ Annonce soumise ! Elle sera traitée par le pasteur.");
        } catch (e) {
            showToast(e?.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setAnnonceProcessing(false);
        }
    };

    /* ════════════════════════ RENDER ════════════════════════ */
    return (
        <div className="conductor-page">
            {/* Bouton pour ouvrir le modal des fiches PDF */}

            <FichesMariageModal
                open={ficheModalOpen}
                onClose={closeFicheModal}
                acte={ficheModalActe}
                ids={ficheModalSelectedIds}
                onSent={(payload) => {
                    const updatedActes = Array.isArray(payload?.actes)
                        ? payload.actes
                        : [];
                    if (updatedActes.length) {
                        setLocalActes((prev) =>
                            prev.map((item) => {
                                const match = updatedActes.find(
                                    (a) => a.id === item.id,
                                );
                                return match ? { ...item, ...match } : item;
                            }),
                        );
                    }
                    showToast(
                        payload?.message ||
                            "Fiche envoyée avec succès depuis l'application.",
                    );
                }}
                onEdit={(acte) => {
                    setSelected(acte);
                    closeFicheModal();
                    setModal("detail");
                }}
            />
            <style>{styles}</style>
            <main className="main">
                <div className="page-content">
                    {/* TOP ACTIONS */}
                    <div className="top-actions">
                        <Link
                            href={withBasePath("", "/conducteur/dashboard")}
                            className="btn-back"
                        >
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Retour
                        </Link>
                        <div className="page-heading">
                            <h1 className="page-title">Gestion des demandes</h1>
                        </div>
                        <button
                            className="btn-create"
                            onClick={() => openModal("create")}
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Créer un acte
                        </button>
                    </div>

                    {/* ALERT BANNERS */}
                    {stats.soumises > 0 && (
                        <div className="alerts-row">
                            {stats.soumises > 0 && (
                                <div className="alert-banner alert-actes">
                                    <div className="alert-left">
                                        <div className="alert-icon-wrap">
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
                                                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="alert-text">
                                            <strong>
                                                {stats.soumises} acte
                                                {stats.soumises > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                en attente
                                            </strong>
                                            <span>Traitez dans les 48h</span>
                                        </div>
                                    </div>
                                    <button
                                        className="alert-action"
                                        onClick={() => setTab("soumises")}
                                    >
                                        Voir les actes{" "}
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
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KPI CARDS */}
                    <div className="kpi-row">
                        <div className="kpi-card kpi-orange">
                            <div className="kpi-top">
                                <div className="kpi-icon-wrap kpi-icon-orange">
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
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-orange">
                                    +{stats.soumises} nouvelles
                                </span>
                            </div>
                            <div className="kpi-number">{stats.soumises}</div>
                            <div className="kpi-label">Demandes soumises</div>
                            <div className="kpi-bar">
                                <div
                                    className="kpi-bar-fill kpi-bar-orange"
                                    style={{
                                        width: `${Math.min(100, stats.soumises * 20)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="kpi-card kpi-gold">
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
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                </div>
                                <span className="kpi-badge kpi-badge-gold">
                                    En transit
                                </span>
                            </div>
                            <div className="kpi-number">{stats.transmises}</div>
                            <div className="kpi-label">
                                Transmises au pasteur
                            </div>
                            <div className="kpi-bar">
                                <div
                                    className="kpi-bar-fill kpi-bar-gold"
                                    style={{
                                        width: `${Math.min(100, stats.transmises * 25)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="kpi-card kpi-green">
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
                                    ↑ Validées
                                </span>
                            </div>
                            <div className="kpi-number">{stats.valides}</div>
                            <div className="kpi-label">Validées</div>
                            <div className="kpi-bar">
                                <div
                                    className="kpi-bar-fill kpi-bar-green"
                                    style={{
                                        width: `${stats.total ? Math.round((stats.valides / stats.total) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="tab-toolbar">
                        <div className="tab-bar">
                            <button
                                className={`tab ${tab === "soumises" ? "active" : ""}`}
                                onClick={() => setTab("soumises")}
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
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                                    />
                                </svg>
                                Soumises
                                {stats.soumises > 0 && (
                                    <span className="tab-count tab-red">
                                        {stats.soumises}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`tab ${tab === "transmises" ? "active" : ""}`}
                                onClick={() => setTab("transmises")}
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
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                                Au pasteur
                                {stats.transmises > 0 && (
                                    <span className="tab-count tab-gold">
                                        {stats.transmises}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`tab tab-date ${tab === "dates" ? "active" : ""}`}
                                onClick={() => setTab("dates")}
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
                                        d="M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 2v4M8 2v4M3 10h18"
                                    />
                                </svg>
                                Dates choisies
                                {ceremonyActs.length > 0 && (
                                    <span className="tab-count tab-sage">
                                        {ceremonyActs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`tab ${tab === "calendar" ? "active" : ""}`}
                                onClick={() => setTab("calendar")}
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
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <path d="M3 9h18M7 3v4M17 3v4" />
                                </svg>
                                Calendrier
                            </button>
                            {/* ★ ONGLET ANNONCES ★ */}
                            <button
                                className={`tab tab-ann ${tab === "annonces" ? "active" : ""}`}
                                onClick={() => setTab("annonces")}
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
                                Annonces
                                {annEnAttente.length > 0 && (
                                    <span className="tab-count tab-violet">
                                        {annEnAttente.length}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`tab ${tab === "historique" ? "active" : ""}`}
                                onClick={() => setTab("historique")}
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Historique
                            </button>
                            <button
                                className={`tab ${tab === "stats" ? "active" : ""}`}
                                onClick={() => setTab("stats")}
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
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Statistiques
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
                                <optgroup label="Actes liturgiques">
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
                                <optgroup label="Annonces">
                                    <option value="grace">
                                        🙌 Action de grâce
                                    </option>
                                    <option value="priere">🙏 Prière</option>
                                </optgroup>
                                <optgroup label="Mes contenus">
                                    <option value="mes_annonces">
                                        📣 Mes annonces
                                    </option>
                                    <option value="mes_demandes">
                                        📋 Mes demandes
                                    </option>
                                </optgroup>
                            </select>
                            <input
                                type="search"
                                className="quick-search"
                                placeholder="Recherche par nom, référence, statut..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ══════════ ONGLET SOUMISES ══════════ */}
                    {tab === "soumises" && (
                        <div className="grid-3-1">
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
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                                                />
                                            </svg>
                                            Demandes à traiter
                                        </div>
                                        <div className="panel-subtitle">
                                            Nécessitent votre analyse et
                                            validation
                                        </div>
                                    </div>
                                    <div className="panel-actions">
                                        <span className="panel-count-badge">
                                            {soumises.length}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-bulk"
                                            onClick={toggleSelectAllPage}
                                            disabled={
                                                pagedSoumises.length === 0
                                            }
                                        >
                                            {allPageSelected
                                                ? "Tout désélectionner"
                                                : "Tout sélectionner"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-bulk"
                                            onClick={approveSelected}
                                            disabled={
                                                processing ||
                                                selectedIds.size === 0
                                            }
                                        >
                                            Approuver
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-bulk btn-bulk-refuse"
                                            onClick={refuseSelected}
                                            disabled={
                                                processing ||
                                                selectedIds.size === 0
                                            }
                                        >
                                            Refuser
                                        </button>
                                    </div>
                                </div>
                                <div className="panel-body">
                                    {soumises.length === 0 && (
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
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span>
                                                Aucune demande en attente
                                            </span>
                                        </div>
                                    )}
                                    {pagedSoumises.map((acte, i) => (
                                        <div
                                            key={acte.id}
                                            className={`demande-item ${i === 0 ? "urgent" : ""}`}
                                        >
                                            <label
                                                className="bulk-check"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(
                                                        acte.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleSelected(acte.id)
                                                    }
                                                />
                                            </label>
                                            <div
                                                className={`demande-acte-icon ${tone(acte.type_acte)}`}
                                            >
                                                {normalizePhotoUrl(
                                                    acte.membre
                                                        ?.profile_photo_url,
                                                ) ? (
                                                    <img
                                                        src={normalizePhotoUrl(
                                                            acte.membre
                                                                ?.profile_photo_url,
                                                        )}
                                                        alt={
                                                            acte.membre
                                                                ?.prenom +
                                                            " " +
                                                            acte.membre?.nom
                                                        }
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            borderRadius: "50%",
                                                        }}
                                                    />
                                                ) : (
                                                    <span>
                                                        {iconEmoji(
                                                            acte.type_acte,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="demande-info"
                                                onClick={() =>
                                                    openModal("detail", acte)
                                                }
                                            >
                                                <div
                                                    className="demande-name"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    {acte.membre?.prenom}{" "}
                                                    {acte.membre?.nom}
                                                    {/* Bouton transmettre la fiche à côté du conducteur */}
                                                    <button
                                                        className="btn-small btn-fiche"
                                                        title="Transmettre la fiche PDF de la demande du jour"
                                                        style={{
                                                            marginLeft: 8,
                                                            background:
                                                                "#e0e7ff",
                                                            color: "#3730a3",
                                                            border: "1px solid #a5b4fc",
                                                            borderRadius: 4,
                                                            padding: "2px 8px",
                                                            fontSize: 12,
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openFicheModalForActe(
                                                                acte,
                                                            );
                                                        }}
                                                    >
                                                        📄 voir la fiche
                                                    </button>
                                                </div>
                                                <div className="demande-type">
                                                    {prettyType(acte.type_acte)}{" "}
                                                    · Soumis le{" "}
                                                    {formatDate(
                                                        acte.created_at ||
                                                            acte.date_souhaitee,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="demande-meta">
                                                <span className="badge badge-soumise">
                                                    <span className="badge-dot" />
                                                    SOUMISE
                                                </span>
                                                <div
                                                    className="item-actions"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        className="btn-small btn-approve"
                                                        onClick={() =>
                                                            openModal(
                                                                "approve",
                                                                acte,
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            width="11"
                                                            height="11"
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
                                                    {hasCeremonyChoice(
                                                        acte,
                                                    ) && (
                                                        <button
                                                            className="btn-small btn-see"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openModal(
                                                                    "ceremony",
                                                                    acte,
                                                                );
                                                            }}
                                                        >
                                                            Voir la date choisie
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-small btn-refuse"
                                                        onClick={() =>
                                                            openModal(
                                                                "refuse",
                                                                acte,
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            width="11"
                                                            height="11"
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
                                        </div>
                                    ))}
                                    {soumisesTotalPages > 1 && (
                                        <div className="pager">
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setSoumisesPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={soumisesPage === 1}
                                            >
                                                Précédent
                                            </button>
                                            <div className="pager-info">
                                                Page {soumisesPage}/
                                                {soumisesTotalPages}
                                            </div>
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setSoumisesPage((p) =>
                                                        Math.min(
                                                            soumisesTotalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    soumisesPage ===
                                                    soumisesTotalPages
                                                }
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                <div className="panel panel-side">
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
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Circuit de validation
                                        </div>
                                    </div>
                                    <div className="circuit-steps">
                                        <div className="circuit-step done">
                                            <div className="circuit-dot done">
                                                <svg
                                                    width="10"
                                                    height="10"
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
                                            <div className="circuit-line done" />
                                            <div className="circuit-text">
                                                <strong>Membre soumet</strong>
                                                <span>Demande enregistrée</span>
                                            </div>
                                        </div>
                                        <div className="circuit-step active">
                                            <div className="circuit-dot active">
                                                <svg
                                                    width="10"
                                                    height="10"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="circuit-line" />
                                            <div className="circuit-text">
                                                <strong>Vous analysez</strong>
                                                <span>
                                                    Validation conducteur
                                                </span>
                                            </div>
                                        </div>
                                        <div className="circuit-step">
                                            <div className="circuit-dot pending">
                                                ✝
                                            </div>
                                            <div className="circuit-text">
                                                <strong>Pasteur valide</strong>
                                                <span>Validation finale</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="panel panel-side">
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
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                            Créer un acte direct
                                        </div>
                                    </div>
                                    <div className="panel-side-body">
                                        <p>
                                            En tant que conducteur, vous pouvez
                                            créer directement un acte pour votre
                                            classe sans demande préalable.
                                        </p>
                                        <button
                                            className="btn-create-side"
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
                                            Nouvel acte direct
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ ONGLET TRANSMISES ══════════ */}
                    {tab === "transmises" && (
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
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                        Transmises au Pasteur
                                    </div>
                                    <div className="panel-subtitle">
                                        En attente de validation finale
                                    </div>
                                </div>
                                <span className="panel-count-badge panel-count-gold">
                                    {transmises.length}
                                </span>
                            </div>
                            <div className="panel-body">
                                {transmises.length === 0 && (
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
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                        <span>
                                            Aucune demande transmise au pasteur
                                        </span>
                                    </div>
                                )}
                                {transmises.map((acte) => (
                                    <div
                                        key={acte.id}
                                        className="demande-item"
                                        onClick={() =>
                                            openModal("detail", acte)
                                        }
                                    >
                                        <div
                                            className={`demande-acte-icon ${tone(acte.type_acte)}`}
                                        >
                                            {acte.membre?.profile_photo_url ? (
                                                <img
                                                    src={
                                                        acte.membre
                                                            .profile_photo_url
                                                    }
                                                    alt={`${acte.membre?.prenom} ${acte.membre?.nom}`}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: "50%",
                                                    }}
                                                />
                                            ) : (
                                                <span>
                                                    {iconEmoji(acte.type_acte)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="demande-info">
                                            <div className="demande-name">
                                                {acte.membre?.prenom}{" "}
                                                {acte.membre?.nom}
                                            </div>
                                            <div className="demande-type">
                                                {prettyType(acte.type_acte)} ·
                                                Transmis le{" "}
                                                {formatDate(
                                                    acte.updated_at ||
                                                        acte.created_at,
                                                )}
                                            </div>
                                        </div>
                                        <div className="demande-meta">
                                            <span className="badge badge-transmis">
                                                <span className="badge-dot" />
                                                AU PASTEUR
                                            </span>
                                            <div className="item-actions">
                                                <button
                                                    className="btn-small btn-view"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(
                                                            "detail",
                                                            acte,
                                                        );
                                                    }}
                                                >
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
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    Voir dossier
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══════════ ONGLET DATES CHOISIES ══════════ */}
                    {tab === "dates" && (
                        <div className="date-tab-root">
                            <section className="date-section-panel">
                                <div className="date-shell">
                                    <div className="date-shell-head">
                                        <div>
                                            <div className="date-shell-title">
                                                Dates proposées en attente
                                                conducteur
                                            </div>
                                            <div className="date-shell-sub">
                                                Vérifiez les dates soumises par
                                                les responsables avant
                                                transmission au pasteur.
                                            </div>
                                        </div>
                                        <div className="date-shell-tools">
                                            <button
                                                type="button"
                                                className="btn-bulk"
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
                                                className="btn-bulk"
                                                onClick={clearCeremonySelection}
                                                disabled={
                                                    selectedCeremonyIds.size ===
                                                    0
                                                }
                                            >
                                                Effacer
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-bulk btn-bulk-violet"
                                                onClick={
                                                    approveSelectedCeremony
                                                }
                                                disabled={
                                                    selectedCeremonyIds.size ===
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
                                                const statut =
                                                    acte.details
                                                        ?.ceremonie_statut;
                                                return (
                                                    <article
                                                        className="date-card"
                                                        key={acte.id}
                                                    >
                                                        <label className="date-card-check">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCeremonyIds.has(
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
                                                                className={`badge ${
                                                                    statut &&
                                                                    statut.includes(
                                                                        "REFUSEE",
                                                                    )
                                                                        ? "badge-refuse"
                                                                        : "badge-valide"
                                                                }`}
                                                            >
                                                                <span className="badge-dot" />
                                                                {ceremonyStatusLabel(
                                                                    statut,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="date-card-meta">
                                                            {formatDate(
                                                                acte.date_souhaitee,
                                                            )}
                                                            <span className="date-card-sep">
                                                                •
                                                            </span>
                                                            {acte.details
                                                                ?.ceremonie_creneau ||
                                                                "—"}
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
                                                par le conducteur
                                            </div>
                                            <div className="date-history-sub">
                                                Uniquement les membres de votre
                                                classe dont la date a été
                                                validée et transmise par vous.
                                            </div>
                                        </div>
                                        <div className="date-history-count">
                                            {ceremonyHistoryRows.length} date
                                            {ceremonyHistoryRows.length > 1
                                                ? "s"
                                                : ""}
                                        </div>
                                    </div>

                                    {ceremonyHistoryRows.length === 0 ? (
                                        <div className="empty empty-history">
                                            Aucune date validée par le
                                            conducteur.
                                        </div>
                                    ) : (
                                        <div className="table-scroll date-history-table-scroll">
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Référence</th>
                                                        <th>Membre concerné</th>
                                                        <th>Classe</th>
                                                        <th>
                                                            Fiancé / fiancée
                                                        </th>
                                                        <th>Témoin(s)</th>
                                                        <th>Date choisie</th>
                                                        <th>Transmise le</th>
                                                        <th>Statut</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ceremonyHistoryRows.map(
                                                        (row) => (
                                                            <tr
                                                                key={row.rowKey}
                                                            >
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
                                                                        row.classeName
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
                                                                        row.conducteurValidatedAt,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {ceremonyStatusLabel(
                                                                        row.ceremonyStatut,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {tab === "calendar" && (
                        <div className="calendar-tab-root">
                            <MiniCalendar
                                events={calendarEvents}
                                title="Calendrier des mariages"
                            />
                        </div>
                    )}

                    {/* ══════════ ★★★ ONGLET ANNONCES ★★★ ══════════ */}
                    {tab === "annonces" && (
                        <div className="ann-tab-root">
                            {/* Corps : liste + sidebar */}
                            <div className="grid-3-1">
                                {/* COLONNE PRINCIPALE */}
                                <div className="panel">
                                    <div className="panel-head">
                                        <div>
                                            {/* Sous-tabs À traiter / Traitées */}
                                            <div className="ann-subtabs">
                                                <button
                                                    className={`ann-subtab ${annoncesSubTab === "pending" ? "active" : ""}`}
                                                    onClick={() => {
                                                        setAnnoncesSubTab(
                                                            "pending",
                                                        );
                                                        setAnnoncesPage(1);
                                                    }}
                                                >
                                                    À traiter
                                                    {annEnAttente.length >
                                                        0 && (
                                                        <span className="ann-subtab-badge">
                                                            {
                                                                annEnAttente.length
                                                            }
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    className={`ann-subtab ${annoncesSubTab === "done" ? "active" : ""}`}
                                                    onClick={() => {
                                                        setAnnoncesSubTab(
                                                            "done",
                                                        );
                                                        setAnnoncesPage(1);
                                                    }}
                                                >
                                                    Déjà traitées
                                                    {annTraitees.length > 0 && (
                                                        <span className="ann-subtab-badge ann-subtab-badge-done">
                                                            {annTraitees.length}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    className={`ann-subtab ${annoncesSubTab === "mine" ? "active" : ""}`}
                                                    onClick={() => {
                                                        setAnnoncesSubTab(
                                                            "mine",
                                                        );
                                                        setAnnoncesPage(1);
                                                    }}
                                                >
                                                    Mes annonces
                                                    {annMines.length > 0 && (
                                                        <span className="ann-subtab-badge">
                                                            {annMines.length}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                            <div
                                                className="panel-subtitle"
                                                style={{ marginTop: 4 }}
                                            >
                                                {annoncesSubTab === "pending"
                                                    ? "Soumises par les responsables de famille"
                                                    : annoncesSubTab === "done"
                                                      ? "Transmises au pasteur ou refusées"
                                                      : "Les annonces que vous avez créées"}
                                            </div>
                                        </div>
                                        <div className="panel-actions">
                                            <button
                                                type="button"
                                                className="btn-cta-ann btn-cta-ann-sm"
                                                onClick={() =>
                                                    openAnnonceModal("create")
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
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                                Nouvelle annonce
                                            </button>
                                            {annoncesSubTab === "pending" &&
                                                annEnAttente.length > 0 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn-bulk btn-bulk-violet"
                                                            onClick={
                                                                toggleAllAnnPage
                                                            }
                                                            disabled={
                                                                pagedAnn.filter(
                                                                    (a) =>
                                                                        a.statut ===
                                                                        "SOUMISE",
                                                                ).length === 0
                                                            }
                                                        >
                                                            {allAnnSel
                                                                ? "Tout désél."
                                                                : "Tout sél."}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-bulk btn-bulk-violet"
                                                            onClick={
                                                                approveAnnonces
                                                            }
                                                            disabled={
                                                                annonceProcessing ||
                                                                annSelectedIds.size ===
                                                                    0
                                                            }
                                                        >
                                                            <svg
                                                                width="11"
                                                                height="11"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                                />
                                                            </svg>
                                                            Transmettre
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-bulk btn-bulk-refuse"
                                                            onClick={
                                                                refuseAnnonces
                                                            }
                                                            disabled={
                                                                annonceProcessing ||
                                                                annSelectedIds.size ===
                                                                    0
                                                            }
                                                        >
                                                            <svg
                                                                width="11"
                                                                height="11"
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
                                                    </>
                                                )}
                                        </div>
                                    </div>

                                    <div className="panel-body">
                                        {annDisplay.length === 0 && (
                                            <div className="empty-state">
                                                <span
                                                    style={{
                                                        fontSize: 38,
                                                        opacity: 0.3,
                                                    }}
                                                >
                                                    📢
                                                </span>
                                                <span>
                                                    {annoncesSubTab ===
                                                    "pending"
                                                        ? "Aucune annonce en attente"
                                                        : annoncesSubTab ===
                                                            "done"
                                                          ? "Aucune annonce traitée"
                                                          : "Vous n'avez créé aucune annonce"}
                                                </span>
                                            </div>
                                        )}
                                        {pagedAnn.map((ann) => {
                                            const typeInfo = ANNONCE_TYPES.find(
                                                (t) =>
                                                    t.value ===
                                                    ann.type_annonce,
                                            );
                                            const isPending =
                                                ann.statut === "SOUMISE";
                                            const isTrans =
                                                ann.statut ===
                                                "TRANSMISE_AU_PASTEUR";
                                            const isRefuse =
                                                ann.statut?.startsWith(
                                                    "REFUSEE",
                                                );
                                            const isPublie = [
                                                "VALIDEE",
                                                "PUBLIEE",
                                            ].includes(ann.statut);
                                            const creatorName =
                                                [
                                                    ann.createur?.prenom,
                                                    ann.createur?.nom,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ") ||
                                                ann.nom_concerne ||
                                                "—";
                                            return (
                                                <div
                                                    key={ann.id}
                                                    className={`ann-item ${isPending ? "ann-item-pending" : ""}`}
                                                >
                                                    {/* Checkbox groupée (seulement pour pending et onglet "À traiter") */}
                                                    {isPending &&
                                                        annoncesSubTab ===
                                                            "pending" && (
                                                            <label
                                                                className="bulk-check"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={annSelectedIds.has(
                                                                        ann.id,
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleAnnSel(
                                                                            ann.id,
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                        )}
                                                    {/* Icône type */}
                                                    <div
                                                        className={`ann-type-icon aicon-${typeInfo?.color || "green"}`}
                                                    >
                                                        {typeInfo?.emoji ||
                                                            "📢"}
                                                    </div>
                                                    {/* Corps annonce */}
                                                    <div
                                                        className="ann-item-body"
                                                        onClick={() =>
                                                            openAnnonceModal(
                                                                "detail",
                                                                ann,
                                                            )
                                                        }
                                                    >
                                                        <div className="ann-item-header">
                                                            <span className="ann-item-type">
                                                                {typeInfo?.label ||
                                                                    ann.type_annonce}
                                                            </span>
                                                            <span className="ann-item-who">
                                                                — {creatorName}
                                                            </span>
                                                        </div>
                                                        <div className="ann-item-msg">
                                                            {(
                                                                ann.details
                                                                    ?.contenu ||
                                                                ann.message ||
                                                                ""
                                                            ).slice(0, 120)}
                                                            {(
                                                                ann.details
                                                                    ?.contenu ||
                                                                ann.message ||
                                                                ""
                                                            ).length > 120 &&
                                                                "…"}
                                                        </div>
                                                        <div className="ann-status-line">
                                                            Statut :{" "}
                                                            {prettyStatut(
                                                                ann.statut,
                                                            )}
                                                        </div>
                                                        <div className="ann-item-footer">
                                                            {ann.classe
                                                                ?.nom && (
                                                                <span className="ann-chip ann-chip-class">
                                                                    🏠{" "}
                                                                    {
                                                                        ann
                                                                            .classe
                                                                            .nom
                                                                    }
                                                                </span>
                                                            )}
                                                            {ann.destinataire && (
                                                                <span className="ann-chip">
                                                                    →{" "}
                                                                    {
                                                                        ann.destinataire
                                                                    }
                                                                </span>
                                                            )}
                                                            <span className="ann-date">
                                                                {formatDate(
                                                                    ann.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Actions droite */}
                                                    <div className="ann-item-right">
                                                        {isPending && (
                                                            <span className="badge badge-soumise">
                                                                <span className="badge-dot" />
                                                                À TRAITER
                                                            </span>
                                                        )}
                                                        {isTrans && (
                                                            <span className="badge badge-transmis">
                                                                <span className="badge-dot" />
                                                                AU PASTEUR
                                                            </span>
                                                        )}
                                                        {isRefuse && (
                                                            <span className="badge badge-refuse">
                                                                <span className="badge-dot" />
                                                                REFUSÉE
                                                            </span>
                                                        )}
                                                        {isPublie && (
                                                            <span className="badge badge-valide">
                                                                <span className="badge-dot" />
                                                                PUBLIÉE
                                                            </span>
                                                        )}
                                                        {isPending ? (
                                                            <div
                                                                className="item-actions"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <button
                                                                    className="btn-small btn-approve"
                                                                    onClick={() =>
                                                                        openAnnonceModal(
                                                                            "approve",
                                                                            ann,
                                                                        )
                                                                    }
                                                                >
                                                                    <svg
                                                                        width="11"
                                                                        height="11"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2.5"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                                        />
                                                                    </svg>
                                                                    Transmettre
                                                                </button>
                                                                <button
                                                                    className="btn-small btn-refuse"
                                                                    onClick={() =>
                                                                        openAnnonceModal(
                                                                            "refuse",
                                                                            ann,
                                                                        )
                                                                    }
                                                                >
                                                                    <svg
                                                                        width="11"
                                                                        height="11"
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
                                                        ) : (
                                                            <button
                                                                className="btn-small btn-view"
                                                                onClick={() =>
                                                                    openAnnonceModal(
                                                                        "detail",
                                                                        ann,
                                                                    )
                                                                }
                                                            >
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
                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                    />
                                                                </svg>
                                                                Voir
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {annTotalPages > 1 && (
                                            <div className="pager">
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        setAnnoncesPage((p) =>
                                                            Math.max(1, p - 1),
                                                        )
                                                    }
                                                    disabled={
                                                        annoncesPage === 1
                                                    }
                                                >
                                                    Précédent
                                                </button>
                                                <div className="pager-info">
                                                    Page {annoncesPage}/
                                                    {annTotalPages}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="pager-btn"
                                                    onClick={() =>
                                                        setAnnoncesPage((p) =>
                                                            Math.min(
                                                                annTotalPages,
                                                                p + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        annoncesPage ===
                                                        annTotalPages
                                                    }
                                                >
                                                    Suivant
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLONNE LATÉRALE */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 16,
                                    }}
                                >
                                    {/* Circuit annonces */}
                                    <div className="panel panel-side">
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
                                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                Circuit de l'annonce
                                            </div>
                                        </div>
                                        <div className="circuit-steps">
                                            <div className="circuit-step done">
                                                <div className="circuit-dot done">
                                                    <svg
                                                        width="10"
                                                        height="10"
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
                                                <div className="circuit-line done" />
                                                <div className="circuit-text">
                                                    <strong>
                                                        Famille soumet
                                                    </strong>
                                                    <span>
                                                        Annonce enregistrée
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="circuit-step active">
                                                <div
                                                    className="circuit-dot active"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    📢
                                                </div>
                                                <div className="circuit-line" />
                                                <div className="circuit-text">
                                                    <strong>
                                                        Vous validez
                                                    </strong>
                                                    <span>Contenu analysé</span>
                                                </div>
                                            </div>
                                            <div className="circuit-step">
                                                <div
                                                    className="circuit-dot pending"
                                                    style={{ fontSize: 10 }}
                                                >
                                                    ✝
                                                </div>
                                                <div className="circuit-line" />
                                                <div className="circuit-text">
                                                    <strong>
                                                        Pasteur approuve
                                                    </strong>
                                                    <span>
                                                        Validation finale
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="circuit-step">
                                                <div
                                                    className="circuit-dot pending"
                                                    style={{ fontSize: 10 }}
                                                >
                                                    🌍
                                                </div>
                                                <div className="circuit-text">
                                                    <strong>Publication</strong>
                                                    <span>
                                                        Visible à la paroisse
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Répartition par type */}
                                    <div className="panel panel-side">
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
                                                Par type
                                            </div>
                                        </div>
                                        <div
                                            className="panel-side-body"
                                            style={{ paddingTop: 10 }}
                                        >
                                            {ANNONCE_TYPES.map((t) => {
                                                const cnt =
                                                    localAnnonces.filter(
                                                        (a) =>
                                                            a.type_annonce ===
                                                            t.value,
                                                    ).length;
                                                const pct = localAnnonces.length
                                                    ? Math.round(
                                                          (cnt /
                                                              localAnnonces.length) *
                                                              100,
                                                      )
                                                    : 0;
                                                return (
                                                    <div
                                                        key={t.value}
                                                        className="ann-stat-row"
                                                    >
                                                        <span className="ann-stat-emoji">
                                                            {t.emoji}
                                                        </span>
                                                        <div className="ann-stat-info">
                                                            <div className="ann-stat-name">
                                                                {t.label}
                                                            </div>
                                                            <div className="ann-stat-bar">
                                                                <div
                                                                    className={`ann-stat-fill asfill-${t.color}`}
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="ann-stat-cnt">
                                                            {cnt}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ ONGLET HISTORIQUE ══════════ */}
                    {tab === "historique" && (
                        <div className="grid-2">
                            <div className="panel">
                                <div className="panel-head">
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
                                        Journal des actes
                                    </div>
                                </div>
                                <div className="panel-body">
                                    {historique.length === 0 && (
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
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span>
                                                Aucun historique disponible
                                            </span>
                                        </div>
                                    )}
                                    {pagedHistorique.map((acte) => (
                                        <div
                                            key={acte.id}
                                            className="timeline-item"
                                        >
                                            <div
                                                className={`timeline-dot ${dot(getActeStatus(acte))}`}
                                            />
                                            <div className="timeline-content">
                                                <div className="timeline-action">
                                                    {prettyType(acte.type_acte)}{" "}
                                                    — {acte.membre?.prenom}{" "}
                                                    {acte.membre?.nom}
                                                </div>
                                                <div className="timeline-detail">
                                                    {prettyStatut(
                                                        getActeStatus(acte),
                                                    )}
                                                </div>
                                                {String(
                                                    acte.type_acte || "",
                                                ).toLowerCase() ===
                                                    "mariage" && (
                                                    <div
                                                        style={{ marginTop: 8 }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={`btn-see ${!acte?.details?.ceremonie_statut ? "btn-disabled" : ""}`}
                                                            disabled={
                                                                !acte?.details
                                                                    ?.ceremonie_statut
                                                            }
                                                            style={{
                                                                borderRadius: 14,
                                                                padding:
                                                                    "8px 12px",
                                                                fontSize:
                                                                    "11px",
                                                                backgroundColor:
                                                                    acte
                                                                        ?.details
                                                                        ?.ceremonie_statut
                                                                        ? "#c82333"
                                                                        : "#f3f4f6",
                                                                borderColor:
                                                                    acte
                                                                        ?.details
                                                                        ?.ceremonie_statut
                                                                        ? "#c82333"
                                                                        : "#d1d5db",
                                                                color: acte
                                                                    ?.details
                                                                    ?.ceremonie_statut
                                                                    ? "#fff"
                                                                    : "#6b7280",
                                                            }}
                                                            title={
                                                                acte?.details
                                                                    ?.ceremonie_statut
                                                                    ? "Voir la date choisie"
                                                                    : "Aucune date de cérémonie soumise."
                                                            }
                                                            onClick={() =>
                                                                acte?.details
                                                                    ?.ceremonie_statut &&
                                                                openModal(
                                                                    "ceremony",
                                                                    acte,
                                                                )
                                                            }
                                                        >
                                                            Voir la date choisie
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: 8,
                                                    minWidth: 140,
                                                }}
                                            >
                                                <div className="timeline-time">
                                                    {formatDate(
                                                        acte.updated_at ||
                                                            acte.created_at,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {historiqueTotalPages > 1 && (
                                        <div className="pager">
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setHistoriquePage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={historiquePage === 1}
                                            >
                                                Précédent
                                            </button>
                                            <div className="pager-info">
                                                Page {historiquePage}/
                                                {historiqueTotalPages}
                                            </div>
                                            <button
                                                type="button"
                                                className="pager-btn"
                                                onClick={() =>
                                                    setHistoriquePage((p) =>
                                                        Math.min(
                                                            historiqueTotalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    historiquePage ===
                                                    historiqueTotalPages
                                                }
                                            >
                                                Suivant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="panel">
                                <div className="panel-head">
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
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Actes récents validés
                                    </div>
                                </div>
                                <div className="panel-body">
                                    {historique
                                        .filter((a) =>
                                            [
                                                "VALIDEE",
                                                "PUBLIEE",
                                                "ARCHIVEE",
                                            ].includes(a.statut),
                                        )
                                        .slice(0, 6)
                                        .map((acte) => (
                                            <div
                                                key={acte.id}
                                                className="demande-item"
                                            >
                                                <div
                                                    className={`demande-acte-icon ${tone(acte.type_acte)}`}
                                                >
                                                    {normalizePhotoUrl(
                                                        acte.membre
                                                            ?.profile_photo_url,
                                                    ) ? (
                                                        <img
                                                            src={normalizePhotoUrl(
                                                                acte.membre
                                                                    ?.profile_photo_url,
                                                            )}
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
                                                        <span>
                                                            {iconEmoji(
                                                                acte.type_acte,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    className="demande-info"
                                                    onClick={() =>
                                                        openModal(
                                                            "detail",
                                                            acte,
                                                        )
                                                    }
                                                >
                                                    <div className="demande-name">
                                                        {acte.membre?.prenom}{" "}
                                                        {acte.membre?.nom}
                                                    </div>
                                                    <div className="demande-type">
                                                        {prettyType(
                                                            acte.type_acte,
                                                        )}{" "}
                                                        ·{" "}
                                                        {formatDate(
                                                            acte.updated_at ||
                                                                acte.created_at,
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="demande-meta">
                                                    <span className="badge badge-valide">
                                                        <span className="badge-dot" />
                                                        VALIDÉ
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ ONGLET STATS ══════════ */}
                    {tab === "stats" && (
                        <div className="grid-2">
                            <div className="panel">
                                <div className="panel-head">
                                    <div className="panel-title">
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <path
                                                strokeLinecap="round"
                                                d="M12 12l-4-4"
                                            />
                                        </svg>
                                        Répartition par type
                                    </div>
                                </div>
                                <div className="stats-types">
                                    {[
                                        "bapteme",
                                        "mariage",
                                        "premiere_communion",
                                        "deces",
                                    ].map((type) => {
                                        const count = localActes.filter(
                                            (a) => a.type_acte === type,
                                        ).length;
                                        const pct = stats.total
                                            ? Math.round(
                                                  (count / stats.total) * 100,
                                              )
                                            : 0;
                                        return (
                                            <div
                                                key={type}
                                                className="stat-type-row"
                                            >
                                                <div
                                                    className={`stat-type-icon ${tone(type)}`}
                                                >
                                                    {iconEmoji(type)}
                                                </div>
                                                <div className="stat-type-info">
                                                    <div className="stat-type-name">
                                                        {prettyType(type)}
                                                    </div>
                                                    <div className="stat-type-bar-wrap">
                                                        <div className="stat-type-bar">
                                                            <div
                                                                className={`stat-type-bar-fill ${tone(type)}`}
                                                                style={{
                                                                    width: `${pct}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="stat-type-pct">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="stat-type-count">
                                                    {count}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="panel">
                                <div className="panel-head">
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
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        Taux de traitement
                                    </div>
                                </div>
                                <div className="stats-rates">
                                    <div className="rate-big">
                                        <div className="rate-circle">
                                            <svg
                                                viewBox="0 0 36 36"
                                                className="rate-svg"
                                            >
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="rgba(255,255,255,0.1)"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#B6C01A"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${stats.total ? Math.round((stats.valides / stats.total) * 100) : 0}, 100`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="rate-center">
                                                <div className="rate-pct">
                                                    {stats.total
                                                        ? Math.round(
                                                              (stats.valides /
                                                                  stats.total) *
                                                                  100,
                                                          )
                                                        : 0}
                                                    %
                                                </div>
                                                <div className="rate-lbl">
                                                    Validés
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rate-rows">
                                        <div className="rate-row">
                                            <span className="rate-dot green" />
                                            <span className="rate-name">
                                                Validées
                                            </span>
                                            <span className="rate-val">
                                                {stats.valides}
                                            </span>
                                        </div>
                                        <div className="rate-row">
                                            <span className="rate-dot gold" />
                                            <span className="rate-name">
                                                Au pasteur
                                            </span>
                                            <span className="rate-val">
                                                {stats.transmises}
                                            </span>
                                        </div>
                                        <div className="rate-row">
                                            <span className="rate-dot orange" />
                                            <span className="rate-name">
                                                En attente
                                            </span>
                                            <span className="rate-val">
                                                {stats.soumises}
                                            </span>
                                        </div>
                                        <div className="rate-row total-row">
                                            <span className="rate-dot blue" />
                                            <span className="rate-name">
                                                Total
                                            </span>
                                            <span className="rate-val">
                                                {stats.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ══════════ MODAL ACTES ══════════ */}
            {modal && (
                <div className="modal-overlay open" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-head-left">
                                {modal === "create" ? (
                                    <div className="acte-head-icon">+</div>
                                ) : (
                                    <div
                                        className={`modal-head-icon ${
                                            modal === "approve"
                                                ? "gold"
                                                : modal === "refuse"
                                                  ? "red"
                                                  : "blue"
                                        }`}
                                    >
                                        {modal === "detail" && (
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
                                        )}
                                        {modal === "approve" && (
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
                                        )}
                                        {modal === "refuse" && (
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
                                        )}
                                    </div>
                                )}
                                <div>
                                    <div className="modal-title">
                                        {modal === "detail"
                                            ? "Détail de la demande"
                                            : modal === "approve"
                                              ? "Valider et transmettre"
                                              : modal === "refuse"
                                                ? "Refuser la demande"
                                                : modal === "ceremony"
                                                  ? "Date choisie"
                                                  : "Créer un acte direct"}
                                    </div>
                                    {modal === "create" && (
                                        <div className="modal-sub">
                                            Demande transmise au pasteur
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeModal}
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
                        <div className="modal-body">
                            {modal === "detail" && selected && (
                                <>
                                    <div className="modal-detail-tabs">
                                        <button
                                            type="button"
                                            className={`modal-detail-tab ${detailTab === "infos" ? "active" : ""}`}
                                            onClick={() =>
                                                setDetailTab("infos")
                                            }
                                        >
                                            Informations
                                        </button>
                                        {selectedIsMariage && (
                                            <button
                                                type="button"
                                                className={`modal-detail-tab ${detailTab === "calendar" ? "active" : ""}`}
                                                onClick={() =>
                                                    setDetailTab("calendar")
                                                }
                                            >
                                                Calendrier
                                            </button>
                                        )}
                                    </div>
                                    {detailTab === "infos" && (
                                        <>
                                            <div className="modal-info-row">
                                                <span className="modal-info-key">
                                                    Réference
                                                </span>
                                                <span className="modal-info-val mono">
                                                    {selected?.reference || "?"}
                                                </span>
                                            </div>
                                            <div className="modal-info-row">
                                                <span className="modal-info-key">
                                                    Type d'acte
                                                </span>
                                                <span className="modal-info-val">
                                                    {prettyType(
                                                        selected?.type_acte,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="modal-info-row">
                                                <span className="modal-info-key">
                                                    Membre
                                                </span>
                                                <span className="modal-info-val">
                                                    {selected?.membre?.prenom}{" "}
                                                    {selected?.membre?.nom}
                                                </span>
                                            </div>
                                            <div className="modal-info-row no-border">
                                                <span className="modal-info-key">
                                                    Statut
                                                </span>
                                                <span className="modal-info-val">
                                                    <span
                                                        className={`badge ${getActeBadgeClass(getActeStatus(selected))}`}
                                                    >
                                                        <span className="badge-dot" />
                                                        {prettyStatut(
                                                            getActeStatus(
                                                                selected,
                                                            ),
                                                        )}
                                                    </span>
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {selectedIsMariage &&
                                        detailTab === "calendar" && (
                                            <MiniCalendar
                                                events={calendarEvents}
                                                highlightId={selected?.id}
                                                title="Calendrier des dates choisies"
                                            />
                                        )}
                                    {selected?.statut === "SOUMISE" && (
                                        <div className="modal-actions-inline">
                                            <button
                                                className="btn-modal btn-modal-gold"
                                                onClick={() =>
                                                    setModal("approve")
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
                                                Valider & transmettre
                                            </button>
                                            <button
                                                className="btn-modal btn-modal-red"
                                                onClick={() =>
                                                    setModal("refuse")
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
                                    )}
                                    {selected?.details?.ceremonie_statut ===
                                        "CEREMONIE_SOUMISE_AU_CONDUCTEUR" && (
                                        <div className="modal-actions-inline">
                                            <button
                                                className="btn-modal btn-modal-gold"
                                                onClick={() =>
                                                    submitCeremonyDecision(
                                                        "CEREMONIE_TRANSMISE_AU_PASTEUR",
                                                    )
                                                }
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? "Traitement..."
                                                    : "Transmettre au pasteur"}
                                            </button>
                                            <button
                                                className="btn-modal btn-modal-red"
                                                onClick={() =>
                                                    submitCeremonyDecision(
                                                        "CEREMONIE_REFUSEE_PAR_CONDUCTEUR",
                                                    )
                                                }
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? "Traitement..."
                                                    : "Refuser la date"}
                                            </button>
                                        </div>
                                    )}
                                    {[
                                        "TRANSMISE_AU_PASTEUR",
                                        "VALIDEE",
                                        "PUBLIEE",
                                        "ARCHIVEE",
                                    ].includes(selected?.statut) && (
                                        <div style={{ marginTop: 16 }}>
                                            <button
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 14px",
                                                    backgroundColor: "#3b82f6",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: 6,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 8,
                                                    transition:
                                                        "background 0.2s",
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.target.style.backgroundColor =
                                                        "#2563eb")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.target.style.backgroundColor =
                                                        "#3b82f6")
                                                }
                                                onClick={() => {
                                                    window.open(
                                                        withBasePath(
                                                            "",
                                                            `/conducteur/liturgie/${selected.id}/fiche?preview=1`,
                                                        ),
                                                        "_blank",
                                                    );
                                                }}
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
                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                Voir la fiche
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            {modal === "ceremony" && selected && (
                                <div className="ceremony-tab">
                                    <div className="ceremony-summary">
                                        <div>
                                            <strong>Date choisie</strong>
                                            <span className="modal-detail-val">
                                                {formatDate(
                                                    selected?.date_souhaitee ||
                                                        selected?.details
                                                            ?.date_souhaitee,
                                                ) || "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Créneau</strong>
                                            <span className="modal-detail-val">
                                                {selected?.details
                                                    ?.ceremonie_creneau ===
                                                "matin"
                                                    ? "Matin 09h-10h"
                                                    : selected?.details
                                                            ?.ceremonie_creneau ===
                                                        "apres_midi"
                                                      ? "Après-midi 15h-16h"
                                                      : "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Statut</strong>
                                            <span className="modal-detail-val">
                                                {ceremonyStatusLabel(
                                                    selected?.details
                                                        ?.ceremonie_statut,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="modal-detail-row">
                                        <span className="modal-detail-key">
                                            Lieu
                                        </span>
                                        <span className="modal-detail-val">
                                            {selected?.details
                                                ?.lieu_ceremonie || "—"}
                                        </span>
                                    </div>
                                    <div className="modal-detail-row">
                                        <span className="modal-detail-key">
                                            Témoins
                                        </span>
                                        <span className="modal-detail-val">
                                            {selected?.details?.temoins || "—"}
                                        </span>
                                    </div>
                                    {selected?.details
                                        ?.ceremonie_commentaire_conducteur && (
                                        <div className="modal-detail-row">
                                            <span className="modal-detail-key">
                                                Commentaire conducteur
                                            </span>
                                            <span className="modal-detail-val">
                                                {
                                                    selected?.details
                                                        ?.ceremonie_commentaire_conducteur
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {selected?.details
                                        ?.ceremonie_commentaire_pasteur && (
                                        <div className="modal-detail-row">
                                            <span className="modal-detail-key">
                                                Commentaire pasteur
                                            </span>
                                            <span className="modal-detail-val">
                                                {
                                                    selected?.details
                                                        ?.ceremonie_commentaire_pasteur
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {selected?.details
                                        ?.ceremonie_soumise_at && (
                                        <div className="modal-detail-row">
                                            <span className="modal-detail-key">
                                                Soumise le
                                            </span>
                                            <span className="modal-detail-val">
                                                {formatDateTime(
                                                    selected?.details
                                                        ?.ceremonie_soumise_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {selected?.details
                                        ?.ceremonie_transmise_pasteur_at && (
                                        <div className="modal-detail-row">
                                            <span className="modal-detail-key">
                                                Transmise au pasteur
                                            </span>
                                            <span className="modal-detail-val">
                                                {formatDateTime(
                                                    selected?.details
                                                        ?.ceremonie_transmise_pasteur_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {selected?.details
                                        ?.ceremonie_validee_pasteur_at && (
                                        <div className="modal-detail-row">
                                            <span className="modal-detail-key">
                                                Validée par le pasteur
                                            </span>
                                            <span className="modal-detail-val">
                                                {formatDateTime(
                                                    selected?.details
                                                        ?.ceremonie_validee_pasteur_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {modal === "ceremony" &&
                                ["VALIDEE", "PUBLIEE"].includes(
                                    selected?.statut,
                                ) && (
                                    <div style={{ marginTop: 16 }}>
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px",
                                                backgroundColor: "#3b82f6",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 6,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                transition: "background 0.2s",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.target.style.backgroundColor =
                                                    "#2563eb")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.target.style.backgroundColor =
                                                    "#3b82f6")
                                            }
                                            onClick={() => {
                                                window.open(
                                                    withBasePath(
                                                        "",
                                                        `/conducteur/liturgie/${selected.id}/fiche?preview=1`,
                                                    ),
                                                    "_blank",
                                                );
                                            }}
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
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            Voir la fiche
                                        </button>
                                    </div>
                                )}
                            {modal === "ceremony" &&
                                selected?.details?.ceremonie_statut ===
                                    "CEREMONIE_SOUMISE_AU_CONDUCTEUR" && (
                                    <div
                                        className="modal-actions-inline"
                                        style={{ marginTop: 16 }}
                                    >
                                        <button
                                            className="btn-modal btn-modal-gold"
                                            onClick={() =>
                                                submitCeremonyDecision(
                                                    "CEREMONIE_TRANSMISE_AU_PASTEUR",
                                                )
                                            }
                                            disabled={processing}
                                        >
                                            {processing
                                                ? "Traitement..."
                                                : "Valider la date"}
                                        </button>
                                        <button
                                            className="btn-modal btn-modal-red"
                                            onClick={() =>
                                                submitCeremonyDecision(
                                                    "CEREMONIE_REFUSEE_PAR_CONDUCTEUR",
                                                )
                                            }
                                            disabled={processing}
                                        >
                                            {processing
                                                ? "Traitement..."
                                                : "Refuser la date"}
                                        </button>
                                    </div>
                                )}
                            {modal === "approve" && (
                                <div className="modal-field">
                                    <label className="modal-label">
                                        Commentaire pour le Pasteur{" "}
                                        <span className="modal-optional">
                                            (optionnel)
                                        </span>
                                    </label>
                                    <textarea
                                        className="modal-textarea"
                                        value={commentaire}
                                        onChange={(e) =>
                                            setCommentaire(e.target.value)
                                        }
                                        placeholder="Ajoutez un commentaire ou des précisions pour le pasteur…"
                                    />
                                </div>
                            )}
                            {modal === "refuse" && (
                                <div className="modal-field">
                                    <label className="modal-label">
                                        Motif du refus{" "}
                                        <span className="modal-required">
                                            *
                                        </span>
                                    </label>
                                    <textarea
                                        className="modal-textarea"
                                        value={commentaire}
                                        onChange={(e) =>
                                            setCommentaire(e.target.value)
                                        }
                                        placeholder="Expliquez la raison du refus (champ obligatoire)…"
                                    />
                                </div>
                            )}
                            {modal === "create" && (
                                <div className="acte-form-root">
                                    <div className="acte-form">
                                        <Field label="Type d'acte" required>
                                            <select
                                                className="modal-input"
                                                value={createForm.type_acte}
                                                onChange={(e) =>
                                                    setCreateForm((f) => ({
                                                        ...f,
                                                        type_acte:
                                                            e.target.value,
                                                        details: {},
                                                    }))
                                                }
                                            >
                                                <option value="">
                                                    — Sélectionner —
                                                </option>
                                                {ACTE_TYPES.map((type) => (
                                                    <option
                                                        key={type.value}
                                                        value={type.value}
                                                    >
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
                                                    setCreateForm((f) => ({
                                                        ...f,
                                                        membre_id:
                                                            e.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">
                                                    — Sélectionner un membre —
                                                </option>
                                                {familyMembers.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.prenom}{" "}
                                                        {member.nom}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label="Date souhaitée" required>
                                            <input
                                                className="modal-input"
                                                type="date"
                                                value={
                                                    createForm.date_souhaitee
                                                }
                                                onChange={(e) =>
                                                    setCreateForm((f) => ({
                                                        ...f,
                                                        date_souhaitee:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </Field>
                                        <Field label="Note pour le pasteur">
                                            <textarea
                                                className="modal-textarea"
                                                rows={3}
                                                placeholder="Ajoutez un contexte ou des précisions..."
                                                value={createForm.message}
                                                onChange={(e) =>
                                                    setCreateForm((f) => ({
                                                        ...f,
                                                        message: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Field>
                                        {requiredActeFields.length > 0 && (
                                            <>
                                                {requiredActeFields.map(
                                                    (field) => (
                                                        <Field
                                                            key={field}
                                                            label={
                                                                ACTE_DETAIL_LABELS[
                                                                    field
                                                                ] || field
                                                            }
                                                            required
                                                        >
                                                            <input
                                                                className="modal-input"
                                                                type={
                                                                    ACTE_DETAIL_INPUT_TYPES[
                                                                        field
                                                                    ] || "text"
                                                                }
                                                                value={
                                                                    createForm
                                                                        .details?.[
                                                                        field
                                                                    ] || ""
                                                                }
                                                                onChange={(e) =>
                                                                    setCreateForm(
                                                                        (
                                                                            f,
                                                                        ) => ({
                                                                            ...f,
                                                                            details:
                                                                                {
                                                                                    ...(f.details ||
                                                                                        {}),
                                                                                    [field]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </Field>
                                                    ),
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-modal-ghost"
                                onClick={closeModal}
                            >
                                Annuler
                            </button>

                            {modal === "approve" && (
                                <button
                                    className="btn-modal btn-modal-gold"
                                    disabled={processing}
                                    onClick={() =>
                                        submitTransition("TRANSMISE_AU_PASTEUR")
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
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                    {processing
                                        ? "Transmission..."
                                        : "Transmettre au pasteur"}
                                </button>
                            )}
                            {modal === "refuse" && (
                                <button
                                    className="btn-modal btn-modal-red"
                                    disabled={processing}
                                    onClick={() =>
                                        submitTransition(
                                            "REFUSEE_PAR_CONDUCTEUR",
                                        )
                                    }
                                >
                                    {processing
                                        ? "Traitement..."
                                        : "Confirmer le refus"}
                                </button>
                            )}

                            {modal === "create" && (
                                <button
                                    className="btn-modal btn-msubmit acte-submit"
                                    disabled={acteProcessing}
                                    onClick={submitActe}
                                >
                                    {acteProcessing ? (
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
                                            </svg>{" "}
                                            Création...
                                        </>
                                    ) : (
                                        <>+ Créer l'acte</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ MODAL ANNONCES ══════════ */}
            {annonceModal === "create" && (
                <div className="modal-overlay open" onClick={closeAnnonceModal}>
                    <div
                        className="modal ann-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head ann-modal-head">
                            <div>
                                <div className="modal-title">
                                    {annonceStep === 1 && "✦ Nouvelle annonce"}
                                    {annonceStep === 2 &&
                                        `${selectedType?.emoji || "📢"} ${selectedType?.label || "Annonce"}`}
                                    {annonceStep === 3 && "✓ Confirmation"}
                                </div>
                                <div className="modal-sub">
                                    Étape {annonceStep} / 3 · Création directe
                                    d'une annonce paroissiale
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAnnonceModal}
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

                        <div className="ann-steps-bar">
                            {["Type d'annonce", "Contenu", "Confirmation"].map(
                                (label, index) => (
                                    <div
                                        key={index}
                                        className={`asb-step ${annonceStep > index + 1 ? "done" : annonceStep === index + 1 ? "active" : ""}`}
                                    >
                                        <div className="asb-dot">
                                            {annonceStep > index + 1
                                                ? "✓"
                                                : index + 1}
                                        </div>
                                        <span>{label}</span>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className="modal-body">
                            {annonceStep === 1 && (
                                <div className="ann-type-grid">
                                    {ANNONCE_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            className={`ann-type-btn atype-${type.color} ${annonceForm.type_annonce === type.value ? "sel" : ""}`}
                                            onClick={() =>
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
                                                    type_annonce: type.value,
                                                }))
                                            }
                                        >
                                            <span className="atb-emoji">
                                                {type.emoji}
                                            </span>
                                            <span className="atb-label">
                                                {type.label}
                                            </span>
                                            {annonceForm.type_annonce ===
                                                type.value && (
                                                <span className="atb-check">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {annonceStep === 2 && (
                                <div className="ann-form">
                                    <Field label="Membre concerné" required>
                                        <select
                                            className="ann-input"
                                            value={annonceForm.membre_id}
                                            onChange={(e) =>
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
                                                    membre_id: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">
                                                -- Sélectionnez un membre --
                                            </option>
                                            {familyMembers.map((member) => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.prenom} {member.nom}
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
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
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
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
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
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
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
                                                setAnnonceForm((prev) => ({
                                                    ...prev,
                                                    date_expiration:
                                                        e.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                </div>
                            )}

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
                                                Annonce conducteurs
                                            </div>
                                        </div>
                                    </div>
                                    {annonceForm.membre_id && (
                                        <RecapRow
                                            label="Concerné(e)"
                                            value={(() => {
                                                const member =
                                                    familyMembers.find(
                                                        (fm) =>
                                                            String(fm.id) ===
                                                            String(
                                                                annonceForm.membre_id,
                                                            ),
                                                    );
                                                return member
                                                    ? `${member.prenom} ${member.nom}`
                                                    : "Membre";
                                            })()}
                                        />
                                    )}
                                    {annonceForm.date_annonce && (
                                        <RecapRow
                                            label="Date"
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
                                </div>
                            )}
                        </div>

                        <div className="modal-foot">
                            {annonceStep > 1 ? (
                                <button
                                    className="btn-modal btn-modal-ghost"
                                    type="button"
                                    onClick={() => setAnnonceStep((s) => s - 1)}
                                >
                                    ← Retour
                                </button>
                            ) : (
                                <button
                                    className="btn-modal btn-modal-ghost"
                                    type="button"
                                    onClick={closeAnnonceModal}
                                >
                                    Annuler
                                </button>
                            )}
                            {annonceStep < 3 ? (
                                <button
                                    className="btn-modal btn-modal-green"
                                    type="button"
                                    onClick={() => {
                                        if (
                                            annonceStep === 1 &&
                                            !annonceForm.type_annonce
                                        )
                                            return;
                                        if (annonceStep === 2) {
                                            if (!annonceForm.membre_id) {
                                                showToast(
                                                    "Veuillez sélectionner un membre concerné.",
                                                );
                                                return;
                                            }
                                            if (!annonceForm.message.trim()) {
                                                showToast(
                                                    "Le message est obligatoire.",
                                                );
                                                return;
                                            }
                                            if (!annonceForm.date_annonce) {
                                                showToast(
                                                    "La date de l'annonce est requise.",
                                                );
                                                return;
                                            }
                                        }
                                        setAnnonceStep((s) => s + 1);
                                    }}
                                >
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    className="btn-modal btn-msubmit"
                                    type="button"
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
                                            </svg>{" "}
                                            Envoi...
                                        </>
                                    ) : (
                                        <>📢 Soumettre l'annonce</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {annonceModal && selectedAnnonce && (
                <div className="modal-overlay open" onClick={closeAnnonceModal}>
                    <div
                        className="modal modal-ann"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-head">
                            <div className="modal-head-left">
                                <div
                                    className={`modal-head-icon ${annonceModal === "refuse" ? "red" : "violet"}`}
                                >
                                    {annonceModal === "detail" && (
                                        <span style={{ fontSize: 20 }}>
                                            {ANNONCE_TYPES.find(
                                                (t) =>
                                                    t.value ===
                                                    selectedAnnonce.type_annonce,
                                            )?.emoji || "📢"}
                                        </span>
                                    )}
                                    {annonceModal === "approve" && (
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
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    )}
                                    {annonceModal === "refuse" && (
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
                                    )}
                                </div>
                                <div>
                                    <div className="modal-title">
                                        {annonceModal === "detail"
                                            ? "Détail de l'annonce"
                                            : annonceModal === "approve"
                                              ? "Transmettre au pasteur"
                                              : "Refuser l'annonce"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "#64748b",
                                            marginTop: 2,
                                        }}
                                    >
                                        Type :{" "}
                                        {ANNONCE_TYPES.find(
                                            (t) =>
                                                t.value ===
                                                selectedAnnonce.type_annonce,
                                        )?.label ||
                                            selectedAnnonce.type_annonce}
                                    </div>
                                </div>
                            </div>
                            <button
                                className="modal-close"
                                onClick={closeAnnonceModal}
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
                        <div className="modal-body">
                            {/* Informations principales */}
                            <div className="ann-modal-preview">
                                <div className="modal-info-row">
                                    <span className="modal-info-key">
                                        Type d'annonce
                                    </span>
                                    <span className="modal-info-val">
                                        {ANNONCE_TYPES.find(
                                            (t) =>
                                                t.value ===
                                                selectedAnnonce.type_annonce,
                                        )?.emoji || "📢"}{" "}
                                        {ANNONCE_TYPES.find(
                                            (t) =>
                                                t.value ===
                                                selectedAnnonce.type_annonce,
                                        )?.label ||
                                            selectedAnnonce.type_annonce}
                                    </span>
                                </div>

                                {(selectedAnnonce.createur?.prenom ||
                                    selectedAnnonce.createur?.nom) && (
                                    <div className="modal-info-row">
                                        <span className="modal-info-key">
                                            Créée par
                                        </span>
                                        <span className="modal-info-val">
                                            {[
                                                selectedAnnonce.createur
                                                    ?.prenom,
                                                selectedAnnonce.createur?.nom,
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </span>
                                    </div>
                                )}

                                {selectedAnnonce.nom_concerne && (
                                    <div className="modal-info-row">
                                        <span className="modal-info-key">
                                            Concerné(e)
                                        </span>
                                        <span className="modal-info-val">
                                            {selectedAnnonce.nom_concerne}
                                        </span>
                                    </div>
                                )}

                                {selectedAnnonce.classe?.nom && (
                                    <div className="modal-info-row">
                                        <span className="modal-info-key">
                                            Classe
                                        </span>
                                        <span className="modal-info-val">
                                            🏠 {selectedAnnonce.classe.nom}
                                        </span>
                                    </div>
                                )}

                                <div className="modal-info-row">
                                    <span className="modal-info-key">
                                        Statut
                                    </span>
                                    <span
                                        className="modal-info-val"
                                        style={{
                                            fontWeight: 700,
                                            color:
                                                selectedAnnonce.statut ===
                                                "SOUMISE"
                                                    ? "#7c3aed"
                                                    : selectedAnnonce.statut ===
                                                        "TRANSMISE_AU_PASTEUR"
                                                      ? "#2563eb"
                                                      : [
                                                              "VALIDEE",
                                                              "PUBLIEE",
                                                          ].includes(
                                                              selectedAnnonce.statut,
                                                          )
                                                        ? "#16a34a"
                                                        : "#dc2626",
                                        }}
                                    >
                                        {prettyStatut(selectedAnnonce.statut)}
                                    </span>
                                </div>

                                <div className="modal-info-row">
                                    <span className="modal-info-key">
                                        Soumise le
                                    </span>
                                    <span className="modal-info-val">
                                        {formatDateTime(
                                            selectedAnnonce.created_at,
                                        )}
                                    </span>
                                </div>

                                {selectedAnnonce.date_annonce && (
                                    <div className="modal-info-row">
                                        <span className="modal-info-key">
                                            Date événement
                                        </span>
                                        <span className="modal-info-val">
                                            📅{" "}
                                            {formatDate(
                                                selectedAnnonce.date_annonce,
                                            )}
                                        </span>
                                    </div>
                                )}

                                {selectedAnnonce.updated_at &&
                                    selectedAnnonce.updated_at !==
                                        selectedAnnonce.created_at && (
                                        <div className="modal-info-row no-border">
                                            <span className="modal-info-key">
                                                Dernière modif.
                                            </span>
                                            <span className="modal-info-val">
                                                {formatDateTime(
                                                    selectedAnnonce.updated_at,
                                                )}
                                            </span>
                                        </div>
                                    )}
                            </div>

                            {/* Message */}
                            <div style={{ margin: "18px 0 8px" }}>
                                <label className="modal-label">
                                    Message de l'annonce
                                </label>
                            </div>
                            <div className="ann-modal-msg">
                                {selectedAnnonce.message ||
                                    selectedAnnonce.details?.contenu ||
                                    "Aucun message"}
                            </div>

                            {/* Circuit de validation */}
                            {selectedAnnonce.statut === "SOUMISE" && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: "12px 14px",
                                        background: "rgba(124,58,237,.05)",
                                        border: "1px solid rgba(124,58,237,.15)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: "#7c3aed",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
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
                                    <span>
                                        Circuit : <strong>Conducteur</strong> →{" "}
                                        <strong>Pasteur</strong> →{" "}
                                        <strong>Publication</strong>
                                    </span>
                                </div>
                            )}

                            {selectedAnnonce.statut ===
                                "TRANSMISE_AU_PASTEUR" && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: "12px 14px",
                                        background: "rgba(37,99,235,.05)",
                                        border: "1px solid rgba(37,99,235,.15)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: "#2563eb",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
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
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>
                                        En attente de validation par le{" "}
                                        <strong>Pasteur</strong>
                                    </span>
                                </div>
                            )}

                            {/* Bouton télécharger fiche pour TRANSMISE_AU_PASTEUR */}
                            {selectedAnnonce.statut ===
                                "TRANSMISE_AU_PASTEUR" && (
                                <div style={{ marginTop: 16 }}>
                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            backgroundColor: "#3b82f6",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            transition: "background 0.2s",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.target.style.backgroundColor =
                                                "#2563eb")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.target.style.backgroundColor =
                                                "#3b82f6")
                                        }
                                        onClick={() => {
                                            window.location.href = `/conducteur/annonces/${selectedAnnonce.id}/fiche`;
                                        }}
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
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Télécharger la fiche
                                    </button>
                                </div>
                            )}

                            {["VALIDEE", "PUBLIEE"].includes(
                                selectedAnnonce.statut,
                            ) && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: "12px 14px",
                                        background: "rgba(22,163,74,.05)",
                                        border: "1px solid rgba(22,163,74,.15)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: "#16a34a",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontWeight: 600,
                                    }}
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
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>Annonce validée et publiée</span>
                                </div>
                            )}

                            {selectedAnnonce.statut?.startsWith("REFUSEE") &&
                                selectedAnnonce.commentaire_refus && (
                                    <div
                                        style={{
                                            marginTop: 16,
                                            padding: "12px 14px",
                                            background: "rgba(220,38,38,.05)",
                                            border: "1px solid rgba(220,38,38,.15)",
                                            borderLeft: "3px solid #dc2626",
                                            borderRadius: 8,
                                            fontSize: 12.5,
                                            color: "#dc2626",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            Motif du refus :
                                        </div>
                                        <div style={{ color: "#991b1b" }}>
                                            {selectedAnnonce.commentaire_refus}
                                        </div>
                                    </div>
                                )}

                            {/* Boutons d'action dans le détail */}
                            {annonceModal === "detail" &&
                                selectedAnnonce.statut === "SOUMISE" && (
                                    <div
                                        className="modal-actions-inline"
                                        style={{ marginTop: 18 }}
                                    >
                                        <button
                                            className="btn-modal btn-modal-violet"
                                            onClick={() =>
                                                setAnnonceModal("approve")
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
                                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                />
                                            </svg>
                                            Transmettre au pasteur
                                        </button>
                                        <button
                                            className="btn-modal btn-modal-red"
                                            onClick={() =>
                                                setAnnonceModal("refuse")
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
                                )}

                            {/* Formulaires commentaire */}
                            {annonceModal === "approve" && (
                                <div
                                    className="modal-field"
                                    style={{ marginTop: 16 }}
                                >
                                    <label className="modal-label">
                                        Commentaire pour le pasteur{" "}
                                        <span className="modal-optional">
                                            (optionnel)
                                        </span>
                                    </label>
                                    <textarea
                                        className="modal-textarea"
                                        value={annonceComment}
                                        onChange={(e) =>
                                            setAnnonceComment(e.target.value)
                                        }
                                        placeholder="Ajoutez une remarque ou un contexte pour le pasteur…"
                                    />
                                </div>
                            )}
                            {annonceModal === "refuse" && (
                                <div
                                    className="modal-field"
                                    style={{ marginTop: 16 }}
                                >
                                    <label className="modal-label">
                                        Motif du refus{" "}
                                        <span className="modal-required">
                                            *
                                        </span>
                                    </label>
                                    <textarea
                                        className="modal-textarea"
                                        value={annonceComment}
                                        onChange={(e) =>
                                            setAnnonceComment(e.target.value)
                                        }
                                        placeholder="Expliquez pourquoi cette annonce est refusée…"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-foot">
                            <button
                                className="btn-modal btn-modal-ghost"
                                onClick={closeAnnonceModal}
                            >
                                Fermer
                            </button>
                            {annonceModal === "approve" && (
                                <button
                                    className="btn-modal btn-modal-violet"
                                    disabled={annonceProcessing}
                                    onClick={() =>
                                        submitAnnonceTransition(
                                            "TRANSMISE_AU_PASTEUR",
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
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                    {annonceProcessing
                                        ? "Envoi..."
                                        : "Transmettre au pasteur"}
                                </button>
                            )}
                            {annonceModal === "refuse" && (
                                <button
                                    className="btn-modal btn-modal-red"
                                    disabled={annonceProcessing}
                                    onClick={() =>
                                        submitAnnonceTransition(
                                            "REFUSEE_PAR_CONDUCTEUR",
                                        )
                                    }
                                >
                                    {annonceProcessing
                                        ? "Traitement..."
                                        : "Confirmer le refus"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

/* ════════ HELPERS ════════ */
function prettyType(type) {
    const m = {
        bapteme: "Baptême",
        mariage: "Mariage",
        premiere_communion: "Première Communion",
        bapteme_premiere_communion: "Baptême + Première Communion",
        confirmation: "Confirmation",
        naissance: "Naissance",
        deces: "Décès",
    };
    return m[type] || type || "Acte";
}
function getActeStatus(acte) {
    if (!acte) return null;
    return acte.details?.ceremonie_statut || acte.statut;
}
function getActeBadgeClass(status) {
    if (["SOUMISE", "CEREMONIE_SOUMISE_AU_CONDUCTEUR"].includes(status))
        return "badge-soumise";
    if (
        ["TRANSMISE_AU_PASTEUR", "CEREMONIE_TRANSMISE_AU_PASTEUR"].includes(
            status,
        )
    )
        return "badge-transmis";
    if (
        [
            "VALIDEE",
            "PUBLIEE",
            "ARCHIVEE",
            "CEREMONIE_VALIDEE_PAR_PASTEUR",
        ].includes(status)
    )
        return "badge-valide";
    if (
        String(status).startsWith("REFUSEE") ||
        String(status).startsWith("CEREMONIE_REFUSEE")
    )
        return "badge-refuse";
    return "badge-transmis";
}
function prettyStatut(s) {
    const m = {
        SOUMISE: "Soumise",
        TRANSMISE_AU_PASTEUR: "Transmise au pasteur",
        EN_ATTENTE_CONDUCTEUR: "En attente du conducteur",
        CEREMONIE_SOUMISE_AU_CONDUCTEUR: "Date soumise au conducteur",
        CEREMONIE_TRANSMISE_AU_PASTEUR: "Date transmise au pasteur",
        CEREMONIE_VALIDEE_PAR_PASTEUR: "Date acceptée",
        VALIDEE: "Validée",
        PUBLIEE: "Publiée",
        ARCHIVEE: "Archivée",
        REFUSEE_PAR_CONDUCTEUR: "Date refusée par conducteur",
        CEREMONIE_REFUSEE_PAR_CONDUCTEUR: "Date refusée",
        REFUSEE_PAR_PASTEUR: "Refusée par pasteur",
        CEREMONIE_REFUSEE_PAR_PASTEUR: "Date refusée",
    };
    return m[s] || s;
}
function ceremonyStatusLabel(status) {
    const labels = {
        CEREMONIE_SOUMISE_AU_CONDUCTEUR: "Date soumise au conducteur",
        CEREMONIE_TRANSMISE_AU_PASTEUR: "Date transmise au pasteur",
        CEREMONIE_VALIDEE_PAR_PASTEUR: "Date validée",
        CEREMONIE_REFUSEE_PAR_CONDUCTEUR: "Date refusée",
        CEREMONIE_REFUSEE_PAR_PASTEUR: "Date refusée",
    };
    return labels[status] || "Date proposée";
}
function tone(type) {
    const m = {
        bapteme: "blue",
        mariage: "red",
        premiere_communion: "gold",
        bapteme_premiere_communion: "blue",
        confirmation: "blue",
        naissance: "green",
        deces: "orange",
    };
    return m[type] || "blue";
}
function iconEmoji(type) {
    const m = {
        bapteme: "🕊️",
        mariage: "💍",
        premiere_communion: "🍞",
        bapteme_premiere_communion: "🕊️🍞",
        confirmation: "✝️",
        naissance: "👶",
        deces: "🕯️",
    };
    return m[type] || "📜";
}
function dot(status) {
    if (
        [
            "VALIDEE",
            "PUBLIEE",
            "ARCHIVEE",
            "CEREMONIE_VALIDEE_PAR_PASTEUR",
        ].includes(status)
    )
        return "green";
    if (
        String(status).startsWith("REFUSEE") ||
        String(status).startsWith("CEREMONIE_REFUSEE")
    )
        return "red";
    return "gold";
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
    return (
        d.toLocaleDateString("fr-FR") +
        " à " +
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
}

function Field({ label, required, children }) {
    return (
        <div className="modal-field">
            <label className="modal-label">
                {label}
                {required && <span className="modal-required"> *</span>}
            </label>
            {children}
        </div>
    );
}

function RecapRow({ label, value }) {
    return (
        <div className="ann-recap-row">
            <span className="arm-label">{label}</span>
            <span className="arm-text">{value || "—"}</span>
        </div>
    );
}

function getPlaceholder(type) {
    const placeholders = {
        priere: "Ex : Nous sollicitons les prières de la communauté pour la guérison de…",
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        deces: "Ex : La famille a la douleur de vous annoncer le rappel à Dieu de…",
        generale: "Rédigez votre annonce à destination de l'assemblée…",
    };
    return placeholders[type] || "Rédigez votre message…";
}

/* ════════ STYLES ════════ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box}
.fiche-blue-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 13px;
    margin-left: 8px;
    transition: background 0.2s;
    cursor: pointer;
}
.fiche-blue-btn:hover {
    background: #1d4ed8;
}
.conductor-page{
  --grad:linear-gradient(135deg,#6B46C1 0%,#1E40AF 50%,#B6C01A 100%);
  --surface:rgba(255,255,255,0.92);--surface2:rgba(255,255,255,0.75);--surface3:rgba(255,255,255,0.18);
  --border:rgba(255,255,255,0.55);--border2:rgba(255,255,255,0.25);
  --text:#0f172a;--text2:#334155;--text3:#64748b;
  --gold:#B6C01A;--gold-dim:rgba(182,192,26,0.18);--gold-glow:rgba(182,192,26,0.32);
  --green:#16a34a;--green-dim:rgba(22,163,74,0.13);
  --red:#933232D3;--red-dim:rgba(220,38,38,0.13);
  --blue:#1E40AF;--blue-dim:rgba(30,64,175,0.13);
  --orange:#ea580c;--orange-dim:rgba(234,88,12,0.13);
  --violet:#5B3FAF;--violet-dim:rgba(91,63,175,0.13);--violet-glow:rgba(91,63,175,0.28);
  background:var(--grad);color:var(--text);min-height:100vh;
  font-family:'Outfit',system-ui,sans-serif;position:relative;
}
.conductor-page::before{content:"";position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;z-index:0;}
.conductor-page::after{content:"";position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 0% 0%,rgba(139,92,246,0.12),transparent 50%),radial-gradient(ellipse 60% 40% at 100% 100%,rgba(182,192,26,0.1),transparent 50%);pointer-events:none;z-index:0;}
.main{min-height:100vh;position:relative;z-index:1}
.page-content{padding:28px 38px}

/* ── TOP ── */
.top-actions{display:flex;align-items:center;gap:16px;margin-bottom:24px}
.btn-back{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);font-size:12.5px;font-weight:600;text-decoration:none;backdrop-filter:blur(12px);transition:all .2s;}
.btn-back:hover{background:var(--surface);color:var(--text)}
.page-heading{flex:1}.page-title{font-size:22px;font-weight:700;color:white;text-shadow:0 1px 3px rgba(0,0,0,.2);line-height:1.2;}
.btn-create{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--gold);color:#1a1a00;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px var(--gold-glow);transition:all .2s;}
.btn-create:hover{transform:translateY(-1px);box-shadow:0 8px 20px var(--gold-glow)}

/* ── ALERTS ── */
.alerts-row{display:flex;gap:8px;margin-bottom:22px}
.alert-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:10px;padding:13px 18px;color:white;}
.alert-actes{background:var(--red);border:1px solid #b91c1c;border-left:3px solid #7f1d1d;}
.alert-annonces{background:linear-gradient(90deg,#4C1D95,var(--violet));border:1px solid rgba(91,63,175,.6);border-left:3px solid #2D0B80;}
.alert-left{display:flex;align-items:center;gap:12px}
.alert-icon-wrap{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;}
.alert-text{display:flex;flex-direction:column;gap:2px}.alert-text strong{font-size:13px;font-weight:700}.alert-text span{font-size:11.5px;color:rgba(255,255,255,.85)}
.alert-action{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);color:white;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;}
.alert-action:hover{background:rgba(255,255,255,.28)}

/* ── KPI ── */
.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 22px 18px;backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,.12),0 1px 0 rgba(255,255,255,.6) inset;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;}
.kpi-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0) 60%);pointer-events:none;}
.kpi-card:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.16)}
.kpi-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.kpi-icon-wrap{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.5);}
.kpi-icon-orange{background:var(--orange-dim);color:var(--orange)}.kpi-icon-gold{background:var(--gold-dim);color:#857400}.kpi-icon-green{background:var(--green-dim);color:var(--green)}.kpi-icon-blue{background:var(--blue-dim);color:var(--blue)}.kpi-icon-violet{background:var(--violet-dim);color:var(--violet)}
.kpi-badge{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px}
.kpi-badge-orange{background:var(--orange-dim);color:var(--orange);border:1px solid rgba(234,88,12,.2)}.kpi-badge-gold{background:var(--gold-dim);color:#857400;border:1px solid rgba(182,192,26,.3)}.kpi-badge-green{background:var(--green-dim);color:var(--green);border:1px solid rgba(22,163,74,.2)}.kpi-badge-blue{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(30,64,175,.2)}.kpi-badge-violet{background:var(--violet-dim);color:var(--violet);border:1px solid rgba(91,63,175,.25)}
.kpi-number{font-size:38px;font-weight:700;line-height:1;color:var(--text);margin-bottom:4px}.kpi-label{font-size:12px;color:var(--text3);font-weight:500;margin-bottom:14px}
.kpi-bar{height:3px;background:rgba(30,41,59,.08);border-radius:10px;overflow:hidden}.kpi-bar-fill{height:100%;border-radius:10px;transition:width .6s ease}
.kpi-bar-orange{background:var(--orange)}.kpi-bar-gold{background:var(--gold)}.kpi-bar-green{background:var(--green)}.kpi-bar-blue{background:var(--blue)}.kpi-bar-violet{background:var(--violet)}

/* ── TABS ── */
.tab-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.tab-bar{display:flex;gap:3px;background:var(--surface2);border:1px solid var(--border);border-radius:11px;padding:4px;margin-bottom:0;width:fit-content;backdrop-filter:blur(12px);box-shadow:0 2px 12px rgba(0,0,0,.08);}
.tab{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text3);background:none;border:none;cursor:pointer;transition:all .2s;white-space:nowrap;}
.tab:hover{color:var(--text);background:rgba(255,255,255,.4)}.tab.active{background:var(--surface);color:var(--text);box-shadow:0 1px 6px rgba(0,0,0,.1)}.tab svg{opacity:.6}.tab.active svg{opacity:1}
.tab-count{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700}
.tab-red{background:var(--red);color:white}.tab-gold{background:var(--gold-dim);color:#857400;border:1px solid rgba(182,192,26,.3)}
.tab-violet{background:var(--violet);color:white}
.tab-ann.active{color:var(--violet)}
.tab-date{color:var(--text3)}
.tab-date.active{color:var(--text);background:rgba(30,64,175,.12);border-color:transparent;box-shadow:0 4px 12px rgba(91,63,175,.25)}
.tab-count.tab-sage{background:rgba(74,124,94,.2);color:#4a7c5e;border:1px solid rgba(74,124,94,.3)}
 
.date-tab-root{display:flex;flex-direction:column;gap:18px}
.date-section-panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.18)}
.date-section-history{border-color:rgba(15,23,42,.2)}
.calendar-tab-root{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.18)}
.date-shell{display:flex;flex-direction:column;gap:18px}
.date-shell-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:8px 6px 2px}
.date-shell-title{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.date-shell-sub{font-size:12.5px;color:var(--text3);margin-top:6px;max-width:620px;line-height:1.55}
.date-shell-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.date-shell-count{display:inline-flex;align-items:center;justify-content:center;min-width:112px;padding:9px 14px;border-radius:999px;background:rgba(126,182,255,.16);border:1px solid rgba(126,182,255,.28);color:#22437a;font-size:12px;font-weight:800}
.date-history-shell{display:flex;flex-direction:column;gap:12px}
.date-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:6px 6px 4px}
.date-history-title{font-size:18px;font-weight:800;color:var(--text);letter-spacing:-.02em}
.date-history-sub{font-size:12.5px;color:var(--text3);margin-top:6px;max-width:700px;line-height:1.55}
.date-history-count{display:inline-flex;align-items:center;justify-content:center;min-width:112px;padding:9px 14px;border-radius:999px;background:var(--green-dim);border:1px solid rgba(22,163,74,.22);color:var(--green);font-size:12px;font-weight:800}
.date-history-table-scroll{margin-top:4px}
.date-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,360px));gap:18px}
.date-card{padding:20px;border-radius:18px;border:1px solid rgba(15,23,42,.08);background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,247,251,.96));display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 34px rgba(15,23,42,.12);min-height:246px}
.date-card-check{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:var(--text3);width:fit-content}
.date-card-check input{width:15px;height:15px;accent-color:var(--violet);cursor:pointer}
.date-card-check span{user-select:none}
.date-card-main{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
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
.date-card .badge{font-size:10px;padding:3px 10px}
.date-card-button{display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:9px;background:rgba(255,255,255,.88);color:var(--text2);border:1px solid var(--border2);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit}
.date-card-button:hover{background:rgba(255,255,255,.2);color:var(--text)}
.history-table{border-collapse:collapse;width:100%;margin:0;background:rgba(255,255,255,.94);border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)}
.history-table thead{background:linear-gradient(135deg,rgba(0,71,171,0.95) 0%,rgba(30,64,175,0.95) 100%);color:#fff;font-weight:600;font-size:12px}
.history-table thead tr th{padding:12px 16px;text-align:left;border-bottom:2px solid rgba(0,71,171,0.3);white-space:nowrap}
.history-table tbody tr{border-bottom:1px solid rgba(0,0,0,0.08);transition:background .15s}
.history-table tbody tr:nth-child(odd){background:rgba(248,250,252,0.5)}
.history-table tbody tr:hover{background:rgba(248,250,252,1)}
.history-table tbody td{padding:11px 16px;font-size:13px;color:#0f172a;vertical-align:top}
.quick-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.quick-dropdown{min-width:300px;height:40px;background:#ECEFF4;border:2px solid #D9DEE8;border-radius:10px;padding:0 48px 0 46px;font-size:16px;font-weight:800;color:#111827;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23586A84' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat,no-repeat;background-position:left 16px center,right 16px center;background-size:18px 18px,18px 18px}
.quick-dropdown:focus{border-color:var(--violet);box-shadow:0 0 0 3px rgba(91,63,175,.12)}
.quick-search{min-width:260px;background:rgba(255,255,255,.95);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;color:var(--text);outline:none}
.quick-search:focus{border-color:var(--violet);box-shadow:0 0 0 3px rgba(91,63,175,.12)}

/* ── GRIDS ── */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.grid-3-1{display:grid;grid-template-columns:2fr 1fr;gap:20px}

/* ── PANELS ── */
.panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;backdrop-filter:blur(12px);box-shadow:0 8px 30px rgba(0,0,0,.1),0 1px 0 rgba(255,255,255,.7) inset;}
.panel-head{padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.panel-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.btn-bulk{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;background:var(--gold-dim);color:#857400;border:1px solid rgba(182,192,26,.3);font-size:11.5px;font-weight:700;cursor:pointer;transition:all .15s;}
.btn-bulk:disabled{opacity:.5;cursor:not-allowed}
.btn-bulk-refuse{background:var(--red-dim);color:var(--red);border:1px solid rgba(220,38,38,.25);}
.btn-bulk-violet{background:var(--violet-dim);color:var(--violet);border:1px solid rgba(91,63,175,.25);}
.btn-bulk-violet:hover:not(:disabled){background:var(--violet);color:white}
.panel-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:var(--text);}
.panel-subtitle{font-size:11.5px;color:var(--text3);margin-top:3px}
.panel-count-badge{font-size:11px;font-weight:800;padding:4px 11px;border-radius:20px;background:var(--red-dim);color:var(--red);border:1px solid rgba(220,38,38,.2);}
.panel-count-gold{background:var(--gold-dim);color:#857400;border-color:rgba(182,192,26,.3)}
.panel-body{padding:0}

/* ── CIRCUIT ── */
.circuit-steps{padding:18px 20px;display:flex;flex-direction:column}
.circuit-step{display:flex;align-items:flex-start;gap:12px;position:relative;padding-bottom:16px}.circuit-step:last-child{padding-bottom:0}
.circuit-dot{width:24px;height:24px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid transparent;position:relative;z-index:1;}
.circuit-dot.done{background:var(--green);color:white;border-color:var(--green)}.circuit-dot.active{background:var(--gold-dim);color:#857400;border-color:var(--gold);animation:pulse 2s infinite}.circuit-dot.pending{background:rgba(100,116,139,.1);color:var(--text3);border:2px dashed rgba(100,116,139,.3);font-size:9px}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(182,192,26,.4)}50%{box-shadow:0 0 0 6px rgba(182,192,26,0)}}
.circuit-line{position:absolute;left:11px;top:26px;width:2px;height:calc(100% - 10px);background:var(--border);z-index:0;}.circuit-line.done{background:var(--green);opacity:.4}
.circuit-text{padding-top:2px}.circuit-text strong{display:block;font-size:12.5px;font-weight:700;color:var(--text)}.circuit-text span{font-size:11px;color:var(--text3)}
.panel-side-body{padding:16px 20px}.panel-side-body p{font-size:12.5px;color:var(--text3);line-height:1.65;margin-bottom:14px}
.btn-create-side{display:inline-flex;align-items:center;gap:7px;width:100%;justify-content:center;padding:10px;border-radius:8px;background:var(--gold-dim);color:#857400;border:1px solid rgba(182,192,26,.3);font-size:12.5px;font-weight:700;cursor:pointer;transition:all .2s;}
.btn-create-side:hover{background:var(--gold);color:#1a1a00}
.btn-cta-ann{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
.btn-cta-ann:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(124,58,237,.35)}
.btn-cta-ann-sm{width:auto;padding:10px 18px}

/* ── DEMANDE ITEMS ── */
.demande-item{display:flex;align-items:center;gap:16px;padding:15px 24px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;}
.bulk-check{display:flex;align-items:center}.bulk-check input{width:16px;height:16px;accent-color:var(--gold)}
.demande-item:last-child{border-bottom:none}.demande-item:hover{background:rgba(255,255,255,.5)}.demande-item.urgent{background:rgba(220,38,38,.03);border-left:3px solid var(--red);}
.demande-acte-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid rgba(255,255,255,.5);}
.demande-acte-icon.orange{background:var(--orange-dim)}.demande-acte-icon.blue{background:var(--blue-dim)}.demande-acte-icon.gold{background:var(--gold-dim)}.demande-acte-icon.green{background:var(--green-dim)}.demande-acte-icon.red{background:var(--red-dim)}
.demande-info{flex:1;min-width:0}.demande-name{font-size:13.5px;font-weight:600;color:var(--text)}.demande-type{font-size:11.5px;color:var(--text3);margin-top:2px}
.demande-meta{display:flex;flex-direction:column;align-items:flex-end;gap:7px;flex-shrink:0}

/* ── BADGES ── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.04em;}
.badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor}
.badge-soumise{background:var(--orange-dim);color:var(--orange);border:1px solid rgba(234,88,12,.22)}.badge-transmis{background:var(--gold-dim);color:#857400;border:1px solid rgba(182,192,26,.28)}.badge-valide{background:var(--green-dim);color:var(--green);border:1px solid rgba(22,163,74,.22)}.badge-refuse{background:var(--red-dim);color:var(--red);border:1px solid rgba(220,38,38,.22)}

/* ── BUTTONS ── */
.item-actions{display:flex;gap:6px}
.btn-small{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;border:none;cursor:pointer;transition:all .15s;font-family:inherit;}
.btn-view{background:rgba(255,255,255,.6);color:var(--text2);border:1px solid var(--border)}.btn-view:hover{background:rgba(255,255,255,.9)}
.btn-approve{background:var(--green-dim);color:var(--green);border:1px solid rgba(22,163,74,.2)}.btn-approve:hover{background:var(--green);color:white}
.btn-refuse{background:var(--red-dim);color:var(--red);border:1px solid rgba(220,38,38,.2)}.btn-refuse:hover{background:var(--red);color:white}

/* ── EMPTY / PAGER ── */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:var(--text3);font-size:13px;}.empty-state svg{opacity:.3}
.pager{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 22px;border-top:1px solid var(--border);background:rgba(255,255,255,.35)}
.pager-btn{border:1px solid var(--border);background:var(--surface2);color:var(--text2);border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer}.pager-btn:disabled{opacity:.5;cursor:not-allowed}
.pager-info{font-size:11.5px;color:var(--text3);font-weight:700}

/* ════════════════════════════════════
   ★ ONGLET ANNONCES
════════════════════════════════════ */
.ann-tab-root{display:flex;flex-direction:column;gap:16px}

/* Héro bannière */
.ann-hero{
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;
  background:linear-gradient(135deg,rgba(91,63,175,.2) 0%,rgba(30,64,175,.18) 60%,rgba(182,192,26,.1) 100%);
  border:1px solid rgba(91,63,175,.28);
  border-radius:14px;padding:20px 26px;
  backdrop-filter:blur(14px);
  box-shadow:0 8px 30px rgba(91,63,175,.15);
}
.ann-hero-left{display:flex;align-items:center;gap:16px}
.ann-hero-pulse{
  width:54px;height:54px;border-radius:14px;
  background:linear-gradient(135deg,rgba(91,63,175,.3),rgba(30,64,175,.3));
  border:1px solid rgba(91,63,175,.4);
  display:flex;align-items:center;justify-content:center;
  color:white;flex-shrink:0;
  animation:heroPulse 3s ease-in-out infinite;
}
@keyframes heroPulse{0%,100%{box-shadow:0 0 0 0 rgba(91,63,175,.3)}50%{box-shadow:0 0 0 10px rgba(91,63,175,0)}}
.ann-hero-title{font-size:20px;font-weight:800;color:white;text-shadow:0 1px 4px rgba(0,0,0,.2)}
.ann-hero-sub{font-size:12px;color:rgba(255,255,255,.65);margin-top:4px;line-height:1.5}
.ann-hero-stats{display:flex;gap:12px;flex-wrap:wrap}
.ann-mini-stat{text-align:center;padding:10px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.2);min-width:70px;backdrop-filter:blur(8px);}
.ann-mini-n{font-size:22px;font-weight:800;line-height:1}
.ann-mini-l{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-top:3px;opacity:.75}
.ann-mini-orange{background:rgba(234,88,12,.15);color:#ea8c4c;border-color:rgba(234,88,12,.2)}
.ann-mini-gold{background:rgba(182,192,26,.15);color:#c4cf22;border-color:rgba(182,192,26,.2)}
.ann-mini-green{background:rgba(22,163,74,.15);color:#4ade80;border-color:rgba(22,163,74,.2)}
.ann-mini-red{background:rgba(220,38,38,.15);color:#f87171;border-color:rgba(220,38,38,.2)}
.ann-mini-total{background:rgba(15,23,42,.15);color:#0f172a;border-color:rgba(15,23,42,.35)}
.ann-modal{max-width:540px;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.3);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;}
.ann-modal-head{padding:20px 22px;border-bottom:1px solid #E8E4DC;display:flex;align-items:flex-start;justify-content:space-between;}
.ann-modal-head .modal-title{font-weight:800;font-size:19px;color:#1E1B16;}
.ann-modal-head .modal-sub{font-size:13px;color:#9C9484;margin-top:4px;}
.ann-steps-bar{display:flex;padding:16px 24px;border-bottom:1px solid #E8E4DC;gap:0;}
.asb-step{flex:1;display:flex;align-items:center;gap:10px;font-size:12px;color:#9C9484;font-weight:600;position:relative;}
.asb-step:not(:last-child)::after{content:"→";position:absolute;right:-8px;color:#D6D1C7;font-weight:500;}
.asb-step .asb-dot{width:28px;height:28px;border-radius:50%;border:2px solid #D6D1C7;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#9C9484;background:#F5F4F0;flex-shrink:0;}
.asb-step.done .asb-dot{background:#4A7C5E;border-color:#4A7C5E;color:#fff;}
.asb-step.active .asb-dot{background:rgba(91,63,175,.12);border-color:#5B3FAF;color:#5B3FAF;}
.asb-step.active{color:#5B3FAF;}
.ann-type-grid{grid-template-columns:repeat(2,minmax(0,1fr));}

/* Sous-tabs À traiter / Traitées */
.ann-subtabs{display:inline-flex;gap:3px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:9px;padding:3px;}
.ann-subtab{padding:7px 16px;border-radius:7px;font-size:12.5px;font-weight:700;color:var(--text3);background:none;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:7px;}
.ann-subtab:hover{color:var(--text);background:rgba(255,255,255,.4)}.ann-subtab.active{background:var(--surface);color:var(--violet);box-shadow:0 1px 6px rgba(91,63,175,.15)}
.ann-subtab-badge{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:800;background:var(--orange);color:white}
.ann-subtab-badge-done{background:var(--green-dim);color:var(--green);border:1px solid rgba(22,163,74,.25)}

/* Items annonces */
.ann-item{display:flex;align-items:flex-start;gap:14px;padding:16px 24px;border-bottom:1px solid var(--border);transition:background .15s;}
.ann-item:last-child{border-bottom:none}.ann-item:hover{background:rgba(255,255,255,.5)}
.ann-item-pending{border-left:3px solid var(--violet);background:rgba(91,63,175,.02)}
.ann-type-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid rgba(255,255,255,.5);}
.aicon-violet{background:rgba(157,143,224,.12)}.aicon-gold{background:var(--gold-dim)}.aicon-slate{background:rgba(90,90,90,.07)}.aicon-orange{background:var(--orange-dim)}.aicon-green{background:var(--green-dim)}
.ann-item-body{flex:1;min-width:0;cursor:pointer}
.ann-item-header{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
.ann-item-type{font-size:13.5px;font-weight:700;color:var(--text)}.ann-item-who{font-size:13px;color:var(--text2)}
.ann-item-msg{font-size:12px;color:var(--text3);line-height:1.6;margin-bottom:8px}
.ann-item-footer{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.ann-status-line{font-size:11px;color:rgba(15,23,42,.65);margin-top:8px;font-weight:600}
.ann-chip{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:6px;background:rgba(30,41,59,.06);border:1px solid rgba(30,41,59,.1);color:var(--text3)}
.ann-chip-class{background:var(--violet-dim);color:var(--violet);border-color:rgba(91,63,175,.2)}
.ann-date{font-size:10.5px;color:var(--text3)}
.ann-item-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;min-width:120px}
.

/* Stat sidebar annonces */
.ann-stat-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(30,41,59,.06)}.ann-stat-row:last-child{border-bottom:none}
.ann-stat-emoji{font-size:18px;width:24px;text-align:center;flex-shrink:0}
.ann-stat-info{flex:1;min-width:0}.ann-stat-name{font-size:11.5px;font-weight:600;color:var(--text2);margin-bottom:5px}
.ann-stat-bar{height:4px;background:rgba(30,41,59,.08);border-radius:6px;overflow:hidden}.ann-stat-fill{height:100%;border-radius:6px;transition:width .6s}
.asfill-violet{background:var(--violet)}.asfill-gold{background:var(--gold)}.asfill-slate{background:#909090}.asfill-orange{background:var(--orange)}.asfill-green{background:var(--green)}
.ann-stat-cnt{font-size:15px;font-weight:800;color:var(--text);width:22px;text-align:right}

/* ── TIMELINE ── */
.timeline-item{display:flex;gap:14px;padding:14px 24px;border-bottom:1px solid var(--border);align-items:flex-start}.timeline-item:last-child{border-bottom:none}
.timeline-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0}.timeline-dot.green{background:var(--green)}.timeline-dot.gold{background:var(--gold)}.timeline-dot.red{background:var(--red)}
.timeline-content{flex:1}.timeline-action{font-size:13px;font-weight:600;color:var(--text)}.timeline-detail{font-size:11.5px;color:var(--text3);margin-top:2px}
.timeline-time{font-size:10.5px;color:var(--text3);white-space:nowrap;padding-top:2px}

/* ── STATS ── */
.stats-types{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
.stat-type-row{display:flex;align-items:center;gap:12px}.stat-type-icon{width:36px;height:36px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;}
.stat-type-icon.blue{background:var(--blue-dim)}.stat-type-icon.red{background:var(--red-dim)}.stat-type-icon.gold{background:var(--gold-dim)}.stat-type-icon.orange{background:var(--orange-dim)}
.stat-type-info{flex:1;min-width:0}.stat-type-name{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:5px}
.stat-type-bar-wrap{display:flex;align-items:center;gap:8px}.stat-type-bar{flex:1;height:5px;background:rgba(30,41,59,.08);border-radius:10px;overflow:hidden}.stat-type-bar-fill{height:100%;border-radius:10px;transition:width .6s}
.stat-type-bar-fill.blue{background:var(--blue)}.stat-type-bar-fill.red{background:var(--red)}.stat-type-bar-fill.gold{background:var(--gold)}.stat-type-bar-fill.orange{background:var(--orange)}
.stat-type-pct{font-size:11px;font-weight:700;color:var(--text3);width:30px;text-align:right}.stat-type-count{font-size:15px;font-weight:800;color:var(--text);width:28px;text-align:right}
.stats-rates{padding:24px;display:flex;flex-direction:column;gap:24px}.rate-big{display:flex;justify-content:center}.rate-circle{position:relative;width:120px;height:120px}.rate-svg{width:100%;height:100%;transform:rotate(-90deg)}.rate-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.rate-pct{font-size:26px;font-weight:800;color:var(--text);line-height:1}.rate-lbl{font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.rate-rows{display:flex;flex-direction:column;gap:8px}.rate-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,.4);border-radius:8px}.rate-row.total-row{border-top:1px solid var(--border);margin-top:4px;padding-top:12px;background:rgba(255,255,255,.6)}
.rate-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.rate-dot.green{background:var(--green)}.rate-dot.gold{background:var(--gold)}.rate-dot.orange{background:var(--orange)}.rate-dot.blue{background:var(--blue)}
.rate-name{flex:1;font-size:12.5px;color:var(--text2);font-weight:500}.rate-val{font-size:14px;font-weight:800;color:var(--text)}

/* ── MODALS ── */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:16px;overflow-y:auto;}
.modal-overlay.open{display:flex}
.modal{background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.8);border-radius:16px;width:100%;max-width:500px;margin:auto;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.25);animation:modalIn .3s cubic-bezier(.34,1.56,.64,1) both;}
.acte-head-icon{width:44px;height:44px;background:rgba(16,185,129,.15);border-radius:12px;color:#047857;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex-shrink:0;border:1px solid rgba(16,185,129,.5);}
.acte-form-root{background:#f8fafc;border:1px solid rgba(15,23,42,.08);border-radius:16px;padding:18px;margin-top:8px;box-shadow:0 8px 24px rgba(15,23,42,.08);}
.acte-form{display:flex;flex-direction:column;gap:18px;}
.acte-form .modal-field{margin-bottom:0;}
.acte-submit{background:linear-gradient(90deg,#16a34a,#15803d);color:white;border:none;box-shadow:0 4px 12px rgba(16,185,129,.35);}
.acte-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(16,185,129,.45);}
.acte-submit:disabled{opacity:.6;cursor:not-allowed;box-shadow:none;}
.modal-ann{max-width:560px}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-head{padding:20px 24px;border-bottom:1px solid rgba(0,0,0,.07);display:flex;align-items:center;justify-content:space-between;}
.modal-head-left{display:flex;align-items:center;gap:12px}
.modal-head-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.modal-head-icon.blue{background:var(--blue-dim);color:var(--blue)}.modal-head-icon.gold{background:var(--gold-dim);color:#857400}.modal-head-icon.red{background:var(--red-dim);color:var(--red)}.modal-head-icon.green{background:var(--green-dim);color:var(--green)}.modal-head-icon.violet{background:var(--violet-dim);color:var(--violet)}
.modal-title{font-size:17px;font-weight:700;color:var(--text)}
.modal-close{width:32px;height:32px;border-radius:8px;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.08);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.modal-close:hover{background:rgba(0,0,0,.1);color:var(--text)}
.modal-body{padding:24px 22px;flex:1;overflow-y:auto;}
.modal-info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.05);font-size:13px;gap:12px;}
.modal-info-row.no-border{border-bottom:none}.modal-info-key{color:var(--text3);font-weight:600}.modal-info-val{color:var(--text);font-weight:500;text-align:right}.modal-info-val.mono{font-family:monospace;font-size:12px;background:rgba(0,0,0,.04);padding:2px 7px;border-radius:4px}
.modal-detail-tabs{display:flex;gap:10px;margin-bottom:16px}
.modal-detail-tab{padding:8px 16px;border-radius:999px;border:none;background:rgba(15,23,42,.08);color:var(--text2);font-weight:600;cursor:pointer;transition:all .2s}
.modal-detail-tab:hover{background:rgba(15,23,42,.2)}
.modal-detail-tab.active{background:var(--surface);color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,.15)}
.ceremony-tab{display:flex;flex-direction:column;gap:12px;padding-top:8px}
.ceremony-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;padding:12px;border-radius:10px;background:#f5f5f5;border:1px solid rgba(0,0,0,.06)}
.modal-detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.05);font-size:13px;gap:12px}
.modal-detail-row:last-child{border-bottom:none}
.modal-actions-inline{display:flex;gap:8px;flex-wrap:wrap;}
.modal-field{margin-bottom:4px}
.modal-label{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--text3);font-weight:700;margin-bottom:8px;display:block;}
.modal-optional{font-size:9px;color:var(--text3);text-transform:none;letter-spacing:0;font-weight:500}.modal-required{color:var(--red)}
.modal-input,.modal-textarea,.modal-select{width:100%;padding:11px 14px;background:rgba(241,245,249,.8);border:1.5px solid rgba(30,41,59,.12);border-radius:9px;color:var(--text);font-family:'Outfit',system-ui,sans-serif;font-size:13.5px;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;}
.modal-input:focus,.modal-textarea:focus,.modal-select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(30,64,175,.1);background:white;}
.modal-textarea{min-height:95px;resize:vertical;line-height:1.6}
.modal-select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:36px;cursor:pointer}
.member-pager{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:8px}
.modal-foot{padding:16px 22px;border-top:1px solid #E8E4DC;display:flex;justify-content:flex-end;gap:10px;background:#FBFAF8;}
.btn-modal{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-size:12.5px;font-weight:700;font-family:'Outfit',system-ui,sans-serif;transition:all .2s;}
.btn-modal-ghost{background:rgba(0,0,0,.05);color:var(--text2);border:1px solid rgba(0,0,0,.1)}.btn-modal-ghost:hover{background:rgba(0,0,0,.1)}
.btn-modal-gold{background:var(--gold);color:#1a1a00;box-shadow:0 2px 8px var(--gold-glow)}.btn-modal-gold:hover{transform:translateY(-1px);box-shadow:0 6px 16px var(--gold-glow)}
.btn-modal-red{background:var(--red);color:white}.btn-modal-red:hover{background:#b91c1c;transform:translateY(-1px)}
.btn-modal-green{background:var(--green);color:white}.btn-modal-green:hover{background:#15803d;transform:translateY(-1px)}
.btn-modal-violet{background:var(--violet);color:white;box-shadow:0 2px 8px var(--violet-glow)}.btn-modal-violet:hover{background:#4C34A0;transform:translateY(-1px);box-shadow:0 6px 16px var(--violet-glow)}
.btn-modal:disabled{opacity:.5;cursor:not-allowed;transform:none !important}

/* announcement form styles */
.ann-field{display:flex;flex-direction:column;gap:8px}.ann-label{font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#5C5748}.ann-req{color:#C06040}
.ann-input{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
.ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-textarea{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ann-type-btn{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:10px;border:2px solid #E8E4DC;background:#FAFAF7;cursor:pointer;transition:all .2s;text-align:left;position:relative;}
.ann-type-btn:hover{border-color:#5B3FAF;background:rgba(91,63,175,.04)}.ann-type-btn.sel{border-color:#5B3FAF;background:rgba(91,63,175,.07);box-shadow:0 0 0 3px rgba(91,63,175,.12)}
.atb-emoji{font-size:28px;flex-shrink:0}.atb-label{font-size:13px;font-weight:700;color:#1E1B16;line-height:1.4;flex:1;}
.atb-check{width:22px;height:22px;border-radius:50%;background:#5B3FAF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
.ann-form{display:flex;flex-direction:column;gap:18px;}
.ann-chars{font-size:11px;color:#9C9484;text-align:right;}
.ann-visibility{display:flex;align-items:center;gap:8px;padding:12px 14px;background:rgba(74,124,94,.06);border:1px solid rgba(74,124,94,.18);border-radius:8px;font-size:13px;color:#4A7C5E;font-weight:600;}
.ann-recap{display:flex;flex-direction:column;gap:14px;}
.ann-recap-type{display:flex;align-items:center;gap:16px;padding:18px;border-radius:10px;background:#F5F4F0;border:1.5px solid #E8E4DC;}
.ann-recap-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #E8E4DC;font-size:13px;gap:10px;}
.ann-recap-msg{background:#F5F4F0;border-radius:8px;padding:14px;border:1px solid #E8E4DC;}
.arm-label{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:8px;}
.arm-text{font-size:13.5px;color:#1E1B16;line-height:1.7;}
@media(max-width:768px){.ann-type-grid{grid-template-columns:1fr}}

/* Modal annonce */
.ann-modal-preview{background:rgba(91,63,175,.04);border:1px solid rgba(91,63,175,.12);border-radius:10px;padding:14px 16px;margin-bottom:4px;}
.ann-modal-msg{background:#F8F7FF;border:1px solid rgba(91,63,175,.15);border-left:3px solid var(--violet);border-radius:8px;padding:14px;font-size:13.5px;color:var(--text);line-height:1.7}

/* ── TOAST ── */
.toast{position:fixed;right:24px;bottom:24px;background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.8);border-left:4px solid var(--green);color:var(--text);padding:13px 18px;border-radius:11px;z-index:220;font-size:13px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.15);backdrop-filter:blur(8px);animation:toastIn .35s cubic-bezier(.34,1.56,.64,1) both;}
@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

@media(max-width:1100px){.kpi-row{grid-template-columns:repeat(2,1fr)}.grid-3-1,.grid-2{grid-template-columns:1fr}}
@media(max-width:768px){.page-content{padding:18px}.kpi-row{grid-template-columns:1fr 1fr}.tab-toolbar{align-items:stretch}.tab-bar{width:100%;overflow-x:auto;margin-bottom:0}.quick-tools{width:100%;justify-content:flex-start}.quick-dropdown{width:100%;min-width:0}.quick-search{width:100%;min-width:0}.top-actions{flex-wrap:wrap}.page-heading{order:-1;width:100%}.ann-hero{flex-direction:column;align-items:flex-start}.ann-hero-stats{width:100%}.ann-item-right{min-width:auto}.date-shell-head{flex-direction:column;align-items:flex-start}.date-shell-tools{width:100%;justify-content:flex-start}.date-shell-count{min-width:0}.date-history-head{flex-direction:column;align-items:flex-start}.date-history-count{min-width:0}.date-card{min-height:auto;padding:18px}.date-grid{grid-template-columns:1fr}}
@media(max-width:500px){.kpi-row{grid-template-columns:1fr}}
`;
