import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';

// ==================== STYLES GLOBAUX ====================
const GLOBAL_STYLES = `
    :root {
        --primary: #2563eb; --primary-hover: #1d4ed8;
        --success: #16a34a; --danger: #dc2626; --warning: #ca8a04;
        --glass-bg: rgba(255, 255, 255, 0.7); --glass-border: rgba(255, 255, 255, 0.5);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
    .animate-fade-in { animation: fadeIn 0.2s ease forwards; }
    .animate-fade-out { animation: fadeOut 0.2s ease forwards; }
    .animate-scale-in { animation: scaleIn 0.2s ease forwards; }
    .animate-scale-out { animation: scaleOut 0.2s ease forwards; }
    .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    
    /* Boutons */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    .btn-success { background-color: var(--success); color: white; }
    .btn-success:hover { background-color: #15803d; }
    .btn-danger { background-color: var(--danger); color: white; }
    .btn-danger:hover { background-color: #b91c1c; }
    .btn-warning { background-color: var(--warning); color: white; }
    .btn-warning:hover { background-color: #b45309; }
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
    .btn-view { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .btn-view:hover { background-color: #dbeafe; }
    .btn-icon { padding: 0.5rem; border-radius: 0.5rem; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
    .btn-icon:hover { transform: translateY(-1px); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }

    /* Barre de filtres */
    .filters-bar { 
        border-radius: 1rem; 
        padding: 1.5rem; 
        margin-bottom: 1.5rem; 
        display: flex; 
        flex-direction: column; 
        gap: 1rem; 
    }

    /* Première ligne : filtres avec défilement */
    .filter-group { 
        display: flex; 
        gap: 0.5rem; 
        align-items: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        width: 100%;
    }
    .filter-group::-webkit-scrollbar {
        height: 4px;
    }
    .filter-group::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.2);
        border-radius: 4px;
    }

    .input-control { 
        padding: 0.625rem 1rem; 
        border-radius: 0.75rem; 
        border: 1px solid #e5e7eb; 
        background-color: rgba(255, 255, 255, 0.8); 
        font-size: 0.875rem; 
        color: #111827; 
        transition: ring 0.2s; 
        white-space: nowrap;
    }
    .input-control:focus { 
        border-color: var(--primary); 
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); 
        outline: none; 
    }
    .input-search-wrapper { 
        position: relative; 
        flex: 1; 
        min-width: 200px; 
    }
    .input-search-icon { 
        position: absolute; 
        left: 0.75rem; 
        top: 50%; 
        transform: translateY(-50%); 
        color: #9ca3af; 
        width: 1.25rem; 
        height: 1.25rem; 
    }
    .input-search { 
        padding-left: 2.5rem; 
        width: 100%; 
    }

    /* Deuxième ligne : navigation et actions */
    .filter-second-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        flex-wrap: wrap;
        gap: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.5);
        padding-top: 1rem;
    }
    .filter-nav { 
        display: flex; 
        gap: 0.5rem; 
        flex-wrap: wrap; 
    }
    .filter-nav-btn { 
        background: rgba(255,255,255,0.5); 
        border: 1px solid rgba(255,255,255,0.5); 
        padding: 0.5rem 1rem; 
        border-radius: 2rem; 
        font-weight: 600; 
        font-size: 0.875rem; 
        color: #1f2937; 
        cursor: pointer; 
        transition: all 0.2s; 
        backdrop-filter: blur(4px); 
        white-space: nowrap;
    }
    .filter-nav-btn:hover { background: white; border-color: var(--primary); }
    .filter-nav-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

    .filter-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-left: auto;
    }

    /* Table container (conservé pour la structure) */
    .table-container { background: var(--glass-bg); border-radius: 1rem; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--glass-border); display: flex; flex-direction: column; flex: 1; min-height: 500px; position: relative; }

    /* --- MODAL DÉTAILS MEMBRE (style verre) --- */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    }
    .modal-overlay.closing {
        animation: fadeOut 0.2s ease forwards;
    }
    .modal-content {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        width: 95%;
        max-width: 900px;
        max-height: 90vh;
        border-radius: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .modal-content.closing {
        animation: scaleOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .modal-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid rgba(229, 231, 235, 0.5);
        background: #fbbf24; /* Jaune */
        color: #1f2937;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
    }
    .modal-header h2 {
        color: #1f2937;
        font-weight: 700;
        font-size: 1.5rem;
        margin: 0;
    }
    .modal-header button {
        background: white;
        border: none;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #374151;
        transition: all 0.2s;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .modal-header button:hover {
        background: #f3f4f6;
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .modal-body {
        padding: 2rem;
        overflow-y: auto;
        flex: 1;
        scrollbar-width: thin;
        scrollbar-color: var(--primary) #e5e7eb;
    }
    .modal-body::-webkit-scrollbar {
        width: 6px;
    }
    .modal-body::-webkit-scrollbar-track {
        background: #e5e7eb;
        border-radius: 3px;
    }
    .modal-body::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 3px;
    }
    .modal-footer {
        padding: 1rem 2rem;
        border-top: 1px solid rgba(229, 231, 235, 0.5);
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: flex-end;
        z-index: 10;
    }

    /* Styles pour le contenu du modal (simplifié) */
    .member-details {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .detail-section {
        background: #f5f5f5; /* White smoke */
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: transform 0.2s, box-shadow 0.2s;
        border: 1px solid #e5e7eb;
    }
    .detail-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .detail-section h3 {
        margin: 0 0 1.25rem 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.75rem;
        letter-spacing: 0.5px;
    }
    .member-identity {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }
    .member-photo-large {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid #fbbf24; /* Jaune */
        background: #fbbf24;
        flex-shrink: 0;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    .member-photo-large:hover {
        transform: scale(1.05);
    }
    .member-photo-large img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .member-identity-info {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.75rem 1.5rem;
    }
    .member-identity-info p {
        margin: 0;
        padding: 0.25rem 0;
        font-size: 0.95rem;
        color: #374151;
    }
    .member-identity-info strong {
        color: #111827;
        font-weight: 600;
        margin-right: 0.5rem;
    }
    .contact-info p {
        margin: 0.5rem 0;
        padding: 0.25rem 0;
        font-size: 0.95rem;
        color: #374151;
    }

    /* --- POPUP PHOTO (petite carte contextuelle) --- */
    .photo-popup {
        position: fixed;
        z-index: 1200;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 0.5rem;
        animation: scaleIn 0.15s ease;
        border: 1px solid #e5e7eb;
        max-width: 250px;
    }
    .photo-popup.closing {
        animation: scaleOut 0.15s ease forwards;
    }
    .photo-popup img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 0.5rem;
        max-height: 250px;
        object-fit: contain;
    }
    .photo-popup-close {
        position: absolute;
        top: -0.5rem;
        right: -0.5rem;
        background: white;
        border: 1px solid #e5e7eb;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        color: #374151;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s;
    }
    .photo-popup-close:hover {
        background: #f3f4f6;
        transform: scale(1.1);
    }

    /* Vue grille - style Facebook/album avec bannière semi-transparente */
    .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 1rem; }
    .grid-card { 
        background: white; 
        border-radius: 1rem; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        transition: transform 0.2s, box-shadow 0.2s; 
        border: 1px solid #f3f4f6; 
        display: flex;
        flex-direction: column;
    }
    .grid-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    
    .grid-cover {
        height: 100px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
        position: relative;
        z-index: 1;
    }
    
    .grid-profile-container {
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 2;
        margin-top: -40px;
        margin-bottom: 0.5rem;
    }
    .grid-profile-photo {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .grid-profile-photo:hover {
        transform: scale(1.05);
    }
    .grid-profile-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .grid-card-info {
        padding: 0 1rem 1.5rem;
        text-align: center;
    }
    .grid-card-info h4 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #111827;
        margin: 0.5rem 0 0.25rem;
    }
    .grid-card-famille {
        font-size: 0.9rem;
        color: var(--primary);
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
    }
    .grid-card-classe {
        font-size: 0.8rem;
        color: #6b7280;
        background: #f3f4f6;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        display: inline-block;
        margin: 0.5rem 0;
    }
    .grid-card-contact {
        font-size: 0.9rem;
        color: #4b5563;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
    }
    .grid-card-contact svg {
        width: 1rem;
        height: 1rem;
    }

    /* Vues familles et classes */
    .families-list, .classes-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .family-group, .class-group { background: var(--glass-bg); backdrop-filter: blur(12px); border-radius: 1rem; border: 1px solid var(--glass-border); overflow: hidden; }
    .family-header, .class-header { background: rgba(255,255,255,0.5); padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.5); display: flex; justify-content: space-between; align-items: center; }
    .family-header h3, .class-header h3 { color: #1f2937; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .family-count, .class-count { background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .family-members, .class-members { padding: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; }
    .family-member-item, .class-member-item { display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid #e5e7eb; padding: 0.75rem; border-radius: 0.75rem; width: 100%; max-width: 300px; transition: all 0.2s; }
    .family-member-item:hover, .class-member-item:hover { border-color: var(--primary); transform: translateX(4px); }
    .family-member-item img, .class-member-item img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); cursor: pointer; }
    .family-member-item img:hover, .class-member-item img:hover { transform: scale(1.1); }
    .family-member-item .member-info, .class-member-item .member-info { cursor: pointer; flex: 1; }
    .family-member-item strong, .class-member-item strong { color: #1f2937; font-weight: 600; display: block; }
`;

// ==================== FONCTIONS UTILITAIRES ====================
const toText = (value, fallback = '-') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        return String(value.nom ?? value.label ?? value.name ?? value.code ?? fallback);
    }
    return fallback;
};

const normalizeMember = (member) => {
    if (!member) return null;
    const prenoms = toText(member?.prenoms || member?.prenom || member?.full_name, '');
    const classeName = toText(member?.classe?.nom || member?.classeMethodiste || member?.classe, '-');
    const familleName = toText(
        member?.famille || member?.family?.nom || member?.family?.code_famille || member?.family_code,
        '-'
    );
    return {
        ...member,
        prenoms,
        classeMethodiste: classeName,
        famille: familleName,
        codeFamille: member?.code_famille || member?.family?.code_famille || null,
        codeMembre: member?.numMembre || member?.code_membre || null,
        photo: member?.photo || member?.profile_photo_url || '',
        sexe: toText(member?.sexe || member?.genre, ''),
        dateNaissance: member?.dateNaissance || member?.date_naissance || null,
        telephone: toText(member?.telephone, '-'),
        email: toText(member?.email, '-'),
        fonction: toText(member?.fonction, '-'),
        profession: toText(member?.profession, '-'),
        relation: toText(member?.relation, '-'),
        adresse: toText(member?.adresse || member?.family?.adresse || member?.address, '-'),
        quartier: toText(member?.quartier || member?.family?.quartier, '-'),
    };
};

// --- Composant Badge (non utilisé, mais conservé) ---
const MemberStatusBadge = ({ member }) => {
    const isBaptized = member.baptise;
    const className = isBaptized
        ? "status-badge bg-green-100 text-green-800 border-green-200"
        : "status-badge bg-gray-100 text-gray-800 border-gray-200";
    const icon = isBaptized ? (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
    return (
        <span className={`${className} items-center`}>
            {icon}
            {isBaptized ? 'Baptisé' : 'Non baptisé'}
        </span>
    );
};

// --- Composant Modal pour les détails du membre (commenté car plus utilisé) ---
// const MemberDetailsModal = ({ member, userData, onClose }) => { ... };

// ==================== COMPOSANT PRINCIPAL ====================
const Annuaire = ({ 
    members = null, 
    families = null, 
    classes = null, 
    view = 'all', 
    cotisations = {}, 
    user = { role: 'user' }, 
    filters = {},
    filterOptions = { classes: [], familles: [], professions: [], roles: [] }
}) => {
    const { data: paginatedMembers, links: membersLinks, current_page: membersCurrentPage, per_page: membersPerPage, total: membersTotal } = members || { data: [], links: [], current_page: 1, per_page: 10, total: 0 };

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    // Filtre classe supprimé
    const [familleFilter, setFamilleFilter] = useState(filters.famille || "");
    const [professionFilter, setProfessionFilter] = useState(filters.profession || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "");
    const [itemsPerPage, setItemsPerPage] = useState(filters.perPage || 10);

    const [currentView, setCurrentView] = useState(view);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [photoPopup, setPhotoPopup] = useState({ visible: false, src: '', x: 0, y: 0, exiting: false });
    const popupRef = useRef(null);
    // Pagination interne des classes supprimée
    // const [classMemberPages, setClassMemberPages] = useState({});

    const applyFilters = useCallback(() => {
        router.get(
            window.location.pathname,
            {
                search: searchTerm,
                // classe: classeFilter, // supprimé
                famille: familleFilter,
                profession: professionFilter,
                role: roleFilter,
                perPage: itemsPerPage,
                view: currentView,
                page: 1,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, [searchTerm, familleFilter, professionFilter, roleFilter, itemsPerPage, currentView]);

    useEffect(() => {
        const handler = setTimeout(() => applyFilters(), 500);
        return () => clearTimeout(handler);
    }, [applyFilters]);

    const switchView = (newView) => {
        setCurrentView(newView);
        router.get(
            window.location.pathname,
            {
                search: searchTerm,
                // classe: classeFilter, // supprimé
                famille: familleFilter,
                profession: professionFilter,
                role: roleFilter,
                view: newView,
                page: 1,
                familiesPerPage: 5,
                // classesPerPage: 1, // supprimé
            },
            { preserveState: true, preserveScroll: true }
        );
        // setClassMemberPages({}); // supprimé
    };

    const handlePageChange = (url) => { if (url) router.get(url, {}, { preserveState: true, preserveScroll: true }); };
    const handleFamilyPageChange = (url) => { if (url) router.get(url, {}, { preserveState: true, preserveScroll: true }); };
    // const handleClassPageChange = (url) => { ... }; // supprimé
    const handlePerPageChange = (newPerPage) => setItemsPerPage(newPerPage);

    const resetFilters = () => {
        setSearchTerm("");
        // setClasseFilter(""); // supprimé
        setFamilleFilter("");
        setProfessionFilter("");
        setRoleFilter("");
        setItemsPerPage(10);
    };

    const openModal = (member) => {
        const normalized = normalizeMember(member);
        if (!normalized) return;
        setSelectedMember(normalized);
        setIsExiting(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            setIsModalOpen(false);
            setSelectedMember(null);
        }, 200);
    };

    const openPhotoPopup = (src, event) => {
        event.stopPropagation();
        const x = event.clientX;
        const y = event.clientY;
        setPhotoPopup({ visible: true, src, x, y, exiting: false });
    };

    const closePhotoPopup = () => {
        setPhotoPopup(prev => ({ ...prev, exiting: true }));
        setTimeout(() => setPhotoPopup({ visible: false, src: '', x: 0, y: 0, exiting: false }), 150);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (photoPopup.visible && popupRef.current && !popupRef.current.contains(event.target)) {
                closePhotoPopup();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [photoPopup.visible]);

    const getFallbackImage = (member) => {
        const initial = (member.prenoms || member.nom || '?').charAt(0).toUpperCase();
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2563eb"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-weight="bold">${initial}</text></svg>`)}`;
    };

    const getPopupStyle = () => {
        if (!photoPopup.visible) return {};
        const popupWidth = 260, popupHeight = 260;
        let left = photoPopup.x + 10, top = photoPopup.y - popupHeight / 2;
        if (left + popupWidth > window.innerWidth) left = photoPopup.x - popupWidth - 10;
        if (top < 0) top = 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
        return { left, top };
    };

    const Pagination = ({ links, currentPage, perPage, total, onPageChange }) => {
        if (!links || links.length <= 3) return null;
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-sm border-t border-white/50">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                        Affichage de {(currentPage - 1) * perPage + 1} à {Math.min(currentPage * perPage, total)} sur {total} membres
                    </span>
                    {currentView === 'all' && (
                        <select value={perPage} onChange={(e) => onPageChange(null, parseInt(e.target.value))} className="input-control !py-1 !px-2 text-sm">
                            <option value={10}>10 par page</option>
                            <option value={20}>20 par page</option>
                            <option value={50}>50 par page</option>
                            <option value={100}>100 par page</option>
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    {links.map((link, index) => link.url === null ? (
                        <span key={index} className="btn btn-secondary !py-1 !px-3 disabled opacity-50" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ) : (
                        <button key={index} onClick={() => onPageChange(link.url)} className={`btn !py-1 !px-3 ${link.active ? 'btn-primary' : 'btn-secondary'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            </div>
        );
    };

    const renderGridView = () => {
        const normalizedMembers = paginatedMembers.map(normalizeMember).filter(Boolean);
        return (
            <>
                <div className="grid-view">
                    {normalizedMembers.length > 0 ? (
                        normalizedMembers.map(member => (
                            <div key={member.id} className="grid-card">
                                <div className="grid-cover"></div>
                                <div className="grid-profile-container">
                                    <div className="grid-profile-photo" onClick={(e) => openPhotoPopup(member.photo || getFallbackImage(member), e)}>
                                        <img src={member.photo || getFallbackImage(member)} onError={(e) => e.target.src = getFallbackImage(member)} alt={member.prenoms} />
                                    </div>
                                </div>
                                <div className="grid-card-info">
                                    <h4>{member.prenoms} {member.nom}</h4>
                                    <div className="grid-card-famille">{member.famille || '-'}</div>
                                    <div className="grid-card-classe">{member.classeMethodiste || '-'}</div>
                                    <div className="grid-card-contact">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        {member.telephone || '-'}
                                    </div>
                                    <div className="grid-card-contact">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        {member.email || '-'}
                                    </div>
                                    {/* Bouton Voir profil commenté */}
                                    {/* <button onClick={() => openModal(member)} className="btn btn-view mt-3 w-full">Voir profil</button> */}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center py-12 text-gray-400 italic">Aucun membre trouvé.</p>
                    )}
                </div>
                <Pagination links={membersLinks} currentPage={membersCurrentPage} perPage={membersPerPage} total={membersTotal} onPageChange={(url, newPerPage) => newPerPage ? handlePerPageChange(newPerPage) : handlePageChange(url)} />
            </>
        );
    };

    const renderFamiliesView = () => {
        const familyData =
            Array.isArray(families?.data) && families.data.length > 0
                ? families.data
                : Array.isArray(families)
                    ? families
                    : [];

        if (familyData.length === 0) return <p className="text-center py-12 text-gray-400 italic">Aucune famille trouvée.</p>;
        return (
            <div className="families-list">
                {familyData.map(family => {
                    const normalizedFamilyMembers = (family.members || []).map(normalizeMember).filter(Boolean);
                    return (
                        <div key={family.id} className="family-group">
                            <div className="family-header"><h3>{family.nom}</h3><span className="family-count">{family.count}</span></div>
                            <div className="family-members">
                                {normalizedFamilyMembers.map(member => (
                                    <div key={member.id} className="family-member-item">
                                        <img src={member.photo || getFallbackImage(member)} onClick={(e) => openPhotoPopup(member.photo || getFallbackImage(member), e)} onError={(e) => e.target.src = getFallbackImage(member)} alt={member.prenoms} />
                                        {/* onClick du membre commenté */}
                                        <div className="member-info" /* onClick={() => openModal(member)} */>
                                            <strong>{member.prenoms} {member.nom}</strong>
                                            <p>{member.classeMethodiste || '-'}</p>
                                            <p className="text-sm text-gray-600">{member.telephone || '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {families?.links && (
                    <Pagination links={families.links} currentPage={families.current_page} perPage={families.per_page} total={families.total} onPageChange={handleFamilyPageChange} />
                )}
            </div>
        );
    };

    // La vue Classes a été supprimée
    const renderActiveView = () => {
        switch (currentView) {
            case 'all': return renderGridView();
            case 'families': return renderFamiliesView();
            default: return renderGridView();
        }
    };

    return (
        <>
            <Head title="Annuaire des membres" />
            <style>{GLOBAL_STYLES}</style>

            {/* MODAL FICHE MEMBRE - COMMENTÉ POUR NE PLUS S'AFFICHER */}
            {/* {isModalOpen && (
                <div className={`modal-overlay ${isExiting ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content ${isExiting ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold">Fiche membre</h2>
                            <button onClick={closeModal}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="modal-body">
                            <MemberDetailsModal member={selectedMember} userData={user} onClose={closeModal} />
                        </div>
                        <div className="modal-footer"><button onClick={closeModal} className="btn btn-secondary">Fermer</button></div>
                    </div>
                </div>
            )} */}

            {/* POPUP PHOTO - toujours actif */}
            {photoPopup.visible && (
                <div ref={popupRef} className={`photo-popup ${photoPopup.exiting ? 'closing' : ''}`} style={getPopupStyle()}>
                    <img src={photoPopup.src} alt="Agrandissement" />
                    <button className="photo-popup-close" onClick={closePhotoPopup}>×</button>
                </div>
            )}

            <div className="min-h-screen py-8 px-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
                <div className="w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 w-full">
                        <div className="w-full md:w-auto flex-shrink-0">
                            <Link href="/responsable-famille/dashboard" className="btn btn-secondary gap-2 w-full md:w-auto justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Retour
                            </Link>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-white text-center flex-1 order-first md:order-none">Annuaire des membres</h1>
                        <div className="w-full md:w-auto flex-shrink-0"></div>
                    </div>

                    <div className="glass-panel filters-bar">
                        <div className="filter-group">
                            <div className="input-search-wrapper">
                                <svg className="input-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input type="text" placeholder="Rechercher (nom, prénom, téléphone, profession, code membre, code famille)..." className="input-control input-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            {/* Filtre classe supprimé */}
                            <select value={familleFilter} onChange={e => setFamilleFilter(e.target.value)} className="input-control" style={{ minWidth: '140px' }}>
                                <option value="">Toutes familles</option>
                                {filterOptions.familles.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                            </select>
                            <select value={professionFilter} onChange={e => setProfessionFilter(e.target.value)} className="input-control" style={{ minWidth: '140px' }}>
                                <option value="">Toutes professions</option>
                                {filterOptions.professions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-control" style={{ minWidth: '140px' }}>
                                <option value="">Tous rôles</option>
                                {filterOptions.roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            <button onClick={resetFilters} className="btn btn-success">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                Réinitialiser
                            </button>
                        </div>

                        <div className="filter-second-row">
                            <div className="filter-nav">
                                {['all', 'families'].map(viewKey => (
                                    <button key={viewKey} className={`filter-nav-btn ${currentView === viewKey ? 'active' : ''}`} onClick={() => switchView(viewKey)}>
                                        {viewKey === 'all' ? 'Tous' : 'Familles'}
                                    </button>
                                ))}
                            </div>
                            {/* Pas de boutons Excel/PDF dans cette version */}
                        </div>
                    </div>

                    <div className="table-container mt-6">
                        {renderActiveView()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Annuaire;