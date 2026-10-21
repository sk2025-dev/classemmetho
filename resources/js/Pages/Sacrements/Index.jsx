import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Users, UserPlus, Check, ClipboardList } from 'lucide-react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { withBasePath } from '../../Utils/urlHelper';

const labels = { brouillon: 'Brouillon', soumis: 'À vérifier', a_corriger: 'À corriger par la famille', controle: 'Validé par le conducteur', transmis: 'Liste transmise', admis: 'Admis par le pasteur', partiel: 'Célébration partielle', celebre: 'Célébré', refuse: 'Refusé / exclu', annule: 'Annulé', reporte: 'Reporté', archive: 'Archivé', bureau: 'En attente du bureau', pasteur: 'En attente du pasteur', retour_bureau: 'Retournée par le bureau', retour_pasteur: 'Retournée par le pasteur', validee: 'Validée par le pasteur', refusee: 'Refusée' };
const types = { bapteme: 'Baptême', premiere_communion: 'Première communion', bapteme_premiere_communion: 'Baptême et première communion' };
const emptyDetails = { bapteme_date: '', bapteme_lieu: '', telephone: '', telephone2: '', email: '', parents: '', parrain: '', marraine: '', observations: '' };
const url = (path = '') => withBasePath('', `/sacrements${path}`);
const input = 'rounded-lg border border-slate-300 px-3 py-2.5 text-sm w-full bg-white text-slate-900 placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none';
const button = 'rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';
const secondary = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 bg-white disabled:opacity-40 hover:bg-slate-50';
const date = (value) => value ? new Date(value).toLocaleDateString('fr-FR') : '—';
const money = (value) => new Intl.NumberFormat('fr-FR').format(value || 0);

function EnhancedSelect({ children, value, onChange, className, required, ...props }) {
    const flatten = nodes => React.Children.toArray(nodes).flatMap(node => {
        if (!React.isValidElement(node)) return [];
        if (node.type === React.Fragment) return flatten(node.props.children);
        return [{ value: String(node.props.value ?? ''), label: React.Children.toArray(node.props.children).join(''), isDisabled: !!node.props.disabled }];
    });
    const options = flatten(children);
    return <div className="min-w-0 flex-1"><Select {...props} options={options} value={options.find(o => o.value === String(value ?? '')) || null}
        onChange={option => onChange({ target: { value: option?.value || '' } })} required={required}
        isSearchable placeholder="Sélectionner…" noOptionsMessage={() => 'Aucun résultat'} menuPlacement="auto"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        styles={{ control: (base, state) => ({ ...base, minHeight: 48, borderRadius: 12, borderColor: state.isFocused ? '#2563eb' : '#cbd5e1', boxShadow: state.isFocused ? '0 0 0 3px #dbeafe' : 'none', fontSize: 14 }),
            menuPortal: base => ({ ...base, zIndex: 10000 }), menu: base => ({ ...base, borderRadius: 12, overflow: 'hidden' }),
            option: (base, state) => ({ ...base, fontSize: 14, padding: '12px 16px', backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#fff' : '#1e293b' }),
            placeholder: base => ({ ...base, color: '#64748b' }) }} /></div>;
}

function MemberChoice({ value, current, onChange, icon: Icon, title, description }) {
    const active = current === value;
    return <label className={`relative flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${active ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-400'} focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2`}>
        <input type="radio" name="sourceMembre" value={value} checked={active} onChange={() => onChange(value)} className="sr-only" />
        <span className={`rounded-lg p-2 ${active ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}><Icon size={20}/></span>
        <span className="flex-1"><span className="block text-sm font-semibold text-slate-900">{title}</span><span className="mt-1 block text-xs leading-relaxed text-slate-600">{description}</span></span>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300'}`}>{active && <Check size={13}/>}</span>
    </label>;
}

function DossierDetails({ dossier }) {
    const info = dossier.details || {};
    const suivi = dossier.suivi_sacrement || {};
    const fields = entries => <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{entries.map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className={`mt-1 text-sm break-words ${value ? 'font-medium text-slate-900' : 'text-slate-400'}`}>{value || 'Non renseigné'}</dd></div>)}</dl>;
    const history = [...(dossier.historiques || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{types[dossier.type_acte]}</p><h3 className="mt-2 text-xl font-bold text-slate-900">{dossier.membre?.prenom} {dossier.membre?.nom}</h3><p className="mt-1 text-sm text-slate-600">Classe : {dossier.classe?.nom || 'Non renseignée'}</p></div><span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">{labels[suivi.etape] || 'État non renseigné'}</span></div>
            <p className="mt-4 border-t border-emerald-100 pt-3 text-xs text-slate-600 break-all">Référence du dossier · {dossier.reference}</p>
        </div>
        <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 text-sm font-semibold text-slate-900">Coordonnées de contact</h3>{fields([['Téléphone principal', info.telephone], ['Autre téléphone', info.telephone2], ['Adresse e-mail', info.email]])}</section>
        <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 text-sm font-semibold text-slate-900">Famille et accompagnement</h3>{fields([['Parents', info.parents], ['Parrain', info.parrain], ['Marraine', info.marraine]])}</section>
        {(dossier.type_acte === 'premiere_communion' || info.bapteme_date || info.bapteme_lieu) && <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"><div className="mb-4 flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">Baptême déjà reçu</h3>{dossier.bapteme_a_verifier && <span className="text-xs font-medium text-amber-800">À vérifier par le conducteur</span>}</div>{fields([['Date du baptême', info.bapteme_date ? date(info.bapteme_date) : null], ['Lieu du baptême', info.bapteme_lieu]])}</section>}
        {info.observations && <section className="rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-semibold">Informations complémentaires</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{info.observations}</p></section>}
        <section><h3 className="mb-3 text-sm font-semibold">Pièces justificatives <span className="ml-1 text-slate-500">({dossier.pieces_jointes?.length || 0})</span></h3><div className="grid sm:grid-cols-2 gap-2">{(dossier.pieces_jointes || []).map(piece => <a key={piece.id} href={piece.url} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-emerald-600 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-600"><ClipboardList size={20} className="shrink-0 text-emerald-700"/><span className="min-w-0"><span className="block break-all text-sm font-medium text-slate-900">{piece.nom}</span><span className="text-xs text-emerald-800">Consulter le document →</span></span></a>)}</div>{!dossier.pieces_jointes?.length && <p className="text-sm text-slate-500">Aucune pièce jointe.</p>}</section>
        {Object.entries(suivi.versions_certificats || {}).map(([type, versions]) => <section key={type} className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold">Anciennes versions du certificat · {types[type]}</h3>{versions.map(version => <a key={version.version} className="mt-2 block text-sm text-emerald-800 underline" href={url(`/dossiers/${dossier.id}/certificat/${type}?version=${version.version}`)}>Version {version.version} · remplacée</a>)}</section>)}
        <section className="border-t border-slate-200 pt-5"><h3 className="mb-4 text-sm font-semibold">Historique du dossier</h3><ol className="ml-2 border-l-2 border-slate-200 space-y-5">{history.map(item => <li key={item.id} className="relative pl-5"><span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600"/><p className="text-xs text-slate-500">{date(item.created_at)}{item.created_at && ` à ${new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">{item.commentaire || 'Mise à jour du dossier'}</p><p className="mt-1 text-xs text-slate-500">{[item.acteur?.prenom, item.acteur?.nom].filter(Boolean).join(' ') || 'Acteur non renseigné'}</p></li>)}</ol>{!history.length && <p className="text-sm text-slate-500">Aucun événement enregistré.</p>}</section>
    </div>;
}

function Indicators({ value }) {
    if (!value) return <span className="text-slate-600">Aucun contrôle enregistré</span>;
    const f = value.fimeco, a = value.assiduite;
    return <div className="space-y-1 text-xs">
        <p><strong>FIMECO familiale {value.annee}</strong> : {f?.statut || 'Non renseignée'}</p>
        {f && <p>Souscrit : {money(f.montant_souscrit)} · Versé : {money(f.montant_paye)} · Reste : {money(f.montant_restant)} FCFA</p>}
        <p><strong>Assiduité {value.annee}</strong> : {a?.pointages ? `${a.presents} présence(s), ${a.absents} absence(s), ${a.taux} %` : 'Aucun pointage disponible'}</p>
        {!!a?.absences_justifiees && <p>Dont {a.absences_justifiees} absence(s) justifiée(s)</p>}
        <p className="text-slate-600">Activités de classe réalisées et pointées · observé le {date(value.observe_le)}</p>
    </div>;
}

export default function Index({ campagnes, campagne, dossiers, listes, membres, classes, droits, filters, anciensDossiers = [], ouvrirInscription = false, ajoutMembreUrl = null, membrePreselectionne = null, inscriptionType = 'bapteme' }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [selectedLists, setSelectedLists] = useState([]);
    const pendingLists = listes.filter(list => list.statut === 'bureau');
    useEffect(() => setSelectedLists([]), [campagne?.id, listes]);
    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        router.visit(withBasePath('', '/dashboard'));
    };
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(() => ouvrirInscription ? { action: 'creation', rows: [] } : null);
    const [comment, setComment] = useState('');
    const [details, setDetails] = useState(emptyDetails);
    const [files, setFiles] = useState([]);
    const [candidate, setCandidate] = useState(membrePreselectionne ? String(membrePreselectionne) : '');
    const [sourceMembre, setSourceMembre] = useState('famille');
    const [type, setType] = useState(inscriptionType);
    const [search, setSearch] = useState(filters.search || '');
    const [celebration, setCelebration] = useState({ sacrement: 'bapteme', date: '', lieu: '', celebrant: '', formation: 'en_cours' });
    const [campaignForm, setCampaignForm] = useState({ annee: new Date().getFullYear(), titre: '', date_ouverture: '', date_fermeture: '', motif_reouverture: '' });
    useEffect(() => { setSelected([]); }, [dossiers]);
    useEffect(() => {
        if (dialog?.action !== 'creation') return;
        const member = membres.find(m => String(m.id) === String(candidate));
        setDetails(previous => ({ ...previous, telephone: member?.contacts?.telephone || '', telephone2: member?.contacts?.telephone2 || '', email: member?.contacts?.email || '' }));
    }, [candidate, dialog?.action]);
    const post = (path, data, close = true) => router.post(url(path), data, {
        preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false),
        onSuccess: () => { setSelected([]); if (close) setDialog(null); },
    });
    const filter = (values) => router.get(url(), { ...filters, ...values }, { preserveState: true, preserveScroll: true });
    const open = (action, rows = [], extra = {}) => {
        setSourceMembre('famille');
        setComment(''); setDetails(rows[0]?.details ? Object.fromEntries(Object.keys(emptyDetails).map(k => [k, rows[0].details[k] || ''])) : emptyDetails); setFiles([]);
        setCelebration({ sacrement: rows[0]?.type_acte === 'premiere_communion' ? 'premiere_communion' : 'bapteme', date: '', lieu: '', celebrant: '', formation: 'en_cours' });
        setDialog({ action, rows, ...extra });
    };
    const selectedRows = dossiers.data.filter(d => selected.includes(d.id));
    const closed = campagne && !campagne.archivee_at && (campagne.statut === 'fermee' || (campagne.statut === 'ouverte' && campagne.date_fermeture.slice(0, 10) < new Date().toISOString().slice(0, 10)));
    const editable = (d) => d.peut_corriger && ['brouillon', 'a_corriger'].includes(d.suivi_sacrement.etape);
    const controllable = (d) => d.peut_controler && ['soumis', 'controle', 'a_corriger'].includes(d.suivi_sacrement.etape);
    const archivable = (d) => droits.admin && ['celebre', 'refuse', 'annule', 'reporte'].includes(d.suivi_sacrement.etape);
    const selectable = (d) => !campagne?.archivee_at && (controllable(d) || archivable(d));
    const submit = (e) => {
        e.preventDefault();
        if (dialog.action === 'creation' && sourceMembre !== 'famille') return;
        if (dialog.action === 'creation') return post('/dossiers', { membre_id: candidate, type_acte: type, details, pieces_jointes: files, brouillon: dialog.draft || false });
        if (dialog.action === 'campagne') return post('/campagnes', { ...campaignForm, id: campagne?.id, action: dialog.campaignAction });
        if (dialog.action === 'refuser_candidat') return post(`/listes/${dialog.list.id}/candidats/${dialog.candidate.id}/refuser`, { commentaire: comment });
        if (dialog.action === 'listes') return post('/listes/validation-groupee', { campagne_id: campagne.id, ids: dialog.batch.map(list => list.id), commentaire: comment });
        if (dialog.action === 'liste') return post(`/listes/${dialog.list.id}/decision`, { decision: dialog.decision, commentaire: comment, statut: dialog.list.statut });
        if (dialog.action === 'reprendre') return post('/reprendre', { campagne_id: campagne.id, ids: dialog.rows.map(d => d.id), commentaire: comment });
        if (dialog.action === 'transmettre') return post('/transmettre', { campagne_id: campagne.id });
        const payload = { campagne_id: campagne.id, ids: dialog.rows.map(d => d.id), action: dialog.action, commentaire: comment,
            revisions: Object.fromEntries(dialog.rows.map(d => [d.id, d.suivi_sacrement.revision])) };
        if (['corriger', 'soumettre'].includes(dialog.action)) { payload.details = details; payload.pieces_jointes = files; }
        if (['celebrer','planifier','rectifier'].includes(dialog.action)) Object.assign(payload, celebration);
        post('/actions', payload);
    };
    const openCampaign = (action) => {
        setCampaignForm({ annee: campagne?.annee || new Date().getFullYear(), titre: action === 'ouvrir' ? '' : campagne?.titre || '',
            date_ouverture: action === 'ouvrir' ? '' : campagne?.date_ouverture?.slice(0, 10) || '',
            date_fermeture: action === 'ouvrir' ? '' : campagne?.date_fermeture?.slice(0, 10) || '', motif_reouverture: '' });
        open('campagne', [], { campaignAction: action });
    };
    return <div className="max-w-7xl mx-auto p-4 md:p-8 text-slate-800 space-y-6 min-h-screen">
        <Head title="Baptême et première communion" />
        {flash.success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{flash.success}</div>}
        <header className="flex flex-wrap justify-between gap-4 items-start bg-white border border-slate-200 border-t-4 border-t-blue-700 rounded-2xl p-5 md:p-6 shadow-sm">
            <div><nav aria-label="Navigation des sacrements" className="flex flex-wrap items-center gap-4"><button type="button" onClick={goBack} className={secondary} aria-label="Revenir à la page précédente">← Retour</button><Link href={withBasePath('', '/dashboard')} className="text-sm text-emerald-800 hover:underline">Tableau de bord</Link></nav><h1 className="text-2xl md:text-3xl font-bold mt-3 text-slate-900">Baptême et première communion</h1><p className="text-slate-600 mt-2 leading-relaxed">Inscriptions familiales, validation des listes et registre des célébrations.</p></div>
            {droits.inscrire && campagne?.est_ouverte && <button className={button} onClick={() => open('creation')}>{droits.conducteur ? 'Inscrire un membre' : 'Inscrire un membre de ma famille'}</button>}
        </header>
        {Object.keys(errors).length > 0 && <div role="alert" className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-800">{Object.entries(errors).map(([key, error]) => <p key={key}>{error}</p>)}</div>}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center"><label className="flex-1 min-w-48">Campagne<EnhancedSelect className={input} value={campagne?.id || ''} onChange={e => filter({ campagne_id: e.target.value, page: 1 })}><option value="" disabled>Aucune campagne</option>{campagnes.map(c => <option key={c.id} value={c.id}>{c.annee} — {c.titre}{c.archivee_at ? ' (archivée)' : ''}</option>)}</EnhancedSelect></label>
                {campagne && <div className="text-sm"><strong>{campagne.archivee_at ? 'Archivée — lecture seule' : campagne.est_ouverte ? 'Inscriptions ouvertes' : 'Inscriptions fermées ou à venir'}</strong><p>Du {date(campagne.date_ouverture)} au {date(campagne.date_fermeture)}</p></div>}
            </div>
            {droits.admin && <div className="flex flex-wrap gap-2"><button className={button} onClick={() => openCampaign('ouvrir')}>Nouvelle campagne</button>{campagne && !campagne.archivee_at && <><button className={secondary} onClick={() => openCampaign(campagne.est_ouverte ? 'fermer' : 'reouvrir')}>{campagne.est_ouverte ? 'Fermer les inscriptions' : 'Réouvrir les inscriptions'}</button><button className={secondary} onClick={() => openCampaign('archiver')}>Archiver la campagne</button></>}</div>}
            {droits.conducteur && campagne && <div className="bg-emerald-50 p-3 rounded-lg text-sm space-y-2"><p>Vérifiez la FIMECO familiale et l’assiduité, puis validez les candidats individuellement ou par sélection. La décision vous appartient.</p><button disabled={!closed || busy} className={button} onClick={() => open('transmettre')}>Transmettre la liste de ma classe</button><p className="text-slate-600">Transmission après fermeture uniquement, lorsque tous les dossiers soumis ont une décision. Les brouillons ne sont pas des inscriptions soumises.</p></div>}
        </section>
        <section className="space-y-4 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><ClipboardList size={22}/></span><div><h2 className="text-xl font-semibold">Dossiers d’inscription <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{dossiers.total}</span></h2><p className="mt-1 text-sm text-slate-500">Recherchez un candidat et suivez l’avancement de sa demande.</p></div></div>
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100" onSubmit={e => { e.preventDefault(); filter({ search }); }}>
                <input aria-label="Rechercher un candidat" placeholder="Nom du candidat" value={search} onChange={e => setSearch(e.target.value)} className={`${input} !w-auto`} /><button className={secondary}>Rechercher</button>
                <EnhancedSelect aria-label="État du dossier" className={`${input} !w-auto`} value={filters.etape || ''} onChange={e => filter({ etape: e.target.value })}><option value="">Tous les états</option>{Object.entries(labels).slice(0, 13).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</EnhancedSelect>
                <EnhancedSelect aria-label="Sacrement" className={`${input} !w-auto`} value={filters.type_acte || ''} onChange={e => filter({ type_acte: e.target.value })}><option value="">Tous les sacrements</option>{Object.entries(types).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</EnhancedSelect>
                {classes.length > 0 && <EnhancedSelect aria-label="Classe" className={`${input} !w-auto`} value={filters.classe_id || ''} onChange={e => filter({ classe_id: e.target.value })}><option value="">Toutes les classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</EnhancedSelect>}
            </form>
            {selected.length > 0 && <div className="flex flex-wrap gap-2 p-3 bg-emerald-50 rounded-lg items-center"><span>{selected.length} sélectionné(s)</span>{droits.conducteur && <><button disabled={busy || !selectedRows.every(d => controllable(d) && d.suivi_sacrement.etape !== 'a_corriger')} className={button} onClick={() => open('valider', selectedRows)}>Valider la sélection</button><button disabled={busy || !selectedRows.every(controllable)} className={secondary} onClick={() => open('retourner', selectedRows)}>Demander des corrections</button><button disabled={busy || !selectedRows.every(controllable)} className={secondary} onClick={() => open('exclure', selectedRows)}>Exclure avec motif</button></>}{droits.admin && <button disabled={busy || !selectedRows.every(archivable)} className={button} onClick={() => open('archiver', selectedRows)}>Archiver la sélection</button>}</div>}
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr><th className="p-3"><input aria-label="Sélectionner les dossiers disponibles de cette page" type="checkbox" checked={dossiers.data.some(selectable) && dossiers.data.filter(selectable).every(d => selected.includes(d.id))} onChange={e => setSelected(e.target.checked ? dossiers.data.filter(selectable).map(d => d.id) : [])}/></th><th className="p-3">Candidat</th><th className="p-3">Contrôle du conducteur</th><th className="p-3">État et actions</th></tr></thead><tbody>
                {dossiers.data.map(d => <tr key={d.id} className="border-t align-top"><td className="p-3">{selectable(d) && <input aria-label={`Sélectionner ${d.membre?.prenom} ${d.membre?.nom}`} type="checkbox" checked={selected.includes(d.id)} onChange={e => setSelected(e.target.checked ? [...selected, d.id] : selected.filter(id => id !== d.id))}/>}</td><td className="p-3 min-w-48"><p className="font-semibold">{d.membre?.prenom} {d.membre?.nom}</p><p>{types[d.type_acte]}</p>{d.bapteme_a_verifier && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Baptême à vérifier</span>}<p className="text-slate-600">{d.classe?.nom} · {d.reference}</p><button className="text-emerald-800 underline mt-2" onClick={() => open('consulter', [d])}>Dossier et historique</button></td><td className="p-3 min-w-64"><Indicators value={d.indicateurs || d.suivi_sacrement.controle}/>{d.indicateurs && d.suivi_sacrement.controle && <details className="mt-2"><summary className="cursor-pointer text-emerald-800">Données lors de la validation</summary><Indicators value={d.suivi_sacrement.controle}/></details>}</td><td className="p-3 min-w-56"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${['admis','celebre','controle'].includes(d.suivi_sacrement.etape) ? 'bg-emerald-100 text-emerald-900' : ['refuse','annule'].includes(d.suivi_sacrement.etape) ? 'bg-rose-50 text-rose-800' : 'bg-blue-50 text-blue-900'}`}>{labels[d.suivi_sacrement.etape]}</span>{d.suivi_sacrement.preparation && <p className="text-xs mt-1">Cérémonie prévue le {date(d.suivi_sacrement.preparation.date)} à {d.suivi_sacrement.preparation.lieu} · Préparation : {d.suivi_sacrement.preparation.formation.replace('_', ' ')}</p>}{d.suivi_sacrement.observation && <p className="mt-1 text-slate-600 whitespace-pre-wrap">{d.suivi_sacrement.observation}</p>}<div className="flex flex-wrap gap-2 mt-2">
                    {!campagne?.archivee_at && <>
                        {editable(d) && <button className={button} onClick={() => open(d.suivi_sacrement.etape === 'brouillon' ? 'soumettre' : 'corriger', [d])}>Compléter et soumettre</button>}
                        {((d.peut_corriger && ['brouillon','soumis','a_corriger','controle'].includes(d.suivi_sacrement.etape)) || (droits.admin && closed && d.suivi_sacrement.etape === 'brouillon')) && <button className={secondary} onClick={() => open('annuler', [d])}>Annuler</button>}
                        {controllable(d) && <>{d.suivi_sacrement.etape !== 'a_corriger' && <button className={button} onClick={() => open('valider', [d])}>Valider</button>}<button className={secondary} onClick={() => open('retourner', [d])}>À corriger</button><button className={secondary} onClick={() => open('exclure', [d])}>Exclure</button></>}
                        {droits.pasteur && ['admis','partiel'].includes(d.suivi_sacrement.etape) && <><button className={secondary} onClick={() => open('planifier', [d])}>Préparation / cérémonie</button><button className={button} onClick={() => open('celebrer', [d])}>Confirmer le sacrement reçu</button><button className={secondary} onClick={() => open('reporter', [d])}>Absent / reporter</button></>}
                        {archivable(d) && <button className={secondary} onClick={() => open('archiver', [d])}>Archiver</button>}
                    </>}
                    {droits.pasteur && Object.keys(d.suivi_sacrement.celebrations || {}).length > 0 && <button className={secondary} onClick={() => open('rectifier', [d])}>Rectifier un certificat</button>}
                    {Object.keys(d.suivi_sacrement.celebrations || {}).map(t => <a className="text-emerald-800 underline" key={t} href={url(`/dossiers/${d.id}/certificat/${t}`)}>Certificat : {types[t]}</a>)}
                </div></td></tr>)}
                {!dossiers.data.length && <tr><td colSpan="4" className="p-8 text-center text-slate-600">Aucun dossier pour ces critères.</td></tr>}
            </tbody></table></div>
            <nav className="flex gap-2" aria-label="Pagination">{dossiers.prev_page_url && <Link className={secondary} href={dossiers.prev_page_url}>Précédent</Link>}<span className="p-2">Page {dossiers.current_page} / {dossiers.last_page}</span>{dossiers.next_page_url && <Link className={secondary} href={dossiers.next_page_url}>Suivant</Link>}</nav>
        </section>
        {listes.length > 0 && <section id="listes-transmises" className="space-y-3"><h2 className="text-xl font-semibold text-white">Listes transmises et versions</h2>{droits.bureau && !campagne?.archivee_at && pendingLists.length > 0 && <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-3"><h3 className="font-semibold">Validation groupée · {pendingLists.length} liste(s) en attente</h3><p className="text-sm text-slate-600">Validez les listes de plusieurs classes en une seule opération.</p><div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => open('listes', [], { batch: pendingLists })}>Valider toutes les listes → Pasteur</button><button className={secondary} disabled={busy || !selectedLists.length} onClick={() => open('listes', [], { batch: pendingLists.filter(list => selectedLists.includes(list.id)) })}>Valider la sélection ({selectedLists.length})</button></div><div className="grid sm:grid-cols-2 gap-2">{pendingLists.map(list => <label className="flex gap-3 items-center rounded-lg border p-3 text-sm" key={list.id}><input type="checkbox" checked={selectedLists.includes(list.id)} onChange={e => setSelectedLists(e.target.checked ? [...selectedLists, list.id] : selectedLists.filter(id => id !== list.id))}/>{list.classe?.nom} · v{list.version} · {list.candidats.length} candidat(s)</label>)}</div></div>}{listes.map(list => <details key={list.id} className="bg-white border rounded-xl p-4"><summary className="cursor-pointer font-semibold">{list.classe?.nom} — version {list.version} — {labels[list.statut]} — {list.candidats.length} candidat(s)</summary><div className="mt-4 space-y-4"><a href={url(`/listes/${list.id}/pdf`)} className="text-emerald-800 underline">Télécharger la liste PDF</a><div className="space-y-3">{list.candidats.map(c => <div className="border-b pb-2" key={c.id}><p><strong>{c.nom}</strong> · {types[c.type]} · {c.reference}</p>{list.journal.some(j => j.action === 'refus_candidat' && Number(j.candidat_id) === Number(c.id)) ? <p className="my-2 text-sm font-semibold text-red-700">Refusé individuellement par le bureau</p> : droits.bureau && list.statut === 'bureau' && !campagne?.archivee_at && <button className="my-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" onClick={() => open('refuser_candidat', [], { list, candidate: c })}>Refuser ce candidat</button>}<Indicators value={c.controle}/>{c.controle?.observation && <p>{c.controle.observation}</p>}</div>)}</div><ol className="space-y-1 text-sm">{list.journal.map((j,i) => <li key={i}>{date(j.date)} · {j.acteur} · {j.action} {j.commentaire && `— ${j.commentaire}`}</li>)}</ol>{!campagne?.archivee_at && ((droits.bureau && list.statut === 'bureau') || (droits.pasteur && list.statut === 'pasteur')) && <div className="flex flex-wrap gap-2">{['valider','retourner','refuser'].map(decision => <button key={decision} className={decision === 'valider' ? button : secondary} onClick={() => open('liste', [], { list, decision })}>{decision === 'valider' ? (list.statut === 'bureau' ? 'Valider et transmettre au pasteur' : 'Admettre les candidats') : decision === 'retourner' ? 'Retourner au conducteur' : 'Refuser la liste'}</button>)}</div>}</div></details>)}</section>}
        {droits.admin && anciensDossiers.length > 0 && <details className="border rounded-xl p-4 bg-white"><summary>Reprendre les anciens dossiers en cours ({anciensDossiers.length} affichés au maximum)</summary><p className="text-sm my-3">La reprise conserve le dossier et son historique, puis impose un nouveau contrôle par le conducteur dans la campagne sélectionnée. Les anciens dossiers célébrés restent dans les archives liturgiques.</p>{anciensDossiers.map(d => <div className="flex justify-between gap-2 border-t py-2 text-sm" key={d.id}><span>{d.reference} · {d.membre?.prenom} {d.membre?.nom} · {types[d.type_acte]}</span><button disabled={!campagne?.est_ouverte} className={secondary} onClick={() => open('reprendre', [d])}>Reprendre dans cette campagne</button></div>)}</details>}
        {droits.admin && campagne?.journal?.length > 0 && <details className="border border-slate-200 rounded-xl p-4 bg-white"><summary>Historique de la campagne</summary>{campagne.journal.map((j,i) => <p key={i} className="text-sm mt-2">{date(j.date)} · {j.action} · acteur #{j.acteur_id} {j.motif || j.commentaire}</p>)}</details>}
        {dialog && <div className="fixed inset-0 z-[100] bg-slate-950/60 overflow-y-auto p-3 sm:p-6 flex items-start justify-center" onClick={() => !busy && setDialog(null)}><section role="dialog" aria-modal="true" aria-label="Action sur les inscriptions" className="bg-white text-slate-900 rounded-2xl shadow-2xl p-5 sm:p-7 w-full max-w-3xl my-4 space-y-5 border border-slate-200" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center border-b border-slate-200 pb-5"><h2 className="font-bold text-lg">{dialog.action === 'creation' ? (droits.conducteur ? 'Inscription d’un membre' : 'Inscription familiale') : dialog.action === 'consulter' ? 'Dossier et historique' : 'Confirmer l’action'}</h2><button type="button" aria-label="Fermer" disabled={busy} onClick={() => setDialog(null)}>✕</button></div>
            {Object.values(errors).length > 0 && <div role="alert" className="text-red-700">{Object.values(errors).map((e,i) => <p key={i}>{e}</p>)}</div>}
            {dialog.action === 'consulter' ? <DossierDetails dossier={dialog.rows[0]}/> : <form onSubmit={submit} className="space-y-6">
                {dialog.rows.length > 0 && <p>{dialog.rows.length} dossier(s) : {dialog.rows.map(d => `${d.membre?.prenom} ${d.membre?.nom}`).join(', ')}</p>}
                {dialog.action === 'creation' && type === 'premiere_communion' && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Vous pouvez enregistrer cette inscription même si le baptême n’est pas encore renseigné. Le conducteur devra le vérifier avant de valider le dossier.</p>}
                {dialog.action === 'valider' && dialog.rows.filter(d => d.type_acte === 'premiere_communion').map(d => <div key={d.id} className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm"><strong>{d.membre?.prenom} {d.membre?.nom} — Baptême déclaré</strong><p>Date : {date(d.details?.bapteme_date)} · Lieu : {d.details?.bapteme_lieu || 'Non renseigné'}</p>{d.bapteme_a_verifier && <p className="text-amber-900">À vérifier avant confirmation.</p>}</div>)}
                {dialog.action === 'valider' && <p className="bg-emerald-50 p-3 rounded">Je confirme avoir consulté la situation FIMECO familiale et l’assiduité de chaque candidat sélectionné. Pour une première communion, je confirme également avoir vérifié les informations du baptême déclaré.</p>}
                {dialog.action === 'transmettre' && <p>Transmettre les candidats validés de votre classe ? Une version figée de la liste et des contrôles sera conservée.</p>}
                {dialog.action === 'refuser_candidat' && <p className="rounded-xl bg-red-50 p-4 text-red-900">Refuser l’inscription de <strong>{dialog.candidate.nom}</strong> dans la liste de {dialog.list.classe?.nom} ? Les autres candidats restent en attente de décision.</p>}
                {dialog.action === 'listes' && <div className="rounded-xl bg-emerald-50 p-4 space-y-2"><p className="font-semibold">Valider et transmettre au pasteur {dialog.batch.length} liste(s), soit {dialog.batch.reduce((sum, list) => sum + list.candidats.length, 0)} candidat(s) ?</p><ul className="list-disc pl-5 text-sm">{dialog.batch.map(list => <li key={list.id}>{list.classe?.nom} · version {list.version} · {list.candidats.length} candidat(s)</li>)}</ul><p className="text-sm">Chaque liste conservera son historique de validation.</p></div>}
                {dialog.action === 'liste' && <p>{dialog.decision === 'valider' ? 'Valider' : dialog.decision === 'retourner' ? 'Retourner au conducteur' : 'Refuser'} la liste de {dialog.list.classe?.nom}, version {dialog.list.version} ({dialog.list.candidats.length} candidats).</p>}
                {dialog.action === 'creation' && <><fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold text-slate-900">01 · Choisir le candidat</legend><div className={`grid gap-3 ${ajoutMembreUrl ? 'sm:grid-cols-2' : ''}`}><MemberChoice value="famille" current={sourceMembre} onChange={setSourceMembre} icon={Users} title={droits.conducteur ? 'Membre de ma classe ou famille' : 'Membre de ma famille'} description="Retrouvez une fiche existante. Les contacts sont préremplis."/>{ajoutMembreUrl && <MemberChoice value="nouveau" current={sourceMembre} onChange={setSourceMembre} icon={UserPlus} title="Ajouter une personne" description="Créez sa fiche familiale avant de poursuivre l’inscription."/>}</div></fieldset>{sourceMembre === 'famille' && <label className="block space-y-2 text-sm font-semibold">{droits.conducteur ? 'Membre à inscrire' : 'Membre de ma famille'}<EnhancedSelect required className={input} value={candidate} onChange={e => setCandidate(e.target.value)}><option value="">Choisir un candidat</option>{membres.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}</EnhancedSelect></label>}<label className="block space-y-2 text-sm font-semibold">Sacrement demandé<EnhancedSelect className={input} value={type} onChange={e => setType(e.target.value)}>{Object.entries(types).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</EnhancedSelect></label>{sourceMembre === 'nouveau' && <div className="rounded-lg bg-blue-50 p-4 space-y-3"><p>Ajoutez d’abord cette personne à votre famille. Après l’enregistrement de sa fiche, vous reviendrez ici avec son nom sélectionné pour terminer l’inscription.</p><Link className={`${button} inline-block`} href={`${ajoutMembreUrl}&sacrement=${encodeURIComponent(type)}`}>Ajouter à ma famille et poursuivre</Link><p className="text-sm text-slate-600">Si cette personne possède déjà une fiche dans une autre famille, faites régulariser son rattachement avant de l’inscrire.</p></div>}{sourceMembre === 'famille' && <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium"><input className="h-5 w-5 rounded border-slate-300 accent-blue-600" type="checkbox" checked={!!dialog.draft} onChange={e => setDialog({ ...dialog, draft: e.target.checked })}/><span>Enregistrer comme brouillon<span className="block text-xs font-normal text-slate-600 mt-1">Complétez les informations et soumettez le dossier plus tard.</span></span></label>}</>}
                {(['corriger','soumettre'].includes(dialog.action) || (dialog.action === 'creation' && sourceMembre === 'famille')) && <>
                    {(dialog.action === 'creation' ? type : dialog.rows[0]?.type_acte) === 'premiere_communion' && <fieldset className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                        <legend className="px-2 text-sm font-semibold text-blue-950">Baptême déjà reçu</legend>
                        <p className="text-sm text-slate-600">Renseignez les informations connues. Elles seront vérifiées par le conducteur avant d’être enregistrées sur la fiche du membre. Vous pouvez les compléter plus tard.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="block text-sm font-medium">Date du baptême<input type="date" className={`${input} mt-1`} value={details.bapteme_date} onChange={e => setDetails({ ...details, bapteme_date: e.target.value })}/></label>
                            <label className="block text-sm font-medium">Lieu du baptême<input className={`${input} mt-1`} maxLength={255} placeholder="Église, paroisse ou ville" value={details.bapteme_lieu} onChange={e => setDetails({ ...details, bapteme_lieu: e.target.value })}/></label>
                        </div>
                        <p className="text-xs text-slate-600">Vous pouvez joindre un certificat dans les pièces justificatives ci-dessous.</p>
                    </fieldset>}
                    <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <legend className="px-2 text-sm font-semibold text-slate-900">02 · Coordonnées de contact</legend>
                        <p className="text-sm text-slate-600">Les contacts sont repris de la fiche du membre, puis de sa famille si nécessaire. Vous pouvez les ajuster pour cette demande.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[['telephone', 'Téléphone principal'], ['telephone2', 'Autre téléphone'], ['email', 'Adresse e-mail']].map(([k, label]) => <label key={k} className={`block text-sm font-medium text-slate-800 ${k === 'email' ? 'sm:col-span-2' : ''}`}>{label}<input type={k === 'email' ? 'email' : 'tel'} className={`${input} mt-1`} value={details[k]} maxLength={k === 'email' ? 255 : 50} autoComplete={k === 'email' ? 'email' : 'tel'} onChange={e => setDetails({ ...details, [k]: e.target.value })}/></label>)}
                        </div>
                    </fieldset>
                    <fieldset className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <legend className="px-2 text-sm font-semibold text-slate-900">03 · Renseignements complémentaires</legend>
                        <div className="grid sm:grid-cols-2 gap-4">{Object.entries({ parents: 'Parents', parrain: 'Parrain', marraine: 'Marraine' }).map(([k,v]) => <label key={k} className="block text-sm font-medium text-slate-800">{v}<input className={`${input} mt-1`} value={details[k]} maxLength={255} onChange={e => setDetails({ ...details, [k]: e.target.value })}/></label>)}</div>
                        <label className="block text-sm font-medium text-slate-800">Informations complémentaires<textarea rows={3} className={`${input} mt-1`} maxLength="2000" value={details.observations} onChange={e => setDetails({ ...details, observations: e.target.value })}/></label>
                    </fieldset>
                    <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-800">Pièces justificatives<span className="block text-sm font-normal text-slate-600 mt-1 mb-3">PDF, JPG ou PNG · 5 Mo maximum par fichier</span><input className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-blue-900" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFiles(Array.from(e.target.files))}/></label>
                </>}
                {['celebrer','planifier','rectifier'].includes(dialog.action) && <><p>{dialog.action === 'planifier' ? 'Planifiez la cérémonie et renseignez le suivi de préparation.' : dialog.action === 'rectifier' ? 'La version précédente du certificat sera conservée. La rectification doit être motivée.' : 'Confirmez uniquement un sacrement effectivement reçu. Le certificat et la fiche du membre seront mis à jour.'}</p><label className="block">Sacrement reçu<EnhancedSelect className={input} value={celebration.sacrement} onChange={e => setCelebration({ ...celebration, sacrement: e.target.value })}>{Object.entries(types).filter(([k]) => k !== 'bapteme_premiere_communion' && (dialog.rows[0].type_acte === k || dialog.rows[0].type_acte === 'bapteme_premiere_communion')).map(([k,v]) => <option key={k} value={k}>{v}{dialog.rows[0].suivi_sacrement.celebrations?.[k] ? ' (déjà confirmé)' : ''}</option>)}</EnhancedSelect></label>{['date','lieu','celebrant'].map(k => <label className="block" key={k}>{k === 'date' ? (dialog.action === 'planifier' ? 'Date prévue' : 'Date réelle') : k === 'lieu' ? 'Lieu' : 'Célébrant'}<input required className={input} type={k === 'date' ? 'date' : 'text'} value={celebration[k]} onChange={e => setCelebration({ ...celebration, [k]: e.target.value })}/></label>)}</>}
                {dialog.action === 'planifier' && <label className="block">Préparation / catéchèse<EnhancedSelect className={input} value={celebration.formation} onChange={e => setCelebration({ ...celebration, formation: e.target.value })}><option value="en_cours">En cours</option><option value="terminee">Terminée</option><option value="non_requise">Non requise</option></EnhancedSelect></label>}
                {dialog.action === 'campagne' && <><p>Action : {dialog.campaignAction} la campagne.</p>{['ouvrir','reouvrir'].includes(dialog.campaignAction) && <>{['titre','annee','date_ouverture','date_fermeture'].map(k => <label className="block" key={k}>{({titre:'Titre',annee:'Année',date_ouverture:'Ouverture',date_fermeture:'Fermeture'})[k]}<input required className={input} type={k.startsWith('date_') ? 'date' : k === 'annee' ? 'number' : 'text'} value={campaignForm[k]} onChange={e => setCampaignForm({ ...campaignForm, [k]: e.target.value })}/></label>)}{dialog.campaignAction === 'reouvrir' && <label className="block">Motif de réouverture<textarea required className={input} value={campaignForm.motif_reouverture} onChange={e => setCampaignForm({ ...campaignForm, motif_reouverture: e.target.value })}/></label>}</>}</>}
                {!['creation','campagne','transmettre','corriger','soumettre'].includes(dialog.action) && <label className="block">Observation / motif<textarea required={['retourner','exclure','annuler','reporter','rectifier','reprendre','refuser_candidat'].includes(dialog.action) || (dialog.action === 'liste' && dialog.decision !== 'valider')} maxLength="2000" className={input} value={comment} onChange={e => setComment(e.target.value)}/></label>}
                <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white py-4"><button type="button" className={secondary} disabled={busy} onClick={() => setDialog(null)}>Fermer</button>{(dialog.action !== 'creation' || sourceMembre === 'famille') && <button className={button} disabled={busy}>{busy ? 'Enregistrement…' : dialog.action === 'creation' ? (dialog.draft ? 'Enregistrer le brouillon' : 'Soumettre l’inscription') : 'Confirmer'}</button>}</div>
            </form>}
        </section></div>}
    </div>;
}
