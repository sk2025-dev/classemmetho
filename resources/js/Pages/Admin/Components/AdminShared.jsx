import React, { useState } from "react";
import { Link } from "@inertiajs/react";

// --- Styles Globaux ---
export const CustomStyles = () => (
    <style>
        {`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse-soft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
            .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
            .animate-pulse-soft { animation: pulse-soft 3s infinite ease-in-out; }
            .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1); }
        `}
    </style>
);

// --- Icônes ---
export const Icon = ({ name, className }) => {
    const icons = {
        plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
        lockOpen: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75m3.75 0v-6a4.5 4.5 0 10-9 0v6H6.75v.75c0 1.414.586 2.756 1.586 3.75-1.03 1.03-2.336 1.586-3.75 1.586H12v-1.5M13.5 10.5H18" />,
        lockClosed: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-9-3.75a4.5 4.5 0 019 0v3.75H21" />,
        camera: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z M18.75 10.5h.008v.008h-.008V10.5z" />,
        securityLock: <g fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a3 3 0 106 0 3 3 0 00-6 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.75h3" /></g>,
        familles: <path strokeLinecap="round" strokeLinejoin="round" d="M15 5.25a3 3 0 11-6 0 3 3 0 016 0z M4 19.5a6.75 6.75 0 0113.5 0" />,
        close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
        edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
        delete: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
        eye: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />,
        clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
        check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
        blocked: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-2.98M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
        swap: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />,
        venusMars: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 9.75a6 6 0 00-6 6v1.5m6-7.5a6 6 0 016 6v1.5m0 0a4.5 4.5 0 01-4.5 4.5H9" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            {icons[name]}
        </svg>
    );
};

// --- Composants UI ---
export const ActionButtons = ({ onEdit, onAssign, onDelete, onToggle, rowData }) => (
    <div className="flex items-center justify-center gap-2">
        {onToggle && (
            <button onClick={() => onToggle(rowData)} className={`group p-2.5 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 ${rowData.statut === 'Actif' ? 'bg-green-50 text-green-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-rose-600 hover:text-white shadow-sm hover:shadow-red-500/30' : 'bg-gray-200 text-gray-600 hover:bg-gradient-to-br hover:from-green-500 hover:to-emerald-600 hover:text-white shadow-sm hover:shadow-green-500/30'}`} title={rowData.statut === 'Actif' ? 'Désactiver' : 'Activer'}><Icon name="securityLock" className="w-4 h-4" /></button>
        )}
        {onEdit && (
            <button onClick={() => onEdit(rowData)} className="group p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-blue-500/30 transform hover:-translate-y-0.5" title="Éditer"><Icon name="edit" className="w-4 h-4" /></button>
        )}
        {onAssign && (
            <button onClick={() => onAssign(rowData)} className="group p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-gradient-to-br hover:from-teal-500 hover:to-emerald-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-teal-500/30 transform hover:-translate-y-0.5" title="Transférer"><Icon name="swap" className="w-4 h-4" /></button>
        )}
        {onDelete && (
            <button onClick={() => onDelete(rowData)} className="group p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-gradient-to-br hover:from-red-500 hover:to-rose-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-500/30 transform hover:-translate-y-0.5" title="Supprimer"><Icon name="delete" className="w-4 h-4" /></button>
        )}
    </div>
);

export function StatCard({ label, value, theme, iconName }) {
    const themeConfig = {
        blue: { gradient: "from-blue-500 to-indigo-600", border: "border-blue-500", shadow: "shadow-blue-500/20" },
        yellow: { gradient: "from-amber-400 to-orange-500", border: "border-orange-500", shadow: "shadow-orange-500/20" },
        green: { gradient: "from-emerald-500 to-green-600", border: "border-emerald-500", shadow: "shadow-emerald-500/20" },
        red: { gradient: "from-red-500 to-rose-600", border: "border-red-500", shadow: "shadow-red-500/20" },
        purple: { gradient: "from-purple-500 to-violet-600", border: "border-purple-500", shadow: "shadow-purple-500/20" },
        gray: { gradient: "from-slate-400 to-slate-500", border: "border-slate-400", shadow: "shadow-slate-400/20" }
    };
    const config = themeConfig[theme] || themeConfig.gray;
    return (
        <div className={`glass-panel p-6 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border-t-4 ${config.border} flex items-center justify-between group`}>
            <div className="flex flex-col justify-center">
                <div className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-1 group-hover:scale-105 transition-transform duration-300 origin-left">{value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">{label}</div>
            </div>
            <div className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center bg-gradient-to-br ${config.gradient} text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}><Icon name={iconName} className="w-7 h-7" /></div>
        </div>
    );
}

// --- Modals Génériques ---
export const ValidationModal = ({ isOpen, onClose, data, onApprove, onReject }) => {
    if (!isOpen || !data) return null;
    const isActe = !!data.type && !data.classe;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 bg-white/50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Icon name="eye" className="w-5 h-5" /></span>
                        Détails {isActe ? "de l'acte" : "de l'inscription"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><Icon name="close" className="w-5 h-5" /></button>
                </div>
                <div className="p-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 flex items-start gap-4">
                         <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm"><Icon name={isActe ? "check" : "familles"} className="w-5 h-5" /></div>
                         <div><span className="block text-sm font-bold text-gray-800 uppercase tracking-wide">Statut actuel</span><span className="text-xs text-gray-500">{data.statut}</span></div>
                    </div>
                    <div className="space-y-4">
                        {isActe ? [
                            { label: "Type", value: data.type }, { label: "Demandeur", value: data.demandeur }, { label: "Lieu", value: data.lieu }, { label: "Date proposée", value: data.dateProposee }, { label: "Date confirmée", value: data.dateConfirmee || "Non confirmée" }
                        ].map((field, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{field.label}</label>
                                <div className="text-gray-800 font-semibold text-sm text-right">{field.value}</div>
                            </div>
                        )) : [
                            { label: "Nom", value: data.famille || data.nom }, { label: "Classe", value: data.classe }, { label: "Type", value: data.type === 'family' ? 'Famille' : 'Individuel' }, { label: "Responsable", value: data.responsable }, { label: "Date d'inscription", value: data.date_de_creation || data.date }, { label: "Membres", value: data.membres }
                        ].map((field, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{field.label}</label>
                                <div className="text-gray-800 font-semibold text-sm">{field.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-4 justify-between items-center">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold transition shadow-md w-full sm:w-auto">Fermer</button>
                    {data.statut === "En attente" && (
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button type="button" onClick={onReject} className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 font-bold hover:bg-red-50 transition shadow-sm flex items-center justify-center gap-2"><Icon name="close" className="w-4 h-4" /> Rejeter</button>
                            <button type="button" onClick={onApprove} className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-md shadow-green-500/20 flex items-center justify-center gap-2"><Icon name="plus" className="w-4 h-4" /> Approuver</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GenericDetailModal = ({ isOpen, onClose, title, data, columns, renderRow, onCreate, createButtonText }) => {
    const [search, setSearch] = useState("");
    if (!isOpen) return null;
    const filteredData = data ? data.filter(item => { const searchStr = search.toLowerCase(); return (item.nom?.toLowerCase().includes(searchStr) || item.prenom?.toLowerCase().includes(searchStr) || item.email?.toLowerCase().includes(searchStr) || item.telephone?.toLowerCase().includes(searchStr)); }) : [];
    return (
        <div className="fixed inset-0 z-[60] flex flex-col w-full h-full" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
            <header className="glass-header shrink-0 py-6 w-full sticky top-0 z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/20"><Icon name="familles" className="w-5 h-5 text-white" /></div>
                        <div><h1 className="text-white font-bold text-lg tracking-tight">{title}</h1><p className="text-blue-100 text-sm font-light">Détails</p></div>
                    </div>
                    <button onClick={onClose} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md border border-blue-500"><Icon name="close" className="w-4 h-4" /> <span>Fermer</span></button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
                <div className="w-full">
                    <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm">
                            <div className="relative w-full md:w-96">
                                <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white/80 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 shadow-sm" />
                                <div className="absolute left-3 top-3 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            </div>
                            {onCreate && (
                                <button onClick={onCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"><Icon name="plus" className="w-4 h-4" />{createButtonText || "Ajouter"}</button>
                            )}
                        </div>
                        <div className="overflow-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-yellow-400 border-b-2 border-yellow-500">
                                    <tr>{columns.map((h, index) => (<th key={index} className="px-6 py-3 text-xs font-extrabold text-yellow-900 uppercase tracking-wider text-center">{h}</th>))}</tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white/60 backdrop-blur-sm">
                                    {filteredData.map((item, index) => (<tr key={index} className="hover:bg-white/90 transition duration-200">{renderRow(item, index)}</tr>))}
                                    {filteredData.length === 0 && (<tr><td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400 italic">Aucun résultat trouvé.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};