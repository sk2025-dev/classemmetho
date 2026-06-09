import React, { useState, useEffect, useCallback, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";

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

    /* Nouveaux boutons personnalisés */
    .btn-excel { background-color: var(--primary); color: white; }
    .btn-excel:hover { background-color: var(--primary-hover); }
    .btn-pdf { background-color: var(--warning); color: white; }
    .btn-pdf:hover { background-color: #b45309; }

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

    /* Table Styles */
    .table-container { background: var(--glass-bg); border-radius: 1rem; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--glass-border); display: flex; flex-direction: column; flex: 1; min-height: 500px; position: relative; }
    .table-scroll { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; } 
    table { width: 100%; min-width: 2800px; border-collapse: collapse; text-align: left; }
    thead { background: #f59e0b; color: white; position: sticky; top: 0; z-index: 10; }
    th { padding: 0.75rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    td { padding: 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; vertical-align: middle; }
    tr:hover td { background-color: rgba(255, 255, 255, 0.9); }
    .status-badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid; align-items: center; }

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

    /* Styles pour le contenu du modal (cartes white smoke) */
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
    .spiritual-info p, .contact-info p, .other-info p {
        margin: 0.5rem 0;
        padding: 0.25rem 0;
        font-size: 0.95rem;
        color: #374151;
    }
    .actes-list ul {
        margin: 0.5rem 0 0 1.5rem;
        color: #4b5563;
    }
    .cotisations-info {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .cotisation-item {
        background: #ffffff;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        transition: background 0.2s;
        font-size: 0.95rem;
    }
    .cotisation-item:hover {
        background: #f3f4f6;
    }
    .solde {
        display: inline-block;
        margin-left: 1rem;
        font-weight: 600;
        color: var(--primary);
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

    /* Styles spécifiques à l'annuaire */
    .member-photo-small { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); cursor: pointer; transition: transform 0.2s; }
    .member-photo-small:hover { transform: scale(1.1); }

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
    
    /* Bannière semi-transparente */
    .grid-cover {
        height: 100px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
        position: relative;
        z-index: 1;
    }
    
    /* Conteneur de la photo de profil avec z-index supérieur */
    .grid-profile-container {
        display: flex;
        justify-content: center;
        position: relative;
        z-index: 2;
        margin-top: -40px; /* La photo chevauche la bannière */
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
    .grid-card-profession {
        font-size: 0.78rem;
        color: #9ca3af;
        font-style: italic;
        margin-top: 0.35rem;
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
const toText = (value, fallback = "-") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string" || typeof value === "number")
        return String(value);
    if (typeof value === "object") {
        return String(
            value.nom ?? value.label ?? value.name ?? value.code ?? fallback,
        );
    }
    return fallback;
};

const normalizeMember = (member) => {
    if (!member) return null;

    const prenoms = toText(member?.prenoms || member?.prenom || member?.full_name, "");
    const classeName = toText(member?.classe?.nom || member?.classeMethodiste || member?.classe, "-");
    const familleName = toText(
        member?.famille || member?.family?.nom || member?.family_name || member?.family_code, "-"
    );

    // Sacrements : extraits de la relation imbriquée member.sacrements
    const s = member?.sacrements || {};
    const baptise           = s.baptise           ?? member?.baptise           ?? false;
    const dateBapteme       = s.bapteme_date       || member?.dateBapteme       || s.date_bapteme       || null;
    const lieuBapteme       = s.bapteme_lieu       || member?.lieuBapteme       || s.lieu_bapteme       || null;
    const premiereCommunion = s.premiere_communion ?? member?.premiereCommunion ?? false;
    const dateCommunion     = s.premiere_communion_date || member?.dateCommunion || null;
    const lieuCommunion     = s.premiere_communion_lieu || member?.lieuCommunion || null;
    const marieReligieusement = s.marie_religieusement ?? member?.marieReligieusement ?? false;
    const dateMarReligieux  = s.mariage_religieux_date || member?.dateMarReligieux || null;
    const lieuMarReligieux  = s.mariage_religieux_lieu || member?.lieuMarReligieux || null;
    const mariageCivil      = s.est_marie          ?? member?.mariageCivil      ?? false;
    const dateMarCivil      = s.mariage_civil_date || member?.dateMarCivil      || null;
    const veuf              = s.est_veuf           ?? member?.veuf              ?? false;
    const divorce           = s.est_divorce        ?? member?.divorce           ?? false;
    const dote              = s.dot_effectue       ?? member?.dote              ?? false;

    return {
        ...member,
        // Identité
        prenoms,
        classeMethodiste: classeName,
        famille:     familleName,
        family:      member?.family || null,
        codeFamille: member?.code_famille || member?.family?.code_famille || null,
        codeMembre:  member?.numMembre    || member?.code_membre          || null,
        photo:       member?.photo        || member?.profile_photo_url    || "",
        sexe:        toText(member?.sexe  || member?.genre, ""),
        dateNaissance: member?.dateNaissance || member?.date_naissance    || null,
        lieu_naissance: member?.lieu_naissance || null,
        telephone:   toText(member?.telephone, "-"),
        email:       toText(member?.email, "-"),
        fonction: Array.isArray(member?.fonctions) && member.fonctions.length > 0
            ? member.fonctions.map(f => f.nom || f).join(", ")
            : toText(member?.fonction, "-"),
        profession:    toText(member?.profession, "-"),
        niveau_etude:  member?.niveau_etude  || null,
        relation:      toText(member?.relation, "-"),
        statut_marital: member?.statut_marital || null,
        adresse:   toText(member?.adresse   || member?.family?.adresse   || member?.address, "-"),
        quartier:  toText(member?.quartier  || member?.family?.quartier, "-"),
        // Sacrements (extraits proprement)
        baptise, dateBapteme, lieuBapteme,
        premiereCommunion, dateCommunion, lieuCommunion,
        marieReligieusement, dateMarReligieux, lieuMarReligieux,
        mariageCivil, dateMarCivil,
        veuf, divorce, dote,
        confirme: s.confirme ?? member?.confirme ?? false,
    };
};

// --- Composant Badge pour le statut (baptisé/non baptisé) ---
const MemberStatusBadge = ({ member }) => {
    const isBaptized = member.baptise;
    const className = isBaptized
        ? "status-badge bg-green-100 text-green-800 border-green-200"
        : "status-badge bg-gray-100 text-gray-800 border-gray-200";
    const icon = isBaptized ? (
        <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
            />
        </svg>
    ) : (
        <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
    return (
        <span className={`${className} items-center`}>
            {icon}
            {isBaptized ? "Baptisé" : "Non baptisé"}
        </span>
    );
};

// --- Composant pour les détails du membre ---
const MemberDetailsModal = ({
    member,
    cotisations,
    actesLiturgiques,
    userData,
    onClose,
}) => {
    const getFallbackAvatar = (initial) => {
        return `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#fbbf24"/>
                <text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-weight="bold">
                    ${initial}
                </text>
            </svg>`,
        )}`;
    };

    const initial = (member?.prenoms || member?.nom || "?")
        .charAt(0)
        .toUpperCase();
    const fallbackAvatar = getFallbackAvatar(initial);
    const photoSrc = member?.photo || fallbackAvatar;

    if (!member) return null;

    return (
        <div className="member-details">
            {/* IDENTITÉ */}
            <div className="detail-section">
                <h3>🧍 Identité</h3>
                <div className="member-identity">
                    <div className="member-photo-large">
                        <img
                            src={photoSrc}
                            alt={`${member.prenoms} ${member.nom}`}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackAvatar;
                            }}
                        />
                    </div>
                    <div className="member-identity-info">
                        <p>
                            <strong>Nom & Prénoms :</strong> {member.prenoms}{" "}
                            {member.nom}
                        </p>
                        <p>
                            <strong>Genre :</strong>{" "}
                            {member.sexe === "M" ? "Masculin" : "Féminin"}
                        </p>
                        <p>
                            <strong>Date de naissance :</strong>{" "}
                            {member.dateNaissance
                                ? new Date(member.dateNaissance).toLocaleDateString("fr-FR")
                                : "-"}
                        </p>
                        {member.lieu_naissance && (
                            <p>
                                <strong>Lieu de naissance :</strong>{" "}
                                {member.lieu_naissance}
                            </p>
                        )}

                        {/* ── Identifiants ── */}
                        <p>
                            <strong>Code membre :</strong>{" "}
                            <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                                {member.codeMembre || "-"}
                            </span>
                        </p>
                        <p>
                            <strong>Code famille :</strong>{" "}
                            <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                                {member.codeFamille || member?.family?.code_famille || "-"}
                            </span>
                        </p>

                        {/* ── Famille ── */}
                        <p>
                            <strong>Famille :</strong> {member.famille || "-"}
                        </p>
                        <p>
                            <strong>Relation familiale :</strong>{" "}
                            <span style={{ color: "#7c3aed", fontWeight: 600 }}>
                                {member.relation || "-"}
                            </span>
                        </p>

                        {/* ── Classe & Rôle ── */}
                        <p>
                            <strong>Classe méthodiste :</strong>{" "}
                            {member.classeMethodiste || "-"}
                        </p>
                        <p>
                            <strong>Fonction :</strong> {member.fonction || "-"}
                        </p>
                        <p>
                            <strong>Profession :</strong>{" "}
                            {member.profession || "-"}
                        </p>
                        {member.niveau_etude && (
                            <p>
                                <strong>Niveau d'étude :</strong> {member.niveau_etude}
                            </p>
                        )}

                        {/* ── Divers ── */}
                        {member.numero_cni && (
                            <p>
                                <strong>N° CNI :</strong> {member.numero_cni}
                            </p>
                        )}
                        {member.hors_communaute && (
                            <p>
                                <strong>Hors communauté :</strong> Oui
                            </p>
                        )}
                        {member.retrait && (
                            <p>
                                <strong>Retrait :</strong> Oui
                                {member.date_retrait && ` — ${member.date_retrait}`}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* INFORMATIONS SPIRITUELLES */}
            <div className="detail-section">
                <h3>🕊️ Informations spirituelles</h3>
                <div className="spiritual-info">
                    {/* Baptême */}
                    <p>
                        <strong>Baptême :</strong>{" "}
                        <span style={{ color: member.baptise ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {member.baptise ? "Oui" : "Non"}
                        </span>
                        {member.dateBapteme && (
                            <span style={{ color: "#6b7280", marginLeft: 6 }}>
                                — le {new Date(member.dateBapteme).toLocaleDateString("fr-FR")}
                            </span>
                        )}
                    </p>
                    {member.lieuBapteme && (
                        <p style={{ paddingLeft: 12 }}>
                            <strong>Lieu de baptême :</strong> {member.lieuBapteme}
                        </p>
                    )}

                    {/* 1ère Communion */}
                    <p>
                        <strong>1ère Communion :</strong>{" "}
                        <span style={{ color: member.premiereCommunion ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {member.premiereCommunion ? "Oui" : "Non"}
                        </span>
                        {member.dateCommunion && (
                            <span style={{ color: "#6b7280", marginLeft: 6 }}>
                                — le {new Date(member.dateCommunion).toLocaleDateString("fr-FR")}
                            </span>
                        )}
                    </p>
                    {member.lieuCommunion && (
                        <p style={{ paddingLeft: 12 }}>
                            <strong>Lieu :</strong> {member.lieuCommunion}
                        </p>
                    )}

                    {/* Mariage religieux */}
                    <p>
                        <strong>Mariage religieux :</strong>{" "}
                        <span style={{ color: member.marieReligieusement ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {member.marieReligieusement ? "Oui" : "Non"}
                        </span>
                        {member.dateMarReligieux && (
                            <span style={{ color: "#6b7280", marginLeft: 6 }}>
                                — le {new Date(member.dateMarReligieux).toLocaleDateString("fr-FR")}
                            </span>
                        )}
                    </p>
                    {member.lieuMarReligieux && (
                        <p style={{ paddingLeft: 12 }}>
                            <strong>Lieu :</strong> {member.lieuMarReligieux}
                        </p>
                    )}

                    <p>
                        <strong>Confirmation :</strong>{" "}
                        <span style={{ color: member.confirme ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {member.confirme ? "Oui" : "Non"}
                        </span>
                    </p>

                    <div className="actes-list">
                        <strong>Actes liturgiques associés :</strong>
                        {actesLiturgiques && actesLiturgiques.length > 0 ? (
                            <ul>
                                {actesLiturgiques.map((acte, index) => (
                                    <li key={index}>
                                        {acte.typeName} —{" "}
                                        {new Date(acte.proposedDate).toLocaleDateString("fr-FR")}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucun acte liturgique enregistré.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* INFORMATIONS FAMILIALES */}
            <div className="detail-section">
                <h3>👪 Informations familiales</h3>
                <div className="spiritual-info">
                    {member.statut_marital && (
                        <p>
                            <strong>Statut marital :</strong>{" "}
                            <span style={{ color: "#1d4ed8", fontWeight: 600 }}>{member.statut_marital}</span>
                        </p>
                    )}
                    <p>
                        <strong>Mariage civil :</strong>{" "}
                        <span style={{ color: member.mariageCivil ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            {member.mariageCivil ? "Oui" : "Non"}
                        </span>
                        {member.dateMarCivil && (
                            <span style={{ color: "#6b7280", marginLeft: 6 }}>
                                — le {new Date(member.dateMarCivil).toLocaleDateString("fr-FR")}
                            </span>
                        )}
                    </p>
                    <p>
                        <strong>Doté :</strong>{" "}
                        <span style={{ fontWeight: 600 }}>{member.dote ? "Oui" : "Non"}</span>
                    </p>
                    <p>
                        <strong>Divorcé :</strong>{" "}
                        <span style={{ fontWeight: 600 }}>{member.divorce ? "Oui" : "Non"}</span>
                    </p>
                    <p>
                        <strong>Veuf/Veuve :</strong>{" "}
                        <span style={{ fontWeight: 600 }}>{member.veuf ? "Oui" : "Non"}</span>
                    </p>
                </div>
            </div>

            {/* CONTACT */}
            <div className="detail-section">
                <h3>🧾 Contact</h3>
                <div className="contact-info">
                    <p><strong>Téléphone :</strong> {member.telephone || "-"}</p>
                    <p><strong>Email :</strong> {member.email || "-"}</p>
                    <p><strong>Adresse :</strong> {member.adresse || "-"}</p>
                    {member.quartier && (
                        <p><strong>Quartier :</strong> {member.quartier}</p>
                    )}
                </div>
            </div>

            {/* COTISATIONS */}
            <div className="detail-section">
                <h3>💰 Cotisations</h3>
                <div className="cotisations-info">
                    {cotisations?.fimeco ? (
                        <div className="cotisation-item">
                            <strong>FIMECO :</strong>{" "}
                            {cotisations.fimeco.montantPaye} FCFA /{" "}
                            {cotisations.fimeco.montantDu} FCFA
                            <span className="solde">
                                Solde : {cotisations.fimeco.solde} FCFA
                            </span>
                        </div>
                    ) : (
                        <p>FIMECO : Aucune souscription</p>
                    )}
                    {cotisations?.autres && cotisations.autres.length > 0 ? (
                        <div className="cotisation-item">
                            <strong>Autres cotisations :</strong>
                            <ul>
                                {cotisations.autres.map((c, index) => (
                                    <li key={index}>{c.nom} : {c.montant} FCFA</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>Autres cotisations : Aucune</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== COMPOSANT PRINCIPAL ====================
const Annuaire = ({
    members = null,
    families = null,
    classes = null,
    view = "all",
    cotisations = {},
    user = { role: "user" },
    filters = {},
    filterOptions = { classes: [], familles: [], professions: [], roles: [] }, // <-- professions remplace statuts
}) => {
    const toPaginated = (source, defaultPerPage = 10) => {
        if (!source)
            return {
                data: [],
                links: [],
                current_page: 1,
                per_page: defaultPerPage,
                total: 0,
            };
        if (Array.isArray(source)) {
            return {
                data: source,
                links: [],
                current_page: 1,
                per_page: source.length || defaultPerPage,
                total: source.length,
            };
        }
        return {
            data: Array.isArray(source.data) ? source.data : [],
            links: Array.isArray(source.links) ? source.links : [],
            current_page: source.current_page || 1,
            per_page: source.per_page || defaultPerPage,
            total:
                source.total ||
                (Array.isArray(source.data) ? source.data.length : 0),
        };
    };

    const membersPage = toPaginated(members, 10);
    const familiesPage = toPaginated(families, 10);
    const classesPage = toPaginated(classes, 10);

    const {
        data: paginatedMembers,
        links: membersLinks,
        current_page: membersCurrentPage,
        per_page: membersPerPage,
        total: membersTotal,
    } = membersPage;

    // États des filtres
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [searchInput, setSearchInput] = useState(filters.search || "");
    const [classeFilter, setClasseFilter] = useState(filters.classe || "");
    const [familleFilter, setFamilleFilter] = useState(filters.famille || "");
    const [professionFilter, setProfessionFilter] = useState(
        filters.profession || "",
    );
    const [roleFilter, setRoleFilter] = useState(filters.role || "");
    const [itemsPerPage, setItemsPerPage] = useState(filters.perPage || 10);

    const [currentView, setCurrentView] = useState(view);
    const [viewMode, setViewMode] = useState("grid");

    // États pour modales et popups
    const [selectedMember, setSelectedMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [photoPopup, setPhotoPopup] = useState({
        visible: false,
        src: "",
        x: 0,
        y: 0,
        exiting: false,
    });
    const popupRef = useRef(null);
    const [actesLiturgiques, setActesLiturgiques] = useState([]);
    const [classMemberPages, setClassMemberPages] = useState({});

    const PARAM_DEFAULTS = { page: 1, perPage: 10, view: "all" };
    const buildParams = (raw) =>
        Object.fromEntries(
            Object.entries(raw).filter(([k, v]) =>
                v !== "" && v !== null && v !== undefined && v !== PARAM_DEFAULTS[k]
            )
        );

    // Application des filtres
    const applyFilters = useCallback(() => {
        router.get(
            window.location.pathname,
            buildParams({
                search: searchTerm,
                classe: classeFilter,
                famille: familleFilter,
                profession: professionFilter,
                role: roleFilter,
                perPage: itemsPerPage,
                view: currentView,
                page: 1,
            }),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [
        searchTerm,
        classeFilter,
        familleFilter,
        professionFilter,
        roleFilter,
        itemsPerPage,
        currentView,
    ]);

    const submitSearch = () => {
        const nextSearch = searchInput.trim();
        setSearchInput(nextSearch);
        setSearchTerm(nextSearch);
    };

    useEffect(() => {
        const handler = setTimeout(() => applyFilters(), 100);
        return () => clearTimeout(handler);
    }, [applyFilters]);

    const switchView = (newView) => {
        setCurrentView(newView);
        router.get(
            window.location.pathname,
            buildParams({
                search: searchTerm,
                classe: classeFilter,
                famille: familleFilter,
                profession: professionFilter,
                role: roleFilter,
                view: newView,
                page: 1,
                familiesPerPage: 5,
                classesPerPage: 1,
            }),
            { preserveState: true, preserveScroll: true },
        );
        setClassMemberPages({});
    };

    const handlePageChange = (url) => {
        if (url)
            router.get(url, {}, { preserveState: true, preserveScroll: true });
    };
    const handleFamilyPageChange = (url) => {
        if (url)
            router.get(url, {}, { preserveState: true, preserveScroll: true });
    };
    const handleClassPageChange = (url) => {
        if (url)
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        setClassMemberPages({});
    };
    const handlePerPageChange = (newPerPage) => setItemsPerPage(newPerPage);

    const resetFilters = () => {
        setSearchTerm("");
        setSearchInput("");
        setClasseFilter("");
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
        setPhotoPopup((prev) => ({ ...prev, exiting: true }));
        setTimeout(
            () =>
                setPhotoPopup({
                    visible: false,
                    src: "",
                    x: 0,
                    y: 0,
                    exiting: false,
                }),
            150,
        );
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                photoPopup.visible &&
                popupRef.current &&
                !popupRef.current.contains(event.target)
            )
                closePhotoPopup();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [photoPopup.visible]);

    const getFallbackImage = (member) => {
        const normalized = normalizeMember(member);
        const initial = (normalized.prenoms || normalized.nom || "?")
            .charAt(0)
            .toUpperCase();
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2563eb"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="white" font-weight="bold">${initial}</text></svg>`)}`;
    };

    const loadMemberCotisations = (member) => {
        if (!cotisations || typeof cotisations !== "object")
            return { fimeco: null, autres: [] };
        let fimecoData = null;
        if (Array.isArray(cotisations.fimeco))
            fimecoData =
                cotisations.fimeco.find((c) => c.famille === member.famille) ||
                null;
        let autresData = Array.isArray(cotisations.autres)
            ? cotisations.autres
            : [];
        return { fimeco: fimecoData, autres: autresData };
    };

    const getPopupStyle = () => {
        if (!photoPopup.visible) return {};
        const popupWidth = 260,
            popupHeight = 260;
        let left = photoPopup.x + 10,
            top = photoPopup.y - popupHeight / 2;
        if (left + popupWidth > window.innerWidth)
            left = photoPopup.x - popupWidth - 10;
        if (top < 0) top = 10;
        if (top + popupHeight > window.innerHeight)
            top = window.innerHeight - popupHeight - 10;
        return { left, top };
    };

    // ========== EXPORT EXCEL ==========
    const exportToExcel = () => {
        if (paginatedMembers.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }

        const columns = [
            "#",
            "Nom",
            "Prénoms",
            "Genre",
            "Famille",
            "Code famille",
            "Code membre",
            "Classe",
            "Téléphone",
            "Email",
            "Baptême",
            "Relation",
            "1ère communion",
            "Mariage civil",
            "Mariage religieux",
            "Doté",
            "Veuf",
            "Date naissance",
            "Fonction",
            "Profession",
        ];

        const rows = paginatedMembers.map((member, idx) => {
            const normalized = normalizeMember(member);
            const rowNumber =
                (membersCurrentPage - 1) * membersPerPage + idx + 1;
            return [
                rowNumber,
                normalized.nom || "",
                normalized.prenoms || "",
                normalized.sexe === "M" ? "Masculin" : "Féminin",
                normalized.famille || "",
                normalized.codeFamille || "",
                normalized.codeMembre || "",
                normalized.classeMethodiste || "",
                normalized.telephone || "",
                normalized.email || "",
                normalized.baptise ? "Oui" : "Non",
                normalized.relation || "",
                normalized.premiereCommunion ? "Oui" : "Non",
                normalized.mariageCivil ? "Oui" : "Non",
                normalized.marieReligieusement ? "Oui" : "Non",
                normalized.dote ? "Oui" : "Non",
                normalized.veuf ? "Oui" : "Non",
                normalized.dateNaissance || "",
                normalized.fonction || "",
                normalized.profession || "",
            ];
        });

        const csvContent = [
            columns.join(";"),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const cellStr = cell.toString().replace(/"/g, '""');
                        return cellStr.includes(";") || cellStr.includes('"')
                            ? `"${cellStr}"`
                            : cellStr;
                    })
                    .join(";"),
            ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute(
            "download",
            `annuaire_membres_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ========== EXPORT PDF ==========
    const exportToPDF = async () => {
        if (paginatedMembers.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }

        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            const doc = new jsPDF({ orientation: "landscape" });
            const logoPath = "/images/image.png";
            try {
                const response = await fetch(logoPath);
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const logoData = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    doc.addImage(logoData, "PNG", 257, 10, 30, 15);
                }
            } catch (e) {
                console.log("Logo non chargé, génération sans logo.");
            }

            doc.setFontSize(18);
            doc.text("Annuaire des membres", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Export du ${new Date().toLocaleDateString()}`, 14, 30);

            const columns = [
                { header: "#", dataKey: "index" },
                { header: "Nom", dataKey: "nom" },
                { header: "Prénoms", dataKey: "prenoms" },
                { header: "Genre", dataKey: "genre" },
                { header: "Famille", dataKey: "famille" },
                { header: "Code famille", dataKey: "codeFamille" },
                { header: "Code membre", dataKey: "codeMembre" },
                { header: "Classe", dataKey: "classe" },
                { header: "Téléphone", dataKey: "telephone" },
                { header: "Email", dataKey: "email" },
                { header: "Baptême", dataKey: "baptise" },
                { header: "Relation", dataKey: "relation" },
                { header: "1ère communion", dataKey: "premiereCommunion" },
                { header: "Mariage civil", dataKey: "mariageCivil" },
                { header: "Mariage religieux", dataKey: "marieReligieusement" },
                { header: "Doté", dataKey: "dote" },
                { header: "Veuf", dataKey: "veuf" },
                { header: "Date naiss.", dataKey: "dateNaissance" },
                { header: "Fonction", dataKey: "fonction" },
                { header: "Profession", dataKey: "profession" },
            ];

            const data = paginatedMembers.map((member, idx) => {
                const normalized = normalizeMember(member);
                const rowNumber =
                    (membersCurrentPage - 1) * membersPerPage + idx + 1;
                return {
                    index: rowNumber,
                    nom: normalized.nom || "",
                    prenoms: normalized.prenoms || "",
                    genre: normalized.sexe === "M" ? "Masculin" : "Féminin",
                    famille: normalized.famille || "",
                    codeFamille: normalized.codeFamille || "",
                    codeMembre: normalized.codeMembre || "",
                    classe: normalized.classeMethodiste || "",
                    telephone: normalized.telephone || "",
                    email: normalized.email || "",
                    baptise: normalized.baptise ? "Oui" : "Non",
                    relation: normalized.relation || "",
                    premiereCommunion: normalized.premiereCommunion
                        ? "Oui"
                        : "Non",
                    mariageCivil: normalized.mariageCivil ? "Oui" : "Non",
                    marieReligieusement: normalized.marieReligieusement
                        ? "Oui"
                        : "Non",
                    dote: normalized.dote ? "Oui" : "Non",
                    veuf: normalized.veuf ? "Oui" : "Non",
                    dateNaissance: normalized.dateNaissance || "",
                    fonction: normalized.fonction || "",
                    profession: normalized.profession || "",
                };
            });

            autoTable(doc, {
                columns,
                body: data,
                startY: 40,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });
            doc.save(
                `annuaire_membres_${new Date().toISOString().slice(0, 10)}.pdf`,
            );
        } catch (error) {
            console.error("Erreur lors de la génération du PDF :", error);
            alert(
                "Impossible de générer le PDF. Vérifiez que les bibliothèques 'jspdf' et 'jspdf-autotable' sont installées.",
            );
        }
    };

    const Pagination = ({
        links,
        currentPage,
        perPage,
        total,
        onPageChange,
    }) => {
        if (!links || links.length <= 3) return null;
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-sm border-t border-white/50">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                        Affichage de {(currentPage - 1) * perPage + 1} à{" "}
                        {Math.min(currentPage * perPage, total)} sur {total}{" "}
                        membres
                    </span>
                    {currentView === "all" && (
                        <select
                            value={perPage}
                            onChange={(e) => {
                                const newPerPage = parseInt(e.target.value);
                                onPageChange(null, newPerPage);
                            }}
                            className="input-control !py-1 !px-2 text-sm"
                        >
                            <option value={10}>10 par page</option>
                            <option value={20}>20 par page</option>
                            <option value={50}>50 par page</option>
                            <option value={100}>100 par page</option>
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    {links.map((link, index) => {
                        if (link.url === null) {
                            return (
                                <span
                                    key={index}
                                    className="btn btn-secondary !py-1 !px-3 disabled opacity-50 cursor-not-allowed"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            );
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => onPageChange(link.url)}
                                className={`btn !py-1 !px-3 ${link.active ? "btn-primary" : "btn-secondary"}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    // ========== VUES ==========
    const localSearchQuery = searchInput.trim().toLowerCase();
    const matchesLocalSearch = (member) => {
        if (!localSearchQuery) return true;
        const haystack = [
            member.nom,
            member.prenoms,
            member.telephone,
            member.profession,
            member.codeMembre,
            member.codeFamille,
            member.famille,
            member.classeMethodiste,
            member.email,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(localSearchQuery);
    };
    const filterMembersBySearch = (members) =>
        members.filter(matchesLocalSearch);
    const renderTableView = () => {
        const normalizedMembers = paginatedMembers
            .map(normalizeMember)
            .filter(Boolean);
        const visibleMembers = filterMembersBySearch(normalizedMembers);
        return (
            <>
                <div className="table-scroll">
                    <table style={{ minWidth: "2800px" }}>
                        <thead>
                            <tr>
                                <th className="text-center">#</th>
                                <th className="text-center">Photo</th>
                                <th className="text-center">Nom & Prénoms</th>
                                <th className="text-center">Genre</th>
                                <th className="text-center">Famille</th>
                                <th className="text-center">Code famille</th>
                                <th className="text-center">Code membre</th>
                                <th className="text-center">Classe</th>
                                <th className="text-center">Téléphone</th>
                                <th className="text-center">Email</th>
                                <th className="text-center">Baptême</th>
                                <th className="text-center">Relation</th>
                                <th className="text-center">1ère communion</th>
                                <th className="text-center">Mariage civil</th>
                                <th className="text-center">
                                    Mariage religieux
                                </th>
                                <th className="text-center">Doté</th>
                                <th className="text-center">Veuf</th>
                                <th className="text-center">Date naiss.</th>
                                <th className="text-center">Fonction</th>
                                <th className="text-center">Profession</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleMembers.length > 0 ? (
                                visibleMembers.map((member, idx) => {
                                    const rowNumber =
                                        (membersCurrentPage - 1) *
                                            membersPerPage +
                                        idx +
                                        1;
                                    return (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-white/90 transition"
                                        >
                                            <td className="text-center">
                                                {rowNumber}
                                            </td>
                                            <td className="text-center">
                                                <img
                                                    src={
                                                        member.photo ||
                                                        getFallbackImage(member)
                                                    }
                                                    className="member-photo-small mx-auto"
                                                    onClick={(e) =>
                                                        openPhotoPopup(
                                                            member.photo ||
                                                                getFallbackImage(
                                                                    member,
                                                                ),
                                                            e,
                                                        )
                                                    }
                                                    onError={(e) => {
                                                        e.target.src =
                                                            getFallbackImage(
                                                                member,
                                                            );
                                                    }}
                                                    alt={member.prenoms}
                                                />
                                            </td>
                                            <td className="text-center font-medium">
                                                {member.prenoms} {member.nom}
                                            </td>
                                            <td className="text-center">
                                                {member.sexe === "M"
                                                    ? "Masculin"
                                                    : "Féminin"}
                                            </td>
                                            <td className="text-center">
                                                {member.famille || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.codeFamille || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.codeMembre || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.classeMethodiste || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.telephone || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.email || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.baptise ? "Oui" : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.relation || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.premiereCommunion
                                                    ? "Oui"
                                                    : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.mariageCivil
                                                    ? "Oui"
                                                    : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.marieReligieusement
                                                    ? "Oui"
                                                    : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.dote ? "Oui" : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.veuf ? "Oui" : "Non"}
                                            </td>
                                            <td className="text-center">
                                                {member.dateNaissance
                                                    ? new Date(
                                                          member.dateNaissance,
                                                      ).toLocaleDateString(
                                                          "fr-FR",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.fonction || "-"}
                                            </td>
                                            <td className="text-center">
                                                {member.profession || "-"}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() =>
                                                        openModal(member)
                                                    }
                                                    className="btn btn-view text-xs px-3 py-1.5"
                                                >
                                                    <svg
                                                        className="w-4 h-4 inline mr-1"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                    Voir
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={21}
                                        className="text-center py-12 text-gray-400 italic"
                                    >
                                        Aucun membre trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    links={membersLinks}
                    currentPage={membersCurrentPage}
                    perPage={membersPerPage}
                    total={membersTotal}
                    onPageChange={(url, newPerPage) => {
                        if (newPerPage) handlePerPageChange(newPerPage);
                        else handlePageChange(url);
                    }}
                />
            </>
        );
    };

    const renderGridView = () => {
        const normalizedMembers = paginatedMembers
            .map(normalizeMember)
            .filter(Boolean);
        const visibleMembers = filterMembersBySearch(normalizedMembers);
        return (
            <>
                <div className="grid-view">
                    {visibleMembers.length > 0 ? (
                        visibleMembers.map((member) => (
                            <div key={member.id} className="grid-card">
                                <div className="grid-cover"></div>
                                <div className="grid-profile-container">
                                    <div
                                        className="grid-profile-photo"
                                        onClick={(e) =>
                                            openPhotoPopup(
                                                member.photo ||
                                                    getFallbackImage(member),
                                                e,
                                            )
                                        }
                                    >
                                        <img
                                            src={
                                                member.photo ||
                                                getFallbackImage(member)
                                            }
                                            onError={(e) => {
                                                e.target.src =
                                                    getFallbackImage(member);
                                            }}
                                            alt={member.prenoms}
                                        />
                                    </div>
                                </div>
                                <div className="grid-card-info">
                                    <h4>
                                        {member.prenoms} {member.nom}
                                    </h4>
                                    <div className="grid-card-famille">
                                        {member.famille || "-"}
                                    </div>
                                    <div className="grid-card-classe">
                                        {member.classeMethodiste || "-"}
                                    </div>
                                    <div className="grid-card-contact">
                                        <svg
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                        {member.telephone || "-"}
                                    </div>
                                    <div className="grid-card-contact">
                                        <svg
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        {member.email || "-"}
                                    </div>
                                    {member.profession && member.profession !== "-" && (
                                        <div className="grid-card-profession">
                                            💼 {member.profession}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => openModal(member)}
                                        className="btn btn-view mt-3 w-full"
                                    >
                                        Voir profil
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center py-12 text-gray-400 italic">
                            Aucun membre trouvé.
                        </p>
                    )}
                </div>
                <Pagination
                    links={membersLinks}
                    currentPage={membersCurrentPage}
                    perPage={membersPerPage}
                    total={membersTotal}
                    onPageChange={(url, newPerPage) => {
                        if (newPerPage) handlePerPageChange(newPerPage);
                        else handlePageChange(url);
                    }}
                />
            </>
        );
    };

    const renderFamiliesView = () => {
        const familyData = familiesPage.data || [];
        if (familyData.length === 0)
            return (
                <p className="text-center py-12 text-gray-400 italic">
                    Aucune famille trouvée.
                </p>
            );
        const hasLocalSearch = localSearchQuery.length > 0;
        const visibleFamilies = familyData
            .map((family) => {
                const normalizedMembers = (family.members || [])
                    .map(normalizeMember)
                    .filter(Boolean);
                const visibleMembers = filterMembersBySearch(
                    normalizedMembers,
                );
                if (hasLocalSearch && visibleMembers.length === 0) {
                    return null;
                }
                return {
                    family,
                    members: visibleMembers,
                    count: hasLocalSearch
                        ? visibleMembers.length
                        : family.count,
                };
            })
            .filter(Boolean);
        if (visibleFamilies.length === 0)
            return (
                <p className="text-center py-12 text-gray-400 italic">
                    Aucun membre trouvé.
                </p>
            );
        return (
            <div className="families-list">
                {visibleFamilies.map(({ family, members, count }) => (
                    <div key={family.id} className="family-group">
                        <div className="family-header">
                            <h3>{family.nom}</h3>
                            <span className="family-count">{count}</span>
                        </div>
                        <div className="family-members">
                            {members.map((normalized) => (
                                <div
                                    key={normalized.id}
                                    className="family-member-item"
                                >
                                    <img
                                        src={
                                            normalized.photo ||
                                            getFallbackImage(normalized)
                                        }
                                        onClick={(e) =>
                                            openPhotoPopup(
                                                normalized.photo ||
                                                    getFallbackImage(
                                                        normalized,
                                                    ),
                                                e,
                                            )
                                        }
                                        onError={(e) => {
                                            e.target.src =
                                                getFallbackImage(normalized);
                                        }}
                                        alt={normalized.prenoms}
                                    />
                                    <div
                                        className="member-info"
                                        onClick={() => openModal(normalized)}
                                    >
                                        <strong>
                                            {normalized.prenoms} {normalized.nom}
                                        </strong>
                                        <p>
                                            {normalized.classeMethodiste ||
                                                "-"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {normalized.telephone || "-"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <Pagination
                    links={familiesPage.links}
                    currentPage={familiesPage.current_page}
                    perPage={familiesPage.per_page}
                    total={familiesPage.total}
                    onPageChange={handleFamilyPageChange}
                />
            </div>
        );
    };

    const renderClassesView = () => {
        const classData = classesPage.data || [];
        if (classData.length === 0)
            return (
                <p className="text-center py-12 text-gray-400 italic">
                    Aucune classe trouvée.
                </p>
            );
        return (
            <div className="classes-list">
                {classData.map((classe) => {
                    const members = classe.members || [];
                    const normalizedMembers = members
                        .map(normalizeMember)
                        .filter(Boolean);
                    const filteredMembers = filterMembersBySearch(
                        normalizedMembers,
                    );
                    if (localSearchQuery && filteredMembers.length === 0) {
                        return null;
                    }
                    const totalMembers = filteredMembers.length;
                    const membersPerPageLocal = 10;
                    const currentPage = classMemberPages[classe.id] || 1;
                    const totalPages = Math.ceil(
                        totalMembers / membersPerPageLocal,
                    );
                    const startIndex = (currentPage - 1) * membersPerPageLocal;
                    const displayedMembers = filteredMembers.slice(
                        startIndex,
                        startIndex + membersPerPageLocal,
                    );
                    return (
                        <div key={classe.id} className="class-group">
                            <div className="class-header">
                                <h3>{classe.nom}</h3>
                                <span className="class-count">
                                    {totalMembers}
                                </span>
                            </div>
                            <div className="class-members">
                                {displayedMembers.map((normalized) => {
                                    return (
                                        <div
                                            key={normalized.id}
                                            className="class-member-item"
                                        >
                                            <img
                                                src={
                                                    normalized.photo ||
                                                    getFallbackImage(normalized)
                                                }
                                                onClick={(e) =>
                                                    openPhotoPopup(
                                                        normalized.photo ||
                                                            getFallbackImage(
                                                                normalized,
                                                            ),
                                                        e,
                                                    )
                                                }
                                                onError={(e) => {
                                                    e.target.src =
                                                        getFallbackImage(
                                                            normalized,
                                                        );
                                                }}
                                                alt={normalized.prenoms}
                                            />
                                            <div
                                                className="member-info"
                                                onClick={() =>
                                                    openModal(normalized)
                                                }
                                            >
                                                <strong>
                                                    {normalized.prenoms}{" "}
                                                    {normalized.nom}
                                                </strong>
                                                <p>
                                                    {normalized.famille || "-"}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {normalized.telephone ||
                                                        "-"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 p-4 border-t border-white/50">
                                    <button
                                        onClick={() =>
                                            setClassMemberPages((prev) => ({
                                                ...prev,
                                                [classe.id]: currentPage - 1,
                                            }))
                                        }
                                        disabled={currentPage === 1}
                                        className="btn btn-icon !p-2 disabled:opacity-50"
                                        aria-label="Page précédente"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setClassMemberPages((prev) => ({
                                                ...prev,
                                                [classe.id]: currentPage + 1,
                                            }))
                                        }
                                        disabled={currentPage === totalPages}
                                        className="btn btn-icon !p-2 disabled:opacity-50"
                                        aria-label="Page suivante"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                <Pagination
                    links={classesPage.links}
                    currentPage={classesPage.current_page}
                    perPage={classesPage.per_page}
                    total={classesPage.total}
                    onPageChange={handleClassPageChange}
                />
            </div>
        );
    };

    const renderActiveView = () => {
        switch (currentView) {
            case "all":
                return viewMode === "table"
                    ? renderTableView()
                    : renderGridView();
            case "families":
                return renderFamiliesView();
            case "classes":
                return renderClassesView();
            default:
                return renderTableView();
        }
    };

    return (
        <>
            <Head title="Annuaire des membres" />
            <style>{GLOBAL_STYLES}</style>

            {isModalOpen && (
                <div
                    className={`modal-overlay ${isExiting ? "closing" : ""}`}
                    onClick={closeModal}
                >
                    <div
                        className={`modal-content ${isExiting ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="text-xl font-bold">Fiche membre</h2>
                            <button onClick={closeModal}>
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <MemberDetailsModal
                                member={selectedMember}
                                cotisations={
                                    selectedMember
                                        ? loadMemberCotisations(selectedMember)
                                        : {}
                                }
                                actesLiturgiques={actesLiturgiques}
                                userData={user}
                                onClose={closeModal}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={closeModal}
                                className="btn btn-secondary"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {photoPopup.visible && (
                <div
                    ref={popupRef}
                    className={`photo-popup ${photoPopup.exiting ? "closing" : ""}`}
                    style={getPopupStyle()}
                >
                    <img src={photoPopup.src} alt="Agrandissement" />
                    <button
                        className="photo-popup-close"
                        onClick={closePhotoPopup}
                    >
                        ×
                    </button>
                </div>
            )}

            <div
                className="min-h-screen py-8 px-4 animate-fade-in-up"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 w-full">
                        <div className="w-full md:w-auto flex-shrink-0">
                            <Link
                                href={withBasePath("", "/bureau-conducteur/dashboard")}
                                className="btn btn-secondary gap-2 w-full md:w-auto justify-center"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Retour
                            </Link>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-white text-center flex-1 order-first md:order-none">
                            Annuaire des membres
                        </h1>
                        <div className="w-full md:w-auto flex-shrink-0"></div>
                    </div>

                    <div className="glass-panel filters-bar">
                        <div className="filter-group">
                            <div className="input-search-wrapper">
                                <svg
                                    className="input-search-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Rechercher (nom, prénom, téléphone, profession, code membre, code famille)..."
                                    className="input-control input-search"
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            submitSearch();
                                        }
                                    }}
                                />
                            </div>

                            <select
                                value={classeFilter}
                                onChange={(e) =>
                                    setClasseFilter(e.target.value)
                                }
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Toutes classes</option>
                                {filterOptions.classes.map((c, idx) => (
                                    <option
                                        key={`classe-${c.id}-${idx}`}
                                        value={c.id}
                                    >
                                        {c.nom}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={familleFilter}
                                onChange={(e) =>
                                    setFamilleFilter(e.target.value)
                                }
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Toutes familles</option>
                                {filterOptions.familles.map((f, idx) => (
                                    <option
                                        key={`famille-${f.id}-${idx}`}
                                        value={f.id}
                                    >
                                        {f.nom}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={professionFilter}
                                onChange={(e) =>
                                    setProfessionFilter(e.target.value)
                                }
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Toutes professions</option>
                                {filterOptions.professions.map((p, idx) => (
                                    <option
                                        key={`profession-${p.value}-${idx}`}
                                        value={p.value}
                                    >
                                        {p.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Tous rôles</option>
                                {filterOptions.roles.map((r, idx) => (
                                    <option
                                        key={`role-${r.value}-${idx}`}
                                        value={r.value}
                                    >
                                        {r.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={resetFilters}
                                className="btn btn-success"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                Réinitialiser
                            </button>

                            <button
                                onClick={submitSearch}
                                className="btn btn-primary"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                Rechercher
                            </button>
                        </div>

                        <div className="filter-second-row">
                            <div className="filter-nav">
                                {["all", "families", "classes"].map(
                                    (viewKey) => (
                                        <button
                                            key={viewKey}
                                            className={`filter-nav-btn ${currentView === viewKey ? "active" : ""}`}
                                            onClick={() => switchView(viewKey)}
                                        >
                                            {viewKey === "all"
                                                ? "Tous"
                                                : viewKey === "families"
                                                  ? "Familles"
                                                  : "Classes"}
                                        </button>
                                    ),
                                )}
                            </div>

                            {currentView === "all" && (
                                <div className="filter-actions">
                                    <button
                                        onClick={() =>
                                            setViewMode(
                                                viewMode === "table"
                                                    ? "grid"
                                                    : "table",
                                            )
                                        }
                                        className="btn btn-secondary"
                                    >
                                        {viewMode === "table"
                                            ? "Vue grille"
                                            : "Vue liste"}
                                    </button>
                                    <button
                                        onClick={exportToExcel}
                                        className="btn btn-excel"
                                    >
                                        Excel
                                    </button>
                                    <button
                                        onClick={exportToPDF}
                                        className="btn btn-pdf"
                                    >
                                        PDF
                                    </button>
                                </div>
                            )}
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
