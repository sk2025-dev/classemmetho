import React from "react";

export default function SoumisesTab({
    soumises,
    pagedSoumises,
    soumisesPage,
    soumisesTotalPages,
    selectedIds,
    allPageSelected,
    processing,
    setSoumisesPage,
    toggleSelectAllPage,
    approveSelected,
    refuseSelected,
    toggleSelected,
    openModal,
    openFicheModalForActe,
    hasCeremonyChoice,
    prettyType,
    formatDate,
    tone,
    iconEmoji,
    normalizePhotoUrl,
}) {
    return (
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
                            À valider
                        </div>
                        <div className="panel-subtitle">
                            Demandes des responsables de famille en attente de votre validation
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
    );
}
