import React, { useState, useEffect, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import useToast from "../../../Hooks/useToast";
import ToastContainer from "../../../Components/ToastContainer";
import Select2Fonction from "../../../Components/Select2Fonction";
import Select2Relation from "../../../Components/Select2Relation";
import {
    User, Mail, Phone, Heart, Calendar, MapPin,
    Award, Gift, BookOpen, ChevronDown, ChevronUp, Check, X, Users, Briefcase
} from "lucide-react";

// --- CSS GLOBAL (identique à celui de la page utilisateur) ---
const GLOBAL_STYLES = `
    :root {
        --primary: #2563eb; --primary-hover: #1d4ed8;
        --success: #16a34a; --danger: #dc2626; --warning: #ca8a04;
        --glass-bg: rgba(255, 255, 255, 0.7); --glass-border: rgba(255, 255, 255, 0.5);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .glass-panel {
        background: var(--glass-bg); backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    .btn-success { background-color: var(--success); color: white; }
    .btn-success:hover { background-color: #15803d; }
    .btn-danger { background-color: var(--danger); color: white; }
    .btn-danger:hover { background-color: #b91c1c; }
    .btn-warning { background-color: var(--warning); color: white; }
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
    .btn-icon { padding: 0.5rem; border-radius: 0.5rem; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
    .btn-icon:hover { transform: translateY(-1px); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }

    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
    @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

    .stat-card { background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid #f3f4f6; }
    .stat-value { font-size: 1.875rem; font-weight: 800; margin: 0.25rem 0; }
    .stat-label { font-size: 0.875rem; color: #6b7280; font-weight: 600; }

    .filters-bar { border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    @media (min-width: 768px) { .filters-bar { flex-direction: row; align-items: center; justify-content: space-between; } }
    .filter-group { display: flex; gap: 0.5rem; flex: 1; flex-wrap: wrap; }
    .input-control { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; background-color: rgba(255, 255, 255, 0.8); font-size: 0.875rem; color: #111827; transition: ring 0.2s; }
    .input-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); outline: none; }
    .input-search-wrapper { position: relative; }
    .input-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 1.25rem; height: 1.25rem; }
    .input-search { padding-left: 2.5rem; }

    .table-container { background: var(--glass-bg); border-radius: 1rem; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--glass-border); display: flex; flex-direction: column; flex: 1; min-height: 500px; }
    .table-scroll { overflow-x: auto; width: 100%; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    thead { background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; position: sticky; top: 0; z-index: 10; }
    th { padding: 0.75rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    td { padding: 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; vertical-align: middle; }
    tr:hover td { background-color: rgba(255, 255, 255, 0.9); }

    .status-badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid; }
    .status-active { background-color: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
    .status-inactive { background-color: #fee2e2; color: #dc2626; border-color: #fecaca; }

    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem; background: white; border-top: 1px solid #e5e7eb; }
    .pagination-btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; transition: all 0.2s; }
    .pagination-btn:hover { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination-info { margin-right: 1rem; color: #6b7280; font-size: 0.875rem; }

    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

// --- Composant Alert Modal (identique à celui de la page utilisateur) ---
const AlertModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText = "Annuler", type = "warning" }) => {
    if (!isOpen) return null;

    const typeConfig = {
        warning: { icon: <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>, btnClass: 'btn-warning' },
        danger: { icon: <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, btnClass: 'btn-danger' },
        success: { icon: <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, btnClass: 'btn-success' }
    };
    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-t-4 border-yellow-500">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-full bg-white shadow-sm">{config.icon}</div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-gray-700">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:w-auto">{cancelText}</button>
                    <button onClick={onConfirm} className={`btn w-full sm:w-auto ${config.btnClass}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// --- Composant Actions SVG ---
const ActionButtonsSVG = ({ rowData, onEdit, onDelete, onView, onToggle }) => {
    return (
        <div className="flex items-center justify-center gap-2">
            <button onClick={onView} className="btn-icon" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", border: "2px solid rgba(37, 99, 235, 0.2)" }} title="Voir les détails">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button onClick={onEdit} className="btn-icon" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", border: "2px solid rgba(37, 99, 235, 0.2)" }} title="Modifier">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            {onToggle && (
                <button onClick={onToggle} className="p-2 rounded-lg transition-all" style={{ backgroundColor: rowData?.status === 'active' ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)", border: rowData?.status === 'active' ? "2px solid rgba(22, 163, 74, 0.2)" : "2px solid rgba(220, 38, 38, 0.2)" }} title={rowData?.status === 'active' ? 'Désactiver' : 'Activer'}>
                    {rowData?.status === 'active' ?
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> :
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    }
                </button>
            )}
            <button onClick={onDelete} className="btn-icon" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", border: "2px solid rgba(220, 38, 38, 0.2)" }} title="Supprimer">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};

// --- Components for Member Details ---
const InfoItem = ({ label, value, className = "", icon }) => (
    <div className={className}>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase mb-1">
            {icon && <span className="text-blue-500">{icon}</span>}
            {label}
        </label>
        <p className="text-sm font-semibold text-gray-900">{value || <span className="text-gray-400 italic">Non spécifié</span>}</p>
    </div>
);

const DetailCard = ({ title, icon, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            {icon && <span className="text-blue-600">{icon}</span>}
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{title}</h4>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const StatusBadge = ({ isActive }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
        {isActive ? 'Actif' : 'Inactif'}
    </span>
);

// Modal for viewing member details
// Helper pour formater les dates - gère tous les formats
const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === '' || dateString === null || dateString === undefined) return '-';

    try {
        // Créer un objet Date à partir de la string
        let date = new Date(dateString);

        // Si la date est invalide, essayer d'ajouter l'heure
        if (isNaN(date.getTime()) && typeof dateString === 'string' && dateString.length === 10) {
            date = new Date(dateString + 'T00:00:00Z');
        }

        // Vérifier si la date est valide
        if (isNaN(date.getTime())) return '-';

        // Formater en jj/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (e) {
        return '-';
    }
};

// Helper pour afficher les valeurs avec fallback
const displayValue = (value) => {
    return value && value !== 'null' && value !== '' ? value : '-';
};

// Badge statut coloré
const StatusBadgeValue = ({ value, type = 'boolean' }) => {
    const isTrue = type === 'boolean' ? (value === true || value === 'oui') : (value !== '-' && value !== '' && value !== null);
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            isTrue
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
        }`}>
            {isTrue ? 'Oui' : 'Non'}
        </span>
    );
};

const MemberDetailsModal = ({ isOpen, onClose, member }) => {
    const [displayMember, setDisplayMember] = React.useState(member);

    // Charger les données fraîches du serveur quand le modal ouvre
    React.useEffect(() => {
        if (isOpen && member?.id) {
            const loadMemberData = async () => {
                try {
                    const response = await fetch(`/admin/membres/${member.id}`, { credentials: 'include' });
                    if (response.ok) {
                        const freshData = await response.json();
                        setDisplayMember(freshData);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des données:', error);
                    setDisplayMember(member);
                }
            };
            loadMemberData();
        }
    }, [isOpen, member?.id]);

    if (!isOpen || !member) return null;

    const displayData = displayMember || member;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity opacity-100" onClick={onClose}></div>
            <div className="relative w-full md:w-[650px] h-full bg-gradient-to-b from-gray-50 to-gray-100 shadow-2xl flex flex-col animate-slide-in-right">
                {/* HEADER PROFESSIONNEL */}
                <div className="shrink-0 h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 border-b border-white/20 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-bold text-white">Détails du Profil</h2>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* PROFIL HEADER AMÉLIORÉ */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-start gap-6">
                        <div className="relative shrink-0">
                            {displayData.photo_path || displayData.photo ? (
                                <img src={displayData.photo_path || displayData.photo} alt={displayData.nom} className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-100" />
                            ) : (
                                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-blue-100">
                                    <User className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center ${
                                displayData.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}>
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayData.prenom} {displayData.nom}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    {displayData.role || "Membre"}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    displayData.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {displayData.is_active ? '● Actif' : '● Inactif'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <DetailCard title="Contact" icon={<Mail className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem label="Email" value={displayValue(displayData.email)} icon={<Mail className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Téléphone" value={displayValue(displayData.telephone)} icon={<Phone className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Identifiant" value={displayValue(displayData.identifier)} icon={<Award className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Téléphone 2" value={displayValue(displayData.telephone2)} icon={<Phone className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Adresse" value={displayValue(displayData.adresse)} icon={<MapPin className="w-4 h-4 text-blue-500" />} className="md:col-span-2" />
                        </div>
                    </DetailCard>

                    {/* INFORMATIONS PERSONNELLES */}
                    <DetailCard title="Informations Personnelles" icon={<User className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem label="Profession" value={displayValue(displayData.profession)} />
                            <InfoItem label="Genre" value={displayData.genre === 'M' ? '👨 Masculin' : displayData.genre === 'F' ? '👩 Féminin' : '-'} />
                            <InfoItem label="Date de naissance" value={displayValue(displayData.date_naissance)} icon={<Calendar className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Ville" value={displayValue(displayData.ville)} icon={<MapPin className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Quartier" value={displayValue(displayData.quartier)} />
                        </div>
                    </DetailCard>

                    {/* SITUATION FAMILIALE */}
                    <DetailCard title="Situation Familiale" icon={<Users className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem label="Statut marital" value={displayValue(displayData.statut_marital)} />
                            <InfoItem label="Relation" value={displayValue(displayData.relation)} />
                            <InfoItem label="Nom de famille" value={displayValue(displayData.famille_nom)} className="md:col-span-2" />
                        </div>
                    </DetailCard>

                    {/* PAROISSE & SACREMENTS */}
                    <DetailCard title="Paroisse & Sacrements" icon={<BookOpen className="w-5 h-5" />}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InfoItem label="Fonction" value={displayValue(displayData.fonction)} />
                                <InfoItem label="Classe" value={displayValue(displayData.classe)} />
                            </div>
                            <div className="border-t border-gray-200 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Sacrements</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <span className="font-medium text-gray-700">Baptisé(e)</span>
                                        <StatusBadgeValue value={displayData.baptise} />
                                    </div>
                                    {(displayData.baptise === 'oui' || displayData.baptise === true || displayData.baptise === 1) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-blue-300">
                                            <InfoItem label="Date" value={formatDate(displayData.date_bapteme)} icon={<Calendar className="w-4 h-4 text-blue-500" />} />
                                            <InfoItem label="Lieu" value={displayValue(displayData.lieu_bapteme)} icon={<MapPin className="w-4 h-4 text-blue-500" />} />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <span className="font-medium text-gray-700">Première Communion</span>
                                        <StatusBadgeValue value={displayData.premiere_communion} />
                                    </div>
                                    {(displayData.premiere_communion === 'oui' || displayData.premiere_communion === true || displayData.premiere_communion === 1) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-yellow-300">
                                            <InfoItem label="Date" value={formatDate(displayData.date_premiere_communion)} icon={<Calendar className="w-4 h-4 text-yellow-600" />} />
                                            <InfoItem label="Lieu" value={displayValue(displayData.lieu_premiere_communion)} icon={<MapPin className="w-4 h-4 text-yellow-600" />} />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200">
                                        <span className="font-medium text-gray-700">Marié(e) religieusement</span>
                                        <StatusBadgeValue value={displayData.marie_religieusement} />
                                    </div>
                                    {(displayData.marie_religieusement === 'oui' || displayData.marie_religieusement === true || displayData.marie_religieusement === 1) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-rose-300">
                                            <InfoItem label="Date" value={formatDate(displayData.date_marie_religieusement)} icon={<Calendar className="w-4 h-4 text-rose-600" />} />
                                            <InfoItem label="Lieu" value={displayValue(displayData.lieu_marie_religieusement)} icon={<MapPin className="w-4 h-4 text-rose-600" />} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DetailCard>

                    {/* INFORMATIONS ADMINISTRATIVES */}
                    <DetailCard title="Informations Administratives" icon={<Briefcase className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InfoItem label="Mariage civil" value={formatDate(displayData.date_mariage)} icon={<Calendar className="w-4 h-4 text-blue-500" />} />
                            <InfoItem label="Lieu" value={displayValue(displayData.lieu_mariage)} />
                            <div className="md:col-span-2 flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <span className="font-medium text-gray-700">Dote effectuée</span>
                                <StatusBadgeValue value={displayData.statut_marital === 'Dote'} />
                            </div>
                            {displayData.created_at && <InfoItem label="Créé le" value={displayData.created_at} icon={<Calendar className="w-4 h-4 text-gray-500" />} />}
                            {displayData.updated_at ? <InfoItem label="Modifié le" value={displayData.updated_at} icon={<Calendar className="w-4 h-4 text-gray-500" />} /> : (displayData.created_at && <InfoItem label="Modifié le" value={displayData.created_at} icon={<Calendar className="w-4 h-4 text-gray-500" />} />)}
                        </div>
                    </DetailCard>
                </div>

                {/* FOOTER */}
                <div className="shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex justify-end shadow-lg">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Form Field Component (même que CreateMember) ---
const FormField = ({ label, children, icon: Icon, required }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {Icon && <Icon className="w-4 h-4 text-blue-500" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

// --- SacrementSection Component (même que CreateMember) ---
const SacrementSection = ({ title, icon: Icon, color, checked, onChange, children }) => {
    const [isOpen, setIsOpen] = useState(checked);

    useEffect(() => {
        setIsOpen(checked);
    }, [checked]);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <div
                className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                            onChange(e.target.checked);
                            setIsOpen(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-5 h-5 rounded border-gray-300 text-${color}-600 focus:ring-${color}-500 cursor-pointer`}
                    />
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                    <span className="font-semibold text-gray-700 select-none">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {isOpen && (
                <div className="p-5 bg-white border-t border-gray-100 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Modal for editing member with EXACT SAME DESIGN as CreateMember ---
const EditMemberModal = ({ isOpen, onClose, memberData, onUpdate }) => {
    // Sécuriser les données du membre avec des valeurs par défaut
    const safeMemberData = memberData ? {
        id: memberData.id,
        nom: memberData.nom || '',
        prenom: memberData.prenom || '',
        email: memberData.email || '',
        telephone: memberData.telephone || '',
        genre: memberData.genre || 'M',
        date_naissance: memberData.date_naissance || '',
        profession: memberData.profession || '',
        fonction_id: memberData.fonction_id || '',
        relation: memberData.relation || '',
        statut_marital: memberData.statut_marital || 'Célibataire',
        photo: memberData.photo || null,
        ...memberData
    } : null;

    const [formData, setFormData] = useState(safeMemberData || {});
    const [photoPreview, setPhotoPreview] = useState(safeMemberData?.photo || null);
    const [fonctions, setFonctions] = useState([]);

    useEffect(() => {
        const fetchFonctions = async () => {
            try {
                const response = await fetch('/api/fonctions');
                const data = await response.json();
                setFonctions(data);
            } catch (error) {
                console.error('Erreur:', error);
            }
        };
        fetchFonctions();
    }, []);

    // Charger les données fraîches du serveur quand le formulaire ouvre
    useEffect(() => {
        if (isOpen && memberData?.id) {
            const loadMemberData = async () => {
                try {
                    const response = await fetch(`/admin/membres/${memberData.id}`, { credentials: 'include' });
                    if (response.ok) {
                        const freshData = await response.json();
                        // Mapper les données du serveur aux champs du formulaire
                        const mappedData = {
                            id: freshData.id,
                            nom: freshData.nom || '',
                            prenom: freshData.prenom || '',
                            email: freshData.email || '',
                            telephone: freshData.telephone || '',
                            genre: freshData.genre || 'M',
                            date_naissance: freshData.date_naissance || '',
                            profession: freshData.profession || '',
                            fonction_id: freshData.fonction_id || '',
                            relation: freshData.relation || '',
                            photo: freshData.photo_path || null,
                            statut_marital: freshData.statut_marital || 'Célibataire',
                            date_mariage: freshData.date_mariage || '',
                            lieu_mariage: freshData.lieu_mariage || '',
                            baptise: freshData.baptise || false,
                            date_bapteme: freshData.date_bapteme || '',
                            lieu_bapteme: freshData.lieu_bapteme || '',
                            premiere_communion: freshData.premiere_communion || false,
                            date_premiere_communion: freshData.date_premiere_communion || '',
                            lieu_premiere_communion: freshData.lieu_premiere_communion || '',
                            marie_religieusement: freshData.marie_religieusement || false,
                            date_marie_religieusement: freshData.date_marie_religieusement || '',
                            lieu_marie_religieusement: freshData.lieu_marie_religieusement || '',
                            ...freshData  // Préserver les champs additionnels
                        };
                        setFormData(mappedData);
                        setPhotoPreview(freshData.photo_path);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement des données:', error);
                    // Fallback aux données passées en props
                    setFormData(safeMemberData || memberData);
                    setPhotoPreview(memberData.photo_path || memberData.photo);
                }
            };
            loadMemberData();
        }
    }, [isOpen, memberData?.id]);

    if (!isOpen || !memberData) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatName = (text) => text.toUpperCase().replace(/\s+/g, " ").trim();

    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/\D/g, "");
        return cleaned.substring(0, 10);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, photo_file: file }));
            setPhotoPreview(preview);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // S'assurer que tous les champs requis sont présents
        const dataToSubmit = {
            id: memberData?.id,
            nom: formData.nom || memberData?.nom,
            prenom: formData.prenom || memberData?.prenom,
            email: formData.email || memberData?.email || '',
            telephone: formData.telephone || memberData?.telephone || '',
            genre: formData.genre || memberData?.genre || 'M',
            date_naissance: formData.date_naissance || memberData?.date_naissance || '',
            ...formData
        };

        // AUTO-SYNC: Synchroniser automatiquement statut_marital avec les données de mariage
        // Vérifier à la fois dans formData ET memberData pour date_mariage
        const dateMarriageFromForm = dataToSubmit.date_mariage && dataToSubmit.date_mariage.trim() !== '';
        const dateMarriageFromMember = memberData?.date_mariage && memberData.date_mariage.trim() !== '';
        const hasMarriageDate = dateMarriageFromForm || dateMarriageFromMember;

        // S'assurer que date_mariage et lieu_mariage sont préservés s'ils existent dans memberData
        if (dateMarriageFromMember && !dateMarriageFromForm) {
            dataToSubmit.date_mariage = memberData.date_mariage;
            dataToSubmit.lieu_mariage = memberData.lieu_mariage;
        }

        if (hasMarriageDate && dataToSubmit.statut_marital === 'Célibataire') {
            // S'il y a une date de mariage civil, le statut doit être "Marié(e)"
            dataToSubmit.statut_marital = 'Marié(e)';
        } else if (!hasMarriageDate && dataToSubmit.statut_marital === 'Marié(e)') {
            // S'il n'y a pas de date de mariage mais le statut est "Marié(e)", on met "Célibataire"
            dataToSubmit.statut_marital = 'Célibataire';
        }

        onUpdate(dataToSubmit);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50 w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-white/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Modifier : {memberData.prenom} {memberData.nom}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* GAUCHE : Identité & Contact */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Identité
                                </h3>

                                {/* Photo Upload */}
                                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <h3 className="text-xs font-bold text-gray-800">Photo</h3>
                                        <div className="w-14 h-14 rounded-full bg-white overflow-hidden border-2 border-blue-400 shadow-md">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="profil" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="file:py-0.5 file:px-2 file:rounded file:bg-blue-600 file:text-white file:cursor-pointer file:font-semibold file:border-0 file:hover:bg-blue-700 file:transition-colors file:text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Nom" icon={User} required>
                                        <input
                                            className="w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 uppercase border-gray-300 focus:border-blue-500"
                                            value={formData.nom || ''}
                                            onChange={(e) => handleChange({ target: { name: 'nom', value: formatName(e.target.value) } })}
                                            placeholder="ex: DUPONT"
                                        />
                                    </FormField>
                                    <FormField label="Prénom" icon={User} required>
                                        <input
                                            className="w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 capitalize border-gray-300 focus:border-blue-500"
                                            value={formData.prenom || ''}
                                            onChange={(e) => handleChange({ target: { name: 'prenom', value: formatName(e.target.value) } })}
                                            placeholder="ex: Jean"
                                        />
                                    </FormField>
                                    <FormField label="Genre" icon={Users} required>
                                        <select
                                            className="w-full h-12 border rounded-lg px-4 bg-white focus:shadow-md focus:shadow-blue-200 transition-all duration-300 border-gray-300 focus:border-blue-500"
                                            value={formData.genre || ''}
                                            onChange={handleChange}
                                            name="genre"
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="M">Masculin</option>
                                            <option value="F">Féminin</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Date de naissance" icon={Calendar} required>
                                        <input
                                            type="date"
                                            className="w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 border-gray-300 focus:border-blue-500"
                                            value={formData.date_naissance || ''}
                                            onChange={handleChange}
                                            name="date_naissance"
                                        />
                                    </FormField>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Mail className="w-5 h-5 text-green-600" />
                                    Contact & Coordonnées
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Email" icon={Mail}>
                                        <input
                                            type="email"
                                            className="w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 border-gray-300 focus:border-blue-500"
                                            value={formData.email || ''}
                                            onChange={handleChange}
                                            name="email"
                                            placeholder="ex: jean.dupont@gmail.com"
                                        />
                                    </FormField>
                                    <FormField label="Téléphone" icon={Phone}>
                                        <div className="flex">
                                            <span className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-3 flex items-center text-gray-600">
                                                +225
                                            </span>
                                            <input
                                                type="tel"
                                                className="flex-1 h-12 border border-gray-300 rounded-r-lg px-4 outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                value={formData.telephone || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        telephone: formatPhoneNumber(e.target.value),
                                                    })
                                                }
                                                placeholder="ex: 0102030405"
                                                maxLength="10"
                                            />
                                        </div>
                                    </FormField>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Award className="w-5 h-5 text-purple-600" />
                                    Statut Professionnel
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Profession" icon={Briefcase} required>
                                        <input
                                            className="w-full h-12 border rounded-lg px-4 outline-none focus:shadow-md focus:shadow-blue-200 transition-all duration-300 border-gray-300 focus:border-blue-500"
                                            value={formData.profession || ''}
                                            onChange={handleChange}
                                            name="profession"
                                            placeholder="ex: Enseignant, Commerçant"
                                        />
                                    </FormField>
                                    <FormField label="Fonction dans l'église" icon={Users}>
                                        <Select2Fonction
                                            value={formData.fonction_id ? [formData.fonction_id] : []}
                                            onChange={(e) => {
                                                const value = e.target.value && e.target.value.length > 0 ? e.target.value[0] : "";
                                                setFormData({ ...formData, fonction_id: value });
                                            }}
                                            options={fonctions}
                                            placeholder="Sélectionner une fonction..."
                                        />
                                    </FormField>
                                    <FormField label="Relation de Famille" icon={Users} required>
                                        <Select2Relation
                                            value={formData.relation || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    relation: e.target.value,
                                                })
                                            }
                                            placeholder="Sélectionner une relation..."
                                        />
                                    </FormField>
                                </div>
                            </section>
                        </div>

                        {/* DROITE : Situation & Sacrements */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Heart className="w-5 h-5 text-pink-600" />
                                    Situation Matrimoniale
                                </h3>
                                <div className="space-y-4">
                                    <FormField label="Statut Marital" icon={Heart} required>
                                        <select
                                            className="w-full h-12 border border-gray-300 rounded-lg px-4 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                            value={formData.statut_marital || ''}
                                            onChange={handleChange}
                                            name="statut_marital"
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                            <option value="Divorcé(e)">Divorcé(e)</option>
                                            <option value="Veuf(ve)">Veuf(ve)</option>
                                            <option value="Dote">Doté(e)</option>
                                        </select>
                                    </FormField>

                                    {formData.statut_marital && formData.statut_marital !== "Célibataire" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                                            <FormField label={formData.statut_marital === "Dote" ? "Date Dot" : formData.statut_marital === "Divorcé(e)" ? "Date du divorce" : formData.statut_marital === "Veuf(ve)" ? "Date du décès" : "Date Mariage"} icon={Calendar} required>
                                                <input
                                                    type="date"
                                                    className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                    value={formData.date_mariage || ''}
                                                    onChange={handleChange}
                                                    name="date_mariage"
                                                />
                                            </FormField>
                                            <FormField label={formData.statut_marital === "Dote" ? "Lieu Dot" : formData.statut_marital === "Divorcé(e)" ? "Lieu du divorce" : formData.statut_marital === "Veuf(ve)" ? "Lieu du décès" : "Lieu Mariage"} icon={MapPin} required>
                                                <input
                                                    className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                    value={formData.lieu_mariage || ''}
                                                    onChange={handleChange}
                                                    name="lieu_mariage"
                                                    placeholder="ex: Paris, Yaoundé"
                                                />
                                            </FormField>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    Sacrements & Vie Chrétienne
                                </h3>
                                <div className="space-y-3">
                                    <SacrementSection
                                        title="Baptême"
                                        icon={BookOpen}
                                        color="purple"
                                        checked={formData.baptise || false}
                                        onChange={(val) => setFormData({ ...formData, baptise: val })}
                                    >
                                        {formData.baptise && (
                                            <>
                                                <FormField label="Date du baptême">
                                                    <input
                                                        type="date"
                                                        className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.date_bapteme || ''}
                                                        onChange={handleChange}
                                                        name="date_bapteme"
                                                    />
                                                </FormField>
                                                <FormField label="Lieu du baptême">
                                                    <input
                                                        className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.lieu_bapteme || ''}
                                                        onChange={handleChange}
                                                        name="lieu_bapteme"
                                                        placeholder="ex: Église Saint-Paul"
                                                    />
                                                </FormField>
                                            </>
                                        )}
                                    </SacrementSection>

                                    <SacrementSection
                                        title="Première Communion"
                                        icon={Gift}
                                        color="yellow"
                                        checked={formData.premiere_communion || false}
                                        onChange={(val) => setFormData({ ...formData, premiere_communion: val })}
                                    >
                                        {formData.premiere_communion && (
                                            <>
                                                <FormField label="Date de première communion">
                                                    <input
                                                        type="date"
                                                        className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.date_premiere_communion || ''}
                                                        onChange={handleChange}
                                                        name="date_premiere_communion"
                                                    />
                                                </FormField>
                                                <FormField label="Lieu de première communion">
                                                    <input
                                                        className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.lieu_premiere_communion || ''}
                                                        onChange={handleChange}
                                                        name="lieu_premiere_communion"
                                                        placeholder="ex: Église Saint-Paul"
                                                    />
                                                </FormField>
                                            </>
                                        )}
                                    </SacrementSection>

                                    <SacrementSection
                                        title="Mariage Religieux"
                                        icon={Heart}
                                        color="rose"
                                        checked={formData.marie_religieusement || false}
                                        onChange={(val) => setFormData({ ...formData, marie_religieusement: val })}
                                    >
                                        {formData.marie_religieusement && (
                                            <>
                                                <FormField label="Date du mariage religieux">
                                                    <input
                                                        type="date"
                                                        className="w-full h-10 border border-gray-300 rounded px-2 bg-white focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.date_mariage_religieux || ''}
                                                        onChange={handleChange}
                                                        name="date_mariage_religieux"
                                                    />
                                                </FormField>
                                                <FormField label="Lieu du mariage religieux">
                                                    <input
                                                        className="w-full h-10 border border-gray-300 rounded px-2 focus:border-blue-500 focus:shadow-md focus:shadow-blue-200 transition-all duration-300"
                                                        value={formData.lieu_mariage_religieux || ''}
                                                        onChange={handleChange}
                                                        name="lieu_mariage_religieux"
                                                        placeholder="ex: Église Saint-Paul"
                                                    />
                                                </FormField>
                                            </>
                                        )}
                                    </SacrementSection>
                                </div>
                            </section>
                        </div>

                    </div>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50/50 -mx-8 -mb-6 px-8 py-6 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Annuler
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-8 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal Détails de la Classe (style identique à la page utilisateur) ---
const ClasseDetailsModal = ({ isOpen, onClose, classe, familles = [], membres = [], onViewMember, onEditMember, onToggleMember, onDeleteMember }) => {
    const [search, setSearch] = useState("");
    const [familleFilter, setFamilleFilter] = useState("tous");
    const [baptiseFilter, setBaptiseFilter] = useState("tous");
    const [statutMaritalFilter, setStatutMaritalFilter] = useState("tous");

    if (!isOpen || !classe) return null;

    const membresDeLaClasse = membres.filter(membre => membre.classe_id === classe.id || membre.classe_nom === classe.nom);
    const membresEnrichis = membresDeLaClasse.map(membre => {
        const familleMembre = familles.find(f => f.id === membre.famille_id || f.nom === membre.famille_nom);
        return { ...membre, famille_nom: familleMembre?.nom || membre.famille_nom || "Non assignée" };
    });

    const famillesList = ["tous", ...new Set(membresEnrichis.map(m => m.famille_nom).filter(Boolean))];

    const filteredMembres = membresEnrichis.filter(membre => {
        const term = search.toLowerCase();
        const textMatch = membre.nom?.toLowerCase().includes(term) || membre.prenom?.toLowerCase().includes(term) || membre.email?.toLowerCase().includes(term) || membre.famille_nom?.toLowerCase().includes(term);
        const familleMatch = familleFilter === "tous" || membre.famille_nom === familleFilter;
        const baptiseMatch = baptiseFilter === "tous" || (baptiseFilter === "oui" && membre.baptise === true) || (baptiseFilter === "non" && membre.baptise !== true);
        const statutMatch = statutMaritalFilter === "tous" || (statutMaritalFilter === "marie" && membre.statut_marital === "Marié(e)") || (statutMaritalFilter === "celibataire" && membre.statut_marital !== "Marié(e)");
        return textMatch && familleMatch && baptiseMatch && statutMatch;
    });

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-white/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0h.01" /></svg>
                        </span>
                        Membres de la classe : {classe.nom}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-600">{filteredMembres.length} / {membresDeLaClasse.length}</div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 bg-white">
                    {/* Filtres */}
                    <div className="mb-6 space-y-4">
                        <div className="relative w-full md:w-1/2">
                            <input type="text" placeholder="Rechercher un membre..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800" />
                            <div className="absolute left-3 top-2.5 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* Filtre Famille */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-600 uppercase">Famille</span>
                                <select value={familleFilter} onChange={(e) => setFamilleFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    {famillesList.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt === 'tous' ? 'Tous' : opt}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Filtre Baptême */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-600 uppercase">Baptême</span>
                                <select value={baptiseFilter} onChange={(e) => setBaptiseFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="tous">Tous</option>
                                    <option value="oui">Baptisé</option>
                                    <option value="non">Non baptisé</option>
                                </select>
                            </div>
                            {/* Filtre Statut */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-600 uppercase">Statut</span>
                                <select value={statutMaritalFilter} onChange={(e) => setStatutMaritalFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="tous">Tous</option>
                                    <option value="marie">Marié(e)</option>
                                    <option value="celibataire">Célibataire</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="table-container min-h-[400px]">
                        <div className="table-scroll h-full">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                                    <tr>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">N°</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Photo</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Nom</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Prénom</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Identifiant</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Genre</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Rôle</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Fonction</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Téléphone</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Email</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Famille</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Relation</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Baptisé</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">1ère Communion</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Marié Civil</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Marié Religieux</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Doté</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Veuf</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Créé</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Modifié</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Statut</th>
                                        <th className="px-3 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white/60 backdrop-blur-sm">
                                    {filteredMembres.length > 0 ? filteredMembres.map((m, idx) => (
                                        <tr key={idx} className="hover:bg-white/90 transition-all duration-200">
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-800 text-center">{idx + 1}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                {m.photo ? <img src={m.photo} className="w-10 h-10 rounded-full mx-auto object-cover border-2 border-white shadow-sm" alt="p" /> : <div className="w-10 h-10 rounded-full bg-gray-200 mx-auto flex items-center justify-center text-xs text-gray-500">{m.prenom?.[0]}{m.nom?.[0]}</div>}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-800 text-center">{m.nom || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{m.prenom || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{m.identifiant || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold">
                                                    {m.genre === "M" ? "♂ Masculin" : m.genre === "F" ? "♀ Féminin" : "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                                                    {m.role === "membre" ? "Membre" : m.role === "membre_famille" ? "Membre de famille" : m.role === "responsable_famille" ? "Responsable" : m.role === "conducteur" ? "Conducteur" : m.role === "pasteur" ? "Pasteur" : m.role || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{m.fonction || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{m.telephone || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center text-xs">{m.email || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">{m.famille_nom}</span></td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{m.relation || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.baptise ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.premiere_communion ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.statut_marital === "Marié(e)" ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.marie_religieusement ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.statut_marital === "Dote" ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">{m.statut_marital === "Veuf(ve)" ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center text-xs">{m.created_at || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center text-xs">{m.updated_at || "-"}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm border ${m.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                                                    {m.is_active ? "Actif" : "Inactif"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => onViewMember && onViewMember(m)} className="btn-icon text-blue-600" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.2)" }} title="Voir détails">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                    <button onClick={() => onEditMember && onEditMember(m)} className="btn-icon text-blue-600" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.2)" }} title="Modifier">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => onToggleMember && onToggleMember(m)} className="btn-icon" style={{ backgroundColor: m.is_active ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)", border: m.is_active ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid rgba(220, 38, 38, 0.2)" }} title={m.is_active ? "Désactiver" : "Activer"}>
                                                        {m.is_active ?
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> :
                                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                        }
                                                    </button>
                                                    <button onClick={() => onDeleteMember && onDeleteMember(m)} className="btn-icon text-red-600" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)" }} title="Supprimer">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={22} className="px-6 py-12 text-center text-gray-400">Aucun membre trouvé.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-200 flex justify-end shrink-0">
                    <button onClick={onClose} className="btn btn-primary">Fermer</button>
                </div>
            </div>
        </div>
    );
};

// --- Modal Formulaire (style identique à la page utilisateur) ---
const ClasseFormModal = ({ isOpen, onClose, classeData, onSuccess, toast }) => {
    const isEditing = !!classeData;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nom: classeData?.nom || "",
        description: classeData?.description || ""
    });

    useEffect(() => {
        if (isOpen && classeData) {
            setData({
                nom: classeData.nom || "",
                description: classeData.description || ""
            });
        } else if (isOpen && !classeData) {
            reset();
        }
    }, [isOpen, classeData?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Capture the nom value BEFORE submission to ensure it's available in callbacks
        const nomValue = data.nom;

        const action = isEditing ? put : post;
        const url = isEditing ? `/admin/classes/${classeData.id}` : "/admin/classes";

        console.log("📤 Envoi form:", {
            isEditing,
            url,
            data: {
                nom: data.nom,
                description: data.description
            }
        });

        action(url, {
            preserveScroll: true,
            onSuccess: () => {
                console.log("✅ onSuccess called");
                const message = isEditing
                    ? `Classe "${nomValue}" mise à jour avec succès !`
                    : `Classe "${nomValue}" créée avec succès !`;
                if (toast && toast.success) {
                    toast.success(message);
                }
                onClose();

                // Appeler le callback du parent qui recharge la page
                if (onSuccess) {
                    console.log("🔄 Calling parent onSuccess callback...");
                    onSuccess();
                }

                // Pour les modifications, recharger la page après 1 seconde
                if (isEditing) {
                    console.log("🔄 Recharging page after edit...");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            },
            onError: (errors) => {
                console.error("❌ onError:", errors);
                if (toast && toast.error) {
                    toast.error("Une erreur est survenue lors de l'opération");
                }
            },
            preserveScroll: true
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            {isEditing ?
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> :
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            }
                        </span>
                        {isEditing ? "Modifier la classe" : "Créer une classe"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="form-label">Nom de la classe <span className="text-red-500 ml-1">*</span></label>
                            <input type="text" value={data.nom} onChange={e => setData('nom', e.target.value)} className={`input-control ${errors.nom ? 'border-red-500' : ''}`} placeholder="Ex: École du Dimanche" />
                            {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea rows="4" value={data.description} onChange={e => setData('description', e.target.value)} className="input-control resize-none" placeholder="Décrivez cette classe..."></textarea>
                        </div>
                    </form>
                </div>
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:w-auto">Annuler</button>
                    <button onClick={handleSubmit} disabled={processing} className={`btn btn-primary w-full sm:w-auto ${processing ? 'opacity-75 cursor-not-allowed' : ''}`}>
                        {processing ? 'En cours...' : isEditing ? 'Mettre à jour' : 'Créer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Composant Pagination ---
const Pagination = ({ currentPage, totalPages, paginate }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <span className="pagination-info">
                Page {currentPage} sur {totalPages}
            </span>
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Précédent
            </button>
            {pageNumbers.map(number => (
                <button
                    key={number}
                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                    onClick={() => paginate(number)}
                >
                    {number}
                </button>
            ))}
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Suivant
            </button>
        </div>
    );
};

// --- Composant Principal TabClasses ---
const TabClasses = ({ rawData, onDelete, onUpdate, onDeleteClasse, onToggleClasse }) => {
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClasse, setEditingClasse] = useState(null);
    const [selectedClasse, setSelectedClasse] = useState(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [selectedClasseForDelete, setSelectedClasseForDelete] = useState(null);

    // States pour les actions sur les membres de la classe
    const [viewingMember, setViewingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberToggleAlert, setShowMemberToggleAlert] = useState(false);
    const [showMemberDeleteAlert, setShowMemberDeleteAlert] = useState(false);
    const [showClasseToggleAlert, setShowClasseToggleAlert] = useState(false);
    const [selectedClasseForToggle, setSelectedClasseForToggle] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // État local pour les données
    const [classesData, setClassesData] = useState(rawData?.classes || []);
    const [membresData, setMembresData] = useState(rawData?.membres || []);
    const [famillesData, setFamillesData] = useState(rawData?.familles || []);

    // Initialiser toast hook
    const toast = useToast();

    // Mettre à jour les états locaux quand les props changent
    useEffect(() => {
        if (rawData?.classes) setClassesData(rawData.classes);
        if (rawData?.membres) setMembresData(rawData.membres);
        if (rawData?.familles) setFamillesData(rawData.familles);
    }, [rawData?.classes, rawData?.membres, rawData?.familles]);

    // Enrichissement des données
    const enrichedClassesData = classesData.map(classe => {
        const conducteursAssignes = classe.conducteurs_ids || [];
        const famillesInClass = famillesData.filter(f => f.classe_id === classe.id || f.classe_nom === classe.nom);
        // Ne compter que les VRAIS MEMBRES, pas les admins/conducteurs/fonctions
        const membresInClass = membresData.filter(m => {
            const isInClass = m.classe_id === classe.id || m.classe_nom === classe.nom;
            const isNotAdmin = m.role !== 'admin' && m.role !== 'conducteur' && m.role !== 'fonction';
            return isInClass && isNotAdmin;
        });
        return {
            ...classe,
            conducteurs_count: conducteursAssignes.length,
            familles_count: famillesInClass.length,
            membres_count: membresInClass.length
        };
    });

    // Filtrage
    const filteredData = enrichedClassesData.filter(item => {
        const term = search.toLowerCase();
        return item.nom?.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term);
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const stats = {
        totalClasses: classesData.length,
        // Compter seulement les vrais membres (pas admin/conducteur/fonction)
        totalMembres: membresData.filter(m => m.role !== 'admin' && m.role !== 'conducteur' && m.role !== 'fonction').length,
        totalFamilles: famillesData.length,
        totalConducteurs: classesData.reduce((acc, c) => acc + (c.conducteurs_ids?.length || 0), 0)
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const openDeleteAlert = (classe) => { setSelectedClasseForDelete(classe); setShowDeleteAlert(true); };

    const handleClasseToggleConfirm = () => {
        if (!selectedClasseForToggle) return;

        const newStatus = selectedClasseForToggle.status === 'active' ? 'inactive' : 'active';
        const textAction = newStatus === 'inactive' ? 'désactiver' : 'activer';
        const patchUrl = `/admin/classes/${selectedClasseForToggle.id}/status`;

        console.log('📤 Envoi PATCH:', patchUrl);
        console.log('📊 Nouveau statut:', newStatus);
        console.log('🔍 Classe sélectionnée:', selectedClasseForToggle);

        // Envoyer la requête PATCH directement
        router.patch(patchUrl, { status: newStatus }, {
            onSuccess: (response) => {
                console.log('✅ Succès du PATCH:', response);

                // Mettre à jour les données locales au lieu de recharger
                setClassesData(prevData =>
                    prevData.map(c =>
                        c.id === selectedClasseForToggle.id
                            ? { ...c, status: newStatus }
                            : c
                    )
                );

                toast.success(`Classe "${selectedClasseForToggle.nom}" ${textAction}e avec succès.`);
                setShowClasseToggleAlert(false);
                setSelectedClasseForToggle(null);
            },
            onError: (errors) => {
                console.error('❌ Erreur PATCH:', errors);
                toast.error('❌ Erreur lors du changement de statut de la classe');
                setShowClasseToggleAlert(false);
                setSelectedClasseForToggle(null);
            }
        });
    };

    const handleDeleteClasse = async () => {
        if (!selectedClasseForDelete) return;

        // Appeler la fonction callback du parent et attendre le résultat
        if (onDeleteClasse) {
            try {
                await onDeleteClasse(selectedClasseForDelete);

                // Fermer le modal seulement si succès
                setShowDeleteAlert(false);
                setSelectedClasseForDelete(null);
            } catch (error) {
                // La modale reste affichée en cas d'erreur
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    const openMemberToggleAlert = (member) => {
        setSelectedMember(member);
        setShowMemberToggleAlert(true);
    };

    const openMemberDeleteAlert = (member) => {
        setSelectedMember(member);
        setShowMemberDeleteAlert(true);
    };

    const handleMemberToggleConfirm = () => {
        if (!selectedMember) return;
        const newStatus = selectedMember.is_active ? 'inactif' : 'actif';
        const memberName = `${selectedMember.prenom} ${selectedMember.nom}`;
        router.patch(`/admin/membres/${selectedMember.id}/status`, {
            statut: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                const actionMsg = selectedMember.is_active ? 'désactivé' : 'activé';
                toast.success(`Membre "${memberName}" ${actionMsg} avec succès`);
                setShowMemberToggleAlert(false);
                setSelectedMember(null);
                router.reload({ preserveScroll: true });
            },
            onError: (errors) => {
                toast.error('Erreur lors du changement de statut du membre');
                setShowMemberToggleAlert(false);
                setSelectedMember(null);
            }
        });
    };

    const handleMemberDeleteConfirm = () => {
        if (!selectedMember) return;
        const memberName = `${selectedMember.prenom} ${selectedMember.nom}`;
        router.delete(`/admin/membres/${selectedMember.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Membre "${memberName}" supprimé avec succès`);
                setShowMemberDeleteAlert(false);
                setSelectedMember(null);
                router.reload({ preserveScroll: true });
            },
            onError: (errors) => {
                console.error('Erreur:', errors);
                toast.error('Erreur lors de la suppression du membre');
                setShowMemberDeleteAlert(false);
                setSelectedMember(null);
            }
        });
    };

    const handleMemberEdit = (updatedMember) => {
        const memberName = `${updatedMember.prenom} ${updatedMember.nom}`;
        const formData = new FormData();
        Object.keys(updatedMember).forEach(key => {
            if (key === 'photo' && updatedMember[key] instanceof File) {
                formData.append(key, updatedMember[key]);
            } else if (updatedMember[key] !== null && updatedMember[key] !== undefined) {
                formData.append(key, updatedMember[key]);
            }
        });

        router.put(`/admin/membres/${updatedMember.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Membre "${memberName}" modifié avec succès`);
                setEditingMember(null);
                router.reload({ preserveScroll: true });
            },
            onError: (errors) => {
                console.error('Erreur:', errors);
                toast.error('Erreur lors de la modification du membre');
            }
        });
    };

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <div className="flex flex-col h-full animate-fade-in-up">

                {/* --- STATS GRID (4 cartes) --- */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="text-blue-500 mb-2">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="stat-value">{stats.totalClasses}</span>
                        <span className="stat-label">Total Classes</span>
                    </div>
                    <div className="stat-card">
                        <div className="text-yellow-500 mb-2">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="stat-value">{stats.totalConducteurs}</span>
                        <span className="stat-label">Conducteurs</span>
                    </div>
                    <div className="stat-card">
                        <div className="text-purple-500 mb-2">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="stat-value">{stats.totalMembres}</span>
                        <span className="stat-label">Total Membres</span>
                    </div>
                    <div className="stat-card">
                        <div className="text-gray-500 mb-2">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="stat-value">{stats.totalFamilles}</span>
                        <span className="stat-label">Total Familles</span>
                    </div>
                </div>

                {/* --- FILTERS BAR --- */}
                <div className="glass-panel filters-bar">
                    <div className="filter-group w-full">
                        <div className="input-search-wrapper w-full md:w-80">
                            <svg className="input-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Rechercher une classe..." className="input-control input-search" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={() => setSearch("")} className="btn btn-secondary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Réinitialiser
                        </button>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-success">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Nouvelle classe
                        </button>
                    </div>
                </div>

                {/* --- DATA TABLE avec Pagination et scroll horizontal --- */}
                <div className="table-container">
                    <div className="table-scroll h-full">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Classes</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Conducteurs</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Familles</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Membres</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Description</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Création</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Modifiée</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Statut</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-white uppercase tracking-wider text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white/60 backdrop-blur-sm">
                                {currentItems.length > 0 ? currentItems.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/90 transition-all duration-200">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                            <button onClick={() => setSelectedClasse(row)} className="text-blue-600 hover:text-blue-900 hover:underline">{row.nom}</button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                            <span className="status-badge status-active">{row.conducteurs_count}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                            <span className="status-badge status-active" style={{backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0'}}>{row.familles_count}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                            <span className="status-badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' }}>
                                                {row.membres_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-center max-w-xs truncate whitespace-nowrap">{row.description || "-"}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                            {row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                            {row.updated_at ? new Date(row.updated_at).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            {row.deleted_at ? (
                                                <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>Supprimée</span>
                                            ) : row.status === 'inactive' ? (
                                                <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>Inactive ({row.membres_active_count})</span>
                                            ) : (
                                                <span className="status-badge status-active">Active ({row.membres_active_count})</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <ActionButtonsSVG
                                                    rowData={row}
                                                    onEdit={() => setEditingClasse(row)}
                                                    onDelete={() => openDeleteAlert(row)}
                                                    onView={() => setSelectedClasse(row)}
                                                    onToggle={() => {
                                                        setSelectedClasseForToggle(row);
                                                        setShowClasseToggleAlert(true);
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">Aucune classe trouvée.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Controls --- */}
                    {filteredData.length > 0 && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            paginate={goToPage}
                        />
                    )}
                </div>

                {/* --- Modals --- */}
                <ClasseFormModal
                    isOpen={isAddModalOpen || !!editingClasse}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingClasse(null);
                    }}
                    classeData={editingClasse}
                    onSuccess={() => router.reload({ preserveScroll: true })}
                    toast={toast}
                />

                <ClasseDetailsModal
                    isOpen={!!selectedClasse}
                    onClose={() => setSelectedClasse(null)}
                    classe={selectedClasse}
                    familles={famillesData}
                    membres={membresData}
                    onViewMember={setViewingMember}
                    onEditMember={setEditingMember}
                    onToggleMember={openMemberToggleAlert}
                    onDeleteMember={openMemberDeleteAlert}
                />

                <AlertModal
                    isOpen={showDeleteAlert}
                    onClose={() => setShowDeleteAlert(false)}
                    onConfirm={handleDeleteClasse}
                    title="Supprimer la classe"
                    message={`Êtes-vous sûr de vouloir supprimer la classe "${selectedClasseForDelete?.nom}" ? Cette action est irréversible.\n\n📌 Important : Tous les ${selectedClasseForDelete?.membres_count || 0} membre(s) de cette classe seront désactivés (non supprimés).`}
                    confirmText="Supprimer"
                    type="danger"
                />
            </div>

            {/* --- MODALS FOR MEMBER ACTIONS --- */}
            <MemberDetailsModal isOpen={!!viewingMember} onClose={() => setViewingMember(null)} member={viewingMember} />
            <EditMemberModal isOpen={!!editingMember} onClose={() => setEditingMember(null)} memberData={editingMember} onUpdate={handleMemberEdit} toast={toast} />

            {/* --- ALERT MODALS FOR MEMBER TOGGLE AND DELETE --- */}
            <AlertModal
                isOpen={showMemberToggleAlert}
                onClose={() => { setShowMemberToggleAlert(false); setSelectedMember(null); }}
                onConfirm={handleMemberToggleConfirm}
                title={selectedMember?.is_active ? "Désactiver le membre" : "Activer le membre"}
                message={`Voulez-vous vraiment ${selectedMember?.is_active ? "désactiver" : "activer"} le compte de "${selectedMember?.prenom} ${selectedMember?.nom}" ?`}
                confirmText={selectedMember?.is_active ? "Désactiver" : "Activer"}
                type={selectedMember?.is_active ? "warning" : "success"}
            />
            <AlertModal
                isOpen={showMemberDeleteAlert}
                onClose={() => { setShowMemberDeleteAlert(false); setSelectedMember(null); }}
                onConfirm={handleMemberDeleteConfirm}
                title="Supprimer le membre"
                message={`Êtes-vous sûr de vouloir supprimer définitivement "${selectedMember?.prenom} ${selectedMember?.nom}" de cette classe ?`}
                confirmText="Supprimer définitivement"
                type="danger"
            />

            {/* --- ALERT MODAL FOR CLASSE TOGGLE --- */}
            <AlertModal
                isOpen={showClasseToggleAlert}
                onClose={() => { setShowClasseToggleAlert(false); setSelectedClasseForToggle(null); }}
                onConfirm={handleClasseToggleConfirm}
                title={selectedClasseForToggle?.status === 'active' ? "Désactiver la classe" : "Activer la classe"}
                message={`Voulez-vous vraiment ${selectedClasseForToggle?.status === 'active' ? "désactiver" : "activer"} la classe "${selectedClasseForToggle?.nom}" ?`}
                confirmText={selectedClasseForToggle?.status === 'active' ? "Désactiver" : "Activer"}
                type={selectedClasseForToggle?.status === 'active' ? "warning" : "success"}
            />

            <ToastContainer
                toasts={toast.toasts}
                removeToast={toast.removeToast}
            />
        </>
    );
};

export default TabClasses;
