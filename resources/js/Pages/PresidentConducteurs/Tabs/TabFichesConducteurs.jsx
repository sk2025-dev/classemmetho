import DashboardFilter from "./DashboardFilter";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { withBasePath } from '../../../Utils/urlHelper';

const endpoint = withBasePath('', '/president-conducteurs/fiches-conducteurs');
export default function TabFichesConducteurs() {
    const [rows, setRows] = useState([]);
    const [title, setTitle] = useState('Inscription cours de baptême et première communion');
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [classe, setClasse] = useState('');
    const [sacrement, setSacrement] = useState('');
    const [statut, setStatut] = useState('');
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setBusy(true); setError('');
        axios.get(endpoint, { signal: controller.signal }).then(({ data }) => { setRows(data.fiches || []); setTitle(data.title); })
            .catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Impossible de charger les fiches.'); })
            .finally(() => { if (!controller.signal.aborted) setBusy(false); });
        return () => controller.abort();
    }, [refresh]);
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filtered = rows.filter(row => (!classe || row.classe === classe) && (!sacrement || row.type === sacrement) && (!statut || row.statut === statut) && Object.values(row).some(value => normalize(value).includes(normalize(search.trim()))));
    return <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5 text-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-4"><img src={withBasePath('', '/images/metho.jpg')} alt="Église méthodiste" className="h-16 w-16 object-contain"/><h2 className="text-xl font-bold">{title}</h2><img src={withBasePath('', '/images/logo.png')} alt="Jubilé de Cocody" className="h-16 w-16 object-contain"/></div><p className="mt-1 text-sm text-slate-600">Les inscriptions transmises au baptême et à la première communion sont regroupées pour toutes les classes.</p></div>
            <div className="flex gap-2"><button disabled={busy} onClick={() => setRefresh(value => value + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Actualiser</button><a href={`${endpoint}?pdf=1`} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white">PDF de toutes les classes</a></div></div>
        <input type="search" aria-label="Rechercher dans les fiches des conducteurs" placeholder="Candidat, classe, conducteur, référence…" className="w-full rounded-xl border border-slate-300 p-3 text-sm" value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="flex flex-wrap gap-3">{[['Classe', 'classe', classe, setClasse], ['Sacrement', 'type', sacrement, setSacrement], ['État', 'statut', statut, setStatut]].map(([label, key, value, change]) => <label key={key} className="space-y-1 text-xs font-semibold text-slate-600"><span>{label}</span><DashboardFilter value={value} onChange={e => change(e.target.value)}><option value="">Tous</option>{[...new Set(rows.map(row => row[key]))].filter(Boolean).sort().map(option => <option key={option} value={option}>{option}</option>)}</DashboardFilter></label>)}<button className="self-end rounded-lg border px-3 py-3 text-sm" onClick={() => { setSearch(''); setClasse(''); setSacrement(''); setStatut(''); }}>Réinitialiser</button></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
        {busy ? <p role="status">Chargement des fiches…</p> : <><p className="text-sm text-slate-600">{filtered.length} demande(s) affichée(s) sur {rows.length} · Le PDF comprend toutes les classes.</p><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Référence','Candidat','Contact','Classe','Conducteur','Sacrement','Date souhaitée','État'].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">{['reference','candidat','contact','classe','conducteur','type','date','statut'].map(key => <td key={key} className={`p-3 ${key === 'classe' ? 'font-semibold text-emerald-800' : ''}`}>{row[key] || '—'}</td>)}</tr>)}{!filtered.length && <tr><td colSpan={8} className="p-8 text-center text-slate-500">{search ? 'Aucune fiche ne correspond à cette recherche.' : 'Aucune fiche transmise pour le moment.'}</td></tr>}</tbody></table></div></>}
    </section>;
}
