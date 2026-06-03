import React, { useState } from "react";

const BADGE_CONFIG = {
    bapteme:            { label: 'Baptême',               emoji: '💧', bg: '#dbeafe', color: '#1d4ed8' },
    mariage:            { label: 'Mariage',               emoji: '💍', bg: '#fce7f3', color: '#be185d' },
    deces:              { label: 'Décès',                 emoji: '🕯️', bg: '#f1f5f9', color: '#475569' },
    naissance:          { label: 'Naissance',             emoji: '👶', bg: '#dcfce7', color: '#15803d' },
    premiere_communion: { label: '1re Communion',         emoji: '🍞', bg: '#fef3c7', color: '#b45309' },
    confirmation:       { label: 'Confirmation',          emoji: '✝️', bg: '#ede9fe', color: '#6d28d9' },
    grace:              { label: 'Action de grâce',       emoji: '🙌', bg: '#fef3c7', color: '#d97706' },
    priere:             { label: "Prière d'intercession", emoji: '🙏', bg: '#ede9fe', color: '#7c3aed' },
};

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
    annEnAttente = [],
    approveAnnonces,
    refuseAnnonces,
    openAnnonceModal,
    ANNONCE_TYPES = [],
}) {
    const [selectedAnnIds, setSelectedAnnIds] = useState(new Set());

    const toggleAnn = (id) => setSelectedAnnIds(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    const handleSelectAll = () => {
        toggleSelectAllPage();
        setSelectedAnnIds(new Set(annEnAttente.map(a => a.id)));
    };

    const handleDeselectAll = () => {
        toggleSelectAllPage();
        setSelectedAnnIds(new Set());
    };

    const allSelected = allPageSelected && selectedAnnIds.size === annEnAttente.length;

    const handleApprove = () => {
        if (selectedIds.size > 0) approveSelected();
        if (selectedAnnIds.size > 0) approveAnnonces([...selectedAnnIds]);
        setSelectedAnnIds(new Set());
    };

    const handleRefuse = () => {
        if (selectedIds.size > 0) refuseSelected();
        if (selectedAnnIds.size > 0) refuseAnnonces([...selectedAnnIds]);
        setSelectedAnnIds(new Set());
    };

    const nothingSelected = selectedIds.size === 0 && selectedAnnIds.size === 0;

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
                            {soumises.length + annEnAttente.length}
                        </span>
                        <button
                            type="button"
                            className="btn-bulk"
                            onClick={allSelected ? handleDeselectAll : handleSelectAll}
                            disabled={soumises.length === 0 && annEnAttente.length === 0}
                        >
                            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                        </button>
                        <button
                            type="button"
                            className="btn-bulk"
                            onClick={handleApprove}
                            disabled={processing || nothingSelected}
                        >
                            Approuver
                        </button>
                        <button
                            type="button"
                            className="btn-bulk btn-bulk-refuse"
                            onClick={handleRefuse}
                            disabled={processing || nothingSelected}
                        >
                            Refuser
                        </button>
                    </div>
                </div>
                <div className="panel-body">
                    {soumises.length === 0 && annEnAttente.length === 0 && (
                        <div className="empty-state">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Aucune demande en attente</span>
                        </div>
                    )}
                    {pagedSoumises.map((acte, i) => {
                        const b = BADGE_CONFIG[acte.type_acte] || { label: acte.type_acte, emoji: '📋', bg: '#f3f4f6', color: '#374151' };
                        return (
                        <div
                            key={acte.id}
                            className={`demande-item ${i === 0 ? "urgent" : ""}`}
                        >
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background: b.bg, color: b.color, fontSize:11, fontWeight:700, marginBottom:6 }}>
                                {b.emoji} {b.label}
                            </span>
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
                        );
                    })}
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
                    {annEnAttente.length > 0 && (
                        <>
                            <div style={{ padding: '12px 20px 4px', borderTop: '1px solid #f0f0f8', marginTop: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    🙏 Demandes de prière à traiter
                                </span>
                            </div>
                            {annEnAttente.map((ann) => {
                                const t = ANNONCE_TYPES.find(x => x.value === (ann.type_annonce || ann.type_acte));
                                const b = BADGE_CONFIG[ann.type_annonce || ann.type_acte] || { label: t?.label || ann.type_annonce, emoji: t?.emoji || '🙏', bg: '#ede9fe', color: '#7c3aed' };
                                const msg = ann.details?.contenu || ann.message || '';
                                const member = ann.membre ? `${ann.membre.prenom} ${ann.membre.nom}` : (ann.createur ? `${ann.createur.prenom} ${ann.createur.nom}` : '—');
                                return (
                                    <div key={`ann-${ann.id}`} className="demande-item" onClick={() => openAnnonceModal('detail', ann)}>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background: b.bg, color: b.color, fontSize:11, fontWeight:700, marginBottom:6 }}>
                                            {b.emoji} {b.label}
                                        </span>
                                        <div style={{ display:'flex', alignItems:'flex-start', gap:10, width:'100%' }}>
                                            <label className="bulk-check" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedAnnIds.has(ann.id)} onChange={() => toggleAnn(ann.id)} />
                                            </label>
                                            <div className={`demande-acte-icon`} style={{ background: b.bg, color: b.color, fontSize:18, flexShrink:0 }}>{b.emoji}</div>
                                            <div className="demande-info" style={{ flex:1 }}>
                                                <div className="demande-name">{member}</div>
                                                <div className="demande-type">{msg.slice(0, 100)}{msg.length > 100 ? '…' : ''}</div>
                                                <div className="demande-type" style={{ marginTop:2 }}>Soumis le {ann.created_at ? ann.created_at.slice(0,10) : '—'}</div>
                                            </div>
                                            <div className="demande-meta">
                                                <span className="badge badge-soumise"><span className="badge-dot" />SOUMISE</span>
                                                <div className="item-actions" onClick={e => e.stopPropagation()}>
                                                    <button className="btn-small btn-approve" onClick={() => approveAnnonces([ann.id])}>
                                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        Transmettre
                                                    </button>
                                                    <button className="btn-small btn-refuse" onClick={() => refuseAnnonces([ann.id])}>
                                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Refuser
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
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
