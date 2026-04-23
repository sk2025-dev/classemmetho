import React from "react";

export default function TransmisesTab({ transmises, openModal, prettyType, formatDate, tone, iconEmoji }) {
    return (
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
                        Actes liturgiques transmis — en attente de validation finale
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
    );
}
