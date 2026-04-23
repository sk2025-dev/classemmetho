import React from "react";

export default function HistoriqueTab({
    historique,
    pagedHistorique,
    historiquePage,
    historiqueTotalPages,
    setHistoriquePage,
    openModal,
    prettyType,
    prettyStatut,
    formatDate,
    tone,
    iconEmoji,
    normalizePhotoUrl,
    getActeStatus,
    dot,
}) {
    return (
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
                                        null
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
    );
}
