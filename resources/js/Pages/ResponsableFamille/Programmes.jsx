// pages/Membre/Programmes.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

// --- STYLES INTÉGRÉS ---
const styles = `
:root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --success: #16a34a;
    --danger: #dc2626;
    --warning: #ca8a04;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.5);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

/* Animations */
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}
@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
}
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* Bouton Retour */
.btn-back {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
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

/* Header avec bouton retour à gauche et onglets centrés */
.page-header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 38px;
    margin-bottom: 38px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    position: relative;
}

/* Onglets centrés */
.tabs-container-header {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    padding: 0.3rem;
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
}
.tab-btn-header {
    padding: 0.5rem 1.2rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
.tab-btn-header:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-1px);
}
.tab-btn-header.active {
    background: white;
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.tab-btn-header.active:hover {
    transform: none;
}

/* Bouton Voir Plus - conservé pour les autres onglets */
.btn-view-more {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    width: auto;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.btn-view-more:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}
.btn-view-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 0;
    margin-bottom: 0;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 30px;
    margin-bottom: 20px;
}
.pagination-btn {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #374151;
    font-size: 1.2rem;
}
.pagination-btn:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: scale(1.05);
}
.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.pagination-info {
    font-size: 0.9rem;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
}

/* Conteneur blanc glass pour les cartes + agenda (réutilisé) */
.glass-container {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    padding: 20px;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Layout principal - les cartes à gauche et le calendrier à droite */
.main-layout {
    display: flex;
    gap: 30px;
    align-items: flex-start;
}
.cards-container {
    flex: 2;
    min-width: 0;
    position: relative;
}
.calendar-container {
    flex: 1;
    min-width: 350px;
    max-width: 400px;
    position: sticky;
    top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* Scroller horizontal pour les cartes */
.horizontal-scroller {
    overflow-x: auto;
    overflow-y: visible;
    scroll-behavior: smooth;
    padding: 10px 5px 20px 5px;
    margin: 0 -10px;
}
.horizontal-scroller::-webkit-scrollbar {
    height: 8px;
}
.horizontal-scroller::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
}
.horizontal-scroller::-webkit-scrollbar-thumb {
    background: rgba(37, 99, 235, 0.3);
    border-radius: 10px;
}
.horizontal-scroller::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
}
.cards-wrapper {
    display: flex;
    gap: 25px;
    padding: 5px 10px;
}
.special-card {
    flex: 0 0 auto;
    width: 320px;
    background: white;
    padding: 25px;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: var(--transition);
    height: 100%;
    position: relative;
}
.special-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.special-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
}
.special-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}
.special-date {
    background: #ec4899;
    color: white;
    padding: 8px 16px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
}
.special-title {
    font-size: 1.4rem;
    color: #111827;
    margin-bottom: 15px;
    font-weight: 800;
    line-height: 1.2;
    padding-right: 35px;
}
.special-lieu {
    color: #6b7280;
    font-size: 1rem;
    margin-bottom: 15px;
    line-height: 1.6;
}
.special-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
}
.special-meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #374151;
}
.special-meta-label {
    font-weight: 600;
    color: #6b7280;
    min-width: 120px;
}

/* Styles pour le carrousel */
.carousel-simple {
    position: relative;
    width: 100%;
    margin-bottom: 2rem;
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.carousel-simple-wrapper {
    display: flex;
    min-height: 500px;
}

.carousel-simple-image {
    flex: 0 0 70%;
    position: relative;
    overflow: hidden;
}

.carousel-simple-image-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
}
.carousel-simple-image-bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
}

.carousel-simple-info {
    flex: 0 0 30%;
    background: white;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    position: relative;
    z-index: 2;
}

.carousel-simple-header {
    font-size: 1.2rem;
    font-weight: 800;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
}

.carousel-simple-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.75rem;
    line-height: 1.3;
}

.carousel-simple-description {
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.carousel-simple-date {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.7rem;
    color: #9ca3af;
}

.carousel-simple-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 1.5rem;
    transition: all 0.2s;
    z-index: 10;
}
.carousel-simple-nav:hover {
    background: rgba(0, 0, 0, 0.7);
}
.carousel-simple-nav-left {
    left: 15px;
}
.carousel-simple-nav-right {
    right: 15px;
}
.carousel-simple-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
}
.carousel-simple-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}
.carousel-simple-dot.active {
    width: 20px;
    border-radius: 4px;
    background: white;
}

/* Mini Calendar */
.mini-calendar {
    background: white;
    color: #1f2937;
    padding: 25px;
    border-radius: 20px;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255,255,255,0.6);
    width: 100%;
}
.cal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.cal-month-year {
    font-weight: 800;
    color: var(--primary);
    font-size: 1.1rem;
    letter-spacing: 1px;
}
.cal-nav-btn {
    background: rgba(37, 99, 235, 0.1);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary);
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.cal-nav-btn:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.05);
}
.cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    text-align: center;
}
.cal-day-label {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 700;
    padding-bottom: 10px;
    text-transform: uppercase;
}
.cal-day {
    font-size: 0.9rem;
    padding: 8px 0;
    border-radius: 8px;
    color: #1f2937;
    transition: all 0.2s;
    cursor: default;
    font-weight: 600;
    position: relative;
}
.cal-day:hover:not(.empty) {
    background: #f3f4f6;
}
.cal-day.today {
    background-color: var(--primary);
    color: white;
    font-weight: 800;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}
.cal-day.has-event {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--warning);
    border: 1px solid rgba(245, 158, 11, 0.3);
    position: relative;
    cursor: pointer;
}
.cal-day.has-event::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: var(--warning);
    border-radius: 50%;
}
.cal-day.has-event:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.02);
}
.cal-day .tooltip {
    visibility: hidden;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 500;
    white-space: nowrap;
    z-index: 100;
    margin-bottom: 8px;
    pointer-events: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.cal-day .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
}
.cal-day.has-event:hover .tooltip {
    visibility: visible;
}
.cal-day.empty {
    background: transparent;
}
.cal-day.active-selected {
    background-color: #f59e0b;
    color: white;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
.cal-day.active-selected::after {
    background: white;
}

/* Empty Dialog */
.empty-dialog {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    padding: 48px 32px;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    margin: 20px 0;
    position: relative;
    overflow: hidden;
    animation: float 3s ease-in-out infinite;
}
.empty-dialog-icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
}
.empty-dialog-title {
    font-size: 1.8rem;
    font-weight: 800;
    color: white;
    margin-bottom: 0.75rem;
}
.empty-dialog-message {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
}

/* Modal Past Event */
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
.modal-content {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    width: 95%;
    max-width: 800px;
    max-height: 90vh;
    border-radius: 1.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.5);
}
.modal-content-media {
    max-width: 900px;
}
.modal-content-media .modal-body {
    padding: 0;
}
@keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
.modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h2 {
    font-weight: 700;
    font-size: 1.5rem;
    margin: 0;
    color: white;
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
}
.modal-header button:hover {
    background: #f3f4f6;
    transform: scale(1.1);
}
.modal-body {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
}
.modal-footer {
    padding: 1rem 2rem;
    border-top: 1px solid rgba(229, 231, 235, 0.5);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}
.btn-cancel {
    background: white;
    color: #6b7280;
    border: 2px solid #e2e8f0;
    padding: 12px 24px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
}
.btn-cancel:hover {
    background: #f1f5f9;
    color: #111827;
    border-color: #cbd5e1;
}

/* Media Viewer */
.media-viewer {
    width: 100%;
    position: relative;
}
.media-viewer img, .media-viewer video {
    width: 100%;
    max-height: 70vh;
    object-fit: contain;
}
.media-viewer-info {
    padding: 1rem;
    background: white;
}
.media-viewer-nav {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 20;
}
.media-viewer-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}
.media-viewer-nav-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-50%) scale(1.1);
}
.media-viewer-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
.media-viewer-prev {
    left: 20px;
}
.media-viewer-next {
    right: 20px;
}
.media-viewer-counter {
    position: absolute;
    bottom: 80px;
    right: 20px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    padding: 6px 12px;
    border-radius: 20px;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 20;
}

/* Past Event Modal */
.past-event-modal .modal-content {
    max-width: 800px;
}
.past-event-media {
    margin-top: 1rem;
}
.past-event-media h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.75rem;
}
.media-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 0.5rem;
}
.media-gallery-item {
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
    background: #f3f4f6;
}
.media-gallery-item:hover {
    transform: scale(1.02);
}
.media-gallery-item img,
.media-gallery-item video {
    width: 100%;
    height: 120px;
    object-fit: cover;
}
.no-media {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    background: #f9fafb;
    border-radius: 12px;
}
.past-event-item {
    margin-bottom: 2rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
}
.past-event-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

/* Action Bar */
.action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef2ff;
}
.action-bar h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}
.action-bar .badge-count {
    background: linear-gradient(135deg, #ec4899, #8b5cf6);
    color: white;
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-left: 12px;
}
.action-buttons {
    display: flex;
    gap: 1rem;
}

/* History Cards */
.history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 25px;
    padding: 10px;
}

.history-card-v2 {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    transition: var(--transition);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.05);
}
.history-card-v2:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.15);
}

.history-card-v2-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    padding: 20px;
    color: white;
    position: relative;
}
.history-card-v2-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #f59e0b, #ec4899);
}

.history-card-v2-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.3;
}

.history-card-v2-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    opacity: 0.9;
}

.history-card-v2-body {
    padding: 20px;
}

.history-card-v2-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.history-card-v2-info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: #4b5563;
}

.history-card-v2-info-icon {
    width: 18px;
    height: 18px;
    color: #9ca3af;
    flex-shrink: 0;
}

.history-card-v2-info-label {
    font-weight: 600;
    color: #6b7280;
    min-width: 85px;
}

.history-card-v2-info-value {
    color: #374151;
    word-break: break-word;
}

.history-card-v2-footer {
    padding: 15px 20px;
    background: #f9fafb;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.history-card-v2-badge {
    background: #e5e7eb;
    color: #4b5563;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
}

.history-card-v2-media-badge {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 28px;
    backdrop-filter: blur(10px);
}
.empty-icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
}
.empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.75rem;
}
.empty-message {
    color: #6b7280;
    font-size: 1rem;
}

/* Gallery Filters */
.gallery-filters {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.gallery-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
}

.gallery-filter-select {
    flex: 1;
    min-width: 150px;
    padding: 10px 15px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
}

.gallery-filter-select:focus {
    outline: none;
    border-color: var(--primary);
}

.filter-input {
    flex: 2;
    padding: 10px 15px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.9rem;
    background: white;
}

.filter-input:focus {
    outline: none;
    border-color: var(--primary);
}

.btn-clear {
    background: #6b7280;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-clear:hover {
    background: #4b5563;
}

.gallery-filter-stats {
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    text-align: right;
}

/* Gallery Groups */
.gallery-section {
    margin-bottom: 2rem;
}

/* Section activité en blanc */
.gallery-group {
    margin-bottom: 2rem;
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
}

/* Titre de l'activité en bleu */
.gallery-group-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
}

.gallery-group-date {
    font-size: 0.8rem;
    font-weight: 500;
    color: #6b7280;
}

/* Navigation dans la galerie - flèches gauche/droite */
.gallery-nav {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 15px;
}
.gallery-nav-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #374151;
}
.gallery-nav-btn:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    transform: scale(1.05);
}
.gallery-nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Conteneur de défilement horizontal pour les médias */
.gallery-scroll-container {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding: 10px 5px;
}
.gallery-scroll-container::-webkit-scrollbar {
    height: 6px;
}
.gallery-scroll-container::-webkit-scrollbar-track {
    background: #e5e7eb;
    border-radius: 10px;
}
.gallery-scroll-container::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 10px;
}
.gallery-group-grid-scroll {
    display: flex;
    gap: 16px;
    padding: 5px;
    min-width: min-content;
}

/* Media Cards - Version défilante avec taille corrigée */
.media-card-wrapper {
    position: relative;
    width: 220px;
    flex-shrink: 0;
}

.media-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: var(--transition);
    cursor: pointer;
    position: relative;
}
.media-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.media-thumbnail {
    position: relative;
    height: 160px;
    overflow: hidden;
    background: #f3f4f6;
}
.media-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.media-card:hover .media-thumbnail img {
    transform: scale(1.05);
}
.media-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.media-card:hover .media-play-icon {
    opacity: 1;
}
.media-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
}
.media-info {
    padding: 12px;
    background: white;
}
.media-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.media-date {
    font-size: 0.7rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Responsive */
@media (max-width: 900px) {
    .main-layout { flex-direction: column; }
    .cards-container { flex: auto; width: 100%; }
    .calendar-container { width: 100%; max-width: 100%; position: static; justify-content: center; }
    .glass-container { padding: 15px; }
    .page-header-wrapper { flex-direction: column; align-items: stretch; position: relative; margin-top: 20px; margin-bottom: 20px; }
    .btn-back { width: auto; justify-content: center; margin-bottom: 0.5rem; }
    .tabs-container-header { position: relative; left: 0; transform: none; justify-content: center; width: 100%; }
    .history-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
    .carousel-simple-wrapper {
        flex-direction: column;
        min-height: auto;
    }
    .carousel-simple-image {
        flex: 0 0 auto;
        min-height: 300px;
    }
    .carousel-simple-info {
        flex: 0 0 auto;
        padding: 1.2rem;
    }
    .media-gallery {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    .gallery-filter-group {
        flex-direction: column;
    }
    .gallery-filter-select, .filter-input {
        width: 100%;
    }
    .gallery-group-title {
        flex-direction: column;
        align-items: flex-start;
    }
    .media-card-wrapper {
        width: 200px;
    }
    .media-thumbnail {
        height: 140px;
    }
}

@media (max-width: 600px) {
    .action-bar { flex-direction: column; gap: 1rem; text-align: center; }
    .action-bar h2 { font-size: 1.3rem; }
    .empty-dialog { padding: 32px 24px; }
    .empty-dialog-title { font-size: 1.4rem; }
    .empty-dialog-icon { font-size: 3.5rem; }
    .tab-btn-header { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
    .special-card { width: 280px; padding: 20px; }
    .special-title { font-size: 1.2rem; }
    .btn-view-more { width: 100%; justify-content: center; }
    .history-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    .media-gallery {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
    .media-gallery-item img,
    .media-gallery-item video {
        height: 80px;
    }
    .media-viewer-nav-btn {
        width: 36px;
        height: 36px;
        font-size: 1.5rem;
    }
    .media-viewer-prev {
        left: 10px;
    }
    .media-viewer-next {
        right: 10px;
    }
    .media-viewer-counter {
        bottom: 70px;
        right: 10px;
        font-size: 0.75rem;
        padding: 4px 8px;
    }
    .media-card-wrapper {
        width: 170px;
    }
    .media-thumbnail {
        height: 120px;
    }
    .media-title {
        font-size: 0.8rem;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .history-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1025px) {
    .history-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
`;

// --- ICONS ---
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const IconClock = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconUser = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const IconLocation = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
const IconArrowLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const IconArrowRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const IconMic = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>);
const IconActivity = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>);
const IconHistory = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M4 4L8 8M20 4L16 8M4 20L8 16M20 20L16 16"></path></svg>);
const IconRoadmap = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>);
const IconGallery = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const IconPlay = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const IconPhoto = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);
const IconVideo = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>);
const IconChevronLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const IconChevronRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);

// --- FONCTION DE FORMATAGE DE DATE CORRIGÉE ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateFrench = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} ${monthCapitalized} ${year}`;
};

// --- FONCTIONS DE FILTRAGE ---
const isDateInCurrentMonth = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isDateInPastMonth = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

// --- CAROUSEL COMPONENT ---
const HeroCarousel = ({ mediaImages }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayIntervalRef = useRef(null);

  const defaultSlides = [
    { id: 1, image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&h=500&fit=crop', title: 'Bienvenue', description: 'Consultez les activités de votre classe', date: new Date().toISOString() },
    { id: 2, image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab61?w=1200&h=500&fit=crop', title: 'Programmes', description: 'Découvrez les activités à venir', date: new Date().toISOString() },
    { id: 3, image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=500&fit=crop', title: 'Galerie', description: 'Revivez les moments forts', date: new Date().toISOString() },
  ];

  const slides = mediaImages?.length > 0 ? mediaImages.slice(0, 5).map(media => ({
    id: media.id,
    image: media.type === 'video' ? (media.thumbnail || 'https://placehold.co/400x300/2563eb/white?text=Vid%C3%A9o') : media.url,
    title: media.title || 'Activité',
    description: media.description || 'Moment de partage',
    date: media.date,
  })) : defaultSlides;

  const startAutoPlay = () => {
    if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    autoPlayIntervalRef.current = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
  };

  useEffect(() => {
    if (isAutoPlaying && slides.length > 0) startAutoPlay();
    return () => { if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current); };
  }, [isAutoPlaying, slides.length]);

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];
  const formattedDate = formatDateFrench(currentSlideData.date);

  return (
    <div className="carousel-simple" onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}>
      <div className="carousel-simple-wrapper">
        <div className="carousel-simple-image">
          <div className="carousel-simple-image-bg" style={{ backgroundImage: `url(${currentSlideData.image})` }} />
        </div>
        <div className="carousel-simple-info">
          <div className="carousel-simple-header">ACTIVITÉS RÉCENTES</div>
          <h3 className="carousel-simple-title">{currentSlideData.title}</h3>
          <p className="carousel-simple-description">{currentSlideData.description}</p>
          <div className="carousel-simple-date"><IconCalendar /> {formattedDate}</div>
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button className="carousel-simple-nav carousel-simple-nav-left" onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}>‹</button>
          <button className="carousel-simple-nav carousel-simple-nav-right" onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}>›</button>
          <div className="carousel-simple-dots">
            {slides.map((_, index) => (<button key={index} className={`carousel-simple-dot ${currentSlide === index ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} />))}
          </div>
        </>
      )}
    </div>
  );
};

// --- MINI CALENDAR COMPONENT CORRIGÉ ---
const MiniCalendar = ({ eventsDates = [], eventsData = [], onDateClick, activeDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startPadding = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
    for (let i = startPadding; i > 0; i--) days.push({ date: new Date(year, month, -i + 1), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  };

  const getEventsOnDate = (date) => {
    const localDateStr = getLocalDateString(date);
    return eventsData.filter(event => getLocalDateString(event.date) === localDateStr);
  };

  const hasEventOnDate = (date) => {
    const localDateStr = getLocalDateString(date);
    return eventsDates.includes(localDateStr);
  };
  
  const getEventTitles = (date) => {
    const events = getEventsOnDate(date);
    if (events.length === 0) return '';
    if (events.length === 1) return events[0].title;
    return `${events[0].title} + ${events.length - 1} autre(s)`;
  };

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const isActiveDate = (date) => {
    if (!activeDate) return false;
    return getLocalDateString(date) === getLocalDateString(activeDate);
  };

  const isToday = (date) => {
    return getLocalDateString(date) === getLocalDateString(today);
  };

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>‹</button>
        <span className="cal-month-year">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button className="cal-nav-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {daysOfWeek.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {days.map((day, idx) => {
          const hasEvent = hasEventOnDate(day.date);
          const eventTitles = getEventTitles(day.date);
          const isTodayDate = isToday(day.date);
          const isActive = isActiveDate(day.date);
          return (
            <div 
              key={idx} 
              className={`cal-day ${!day.isCurrentMonth ? 'empty' : ''} ${isTodayDate ? 'today' : ''} ${hasEvent && day.isCurrentMonth ? 'has-event' : ''} ${isActive && day.isCurrentMonth ? 'active-selected' : ''}`}
              onClick={() => day.isCurrentMonth && onDateClick && onDateClick(day.date)}
            >
              {day.date.getDate()}
              {hasEvent && day.isCurrentMonth && eventTitles && <span className="tooltip">{eventTitles}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- PAST EVENT CONTENT MODAL CORRIGÉ ---
const PastEventContentModal = ({ isOpen, onClose, date, events, mediaData }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentMediaList, setCurrentMediaList] = useState([]);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

  if (!isOpen || !date) return null;

  const dateStr = getLocalDateString(date);
  const eventsOnDate = events.filter(event => getLocalDateString(event.date) === dateStr);
  const eventIds = eventsOnDate.map(e => e.id);
  const relatedMedia = mediaData.filter(media => media.special_event_id && eventIds.includes(media.special_event_id));
  const generalMedia = mediaData.filter(media => !media.special_event_id && getLocalDateString(media.date) === dateStr);
  const formattedDate = formatDateFrench(date);

  const openMediaViewer = (media, mediaArray) => {
    const index = mediaArray.findIndex(m => m.id === media.id);
    setCurrentMediaList(mediaArray);
    setCurrentMediaIndex(index);
    setSelectedMedia(media);
    setIsMediaViewerOpen(true);
  };

  const handleNavigateMedia = (newIndex) => {
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(currentMediaList[newIndex]);
  };

  const closeMediaViewer = () => {
    setIsMediaViewerOpen(false);
    setSelectedMedia(null);
    setCurrentMediaList([]);
    setCurrentMediaIndex(0);
  };

  return (
    <>
      <div className="modal-overlay past-event-modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>📅 {formattedDate}</h2><button onClick={onClose}>✕</button></div>
          <div className="modal-body">
            {eventsOnDate.length === 0 && generalMedia.length === 0 ? (
              <div className="no-media"><p>Aucune activité programmée et aucun média à cette date.</p></div>
            ) : (
              <>
                {eventsOnDate.map(event => {
                  const eventMedia = relatedMedia.filter(m => m.special_event_id === event.id);
                  return (
                    <div key={event.id} className="past-event-item">
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{event.title}</h3>
                      {event.time && <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.85rem' }}><IconClock /> {event.time.substring(0, 5)}</p>}
                      {event.lieu && <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.85rem' }}><IconLocation /> {event.lieu}</p>}
                      {event.orateur && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}><strong>Orateur :</strong> {event.orateur}</p>}
                      {event.moderateur && <p style={{ fontSize: '0.85rem' }}><strong>Modérateur :</strong> {event.moderateur}</p>}
                      {event.famille_reception && <p style={{ fontSize: '0.85rem' }}><strong>Famille de réception :</strong> {event.famille_reception}</p>}
                      {eventMedia.length > 0 && (
                        <div className="past-event-media">
                          <h4>Médias associés</h4>
                          <div className="media-gallery">
                            {eventMedia.map(media => (
                              <div key={media.id} className="media-gallery-item" onClick={() => openMediaViewer(media, eventMedia)}>
                                {media.type === 'video' ? <video src={media.url} style={{ pointerEvents: 'none' }} /> : <img src={media.url} alt={media.title} />}
                                <div style={{ padding: '6px', fontSize: '0.7rem', textAlign: 'center', background: 'white' }}>{media.title.length > 20 ? media.title.substring(0, 20) + '...' : media.title}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {generalMedia.length > 0 && (
                  <div className="past-event-media">
                    <h4>📸 Médias du jour</h4>
                    <div className="media-gallery">
                      {generalMedia.map(media => (
                        <div key={media.id} className="media-gallery-item" onClick={() => openMediaViewer(media, generalMedia)}>
                          {media.type === 'video' ? <video src={media.url} style={{ pointerEvents: 'none' }} /> : <img src={media.url} alt={media.title} />}
                          <div style={{ padding: '6px', fontSize: '0.7rem', textAlign: 'center', background: 'white' }}>{media.title.length > 20 ? media.title.substring(0, 20) + '...' : media.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer"><button className="btn-cancel" onClick={onClose}>Fermer</button></div>
        </div>
      </div>
      <MediaViewerModal 
        isOpen={isMediaViewerOpen} 
        onClose={closeMediaViewer} 
        media={selectedMedia}
        mediaList={currentMediaList}
        currentIndex={currentMediaIndex}
        onNavigate={handleNavigateMedia}
      />
    </>
  );
};

// --- MEDIA VIEWER MODAL AVEC SUPPORT YOUTUBE, VIMEO ---
const MediaViewerModal = ({ isOpen, onClose, media, mediaList = [], currentIndex = 0, onNavigate }) => {
  if (!isOpen || !media) return null;

  const handlePrevious = () => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (onNavigate && currentIndex < mediaList.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const currentMedia = mediaList[currentIndex] || media;

  // Extraire l'ID YouTube de l'URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  // Extraire l'ID Vimeo de l'URL
  const getVimeoEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regex);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  // Obtenir l'URL embed pour la vidéo
  const getEmbedUrl = (url) => {
    if (!url) return null;
    return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url) || url;
  };

  const embedUrl = getEmbedUrl(currentMedia.video_url || currentMedia.url);
  
  const getPlatformName = (url) => {
    if (!url) return 'la plateforme';
    if (url.includes('youtube')) return 'YouTube';
    if (url.includes('vimeo')) return 'Vimeo';
    return 'la plateforme';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-media" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{currentMedia.title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="media-viewer">
            {currentMedia.type === 'video' ? (
              embedUrl && (embedUrl.includes('youtube') || embedUrl.includes('vimeo')) ? (
                <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={embedUrl}
                    title={currentMedia.title}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-100 rounded-lg cursor-pointer" onClick={() => window.open(currentMedia.video_url || currentMedia.url, '_blank')}>
                  <img 
                    src={currentMedia.thumbnail || '/default-video-thumb.jpg'} 
                    alt={currentMedia.title} 
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Regarder sur {getPlatformName(currentMedia.video_url || currentMedia.url)}
                  </div>
                </div>
              )
            ) : (
              <img src={currentMedia.url} alt={currentMedia.title} className="max-h-[70vh] mx-auto object-contain" />
            )}
            
            {mediaList.length > 1 && (
              <div className="media-viewer-nav">
                <button 
                  className="media-viewer-nav-btn media-viewer-prev" 
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  ‹
                </button>
                <button 
                  className="media-viewer-nav-btn media-viewer-next" 
                  onClick={handleNext}
                  disabled={currentIndex === mediaList.length - 1}
                >
                  ›
                </button>
              </div>
            )}
            
            {mediaList.length > 1 && (
              <div className="media-viewer-counter">
                {currentIndex + 1} / {mediaList.length}
              </div>
            )}
            
            <div className="media-viewer-info">
              <p><strong>Date:</strong> {formatDateFrench(currentMedia.date)}</p>
              {currentMedia.description && <p><strong>Description:</strong> {currentMedia.description}</p>}
              {currentMedia.type === 'video' && (currentMedia.video_url || currentMedia.url) && (
                <p className="text-blue-600 text-sm mt-2">
                  <a href={currentMedia.video_url || currentMedia.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    🔗 Ouvrir sur {getPlatformName(currentMedia.video_url || currentMedia.url)}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de navigation pour le défilement horizontal
const GalleryScrollNav = ({ onScrollLeft, onScrollRight, hasLeftScroll, hasRightScroll }) => {
  return (
    <div className="gallery-nav">
      <button className="gallery-nav-btn" onClick={onScrollLeft} disabled={!hasLeftScroll}>
        <IconChevronLeft />
      </button>
      <button className="gallery-nav-btn" onClick={onScrollRight} disabled={!hasRightScroll}>
        <IconChevronRight />
      </button>
    </div>
  );
};

// Composant de pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="pagination">
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>
      <span className="pagination-info">
        Page {currentPage} sur {totalPages}
      </span>
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </div>
  );
};

// --- MAIN PAGE ---
export default function Programmes() {
  const { props } = usePage();
  const { initialClassList = [], initialClassHistory = [], galleryMedia = [] } = props;

  const [activeTab, setActiveTab] = useState('programmes');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentMediaList, setCurrentMediaList] = useState([]);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [mediaData] = useState(galleryMedia || []);
  const [isDateContentModalOpen, setIsDateContentModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeCalendarDate, setActiveCalendarDate] = useState(null);
  const [galleryFilter, setGalleryFilter] = useState({ search: '', month: '', year: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const scrollRefs = useRef({});

  // Filtrer les événements pour n'afficher que ceux du mois en cours
  const currentMonthEvents = initialClassList.filter(event => isDateInCurrentMonth(event.date));
  const pastEvents = initialClassHistory.filter(event => isDateInPastMonth(event.date));
  const allEvents = [...currentMonthEvents, ...pastEvents];
  const allEventsData = [...currentMonthEvents, ...pastEvents];

  const getFilteredEventsByActiveDate = () => {
    if (!activeCalendarDate) return currentMonthEvents;
    const activeDateStr = activeCalendarDate.toISOString().split('T')[0];
    return currentMonthEvents.filter(event => {
      const eventDateStr = new Date(event.date).toISOString().split('T')[0];
      return eventDateStr === activeDateStr;
    });
  };

  const filteredEvents = getFilteredEventsByActiveDate();

  // Récupérer les années disponibles pour les filtres de la galerie
  const galleryAvailableMonths = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const galleryAvailableYears = useMemo(() => {
    const years = mediaData.map(m => new Date(m.date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [mediaData]);

  // Filtrer les médias pour la galerie
  const filteredGalleryMedia = useMemo(() => {
    let filtered = [...mediaData];
    
    if (galleryFilter.search !== '') {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(galleryFilter.search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(galleryFilter.search.toLowerCase()))
      );
    }
    
    if (galleryFilter.month !== '') {
      filtered = filtered.filter(m => {
        const month = new Date(m.date).toLocaleString('fr-FR', { month: 'long' });
        const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
        return monthCapitalized === galleryFilter.month;
      });
    }
    
    if (galleryFilter.year !== '') {
      filtered = filtered.filter(m => new Date(m.date).getFullYear() === parseInt(galleryFilter.year));
    }
    
    return filtered;
  }, [mediaData, galleryFilter]);

  // Grouper les médias par activité après filtrage - CLASSEMENT IMAGES À GAUCHE, VIDÉOS À DROITE
  const groupedGalleryMedia = useMemo(() => {
    const groups = [];
    const mediaByActivity = new Map();
    
    filteredGalleryMedia.forEach(media => {
      const key = media.special_event_id || 'without_event';
      if (!mediaByActivity.has(key)) {
        mediaByActivity.set(key, []);
      }
      mediaByActivity.get(key).push(media);
    });
    
    for (const [activityId, medias] of mediaByActivity) {
      let activity = null;
      if (activityId !== 'without_event') {
        activity = allEvents.find(e => e.id === activityId);
      }
      
      // Séparer les images et les vidéos
      const images = medias.filter(m => m.type === 'photo');
      const videos = medias.filter(m => m.type === 'video');
      
      // Trier chaque catégorie par date décroissante
      const sortedImages = images.sort((a, b) => new Date(b.date) - new Date(a.date));
      const sortedVideos = videos.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Concaténer : images d'abord, puis vidéos
      const sortedMedias = [...sortedImages, ...sortedVideos];
      
      groups.push({
        id: activityId,
        title: activity ? activity.title : 'Sans activité associée',
        date: activity ? activity.date : null,
        medias: sortedMedias,
        imagesCount: sortedImages.length,
        videosCount: sortedVideos.length
      });
    }
    
    return groups.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
  }, [filteredGalleryMedia, allEvents]);

  // Pagination des groupes
  const totalPages = Math.ceil(groupedGalleryMedia.length / itemsPerPage);
  const paginatedGroups = groupedGalleryMedia.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [galleryFilter]);

  const getAllEventDates = () => allEvents.map(event => new Date(event.date).toISOString().split('T')[0]);
  
  const handleDateClick = (date) => { 
    setActiveCalendarDate(date);
    setSelectedDate(date); 
    setIsDateContentModalOpen(true); 
  };
  
  const handleHistoricalCardClick = (event) => { 
    setSelectedDate(new Date(event.date)); 
    setIsDateContentModalOpen(true); 
  };
  
  const closeDateContentModal = () => { 
    setIsDateContentModalOpen(false); 
    setSelectedDate(null);
  };
  
  const handleClearDateFilter = () => setActiveCalendarDate(null);
  
  const openMediaViewer = (media, mediaArray = null) => {
    const list = mediaArray || mediaData;
    const index = list.findIndex(m => m.id === media.id);
    setCurrentMediaList(list);
    setCurrentMediaIndex(index >= 0 ? index : 0);
    setSelectedMedia(media);
    setIsMediaViewerOpen(true);
  };
  
  const handleNavigateMedia = (newIndex) => {
    if (currentMediaList[newIndex]) {
      setCurrentMediaIndex(newIndex);
      setSelectedMedia(currentMediaList[newIndex]);
    }
  };
  
  const closeMediaViewer = () => { 
    setIsMediaViewerOpen(false); 
    setSelectedMedia(null);
    setCurrentMediaList([]);
    setCurrentMediaIndex(0);
  };

  const handleGoBack = () => router.visit('/responsable-famille/dashboard');
  const handleViewAllProgrammes = () => router.visit('/responsable-famille/programmes/all');
  const handleViewAllHistory = () => router.visit('/responsable-famille/programmes/history');
  const handleViewAllMedia = () => router.visit('/responsable-famille/galerie');

  // Fonctions de défilement horizontal pour chaque groupe
  const handleScrollLeft = (groupId) => {
    const container = scrollRefs.current[groupId];
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = (groupId) => {
    const container = scrollRefs.current[groupId];
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const checkScrollButtons = (groupId) => {
    const container = scrollRefs.current[groupId];
    if (!container) return { hasLeftScroll: false, hasRightScroll: false };
    const hasLeftScroll = container.scrollLeft > 0;
    const hasRightScroll = container.scrollLeft + container.clientWidth < container.scrollWidth - 10;
    return { hasLeftScroll, hasRightScroll };
  };

  const [scrollStates, setScrollStates] = useState({});

  const updateScrollState = (groupId) => {
    setScrollStates(prev => ({
      ...prev,
      [groupId]: checkScrollButtons(groupId)
    }));
  };

  useEffect(() => {
    const intervals = {};
    Object.keys(scrollRefs.current).forEach(groupId => {
      updateScrollState(groupId);
      intervals[groupId] = setInterval(() => updateScrollState(groupId), 500);
    });
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [paginatedGroups]);

  const renderContent = () => {
    switch (activeTab) {
      case 'programmes':
        const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
        const currentMonthCapitalized = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
        
        return (
          <>
            <HeroCarousel mediaImages={mediaData.filter(m => m.type === 'photo')} />
            
            <div className="action-bar">
              <h2>🔥 ACTIVITÉS EN COURS
                <span className="badge-count">
                  {filteredEvents.length} activité(s)
                  {!activeCalendarDate && ` - ${currentMonthCapitalized} ${new Date().getFullYear()}`}
                  {activeCalendarDate && ` - ${formatDateFrench(activeCalendarDate)}`}
                </span>
              </h2>
            </div>
            
            <div className="glass-container">
              <div className="main-layout">
                <div className="cards-container">
                  {filteredEvents.length > 0 ? (
                    <div className="horizontal-scroller">
                      <div className="cards-wrapper">
                        {filteredEvents.map(event => (
                          <div key={event.id} className="special-card">
                            <div>
                              <div className="special-header">
                                <span className="special-date">{formatDateFrench(event.date)}</span>
                              </div>
                              <h4 className="special-title">{event.title}</h4>
                              {event.lieu && <p className="special-lieu"><IconLocation /> {event.lieu}</p>}
                              {event.time && <p><IconClock /> {event.time.substring(0, 5)}</p>}
                              <div className="special-meta">
                                {event.orateur && <div><span className="special-meta-label">Orateur:</span> {event.orateur}</div>}
                                {event.moderateur && <div><span className="special-meta-label">Modérateur:</span> {event.moderateur}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyDialog />
                  )}
                </div>
                <div className="calendar-container">
                  <MiniCalendar 
                    eventsDates={getAllEventDates()} 
                    eventsData={allEventsData} 
                    onDateClick={handleDateClick}
                    activeDate={activeCalendarDate}
                  />
                </div>
              </div>
            </div>
            
            {currentMonthEvents.length > 0 && (
              <div className="btn-view-more-wrapper">
                <button className="btn-view-more" onClick={handleViewAllProgrammes}>
                  <IconEye /> Voir tout les programmes
                </button>
              </div>
            )}
          </>
        );
      case 'historique':
        // Prendre uniquement les 10 dernières activités
        const lastTenEvents = pastEvents.slice(0, 10);
        const currentYear = new Date().getFullYear();
        
        return (
          <>
            <div className="action-bar">
              <h2>📜 DERNIÈRES ACTIVITÉS</h2>
              <div className="action-buttons">
                <span className="badge-count">
                  {pastEvents.length} activité(s) - {currentYear}
                </span>
              </div>
            </div>
            <div className="glass-container">
              <div className="main-layout">
                <div className="cards-container">
                  {lastTenEvents.length > 0 ? (
                    <div className="history-grid">
                      {lastTenEvents.map(item => {
                        const eventMedia = mediaData.filter(media => media.special_event_id === item.id);
                        const hasMedia = eventMedia.length > 0;
                        
                        return (
                          <div key={item.id} className="history-card-v2" onClick={() => handleHistoricalCardClick(item)}>
                            <div className="history-card-v2-header">
                              <h3 className="history-card-v2-title">{item.title}</h3>
                              <div className="history-card-v2-date">
                                <IconCalendar />
                                {formatDateFrench(item.date)}
                                {item.time && (
                                  <>
                                    <span style={{ margin: '0 4px' }}>•</span>
                                    <IconClock />
                                    {item.time.substring(0, 5)}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="history-card-v2-body">
                              <div className="history-card-v2-info">
                                {item.lieu && (
                                  <div className="history-card-v2-info-item">
                                    <IconLocation className="history-card-v2-info-icon" />
                                    <span className="history-card-v2-info-label">Lieu :</span>
                                    <span className="history-card-v2-info-value">{item.lieu}</span>
                                  </div>
                                )}
                                {item.orateur && (
                                  <div className="history-card-v2-info-item">
                                    <IconMic className="history-card-v2-info-icon" />
                                    <span className="history-card-v2-info-label">Orateur :</span>
                                    <span className="history-card-v2-info-value">{item.orateur}</span>
                                  </div>
                                )}
                                {item.moderateur && (
                                  <div className="history-card-v2-info-item">
                                    <IconUser className="history-card-v2-info-icon" />
                                    <span className="history-card-v2-info-label">Modérateur :</span>
                                    <span className="history-card-v2-info-value">{item.moderateur}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="history-card-v2-footer">
                              <span className="history-card-v2-badge">
                                {new Date(item.date).getFullYear()}
                              </span>
                              {hasMedia && (
                                <span className="history-card-v2-media-badge">
                                  <IconGallery /> {eventMedia.length} média(s)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📜</div>
                      <div className="empty-title">Aucune activité récente</div>
                      <div className="empty-message">Aucune activité passée n'est disponible pour le moment.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {pastEvents.length > 10 && (
              <div className="btn-view-more-wrapper">
                <button className="btn-view-more" onClick={handleViewAllHistory}>
                  <IconEye /> Voir toute l'historique ({pastEvents.length - 10} activités supplémentaires)
                </button>
              </div>
            )}
          </>
        );
      case 'parcours':
        return (
          <>
            {/* Barre de filtres pour la galerie - sans titre */}
            <div className="gallery-filters">
              <div className="gallery-filter-group">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="🔍 Rechercher par titre, description ou activité..."
                  value={galleryFilter.search}
                  onChange={(e) => setGalleryFilter(prev => ({ ...prev, search: e.target.value }))}
                  style={{ flex: 2 }}
                />
                <select
                  className="gallery-filter-select"
                  value={galleryFilter.month}
                  onChange={(e) => setGalleryFilter(prev => ({ ...prev, month: e.target.value }))}
                >
                  <option value="">Tous les mois</option>
                  {galleryAvailableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  className="gallery-filter-select"
                  value={galleryFilter.year}
                  onChange={(e) => setGalleryFilter(prev => ({ ...prev, year: e.target.value }))}
                >
                  <option value="">Toutes les années</option>
                  {galleryAvailableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {(galleryFilter.search || galleryFilter.month || galleryFilter.year) && (
                  <button className="btn-clear" onClick={() => setGalleryFilter({ search: '', month: '', year: '' })}>
                    ✖ Réinitialiser
                  </button>
                )}
              </div>
              <div className="gallery-filter-stats">
                {filteredGalleryMedia.length} média(s) affiché(s) sur {mediaData.length} total
              </div>
            </div>

            <div className="glass-container">
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map(group => {
                  const scrollKey = group.id;
                  const scrollState = scrollStates[scrollKey] || { hasLeftScroll: false, hasRightScroll: false };
                  
                  return (
                    <div key={group.id} className="gallery-section">
                      <div className="gallery-group">
                        <div className="gallery-group-title">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                            <IconGallery />
                            {group.title}
                            {group.date && (
                              <span className="gallery-group-date">
                                <IconCalendar style={{ width: '12px', height: '12px', marginLeft: '10px' }} />
                                {formatDateFrench(group.date)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 ml-2">
                              📷 {group.imagesCount} | 🎬 {group.videosCount}
                            </span>
                          </div>
                        </div>
                        
                        {/* Navigation flèches gauche/droite */}
                        <GalleryScrollNav 
                          onScrollLeft={() => handleScrollLeft(scrollKey)}
                          onScrollRight={() => handleScrollRight(scrollKey)}
                          hasLeftScroll={scrollState.hasLeftScroll}
                          hasRightScroll={scrollState.hasRightScroll}
                        />
                        
                        {/* Conteneur de défilement horizontal */}
                        <div 
                          className="gallery-scroll-container"
                          ref={el => scrollRefs.current[scrollKey] = el}
                          onScroll={() => updateScrollState(scrollKey)}
                        >
                          <div className="gallery-group-grid-scroll">
                            {group.medias.map(media => (
                              <div key={media.id} className="media-card-wrapper">
                                <div className="media-card" onClick={() => openMediaViewer(media, group.medias)}>
                                  <div className="media-thumbnail">
                                    <img 
                                      src={media.type === 'video' ? (media.thumbnail || '/default-video-thumb.jpg') : media.url} 
                                      alt={media.title} 
                                    />
                                    {media.type === 'video' && (
                                      <div className="media-play-icon">
                                        <IconPlay />
                                      </div>
                                    )}
                                    <div className="media-badge">
                                      {media.type === 'video' ? <IconVideo /> : <IconPhoto />}
                                      {media.type === 'video' ? 'Vidéo' : 'Photo'}
                                    </div>
                                  </div>
                                  <div className="media-info">
                                    <h4 className="media-title">{media.title}</h4>
                                    <p className="media-date"><IconCalendar />{formatDateFrench(media.date)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ margin: 0 }}>
                  <div className="empty-icon">📸</div>
                  <div className="empty-title">Aucun média trouvé</div>
                  <div className="empty-message">
                    {mediaData.length === 0 
                      ? "Aucun média disponible pour le moment."
                      : "Aucun média ne correspond à vos critères de recherche."}
                  </div>
                  {mediaData.length > 0 && (
                    <button 
                      className="btn-clear" 
                      onClick={() => setGalleryFilter({ search: '', month: '', year: '' })} 
                      style={{ marginTop: '20px' }}
                    >
                      ✖ Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        );
      default: return null;
    }
  };

  const EmptyDialog = () => {
    const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
    const currentMonthCapitalized = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
    
    return (
      <div className="empty-dialog">
        <div className="empty-dialog-icon">📋</div>
        <div className="empty-dialog-title">✨ Programme de la classe</div>
        <div className="empty-dialog-message">
          {activeCalendarDate 
            ? `Aucun programme pour le ${formatDateFrench(activeCalendarDate)}.`
            : `Aucun programme pour le mois de ${currentMonthCapitalized} ${new Date().getFullYear()}.`}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title="Programme et Activités" />
      <style>{styles}</style>
      <MediaViewerModal 
        isOpen={isMediaViewerOpen} 
        onClose={closeMediaViewer} 
        media={selectedMedia}
        mediaList={currentMediaList}
        currentIndex={currentMediaIndex}
        onNavigate={handleNavigateMedia}
      />
      <PastEventContentModal isOpen={isDateContentModalOpen} onClose={closeDateContentModal} date={selectedDate} events={allEvents} mediaData={mediaData} />
      
      <div className="min-h-screen animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)", paddingBottom: '40px' }}>
        <main style={{ padding: '0 15px' }}>
          <div className="page-header-wrapper">
            <button className="btn-back" onClick={handleGoBack}><IconArrowLeft /> Retour</button>
            <div className="tabs-container-header">
              <button className={`tab-btn-header ${activeTab === 'programmes' ? 'active' : ''}`} onClick={() => setActiveTab('programmes')}><IconActivity /> Programmes</button>
              <button className={`tab-btn-header ${activeTab === 'historique' ? 'active' : ''}`} onClick={() => setActiveTab('historique')}><IconHistory /> Historique</button>
              <button className={`tab-btn-header ${activeTab === 'parcours' ? 'active' : ''}`} onClick={() => setActiveTab('parcours')}><IconRoadmap /> Galerie</button>
            </div>
          </div>
          {renderContent()}
        </main>
      </div>
    </>
  );
}