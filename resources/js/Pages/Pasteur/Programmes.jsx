import React, { useState, useMemo, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

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

/* Header */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 1cm 0 20px 0;
    padding: 0 20px;
    gap: 1rem;
    flex-wrap: wrap;
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

/* Barre de recherche */
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
    flex-wrap: wrap;
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
    flex-wrap: wrap;
    gap: 10px;
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

/* Cartes statistiques dans le modal */
.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}
.stat-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef2ff;
    transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
}
.stat-icon.total { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.upcoming { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.past { background: linear-gradient(135deg, #6b7280, #4b5563); }
.stat-icon.today { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-info h3 {
    font-size: 1.8rem;
    font-weight: 800;
    color: #1f2937;
    margin: 0;
    line-height: 1.2;
}
.stat-info p {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 4px 0 0 0;
    font-weight: 500;
}

/* Filtres du tableau dans le modal */
.filter-bar {
    background: white;
    padding: 20px 24px;
    border-radius: 20px;
    margin-bottom: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: flex-end;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef2ff;
}
.filter-group {
    flex: 1;
    min-width: 150px;
}
.filter-group label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
}
.filter-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.85rem;
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
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.85rem;
    background: #f8fafc;
    cursor: pointer;
}
.filter-select:focus {
    outline: none;
    border-color: #f59e0b;
}
.filter-actions {
    display: flex;
    gap: 10px;
}
.btn-filter-reset {
    background: #6b7280;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.btn-filter-reset:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

/* Boutons d'export dans la barre des filtres */
.export-buttons-filter {
    display: flex;
    gap: 10px;
    margin-left: auto;
}
.btn-excel-filter {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
.btn-excel-filter:hover:not(:disabled) {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
.btn-pdf-filter {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}
.btn-pdf-filter:hover:not(:disabled) {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
.btn-excel-filter:disabled,
.btn-pdf-filter:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.pagination button {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s;
    color: #374151;
}
.pagination button:hover:not(:disabled) {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
    transform: translateY(-1px);
}
.pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.pagination .active-page {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
}
.pagination-info {
    margin: 0 12px;
    font-size: 0.85rem;
    color: #6b7280;
}
.pagination-arrows {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
}
.pagination-arrows:hover:not(:disabled) {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
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

/* Toast notification */
.toast-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    animation: slideIn 0.3s ease forwards;
}
.toast-notification.exit {
    animation: slideOut 0.3s ease forwards;
}
.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    min-width: 300px;
    max-width: 450px;
}
.toast-success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}
.toast-error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}
.toast-icon {
    font-size: 1.5rem;
}
.toast-message {
    flex: 1;
    font-weight: 500;
}
.toast-close {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.toast-close:hover {
    opacity: 1;
}
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

/* Responsive */
@media (max-width: 1100px) {
    .filter-bar {
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
    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    .stat-card {
        padding: 15px;
    }
    .stat-icon {
        width: 45px;
        height: 45px;
        font-size: 1.5rem;
    }
    .stat-info h3 {
        font-size: 1.4rem;
    }
    .programmes-table th,
    .programmes-table td {
        padding: 10px 12px;
        font-size: 0.75rem;
    }
    .modal-fullscreen-body {
        padding: 1rem;
    }
    .modal-fullscreen-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .pagination {
        flex-wrap: wrap;
        gap: 5px;
    }
    .pagination button {
        padding: 6px 10px;
        font-size: 0.75rem;
    }
    .export-buttons-filter {
        margin-left: 0;
        width: 100%;
        justify-content: flex-end;
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
    .filter-bar {
        padding: 12px;
    }
    .stats-cards {
        grid-template-columns: 1fr;
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
    .pagination {
        gap: 4px;
    }
    .pagination button {
        padding: 4px 8px;
        font-size: 0.7rem;
    }
    .export-buttons-filter {
        flex-direction: column;
        gap: 8px;
    }
    .btn-excel-filter,
    .btn-pdf-filter {
        justify-content: center;
        width: 100%;
    }
}
`;

// --- ICONS ---
const IconArrowLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="18" y2="10"></line></svg>);
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
const IconPhone = () => (<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);
const IconFileExcel = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 14l4 4M14 14l-4 4"/></svg>);
const IconFilePdf = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-4M12 10h.01"/><path d="M8 14h8"/></svg>);

// --- COMPOSANT TOAST ---
const Toast = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${isExiting ? 'exit' : ''}`}>
      <div className={`toast-content toast-${type}`}>
        <div className="toast-icon">{type === 'success' ? '✅' : '❌'}</div>
        <div className="toast-message">{message}</div>
        <div className="toast-close" onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}>✕</div>
      </div>
    </div>
  );
};

// --- COMPOSANT MODAL AVEC TABLEAU FUSIONNÉ (CORRIGÉ AVEC HEURES) ---
const ClassProgrammesModal = ({ isOpen, onClose, classe, programmes }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    month: 'all',
    year: new Date().getFullYear().toString()
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (!isOpen || !classe) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const isToday = (eventDate) => {
    if (!eventDate) return false;
    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj.getTime() === today.getTime();
  };

  // Fonction pour formater l'heure
  const formatTime = (startTime, endTime) => {
    if (!startTime) return '-';
    const start = startTime.substring(0, 5);
    if (endTime) {
      const end = endTime.substring(0, 5);
      return `${start} - ${end}`;
    }
    return start;
  };

  const availableYears = [...new Set(programmes.map(p => new Date(p.start_date).getFullYear()))].sort((a, b) => b - a);

  const totalCount = programmes.length;
  const upcomingCount = programmes.filter(p => new Date(p.start_date) >= today).length;
  const pastCount = programmes.filter(p => new Date(p.end_date || p.start_date) < today).length;
  const todayCount = programmes.filter(p => isToday(p.start_date)).length;

  const filteredProgrammes = programmes.filter(programme => {
    const programmeDate = new Date(programme.start_date);
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        (programme.title || '').toLowerCase().includes(searchLower) ||
        (programme.orateur || '').toLowerCase().includes(searchLower) ||
        (programme.moderateur || '').toLowerCase().includes(searchLower) ||
        (programme.famille_reception || '').toLowerCase().includes(searchLower) ||
        (programme.lieu || '').toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (filters.status !== 'all') {
      const isUpcoming = programmeDate >= today;
      const isPast = programmeDate < today;
      const isTodayEvent = isToday(programme.start_date);
      
      if (filters.status === 'upcoming' && !isUpcoming) return false;
      if (filters.status === 'past' && !isPast) return false;
      if (filters.status === 'today' && !isTodayEvent) return false;
    }
    
    if (filters.month !== 'all') {
      const eventMonth = programmeDate.getMonth() + 1;
      if (eventMonth.toString() !== filters.month) return false;
    }
    
    if (filters.year !== 'all') {
      const eventYear = programmeDate.getFullYear();
      if (eventYear.toString() !== filters.year) return false;
    }
    
    return true;
  });

  const sortedProgrammes = [...filteredProgrammes].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  const totalPages = Math.ceil(sortedProgrammes.length / itemsPerPage);
  const paginatedProgrammes = sortedProgrammes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      month: 'all',
      year: new Date().getFullYear().toString()
    });
  };

  const getStatus = (startDate) => {
    if (!startDate) return 'Passé';
    if (isToday(startDate)) return 'Aujourd\'hui';
    if (new Date(startDate) >= today) return 'À venir';
    return 'Passé';
  };

  const getStatusClass = (startDate) => {
    if (!startDate) return 'status-past';
    if (isToday(startDate)) return 'status-today';
    if (new Date(startDate) >= today) return 'status-upcoming';
    return 'status-past';
  };

  const formatDateForTable = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      
      const exportData = sortedProgrammes.map((programme, index) => ({
        '#': index + 1,
        'Date': formatDateForTable(programme.start_date),
        'Activités': programme.title,
        'Heure': formatTime(programme.start_time, programme.end_time),
        'Lieu': programme.lieu || '-',
        'Orateur': programme.orateur || '-',
        'Modérateur': programme.moderateur || '-',
        'Famille de réception': programme.famille_reception || '-',
        'Statut': getStatus(programme.start_date)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 5 },   // #
        { wch: 15 },  // Date
        { wch: 30 },  // Activités
        { wch: 15 },  // Heure
        { wch: 25 },  // Lieu
        { wch: 20 },  // Orateur
        { wch: 20 },  // Modérateur
        { wch: 20 },  // Famille
        { wch: 12 }   // Statut
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Programmes_${classe.nom}`);
      
      XLSX.writeFile(wb, `programmes_${classe.nom}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showToast(`Export Excel réussi pour la classe ${classe.nom}`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      showToast('Erreur lors de l\'export Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const getStatusForExport = (startDate) => {
        if (!startDate) return 'Passé';
        if (isToday(startDate)) return 'Aujourd\'hui';
        if (new Date(startDate) >= today) return 'À venir';
        return 'Passé';
      };
      
      const getStatusColor = (status) => {
        if (status === 'Aujourd\'hui') return '#f59e0b';
        if (status === 'À venir') return '#10b981';
        return '#6b7280';
      };
      
      const pdfElement = document.createElement('div');
      pdfElement.style.padding = '20px';
      pdfElement.style.backgroundColor = 'white';
      pdfElement.style.fontFamily = 'Arial, sans-serif';
      
      const itemsPerPagePDF = 15;
      const totalPagesPDF = Math.ceil(sortedProgrammes.length / itemsPerPagePDF);
      
      for (let pageNum = 0; pageNum < totalPagesPDF; pageNum++) {
        const start = pageNum * itemsPerPagePDF;
        const end = Math.min(start + itemsPerPagePDF, sortedProgrammes.length);
        const pageProgrammes = sortedProgrammes.slice(start, end);
        
        if (pageNum > 0) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakBefore = 'always';
          pdfElement.appendChild(pageBreak);
        }
        
        const headerDiv = document.createElement('div');
        headerDiv.style.textAlign = 'center';
        headerDiv.style.marginBottom = '20px';
        headerDiv.innerHTML = `
          <h1 style="color: #f59e0b; margin-bottom: 5px;">📋 Programmes d'activités - ${classe.nom}</h1>
          <p style="color: #6b7280;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
            <div><strong>📊 Total:</strong> ${totalCount}</div>
            <div><strong>📅 À venir:</strong> ${upcomingCount}</div>
            <div><strong>📜 Passés:</strong> ${pastCount}</div>
            <div><strong>⭐ Aujourd'hui:</strong> ${todayCount}</div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Page ${pageNum + 1} sur ${totalPagesPDF}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 15px 0;">
        `;
        pdfElement.appendChild(headerDiv);
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '11px';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['#', 'Date', 'Activités', 'Heure', 'Lieu', 'Orateur', 'Modérateur', 'Famille', 'Statut'];
        headers.forEach(header => {
          const th = document.createElement('th');
          th.textContent = header;
          th.style.padding = '10px';
          th.style.textAlign = header === '#' ? 'center' : 'left';
          th.style.backgroundColor = '#f59e0b';
          th.style.color = 'white';
          th.style.border = '1px solid #e5e7eb';
          th.style.fontWeight = 'bold';
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        pageProgrammes.forEach((programme, idx) => {
          const row = document.createElement('tr');
          const globalIndex = start + idx + 1;
          const status = getStatusForExport(programme.start_date);
          const statusColor = getStatusColor(status);
          
          const indexCell = document.createElement('td');
          indexCell.textContent = globalIndex;
          indexCell.style.padding = '8px';
          indexCell.style.border = '1px solid #e5e7eb';
          indexCell.style.textAlign = 'center';
          row.appendChild(indexCell);
          
          const dateCell = document.createElement('td');
          dateCell.textContent = formatDateForTable(programme.start_date);
          dateCell.style.padding = '8px';
          dateCell.style.border = '1px solid #e5e7eb';
          row.appendChild(dateCell);
          
          const titleCell = document.createElement('td');
          titleCell.textContent = programme.title || '';
          titleCell.style.padding = '8px';
          titleCell.style.border = '1px solid #e5e7eb';
          row.appendChild(titleCell);
          
          const timeCell = document.createElement('td');
          timeCell.textContent = formatTime(programme.start_time, programme.end_time);
          timeCell.style.padding = '8px';
          timeCell.style.border = '1px solid #e5e7eb';
          row.appendChild(timeCell);
          
          const lieuCell = document.createElement('td');
          lieuCell.textContent = programme.lieu || '-';
          lieuCell.style.padding = '8px';
          lieuCell.style.border = '1px solid #e5e7eb';
          row.appendChild(lieuCell);
          
          const orateurCell = document.createElement('td');
          orateurCell.textContent = programme.orateur || '-';
          orateurCell.style.padding = '8px';
          orateurCell.style.border = '1px solid #e5e7eb';
          row.appendChild(orateurCell);
          
          const moderateurCell = document.createElement('td');
          moderateurCell.textContent = programme.moderateur || '-';
          moderateurCell.style.padding = '8px';
          moderateurCell.style.border = '1px solid #e5e7eb';
          row.appendChild(moderateurCell);
          
          const familleCell = document.createElement('td');
          familleCell.textContent = programme.famille_reception || '-';
          familleCell.style.padding = '8px';
          familleCell.style.border = '1px solid #e5e7eb';
          row.appendChild(familleCell);
          
          const statusCell = document.createElement('td');
          statusCell.textContent = status;
          statusCell.style.padding = '8px';
          statusCell.style.border = '1px solid #e5e7eb';
          statusCell.style.backgroundColor = statusColor;
          statusCell.style.color = 'white';
          statusCell.style.fontWeight = 'bold';
          statusCell.style.textAlign = 'center';
          row.appendChild(statusCell);
          
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        pdfElement.appendChild(table);
        
        const footerDiv = document.createElement('div');
        footerDiv.style.marginTop = '20px';
        footerDiv.style.paddingTop = '10px';
        footerDiv.style.borderTop = '1px solid #e5e7eb';
        footerDiv.style.textAlign = 'center';
        footerDiv.style.color = '#6b7280';
        footerDiv.style.fontSize = '10px';
        footerDiv.innerHTML = `
          <p>Programmes d'activités - ${classe.nom} | Page ${pageNum + 1}/${totalPagesPDF}</p>
        `;
        pdfElement.appendChild(footerDiv);
      }
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `programmes_${classe.nom}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(pdfElement).save();
      showToast(`Export PDF réussi pour la classe ${classe.nom}`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      showToast('Erreur lors de l\'export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="modal-fullscreen">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      <div className="modal-fullscreen-header">
        <h2>📋 Programmes d'activités - {classe.nom}</h2>
        <button className="close-btn" onClick={onClose}>
          <IconX />
        </button>
      </div>
      <div className="modal-fullscreen-body">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon total">📊</div>
            <div className="stat-info">
              <h3>{totalCount}</h3>
              <p>Total programmes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon upcoming">📅</div>
            <div className="stat-info">
              <h3>{upcomingCount}</h3>
              <p>À venir</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon past">📜</div>
            <div className="stat-info">
              <h3>{pastCount}</h3>
              <p>Passés</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon today">⭐</div>
            <div className="stat-info">
              <h3>{todayCount}</h3>
              <p>Aujourd'hui</p>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-group" style={{ flex: 2 }}>
            <label><IconFilter style={{ display: 'inline', marginRight: '4px' }} /> Recherche</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Rechercher par titre, orateur, modérateur, famille, lieu..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Statut</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Tous</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passés</option>
              <option value="today">Aujourd'hui</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Année</label>
            <select
              className="filter-select"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <option value="all">Toutes</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Mois</label>
            <select
              className="filter-select"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="all">Tous</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn-filter-reset" onClick={resetFilters}>
              <IconRefresh /> Réinitialiser
            </button>
          </div>
          
          <div className="export-buttons-filter">
            <button 
              className="btn-excel-filter" 
              onClick={handleExportExcel}
              disabled={isExporting || sortedProgrammes.length === 0}
              title={sortedProgrammes.length === 0 ? "Aucun programme à exporter" : "Exporter en Excel"}
            >
              <IconFileExcel /> Excel
            </button>
            <button 
              className="btn-pdf-filter" 
              onClick={handleExportPDF}
              disabled={isExporting || sortedProgrammes.length === 0}
              title={sortedProgrammes.length === 0 ? "Aucun programme à exporter" : "Exporter en PDF"}
            >
              <IconFilePdf /> PDF
            </button>
          </div>
        </div>

        {paginatedProgrammes.length > 0 ? (
          <>
            <div className="table-container">
              <table className="programmes-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
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
                  {paginatedProgrammes.map((programme, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={programme.id}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#6b7280' }}>
                          {rowNumber}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconCalendar style={{ width: '14px', height: '14px' }} />
                            {formatDateForTable(programme.start_date)}
                          </div>
                        </td>
                        <td style={{ fontWeight: '600', color: '#111827' }}>{programme.title}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconClock style={{ width: '14px', height: '14px' }} />
                            {formatTime(programme.start_time, programme.end_time)}
                          </div>
                        </td>
                        <td>
                          {programme.lieu && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                              <IconLocation style={{ width: '14px', height: '14px' }} />
                              {programme.lieu.length > 30 ? programme.lieu.substring(0, 30) + '...' : programme.lieu}
                            </div>
                          )}
                        </td>
                        <td>
                          {programme.orateur && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                              <IconMic style={{ width: '14px', height: '14px' }} />
                              {programme.orateur}
                            </div>
                          )}
                        </td>
                        <td>
                          {programme.moderateur && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                              <IconUser style={{ width: '14px', height: '14px' }} />
                              {programme.moderateur}
                            </div>
                          )}
                        </td>
                        <td>
                          {programme.famille_reception && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                              <IconFamily style={{ width: '14px', height: '14px' }} />
                              {programme.famille_reception}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(programme.start_date)}`}>
                            {getStatus(programme.start_date)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-arrows"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ⏮
                </button>
                <button 
                  className="pagination-arrows"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ◀
                </button>
                
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={currentPage === page ? 'active-page' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  className="pagination-arrows"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
                <button 
                  className="pagination-arrows"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  ⏭
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} sur {totalPages} ({sortedProgrammes.length} éléments)
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="empty-table">
            <div className="empty-icon">📋</div>
            <p>Aucun programme trouvé pour cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPOSANT CARTE DE CLASSE ---
const ClassCard = ({ conducteur, onViewProgrammes }) => {
  const classe = conducteur.classe;
  const programmes = classe?.programmes || [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = (eventDate) => {
    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj.getTime() === today.getTime();
  };
  
  const totalProgrammes = programmes.length;
  const currentProgrammes = programmes.filter(p => new Date(p.start_date) >= today).length;
  const pastProgrammes = programmes.filter(p => new Date(p.start_date) < today).length;
  const todayProgrammes = programmes.filter(p => isToday(p.start_date)).length;

  const getAvatarUrl = () => {
    if (conducteur.profile_photo_url) {
      return conducteur.profile_photo_url;
    }
    return null;
  };

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
            <span>Total</span>
            <span className="stat-value">{totalProgrammes}</span>
          </div>
          <div className="stat-item">
            <IconEye />
            <span>À venir</span>
            <span className="stat-value">{currentProgrammes}</span>
          </div>
          <div className="stat-item">
            <IconHistory />
            <span>Passés</span>
            <span className="stat-value">{pastProgrammes}</span>
          </div>
          <div className="stat-item">
            <span>⭐</span>
            <span>Aujourd'hui</span>
            <span className="stat-value">{todayProgrammes}</span>
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

  const classOptions = useMemo(() => {
    const classes = new Map();
    conducteurs.forEach(conducteur => {
      if (conducteur.classe) {
        classes.set(conducteur.classe.id, conducteur.classe.nom);
      }
    });
    return Array.from(classes.entries()).map(([id, nom]) => ({ id, nom }));
  }, [conducteurs]);

  const filteredConducteurs = useMemo(() => {
    let filtered = [...conducteurs];
    
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
            <option value="all">Toutes les classes</option>
            {classOptions.map(classe => (
              <option key={classe.id} value={classe.id}>
                 {classe.nom}
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
            <div className="empty-icon"></div>
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