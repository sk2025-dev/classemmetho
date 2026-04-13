import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';

// Configuration d'axios avec le token CSRF
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

// --- STYLES INTÉGRÉS ---
const styles = `
:root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --success: #16a34a;
    --danger: #dc2626;
    --warning: #ca8a04;
    --orange: #f59e0b;
    --orange-hover: #d97706;
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
@keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
}
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* Toast Notification */
.toast-notification {
    position: fixed;
    top: 20px;
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
.toast-info {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
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

/* Global buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    gap: 0.5rem;
}
.btn-primary {
    background-color: var(--primary);
    color: white;
}
.btn-primary:hover {
    background-color: var(--primary-hover);
}
.btn-success {
    background-color: var(--success);
    color: white;
}
.btn-success:hover {
    background-color: #15803d;
}
.btn-secondary {
    background-color: white;
    border-color: #d1d5db;
    color: #111827;
}
.btn-secondary:hover {
    background-color: #f3f4f6;
}
.btn-view {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
}
.btn-view:hover {
    background-color: #dbeafe;
}
.btn-icon {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(0,0,0,0.1);
    cursor: pointer;
    transition: all 0.2s;
}
.btn-icon:hover {
    transform: translateY(-1px);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

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

/* Bouton Voir tout les programmes */
.btn-view-all {
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
.btn-view-all:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}
.btn-view-all-wrapper {
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

/* Bouton d'édition sur la carte */
.edit-btn-card {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
    z-index: 10;
}
.edit-btn-card:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* Media Cards - Version grille */
.media-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: var(--transition);
    cursor: pointer;
    position: relative;
}
.media-card.selected {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
.media-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.media-thumbnail {
    position: relative;
    height: 180px;
    overflow: hidden;
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
    font-size: 0.9rem;
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
.media-checkbox {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 20;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.media-checkbox input {
    width: 100%;
    height: 100%;
    cursor: pointer;
    margin: 0;
    opacity: 0;
    position: absolute;
}
.media-checkbox .checkbox-custom {
    width: 20px;
    height: 20px;
    background: white;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}
.media-checkbox .checkbox-custom.checked {
    background: #3b82f6;
    border-color: #3b82f6;
}
.media-checkbox .checkbox-custom.checked::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
}
.media-card-wrapper {
    position: relative;
    width: 200px;
    flex-shrink: 0;
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

.carousel-media-badge {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: white;
    z-index: 10;
    font-weight: 500;
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

/* Style pour la date du carrousel - taille agrandie */
.carousel-simple-date {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #4b5563;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
}

.carousel-simple-date svg {
    width: 18px;
    height: 18px;
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
    cursor: pointer;
    transition: all 0.3s ease;
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
.empty-dialog-button {
    background: white;
    color: #667eea;
    border: none;
    padding: 12px 28px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Confirmation Dialog Modal */
.confirm-dialog-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
}
.confirm-dialog {
    background: white;
    border-radius: 24px;
    width: 90%;
    max-width: 400px;
    overflow: hidden;
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.confirm-dialog-header {
    padding: 20px 24px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}
.confirm-dialog-header h3 {
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}
.confirm-dialog-body {
    padding: 24px;
    color: #374151;
}
.confirm-dialog-body p {
    margin-bottom: 8px;
}
.confirm-dialog-body .confirm-warning {
    color: #dc2626;
    font-size: 0.85rem;
    margin-top: 12px;
}
.confirm-dialog-footer {
    padding: 16px 24px;
    background: #f9fafb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
.confirm-dialog-footer .btn-confirm-cancel {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.confirm-dialog-footer .btn-confirm-cancel:hover {
    background: #4b5563;
}
.confirm-dialog-footer .btn-confirm-delete {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.confirm-dialog-footer .btn-confirm-delete:hover {
    background: #dc2626;
    transform: scale(1.02);
}

/* Modals */
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
.modal-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}
.modal-full {
    grid-column: span 2;
}
.form-group {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.input-icon {
    position: absolute;
    left: 14px;
    top: 42px;
    color: #9ca3af;
    width: 18px;
    height: 18px;
    pointer-events: none;
    z-index: 2;
}
input, select, textarea {
    padding: 14px 14px 14px 42px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    width: 100%;
    background: #f8fafc;
    transition: all 0.2s;
    color: #111827;
    font-weight: 500;
}
input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}
textarea {
    resize: vertical;
    min-height: 100px;
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
.btn-add {
    background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 28px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    display: flex;
    align-items: center;
    gap: 8px;
}
.btn-add:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}
.btn-add:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Style pour la liste des activités multiples */
.activities-list {
    margin-top: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
}
.activity-item {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    position: relative;
}
.activity-item:last-child {
    border-bottom: none;
}
.activity-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}
.activity-number {
    font-weight: 700;
    color: #667eea;
    font-size: 0.85rem;
}
.btn-remove-activity {
    background: #fee2e2;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ef4444;
    transition: all 0.2s;
}
.btn-remove-activity:hover {
    background: #fecaca;
    transform: scale(1.05);
}
.btn-add-activity {
    margin-top: 1rem;
    width: 100%;
    background: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 0.75rem;
    cursor: pointer;
    color: #64748b;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}
.btn-add-activity:hover {
    background: #e2e8f0;
    border-color: #667eea;
    color: #667eea;
}

/* Media Upload Area */
.media-upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f8fafc;
    margin-bottom: 1rem;
}
.media-upload-area:hover {
    border-color: var(--primary);
    background: #f1f5f9;
}
.media-type-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.media-type-btn {
    flex: 1;
    padding: 0.8rem;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
}
.media-type-btn.active {
    border-color: var(--primary);
    background: linear-gradient(135deg, var(--primary), #1d4ed8);
    color: white;
}
.files-preview-grid {
    margin-top: 1rem;
}
.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    margin-top: 0.5rem;
}
.preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
}
.preview-thumbnail {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
}
.preview-thumbnail img,
.preview-thumbnail video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.preview-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
    z-index: 10;
}
.preview-remove:hover {
    background: #ef4444;
    transform: scale(1.1);
}
.preview-filename {
    padding: 6px 8px;
    font-size: 0.7rem;
    color: #6b7280;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #f9fafb;
    margin: 0;
}

/* Import Modal */
.import-modal-content {
    max-width: 700px;
}
.import-area {
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f8fafc;
}
.import-area:hover {
    border-color: var(--primary);
    background: #f1f5f9;
}
.import-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}
.import-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
}
.import-subtitle {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 1rem;
}
.import-btn-select {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.file-input {
    display: none;
}
.file-info {
    margin-top: 1rem;
    padding: 12px;
    background: #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
}
.progress-bar {
    margin-top: 1rem;
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), #8b5cf6);
    transition: width 0.3s ease;
    border-radius: 4px;
}
.preview-table {
    margin-top: 1.5rem;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
}
.preview-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}
.preview-table th {
    background: #f1f5f9;
    padding: 10px;
    text-align: left;
    font-weight: 600;
    position: sticky;
    top: 0;
}
.preview-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
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
.btn-import {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
.btn-agenda {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
.btn-clear {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-clear:hover {
    background: #4b5563;
}

/* Styles pour les actions de groupe dans la galerie */
.group-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

/* Bouton Ajouter un contenu - JAUNE ORANGÉ */
.btn-add-media-group {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 5px;
}
.btn-add-media-group:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

/* Bouton Tout sélectionner - BLEU */
.btn-select-group {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 5px;
}
.btn-select-group:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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

/* Menu more-vert */
.more-menu-container {
    position: relative;
}
.more-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.more-btn:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
}
.more-menu {
    position: absolute;
    bottom: 35px;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 20;
    min-width: 150px;
    animation: fadeIn 0.2s ease;
}
.more-menu-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.85rem;
    color: #374151;
}
.more-menu-item:hover {
    background: #f3f4f6;
}
.more-menu-item.delete:hover {
    background: #fee2e2;
    color: #dc2626;
}
.more-menu-item.edit:hover {
    background: #e0e7ff;
    color: var(--primary);
}
.more-menu-item.featured:hover {
    background: #fef3c7;
    color: #d97706;
}

/* Styles pour les cartes d'historique */
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
    cursor: pointer;
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
    cursor: pointer;
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
    cursor: pointer;
}
.history-card-v2-media-badge:hover {
    background: linear-gradient(135deg, #5a67d8, #6b46c1);
    transform: scale(1.05);
}

/* Bouton Ajouter un contenu dans l'historique - JAUNE ORANGÉ */
.history-card-v2-add-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 5px;
}
.history-card-v2-add-btn:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
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

/* Styles pour la galerie avec groupes par activité */
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
    position: relative;
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

/* Barre d'actions de sélection dans le groupe */
.group-selection-bar {
    background: #f3f4f6;
    border-radius: 12px;
    padding: 10px 15px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
}
.group-selection-bar .selection-info {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.85rem;
}
.group-selection-bar .selection-actions {
    display: flex;
    gap: 10px;
}
.group-selection-bar .btn-selection-delete {
    background: #ef4444;
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}
.group-selection-bar .btn-cancel-selection {
    background: #6b7280;
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Filtres pour la galerie */
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

.gallery-filter-input {
    flex: 2;
    min-width: 200px;
    padding: 10px 15px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.9rem;
    background: white;
}

.gallery-filter-input:focus {
    outline: none;
    border-color: var(--primary);
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

.gallery-filter-stats {
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    text-align: right;
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
    .action-buttons { flex-direction: column; width: 100%; }
    .btn-agenda, .btn-import, .btn-select-mode { width: 100%; justify-content: center; }
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
    .gallery-filter-input, .gallery-filter-select {
        width: 100%;
    }
    .gallery-group-title {
        flex-direction: column;
        align-items: flex-start;
    }
    .group-actions {
        width: 100%;
        justify-content: flex-start;
    }
    .group-selection-bar {
        flex-direction: column;
        text-align: center;
    }
}

@media (max-width: 600px) {
    .modal-form-grid { grid-template-columns: 1fr; }
    .modal-full { grid-column: auto; }
    .action-bar { flex-direction: column; gap: 1rem; text-align: center; }
    .action-bar h2 { font-size: 1.3rem; }
    .empty-dialog { padding: 32px 24px; }
    .empty-dialog-title { font-size: 1.4rem; }
    .empty-dialog-icon { font-size: 3.5rem; }
    .import-area { padding: 20px; }
    .tab-btn-header { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
    .special-card { width: 280px; padding: 20px; }
    .special-title { font-size: 1.2rem; }
    .toast-content { min-width: 250px; padding: 12px 20px; }
    .history-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
    .selection-actions {
        flex-wrap: wrap;
        justify-content: center;
    }
    .carousel-simple-image {
        min-height: 250px;
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
    .gallery-group-title {
        font-size: 0.95rem;
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
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const IconPlus = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const IconArchive = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>);
const IconArrowLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const IconArrowRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const IconMic = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>);
const IconFamily = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><path d="M17 3.5a4 4 0 0 1 0 7"></path><path d="M21 21v-2a4 4 0 0 0-3-3.85"></path></svg>);
const IconLocation = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
const IconUpload = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
const IconFileExcel = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 14l4 4m0-4l-4 4"></path></svg>);
const IconRoadmap = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>);
const IconHistory = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M4 4L8 8M20 4L16 8M4 20L8 16M20 20L16 16"></path></svg>);
const IconActivity = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const IconPlay = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const IconPhoto = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);
const IconVideo = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>);
const IconCheckCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const IconXCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>);
const IconInfo = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconPray = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>);
const IconGallery = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);
const IconMoreVert = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>);
const IconChevronLeft = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const IconChevronRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);
const IconTrash2 = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const IconAlertTriangle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);
const IconStar = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

// --- FONCTIONS DE FORMATAGE DE DATE ---
const getLocalDateString = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateFrench = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
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

// --- TOAST COMPONENT ---
const Toast = ({ message, type = 'success', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <IconCheckCircle />;
      case 'error': return <IconXCircle />;
      default: return <IconInfo />;
    }
  };

  return (
    <div className={`toast-notification ${isExiting ? 'exit' : ''}`}>
      <div className={`toast-content toast-${type}`}>
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{message}</div>
        <div className="toast-close" onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}>✕</div>
      </div>
    </div>
  );
};

// --- CONFIRMATION DIALOG COMPONENT ---
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Supprimer", cancelText = "Annuler" }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3><IconTrash2 /> {title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
          <p className="confirm-warning">Cette action est irréversible.</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn-confirm-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CAROUSEL COMPONENT MODIFIÉ ---
const HeroCarousel = ({ mediaImages, pastEvents = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayIntervalRef = useRef(null);

  // Slides par défaut (si pas de médias)
  const defaultSlides = [
    { id: 1, image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&h=500&fit=crop', title: 'Bienvenue', description: 'Gérez les activités de votre classe', date: new Date().toISOString() },
    { id: 2, image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab61?w=1200&h=500&fit=crop', title: 'Programmes', description: 'Créez et organisez vos activités', date: new Date().toISOString() },
    { id: 3, image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=500&fit=crop', title: 'Galerie', description: 'Partagez vos moments forts', date: new Date().toISOString() },
  ];

  // Fonction pour obtenir l'image à la une ou la première photo
  const getActivityImage = (activityId) => {
    if (!mediaImages) return null;
    
    // Chercher d'abord une image à la une
    const featuredImage = mediaImages.find(media => 
      media.special_event_id === activityId && 
      media.type === 'photo' && 
      media.is_featured === true
    );
    
    if (featuredImage) return featuredImage.url;
    
    // Sinon, prendre la première photo
    const firstPhoto = mediaImages.find(media => 
      media.special_event_id === activityId && media.type === 'photo'
    );
    
    return firstPhoto ? firstPhoto.url : null;
  };

  // Construire les slides à partir des photos des 4 dernières activités PASSÉES
  const slides = useMemo(() => {
    // Vérifier si on a des activités passées
    if (!pastEvents || pastEvents.length === 0) {
      return defaultSlides;
    }
    
    // Trier les activités passées par date (les plus récentes d'abord) et prendre les 4 dernières
    const sortedPastEvents = [...pastEvents]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
    
    if (sortedPastEvents.length === 0) {
      return defaultSlides;
    }
    
    // Pour chaque activité, trouver la première photo
    const activitySlides = [];
    
    for (const activity of sortedPastEvents) {
      const activityImage = getActivityImage(activity.id);
      
      if (activityImage) {
        const hasFeaturedImage = mediaImages?.some(m => m.special_event_id === activity.id && m.type === 'photo' && m.is_featured === true) || false;
        
        activitySlides.push({
          id: activity.id,
          image: activityImage,
          title: activity.title,
          description: activity.lieu || activity.orateur 
            ? `${activity.lieu || ''} ${activity.orateur ? '· ' + activity.orateur : ''}` 
            : 'Moment de partage',
          date: activity.date,
          hasFeaturedImage: hasFeaturedImage
        });
      }
    }
    
    // Si aucune activité n'a de photo, utiliser les slides par défaut
    return activitySlides.length > 0 ? activitySlides : defaultSlides;
  }, [pastEvents, mediaImages]);

  const startAutoPlay = () => {
    if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    autoPlayIntervalRef.current = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % slides.length), 
      5000
    );
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
          {currentSlideData.hasFeaturedImage && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-20 shadow-lg">
              <IconStar /> À la une
            </div>
          )}
        </div>
        <div className="carousel-simple-info">
          <div className="carousel-simple-header">
            ACTIVITÉ RÉCENTES
          </div>
          <h3 className="carousel-simple-title">{currentSlideData.title}</h3>
          <p className="carousel-simple-description">{currentSlideData.description}</p>
          <div className="carousel-simple-date">
            <IconCalendar /> {formattedDate}
          </div>
        </div>
      </div>
      
      {slides.length > 1 && (
        <>
          <button className="carousel-simple-nav carousel-simple-nav-left" onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}>‹</button>
          <button className="carousel-simple-nav carousel-simple-nav-right" onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}>›</button>
          <div className="carousel-simple-dots">
            {slides.map((_, index) => (
              <button 
                key={index} 
                className={`carousel-simple-dot ${currentSlide === index ? 'active' : ''}`} 
                onClick={() => setCurrentSlide(index)} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- MINI CALENDAR COMPONENT ---
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
          const isToday = getLocalDateString(day.date) === getLocalDateString(today);
          const isActive = isActiveDate(day.date);
          return (
            <div 
              key={idx} 
              className={`cal-day ${!day.isCurrentMonth ? 'empty' : ''} ${isToday ? 'today' : ''} ${hasEvent && day.isCurrentMonth ? 'has-event' : ''} ${isActive && day.isCurrentMonth ? 'active-selected' : ''}`}
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

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

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
                          <h4>📸 Médias associés</h4>
                          <div className="media-gallery">
                            {eventMedia.map(media => {
                              let mediaUrl = '';
                              let thumbnailUrl = '';
                              
                              if (media.type === 'video') {
                                mediaUrl = media.video_url || media.url;
                                thumbnailUrl = media.thumbnail || getVideoEmbedUrl(mediaUrl) || '/default-video-thumb.jpg';
                              } else {
                                mediaUrl = media.url;
                                thumbnailUrl = media.url;
                              }
                              
                              return (
                                <div key={media.id} className="media-gallery-item" onClick={() => openMediaViewer(media, eventMedia)}>
                                  {media.type === 'video' ? (
                                    <div className="relative">
                                      <img 
                                        src={thumbnailUrl} 
                                        alt={media.title} 
                                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.src = '/default-video-thumb.jpg'; }}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z"/>
                                        </svg>
                                      </div>
                                    </div>
                                  ) : (
                                    <img src={media.url} alt={media.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                  )}
                                  <div style={{ padding: '6px', fontSize: '0.7rem', textAlign: 'center', background: 'white' }}>
                                    {media.title.length > 20 ? media.title.substring(0, 20) + '...' : media.title}
                                  </div>
                                </div>
                              );
                            })}
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
                      {generalMedia.map(media => {
                        let mediaUrl = '';
                        let thumbnailUrl = '';
                        
                        if (media.type === 'video') {
                          mediaUrl = media.video_url || media.url;
                          thumbnailUrl = media.thumbnail || getVideoEmbedUrl(mediaUrl) || '/default-video-thumb.jpg';
                        } else {
                          mediaUrl = media.url;
                          thumbnailUrl = media.url;
                        }
                        
                        return (
                          <div key={media.id} className="media-gallery-item" onClick={() => openMediaViewer(media, generalMedia)}>
                            {media.type === 'video' ? (
                              <div className="relative">
                                <img 
                                  src={thumbnailUrl} 
                                  alt={media.title} 
                                  style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = '/default-video-thumb.jpg'; }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <img src={media.url} alt={media.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                            )}
                            <div style={{ padding: '6px', fontSize: '0.7rem', textAlign: 'center', background: 'white' }}>
                              {media.title.length > 20 ? media.title.substring(0, 20) + '...' : media.title}
                            </div>
                          </div>
                        );
                      })}
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

// --- MEDIA VIEWER MODAL AVEC SUPPORT YOUTUBE, VIMEO, FACEBOOK ---
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const getVimeoEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regex);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  const getFacebookEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    const watchRegex = /facebook\.com\/watch\/?\?v=(\d+)/;
    const watchMatch = url.match(watchRegex);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    const videosRegex = /facebook\.com\/(?:[^\/]+\/)?videos\/(?:[^\/]+\/)?(\d+)/;
    const videosMatch = url.match(videosRegex);
    if (videosMatch) {
      videoId = videosMatch[1];
    }
    const fbWatchRegex = /fb\.watch\/([a-zA-Z0-9?=&]+)/;
    const fbWatchMatch = url.match(fbWatchRegex);
    if (fbWatchMatch) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&mute=0`;
    }
    if (videoId) {
      return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${videoId}&show_text=0&mute=0`;
    }
    if (url.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&mute=0`;
    }
    return null;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url) || getFacebookEmbedUrl(url) || url;
  };

  const getPlatform = (url) => {
    if (!url) return 'unknown';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo')) return 'vimeo';
    if (url.includes('facebook') || url.includes('fb.watch')) return 'facebook';
    return 'unknown';
  };

  const embedUrl = getEmbedUrl(currentMedia.video_url || currentMedia.url);
  const platform = getPlatform(currentMedia.video_url || currentMedia.url);
  
  const getPlatformName = (url) => {
    if (!url) return 'la plateforme';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo')) return 'Vimeo';
    if (url.includes('facebook') || url.includes('fb.watch')) return 'Facebook';
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
              embedUrl && (embedUrl.includes('youtube') || embedUrl.includes('vimeo') || embedUrl.includes('facebook')) ? (
                platform === 'facebook' ? (
                  <div className="text-center p-8 bg-gray-100 rounded-lg">
                    <div className="mb-4">
                      <img 
                        src={currentMedia.thumbnail || '/default-video-thumb.jpg'} 
                        alt={currentMedia.title} 
                        className="max-h-64 mx-auto rounded-lg mb-4"
                      />
                    </div>
                    <p className="text-gray-600 mb-4">La vidéo Facebook ne peut pas être intégrée directement.</p>
                    <a 
                      href={currentMedia.video_url || currentMedia.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Ouvrir sur Facebook
                    </a>
                  </div>
                ) : (
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
                )
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

// --- EVENT PLANNER MODAL AVEC RÉINITIALISATION CORRIGÉE ---
const EventPlannerModal = ({ isOpen, onClose, onSave, editingEvent = null, isLoading = false }) => {
  const [activities, setActivities] = useState([{ title: '', date: '', time: '', orateur: '', moderateur: '', famille_reception: '', lieu: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && editingEvent) {
      setActivities([{ 
        title: editingEvent.title || '', 
        date: editingEvent.date ? getLocalDateString(editingEvent.date) : '', 
        time: editingEvent.time || '', 
        orateur: editingEvent.orateur || '', 
        moderateur: editingEvent.moderateur || '', 
        famille_reception: editingEvent.famille_reception || '', 
        lieu: editingEvent.lieu || '' 
      }]);
    } else if (isOpen && !editingEvent) {
      setActivities([{ title: '', date: '', time: '', orateur: '', moderateur: '', famille_reception: '', lieu: '' }]);
    }
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen, editingEvent]);

  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  const cleanActivityData = (activity) => {
    return {
      title: activity.title.trim(),
      date: activity.date,
      time: activity.time && activity.time.trim() !== '' ? activity.time : null,
      orateur: activity.orateur && activity.orateur.trim() !== '' ? activity.orateur : null,
      moderateur: activity.moderateur && activity.moderateur.trim() !== '' ? activity.moderateur : null,
      famille_reception: activity.famille_reception && activity.famille_reception.trim() !== '' ? activity.famille_reception : null,
      lieu: activity.lieu && activity.lieu.trim() !== '' ? activity.lieu : null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validActivities = activities.filter(a => a.title.trim() !== '' && a.date !== '');
    if (validActivities.length === 0) { 
      alert('Veuillez remplir au moins une activité avec un titre et une date'); 
      return; 
    }
    
    setIsSubmitting(true);
    const cleanedActivities = validActivities.map(cleanActivityData);
    
    try {
      await onSave(cleanedActivities, editingEvent?.id);
      if (!editingEvent) {
        setActivities([{ title: '', date: '', time: '', orateur: '', moderateur: '', famille_reception: '', lieu: '' }]);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingEvent ? 'Modifier le programme' : 'Créer des programmes d\'activités'}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} id="event-form">
            <div className="activities-list">
              {activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-item-header">
                    <span className="activity-number">Activité {index + 1}</span>
                    {activities.length > 1 && !editingEvent && (
                      <button type="button" className="btn-remove-activity" onClick={() => setActivities(activities.filter((_, i) => i !== index))}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="modal-form-grid">
                    <div className="form-group modal-full">
                      <label>Activité / Titre *</label>
                      <span className="input-icon"><IconEdit /></span>
                      <input type="text" placeholder="Ex: Étude biblique..." value={activity.title} onChange={(e) => { const updated = [...activities]; updated[index].title = e.target.value; setActivities(updated); }} required />
                    </div>
                    <div className="form-group">
                      <label>Date *</label>
                      <span className="input-icon"><IconCalendar /></span>
                      <input type="date" value={activity.date} onChange={(e) => { const updated = [...activities]; updated[index].date = e.target.value; setActivities(updated); }} required />
                    </div>
                    <div className="form-group">
                      <label>Heure</label>
                      <span className="input-icon"><IconClock /></span>
                      <input type="time" value={activity.time} onChange={(e) => { const updated = [...activities]; updated[index].time = e.target.value; setActivities(updated); }} />
                    </div>
                    <div className="form-group">
                      <label>Orateur</label>
                      <span className="input-icon"><IconMic /></span>
                      <input type="text" placeholder="Nom de l'orateur..." value={activity.orateur} onChange={(e) => { const updated = [...activities]; updated[index].orateur = e.target.value; setActivities(updated); }} />
                    </div>
                    <div className="form-group">
                      <label>Modérateur</label>
                      <span className="input-icon"><IconUser /></span>
                      <input type="text" placeholder="Nom du modérateur..." value={activity.moderateur} onChange={(e) => { const updated = [...activities]; updated[index].moderateur = e.target.value; setActivities(updated); }} />
                    </div>
                    <div className="form-group modal-full">
                      <label>Famille de réception</label>
                      <span className="input-icon"><IconFamily /></span>
                      <input type="text" placeholder="Nom de la famille..." value={activity.famille_reception} onChange={(e) => { const updated = [...activities]; updated[index].famille_reception = e.target.value; setActivities(updated); }} />
                    </div>
                    <div className="form-group modal-full">
                      <label>Lieu</label>
                      <span className="input-icon"><IconLocation /></span>
                      <textarea rows="2" placeholder="Adresse, salle..." value={activity.lieu} onChange={(e) => { const updated = [...activities]; updated[index].lieu = e.target.value; setActivities(updated); }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!editingEvent && (
              <button type="button" className="btn-add-activity" onClick={() => setActivities([...activities, { title: '', date: '', time: '', orateur: '', moderateur: '', famille_reception: '', lieu: '' }])}>
                <IconPlus /> Ajouter une autre activité
              </button>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button type="submit" form="event-form" className="btn-add" disabled={isLoading || isSubmitting}>
            <IconPlus /> {isLoading || isSubmitting ? 'Envoi en cours...' : (editingEvent ? 'Mettre à jour' : `Ajouter ${activities.length} programme(s)`)}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- IMPORT EXCEL MODAL ---
const ImportExcelModal = ({ isOpen, onClose, onImport, isLoading = false, progress = 0 }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreviewData([
      { title: 'Étude biblique', date: '2026-04-15', time: '18:30', lieu: 'Salle 101', orateur: 'Fr. Jean', moderateur: 'Fr. Paul', famille_reception: 'Famille Dupont' },
      { title: 'Réunion de prière', date: '2026-04-16', time: '19:00', lieu: 'Église', orateur: 'Fr. Marc', moderateur: 'Fr. Pierre', famille_reception: 'Famille Martin' },
    ]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Importer des programmes depuis Excel</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div 
            className={`import-area ${isDragActive ? 'drag-active' : ''}`} 
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }} 
            onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }} 
            onDrop={(e) => { e.preventDefault(); setIsDragActive(false); const droppedFile = e.dataTransfer.files[0]; if (droppedFile) handleFileSelect(droppedFile); }} 
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="import-icon">📊</div>
            <div className="import-title">Glissez-déposez votre fichier Excel ici</div>
            <div className="import-subtitle">ou cliquez pour parcourir</div>
            <input ref={fileInputRef} type="file" className="file-input" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])} />
            <button className="import-btn-select" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <IconFileExcel /> Sélectionner un fichier
            </button>
            {file && (
              <div className="file-info">
                <IconFileExcel /> {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          
          {previewData.length > 0 && !isLoading && (
            <div className="preview-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Titre</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Heure</th>
                    <th className="text-left p-2">Lieu</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-t">{item.title}</td>
                      <td className="p-2 border-t">{item.date}</td>
                      <td className="p-2 border-t">{item.time}</td>
                      <td className="p-2 border-t">{item.lieu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-add" onClick={() => onImport(previewData)} disabled={!file || isLoading}>
            {isLoading ? `Import en cours... ${progress}%` : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ADD MEDIA MODALE ---
const AddMediaModal = ({ isOpen, onClose, onAdd, isLoading = false, events = [], preselectedEventId = null }) => {
  const [mediaType, setMediaType] = useState('photo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId]);

  if (!isOpen) return null;

  const getYouTubeThumbnail = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const getVimeoThumbnail = (url) => {
    const regex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regex);
    if (match) {
      return `https://vumbnail.com/${match[1]}.jpg`;
    }
    return null;
  };

  const getVideoThumbnail = (url) => {
    return getYouTubeThumbnail(url) || getVimeoThumbnail(url) || null;
  };

  const handleFilesSelect = (selectedFiles) => {
    const validFiles = selectedFiles.filter(file => (mediaType === 'photo' && file.type.startsWith('image/')));
    setFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => { 
      const reader = new FileReader(); 
      reader.onloadend = () => { 
        setPreviews(prev => [...prev, { url: reader.result, name: file.name, type: file.type }]); 
      }; 
      reader.readAsDataURL(file); 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mediaType === 'video' && !videoUrl.trim()) {
      alert('Veuillez saisir l\'URL de la vidéo (YouTube, Vimeo, etc.)');
      return;
    }
    
    if (mediaType === 'photo' && files.length === 0) {
      alert('Veuillez sélectionner au moins une photo');
      return;
    }
    
    if (!title.trim()) {
      alert('Veuillez saisir un titre');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('type', mediaType);
    if (selectedEventId) formData.append('special_event_id', selectedEventId);
    
    if (mediaType === 'video') {
      formData.append('video_url', videoUrl);
      const thumbnail = getVideoThumbnail(videoUrl);
      if (thumbnail) formData.append('thumbnail', thumbnail);
    } else {
      files.forEach((file, index) => formData.append(`media[${index}]`, file));
    }
    
    await onAdd(formData);
    
    setMediaType('photo');
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedEventId(preselectedEventId || '');
    setVideoUrl('');
    setFiles([]);
    setPreviews([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>Ajouter des contenus média</h2><button onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} id="add-media-form">
            <div className="media-type-selector">
              <button type="button" className={`media-type-btn ${mediaType === 'photo' ? 'active' : ''}`} onClick={() => { setMediaType('photo'); setFiles([]); setPreviews([]); setVideoUrl(''); }}>
                <IconPhoto /> Photos
              </button>
              <button type="button" className={`media-type-btn ${mediaType === 'video' ? 'active' : ''}`} onClick={() => { setMediaType('video'); setFiles([]); setPreviews([]); setVideoUrl(''); }}>
                <IconVideo /> Vidéos externes
              </button>
            </div>
            
            <div className="form-group modal-full">
              <label>Titre *</label>
              <span className="input-icon"><IconEdit /></span>
              <input type="text" placeholder="Titre du contenu..." value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            
            <div className="form-group modal-full">
              <label>Description</label>
              <span className="input-icon"><IconEdit /></span>
              <textarea rows="3" placeholder="Description..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <span className="input-icon"><IconCalendar /></span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            
            <div className="form-group modal-full">
              <label>Activité associée</label>
              <span className="input-icon"><IconActivity /></span>
              <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ appearance: 'auto', paddingLeft: '42px' }}>
                <option value="">-- Aucune activité --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title} - {formatDateFrench(event.date)}</option>
                ))}
              </select>
            </div>
            
            {mediaType === 'video' ? (
              <div className="form-group modal-full">
                <label>URL de la vidéo *</label>
                <span className="input-icon"><IconVideo /></span>
                <input 
                  type="url" 
                  placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..." 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)} 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supporte: YouTube, Vimeo, Dailymotion, Facebook (copiez l'URL de la vidéo)
                </p>
                {videoUrl && getVideoThumbnail(videoUrl) && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Aperçu de la miniature:</p>
                    <img src={getVideoThumbnail(videoUrl)} alt="Aperçu" className="max-h-32 rounded-lg shadow" />
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group modal-full">
                <label>Photos *</label>
                <div className={`media-upload-area ${isDragActive ? 'drag-active' : ''}`} 
                  onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }} 
                  onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }} 
                  onDrop={(e) => { e.preventDefault(); setIsDragActive(false); const droppedFiles = Array.from(e.dataTransfer.files); if (droppedFiles.length > 0) handleFilesSelect(droppedFiles); }} 
                  onClick={() => fileInputRef.current?.click()}>
                  <div className="import-icon">🖼️</div>
                  <div className="import-title">Glissez-déposez vos photos ici</div>
                  <div className="import-subtitle">ou cliquez pour parcourir</div>
                  <input ref={fileInputRef} type="file" className="file-input" accept="image/*" multiple onChange={(e) => e.target.files && handleFilesSelect(Array.from(e.target.files))} />
                  <button type="button" className="import-btn-select" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Sélectionner des photos</button>
                </div>
                {previews.length > 0 && (
                  <div className="files-preview-grid">
                    <h4>{files.length} photo(s) sélectionnée(s)</h4>
                    <div className="preview-grid">
                      {previews.map((preview, index) => (
                        <div key={index} className="preview-item">
                          <div className="preview-thumbnail">
                            <img src={preview.url} alt={preview.name} />
                          </div>
                          <button type="button" className="preview-remove" onClick={() => { setFiles(prev => prev.filter((_, i) => i !== index)); setPreviews(prev => prev.filter((_, i) => i !== index)); }}>✕</button>
                          <p className="preview-filename">{preview.name.length > 20 ? preview.name.substring(0, 20) + '...' : preview.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button type="submit" form="add-media-form" className="btn-add" disabled={isLoading}>
            <IconPlus /> {isLoading ? 'Ajout en cours...' : (mediaType === 'video' ? 'Ajouter la vidéo' : `Ajouter ${files.length} photo(s)`)}
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant de pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="pagination">
      <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        ‹
      </button>
      <span className="pagination-info">Page {currentPage} sur {totalPages}</span>
      <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        ›
      </button>
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

// --- MAIN PAGE ---
export default function Programmes() {
  const { props } = usePage();
  const { initialClassList = [], initialClassHistory = [], currentClass = null, galleryMedia = [] } = props;

  const [activeTab, setActiveTab] = useState('programmes');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentMediaList, setCurrentMediaList] = useState([]);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [mediaData, setMediaData] = useState(galleryMedia || []);
  const [isDateContentModalOpen, setIsDateContentModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeCalendarDate, setActiveCalendarDate] = useState(null);
  const [galleryFilter, setGalleryFilter] = useState({ search: '', month: '', year: '' });
  const [selectedGalleryMediaIds, setSelectedGalleryMediaIds] = useState([]);
  const [isGallerySelectionMode, setIsGallerySelectionMode] = useState(false);
  const [openGalleryMenuId, setOpenGalleryMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mediaToDelete: null, isMultiple: false, count: 0 });
  
  const [isEditMediaModalOpen, setIsEditMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [editMediaForm, setEditMediaForm] = useState({
    title: '',
    description: '',
    date: '',
    special_event_id: ''
  });
  const [editMediaErrors, setEditMediaErrors] = useState({});
  const [isEditMediaLoading, setIsEditMediaLoading] = useState(false);
  
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyItemsPerPage = 6;
  
  const itemsPerPage = 6;
  const scrollRefs = useRef({});

  const currentMonthEvents = initialClassList.filter(event => isDateInCurrentMonth(event.date));
  const pastEvents = initialClassHistory.filter(event => isDateInPastMonth(event.date));
  const allEvents = [...currentMonthEvents, ...pastEvents];
  const allEventsData = [...currentMonthEvents, ...pastEvents];

  const getFilteredEventsByActiveDate = () => {
    if (!activeCalendarDate) return currentMonthEvents;
    const activeDateStr = getLocalDateString(activeCalendarDate);
    return currentMonthEvents.filter(event => {
      const eventDateStr = getLocalDateString(event.date);
      return eventDateStr === activeDateStr;
    });
  };

  const filteredEvents = getFilteredEventsByActiveDate();

  const galleryAvailableMonths = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const galleryAvailableYears = useMemo(() => {
    const years = mediaData.map(m => new Date(m.date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [mediaData]);

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
        activity = allEvents.find(e => e.id === parseInt(activityId));
      }
      
      const images = medias.filter(m => m.type === 'photo');
      const videos = medias.filter(m => m.type === 'video');
      const sortedImages = images.sort((a, b) => new Date(b.date) - new Date(a.date));
      const sortedVideos = videos.sort((a, b) => new Date(b.date) - new Date(a.date));
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

  const totalPages = Math.ceil(groupedGalleryMedia.length / itemsPerPage);
  const paginatedGroups = groupedGalleryMedia.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalHistoryPages = Math.ceil(pastEvents.length / historyItemsPerPage);
  const paginatedHistoryEvents = pastEvents.slice(
    (historyCurrentPage - 1) * historyItemsPerPage,
    historyCurrentPage * historyItemsPerPage
  );

  useEffect(() => {
    if (historyCurrentPage > totalHistoryPages && totalHistoryPages > 0) {
      setHistoryCurrentPage(totalHistoryPages);
    }
  }, [pastEvents.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [galleryFilter]);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const hideToast = () => setToast(null);
  const getAllEventDates = () => allEvents.map(event => getLocalDateString(event.date));
  
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
    setActiveCalendarDate(null);
  };
  
  const handleClearDateFilter = () => setActiveCalendarDate(null);
  
  const openEventModal = (event = null) => { setEditingEvent(event); setIsEventModalOpen(true); };
  const closeEventModal = () => { setIsEventModalOpen(false); setEditingEvent(null); };
  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => { setIsImportModalOpen(false); setImportProgress(0); };
  
  const openAddMediaModal = (eventId = null) => { 
    setPreselectedEventId(eventId);
    setIsAddMediaModalOpen(true); 
  };
  const closeAddMediaModal = () => { 
    setIsAddMediaModalOpen(false); 
    setPreselectedEventId(null);
  };
  
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

  const openEditMediaModal = (media) => {
    setEditingMedia(media);
    setEditMediaForm({
      title: media.title || '',
      description: media.description || '',
      date: media.date ? new Date(media.date).toISOString().split('T')[0] : '',
      special_event_id: media.special_event_id || '',
    });
    setEditMediaErrors({});
    setIsEditMediaModalOpen(true);
  };

  const closeEditMediaModal = () => {
    setIsEditMediaModalOpen(false);
    setEditingMedia(null);
    setEditMediaForm({
      title: '',
      description: '',
      date: '',
      special_event_id: ''
    });
    setEditMediaErrors({});
  };

  const handleEditMediaFormChange = (e) => {
    const { name, value } = e.target;
    setEditMediaForm(prev => ({ ...prev, [name]: value }));
    if (editMediaErrors[name]) {
      setEditMediaErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUpdateMedia = async (e) => {
    e.preventDefault();
    if (!editingMedia) return;
    
    setIsEditMediaLoading(true);
    setEditMediaErrors({});
    
    try {
      const response = await axios.put(`/conducteur/galerie/update/${editingMedia.id}`, editMediaForm);
      if (response.data.success) {
        showToast('Média mis à jour avec succès', 'success');
        closeEditMediaModal();
        setTimeout(() => router.reload(), 1500);
      } else {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setEditMediaErrors(error.response.data.errors || {});
      } else {
        showToast('Erreur: ' + (error.response?.data?.message || error.message), 'error');
      }
    } finally {
      setIsEditMediaLoading(false);
    }
  };

  const handleAddMedia = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/conducteur/galerie/add', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) { 
        showToast(`${response.data.media?.length || 1} contenu(s) ajouté(s) !`, 'success'); 
        closeAddMediaModal();
        setTimeout(() => router.reload(), 1500);
      }
      else showToast('Erreur lors de l\'ajout', 'error');
    } catch (error) { 
      console.error('Erreur ajout média:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'ajout';
      showToast(errorMessage, 'error'); 
    }
    finally { setIsLoading(false); }
  };

  const handleDeleteSingleMedia = async (media) => {
    setConfirmDialog({
      isOpen: true,
      mediaToDelete: media,
      isMultiple: false,
      count: 1,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const response = await axios.delete(`/conducteur/galerie/${media.id}`);
          if (response.data.success) { 
            showToast('Média supprimé', 'success');
            setTimeout(() => router.reload(), 1500);
          }
          else showToast('Erreur lors de la suppression', 'error');
        } catch (error) { 
          console.error('Erreur suppression:', error);
          showToast('Erreur lors de la suppression', 'error'); 
        }
        finally { 
          setIsLoading(false);
          setConfirmDialog({ isOpen: false, mediaToDelete: null, isMultiple: false, count: 0 });
        }
      }
    });
  };

  // Fonction pour définir une image comme "à la une"
  const setAsFeaturedMedia = async (media) => {
    setIsLoading(true);
    try {
      const response = await axios.put(`/conducteur/galerie/set-featured/${media.id}`);
      
      if (response.data.success) {
        // Mettre à jour localement l'état des médias
        setMediaData(prev => prev.map(m => {
          if (m.special_event_id === media.special_event_id && m.type === 'photo') {
            return { ...m, is_featured: m.id === media.id };
          }
          return m;
        }));
        showToast('⭐ Image à la une définie avec succès', 'success');
        setTimeout(() => router.reload(), 1000);
      } else {
        showToast(response.data.message || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la définition de l\'image à la une', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMediaToHistory = (eventId) => {
    openAddMediaModal(eventId);
  };

  const toggleGalleryMediaSelection = (mediaId) => {
    setSelectedGalleryMediaIds(prev => 
      prev.includes(mediaId) ? prev.filter(id => id !== mediaId) : [...prev, mediaId]
    );
  };

  const cancelGallerySelection = () => {
    setSelectedGalleryMediaIds([]);
    setIsGallerySelectionMode(false);
  };

  const handleDeleteSelectedGalleryMedia = async () => {
    if (selectedGalleryMediaIds.length === 0) {
      showToast('Aucun média sélectionné', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      mediaToDelete: null,
      isMultiple: true,
      count: selectedGalleryMediaIds.length,
      onConfirm: async () => {
        setIsLoading(true);
        let successCount = 0;
        for (const mediaId of selectedGalleryMediaIds) {
          try {
            const response = await axios.delete(`/conducteur/galerie/${mediaId}`);
            if (response.data.success) successCount++;
          } catch (error) {}
        }
        if (successCount > 0) {
          showToast(`${successCount} média(s) supprimé(s)`, 'success');
          setTimeout(() => router.reload(), 1500);
        }
        setSelectedGalleryMediaIds([]);
        setIsGallerySelectionMode(false);
        setIsLoading(false);
        setConfirmDialog({ isOpen: false, mediaToDelete: null, isMultiple: false, count: 0 });
      }
    });
  };

  const handleAddMediaToGroup = (group) => {
    if (group.id !== 'without_event') {
      openAddMediaModal(parseInt(group.id));
    } else {
      openAddMediaModal();
    }
  };

  const handleSelectAllMediaInGroup = (group) => {
    const groupMediaIds = group.medias.map(m => m.id);
    setSelectedGalleryMediaIds(groupMediaIds);
    setIsGallerySelectionMode(true);
  };

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

  const handleSaveEventModal = async (activities, eventId = null) => {
    console.log('Données envoyées:', activities, 'eventId:', eventId);
    setIsLoading(true);
    
    if (eventId && activities.length === 1) {
      try {
        const response = await axios.put(`/conducteur/programmes/event/${eventId}`, activities[0]);
        console.log('Réponse modification:', response.data);
        
        if (response.data.success) {
          showToast(response.data.message || 'Événement modifié avec succès !', 'success');
          closeEventModal();
          setTimeout(() => {
            router.reload();
          }, 1500);
        } else {
          showToast(response.data.message || 'Erreur lors de la modification', 'error');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur modification:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la modification';
        showToast(errorMessage, 'error');
        setIsLoading(false);
      }
    } else {
      try {
        const response = await axios.post('/conducteur/programmes/events-multiple', { activities });
        console.log('Réponse serveur:', response.data);
        
        if (response.data.success) {
          showToast(response.data.message, 'success');
          closeEventModal();
          setTimeout(() => {
            router.reload();
          }, 1500);
        } else {
          showToast(response.data.message || 'Erreur lors de la création', 'error');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur création:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la création';
        showToast(errorMessage, 'error');
        setIsLoading(false);
      }
    }
  };

  const handleImportEvents = async (events) => {
    setIsLoading(true);
    setImportProgress(0);
    try {
      for (let i = 0; i <= 100; i += 20) { 
        await new Promise(resolve => setTimeout(resolve, 300)); 
        setImportProgress(i); 
      }
      const response = await axios.post('/conducteur/programmes/import-events', { events });
      if (response.data.success) { 
        showToast(response.data.message, 'success'); 
        closeImportModal(); 
        setTimeout(() => router.reload(), 1500);
      } else {
        showToast('Erreur lors de l\'import', 'error');
        setIsLoading(false);
      }
    } catch (error) { 
      console.error('Erreur import:', error);
      showToast('Erreur lors de l\'import', 'error');
      setIsLoading(false);
    }
  };

  const handleEditEvent = (event) => openEventModal(event);
  const handleGoBack = () => router.visit('/conducteur/dashboard');
  const handleViewAllProgrammes = () => router.visit('/conducteur/programmes/all');
  const handleViewAllHistory = () => router.visit('/conducteur/programmes/history');

  const renderContent = () => {
    switch (activeTab) {
      case 'programmes':
        const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
        const currentMonthCapitalized = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
        
        return (
          <>
            <HeroCarousel 
              mediaImages={mediaData} 
              pastEvents={pastEvents}
            />
            
            <div className="action-bar">
              <h2>🔥 ACTIVITÉS EN COURS
                <span className="badge-count">
                  {filteredEvents.length} activité(s)
                  {!activeCalendarDate && ` - ${currentMonthCapitalized} ${new Date().getFullYear()}`}
                  {activeCalendarDate && ` - ${formatDateFrench(activeCalendarDate)}`}
                </span>
              </h2>
              <div className="action-buttons">
                <button className="btn-import" onClick={openImportModal}><IconUpload /> Import Excel</button>
                <button className="btn-agenda" onClick={() => openEventModal()}><IconPlus /> Créer un programme</button>
              </div>
            </div>
            
            <div className="glass-container">
              <div className="main-layout">
                <div className="cards-container">
                  {filteredEvents.length > 0 ? (
                    <div className="horizontal-scroller">
                      <div className="cards-wrapper">
                        {filteredEvents.map(event => (
                          <div key={event.id} className="special-card">
                            <button className="edit-btn-card" onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}>
                              <IconEdit />
                            </button>
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
                    <EmptyDialog onCreateClick={() => openEventModal()} />
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
              <div className="btn-view-all-wrapper">
                <button className="btn-view-all" onClick={handleViewAllProgrammes}>
                  <IconEye /> Voir tout les programmes
                </button>
              </div>
            )}
          </>
        );
      case 'historique':
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
                  {paginatedHistoryEvents.length > 0 ? (
                    <>
                      <div className="history-grid">
                        {paginatedHistoryEvents.map(item => {
                          const eventMedia = mediaData.filter(media => media.special_event_id === item.id);
                          const hasMedia = eventMedia.length > 0;
                          
                          return (
                            <div key={item.id} className="history-card-v2">
                              <div className="history-card-v2-header" onClick={() => handleHistoricalCardClick(item)}>
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
                              <div className="history-card-v2-body" onClick={() => handleHistoricalCardClick(item)}>
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
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {hasMedia && (
                                    <span 
                                      className="history-card-v2-media-badge" 
                                      onClick={() => handleHistoricalCardClick(item)}
                                    >
                                      <IconGallery /> {eventMedia.length} média(s)
                                    </span>
                                  )}
                                  <button 
                                    className="history-card-v2-add-btn"
                                    onClick={() => handleAddMediaToHistory(item.id)}
                                  >
                                    <IconPlus /> Ajouter un contenu
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {totalHistoryPages > 1 && (
                        <div className="pagination">
                          <button 
                            className="pagination-btn" 
                            onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={historyCurrentPage === 1}
                          >
                            ‹
                          </button>
                          <span className="pagination-info">
                            Page {historyCurrentPage} sur {totalHistoryPages}
                          </span>
                          <button 
                            className="pagination-btn" 
                            onClick={() => setHistoryCurrentPage(prev => Math.min(totalHistoryPages, prev + 1))}
                            disabled={historyCurrentPage === totalHistoryPages}
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </>
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
          </>
        );
      case 'parcours':
        return (
          <>
            <div className="gallery-filters">
              <div className="gallery-filter-group">
                <input
                  type="text"
                  className="gallery-filter-input"
                  placeholder="🔍 Rechercher par titre, description ou activité..."
                  value={galleryFilter.search}
                  onChange={(e) => setGalleryFilter(prev => ({ ...prev, search: e.target.value }))}
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
                          <div className="group-actions">
                            <button 
                              className="btn-add-media-group" 
                              onClick={() => handleAddMediaToGroup(group)}
                            >
                              <IconPlus /> Ajouter un contenu
                            </button>
                            {group.medias.length > 0 && (
                              <button 
                                className="btn-select-group" 
                                onClick={() => handleSelectAllMediaInGroup(group)}
                              >
                                <IconTrash /> Tout sélectionner
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {isGallerySelectionMode && selectedGalleryMediaIds.filter(id => group.medias.some(m => m.id === id)).length > 0 && (
                          <div className="group-selection-bar">
                            <div className="selection-info">
                              {selectedGalleryMediaIds.filter(id => group.medias.some(m => m.id === id)).length} média(s) sélectionné(s)
                            </div>
                            <div className="selection-actions">
                              <button className="btn-selection-delete" onClick={handleDeleteSelectedGalleryMedia}>
                                <IconTrash /> Supprimer
                              </button>
                              <button className="btn-cancel-selection" onClick={cancelGallerySelection}>
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <GalleryScrollNav 
                          onScrollLeft={() => handleScrollLeft(scrollKey)}
                          onScrollRight={() => handleScrollRight(scrollKey)}
                          hasLeftScroll={scrollState.hasLeftScroll}
                          hasRightScroll={scrollState.hasRightScroll}
                        />
                        
                        <div 
                          className="gallery-scroll-container"
                          ref={el => scrollRefs.current[scrollKey] = el}
                          onScroll={() => updateScrollState(scrollKey)}
                        >
                          <div className="gallery-group-grid-scroll">
                            {group.medias.map(media => (
                              <div key={media.id} className="media-card-wrapper">
                                <div className={`media-card ${selectedGalleryMediaIds.includes(media.id) ? 'selected' : ''}`} onClick={() => openMediaViewer(media, group.medias)}>
                                  {isGallerySelectionMode && (
                                    <div className="media-checkbox" onClick={(e) => { e.stopPropagation(); toggleGalleryMediaSelection(media.id); }}>
                                      <input type="checkbox" checked={selectedGalleryMediaIds.includes(media.id)} onChange={() => {}} />
                                      <div className={`checkbox-custom ${selectedGalleryMediaIds.includes(media.id) ? 'checked' : ''}`}></div>
                                    </div>
                                  )}
                                  <div className="media-thumbnail">
                                    <img 
                                      src={media.type === 'video' ? (media.thumbnail || '/default-video-thumb.jpg') : media.url} 
                                      alt={media.title} 
                                    />
                                    {media.type === 'video' && (
                                      <div className="media-play-icon">
                                        <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z"/>
                                        </svg>
                                      </div>
                                    )}
                                    {media.type === 'photo' && media.is_featured && (
                                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 z-20 shadow-md">
                                        <IconStar /> À la une
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
                                <div className="more-menu-container" style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 15 }}>
                                  <button 
                                    className="more-btn" 
                                    onClick={(e) => { e.stopPropagation(); setOpenGalleryMenuId(openGalleryMenuId === media.id ? null : media.id); }}
                                  >
                                    <IconMoreVert />
                                  </button>
                                  {openGalleryMenuId === media.id && (
                                    <div className="more-menu">
                                      <div className="more-menu-item edit" onClick={() => { 
                                        setOpenGalleryMenuId(null);
                                        openEditMediaModal(media);
                                      }}>
                                        <IconEdit /> Modifier
                                      </div>
                                      {media.type === 'photo' && media.special_event_id && (
                                        <div className="more-menu-item featured" onClick={() => { 
                                          setOpenGalleryMenuId(null);
                                          setAsFeaturedMedia(media);
                                        }}>
                                          <IconStar /> Définir comme image à la une
                                        </div>
                                      )}
                                      <div className="more-menu-item delete" onClick={() => { 
                                        setOpenGalleryMenuId(null);
                                        handleDeleteSingleMedia(media);
                                      }}>
                                        <IconTrash /> Supprimer
                                      </div>
                                    </div>
                                  )}
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
                      ? "Aucun média disponible. Ajoutez vos premiers contenus !"
                      : "Aucun média ne correspond à vos critères de recherche."}
                  </div>
                  {mediaData.length > 0 && (
                    <button className="btn-clear" onClick={() => setGalleryFilter({ search: '', month: '', year: '' })} style={{ marginTop: '20px' }}>
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
            
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

  const EmptyDialog = ({ onCreateClick }) => {
    const currentMonthName = new Date().toLocaleString('fr-FR', { month: 'long' });
    const currentMonthCapitalized = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
    
    return (
      <div className="empty-dialog" onClick={onCreateClick}>
        <div className="empty-dialog-icon">📋</div>
        <div className="empty-dialog-title">✨ Programme de la classe</div>
        <div className="empty-dialog-message">
          {activeCalendarDate 
            ? `Aucun programme pour le ${formatDateFrench(activeCalendarDate)}. Créez-en un !`
            : `Aucun programme pour le mois de ${currentMonthCapitalized} ${new Date().getFullYear()}. Créez votre premier programme !`}
        </div>
        <button className="empty-dialog-button" onClick={(e) => { e.stopPropagation(); onCreateClick(); }}>
          <IconPlus /> Créer un programme
        </button>
      </div>
    );
  };

  return (
    <>
      <Head title="Programme et Activités" />
      <style>{styles}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, mediaToDelete: null, isMultiple: false, count: 0 })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.isMultiple ? "Suppression multiple" : "Supprimer le média"}
        message={confirmDialog.isMultiple 
          ? `Voulez-vous vraiment supprimer ${confirmDialog.count} média(s) ?` 
          : `Voulez-vous vraiment supprimer "${confirmDialog.mediaToDelete?.title}" ?`}
      />
      
      {isEditMediaModalOpen && editingMedia && (
        <div className="modal-overlay" onClick={closeEditMediaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le média</h2>
              <button onClick={closeEditMediaModal}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateMedia} id="edit-media-form">
                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Aperçu actuel</h3>
                  <div className="flex justify-center">
                    {editingMedia.type === 'video' ? (
                      <img 
                        src={editingMedia.thumbnail || editingMedia.url || '/default-video-thumb.jpg'} 
                        alt={editingMedia.title} 
                        className="max-h-48 rounded-lg shadow object-contain"
                      />
                    ) : (
                      <img src={editingMedia.url} alt={editingMedia.title} className="max-h-48 rounded-lg shadow object-contain" />
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Type: {editingMedia.type === 'video' ? 'Vidéo externe' : 'Photo'} | 
                    ID: {editingMedia.id}
                  </p>
                </div>
                
                <div className="modal-form-grid">
                  <div className="form-group modal-full">
                    <label>Titre *</label>
                    <span className="input-icon"><IconEdit /></span>
                    <input 
                      type="text" 
                      name="title"
                      value={editMediaForm.title} 
                      onChange={handleEditMediaFormChange}
                      className={editMediaErrors.title ? 'border-red-500' : ''}
                      required 
                    />
                    {editMediaErrors.title && <p className="text-red-500 text-sm mt-1">{editMediaErrors.title}</p>}
                  </div>
                  
                  <div className="form-group modal-full">
                    <label>Description</label>
                    <span className="input-icon"><IconEdit /></span>
                    <textarea 
                      name="description"
                      rows="3"
                      value={editMediaForm.description} 
                      onChange={handleEditMediaFormChange}
                    />
                    {editMediaErrors.description && <p className="text-red-500 text-sm mt-1">{editMediaErrors.description}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label>Date *</label>
                    <span className="input-icon"><IconCalendar /></span>
                    <input 
                      type="date" 
                      name="date"
                      value={editMediaForm.date} 
                      onChange={handleEditMediaFormChange}
                      className={editMediaErrors.date ? 'border-red-500' : ''}
                      required 
                    />
                    {editMediaErrors.date && <p className="text-red-500 text-sm mt-1">{editMediaErrors.date}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label>Activité associée</label>
                    <span className="input-icon"><IconActivity /></span>
                    <select 
                      name="special_event_id"
                      value={editMediaForm.special_event_id} 
                      onChange={handleEditMediaFormChange}
                      style={{ appearance: 'auto', paddingLeft: '42px' }}
                    >
                      <option value="">-- Aucune activité --</option>
                      {allEvents.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {formatDateFrench(event.date)}
                        </option>
                      ))}
                    </select>
                    {editMediaErrors.special_event_id && <p className="text-red-500 text-sm mt-1">{editMediaErrors.special_event_id}</p>}
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeEditMediaModal}>Annuler</button>
              <button type="submit" form="edit-media-form" className="btn-add" disabled={isEditMediaLoading}>
                <IconPlus /> {isEditMediaLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <EventPlannerModal isOpen={isEventModalOpen} onClose={closeEventModal} onSave={handleSaveEventModal} editingEvent={editingEvent} isLoading={isLoading} />
      <ImportExcelModal isOpen={isImportModalOpen} onClose={closeImportModal} onImport={handleImportEvents} isLoading={isLoading} progress={importProgress} />
      <AddMediaModal 
        isOpen={isAddMediaModalOpen} 
        onClose={closeAddMediaModal} 
        onAdd={handleAddMedia} 
        isLoading={isLoading} 
        events={allEvents}
        preselectedEventId={preselectedEventId}
      />
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