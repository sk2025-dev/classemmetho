import React from "react";
import { withBasePath } from "../../../../Utils/urlHelper";

const STATUTS_APRES_PASTEUR = ["VALIDEE", "PUBLIEE", "ARCHIVEE", "CELEBRE", "TERMINE"];
const STATUTS_APRES_CEREMONIE = ["CELEBRE", "TERMINE"];

function BoutonTelechargement({ acte }) {
    const type = String(acte.type_acte || "").toLowerCase();

    if (type === "bapteme") {
        const actif = STATUTS_APRES_PASTEUR.includes(acte.statut);
        return (
            <button
                className="btn-small btn-fiche"
                disabled={!actif}
                title={actif ? "Télécharger le certificat" : "Disponible après validation du pasteur"}
                style={{
                    marginLeft: 8,
                    background: actif ? "#dbeafe" : "#f1f5f9",
                    color: actif ? "#1d4ed8" : "#94a3b8",
                    border: `1px solid ${actif ? "#93c5fd" : "#cbd5e1"}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 12,
                    cursor: actif ? "pointer" : "not-allowed",
                    opacity: actif ? 1 : 0.6,
                }}
                onClick={actif ? () => window.open(withBasePath("", `/conducteur/liturgie/${acte.id}/certificat`), "_blank") : undefined}
            >
                🏅 Certificat de baptême
            </button>
        );
    }

    if (type === "mariage") {
        const actif = STATUTS_APRES_CEREMONIE.includes(acte.statut);
        return (
            <button
                className="btn-small btn-fiche"
                disabled={!actif}
                title={actif ? "Télécharger le certificat" : "Disponible après validation finale (cérémonie célébrée)"}
                style={{
                    marginLeft: 8,
                    background: actif ? "#fce7f3" : "#f1f5f9",
                    color: actif ? "#9d174d" : "#94a3b8",
                    border: `1px solid ${actif ? "#f9a8d4" : "#cbd5e1"}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 12,
                    cursor: actif ? "pointer" : "not-allowed",
                    opacity: actif ? 1 : 0.6,
                }}
                onClick={actif ? () => window.open(withBasePath("", `/conducteur/liturgie/${acte.id}/certificat`), "_blank") : undefined}
            >
                💍 Certificat de mariage
            </button>
        );
    }

    // naissance, décès et autres → fiche PDF simple
    if ([...STATUTS_APRES_PASTEUR, "TRANSMISE_AU_PASTEUR"].includes(acte.statut)) {
        return (
            <button
                className="btn-small btn-fiche"
                style={{
                    marginLeft: 8,
                    background: "#e0e7ff",
                    color: "#3730a3",
                    border: "1px solid #a5b4fc",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 12,
                    cursor: "pointer",
                }}
                onClick={() => window.open(withBasePath("", `/conducteur/liturgie/${acte.id}/fiche?preview=1`), "_blank")}
            >
                📄 Télécharger la fiche
            </button>
        );
    }

    return null;
}

export default function MesDemandesTab({
    localActes,
    openModal,
    prettyType,
    formatDate,
    formatDateTime,
    tone,
    iconEmoji,
    normalizePhotoUrl,
    getActeBadgeClass,
    getActeStatus,
    prettyStatut,
}) {
    const myActes = localActes.filter((a) => a.demandeur_is_conducteur);

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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                            />
                        </svg>
                        Mes demandes d'acte
                    </div>
                    <div className="panel-subtitle">
                        Retrouvez ici toutes vos demandes d'acte, leur statut, les fiches PDF après validation, et les détails.
                    </div>
                </div>
            </div>
            <div className="panel-body">
                {myActes.length === 0 && (
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
                        <span>Aucune demande d'acte trouvée.</span>
                    </div>
                )}
                {myActes.map((acte) => (
                    <div key={acte.id} className="demande-item">
                        <div className={`demande-acte-icon ${tone(acte.type_acte)}`}>
                            {normalizePhotoUrl(acte.membre?.profile_photo_url) ? (
                                <img
                                    src={normalizePhotoUrl(acte.membre?.profile_photo_url)}
                                    alt={acte.membre?.prenom + " " + acte.membre?.nom}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                />
                            ) : (
                                <span>{iconEmoji(acte.type_acte)}</span>
                            )}
                        </div>
                        <div className="demande-info">
                            <div className="demande-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {acte.membre?.prenom} {acte.membre?.nom}
                            </div>
                            <div className="demande-type">
                                {prettyType(acte.type_acte)} · Soumis le {formatDate(acte.created_at)}
                            </div>
                        </div>
                        <div className="demande-meta">
                            <span className={`badge ${getActeBadgeClass(getActeStatus(acte))}`}>
                                <span className="badge-dot" />
                                {prettyStatut(getActeStatus(acte))}
                            </span>
                            <div className="item-actions">
                                <button
                                    className="btn-small btn-view"
                                    onClick={() => openModal("detail", acte)}
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
                                <BoutonTelechargement acte={acte} />
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                Pour : <strong>{acte.membre?.prenom} {acte.membre?.nom}</strong>
                                {acte.date_souhaitee && (
                                    <> · Soumis le : {formatDateTime(acte.created_at)}{acte.updated_at && <> · Pasteur : {formatDateTime(acte.updated_at)}</>}</>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
