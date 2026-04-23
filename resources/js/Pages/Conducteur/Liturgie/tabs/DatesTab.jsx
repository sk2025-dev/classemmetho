import React, { useState } from "react";

export default function DatesTab({
    ceremonyActs,
    ceremonyHistoryRows,
    selectedCeremonyIds,
    allCeremonySelected,
    processing,
    toggleSelectAllCeremony,
    clearCeremonySelection,
    approveSelectedCeremony,
    toggleCeremonySelect,
    openModal,
    formatDate,
    formatDateTime,
    ceremonyStatusLabel,
}) {
    // Pagination pour l'historique
    const ROWS_PER_PAGE = 10;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(ceremonyHistoryRows.length / ROWS_PER_PAGE));
    const pagedRows = ceremonyHistoryRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

    return (
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
                                                    {/* Membre concerné */}
                                                    {acte.membre?.prenom} {acte.membre?.nom}
                                                </div>
                                                <div className="date-card-ref">
                                                    {acte.reference || "Référence indisponible"}
                                                </div>
                                            </div>
                                            {/* Classe du membre */}
                                            <div className="date-card-field">
                                                <span className="date-card-label">Classe</span>
                                                <span className="date-card-value">{acte.classe?.nom || "—"}</span>
                                            </div>
                                            {/* Nom du conjoint */}
                                            <div className="date-card-field">
                                                <span className="date-card-label">Conjoint(e)</span>
                                                <span className="date-card-value">
                                                    {
                                                        [
                                                            acte.details?.conjoint_prenom,
                                                            acte.details?.conjoint_nom
                                                        ].filter(Boolean).join(" ") ||
                                                        [
                                                            acte.details?.epoux_prenom,
                                                            acte.details?.epoux_nom
                                                        ].filter(Boolean).join(" ") ||
                                                        [
                                                            acte.details?.conjoint_1,
                                                            acte.details?.conjoint_2
                                                        ].filter(Boolean).join(" ") ||
                                                        "—"
                                                    }
                                                </span>
                                            </div>
                                            {/* Lieu du mariage */}
                                            <div className="date-card-field">
                                                <span className="date-card-label">Lieu du mariage</span>
                                                <span className="date-card-value">{acte.details?.lieu_ceremonie || acte.details?.lieu || "—"}</span>
                                            </div>
                                            {/* Statut de la cérémonie */}
                                            <span
                                                className={`badge ${
                                                    statut &&
                                                    statut.includes("REFUSEE")
                                                        ? "badge-refuse"
                                                        : "badge-valide"
                                                }`}
                                            >
                                                <span className="badge-dot" />
                                                {ceremonyStatusLabel(statut)}
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
                        <>
                            <div className="table-scroll date-history-table-scroll">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>N</th>
                                            <th>Référence</th>
                                            <th>Membre concerné</th>
                                            <th>Classe</th>
                                            <th>Fiancé / fiancée</th>
                                            <th>Témoin(s)</th>
                                            <th>Date choisie</th>
                                            <th>Transmise le</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedRows.map((row, idx) => (
                                            <tr key={row.rowKey}>
                                                <td>{(page - 1) * ROWS_PER_PAGE + idx + 1}</td>
                                                <td>{row.reference}</td>
                                                <td>{row.memberName}</td>
                                                <td>{row.classeName}</td>
                                                <td>{row.fianceName}</td>
                                                <td>{row.witnesses}</td>
                                                <td>{formatDate(row.dateChosen)}</td>
                                                <td>{formatDateTime(row.conducteurValidatedAt)}</td>
                                                <td>{ceremonyStatusLabel(row.ceremonyStatut)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
                                    <button
                                        type="button"
                                        className="pager-btn"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Précédent
                                    </button>
                                    <span style={{ fontWeight: 500 }}>
                                        Page {page} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="pager-btn"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Suivant
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}