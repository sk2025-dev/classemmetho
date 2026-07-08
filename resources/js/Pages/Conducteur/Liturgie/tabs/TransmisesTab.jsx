import React, { useState } from "react";

const BADGE_CONFIG = {
    grace:  { label: 'Action de grâce',       emoji: '🙌', bg: '#fef3c7', color: '#d97706' },
    priere: { label: "Prière d'intercession", emoji: '🙏', bg: '#ede9fe', color: '#7c3aed' },
};

const MOTIFS_GRACE = [
    { value: "guerison",        label: "Guérison" },
    { value: "deuil",           label: "Deuil" },
    { value: "mariage",         label: "Bénédiction de Mariage" },
    { value: "autres_bienfaits",label: "Autre(s) bienfait(s)" },
];
const MOTIFS_INTERCESSION = [
    { value: "soutien_assistance", label: "Soutien et assistance" },
    { value: "maladie",            label: "Maladie" },
    { value: "autre_probleme",     label: "Autre(s) problème(s)" },
];

function formatDT(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
        + ' à ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function Row({ label, value }) {
    if (!value && value !== false) return null;
    return (
        <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ color:'#64748b', minWidth:130, flexShrink:0, fontSize:12 }}>{label}</span>
            <span style={{ fontWeight:600, color:'#1e2070', fontSize:13 }}>{value}</span>
        </div>
    );
}

function MiniDetail({ item, isAnn, onClose, ANNONCE_TYPES }) {
    const typeKey = item.type_annonce || item.type_acte;
    const b = isAnn ? (BADGE_CONFIG[typeKey] || { label: typeKey, emoji:'🙏', bg:'#ede9fe', color:'#7c3aed' }) : null;
    const submitter = item.createur
        ? `${item.createur.prenom} ${item.createur.nom}${item.createur.role ? ' · ' + item.createur.role : ''}`
        : item.membre
            ? `${item.membre.prenom} ${item.membre.nom}`
            : '—';

    // Motif label
    const motifVal = item.details?.motif;
    const motifLabel = motifVal
        ? ([...MOTIFS_GRACE, ...MOTIFS_INTERCESSION].find(m => m.value === motifVal)?.label || motifVal)
        : null;

    const dateSouhaitee = item.date_souhaitee || item.details?.date_annonce;
    const heureCulte   = item.details?.heure_culte;
    const temoignage   = item.details?.temoignage_public;
    const contenu      = item.details?.contenu || item.message;
    const ficheUrl     = isAnn && item.statut === 'PUBLIEE' && item.id
        ? `/responsable-famille/annonces/${item.id}/fiche` : null;

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
            <div style={{ background:'#fff', borderRadius:16, padding:28, minWidth:360, maxWidth:480, boxShadow:'0 8px 40px rgba(0,0,0,0.2)', width:'90%' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {isAnn && b && (
                            <span style={{ background:b.bg, color:b.color, borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
                                {b.emoji} {b.label}
                            </span>
                        )}
                        {!isAnn && (
                            <span style={{ background:'#e0e7ff', color:'#3730a3', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
                                📋 Détails de la demande
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8', lineHeight:1 }}>×</button>
                </div>

                {/* Rows */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <Row label="Soumis par" value={submitter} />
                    {item.membre && (
                        <Row label="Membre concerné" value={`${item.membre.prenom} ${item.membre.nom}`} />
                    )}
                    <Row label="Date de soumission" value={formatDT(item.created_at)} />

                    {/* ── MARIAGE ── */}
                    {!isAnn && item.type_acte === 'mariage' && (<>
                        {(item.details?.epoux_prenom || item.details?.epoux_nom) && (
                            <Row label="Conjoint(e)" value={`${item.details.epoux_prenom || ''} ${item.details.epoux_nom || ''}`.trim()} />
                        )}
                        {item.details?.epoux_nat && (
                            <Row label="Nationalité" value={item.details.epoux_nat} />
                        )}
                        {item.details?.epoux_date_naissance && (
                            <Row label="Date de naissance" value={new Date(item.details.epoux_date_naissance).toLocaleDateString('fr-FR')} />
                        )}
                        {item.details?.epoux_eglise && (
                            <Row label="Église du conjoint" value={item.details.epoux_eglise} />
                        )}
                    </>)}

                    {/* ── BAPTÊME ── */}
                    {!isAnn && item.type_acte === 'bapteme' && (<>
                        {item.details?.personne && (
                            <Row label="Personne à baptiser" value={item.details.personne} />
                        )}
                        {item.details?.date_naissance && (
                            <Row label="Date de naissance" value={new Date(item.details.date_naissance).toLocaleDateString('fr-FR')} />
                        )}
                        {item.details?.deja_baptise && (
                            <Row label="Déjà baptisé(e)" value={item.details.deja_baptise} />
                        )}
                        {item.details?.observations && (
                            <Row label="Observations" value={item.details.observations} />
                        )}
                    </>)}

                    {isAnn && motifLabel && (
                        <Row label="Motif" value={motifLabel} />
                    )}
                    {isAnn && dateSouhaitee && (
                        <Row label="Date souhaitée" value={new Date(dateSouhaitee).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })} />
                    )}
                    {isAnn && heureCulte && (
                        <Row label="Heure du culte" value={heureCulte} />
                    )}
                    {isAnn && temoignage !== undefined && temoignage !== null && (
                        <Row label="Témoignage public" value={temoignage ? '✅ Oui' : '❌ Non'} />
                    )}

                    {isAnn && contenu && (
                        <div style={{ marginTop:4 }}>
                            <div style={{ fontSize:11, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Contenu</div>
                            <div style={{ background:'#f8faff', border:'1px solid #e0e7ff', borderRadius:10, padding:'12px 16px', color:'#374151', lineHeight:1.7, fontSize:13 }}>
                                {contenu}
                            </div>
                        </div>
                    )}
                </div>

                {ficheUrl && (
                    <a href={ficheUrl} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:20, background:'linear-gradient(135deg,#7c3aed,#5b21b6)', color:'#fff', borderRadius:10, padding:'10px 20px', textDecoration:'none', fontWeight:700, fontSize:13 }}>
                        👁 Voir la fiche
                    </a>
                )}
            </div>
        </div>
    );
}

export default function TransmisesTab({ transmises, annTransmises = [], openModal, prettyType, formatDate, tone, iconEmoji, ANNONCE_TYPES = [] }) {
    const total = transmises.length + annTransmises.length;
    const [detail, setDetail] = useState(null); // { item, isAnn }
    return (
        <>
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
                        Transmises au Bureau des Conducteurs
                    </div>
                    <div className="panel-subtitle">
                        Actes liturgiques transmis — en attente de validation du Bureau
                    </div>
                </div>
                <span className="panel-count-badge panel-count-gold">
                    {total}
                </span>
            </div>
            <div className="panel-body">
                {total === 0 && (
                    <div className="empty-state">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Aucune demande transmise au Bureau des Conducteurs</span>
                    </div>
                )}
                {transmises.map((acte) => {
                    const b = BADGE_CONFIG[acte.type_acte] || null;
                    return (
                    <div key={acte.id} className="demande-item" onClick={() => openModal("detail", acte)}>
                        {b && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background: b.bg, color: b.color, fontSize:11, fontWeight:700, marginBottom:6 }}>
                                {b.emoji} {b.label}
                            </span>
                        )}
                        <div className={`demande-acte-icon ${tone(acte.type_acte)}`}>
                            {acte.membre?.profile_photo_url ? (
                                <img src={acte.membre.profile_photo_url} alt={`${acte.membre?.prenom} ${acte.membre?.nom}`} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                            ) : (
                                <span>{iconEmoji(acte.type_acte)}</span>
                            )}
                        </div>
                        <div className="demande-info">
                            <div className="demande-name">{acte.membre?.prenom} {acte.membre?.nom}</div>
                            <div className="demande-type">{prettyType(acte.type_acte)} · Transmis le {formatDate(acte.updated_at || acte.created_at)}</div>
                        </div>
                        <div className="demande-meta">
                            <span className="badge badge-transmis"><span className="badge-dot" />AU PASTEUR</span>
                            <div className="item-actions">
                                <button className="btn-small btn-view" onClick={(e) => { e.stopPropagation(); setDetail({ item: acte, isAnn: false }); }}>
                                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Voir détails
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}

                {annTransmises.length > 0 && (
                    <>
                        <div style={{ padding: '10px 20px 4px', borderTop: transmises.length > 0 ? '1px solid #ede9fe' : 'none', marginTop: transmises.length > 0 ? 8 : 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                🙏 Demandes de prière transmises
                            </span>
                        </div>
                        {annTransmises.map((ann) => {
                            const t = ANNONCE_TYPES.find(x => x.value === (ann.type_annonce || ann.type_acte));
                            const b = BADGE_CONFIG[ann.type_annonce || ann.type_acte] || { label: t?.label || '—', emoji: '🙏', bg: '#ede9fe', color: '#7c3aed' };
                            const msg = ann.details?.contenu || ann.message || '';
                            const member = ann.membre ? `${ann.membre.prenom} ${ann.membre.nom}` : (ann.createur ? `${ann.createur.prenom} ${ann.createur.nom}` : '—');
                            return (
                                <div key={`ann-t-${ann.id}`} className="demande-item">
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background: b.bg, color: b.color, fontSize:11, fontWeight:700, marginBottom:6 }}>
                                        {b.emoji} {b.label}
                                    </span>
                                    <div style={{ display:'flex', alignItems:'flex-start', gap:10, width:'100%' }}>
                                        <div className="demande-acte-icon" style={{ background: b.bg, color: b.color, fontSize:18, flexShrink:0 }}>{b.emoji}</div>
                                        <div className="demande-info" style={{ flex:1 }}>
                                            <div className="demande-name">{member}</div>
                                            <div className="demande-type">{msg.slice(0,100)}{msg.length > 100 ? '…' : ''}</div>
                                            <div className="demande-type" style={{ marginTop:2 }}>Transmis le {formatDate(ann.updated_at || ann.created_at)}</div>
                                        </div>
                                        <div className="demande-meta">
                                            <span className="badge badge-transmis"><span className="badge-dot" />AU PASTEUR</span>
                                            <div className="item-actions">
                                                <button className="btn-small btn-view" onClick={(e) => { e.stopPropagation(); setDetail({ item: ann, isAnn: true }); }}>
                                                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Voir détails
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
        {detail && (
            <MiniDetail
                item={detail.item}
                isAnn={detail.isAnn}
                onClose={() => setDetail(null)}
                ANNONCE_TYPES={ANNONCE_TYPES}
            />
        )}
        </>
    );
}
