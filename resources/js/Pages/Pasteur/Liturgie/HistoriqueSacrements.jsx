import React, { useEffect, useState } from 'react';
import { downloadSacrements } from './exportSacrements';
import SacrementFollowUpModal from './SacrementFollowUpModal';
import { canFollowUp, groupProblem } from './sacrementFollowUp';
import { withBasePath } from '../../../Utils/urlHelper';

const types = { bapteme: 'Baptême', premiere_communion: 'Première communion', bapteme_premiere_communion: 'Baptême et première communion' };
const decisions = { valider: 'Admission validée', refuser: 'Refusé', retourner: 'Correction demandée' };
const stages = { admis: 'Admis', partiel: 'Célébration partielle', celebre: 'Célébré', reporte: 'Reporté', archive: 'Archivé', refuse: 'Refusé', soumis: 'À vérifier', controle: 'Contrôlé', transmis: 'Transmis', annule: 'Annulé' };
const formations = { en_cours: 'Préparation en cours', terminee: 'Préparation terminée', non_requise: 'Préparation non requise' };
const formatDate = value => value ? new Date(value).toLocaleDateString('fr-FR') : 'Non renseignée';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function HistoriqueSacrements({ listes = [] }) {
    const [search, setSearch] = useState('');
    const [campagne, setCampagne] = useState('');
    const [classe, setClasse] = useState('');
    const [decision, setDecision] = useState('valider');
    const [exporting, setExporting] = useState('');
    const [error, setError] = useState('');
    const [dialog, setDialog] = useState(null);
    const [success, setSuccess] = useState('');
    const [selected, setSelected] = useState([]);
    const [selectionError, setSelectionError] = useState('');
    useEffect(() => { setSelected([]); setSelectionError(''); }, [listes, search, campagne, classe, decision]);
    const rows = listes.flatMap(list => list.candidats.map(candidate => ({ ...candidate, list, pending: false,
        dossier: (list.dossiers || []).find(dossier => Number(dossier.id) === Number(candidate.id)),
    })))
        .sort((a, b) => String(b.decision_pastorale.date || '').localeCompare(String(a.decision_pastorale.date || '')));
    const visible = rows.filter(row => (!campagne || String(row.list.campagne_id) === campagne)
        && (!classe || String(row.list.classe_id) === classe)
        && (!decision || row.decision_pastorale.decision === decision)
        && normalize(`${row.nom} ${row.reference} ${row.list.classe?.nom} ${types[row.type]}`).includes(normalize(search.trim())));
    const selectable = visible.filter(row => canFollowUp(row, 'planifier') || canFollowUp(row, 'rectifier'));
    const selectedRows = selectable.filter(row => selected.includes(row.id));
    const openGroup = action => {
        const problem = groupProblem(selectedRows, action);
        setSelectionError(problem);
        if (!problem) setDialog({ rows: selectedRows, action });
    };
    const campaigns = [...new Map(listes.map(list => [list.campagne_id, list.campagne])).entries()];
    const classes = [...new Map(listes.map(list => [list.classe_id, list.classe])).entries()];
    const download = async format => {
        if (exporting || !visible.length) return;
        setExporting(format); setError('');
        try { await downloadSacrements(format, visible, { history: true }); }
        catch { setError('Le téléchargement a échoué. Veuillez réessayer.'); }
        finally { setExporting(''); }
    };
    return <div className="pastor-sacrament-history">
        <h3>Historique des décisions pastorales</h3>
        <p className="pastor-history-description">Retrouvez les décisions, renseignez la préparation et confirmez les sacrements reçus directement depuis cet historique. Les exports respectent les filtres affichés.</p>
        {success && <p className="pastor-success" role="status">{success}</p>}
        <div className="pastor-history-filters">
            <label>Rechercher<input type="search" placeholder="Nom, classe, référence, sacrement…" value={search} onChange={event => setSearch(event.target.value)} /></label>
            <label>Campagne<select value={campagne} onChange={event => setCampagne(event.target.value)}><option value="">Toutes les campagnes</option>{campaigns.map(([id, value]) => <option key={id} value={id}>{value?.annee} · {value?.titre}{value?.archivee_at ? ' (archivée)' : ''}</option>)}</select></label>
            <label>Classe<select value={classe} onChange={event => setClasse(event.target.value)}><option value="">Toutes les classes</option>{classes.map(([id, value]) => <option key={id} value={id}>{value?.nom}</option>)}</select></label>
            <label>Décision<select value={decision} onChange={event => setDecision(event.target.value)}><option value="">Toutes les décisions</option>{Object.entries(decisions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <button type="button" className="btn-see" onClick={() => { setSearch(''); setCampagne(''); setClasse(''); setDecision(''); }}>Réinitialiser</button>
        </div>
        <div className="pastor-history-downloads">
            <p role="status"><strong>{visible.length}</strong> inscription(s) dans l’historique affiché</p>
            <div className="pastor-list-actions">
                <button type="button" className="btn-see" disabled={!!exporting || !visible.length} onClick={() => download('pdf')}>{exporting === 'pdf' ? 'Préparation du PDF…' : 'Télécharger PDF'}</button>
                <button type="button" className="btn-see" disabled={!!exporting || !visible.length} onClick={() => download('excel')}>{exporting === 'excel' ? 'Préparation Excel…' : 'Télécharger Excel'}</button>
            </div>
        </div>
        <div className="pastor-history-batch">
            <div className="flex flex-wrap items-center justify-between gap-3"><p><strong>{selectedRows.length}</strong> candidat(s) sélectionné(s)</p><button type="button" className="btn-see" disabled={!selected.length} onClick={() => { setSelected([]); setSelectionError(''); }}>Effacer la sélection</button></div>
            <p className="text-xs text-slate-600">Sélectionnez les candidats d’une même campagne. Les informations saisies seront appliquées à toute la sélection, avec un suivi distinct pour chacun.</p>
            <div className="pastor-list-actions">
                <button type="button" className="btn-see" disabled={!selectedRows.length} onClick={() => openGroup('planifier')}>Préparation / cérémonie</button>
                <button type="button" className="btn-validate" disabled={!selectedRows.length} onClick={() => openGroup('celebrer')}>Confirmer les sacrements</button>
                <button type="button" className="btn-see" disabled={!selectedRows.length} onClick={() => openGroup('reporter')}>Absence / report</button>
                <button type="button" className="btn-see" disabled={!selectedRows.length} onClick={() => openGroup('rectifier')}>Rectifier les certificats</button>
            </div>
            {selectionError && <p role="alert" className="pastor-decision-error">{selectionError}</p>}
        </div>
        {error && <p role="alert" className="pastor-decision-error">{error}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
                <thead><tr><th><input type="checkbox" aria-label="Sélectionner tous les candidats affichés pouvant être traités" disabled={!selectable.length} checked={!!selectable.length && selectable.every(row => selected.includes(row.id))} onChange={event => { setSelected(event.target.checked ? selectable.map(row => row.id) : []); setSelectionError(''); }}/></th><th>Candidat</th><th>Classe / campagne</th><th>Contact</th><th>Sacrement</th><th>Décision</th><th>Date / pasteur</th><th>Suivi et actions</th></tr></thead>
                <tbody>{visible.map(row => <tr key={`${row.list.id}-${row.id}`}>
                    <td>{(canFollowUp(row, 'planifier') || canFollowUp(row, 'rectifier')) && <input type="checkbox" aria-label={`Sélectionner ${row.nom}`} checked={selected.includes(row.id)} onChange={event => { setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id)); setSelectionError(''); }}/>}</td>
                    <td><strong>{row.nom}</strong><p className="text-xs text-slate-500 mt-1">{row.reference}</p></td>
                    <td>{row.list.classe?.nom}<p className="text-xs text-slate-500 mt-1">{row.list.campagne?.annee} · Liste v{row.list.version}{row.list.campagne?.archivee_at ? ' · Archivée' : ''}</p></td>
                    <td>{row.details?.telephone || '—'}</td><td>{types[row.type] || row.type}</td>
                    <td><span className={`pastor-history-status is-${row.decision_pastorale.decision}`}>{decisions[row.decision_pastorale.decision]}</span>
                        {row.decision_pastorale.commentaire && <details className="pastor-history-note"><summary>Note pastorale</summary><p>{row.decision_pastorale.commentaire}</p></details>}
                    </td>
                    <td>{row.decision_pastorale.date ? new Date(row.decision_pastorale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}<p className="text-xs text-slate-500 mt-1">{row.decision_pastorale.acteur}</p></td>
                    <td className="pastor-history-followup"><FollowUp row={row} open={(action, sacrement) => setDialog({ rows: [row], action, sacrement })}/></td>
                </tr>)}{!visible.length && <tr><td colSpan={8} className="pastor-empty">{rows.length ? 'Aucune décision pour ces critères.' : 'Les décisions apparaîtront ici après leur enregistrement.'}</td></tr>}</tbody>
            </table>
        </div>
        {dialog && <SacrementFollowUpModal {...dialog} onClose={() => setDialog(null)} onSuccess={message => { setSuccess(message); setDialog(null); setSelected([]); }} /> }
    </div>;
}

function FollowUp({ row, open }) {
    const suivi = row.dossier?.suivi_sacrement;
    if (!suivi) return <span className="text-xs text-slate-500">Version historique · consultation uniquement</span>;
    const preparation = suivi.preparation;
    const canPrepare = canFollowUp(row, 'planifier');
    const certificates = Object.entries(suivi.celebrations || {});
    return <div className="space-y-3">
        <span className="pastor-history-status">{stages[suivi.etape] || suivi.etape}</span>
        {preparation && <details className="pastor-history-note"><summary>{formations[preparation.formation] || 'Préparation / cérémonie'}</summary>
            <p>Date prévue : {formatDate(preparation.date)}<br/>Lieu : {preparation.lieu}<br/>Célébrant : {preparation.celebrant}</p>
            {preparation.observation && <p>{preparation.observation}</p>}
        </details>}
        {canPrepare && <div className="pastor-followup-actions">
            <button type="button" className="btn-see" onClick={() => open('planifier')}>Préparation / cérémonie</button>
            <button type="button" className="btn-validate" onClick={() => open('celebrer')}>Confirmer le sacrement reçu</button>
            <button type="button" className="btn-see" onClick={() => open('reporter')}>Absent / reporter</button>
        </div>}
        {suivi.etape === 'reporte' && suivi.observation && <p className="text-xs text-slate-600 whitespace-pre-wrap">{suivi.observation}</p>}
        {certificates.map(([type, celebration]) => <details key={type} className="pastor-history-note">
            <summary>{types[type]} reçu le {formatDate(celebration.date)}</summary>
            <p>{celebration.lieu} · {celebration.celebrant}</p>
            <div className="pastor-followup-actions">
                <a className="pastor-detail-link" href={withBasePath('', `/sacrements/dossiers/${row.id}/certificat/${type}`)}>Télécharger le certificat PDF</a>
                <button type="button" className="btn-see" onClick={() => open('rectifier', type)}>Rectifier le certificat</button>
                {(suivi.versions_certificats?.[type] || []).map(version => <a key={version.version} className="pastor-detail-link" href={withBasePath('', `/sacrements/dossiers/${row.id}/certificat/${type}?version=${version.version}`)}>Version {version.version} · remplacée</a>)}
            </div>
        </details>)}
    </div>;
}
