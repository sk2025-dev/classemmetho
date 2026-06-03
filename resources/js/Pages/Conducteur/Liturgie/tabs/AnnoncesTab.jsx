import React from "react";

export default function AnnoncesTab({
    annoncesSubTab,
    setAnnoncesSubTab,
    annDisplay,
    pagedAnn,
    annEnAttente,
    annTraitees,
    annMines,
    annTotalPages,
    annoncesPage,
    setAnnoncesPage,
    annSelectedIds,
    allAnnSel,
    annonceProcessing,
    localAnnonces,
    toggleAnnSel,
    toggleAllAnnPage,
    approveAnnonces,
    refuseAnnonces,
    openAnnonceModal,
    ANNONCE_TYPES,
    prettyStatut,
    formatDate,
}) {
    return (
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
                                    Mes demandes de prière
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
                                Nouvelle demande de prière
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
                                        ? "Aucune demande de prière en attente"
                                        : annoncesSubTab ===
                                            "done"
                                          ? "Aucune demande de prière traitée"
                                          : "Vous n'avez créé aucune demande de prière"}
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
    );
}
