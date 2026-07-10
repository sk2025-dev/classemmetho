import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft, Download } from "lucide-react";
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
const DEFAULT_PER_PAGE = 5;
const FAMILY_PER_PAGE = 6;
const ANN_PER_PAGE = 6;

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
];

/* ════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════ */
export default function Index({
    actes = [],
    familyMembers: rawFamilyMembers = [],
    conducteurs = {},
    annonces: rawAnnonces = [],
}) {
    /* ── acte array défensif ── */
    const localActes = Array.isArray(actes) ? actes : [];

    /* ── état actes ── */
    const [selectedActe, setSelectedActe] = useState(null);
    const [previewActe, setPreviewActe] = useState(null);
    const [page, setPage] = useState(1);
    const [contactConducteurs, setContact] = useState(null);
    const [memberPage, setMemberPage] = useState(1);

    /* ── état annonces ── */
    const [annonces, setAnnonces] = useState(rawAnnonces);
    const [showAnnonceModal, setShowAnnonceModal] = useState(false);
    const [selectedAnnonce, setSelectedAnnonce] = useState(null);
    const [annonceStep, setAnnonceStep] = useState(1);
    const [annonceProcessing, setAnnonceProcessing] = useState(false);
    const [annonceForm, setAnnonceForm] = useState({ titre: "", contenu: "" });
    const [annPage, setAnnPage] = useState(1);
    const [annFilter, setAnnFilter] = useState("tous"); // tous | en_cours | validees | refusees

    /* ── tabs principal ── */
    const [activeTab, setActiveTab] = useState("actes"); // actes | annonces

    /* ── toast ── */
    const [toast, setToast] = useState(null);

    /* Sync annonces with rawAnnonces when props change (page reload) */
    useEffect(() => {
        setAnnonces(rawAnnonces);
    }, [rawAnnonces]);

    /* ── computed ── */
    const familyMembers = Array.isArray(rawFamilyMembers)
        ? rawFamilyMembers
        : [];
    const total = localActes.length;
    const enCours = localActes.filter((a) =>
        IN_PROGRESS.includes(a.statut),
    ).length;
    const valides = localActes.filter((a) => VALID.includes(a.statut)).length;
    const familyName = guessFamilyName(familyMembers);
    const detailRows = useMemo(
        () => formatDetails(selectedActe?.details),
        [selectedActe],
    );
    const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PER_PAGE));
    const pagedActes = localActes.slice(
        (page - 1) * DEFAULT_PER_PAGE,
        page * DEFAULT_PER_PAGE,
    );
    const memberTotalPages = Math.max(
        1,
        Math.ceil(familyMembers.length / FAMILY_PER_PAGE),
    );
    const pagedMembers = familyMembers.slice(
        (memberPage - 1) * FAMILY_PER_PAGE,
        memberPage * FAMILY_PER_PAGE,
    );
    const annoncesEnCours = annonces.filter(
        (a) => !VALID.includes(a.statut),
    ).length;
    const selectedType = ANNONCE_TYPES.find(
        (t) => t.value === annonceForm.type_annonce,
    );

    /* ── computed annonces filtrées ── */
    const annFiltered = useMemo(() => {
        if (annFilter === "en_cours")
            return annonces.filter((a) => IN_PROGRESS.includes(a.statut));
        if (annFilter === "validees")
            return annonces.filter((a) => VALID.includes(a.statut));
        if (annFilter === "refusees")
            return annonces.filter((a) =>
                String(a.statut).startsWith("REFUSEE"),
            );
        return annonces;
    }, [annonces, annFilter]);
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
            total: annonces.length,
            enCours: annonces.filter((a) => IN_PROGRESS.includes(a.statut))
                .length,
            validees: annonces.filter((a) => VALID.includes(a.statut)).length,
            refusees: annonces.filter((a) =>
                String(a.statut).startsWith("REFUSEE"),
            ).length,
        }),
        [annonces],
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
                withBasePath("", "/membre-famille/flash-annonces"),
                annonceForm,
            );
            const newA = res.data?.annonce || {
                ...annonceForm,
                id: Date.now(),
                statut: "SOUMISE",
                created_at: new Date().toISOString(),
            };
            setAnnonces((prev) => [newA, ...prev]);
            closeAnnonce();
            notify("✅ Annonce soumise ! Elle sera publiée après validation par l'administrateur.");
        } catch (e) {
            notify(e?.response?.data?.message || "Une erreur est survenue.", "error");
        } finally {
            setAnnonceProcessing(false);
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
                        href={withBasePath("", "/membre-famille/dashboard")}
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
                        tag="Demandes de prière"
                        value={annStats.total}
                        label="Demandes de prière envoyées"
                        clickable
                        onClick={() => {
                            setActiveTab("annonces");
                            setAnnTab("mes");
                        }}
                    />
                </div>

                {/* ── TABS PRINCIPAL ── */}
                <div className="main-tabs">
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
                    {/* ★ ONGLET ANNONCES ★ */}
                    <button
                        className={`mtab mtab-ann ${activeTab === "annonces" ? "active" : ""}`}
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
                        Demandes de prière
                        {annoncesEnCours > 0 && (
                            <span className="tbadge tbadge-violet">
                                {annoncesEnCours}
                            </span>
                        )}
                    </button>
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
                                            "/membre-famille/liturgie/nouvelle",
                                        )}
                                        className="ph-link"
                                    >
                                        + Nouvelle
                                    </Link>
                                </div>
                                {localActes.length === 0 && (
                                    <div className="empty">
                                        Aucune demande pour le moment.
                                    </div>
                                )}
                                {pagedActes.map((acte) => {
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
                                    const refusBureauConducteur =
                                        histMap["REFUSEE_PAR_BUREAU_CONDUCTEUR"];
                                    const refusPasteur =
                                        histMap["REFUSEE_PAR_PASTEUR"];
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
                                        "TRANSMISE_AU_BUREAU_CONDUCTEUR",
                                    );
                                    const etapeBureauConducteur = getEtape(
                                        "TRANSMISE_AU_PASTEUR",
                                    );
                                    const etapePasteur = getEtape("VALIDEE");
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
                                                    className={`badge ${statusBadgeClass(acte.statut)}`}
                                                >
                                                    <span className="bdot" />
                                                    {statusLabel(acte.statut)}
                                                </span>
                                            </div>
                                            <div className="st-track">
                                                <StatusStep
                                                    label="Soumise"
                                                    done={
                                                        acte.statut !==
                                                        "SOUMISE"
                                                    }
                                                    active={
                                                        acte.statut ===
                                                        "SOUMISE"
                                                    }
                                                    date={datesSoumise}
                                                />
                                                <StatusStep
                                                    label="Conducteur"
                                                    done={
                                                        acte.statut ===
                                                            "TRANSMISE_AU_BUREAU_CONDUCTEUR" ||
                                                        acte.statut ===
                                                            "TRANSMISE_AU_PASTEUR" ||
                                                        acte.statut ===
                                                            "REFUSEE_PAR_CONDUCTEUR" ||
                                                        VALID.includes(
                                                            acte.statut,
                                                        )
                                                    }
                                                    active={
                                                        acte.statut ===
                                                        "EN_ATTENTE_CONDUCTEUR"
                                                    }
                                                    refused={
                                                        acte.statut ===
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
                                                    label="Bureau des Conducteurs"
                                                    done={
                                                        acte.statut ===
                                                            "TRANSMISE_AU_PASTEUR" ||
                                                        acte.statut ===
                                                            "REFUSEE_PAR_BUREAU_CONDUCTEUR" ||
                                                        VALID.includes(
                                                            acte.statut,
                                                        )
                                                    }
                                                    active={
                                                        acte.statut ===
                                                        "TRANSMISE_AU_BUREAU_CONDUCTEUR"
                                                    }
                                                    refused={
                                                        acte.statut ===
                                                        "REFUSEE_PAR_BUREAU_CONDUCTEUR"
                                                    }
                                                    date={
                                                        refusBureauConducteur
                                                            ? formatDateTime(
                                                                  refusBureauConducteur.created_at,
                                                              )
                                                            : etapeBureauConducteur?.date
                                                    }
                                                />
                                                <StatusStep
                                                    label="Pasteur"
                                                    done={
                                                        VALID.includes(
                                                            acte.statut,
                                                        ) ||
                                                        acte.statut ===
                                                            "REFUSEE_PAR_PASTEUR" ||
                                                        acte.statut ===
                                                            "VALIDEE"
                                                    }
                                                    active={
                                                        acte.statut ===
                                                        "TRANSMISE_AU_PASTEUR"
                                                    }
                                                    refused={
                                                        acte.statut ===
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
                                                {VALID.includes(acte.statut) && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn-pdf"
                                                            style={{ background: "#f0f4ff", color: "#3b5bdb", borderColor: "#c5d0fa" }}
                                                            onClick={() => setPreviewActe(acte)}
                                                        >
                                                            👁 Aperçu
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-pdf"
                                                            onClick={() =>
                                                                window.open(
                                                                    withBasePath(
                                                                        "",
                                                                        `/membre-famille/liturgie/${acte.id}/certificat`,
                                                                    ),
                                                                    "_blank",
                                                                )
                                                            }
                                                        >
                                                            <Download size={13} />{" "}
                                                            {isFicheType(acte.type_acte) ? "Fiche PDF" : "Certificat PDF"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                                <div className="pager">
                                    <button
                                        type="button"
                                        className="pager-btn"
                                        onClick={() => goTo(page - 1)}
                                        disabled={page === 1}
                                    >
                                        ‹ Précédent
                                    </button>
                                    <div style={{ display: "flex", gap: 4 }}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => goTo(p)}
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 6,
                                                    border: p === page ? "none" : "1px solid #D6D1C7",
                                                    background: p === page ? "#5C5748" : "#F5F4F0",
                                                    color: p === page ? "#fff" : "#5C5748",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="pager-info">
                                        {total} demande{total > 1 ? "s" : ""}
                                    </span>
                                    <button
                                        type="button"
                                        className="pager-btn"
                                        onClick={() => goTo(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Suivant ›
                                    </button>
                                </div>
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
                                        "/membre-famille/liturgie/nouvelle",
                                    )}
                                    className="btn-cta"
                                >
                                    + Nouvelle demande d'acte
                                </Link>
                            </section>
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
                        </aside>
                    </div>
                )}

                {/* ══════════ ★★★ TAB ANNONCES ★★★ ══════════ */}
                {activeTab === "annonces" && (
                    <div className="ann-tab-root">
                        {/* ── SOUS-TABS ── */}
                        <div className="ann-subtabs-bar">
                            <div className="ann-subtabs">
                                <button
                                    className="ann-stab active"
                                    onClick={() => setAnnPage(1)}
                                >
                                    Mes demandes de prière
                                    {annStats.total > 0 && (
                                        <span className="ann-stab-badge">
                                            {annStats.total}
                                        </span>
                                    )}
                                </button>
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
                                        onClick={() => {
                                            setAnnFilter(f.v);
                                            setAnnPage(1);
                                        }}
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
                                        + Nouvelle
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
                                                                withBasePath("", `/membre-famille/annonces/${ann.id}/fiche`),
                                                                "_blank",
                                                            );
                                                        }}
                                                    >
                                                        <Download size={11} />{" "}
                                                        Télécharger fiche
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
                                            Circuit de l'annonce
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

            {/* ══════════ MODAL : NOUVELLE ANNONCE 3 ÉTAPES ══════════ */}
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
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({ ...f, titre: e.target.value }))
                                            }
                                            maxLength={255}
                                        />
                                    </Field>
                                    <Field label="Contenu de l'annonce" required>
                                        <textarea
                                            className="ann-textarea"
                                            rows={5}
                                            placeholder="Décrivez votre annonce en détail..."
                                            value={annonceForm.contenu}
                                            onChange={(e) =>
                                                setAnnonceForm((f) => ({ ...f, contenu: e.target.value }))
                                            }
                                        />
                                        <div className="ann-chars">
                                            {annonceForm.contenu.length}/2000
                                        </div>
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
                            <button
                                type="button"
                                className="btn-mghost"
                                onClick={closeAnnonce}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="btn-msubmit"
                                disabled={annonceProcessing || !annonceForm.titre.trim() || !annonceForm.contenu.trim()}
                                onClick={submitAnnonce}
                            >
                                {annonceProcessing ? (
                                    <><svg width="13" height="13" className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Envoi...</>
                                ) : (
                                    <>📢 Soumettre l'annonce</>
                                )}
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
                                    value={statusLabel(selectedActe.statut)}
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
                                    value={getRequesterName(selectedActe)}
                                />
                                <InfoRow
                                    label="Créée le"
                                    value={formatDate(selectedActe.created_at)}
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

                            {/* PDF après validation pasteur */}
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
                                            withBasePath("", `/membre-famille/annonces/${selectedAnnonce.id}/fiche`),
                                            "_blank",
                                        )
                                    }
                                >
                                    <Download size={13} /> Télécharger la fiche
                                    PDF
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

            {/* ── MODAL APERÇU PDF ── */}
            {previewActe && (
                <div
                    className="modal-overlay"
                    onClick={() => setPreviewActe(null)}
                >
                    <div
                        className="modal modal-pdf-preview"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 900, width: "95vw" }}
                    >
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">Aperçu du document</div>
                                <div className="modal-sub">
                                    {prettyType(previewActe.type_acte)} —{" "}
                                    {previewActe.membre?.prenom} {previewActe.membre?.nom}
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
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div style={{ width: "100%", height: "70vh" }}>
                                <iframe
                                    title="Aperçu document"
                                    style={{ width: "100%", height: "100%", border: "none" }}
                                    src={withBasePath(
                                        "",
                                        `/membre-famille/liturgie/${previewActe.id}/certificat?preview=1`,
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
                                            `/membre-famille/liturgie/${previewActe.id}/certificat`,
                                        ),
                                        "_blank",
                                    )
                                }
                            >
                                <Download size={14} /> Télécharger
                            </button>
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

function AnnonceDotTrack({ statut, expanded }) {
    const steps = [
        { key: "SOUMISE",                       label: "Soumise",               icon: "📝" },
        { key: "EN_ATTENTE_CONDUCTEUR",          label: "Conducteur",            icon: "📋" },
        { key: "TRANSMISE_AU_BUREAU_CONDUCTEUR", label: "Bureau des Conducteurs", icon: "🏛" },
        { key: "TRANSMISE_AU_PASTEUR",           label: "Pasteur",               icon: "✝" },
    ];
    const isRefuse = String(statut).startsWith("REFUSEE");
    const isValidated = VALID.includes(statut);
    const activeIdx = isRefuse
        ? statut === "REFUSEE_PAR_CONDUCTEUR" ? 1
        : statut === "REFUSEE_PAR_BUREAU_CONDUCTEUR" ? 2
        : 3
        : statut === "EN_ATTENTE_CONDUCTEUR" ? 1
        : statut === "TRANSMISE_AU_BUREAU_CONDUCTEUR" ? 2
        : statut === "TRANSMISE_AU_PASTEUR" ? 3
        : isValidated ? 3
        : 0;

    return (
        <div className={`ann-track ${expanded ? "ann-track-exp" : ""}`}>
            {steps.map((s, i) => {
                const isDone = isValidated
                    ? i <= steps.length - 1
                    : !isRefuse && i < activeIdx;
                const isActive = !isValidated && i === activeIdx;
                const isRef = isRefuse && isActive;
                return (
                    <div key={s.key} className="ann-track-step">
                        <div
                            className={`ann-track-dot ${isDone ? "done" : isRef ? "refuse" : isActive ? "active" : ""}`}
                        >
                            {isDone ? "✓" : isRef ? "✕" : s.icon}
                        </div>
                        {expanded && (
                            <div
                                className={`ann-track-lbl ${isDone ? "done-lbl" : isRef ? "refuse-lbl" : isActive ? "active-lbl" : ""}`}
                            >
                                {s.label}
                            </div>
                        )}
                        {i < steps.length - 1 && (
                            <div
                                className={`ann-track-line ${isDone ? "done-line" : ""}`}
                            />
                        )}
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
    const icon = refused ? "✕" : done ? "✓" : active ? "…" : "·";
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
        priere: "Ex : Nous sollicitons les prières de la communauté pour la guérison de…",
        grace: "Ex : La famille Kouassi rend grâce à Dieu pour la naissance de…",
        deces: "Ex : La famille a la douleur de vous annoncer le rappel à Dieu de…",
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
        PUBLIEE: "Validée par le pasteur",
        ARCHIVEE: "Validée par le pasteur",
        CELEBRE: "Validée par le pasteur",
        TERMINE: "Validée par le pasteur",
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
        VALIDEE: "VALIDÉE PAR LE PASTEUR",
        PUBLIEE: "VALIDÉE PAR LE PASTEUR",
        CELEBRE: "VALIDÉE PAR LE PASTEUR",
        TERMINE: "VALIDÉE PAR LE PASTEUR",
        ARCHIVEE: "VALIDÉE PAR LE PASTEUR",
        REFUSEE_PAR_CONDUCTEUR: "REFUSÉE",
        REFUSEE_PAR_PASTEUR: "REFUSÉE",
    };
    return m[s] || s;
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
    return String(v);
}
function prettifyKey(k) {
    return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
.main-tabs{display:flex;gap:3px;background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.7);border-radius:11px;padding:4px;margin-bottom:20px;width:fit-content;backdrop-filter:blur(10px)}
.mtab{display:inline-flex;align-items:center;gap:7px;padding:9px 22px;border-radius:8px;font-size:13px;font-weight:600;color:#5C5748;background:none;border:none;cursor:pointer;transition:all .2s;white-space:nowrap}
.mtab:hover{background:rgba(255,255,255,.6);color:#1E1B16}.mtab.active{background:#fff;color:#1E1B16;box-shadow:0 1px 6px rgba(0,0,0,.1)}
.mtab-ann.active{color:#5B3FAF}
.tbadge{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:800}
.tbadge-terra{background:rgba(192,96,64,.12);color:#C06040}.tbadge-violet{background:rgba(91,63,175,.1);color:#5B3FAF}.tbadge-sage{background:rgba(74,124,94,.1);color:#4A7C5E}

/* ── grids ── */
.grid-main{display:grid;grid-template-columns:1fr 308px;gap:20px}

/* ── panels ── */
.panel{background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.74);border-radius:14px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,.16);margin-bottom:18px;backdrop-filter:blur(8px)}
.panel-head{padding:17px 22px;border-bottom:1px solid #E8E4DC;display:flex;justify-content:space-between;align-items:center}
.ph-title{font-size:16px;font-weight:700;display:flex;align-items:center}.ph-sub{font-size:11px;color:#9C9484}
.ph-link{font-size:12px;font-weight:700;color:#5B3FAF;text-decoration:none;background:rgba(91,63,175,.08);border:1px solid rgba(91,63,175,.18);border-radius:7px;padding:6px 12px;cursor:pointer}
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
.st-track{display:flex;align-items:center;background:#F5F4F0;border:1px solid #E8E4DC;border-radius:8px;padding:9px 14px}
.st-step{display:flex;align-items:flex-start;gap:6px;flex:1}.st-step:not(:last-child)::after{content:"→";color:#D6D1C7;font-size:11px;margin-left:5px;margin-top:2px}
.st-dot{width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;border:2px solid transparent;flex-shrink:0;margin-top:2px}
.st-dot.done{background:#4A7C5E;color:#fff}.st-dot.active{background:rgba(184,122,32,.08);color:#B87A20;border-color:#B87A20}.st-dot.wait{background:#EDEAE3;color:#9C9484;border-color:#D6D1C7}.st-dot.refused{background:#C06040;color:#fff}
.st-content{display:flex;flex-direction:column;gap:2px}
.st-label{font-size:10px;font-weight:700;color:#9C9484}.st-label.done{color:#4A7C5E}.st-label.active{color:#B87A20}.st-label.refused{color:#C06040}
.st-date{font-size:9px;color:#7E7A70;font-weight:600}
.st-date.st-waiting{color:#9C9484;font-style:italic}

/* ── timeline ── */
.acte-timeline{margin-top:10px;padding:0 2px;display:none}
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
.ann-track{display:flex;align-items:center;gap:0}
.ann-track-exp{gap:0}
.ann-track-step{display:flex;align-items:center;flex:1}
.ann-track-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #D6D1C7;background:#F5F4F0;color:#9C9484;flex-shrink:0;transition:all .3s}
.ann-track-dot.done{background:#4A7C5E;border-color:#4A7C5E;color:#fff}.ann-track-dot.active{background:rgba(184,122,32,.08);border-color:#B87A20;color:#B87A20;animation:activePulse 2s infinite}.ann-track-dot.refuse{background:#C06040;border-color:#C06040;color:#fff}
@keyframes activePulse{0%,100%{box-shadow:0 0 0 0 rgba(184,122,32,.3)}50%{box-shadow:0 0 0 5px rgba(184,122,32,0)}}
.ann-track-line{flex:1;height:2px;background:#E8E4DC;transition:background .3s}.ann-track-line.done-line{background:#4A7C5E;opacity:.4}
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
.ann-steps-bar{display:flex;padding:16px 24px;border-bottom:1px solid #E8E4DC;gap:0;}
.asb-step{flex:1;display:flex;align-items:center;gap:10px;font-size:12px;color:#9C9484;font-weight:600;position:relative}
.asb-step:not(:last-child)::after{content:"→";position:absolute;right:-8px;color:#D6D1C7;font-weight:500}
.asb-step.active{color:#5B3FAF}.asb-step.done{color:#4A7C5E}
.asb-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:#F5F4F0;border:2px solid #D6D1C7;color:#9C9484;flex-shrink:0}
.asb-step.active .asb-dot{background:rgba(91,63,175,.12);border-color:#5B3FAF;color:#5B3FAF}.asb-step.done .asb-dot{background:#4A7C5E;border-color:#4A7C5E;color:#fff}
.ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ann-type-btn{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:10px;border:2px solid #E8E4DC;background:#FAFAF7;cursor:pointer;transition:all .2s;text-align:left;position:relative}
.ann-type-btn:hover{border-color:#5B3FAF;background:rgba(91,63,175,.04)}.ann-type-btn.sel{border-color:#5B3FAF;background:rgba(91,63,175,.07);box-shadow:0 0 0 3px rgba(91,63,175,.12)}
.atb-emoji{font-size:28px;flex-shrink:0}.atb-label{font-size:13px;font-weight:700;color:#1E1B16;line-height:1.4;flex:1}
.atb-check{width:22px;height:22px;border-radius:50%;background:#5B3FAF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.ann-form{display:flex;flex-direction:column;gap:18px}
.ann-field{display:flex;flex-direction:column;gap:8px}.ann-label{font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#5C5748}.ann-req{color:#C06040}
.ann-input{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
.ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-textarea{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
.ann-chars{font-size:10.5px;color:#9C9484;text-align:right}
.ann-visibility{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(74,124,94,.06);border:1px solid rgba(74,124,94,.18);border-radius:8px;font-size:12px;color:#4A7C5E;font-weight:600}
.ann-recap{display:flex;flex-direction:column;gap:14px}
.ann-recap-type{display:flex;align-items:center;gap:16px;padding:18px;border-radius:10px;background:#F5F4F0;border:1.5px solid #E8E4DC}
.art-label{font-size:17px;font-weight:800}.art-sub{font-size:12px;color:#9C9484;margin-top:3px}
.ann-recap-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #E8E4DC;font-size:13px;gap:10px}
.arr-label{color:#9C9484;font-weight:600}.arr-value{color:#1E1B16;font-weight:700;text-align:right}
.ann-recap-msg{background:#F5F4F0;border-radius:8px;padding:14px;border:1px solid #E8E4DC}
.arm-label{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:8px}
.arm-text{font-size:13.5px;color:#1E1B16;line-height:1.7}
.ann-circuit-info{display:flex;align-items:center;gap:7px;font-size:12px;color:#9C9484;background:rgba(91,63,175,.05);border:1px solid rgba(91,63,175,.15);border-radius:8px;padding:10px 14px}
.ann-circuit-info strong{color:#5B3FAF}

/* MODAL DÉTAIL ANNONCE */
.ann-detail-modal{max-width:520px}
.ann-detail-preview{background:rgba(91,63,175,.04);border:1px solid rgba(91,63,175,.12);border-radius:10px;padding:12px 16px;margin-bottom:4px}
.ann-detail-progress-label{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:8px}
.ann-detail-msg{background:#F5F4F0;border:1px solid #E8E4DC;border-left:3px solid #5B3FAF;border-radius:8px;padding:14px;font-size:13.5px;color:#1E1B16;line-height:1.7}
.ann-detail-refus{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 14px;background:rgba(192,96,64,.05);border:1px solid rgba(192,96,64,.18);border-left:3px solid #C06040;border-radius:8px;font-size:12.5px;color:#C06040;font-weight:600;line-height:1.5}

/* ── MODAL SHARED ── */
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:120;backdrop-filter:blur(6px)}
.modal{width:100%;max-width:760px;max-height:90vh;overflow:auto;background:#fff;border:1px solid #E8E4DC;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.3);animation:mIn .28s cubic-bezier(.34,1.56,.64,1) both}
@keyframes mIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-head{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 22px;border-bottom:1px solid #E8E4DC}
.modal-title{font-size:19px;font-weight:800;color:#1E1B16}.modal-sub{font-size:13px;color:#9C9484;margin-top:4px}
.modal-close{width:30px;height:30px;border-radius:7px;border:1px solid #D6D1C7;background:#F5F4F0;color:#5C5748;cursor:pointer;font-size:18px;line-height:1}
.modal-body{padding:24px 22px}.modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #E8E4DC;background:#FBFAF8}
.btn-mghost{padding:10px 20px;border-radius:8px;background:#F5F4F0;border:1px solid #D6D1C7;color:#5C5748;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-mghost:hover{background:#EBE6DE;border-color:#C0B8AD}
.btn-mnext{padding:10px 24px;border-radius:8px;background:#5B3FAF;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-mnext:disabled{opacity:.4;cursor:not-allowed}.btn-mnext:hover:not(:disabled){background:#4C34A0;transform:translateY(-1px);box-shadow:0 4px 12px rgba(91,63,175,.2)}
.btn-msubmit{display:inline-flex;align-items:center;gap:8px;padding:11px 26px;border-radius:8px;background:linear-gradient(90deg,#7C3AED,#4F46E5);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(124,58,237,.3);transition:all .2s}
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
@media(max-width:768px){.rf-wrap{padding:16px}.welcome{flex-direction:column;align-items:flex-start}.rf-actions{flex-wrap:wrap}.kpi-row{grid-template-columns:1fr 1fr}.main-tabs{width:100%;overflow-x:auto}.ann-type-grid{grid-template-columns:1fr}.paroisse-grid{grid-template-columns:1fr}.ann-subtabs-bar{flex-direction:column;align-items:flex-start}.ann-hero{flex-direction:column;align-items:flex-start}.ann-hero-right{flex-direction:column;align-items:flex-start}}
@media(max-width:480px){.kpi-row{grid-template-columns:1fr}}
`;
