import React, { useState, useEffect, useCallback, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import html2pdf from "html2pdf.js";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import { withBasePath } from "../../../Utils/urlHelper";

// ==================== STYLES GLOBAUX ====================
const GLOBAL_STYLES = `
    :root {
        --primary: #2563eb; --primary-hover: #1d4ed8;
        --success: #16a34a; --danger: #dc2626; --warning: #ca8a04;
        --glass-bg: rgba(255, 255, 255, 0.7); --glass-border: rgba(255, 255, 255, 0.5);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        
        /* Couleurs Enveloppes Kaki */
        --envelope-bg: #C2B280;
        --envelope-border: #A69060;
        --envelope-flap: #D6C89E;
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
    
    .btn-download-paper {
        background-color: #374151; 
        color: white; 
        border: 1px solid #374151;
    }
    .btn-download-paper:hover { background-color: #1f2937; }

    .btn-icon { padding: 0.5rem; border-radius: 0.5rem; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
    .btn-icon:hover { transform: translateY(-1px); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }

    /* Boutons export */
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
    .filter-group { 
        display: flex; 
        gap: 0.5rem; 
        align-items: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        width: 100%;
    }
    .filter-group::-webkit-scrollbar { height: 4px; }
    .filter-group::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }

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
    .input-search-wrapper { position: relative; flex: 1; min-width: 200px; }
    .input-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 1.25rem; height: 1.25rem; }
    .input-search { padding-left: 2.5rem; width: 100%; }

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
    .filter-nav { display: flex; gap: 0.5rem; flex-wrap: wrap; }
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

    .filter-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-left: auto; }

    /* Table Styles */
    .table-container { background: var(--glass-bg); border-radius: 1rem; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--glass-border); display: flex; flex-direction: column; flex: 1; min-height: 500px; position: relative; }
    .table-scroll { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; } 
    table { width: 100%; min-width: 1800px; border-collapse: collapse; text-align: left; } 
    thead { background: #f59e0b; color: white; position: sticky; top: 0; z-index: 10; }
    th { padding: 0.75rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    td { padding: 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; vertical-align: middle; }
    tr:hover td { background-color: rgba(255, 255, 255, 0.9); }
    .status-badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid; align-items: center; }

    /* --- MODAL STYLE PAPIER BLANC --- */
    .modal-overlay {
        position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease;
        padding: 2rem 1rem;
    }
    .modal-overlay.closing { animation: fadeOut 0.2s ease forwards; }
    
    .modal-content {
        background: transparent;
        width: 100%; max-width: 900px; max-height: 90vh;
        display: flex; flex-direction: column;
        animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
    }
    .modal-content.closing { animation: scaleOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    /* La Feuille de Papier */
    .letter-paper {
        background-color: #ffffff;
        width: 100%; flex: 1;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
        border-radius: 4px;
        overflow-y: auto;
        padding: 3rem;
        position: relative;
        color: #1f2937;
        font-family: system-ui, -apple-system, sans-serif;
    }

    /* En-tête Modal */
    .modal-header {
        padding-bottom: 1.5rem; 
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 2rem;
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start;
    }
    .modal-header h2 { 
        color: #111827; 
        font-family: 'Georgia', serif;
        font-size: 2rem; 
        margin: 0; 
        font-weight: 700;
    }
    .modal-header .subtitle {
        color: #6b7280;
        font-style: italic;
        margin-top: 0.5rem;
    }

    /* --- STYLES DU CERTIFICAT LITURGIQUE (VERSION A4 PAYSAGE) --- */
    .certificate-full {
        background-color: #ffffff;
        width: 100%;
        height: 100%;
        max-width: 297mm;
        aspect-ratio: 297/210;
        margin: 0 auto;
        padding: 0 !important;          /* supprime tout padding externe */
        box-shadow: none;
        text-align: center;
        font-family: 'Lato', sans-serif;
        display: flex;
        flex-direction: column;
    }

    /* Cadres décoratifs restaurés */
    .border-frame {
        border: 15px solid #0f2c5c;
        padding: 5px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .border-inner {
        border: 3px solid #c5a059;
        padding: 20px 30px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .cert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
    }

    .logo-container { width: 70px; text-align: left; }
    .logo-img { width: 70px; height: auto; object-fit: contain; }

    .title-container { flex: 1; }

    .certificate-full h1 {
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        color: #0f2c5c;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 2px;
        line-height: 1.2;
        font-weight: 700; /* gras */
    }

    .qr-container { width: 70px; text-align: right; }
    .qr-img { width: 60px; height: 60px; border: 1px solid #ddd; padding: 2px; background: white; }

    .subtitle-cert {
        font-family: 'Lato', sans-serif;
        font-size: 0.9rem;
        color: #c5a059;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 15px;
        font-weight: 700;
    }

    .recipient-name {
        font-family: 'Great Vibes', cursive;
        font-size: 3rem;
        color: #0f2c5c;
        margin: 5px 0 25px 0;
        line-height: 1.2;
        word-break: break-word;
    }

    .body-text {
        font-size: 1rem;
        color: #555;
        line-height: 1.6;
        margin-bottom: 30px;
        flex: 1;
        padding: 0 10px;
    }
    .body-text-italic {
        font-style: italic !important;
        color: #000000 !important;
    }

    .cert-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0 10px;
        margin-top: 20px;
    }

    .footer-left {
        width: 30%;
        text-align: left;
    }

    .footer-center {
        width: 30%;
        text-align: center;
    }

    .footer-right {
        width: 30%;
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
    }

    .signature-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #0f2c5c;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-family: 'Lato', sans-serif;
    }

    .signature-block {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-end;
    }

    .stamp-img {
        width: 70px;
        height: auto;
        opacity: 0.85;
        transform: rotate(-5deg);
    }

    .signature-name-plain {
        font-family: 'Lato', sans-serif;
        font-size: 1.8rem;
        font-weight: 600;
        color: #0f2c5c;
        line-height: 1;
    }

    .date-display {
        font-weight: bold;
        color: #333;
        font-size: 1rem;
        line-height: 1.5;
    }
    /* --- FIN STYLES CERTIFICAT --- */

    /* Style Signature Spécifique (pour les autres usages) */
    .signature-img {
        font-family: 'Brush Script MT', 'Great Vibes', cursive;
        font-size: 2.5rem;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    .signature-label {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        color: #555;
    }

    /* Corps de la demande (Lettre) */
    .request-body {
        font-family: 'Georgia', serif;
        line-height: 1.6;
        font-size: 1.05rem;
    }
    .request-body p { margin-bottom: 1rem; text-align: justify; }

    /* Bouton Fermer */
    .modal-close-btn {
        position: absolute;
        top: -40px; right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        width: 32px; height: 32px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex; align-items: center; justify-content: center;
        z-index: 20;
        transition: transform 0.2s;
    }
    .modal-close-btn:hover { transform: scale(1.1); }

    /* --- GRID VIEW (Vue Enveloppes) --- */
    .grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 2rem;
        padding: 2rem 1rem;
    }

    /* DESIGN ENVELOPPE */
    .envelope-card {
        background-color: var(--envelope-bg);
        position: relative;
        display: flex;
        flex-direction: column,
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        padding-top: 30px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        height: 160px;
    }
    .envelope-flap {
        position: absolute; top: 0; left: 0;
        width: 0; height: 0;
        border-left: 120px solid transparent;
        border-right: 120px solid transparent;
        border-top: 50px solid var(--envelope-flap);
        transform-origin: top;
        transition: transform 0.4s ease, border-color 0.3s;
        z-index: 2;
    }
    .envelope-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
    .envelope-card:hover .envelope-flap {
        transform: rotateX(180deg);
        z-index: 0;
        border-top-color: #A69060;
    }
    .envelope-inside {
        position: absolute; top: 0; left: 0; width: 100%; height: 50px;
        background: #fff;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 8px;
    }
    .envelope-seal {
        width: 40px; height: 40px;
        background: var(--primary);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .envelope-content { z-index: 3; text-align: center; width: 100%; padding: 0 1rem; }
    .envelope-type {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 1px;
        color: #4B4B4B;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }
    .envelope-name {
        font-weight: 700;
        color: #1f2937;
        font-size: 1rem;
        margin-bottom: 0.5rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .envelope-meta {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.75rem;
        color: #4B4B4B;
    }

    /* ===================================== */
    /* STYLES FICHE A4 - NOUVEAU DESIGN BLEU */
    /* ===================================== */
    .fiche-a4 {
        background: #ffffff;
        width: 100%;
        padding: 0; /* hérite du padding du parent .letter-paper */
        color: #000000;
        font-family: 'Lato', sans-serif;
    }

    /* HEADER */
    .fiche-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 20px;
        margin-bottom: 40px;
        border-bottom: 2px solid #003366;
        padding-bottom: 20px;
    }

    .fiche-logo {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .fiche-logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .fiche-church-info {
        text-align: left;
        font-family: 'Cinzel', serif;
        color: #000;
    }
    .fiche-church-name {
        font-size: 20px;
        font-weight: 700;
        color: #003366;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 5px;
    }
    .fiche-district-name {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #333;
        margin-bottom: 8px;
    }
    .fiche-temple-name {
        font-family: 'Playfair Display', serif;
        font-size: 17px;
        font-style: italic;
        font-weight: 600;
    }

    /* TITRE PRINCIPAL */
    .fiche-main-title {
        text-align: center;
        margin-bottom: 35px;
    }
    .fiche-main-title h2 {
        font-family: 'Cinzel', serif;
        font-size: 22px;
        color: #000;
        text-transform: uppercase;
        border: 1px solid #000;
        padding: 10px 20px;
        display: inline-block;
        min-width: 60%;
    }

    /* SECTIONS */
    .fiche-section {
        margin-bottom: 30px;
    }

    .fiche-field-row {
        display: flex;
        align-items: baseline;
        margin-bottom: 12px;
    }
    .fiche-field-row .fiche-label {
        font-weight: 700;
        color: #003366;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
        width: 140px;
        flex-shrink: 0;
    }
    .fiche-field-row .fiche-value {
        font-size: 15px;
        line-height: 1.5;
        border-bottom: 1px solid #ddd;
        padding-bottom: 2px;
        flex: 1;
    }

    .fiche-info-grid {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 15px;
        margin-bottom: 15px;
    }
    .fiche-label {
        font-weight: 700;
        color: #003366;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
        padding-top: 2px;
    }
    .fiche-value {
        font-size: 15px;
        line-height: 1.5;
        border-bottom: 1px solid #ddd;
        padding-bottom: 2px;
    }
    .fiche-value.no-border {
        border-bottom: none;
    }
    .fiche-highlight {
        font-weight: 700;
        color: #003366;
        text-transform: uppercase;
        font-size: 16px;
    }

    /* TEXTE DE DEMANDE */
    .fiche-plain-text {
        margin: 30px 0;
        font-family: 'Lato', sans-serif;
        font-size: 14px;
        line-height: 1.8;
        color: #1e1e1e;
    }
    .fiche-plain-text p {
        margin: 0 0 12px 0;
    }
    .fiche-plain-text p:last-child {
        margin-bottom: 0;
    }
    .fiche-plain-text strong {
        font-weight: 700;
    }

    /* Lignes conducteur */
    .fiche-conductor-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-top: 20px;
        margin-bottom: 5px;
    }
    .fiche-conductor-left, .fiche-conductor-right {
        font-weight: bold;
    }
    .fiche-conductor-title {
        text-decoration: underline;
    }
    .fiche-conductor-name {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 35mm;
        font-size: 14px;
    }

    /* CITATIONS EN MINIATURE */
    .fiche-quotes-mini {
        margin-top: 20px;
        font-size: 10px;
        font-weight: bold;
        color: #003366;
        line-height: 1.5;
        border-top: 2px solid #003366;
        border-bottom: 2px solid #003366;
        padding: 10px;
        text-align: center;
        background: #ffffff;
        border-radius: 5px;
        font-style: normal;
    }
    .fiche-quotes-mini p {
        margin: 5px 0;
    }

    .fiche-quote-box {
        background-color: transparent;
        border-left: 3px solid #003366;
        padding: 15px 20px;
        margin: 30px 0;
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 15px;
        color: #333;
    }
    .fiche-quote-ref {
        display: block;
        margin-top: 8px;
        font-size: 13px;
        color: #003366;
        font-weight: bold;
        font-style: normal;
        text-align: right;
    }

    .fiche-footer {
        margin-top: 60px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-top: 20px;
        border-top: 1px solid #000;
    }
    .fiche-conductor-info {
        font-size: 13px;
        color: #000;
    }
    .fiche-signature-block {
        text-align: center;
        width: 220px;
    }
    .fiche-signature-line {
        border-top: 1px solid #000;
        margin-top: 60px;
        padding-top: 5px;
        font-size: 11px;
        text-transform: uppercase;
        color: #000;
        letter-spacing: 1px;
    }

    @media (max-width: 600px) {
        .fiche-field-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        .fiche-field-row .fiche-label {
            width: auto;
        }
        .fiche-conductor-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        .fiche-a4 { padding: 30px 20px; }
        .fiche-info-grid { grid-template-columns: 1fr; gap: 5px; }
        .fiche-label { margin-bottom: 2px; }
        .fiche-footer { flex-direction: column; align-items: center; gap: 30px; }
    }

    /* announcement form styles */
    .ann-field{display:flex;flex-direction:column;gap:8px}.ann-label{font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#5C5748}.ann-req{color:#C06040}
    .ann-input{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit}
    .ann-input:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
    .ann-textarea{padding:12px 16px;background:#F5F4F0;border:1.5px solid #D6D1C7;border-radius:8px;font-size:14px;color:#1E1B16;outline:none;resize:vertical;line-height:1.6;font-family:inherit;transition:border-color .2s,box-shadow .2s}
    .ann-textarea:focus{border-color:#5B3FAF;box-shadow:0 0 0 3px rgba(91,63,175,.08);background:#fff}
    .ann-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ann-type-btn{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:10px;border:2px solid #E8E4DC;background:#FAFAF7;cursor:pointer;transition:all .2s;text-align:left;position:relative;}
    .ann-type-btn:hover{border-color:#5B3FAF;background:rgba(91,63,175,.04)}.ann-type-btn.sel{border-color:#5B3FAF;background:rgba(91,63,175,.07);box-shadow:0 0 0 3px rgba(91,63,175,.12)}
    .atb-emoji{font-size:28px;flex-shrink:0}.atb-label{font-size:13px;font-weight:700;color:#1E1B16;line-height:1.4;flex:1;}
    .atb-check{width:22px;height:22px;border-radius:50%;background:#5B3FAF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
    .ann-form{display:flex;flex-direction:column;gap:18px;}
    .ann-chars{font-size:11px;color:#9C9484;text-align:right;}
    .ann-visibility{display:flex;align-items:center;gap:8px;padding:12px 14px;background:rgba(74,124,94,.06);border:1px solid rgba(74,124,94,.18);border-radius:8px;font-size:13px;color:#4A7C5E;font-weight:600;}
    .ann-recap{display:flex;flex-direction:column;gap:14px;}
    .ann-recap-type{display:flex;align-items:center;gap:16px;padding:18px;border-radius:10px;background:#F5F4F0;border:1.5px solid #E8E4DC;}
    .ann-recap-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #E8E4DC;font-size:13px;gap:10px;}
    .ann-recap-msg{background:#F5F4F0;border-radius:8px;padding:14px;border:1px solid #E8E4DC;}
    .arm-label{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9C9484;margin-bottom:8px;}
    .arm-text{font-size:13.5px;color:#1E1B16;line-height:1.7;}
    @media(max-width:768px){.ann-type-grid{grid-template-columns:1fr}}

    /* Modal annonce */
    .ann-modal-preview{background:rgba(91,63,175,.04);border:1px solid rgba(91,63,175,.12);border-radius:10px;padding:14px 16px;margin-bottom:4px;}
    .ann-modal-msg{background:#F8F7FF;border:1px solid rgba(91,63,175,.15);border-left:3px solid var(--violet);border-radius:8px;padding:14px;font-size:13.5px;color:var(--text);line-height:1.7}

    /* ── TOAST ── */
    .toast{position:fixed;right:24px;bottom:24px;background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.8);border-left:4px solid var(--green);color:var(--text);padding:13px 18px;border-radius:11px;z-index:220;font-size:13px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.15);backdrop-filter:blur(8px);animation:toastIn .35s cubic-bezier(.34,1.56,.64,1) both;}
    @keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

    /* ===================================== */
    /* STYLES D'IMPRESSION POUR FORMAT A4   */
    /* ===================================== */
    @media print {
        * {
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
            text-shadow: none !important;
            backdrop-filter: none !important;
        }

        .btn-back,
        .btn-create,
        .btn-bulk,
        .item-actions,
        .bulk-check,
        .quick-tools,
        .tab-bar,
        .modal-overlay,
        .toast,
        .alert-action,
        .btn-cta-ann,
        .ann-hero-pulse,
        .ann-mini-stat,
        .ann-subtabs,
        .btn-pdf,
        .btn-create-side,
        .btn-view,
        .btn-approve,
        .btn-refuse,
        .pager-btn,
        .modal-foot,
        .modal-close,
        .panel-actions button:not(.panel-count-badge) {
            display: none !important;
        }

        @page {
            size: A4;
            margin: 1.5cm;
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.4;
            background: white;
        }

        .conductor-page {
            background: white;
            min-height: auto;
        }

        .page-content {
            padding: 0;
            max-width: 100%;
        }

        .panel,
        .kpi-card,
        .alert-banner,
        .demande-item,
        .ann-item,
        .timeline-item,
        .panel-side {
            border: 1px solid #aaa !important;
            margin-bottom: 0.3cm;
            page-break-inside: avoid;
            background: white !important;
            border-radius: 0;
        }

        .panel-head {
            border-bottom: 1px solid #aaa;
            background: #f5f5f5 !important;
        }

        .badge {
            border: 1px solid black !important;
            background: none !important;
            color: black !important;
        }

        .badge-dot {
            display: none;
        }

        .badge-soumise,
        .badge-transmis,
        .badge-valide,
        .badge-refuse {
            background: none !important;
            color: black !important;
        }

        .page-content::before {
            content: "Gestion des demandes - Impression du " counter(page);
            display: block;
            text-align: right;
            font-size: 9pt;
            color: #444;
            margin-bottom: 0.5cm;
        }

        h1, h2, h3, h4 {
            page-break-after: avoid;
        }

        img, svg {
            max-width: 100% !important;
        }

        .panel-head,
        .panel-body,
        .demande-item,
        .ann-item {
            padding: 0.3cm 0.4cm;
        }

        .panel-title {
            font-size: 14pt;
            font-weight: bold;
        }

        .demande-name,
        .ann-item-type {
            font-size: 12pt;
        }

        .demande-type,
        .ann-item-msg,
        .modal-info-key,
        .modal-info-val {
            font-size: 10pt;
        }

        .timeline-dot {
            display: none;
        }
    }

    @media(max-width:1100px){.kpi-row{grid-template-columns:repeat(2,1fr)}.grid-3-1,.grid-2{grid-template-columns:1fr}}
    @media(max-width:768px){.page-content{padding:18px}.kpi-row{grid-template-columns:1fr 1fr}.tab-toolbar{align-items:stretch}.tab-bar{width:100%;overflow-x:auto;margin-bottom:0}.quick-tools{width:100%;justify-content:flex-start}.quick-dropdown{width:100%;min-width:0}.quick-search{width:100%;min-width:0}.top-actions{flex-wrap:wrap}.page-heading{order:-1;width:100%}.ann-hero{flex-direction:column;align-items:flex-start}.ann-hero-stats{width:100%}.ann-item-right{min-width:auto}}
    @media(max-width:500px){.kpi-row{grid-template-columns:1fr}}
`;

// --- Composant Badge pour le statut ---
const ActeStatusBadge = ({ status }) => {
    let className = "";
    let label = "";
    let bgColor = "#f3f4f6";
    let textColor = "#374151";
    let borderColor = "#d1d5db";

    // Normaliser le statut
    const normalizedStatus = String(status || "")
        .toLowerCase()
        .trim();

    if (
        normalizedStatus.includes("validé") ||
        normalizedStatus === "validee" ||
        normalizedStatus === "publiée" ||
        normalizedStatus === "celebre"
    ) {
        bgColor = "#dcfce7";
        textColor = "#166534";
        borderColor = "#86efac";
        label = "Validé";
    } else if (
        normalizedStatus.includes("en attente") ||
        normalizedStatus.includes("soumise") ||
        normalizedStatus.includes("transmise")
    ) {
        bgColor = "#fef3c7";
        textColor = "#92400e";
        borderColor = "#fcd34d";
        label = "En attente";
    } else if (
        normalizedStatus.includes("rejeté") ||
        normalizedStatus.includes("refusé")
    ) {
        bgColor = "#fee2e2";
        textColor = "#991b1b";
        borderColor = "#fca5a5";
        label = "Rejeté";
    } else {
        label = status;
    }

    return (
        <span
            style={{
                display: "inline-flex",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: "700",
                border: `1px solid ${borderColor}`,
                backgroundColor: bgColor,
                color: textColor,
                alignItems: "center",
            }}
        >
            {label}
        </span>
    );
};

// --- Fonctions de formatage ---
function formatLongDate(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    return d.toLocaleDateString("fr-FR", options);
}

function formatLongTime(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}h${minutes}`;
}

function formatDate(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("fr-FR");
}

function formatTime(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// --- Générateur de texte de demande (modifié : données en gras italique) ---
function generateRequestTextHTML(acte) {
    const type = acte.type || "Acte liturgique";
    const personne = acte.member || "—";
    const dateLong = acte.date ? formatLongDate(acte.date) : "—";
    const heureLong = acte.date ? formatLongTime(acte.date) : "—";
    const lieu = "—"; // Pas de lieu dans les données
    const ville = "Abidjan";
    const conducteur = acte.conductor || "—";
    const pasteur = acte.pastor || "—";

    return `
        <p><strong>Objet : <strong><em>${type}</em></strong></strong></p>
        <p>Madame(s) / Monsieur(s) les Responsables de la communauté,</p>
        <p>Par la présente, je viens respectueusement solliciter auprès de la communauté l’annonce de <strong><em>${type}</em></strong> concernant <strong><em>${personne}</em></strong>.</p>
        <p>Nous souhaiterions que cette annonce soit faite auprès de la communauté afin d’informer les fidèles et de les inviter à s’associer à cet événement par leur présence et leurs prières. Pour le : <strong><em>${dateLong}</em></strong> à <strong><em>${heureLong}</em></strong> à <strong><em>${lieu}</em></strong>.</p>
        <p>Dans l’attente d’une suite favorable à notre demande, nous vous prions d’agréer, Madame(s) / Monsieur(s) les Responsables, l’expression de nos salutations respectueuses et fraternelles en Christ.</p>
        <p>Fait à : <strong><em>${ville}</em></strong>.</p>
        <div class="fiche-conductor-row">
            <div class="fiche-conductor-left">
                <strong class="fiche-conductor-title">Conducteur de la Classe :</strong>
            </div>
            <div class="fiche-conductor-right">
                <strong class="fiche-conductor-title">Bureau des Conducteurs / Pasteur</strong>
            </div>
        </div>
        <div class="fiche-conductor-name">
            <span><strong><em>${conducteur}</em></strong></span>
            <span><strong><em>${pasteur}</em></strong></span>
        </div>
    `;
}

// --- COMPOSANT CERTIFICAT (VERSION A4 PAYSAGE AVEC ENCADREMENTS) ---
const CertificateDisplay = ({ acte }) => {
    // Mapping des textes par type
    const contentData = {
        Baptême: {
            title: "Certificat de Baptême",
            text: "Pour avoir reçu le sacrement saint du baptême au sein de notre communauté paroissiale, marquant son entrée dans la famille de Dieu.",
        },
        Mariage: {
            title: "Certificat de Mariage",
            text: "Pour avoir uni leurs liens par le sacrement du mariage, témoignant de leur amour et de leur engagement devant Dieu et l’Assemblée.",
        },
        Décès: {
            title: "Certificat de Funérailles",
            text: "Pour avoir accompagné avec dignité et prière le défunt vers la maison du Père, en présence de ses proches et de la communauté.",
        },
        "1ère Communion": {
            title: "Certificat de 1ère Communion",
            text: "Pour avoir reçu pour la première fois le sacrement de l'Eucharistie, scellant son union avec le Christ et l'Église.",
        },
        Naissance: {
            title: "Certificat de Naissance",
            text: "Pour célébrer et bénir la naissance de cet enfant au sein de notre communauté, signe d'espérance et de vie.",
        },
    };

    // Récupération des données, avec fallback
    const data = contentData[acte.type] || {
        title: `Certificat de ${acte.type}`,
        text:
            acte.description ||
            "Acte liturgique célébré selon la tradition de notre Église.",
    };

    // Pour le décès, on personnalise le texte avec le nom du défunt
    let bodyText = data.text;
    if (acte.type === "Décès") {
        bodyText = `Pour avoir accompagné avec dignité et prière le défunt ${acte.member} vers la maison du Père, en présence de ses proches et de la communauté.`;
    }

    const formattedDate = new Date(acte.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return (
        <div className="certificate-full">
            <div className="border-frame">
                <div className="border-inner">
                    {/* Header */}
                    <div className="cert-header">
                        <div className="logo-container">
                            <img
                                src={withBasePath("", "/images/image.png")}
                                alt="Logo Jubilé"
                                className="logo-img"
                            />
                        </div>
                        <div className="title-container">
                            <h1>{data.title}</h1>
                        </div>
                        <div className="qr-container">
                            <QRCodeCanvas
                                value={`Verification-ACT-${acte.id}`}
                                size={60}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="L"
                                includeMargin={false}
                                className="qr-img"
                            />
                        </div>
                    </div>

                    <div className="subtitle-cert">
                        Ce certificat est fièrement décerné à
                    </div>
                    <div className="recipient-name">{acte.member}</div>

                    {/* Texte du corps : condition pour italique et noir si Décès */}
                    <div
                        className={`body-text ${acte.type === "Décès" ? "body-text-italic" : ""}`}
                    >
                        {bodyText}
                    </div>

                    {/* Footer avec date à gauche, signature + cachet à droite */}
                    <div className="cert-footer">
                        <div className="footer-left">
                            <div className="date-display">
                                Fait le : {formattedDate} à Abidjan
                            </div>
                        </div>
                        <div className="footer-center"></div>
                        <div className="footer-right">
                            <div className="signature-label">
                                signature et cachet du Pasteur
                            </div>
                            <div className="signature-block">
                                <img
                                    src={withBasePath(
                                        "",
                                        "/images/signature.jpg",
                                    )}
                                    alt="Cachet"
                                    className="stamp-img"
                                />
                                {/* Nom du pasteur en police standard */}
                                <span className="signature-name-plain">
                                    {acte.pastor}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Composant Modal Details ---
const ActeDetailsModal = ({ acte }) => {
    const printRef = useRef();

    if (!acte) return null;

    // Déterminer si on doit afficher le certificat (pour tous les types validés)
    const showCertificate = acte.status === "validated";

    const handleDownload = () => {
        if (printRef.current) {
            const opt = {
                // Marges : 0 pour le certificat (plein format), sinon marges normales pour la fiche
                margin: showCertificate ? 0 : [0.5, 1.5, 0.5, 1.5],
                filename: showCertificate
                    ? `Certificat_${acte.type}_${acte.id}.pdf`
                    : `Fiche_Acte_${acte.id}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, letterRendering: true },
                jsPDF: {
                    unit: "cm",
                    format: "a4",
                    orientation: showCertificate ? "landscape" : "portrait",
                },
            };
            html2pdf().from(printRef.current).set(opt).save();
        }
    };

    return (
        <div className="letter-paper">
            {/* HEADER */}
            <div className="modal-header">
                <div>
                    <h2>Détails de la Demande</h2>
                    <div className="subtitle">
                        Réf : ACT-{acte.id} •{" "}
                        <ActeStatusBadge status={acte.status} />
                    </div>
                </div>
                {/* Bouton de téléchargement visible UNIQUEMENT si validé */}
                {acte.status === "validated" && (
                    <button
                        onClick={handleDownload}
                        className="btn btn-download-paper"
                        title="Télécharger le PDF"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        <span>Télécharger</span>
                    </button>
                )}
            </div>

            <div className="acte-details" ref={printRef}>
                {showCertificate ? (
                    // SI VALIDÉ ET TYPE DÉCÈS OU BAPTÊME : AFFICHER LE CERTIFICAT
                    <CertificateDisplay acte={acte} />
                ) : (
                    // SINON (non validé, ou validé mais autre type) : AFFICHER LA FICHE
                    <div className="fiche-a4">
                        {/* En-tête avec logo */}
                        <header className="fiche-header">
                            <div className="fiche-logo">
                                <img
                                    src={withBasePath("", "/images/image.png")}
                                    alt="Logo Jubilé"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="fiche-church-info">
                                <div className="fiche-church-name">
                                    Eglise Méthodiste de Côte d’Ivoire
                                </div>
                                <div className="fiche-district-name">
                                    District Abidjan Nord
                                </div>
                                <div className="fiche-temple-name">
                                    Temple du Jubilé de Cocody
                                </div>
                            </div>
                        </header>

                        <div className="fiche-main-title">
                            <h2>Fiche d'Acte Liturgique</h2>
                        </div>

                        <div className="fiche-section">
                            {/* Champs sur une seule ligne avec libellé et valeur */}
                            <div className="fiche-field-row">
                                <span className="fiche-label">DEMANDEUR :</span>
                                <span className="fiche-value">
                                    {acte.member}
                                </span>
                            </div>
                            <div className="fiche-field-row">
                                <span className="fiche-label">FAMILLE :</span>
                                <span className="fiche-value">
                                    {acte.family || "—"}
                                </span>
                            </div>
                            <div className="fiche-field-row">
                                <span className="fiche-label">CLASSE :</span>
                                <span className="fiche-value">
                                    {acte.class || "—"}
                                </span>
                            </div>
                            <div className="fiche-field-row">
                                <span className="fiche-label">
                                    DATE D'ANNONCE :
                                </span>
                                <span className="fiche-value">
                                    {acte.date ? formatDate(acte.date) : "—"}
                                </span>
                            </div>
                            <div className="fiche-field-row">
                                <span className="fiche-label">HEURE :</span>
                                <span className="fiche-value">
                                    {acte.date ? formatTime(acte.date) : "—"}
                                </span>
                            </div>

                            {/* Texte de demande */}
                            <div
                                className="fiche-plain-text"
                                dangerouslySetInnerHTML={{
                                    __html: generateRequestTextHTML(acte),
                                }}
                            />

                            {/* Citations bibliques en miniature */}
                            <div className="fiche-quotes-mini">
                                <p>
                                    Psaume 65 : 3 « O toi qui écoutes la prière
                                    ! Tous les hommes viendront à toi. »
                                </p>
                                <p>
                                    Jean 14 : 13-14 « …tout ce que vous
                                    demanderez en mon nom, je le ferai afin que
                                    le Père soit glorifié dans le Fils. Si vous
                                    demandez quelque chose en mon nom, je le
                                    ferai. »
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Fonction pour normaliser les types d'actes ---
function normalizeActeType(typeRaw) {
    const typeMap = {
        bapteme: "Baptême",
        mariage: "Mariage",
        deces: "Décès",
        naissance: "Naissance",
        premiere_communion: "1ère Communion",
        confirmation: "Confirmation",
    };
    const normalized = String(typeRaw || "")
        .toLowerCase()
        .trim();
    return typeMap[normalized] || typeRaw;
}

// --- Composant Principal (ActesLiturgique) ---
export default function ActesLiturgique({ auth, actes = [] }) {
    // États pour les actes - utiliser les vraies données du serveur
    const [allActs, setAllActs] = useState(
        actes.map((acte) => ({
            id: acte.id,
            type: normalizeActeType(acte.type_acte),
            date: acte.date_souhaitee || acte.created_at,
            member: acte.membre
                ? `${acte.membre.prenom} ${acte.membre.nom}`
                : "—",
            memberPhoto: acte.membre?.profile_photo_url || null,
            family: acte.family?.nom || acte.classe?.nom || "—",
            class: acte.classe?.nom || "—",
            conductor: acte.conducteur
                ? `${acte.conducteur.prenom} ${acte.conducteur.nom}`
                : "À assigner",
            pastor: acte.pasteur
                ? `${acte.pasteur.prenom} ${acte.pasteur.nom}`
                : "À assigner",
            description: acte.details?.notes || "Sans description",
            attachment: null,
            status: acte.statut?.toLowerCase().replace("_", " ") || "pending",
            reference: acte.reference,
            raw: acte, // Conserve les données brutes pour les mises à jour
        })),
    );
    const [filteredActs, setFilteredActs] = useState(allActs);
    const [loading, setLoading] = useState(false);

    // État pour le mode d'affichage (Tableau ou Grille)
    const [viewMode, setViewMode] = useState("table");

    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [pastorFilter, setPastorFilter] = useState("");

    // États pour les modales
    const [selectedAct, setSelectedAct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // États de pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Charger les données / rafraîchir après changements
    useEffect(() => {
        if (allActs.length === 0 && actes.length > 0) {
            applyFilters();
        }
    }, [allActs.length, actes.length]);

    // --- LOGIQUE DE FILTRAGE ---
    const applyFilters = useCallback(() => {
        let filtered = [...allActs];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter((acte) =>
                `${acte.type} ${acte.member} ${acte.family} ${acte.pastor}`
                    .toLowerCase()
                    .includes(search),
            );
        }

        if (typeFilter) {
            filtered = filtered.filter((a) => a.type === typeFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter((a) => a.status === statusFilter);
        }

        if (pastorFilter) {
            filtered = filtered.filter((a) => a.pastor === pastorFilter);
        }

        setFilteredActs(filtered);
        setCurrentPage(1);
    }, [allActs, searchTerm, typeFilter, statusFilter, pastorFilter]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Options uniques pour les filtres
    const uniqueTypes = [...new Set(allActs.map((a) => a.type))].sort();
    const uniquePastors = [...new Set(allActs.map((a) => a.pastor))].sort();

    // --- OPÉRATIONS CRUD (COMMUNICATION BASE DE DONNÉES) ---
    const refreshActs = useCallback(async () => {
        setLoading(true);
        try {
            // Utiliser Inertia pour recharger complètement les données
            router.get(
                withBasePath("", "/admin/liturgie"),
                {},
                { preserveScroll: true },
            );
        } catch (error) {
            console.error("Erreur lors du chargement des actes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteAct = useCallback(async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet acte?"))
            return;

        try {
            setLoading(true);
            await axios.delete(withBasePath("", `/admin/liturgie/${id}`));
            setAllActs((prev) => prev.filter((act) => act.id !== id));
            alert("Acte supprimé avec succès");
        } catch (error) {
            alert(
                "Erreur lors de la suppression: " +
                    (error.response?.data?.message || error.message),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const updateActStatus = useCallback(async (id, newStatus) => {
        try {
            setLoading(true);
            // Utiliser la route POST /transition pour changer le statut
            await axios.post(
                withBasePath("", `/admin/liturgie/${id}/transition`),
                {
                    statut: newStatus,
                    commentaire: "",
                },
            );
            setAllActs((prev) =>
                prev.map((act) =>
                    act.id === id
                        ? {
                              ...act,
                              status: newStatus.toLowerCase().replace("_", " "),
                          }
                        : act,
                ),
            );
            alert("Statut mis à jour");
        } catch (error) {
            alert(
                "Erreur: " + (error.response?.data?.message || error.message),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // --- GESTION DES MODALES ---
    const openModal = (acte) => {
        setSelectedAct(acte);
        setIsExiting(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            setIsModalOpen(false);
            setSelectedAct(null);
        }, 200);
    };

    // --- EXPORTS ---
    const exportToExcel = () => {
        if (filteredActs.length === 0)
            return alert("Aucune donnée à exporter.");
        const columns = [
            "Type",
            "Membre",
            "Famille",
            "Classe",
            "Conducteur",
            "Pasteur",
            "Date",
            "Description",
            "Pièce",
            "Statut",
        ];
        const rows = filteredActs.map((a) => [
            a.type,
            a.member,
            a.family,
            a.class,
            a.conductor,
            a.pastor,
            a.date,
            a.description,
            a.attachment,
            a.status,
        ]);

        const csvContent = [
            columns.join(";"),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute(
            "download",
            `actes_liturgiques_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = async () => {
        if (filteredActs.length === 0)
            return alert("Aucune donnée à exporter.");
        alert(
            "Fonctionnalité PDF globale - Veuillez installer jsPDF et jsPDF-autotable.",
        );
    };

    // --- PAGINATION ---
    const getPaginatedActs = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredActs.slice(startIndex, startIndex + itemsPerPage);
    };

    const Pagination = ({ total, current, perPage, onPageChange }) => {
        const totalPages = Math.ceil(total / perPage);
        if (totalPages <= 1) return null;
        const pages = [];
        for (let i = 1; i <= totalPages; i++) pages.push(i);

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-sm border-t border-white/50">
                <div className="flex items-center gap:2">
                    <span className="text-sm text-gray-700">
                        Affichage de {(current - 1) * perPage + 1} à{" "}
                        {Math.min(current * perPage, total)} sur {total} actes
                    </span>
                    <select
                        value={perPage}
                        onChange={(e) => {
                            onPageChange(1, parseInt(e.target.value));
                        }}
                        className="input-control !py-1 !px-2 text-sm"
                    >
                        <option value={10}>10/page</option>
                        <option value={20}>20/page</option>
                        <option value={50}>50/page</option>
                    </select>
                </div>
                <div className="flex gap:2">
                    <button
                        onClick={() => onPageChange(current - 1, perPage)}
                        disabled={current === 1}
                        className="btn btn-secondary !py-1 !px-3 disabled:opacity-50"
                    >
                        Précédent
                    </button>
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page, perPage)}
                            className={`btn !py-1 !px-3 ${page === current ? "btn-primary" : "btn-secondary"}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => onPageChange(current + 1, perPage)}
                        disabled={current === totalPages}
                        className="btn btn-secondary !py-1 !px-3 disabled:opacity-50"
                    >
                        Suivant
                    </button>
                </div>
            </div>
        );
    };

    // --- CALCUL DES STATISTIQUES (Dynamique) ---
    const stats = {
        total: filteredActs.length,
        pending: filteredActs.filter((a) => a.status === "pending").length,
        validated: filteredActs.filter((a) => a.status === "validated").length,
        rejected: filteredActs.filter((a) => a.status === "rejected").length,
    };

    // Titre dynamique pour les stats
    const statsTitle = typeFilter ? typeFilter : "Global";

    // --- RENDU ---
    return (
        <>
            <Head title="Actes Liturgiques">
                {/* Ajout des polices Google pour le certificat */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <style>{GLOBAL_STYLES}</style>

            {/* MODAL DÉTAILS ACTE */}
            {isModalOpen && selectedAct && (
                <div
                    className={`modal-overlay ${isExiting ? "closing" : ""}`}
                    onClick={closeModal}
                >
                    <div
                        className={`modal-content ${isExiting ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Bouton fermer */}
                        <button
                            className="modal-close-btn"
                            onClick={closeModal}
                            title="Fermer"
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        <ActeDetailsModal acte={selectedAct} />
                    </div>
                </div>
            )}

            {/* CONTENU PRINCIPAL */}
            <div
                className="min-h-screen py-8 px-4 animate-fade-in-up"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-[1800px] mx-auto">
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 w-full">
                        <div className="w-full md:w-auto flex-shrink-0">
                            <Link
                                href={withBasePath("", "/dashboard")}
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
                            Gestion des Actes Liturgiques
                        </h1>

                        {/* BOUTON FAIRE UNE DEMANDE - commenté pour plus tard */}
                        {/*
                        <div className="w-full md:w-auto flex-shrink-0">
                            <Link href={withBasePath("", "/admin/liturgie")} className="btn btn-secondary gap-2 w-full md:w-auto justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Mon espace liturgique
                            </Link>
                        </div>
                        */}
                    </div>

                    {/* --- STATS CARDS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {/* Carte Total */}
                        <div className="bg-white/90 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg flex items-center justify-between hover:transform hover:-translate-y-1 transition-transform duration-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                    Total {statsTitle}
                                </p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Carte En attente */}
                        <div className="bg-white/90 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg flex items-center justify-between hover:transform hover:-translate-y-1 transition-transform duration-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                    En attente
                                </p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1">
                                    {stats.pending}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Carte Validé */}
                        <div className="bg-white/90 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg flex items-center justify-between hover:transform hover:-translate-y-1 transition-transform duration-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                    Validés
                                </p>
                                <p className="text-3xl font-bold text-green-600 mt-1">
                                    {stats.validated}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Carte Rejeté */}
                        <div className="bg-white/90 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg flex items-center justify-between hover:transform hover:-translate-y-1 transition-transform duration-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                    Rejetés
                                </p>
                                <p className="text-3xl font-bold text-red-600 mt-1">
                                    {stats.rejected}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* BARRE DE FILTRES */}
                    <div className="glass-panel filters-bar">
                        {/* Ligne 1 : Filtres */}
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
                                    placeholder="Rechercher (type, membre, famille...)"
                                    className="input-control input-search"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Tous types</option>
                                {uniqueTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Tous statuts</option>
                                <option value="pending">En attente</option>
                                <option value="validated">Validé</option>
                                <option value="rejected">Rejeté</option>
                            </select>

                            <select
                                value={pastorFilter}
                                onChange={(e) =>
                                    setPastorFilter(e.target.value)
                                }
                                className="input-control"
                                style={{ minWidth: "140px" }}
                            >
                                <option value="">Tous pasteurs</option>
                                {uniquePastors.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setTypeFilter("");
                                    setStatusFilter("");
                                    setPastorFilter("");
                                }}
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
                        </div>

                        {/* Ligne 2 : Navigation & Actions */}
                        <div className="filter-second-row">
                            <div className="filter-nav">
                                <button
                                    onClick={() => setTypeFilter("")}
                                    className={`filter-nav-btn ${typeFilter === "" ? "active" : ""}`}
                                >
                                    Tous
                                </button>

                                <button
                                    onClick={() => setTypeFilter("Baptême")}
                                    className={`filter-nav-btn ${typeFilter === "Baptême" ? "active" : ""}`}
                                >
                                    Baptême
                                </button>

                                <button
                                    onClick={() => setTypeFilter("Mariage")}
                                    className={`filter-nav-btn ${typeFilter === "Mariage" ? "active" : ""}`}
                                >
                                    Mariage
                                </button>

                                <button
                                    onClick={() => setTypeFilter("Décès")}
                                    className={`filter-nav-btn ${typeFilter === "Décès" ? "active" : ""}`}
                                >
                                    Décès
                                </button>
                            </div>

                            <div className="filter-actions">
                                {/* Bouton Rafraîchir */}
                                <button
                                    onClick={refreshActs}
                                    className="btn btn-primary"
                                    disabled={loading}
                                    title="Recharger les données depuis le serveur"
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
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    {loading ? "Chargement..." : "Rafraîchir"}
                                </button>

                                {/* Bouton Vue Grille / Table */}
                                <button
                                    onClick={() =>
                                        setViewMode(
                                            viewMode === "table"
                                                ? "grid"
                                                : "table",
                                        )
                                    }
                                    className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
                                >
                                    {viewMode === "table"
                                        ? "Vue Fichier"
                                        : "Vue Table"}
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
                        </div>
                    </div>

                    {/* TABLEAU OU GRILLE (CONDITIONNEL) */}
                    <div className="table-container">
                        {/* --- VUE TABLEAU --- */}
                        {viewMode === "table" && (
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="text-center">
                                                Membre Concerné
                                            </th>
                                            <th className="text-center">
                                                Type
                                            </th>
                                            <th className="text-center">
                                                Famille
                                            </th>
                                            <th className="text-center">
                                                Classe
                                            </th>
                                            <th className="text-center">
                                                Conducteur Concerné
                                            </th>
                                            <th className="text-center">
                                                Pasteur Concerné
                                            </th>
                                            <th className="text-center">
                                                Date Cérémonie
                                            </th>
                                            <th className="text-center">
                                                Pièce Jointe
                                            </th>
                                            <th className="text-center">
                                                Statut
                                            </th>
                                            <th className="text-center">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPaginatedActs().length > 0 ? (
                                            getPaginatedActs().map((acte) => (
                                                <tr
                                                    key={acte.id}
                                                    className="hover:bg-white/90 transition"
                                                >
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            padding: "0.75rem",
                                                            verticalAlign:
                                                                "middle",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "flex-start",
                                                                gap: "12px",
                                                                minHeight:
                                                                    "50px",
                                                                paddingLeft:
                                                                    "16px",
                                                                paddingRight:
                                                                    "16px",
                                                            }}
                                                        >
                                                            {acte.memberPhoto && (
                                                                <img
                                                                    src={
                                                                        acte.memberPhoto
                                                                    }
                                                                    alt={
                                                                        acte.member
                                                                    }
                                                                    style={{
                                                                        width: "40px",
                                                                        height: "40px",
                                                                        borderRadius:
                                                                            "50%",
                                                                        objectFit:
                                                                            "cover",
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            )}
                                                            <span
                                                                style={{
                                                                    fontWeight:
                                                                        "500",
                                                                }}
                                                            >
                                                                {acte.member}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center font-medium">
                                                        {acte.type}
                                                    </td>
                                                    <td className="text-center">
                                                        {acte.family}
                                                    </td>
                                                    <td className="text-center">
                                                        {acte.class}
                                                    </td>
                                                    <td className="text-center">
                                                        {acte.conductor}
                                                    </td>
                                                    <td className="text-center">
                                                        {acte.pastor}
                                                    </td>
                                                    <td className="text-center">
                                                        {new Date(
                                                            acte.date,
                                                        ).toLocaleDateString(
                                                            "fr-FR",
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {acte.attachment ? (
                                                            <button className="text-blue-600 hover:text-blue-800 underline">
                                                                Fichier
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 italic">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <ActeStatusBadge
                                                            status={acte.status}
                                                        />
                                                    </td>
                                                    <td
                                                        className="text-center"
                                                        style={{
                                                            display: "flex",
                                                            gap: "6px",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                            minHeight: "50px",
                                                            padding: "0.75rem",
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                openModal(acte)
                                                            }
                                                            className="btn btn-view text-xs px-3 py-1.5"
                                                            disabled={loading}
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                />
                                                            </svg>
                                                            Voir
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                deleteAct(
                                                                    acte.id,
                                                                )
                                                            }
                                                            className="btn btn-danger text-xs px-3 py-1.5"
                                                            disabled={loading}
                                                            title="Supprimer"
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                            Suppr.
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={10}
                                                    className="text-center py-12 text-gray-400 italic"
                                                >
                                                    Aucun acte trouvé.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* --- VUE ENVELOPPES (GRILLE) --- */}
                        {viewMode === "grid" && (
                            <div className="grid-view">
                                {getPaginatedActs().length > 0 ? (
                                    getPaginatedActs().map((acte) => {
                                        let sealColor = "var(--primary)";
                                        if (acte.status === "validated")
                                            sealColor = "var(--success)";
                                        if (acte.status === "rejected")
                                            sealColor = "var(--danger)";
                                        if (acte.status === "pending")
                                            sealColor = "var(--warning)";

                                        return (
                                            <div
                                                key={acte.id}
                                                className="envelope-card"
                                                onClick={() => openModal(acte)}
                                                title="Cliquez pour ouvrir la demande"
                                            >
                                                <div className="envelope-flap"></div>
                                                <div className="envelope-inside">
                                                    <div
                                                        className="envelope-seal"
                                                        style={{
                                                            backgroundColor:
                                                                sealColor,
                                                        }}
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
                                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="envelope-content">
                                                    <div className="envelope-type">
                                                        {acte.type}
                                                    </div>
                                                    <div className="envelope-name">
                                                        {acte.member}
                                                    </div>
                                                    <div className="envelope-meta">
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        {new Date(
                                                            acte.date,
                                                        ).toLocaleDateString(
                                                            "fr-FR",
                                                        )}
                                                    </div>
                                                    <div className="mt-2">
                                                        <ActeStatusBadge
                                                            status={acte.status}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 italic bg-white/30 rounded-xl border border-white/50">
                                        Aucune enveloppe trouvée.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PAGINATION */}
                        <Pagination
                            total={filteredActs.length}
                            current={currentPage}
                            perPage={itemsPerPage}
                            onPageChange={(newPage, newPerPage) => {
                                setCurrentPage(newPage);
                                if (newPerPage !== itemsPerPage)
                                    setItemsPerPage(newPerPage);
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
