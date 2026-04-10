// pages/Pasteur/Programmes.jsx

import React, { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

// --- STYLES INTÉGRÉS ---
const styles = `
:root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --success: #16a34a;
    --danger: #dc2626;
    --warning: #f59e0b;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.5);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

/* Pas de marge en haut de la page */
body {
    margin: 0;
    padding: 0;
}

/* Animations */
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
.animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* Bouton Retour */
.btn-back {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Header - Espace de 1cm au-dessus du titre */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 1cm 0 20px 0;
    padding: 0 20px;
    gap: 1rem;
}
.page-header h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.page-header .stats-badge {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    padding: 0.4rem 0.8rem;
    border-radius: 2rem;
    color: white;
    font-weight: 600;
    font-size: 0.8rem;
}

/* Barre de recherche - centrée avec espace de 3cm au-dessus et 2cm en dessous */
.filters-bar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 12px 20px;
    margin: 3cm auto 2cm auto;
    max-width: 900px;
    width: 90%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}
.search-input {
    flex: 2;
    min-width: 200px;
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.85rem;
    background: white;
    transition: all 0.2s;
}
.search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.class-filter-select {
    flex: 1;
    min-width: 180px;
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.85rem;
    background: white;
    cursor: pointer;
}
.class-filter-select:focus {
    outline: none;
    border-color: var(--primary);
}
.filter-stats-badge {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

/* Grille des cartes */
.classes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
    padding: 0 20px;
}

/* Carte de classe */
.class-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    transition: var(--transition);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.05);
}
.class-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.2);
}

.class-card-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    padding: 20px;
    color: white;
    position: relative;
}
.class-card-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #f59e0b, #ec4899);
}

.class-name {
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 10px;
    line-height: 1.3;
}

.class-code {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-top: 6px;
}

.class-card-body {
    padding: 16px;
}

.conducteurs-list {
    margin-bottom: 16px;
}

.conducteurs-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.conducteur-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: #f3f4f6;
    border-radius: 10px;
    margin-bottom: 6px;
    transition: all 0.2s;
}
.conducteur-item:hover {
    background: #e5e7eb;
}

.conducteur-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    overflow: hidden;
    flex-shrink: 0;
}
.conducteur-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.conducteur-avatar .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    font-weight: 700;
    font-size: 1rem;
}

.conducteur-info {
    flex: 1;
}
.conducteur-nom {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.85rem;
}
.conducteur-email {
    font-size: 0.65rem;
    color: #6b7280;
}
.conducteur-telephone {
    font-size: 0.65rem;
    color: #10b981;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.class-stats {
    display: flex;
    gap: 15px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #4b5563;
}

.stat-value {
    font-weight: 700;
    color: var(--primary);
    font-size: 0.9rem;
}

.class-card-footer {
    padding: 12px 16px;
    background: #f9fafb;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: flex-end;
}

.btn-view-programmes {
    background: linear-gradient(135deg, var(--primary), #1d4ed8);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.btn-view-programmes:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* Modal plein écran */
.modal-fullscreen {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    animation: slideInRight 0.3s ease-out;
    overflow: hidden;
}

.modal-fullscreen-header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
.modal-fullscreen-header h2 {
    font-size: 1.3rem;
    font-weight: 700;
    color: white;
    margin: 0;
}
.modal-fullscreen-header .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: white;
}
.modal-fullscreen-header .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.modal-fullscreen-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Onglets dans le modal */
.modal-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    padding-bottom: 8px;
}
.modal-tab {
    padding: 8px 20px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
}
.modal-tab.active {
    background: white;
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.modal-tab:hover:not(.active) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

/* Filtres du tableau */
.table-filters {
    background: white;
    border-radius: 16px;
    padding: 15px 20px;
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef2ff;
}
.filter-group {
    flex: 1;
    min-width: 120px;
}
.filter-group label {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}
.filter-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.8rem;
    background: #f8fafc;
    transition: all 0.2s;
}
.filter-input:focus {
    outline: none;
    border-color: #f59e0b;
    background: white;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}
.filter-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.8rem;
    background: #f8fafc;
    cursor: pointer;
}
.filter-select:focus {
    outline: none;
    border-color: #f59e0b;
}
.filter-actions {
    display: flex;
    gap: 8px;
    align-items: flex-end;
}
.btn-filter-reset {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.btn-filter-reset:hover {
    background: #4b5563;
    transform: translateY(-1px);
}
.filter-stats {
    margin-left: auto;
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    background: #f3f4f6;
    padding: 6px 12px;
    border-radius: 10px;
}
.date-range-badge {
    background: #f59e0b;
    color: white;
    padding: 3px 8px;
    border-radius: 16px;
    font-size: 0.65rem;
    font-weight: 600;
    margin-left: 8px;
}

/* Tableau des programmes */
.table-container {
    background: white;
    border-radius: 20px;
    padding: 0;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    width: 100%;
}
.programmes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}
.programmes-table th {
    text-align: left;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}
.programmes-table td {
    padding: 10px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #374151;
    vertical-align: middle;
    background-color: white;
}
.programmes-table tr:hover td {
    background-color: #fef9e8;
}
.programmes-table tr:last-child td {
    border-bottom: none;
}

.status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 16px;
    font-size: 0.7rem;
    font-weight: 600;
}
.status-upcoming {
    background: #10b981;
    color: white;
}
.status-past {
    background: #6b7280;
    color: white;
}
.status-today {
    background: #f59e0b;
    color: white;
}

.empty-table {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 20px;
    color: #9ca3af;
}
.empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.8rem;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    margin: 0 20px;
}
.empty-state .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.8rem;
    opacity: 0.5;
}
.empty-state .empty-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.5rem;
}
.empty-state .empty-message {
    color: #6b7280;
    font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 1100px) {
    .table-filters {
        flex-wrap: wrap;
    }
    .filter-group {
        min-width: calc(33.33% - 10px);
    }
}
@media (max-width: 900px) {
    .classes-grid {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 0 20px;
    }
    .page-header {
        flex-direction: column;
        text-align: center;
        padding: 0 20px;
    }
    .filters-bar {
        flex-direction: column;
        align-items: stretch;
        width: 95%;
        padding: 15px;
        margin: 2cm auto 1.5cm auto;
    }
    .search-input, .class-filter-select {
        width: 100%;
    }
    .filter-stats-badge {
        text-align: center;
    }
    .filter-group {
        min-width: calc(50% - 8px);
    }
    .programmes-table th,
    .programmes-table td {
        padding: 10px 12px;
        font-size: 0.75rem;
    }
    .modal-fullscreen-body {
        padding: 1rem;
    }
}
@media (max-width: 600px) {
    .class-name {
        font-size: 1.1rem;
    }
    .class-stats {
        flex-wrap: wrap;
        gap: 10px;
    }
    .modal-fullscreen-header h2 {
        font-size: 1rem;
    }
    .modal-tab {
        padding: 5px 12px;
        font-size: 0.75rem;
    }
    .filter-group {
        min-width: 100%;
    }
    .filter-actions {
        width: 100%;
    }
    .btn-filter-reset {
        flex: 1;
        justify-content: center;
    }
    .filter-stats {
        width: 100%;
        justify-content: center;
        margin-left: 0;
    }
    .table-filters {
        padding: 12px;
    }
    .filters-bar {
        width: 95%;
        margin: 1.5cm auto 1cm auto;
    }
    .classes-grid {
        padding: 0 15px;
    }
    .empty-state {
        margin: 0 15px;
    }
    .conducteur-avatar {
        width: 35px;
        height: 35px;
    }
}
`;

// --- ICONS ---
const IconArrowLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const IconClock = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconUser = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const IconLocation = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
const IconMic = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const IconActivity = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>);
const IconHistory = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconConducteur = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const IconX = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const IconFilter = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"></polygon></svg>);
const IconRefresh = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>);
const IconFamily = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><path d="M17 3.5a4 4 0 0 1 0 7"></path><path d="M21 21v-2a4 4 0 0 0-3-3.85"></path></svg>);
const IconWeek = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="2" x2="8" y2="6"></line><line x1="16" y1="2" x2="16" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path></svg>);
const IconDay = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconPhone = () => (<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);

// --- FONCTIONS DE FORMATAGE ---
const formatDateForTable = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const getStatus = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  
  if (dateStr === todayStr) return 'Aujourd\'hui';
  if (date >= today) return 'À venir';
  return 'Passé';
};

const getStatusClass = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  
  if (dateStr === todayStr) return 'status-today';
  if (date >= today) return 'status-upcoming';
  return 'status-past';
};

// --- COMPOSANT MODAL ---
const ClassProgrammesModal = ({ isOpen, onClose, classe, programmes }) => {
  const [activeTab, setActiveTab] = useState('current');
  const [filters, setFilters] = useState({
    search: '',
    year: 'all',
    month: 'all',
    week: 'all',
    day: ''
  });

  if (!isOpen || !classe) return null;

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const todayStr = currentDate.toISOString().split('T')[0];

  const availableYears = [...new Set(programmes.map(p => new Date(p.date).getFullYear()))].sort((a, b) => b - a);
  
  const getAvailableWeeks = () => {
    if (filters.year === 'all') return [];
    const weeks = new Set();
    programmes.forEach(p => {
      const date = new Date(p.date);
      if (date.getFullYear() === parseInt(filters.year)) {
        const weekNumber = Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
        weeks.add(weekNumber);
      }
    });
    return Array.from(weeks).sort((a, b) => a - b);
  };

  const availableWeeks = getAvailableWeeks();

  const currentProgrammes = programmes.filter(p => new Date(p.date) >= currentDate);
  const pastProgrammes = programmes.filter(p => new Date(p.date) < currentDate);

  const getFilteredProgrammes = () => {
    const list = activeTab === 'current' ? currentProgrammes : pastProgrammes;
    
    let filtered = [...list];
    
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term) ||
        (p.orateur && p.orateur.toLowerCase().includes(term)) ||
        (p.moderateur && p.moderateur.toLowerCase().includes(term)) ||
        (p.lieu && p.lieu.toLowerCase().includes(term)) ||
        (p.famille_reception && p.famille_reception.toLowerCase().includes(term))
      );
    }
    
    if (filters.year !== 'all') {
      filtered = filtered.filter(p => new Date(p.date).getFullYear() === parseInt(filters.year));
    }
    
    if (filters.month !== 'all') {
      filtered = filtered.filter(p => new Date(p.date).getMonth() + 1 === parseInt(filters.month));
    }
    
    if (filters.week !== 'all' && filters.year !== 'all') {
      filtered = filtered.filter(p => {
        const date = new Date(p.date);
        const weekNumber = Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
        return weekNumber === parseInt(filters.week);
      });
    }
    
    if (filters.day) {
      filtered = filtered.filter(p => p.date === filters.day);
    }
    
    return filtered;
  };

  const filteredProgrammes = getFilteredProgrammes();

  const resetFilters = () => {
    setFilters({
      search: '',
      year: 'all',
      month: 'all',
      week: 'all',
      day: ''
    });
  };

  const getActiveFilterLabel = () => {
    if (filters.day) return `📅 ${formatDateForTable(filters.day)}`;
    if (filters.week !== 'all' && filters.year !== 'all') return `📆 Semaine ${filters.week} - ${filters.year}`;
    if (filters.month !== 'all') {
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `📅 ${months[parseInt(filters.month) - 1]} ${filters.year !== 'all' ? filters.year : ''}`;
    }
    if (filters.year !== 'all') return `📅 Année ${filters.year}`;
    return null;
  };

  const activeFilterLabel = getActiveFilterLabel();

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  return (
    <div className="modal-fullscreen">
      <div className="modal-fullscreen-header">
        <h2>
          {activeTab === 'current' ? '📅 Programmes en cours' : '📜 Historique des programmes'} - {classe.nom}
        </h2>
        <button className="close-btn" onClick={onClose}>
          <IconX />
        </button>
      </div>
      <div className="modal-fullscreen-body">
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('current');
              resetFilters();
            }}
          >
            📅 Programmes en cours ({currentProgrammes.length})
          </button>
          <button 
            className={`modal-tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('past');
              resetFilters();
            }}
          >
            📜 Historique ({pastProgrammes.length})
          </button>
        </div>

        <div className="table-filters">
          <div className="filter-group" style={{ flex: 2 }}>
            <label><IconFilter style={{ display: 'inline', marginRight: '4px' }} /> Recherche</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Titre, orateur, lieu..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="filter-group">
            <label><IconCalendar style={{ display: 'inline', marginRight: '4px' }} /> Année</label>
            <select
              className="filter-select"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value, month: 'all', week: 'all', day: '' })}
            >
              <option value="all">Toutes</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {filters.year !== 'all' && (
            <div className="filter-group">
              <label><IconCalendar style={{ display: 'inline', marginRight: '4px' }} /> Mois</label>
              <select
                className="filter-select"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value, week: 'all', day: '' })}
              >
                <option value="all">Tous</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          )}

          {filters.year !== 'all' && filters.month === 'all' && availableWeeks.length > 0 && (
            <div className="filter-group">
              <label><IconWeek style={{ display: 'inline', marginRight: '4px' }} /> Semaine</label>
              <select
                className="filter-select"
                value={filters.week}
                onChange={(e) => setFilters({ ...filters, week: e.target.value, day: '' })}
              >
                <option value="all">Toutes</option>
                {availableWeeks.map(week => (
                  <option key={week} value={week}>Semaine {week}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label><IconDay style={{ display: 'inline', marginRight: '4px' }} /> Jour</label>
            <input
              type="date"
              className="filter-input"
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: e.target.value, year: 'all', month: 'all', week: 'all' })}
            />
          </div>

          <div className="filter-actions">
            <button className="btn-filter-reset" onClick={resetFilters}>
              <IconRefresh /> Reset
            </button>
          </div>
          
          <div className="filter-stats">
            📊 {filteredProgrammes.length} / {activeTab === 'current' ? currentProgrammes.length : pastProgrammes.length}
            {activeFilterLabel && <span className="date-range-badge">{activeFilterLabel}</span>}
          </div>
        </div>

        {filteredProgrammes.length > 0 ? (
          <div className="table-container">
            <table className="programmes-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activités</th>
                  <th>Heure</th>
                  <th>Lieu</th>
                  <th>Orateur</th>
                  <th>Modérateur</th>
                  <th>Famille</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredProgrammes.map(programme => (
                  <tr key={programme.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                        <IconCalendar />
                        {formatDateForTable(programme.date)}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#111827' }}>{programme.title}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                        <IconClock />
                        {programme.time?.substring(0, 5) || '-'}
                      </div>
                    </td>
                    <td>
                      {programme.lieu && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                          <IconLocation />
                          {programme.lieu.length > 25 ? programme.lieu.substring(0, 25) + '...' : programme.lieu}
                        </div>
                      )}
                    </td>
                    <td>
                      {programme.orateur && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                          <IconMic />
                          {programme.orateur}
                        </div>
                      )}
                    </td>
                    <td>
                      {programme.moderateur && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                          <IconUser />
                          {programme.moderateur}
                        </div>
                      )}
                    </td>
                    <td>
                      {programme.famille_reception && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563' }}>
                          <IconFamily />
                          {programme.famille_reception}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(programme.date)}`}>
                        {getStatus(programme.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table">
            <div className="empty-icon">📋</div>
            <p>Aucun programme trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPOSANT CARTE DE CLASSE (CORRIGÉ AVEC PHOTO ET TÉLÉPHONE) ---
const ClassCard = ({ conducteur, onViewProgrammes }) => {
  const classe = conducteur.classe;
  const programmes = classe?.programmes || [];
  
  const totalProgrammes = programmes.length;
  const currentProgrammes = programmes.filter(p => new Date(p.date) >= new Date()).length;
  const pastProgrammes = programmes.filter(p => new Date(p.date) < new Date()).length;

  // Fonction pour obtenir l'URL de l'avatar
  const getAvatarUrl = () => {
    if (conducteur.profile_photo_url) {
      return conducteur.profile_photo_url;
    }
    return null;
  };

  // Fonction pour obtenir les initiales
  const getInitials = () => {
    return `${(conducteur.prenom?.charAt(0) || '').toUpperCase()}${(conducteur.nom?.charAt(0) || '').toUpperCase()}`;
  };

  return (
    <div className="class-card">
      <div className="class-card-header">
        <h3 className="class-name">{classe?.nom || 'Classe sans nom'}</h3>
        {classe?.code && <span className="class-code">Code: {classe.code}</span>}
      </div>
      <div className="class-card-body">
        <div className="conducteurs-list">
          <div className="conducteurs-title">
            <IconConducteur /> Conducteur
          </div>
          <div className="conducteur-item">
            <div className="conducteur-avatar">
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt={`${conducteur.prenom} ${conducteur.nom}`} />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="conducteur-info">
              <div className="conducteur-nom">
                {conducteur.prenom} {conducteur.nom}
              </div>
              {conducteur.email && (
                <div className="conducteur-email">{conducteur.email}</div>
              )}
              {conducteur.telephone && (
                <div className="conducteur-telephone">
                  <IconPhone /> {conducteur.telephone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="class-stats">
          <div className="stat-item">
            <IconActivity />
            <span>Programmes</span>
            <span className="stat-value">{totalProgrammes}</span>
          </div>
          <div className="stat-item">
            <IconEye />
            <span>En cours</span>
            <span className="stat-value">{currentProgrammes}</span>
          </div>
          <div className="stat-item">
            <IconHistory />
            <span>Passés</span>
            <span className="stat-value">{pastProgrammes}</span>
          </div>
        </div>
      </div>
      <div className="class-card-footer">
        <button className="btn-view-programmes" onClick={() => onViewProgrammes(classe, programmes)}>
          <IconEye /> Voir les programmes
        </button>
      </div>
    </div>
  );
};

// --- PAGE PRINCIPALE ---
export default function Programmes() {
  const { props } = usePage();
  const { conducteurs = [], userRole = null } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasseId, setSelectedClasseId] = useState('all');
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [selectedProgrammes, setSelectedProgrammes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Récupérer la liste unique des classes pour le filtre
  const classOptions = useMemo(() => {
    const classes = new Map();
    conducteurs.forEach(conducteur => {
      if (conducteur.classe) {
        classes.set(conducteur.classe.id, conducteur.classe.nom);
      }
    });
    return Array.from(classes.entries()).map(([id, nom]) => ({ id, nom }));
  }, [conducteurs]);

  // Filtrer les conducteurs par recherche et par classe
  const filteredConducteurs = useMemo(() => {
    let filtered = [...conducteurs];
    
    // Filtre par recherche textuelle
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conducteur =>
        conducteur.nom?.toLowerCase().includes(term) ||
        conducteur.prenom?.toLowerCase().includes(term) ||
        conducteur.email?.toLowerCase().includes(term) ||
        conducteur.telephone?.toLowerCase().includes(term) ||
        conducteur.classe?.nom?.toLowerCase().includes(term) ||
        conducteur.classe?.code?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par classe sélectionnée
    if (selectedClasseId !== 'all') {
      filtered = filtered.filter(conducteur => 
        conducteur.classe?.id === parseInt(selectedClasseId)
      );
    }
    
    return filtered;
  }, [conducteurs, searchTerm, selectedClasseId]);

  const handleViewProgrammes = (classe, programmes) => {
    setSelectedClasse(classe);
    setSelectedProgrammes(programmes);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClasse(null);
    setSelectedProgrammes([]);
  };

  const handleGoBack = () => {
    if (userRole === 'admin') {
      router.visit('/admin/dashboard');
    } else {
      router.visit('/pasteur/dashboard');
    }
  };

  const totalConducteurs = conducteurs.length;
  const totalClasses = classOptions.length;
  const filteredCount = filteredConducteurs.length;

  return (
    <>
      <Head title="Programmes des Classes" />
      <style>{styles}</style>

      <ClassProgrammesModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        classe={selectedClasse}
        programmes={selectedProgrammes}
      />

      <div className="main-container animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)", paddingBottom: '30px', minHeight: '100vh' }}>
        <div className="page-header">
          <button className="btn-back" onClick={handleGoBack}>
            <IconArrowLeft /> Retour
          </button>
          <h1>📋 Gestion des programmes d'activités des classes</h1>
          <div className="stats-badge">
            {totalClasses} classe(s) • {totalConducteurs} conducteur(s)
          </div>
        </div>

        {/* Barre de filtre centrée */}
        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Rechercher (nom, prénom, email, téléphone, classe...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="class-filter-select"
            value={selectedClasseId}
            onChange={(e) => setSelectedClasseId(e.target.value)}
          >
            <option value="all">📚 Toutes les classes</option>
            {classOptions.map(classe => (
              <option key={classe.id} value={classe.id}>
                📖 {classe.nom}
              </option>
            ))}
          </select>
          <div className="filter-stats-badge">
            {filteredCount} résultat(s)
          </div>
        </div>

        {filteredConducteurs.length > 0 ? (
          <div className="classes-grid">
            {filteredConducteurs.map(conducteur => (
              <ClassCard 
                key={conducteur.id} 
                conducteur={conducteur} 
                onViewProgrammes={handleViewProgrammes}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">Aucun conducteur trouvé</div>
            <div className="empty-message">
              {searchTerm || selectedClasseId !== 'all' ? 'Aucun résultat ne correspond à vos critères.' : 'Aucun conducteur n\'est disponible pour le moment.'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}