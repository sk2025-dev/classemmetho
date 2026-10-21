import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { candidateSacrements, groupProblem } from './sacrementFollowUp';
import { withBasePath } from '../../../Utils/urlHelper';

const types = { bapteme: 'Baptême', premiere_communion: 'Première communion', bapteme_premiere_communion: 'Baptême et première communion' };
const titles = { planifier: 'Préparation et cérémonie', celebrer: 'Confirmer le sacrement reçu', reporter: 'Absence ou report', rectifier: 'Rectifier le certificat' };
const messages = { planifier: 'Préparation et cérémonie enregistrées.', celebrer: 'Sacrement confirmé. La fiche du membre et son certificat sont actualisés.', reporter: 'Report enregistré avec son motif.', rectifier: 'Certificat rectifié. La version précédente reste disponible.' };

export default function SacrementFollowUpModal({ rows, action, sacrement, onClose, onSuccess }) {
    const row = rows[0];
    const grouped = rows.length > 1;
    const [search, setSearch] = useState('');
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const displayed = rows.filter(candidate => normalize(`${candidate.nom} ${candidate.list.classe?.nom} ${candidate.reference}`).includes(normalize(search.trim())));
    const perCandidate = ['celebrer', 'rectifier'].includes(action);
    const available = perCandidate ? candidateSacrements(row, action) : Object.keys(types);
    const initialChoices = Object.fromEntries(rows.map(candidate => [candidate.id, (!grouped && sacrement) || candidateSacrements(candidate, action)[0] || '']));
    const [choices, setChoices] = useState(initialChoices);
    const first = sacrement || available[0] || '';
    const sharedValues = (type, selected = initialChoices) => {
        const records = rows.map(candidate => action === 'rectifier' ? candidate.dossier.suivi_sacrement.celebrations?.[selected[candidate.id] || type] || {} : candidate.dossier.suivi_sacrement.preparation || {});
        return Object.fromEntries(['date', 'lieu', 'celebrant', 'formation', 'observation'].map(key => [key, records.every(record => (record[key] || '') === (records[0][key] || '')) ? records[0][key] || '' : '']));
    };
    const existing = sharedValues(first);
    const [form, setForm] = useState({
        date: action === 'celebrer' ? '' : (existing.date || '').slice(0, 10),
        lieu: existing.lieu || '', celebrant: existing.celebrant || '', formation: existing.formation || 'en_cours',
        commentaire: action === 'planifier' ? existing.observation || '' : '',
    });
    const chooseSacrement = (id, type) => {
        const next = { ...choices, [id]: type };
        setChoices(next);
        if (action === 'rectifier') {
            const values = sharedValues(type, next);
            setForm(previous => ({ ...previous, date: (values.date || '').slice(0, 10), lieu: values.lieu, celebrant: values.celebrant }));
        }
    };
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef(null);
    const title = useRef(null);
    const needsReason = ['reporter', 'rectifier'].includes(action);
    const field = (name, value) => setForm(previous => ({ ...previous, [name]: value }));
    const today = new Date();
    const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    useEffect(() => {
        const focus = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        title.current?.focus();
        return () => { document.body.style.overflow = overflow; if (focus?.isConnected) focus.focus(); };
    }, []);

    const keyboard = event => {
        if (event.key === 'Escape') { event.stopPropagation(); if (!busy) onClose(); }
        if (event.key !== 'Tab') return;
        const items = [...ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')];
        if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === title.current)) {
            event.preventDefault(); items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
            event.preventDefault(); items[0]?.focus();
        }
    };
    const submit = event => {
        event.preventDefault();
        if (busy) return;
        const problem = groupProblem(rows, action);
        setError(problem);
        if (problem) return;
        if (perCandidate && rows.some(candidate => !candidateSacrements(candidate, action).includes(choices[candidate.id]))) {
            setError('Vérifiez le sacrement choisi pour chaque candidat.'); return;
        }
        const payload = {
            campagne_id: row.list.campagne_id, ids: rows.map(candidate => candidate.id), action,
            revisions: Object.fromEntries(rows.map(candidate => [candidate.id, candidate.dossier.suivi_sacrement.revision])), commentaire: form.commentaire,
        };
        if (action !== 'reporter') Object.assign(payload, form);
        if (perCandidate) payload.sacrements = choices;
        router.post(withBasePath('', '/sacrements/actions'), payload, {
            preserveState: true, preserveScroll: true,
            onStart: () => setBusy(true), onFinish: () => setBusy(false),
            onError: errors => setError(Object.values(errors).flat().join(' ')),
            onSuccess: () => onSuccess(grouped ? `Action enregistrée pour ${rows.length} candidats. Chaque dossier a été actualisé.` : messages[action]),
        });
    };
    return <div className="pastor-decision-overlay" onClick={() => !busy && onClose()}>
        <form ref={ref} className={`pastor-decision-modal pastor-followup-modal${grouped ? ' is-grouped' : ''}`} role="dialog" aria-modal="true" aria-labelledby="pastor-followup-title" aria-busy={busy}
            onSubmit={submit} onKeyDown={keyboard} onClick={event => event.stopPropagation()}>
            <header className="pastor-decision-header">
                <div><span className="pastor-decision-eyebrow">{grouped ? 'Action groupée' : 'Suivi du candidat'}</span><h2 ref={title} tabIndex={-1} id="pastor-followup-title">{titles[action]}</h2><p>{grouped ? `${rows.length} candidats · ${new Set(rows.map(candidate => candidate.list.classe_id)).size} classe(s)` : `${row.nom} · ${row.list.classe?.nom}`}</p></div>
                <button type="button" className="pastor-decision-close" aria-label="Fermer" disabled={busy} onClick={onClose}>×</button>
            </header>
            <div className="pastor-decision-body">
                {grouped && <>
                    <div className="pastor-decision-search"><label htmlFor="followup-search">Candidats concernés</label><input id="followup-search" type="search" placeholder="Rechercher un candidat ou une classe…" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}/><p>{displayed.length} sur {rows.length} affichés · La recherche ne modifie pas la sélection.</p></div>
                    <div className="pastor-decision-candidates" tabIndex={0} role="region" aria-label="Candidats sélectionnés"><table><thead><tr><th>N°</th><th>Candidat</th><th>Classe</th><th>{perCandidate ? 'Sacrement à traiter' : 'Sacrement demandé'}</th></tr></thead><tbody>
                        {displayed.map(candidate => <tr key={candidate.id}><td>{rows.indexOf(candidate) + 1}</td><td><strong>{candidate.nom}</strong><small>{candidate.reference}</small></td><td>{candidate.list.classe?.nom}</td><td>{perCandidate ? <select className="pastor-candidate-sacrament" aria-label={`Sacrement pour ${candidate.nom}`} required disabled={busy} value={choices[candidate.id]} onChange={event => chooseSacrement(candidate.id, event.target.value)}>{candidateSacrements(candidate, action).map(type => <option key={type} value={type}>{types[type]}</option>)}</select> : types[candidate.type]}</td></tr>)}
                        {!displayed.length && <tr><td colSpan={4} className="pastor-decision-empty">Aucun candidat pour cette recherche.</td></tr>}
                    </tbody></table></div>
                    <p className="text-sm font-semibold text-blue-900">La date, le lieu, le célébrant et l’observation ci-dessous s’appliqueront aux {rows.length} candidats sélectionnés.</p>
                </>}
                <p className="pastor-decision-notice">{action === 'planifier' ? 'Renseignez le suivi de préparation et les informations prévues pour la cérémonie.'
                    : action === 'celebrer' ? 'Confirmez uniquement un sacrement effectivement reçu. Cette action met à jour la fiche du membre et permet de télécharger son certificat.'
                    : action === 'rectifier' ? 'Indiquez les informations corrigées et le motif. La version précédente du certificat sera conservée.'
                    : 'Précisez le motif de l’absence ou du report et la suite prévue pour ce candidat.'}</p>
                {error && <p role="alert" className="pastor-decision-error">{error}</p>}
                <fieldset disabled={busy} className="pastor-followup-fields">
                    {action === 'planifier' && <label>Préparation / catéchèse<select value={form.formation} onChange={event => field('formation', event.target.value)} required>
                        <option value="en_cours">En cours</option><option value="terminee">Terminée</option><option value="non_requise">Non requise</option>
                    </select></label>}
                    {perCandidate && !grouped && <label>Sacrement concerné<select value={choices[row.id]} required disabled={action === 'rectifier'} onChange={event => chooseSacrement(row.id, event.target.value)}>
                        {available.map(type => <option key={type} value={type}>{types[type]}</option>)}
                    </select></label>}
                    {action === 'celebrer' && rows.some(candidate => candidate.type === 'bapteme_premiere_communion') && <p className="text-xs text-slate-600">Pour une demande combinée, choisissez « Baptême » seul ou « Baptême et première communion » si les deux sacrements ont été reçus. Chaque sacrement aura son propre certificat.</p>}
                    {action !== 'reporter' && <div className="pastor-followup-grid">
                        <label>{action === 'planifier' ? 'Date prévue' : 'Date réelle du sacrement'}<input type="date" required max={action === 'planifier' ? undefined : maxDate} value={form.date} onChange={event => field('date', event.target.value)}/></label>
                        <label>Lieu<input required maxLength={255} placeholder="Église, paroisse ou lieu de célébration" value={form.lieu} onChange={event => field('lieu', event.target.value)}/></label>
                        <label className="pastor-followup-wide">Célébrant<input required maxLength={255} placeholder="Nom du célébrant" value={form.celebrant} onChange={event => field('celebrant', event.target.value)}/></label>
                    </div>}
                    <label>{needsReason ? 'Motif et précisions (obligatoire)' : 'Observation (facultative)'}<textarea rows={3} required={needsReason} maxLength={2000} value={form.commentaire} onChange={event => field('commentaire', event.target.value)}/></label>
                </fieldset>
            </div>
            <footer className="pastor-decision-footer"><p>{grouped ? `${rows.length} candidats concernés` : row.reference}</p><div className="pastor-list-actions">
                <button type="button" className="btn-see" disabled={busy} onClick={onClose}>Annuler</button>
                <button type="submit" className="btn-validate" disabled={busy}>{busy ? 'Enregistrement…' : grouped ? `Confirmer pour ${rows.length} candidats` : action === 'celebrer' ? 'Confirmer le sacrement reçu' : 'Enregistrer'}</button>
            </div></footer>
        </form>
    </div>;
}
