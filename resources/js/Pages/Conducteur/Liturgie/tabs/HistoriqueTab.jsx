import React, { useMemo, useState } from "react";

const PER_PAGE = 10;

export default function HistoriqueTab({
    historique,
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
    const [search, setSearch]           = useState("");
    const [filterType, setFilterType]   = useState("");
    const [filterStatut, setFilterStatut] = useState("");
    const [page, setPage]               = useState(1);

    // Types uniques disponibles dans l'historique
    const uniqueTypes = useMemo(() => {
        const types = [...new Set(historique.map((a) => a.type_acte).filter(Boolean))];
        return types.sort();
    }, [historique]);

    // Statuts uniques disponibles
    const uniqueStatuts = useMemo(() => {
        const statuts = [...new Set(historique.map((a) => a.statut).filter(Boolean))];
        return statuts.sort();
    }, [historique]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return historique.filter((a) => {
            const nom = `${a.membre?.prenom ?? ""} ${a.membre?.nom ?? ""}`.toLowerCase();
            const bySearch  = !q || nom.includes(q);
            const byType    = !filterType   || a.type_acte === filterType;
            const byStatut  = !filterStatut || a.statut    === filterStatut;
            return bySearch && byType && byStatut;
        });
    }, [historique, search, filterType, filterStatut]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage   = Math.min(page, totalPages);
    const paged      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const resetPage  = () => setPage(1);

    const inputStyle = {
        height: 34,
        border: "1px solid #e0e0ec",
        borderRadius: 7,
        padding: "0 10px",
        fontSize: 12,
        outline: "none",
        background: "#fafafa",
        color: "#1a1a2e",
    };

    return (
        <div className="grid-2">
            {/* ── JOURNAL DES ACTES ── */}
            <div className="panel">
                <div className="panel-head">
                    <div className="panel-title">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Journal des actes
                    </div>
                    <span style={{ fontSize: 11, color: "#aaa" }}>
                        {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Barre de recherche + filtres */}
                <div style={{ padding: "10px 14px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* Recherche par nom */}
                    <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
                        <svg
                            width="13" height="13" fill="none" viewBox="0 0 24 24"
                            stroke="#aaa" strokeWidth="2"
                            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher un membre…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                            style={{ ...inputStyle, paddingLeft: 26, width: "100%", boxSizing: "border-box" }}
                        />
                    </div>

                    {/* Filtre type */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); resetPage(); }}
                        style={{ ...inputStyle, flex: "0 1 140px", cursor: "pointer" }}
                    >
                        <option value="">Tous les types</option>
                        {uniqueTypes.map((t) => (
                            <option key={t} value={t}>{prettyType(t)}</option>
                        ))}
                    </select>

                    {/* Filtre statut */}
                    <select
                        value={filterStatut}
                        onChange={(e) => { setFilterStatut(e.target.value); resetPage(); }}
                        style={{ ...inputStyle, flex: "0 1 140px", cursor: "pointer" }}
                    >
                        <option value="">Tous les statuts</option>
                        {uniqueStatuts.map((s) => (
                            <option key={s} value={s}>{prettyStatut(s)}</option>
                        ))}
                    </select>

                    {/* Réinitialiser */}
                    {(search || filterType || filterStatut) && (
                        <button
                            type="button"
                            onClick={() => { setSearch(""); setFilterType(""); setFilterStatut(""); resetPage(); }}
                            style={{
                                height: 34,
                                border: "1px solid #e0e0ec",
                                borderRadius: 7,
                                padding: "0 10px",
                                fontSize: 11,
                                background: "#fff",
                                color: "#e24b4a",
                                cursor: "pointer",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                            }}
                        >
                            ✕ Réinitialiser
                        </button>
                    )}
                </div>

                <div className="panel-body">
                    {paged.length === 0 ? (
                        <div className="empty-state">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Aucun résultat trouvé</span>
                        </div>
                    ) : (
                        paged.map((acte) => (
                            <div key={acte.id} className="timeline-item">
                                <div className={`timeline-dot ${dot(getActeStatus(acte))}`} />
                                <div className="timeline-content">
                                    <div className="timeline-action">
                                        {prettyType(acte.type_acte)}{" "}
                                        — {acte.membre?.prenom}{" "}
                                        {acte.membre?.nom}
                                    </div>
                                    <div className="timeline-detail">
                                        {prettyStatut(getActeStatus(acte))}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 140 }}>
                                    <div className="timeline-time">
                                        {formatDate(acte.updated_at || acte.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Pagination locale */}
                    {totalPages > 1 && (
                        <div className="pager">
                            <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                            >
                                Précédent
                            </button>
                            <div className="pager-info">
                                Page {safePage}/{totalPages}
                            </div>
                            <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── ACTES RÉCENTS VALIDÉS ── */}
            <div className="panel">
                <div className="panel-head">
                    <div className="panel-title">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Actes récents validés
                    </div>
                </div>
                <div className="panel-body">
                    {historique
                        .filter((a) => ["VALIDEE", "PUBLIEE", "ARCHIVEE"].includes(a.statut))
                        .slice(0, 6)
                        .map((acte) => (
                            <div key={acte.id} className="demande-item">
                                <div className={`demande-acte-icon ${tone(acte.type_acte)}`}>
                                    {normalizePhotoUrl(acte.membre?.profile_photo_url) ? (
                                        <img
                                            src={normalizePhotoUrl(acte.membre?.profile_photo_url)}
                                            alt={`${acte.membre?.prenom} ${acte.membre?.nom}`}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                        />
                                    ) : (
                                        <span>{iconEmoji(acte.type_acte)}</span>
                                    )}
                                </div>
                                <div className="demande-info" onClick={() => openModal("detail", acte)}>
                                    <div className="demande-name">
                                        {acte.membre?.prenom} {acte.membre?.nom}
                                    </div>
                                    <div className="demande-type">
                                        {prettyType(acte.type_acte)} · {formatDate(acte.updated_at || acte.created_at)}
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
