import HistoriqueSacrements from "./HistoriqueSacrements";
import { downloadSacrements } from "./exportSacrements";
import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { withBasePath } from '../../../Utils/urlHelper';

const types = { bapteme: 'Baptême', premiere_communion: 'Première communion', bapteme_premiere_communion: 'Baptême et première communion' };
export default function ListesSacrements({ listes = [], historique = [] }) {
    const [view, setView] = useState('pending');
    const [decision, setDecision] = useState(null);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [classe, setClasse] = useState('');
    const [motif, setMotif] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [exporting, setExporting] = useState('');
    const [exportError, setExportError] = useState('');
    useEffect(() => setSelected([]), [listes, search, classe]);
    const rows = listes.flatMap(list => list.candidats.map(c => {
        const dossier = (list.dossiers || []).find(d => Number(d.id) === Number(c.id));
        return { ...c, list, dossier, pending: dossier?.statut === 'TRANSMISE_AU_PASTEUR' && dossier?.suivi_sacrement?.etape === 'transmis' };
    }));
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const visible = rows.filter(row => (!classe || String(row.list.classe_id) === classe) && normalize(`${row.nom} ${row.reference} ${row.list.classe?.nom} ${types[row.type]}`).includes(normalize(search.trim())));
    const pending = visible.filter(row => row.pending);
    const exportFile = async format => {
        if (exporting || !visible.length) return;
        setExporting(format); setExportError('');
        try { await downloadSacrements(format, visible); }
        catch { setExportError('Le téléchargement a échoué. Veuillez réessayer.'); }
        finally { setExporting(''); }
    };
    const choose = (items, action) => { if (!items.length) return; setDecision({ items, action }); setMotif(''); setError(''); };
    const submit = e => {
        e.preventDefault();
        if (busy) return;
        router.post(withBasePath('', '/sacrements/candidats/decision-pastorale'), {
            decision: decision.action, commentaire: motif,
            candidats: decision.items.map(row => ({ id: row.id, liste_id: row.list.id, revision: row.dossier.suivi_sacrement.revision })),
        }, {
            preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false),
            onError: errors => setError(Object.values(errors).flat().join(' ')),
            onSuccess: () => { setSuccess('Décision pastorale enregistrée. Les familles, conducteurs et le bureau sont notifiés.'); setDecision(null); setSelected([]); },
        });
    };
    return <section className="pastor-sacraments">
        <div className="pastor-section-heading"><div><h2>Baptême et première communion</h2><p>Toutes les classes dans une seule liste. Examinez puis validez un candidat ou une sélection.</p></div><span>{rows.filter(row => row.pending).length} candidat(s) en attente</span></div>
        {success && <div role="status" className="pastor-success">{success} <button type="button" className="underline font-semibold ml-2" onClick={() => setView('history')}>Voir l’historique et télécharger la liste →</button></div>}
        <div className="pastor-sacrament-tabs" role="group" aria-label="Suivi des inscriptions">
            <button type="button" aria-pressed={view === 'pending'} onClick={() => setView('pending')}>À valider <span>{rows.filter(row => row.pending).length}</span></button>
            <button type="button" aria-pressed={view === 'history'} onClick={() => setView('history')}>Historique <span>{historique.reduce((count, list) => count + list.candidats.length, 0)}</span></button>
        </div>
        {view === 'history' ? <HistoriqueSacrements listes={historique} /> : <>
        <div className="flex flex-wrap gap-3 mb-4"><input type="search" aria-label="Rechercher un candidat" placeholder="Nom, classe, référence, sacrement…" value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3 text-sm"/><select aria-label="Classe" className="rounded-lg border border-slate-300 p-3 text-sm" value={classe} onChange={e => setClasse(e.target.value)}><option value="">Toutes les classes</option>{[...new Map(listes.map(list => [list.classe_id, list.classe])).entries()].map(([id, value]) => <option key={id} value={id}>{value?.nom}</option>)}</select><button className="btn-see" onClick={() => { setSearch(''); setClasse(''); }}>Réinitialiser</button></div>
        <div className="flex flex-wrap items-center gap-3 mb-4"><button type="button" className="btn-see" disabled={!!exporting || !visible.length} onClick={() => exportFile('pdf')}>{exporting === 'pdf' ? 'Préparation du PDF…' : 'Télécharger PDF'}</button><button type="button" className="btn-see" disabled={!!exporting || !visible.length} onClick={() => exportFile('excel')}>{exporting === 'excel' ? 'Préparation Excel…' : 'Télécharger Excel'}</button><span className="text-xs text-slate-500">{visible.length} candidat(s) · Les exports respectent les filtres affichés.</span></div>
        {exportError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-800">{exportError}</p>}
        <div className="pastor-list-actions mb-4"><button className="btn-validate" disabled={busy || !selected.length} onClick={() => choose(pending.filter(row => selected.includes(row.id)), 'valider')}>Valider la sélection ({selected.length})</button><button className="btn-see" disabled={busy || !pending.length} onClick={() => choose(pending, 'valider')}>Valider tous les candidats affichés ({pending.length})</button><button className="btn-refuse-sm" disabled={busy || !selected.length} onClick={() => choose(pending.filter(row => selected.includes(row.id)), 'refuser')}>Refuser la sélection</button></div>
        <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead><tr><th><input type="checkbox" aria-label="Sélectionner tous les candidats en attente affichés" disabled={!pending.length || busy} checked={!!pending.length && pending.every(row => selected.includes(row.id))} onChange={e => setSelected(e.target.checked ? pending.map(row => row.id) : [])}/></th><th>Candidat</th><th>Classe</th><th>Contact</th><th>Sacrement</th><th>État et actions</th></tr></thead><tbody>{visible.map(row => <tr key={`${row.list.id}-${row.id}`}><td>{row.pending && <input type="checkbox" aria-label={`Sélectionner ${row.nom}`} disabled={busy} checked={selected.includes(row.id)} onChange={e => setSelected(e.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))}/>}</td><td><strong>{row.nom}</strong><p className="text-xs text-slate-500 mt-1">{row.reference}</p><Link className="pastor-detail-link mt-2" href={withBasePath('', `/sacrements?campagne_id=${row.list.campagne_id}&search=${encodeURIComponent(row.nom)}#listes-transmises`)}>Dossier et contrôles →</Link></td><td>{row.list.classe?.nom}<p className="text-xs text-slate-500">{row.list.campagne?.annee} · Liste v{row.list.version}</p></td><td>{row.details?.telephone || '—'}</td><td>{types[row.type] || row.type}</td><td>{row.pending ? <div className="pastor-list-actions"><button className="btn-validate" disabled={busy} onClick={() => choose([row], 'valider')}>Valider</button><button className="btn-refuse-sm" disabled={busy} onClick={() => choose([row], 'refuser')}>Refuser</button></div> : <span className="font-semibold">{row.dossier?.suivi_sacrement?.etape === 'refuse' ? 'Refusé' : row.dossier?.suivi_sacrement?.etape === 'admis' ? 'Admis par le pasteur' : 'Déjà traité'}</span>}</td></tr>)}{!visible.length && <tr><td colSpan={6} className="pastor-empty">Aucun candidat pour ces critères.</td></tr>}</tbody></table></div>
        </>}
        {decision && <DecisionModal decision={decision} motif={motif} setMotif={setMotif} busy={busy} error={error} onClose={() => setDecision(null)} onSubmit={submit} />}
    </section>;
}


function DecisionModal({ decision, motif, setMotif, busy, error, onClose, onSubmit }) {
    const [search, setSearch] = useState('');
    const modalRef = useRef(null);
    const titleRef = useRef(null);
    const validating = decision.action === 'valider';
    const total = decision.items.length;
    const classCount = new Set(decision.items.map(row => row.list.classe_id)).size;
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const displayed = decision.items.map((row, index) => ({ ...row, position: index + 1 })).filter(row =>
        normalize(`${row.nom} ${row.reference} ${row.list.classe?.nom} ${types[row.type]}`).includes(normalize(search.trim()))
    );

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        titleRef.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, []);

    const handleKeyDown = event => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            if (!busy) onClose();
        }
        if (event.key !== 'Tab') return;
        const elements = [...modalRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
            event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first?.focus();
        }
    };

    return <div className="pastor-decision-overlay" onClick={() => !busy && onClose()}>
        <form ref={modalRef} onSubmit={onSubmit} onClick={event => event.stopPropagation()} onKeyDown={handleKeyDown}
            role="dialog" aria-modal="true" aria-labelledby="pastor-decision-title" aria-describedby="pastor-decision-description"
            aria-busy={busy} className={`pastor-decision-modal${validating ? '' : ' is-refusal'}`}>
            <header className="pastor-decision-header">
                <div>
                    <span className="pastor-decision-eyebrow">Décision pastorale</span>
                    <h2 ref={titleRef} tabIndex={-1} id="pastor-decision-title">{validating ? 'Confirmer les admissions' : 'Confirmer les refus'}</h2>
                    <p id="pastor-decision-description">Vérifiez les candidats concernés avant de confirmer.</p>
                </div>
                <button type="button" className="pastor-decision-close" aria-label="Fermer la confirmation" disabled={busy} onClick={onClose}>×</button>
            </header>
            <div className="pastor-decision-body">
                <div className="pastor-decision-summary">
                    <span><strong>{total}</strong> candidat{total > 1 ? 's' : ''} sélectionné{total > 1 ? 's' : ''}</span>
                    <span><strong>{classCount}</strong> classe{classCount > 1 ? 's' : ''}</span>
                    <span className="pastor-decision-outcome">{validating ? 'Admission' : 'Refus'}</span>
                </div>
                <div className="pastor-decision-search">
                    <label htmlFor="pastor-decision-search">Candidats concernés</label>
                    <input id="pastor-decision-search" type="search" onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} placeholder="Rechercher un nom, une classe, un sacrement…" value={search} onChange={event => setSearch(event.target.value)} />
                    <p aria-live="polite">{displayed.length} sur {total} affiché{displayed.length > 1 ? 's' : ''} · La recherche ne modifie pas la sélection.</p>
                </div>
                <div className="pastor-decision-candidates" role="region" aria-label="Liste des candidats concernés" tabIndex={0}>
                    <table>
                        <thead><tr><th scope="col">N°</th><th scope="col">Candidat</th><th scope="col">Classe</th><th scope="col">Sacrement</th></tr></thead>
                        <tbody>{displayed.map(row => <tr key={row.id}>
                            <td>{row.position}</td>
                            <td><strong>{row.nom}</strong><small>{row.reference}</small></td>
                            <td><span className="pastor-decision-class">{row.list.classe?.nom || 'Non renseignée'}</span></td>
                            <td>{types[row.type] || row.type}</td>
                        </tr>)}{!displayed.length && <tr><td colSpan={4} className="pastor-decision-empty">Aucun candidat ne correspond à cette recherche.</td></tr>}</tbody>
                    </table>
                </div>
                <p className="pastor-decision-notice">{validating
                    ? 'L’admission sera confirmée pour toute la sélection et la chaîne de validation sera notifiée. La célébration sera enregistrée séparément.'
                    : 'Le refus s’appliquera à toute la sélection. Précisez le motif dans la note pastorale.'}</p>
                <div className="pastor-decision-note">
                    <label htmlFor="pastor-decision-note">Note pastorale <span>({validating ? 'facultative' : 'obligatoire'})</span></label>
                    <textarea id="pastor-decision-note" disabled={busy} required={!validating} maxLength={2000} rows={3} value={motif} onChange={event => setMotif(event.target.value)} placeholder={validating ? 'Ajouter une observation pour les personnes notifiées…' : 'Indiquer le motif du refus…'} />
                    <small>{motif.length} / 2 000 caractères · Note commune à la sélection</small>
                </div>
                {error && <p role="alert" className="pastor-decision-error">{error}</p>}
            </div>
            <footer className="pastor-decision-footer">
                <p><strong>{total} candidat{total > 1 ? 's' : ''}</strong><span>concerné{total > 1 ? 's' : ''} par cette décision</span></p>
                <div className="pastor-list-actions">
                    <button type="button" className="btn-see" disabled={busy} onClick={onClose}>Annuler</button>
                    <button type="submit" className={validating ? 'btn-validate' : 'btn-refuse-sm'} disabled={busy}>{busy ? 'Enregistrement…' : `${validating ? 'Valider' : 'Refuser'} ${total} candidat${total > 1 ? 's' : ''}`}</button>
                </div>
            </footer>
        </form>
    </div>;
}
