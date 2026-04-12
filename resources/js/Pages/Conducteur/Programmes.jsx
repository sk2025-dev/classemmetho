// pages/Conducteur/Programmes.jsx

import React, { useState, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";

// Configuration d'axios avec le token CSRF
axios.defaults.headers.common["X-CSRF-TOKEN"] = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

// --- STYLES INTÉGRÉS (modern glassmorphism) ---
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
    margin: 4px auto 30px;
    max-width: 1200px;
    position: relative;
}

/* Bouton retour à gauche */
.btn-back {
    flex-shrink: 0;
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

/* Bouton Voir Plus */
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

/* Historical cards */
.historical-card {
    flex: 0 0 auto;
    width: 320px;
    background: #f9fafb;
    padding: 30px;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: var(--transition);
    scroll-snap-align: start;
    height: 100%;
    position: relative;
    opacity: 0.9;
}
.historical-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    opacity: 1;
}
.historical-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: #9ca3af;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
}
.historical-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}
.historical-date {
    background: #9ca3af;
    color: white;
    padding: 6px 12px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.historical-title {
    font-size: 1.3rem;
    color: #374151;
    margin-bottom: 15px;
    font-weight: 700;
    line-height: 1.2;
}
.historical-lieu {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 15px;
    line-height: 1.5;
}
.historical-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
}
.historical-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: #374151;
}
.historical-meta-label {
    font-weight: 600;
    color: #6b7280;
    min-width: 100px;
}

/* Media Cards - Version grille */
.media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 10px;
}
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
    height: 200px;
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
    width: 50px;
    height: 50px;
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
    padding: 15px;
    background: white;
}
.media-title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 5px;
}
.media-date {
    font-size: 0.75rem;
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
}
.delete-single-btn {
    position: absolute;
    bottom: 70px;
    right: 12px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 15;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
}
.delete-single-btn:hover {
    transform: scale(1.1);
    background: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
.selection-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}
.btn-selection-delete {
    background: #ef4444;
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
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.btn-selection-delete:hover {
    transform: translateY(-2px);
    background: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
.btn-selection-delete:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}
.btn-cancel-selection {
    background: #6b7280;
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
.btn-cancel-selection:hover {
    background: #4b5563;
}
.selection-count {
    background: #3b82f6;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
}
.select-all-btn {
    background: white;
    border: 1px solid #e5e7eb;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}
.select-all-btn:hover {
    background: #f3f4f6;
}
.btn-select-mode {
    background: linear-gradient(135deg, #6b7280, #4b5563);
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
.btn-select-mode:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #4b5563, #374151);
}

/* Carousel Styles - Version sans flou */
.carousel-container {
    position: relative;
    width: 100%;
    margin-bottom: 2rem;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}
.carousel-slide {
    position: relative;
    height: 400px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: background-image 0.5s ease-in-out;
}
.carousel-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
}
.carousel-content {
    color: white;
    max-width: 600px;
    animation: fadeInUp 0.5s ease-out;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.carousel-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pulse 2s ease-in-out infinite;
}
.carousel-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.carousel-subtitle {
    font-size: 1.1rem;
    opacity: 0.95;
    margin-bottom: 1.5rem;
    line-height: 1.6;
}
.carousel-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;
}
.carousel-stat {
    text-align: center;
}
.carousel-stat-number {
    font-size: 2rem;
    font-weight: 800;
}
.carousel-stat-label {
    font-size: 0.85rem;
    opacity: 0.8;
}
.carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    color: white;
}
.carousel-nav:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-50%) scale(1.1);
}
.carousel-nav-left {
    left: 20px;
}
.carousel-nav-right {
    right: 20px;
}
.carousel-dots {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 10;
}
.carousel-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
}
.carousel-dot.active {
    width: 28px;
    border-radius: 10px;
    background: white;
}
.carousel-dot:hover {
    background: white;
    transform: scale(1.2);
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
.cal-day.empty {
    background: transparent;
}

/* Archive Card */
.archive-card {
    background: #f97316;
    border-radius: 20px;
    padding: 25px;
    border: none;
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
}
.archive-card .cal-header {
    color: white;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}
.archive-card .cal-month-year {
    color: white;
    display: flex;
    align-items: center;
    gap: 8px;
}
.archive-stats {
    text-align: center;
    margin-top: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 5px;
}
.archive-footer {
    margin-top: 15px;
    text-align: center;
}
.archive-btn-more {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: center;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.archive-btn-more:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px rgba(0,0,0,0.15);
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
.empty-dialog::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
}
.empty-dialog:hover {
    transform: translateY(-5px);
    box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
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
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
.empty-dialog-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    gap: 1rem;
}

/* Empty Gallery Dialog */
.empty-gallery-dialog {
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
.empty-gallery-dialog::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
}
.empty-gallery-dialog:hover {
    transform: translateY(-5px);
    box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
}
.empty-gallery-icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
}
.empty-gallery-title {
    font-size: 1.8rem;
    font-weight: 800;
    color: white;
    margin-bottom: 0.75rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.empty-gallery-message {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
}
.empty-gallery-button {
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
.empty-gallery-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    gap: 1rem;
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
    max-width: 600px;
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
input:not([type="date"]):not([type="time"]), select, textarea {
    padding-left: 42px;
}
input[type="date"], input[type="time"] {
    padding-left: 42px;
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
.media-upload-area.drag-active {
    border-color: var(--primary);
    background: #eff6ff;
}
.media-preview {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
}
.media-preview img, .media-preview video {
    max-width: 100%;
    max-height: 200px;
    border-radius: 12px;
    object-fit: cover;
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
.media-type-btn:hover:not(.active) {
    border-color: var(--primary);
    background: #eff6ff;
}

/* Styles pour la grille de prévisualisation des fichiers */
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
.preview-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}
.preview-item:hover .preview-overlay {
    opacity: 1;
}
.preview-file-type {
    font-size: 2rem;
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
.import-area.drag-active {
    border-color: var(--primary);
    background: #eff6ff;
}
.file-input {
    display: none;
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
.import-btn-select:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
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
.preview-table tr:hover {
    background: #f8fafc;
}

/* Action Bar Buttons */
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
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}
.btn-import:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
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
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}
.btn-agenda:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}
.btn-agenda:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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

/* Responsive */
@media (max-width: 900px) {
    .main-layout { flex-direction: column; }
    .cards-container { flex: auto; width: 100%; }
    .calendar-container { width: 100%; max-width: 100%; position: static; justify-content: center; }
    .glass-container { padding: 15px; }
    .page-header-wrapper { flex-direction: column; align-items: stretch; position: relative; }
    .btn-back { width: auto; justify-content: center; margin-bottom: 0.5rem; }
    .tabs-container-header { position: relative; left: 0; transform: none; justify-content: center; width: 100%; }
    .action-buttons { flex-direction: column; width: 100%; }
    .btn-agenda, .btn-import, .btn-select-mode { width: 100%; justify-content: center; }
    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
    }
    .delete-single-btn {
        bottom: 65px;
        width: 28px;
        height: 28px;
    }
    .carousel-slide {
        height: 350px;
    }
    .carousel-title {
        font-size: 1.8rem;
    }
    .carousel-subtitle {
        font-size: 0.9rem;
    }
    .carousel-stat-number {
        font-size: 1.5rem;
    }
    .carousel-stat-label {
        font-size: 0.7rem;
    }
    .carousel-nav {
        width: 36px;
        height: 36px;
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
    .empty-gallery-dialog { padding: 32px 24px; }
    .empty-gallery-title { font-size: 1.4rem; }
    .empty-gallery-icon { font-size: 3.5rem; }
    .import-area { padding: 20px; }
    .tab-btn-header { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
    .special-card { width: 280px; padding: 20px; }
    .special-title { font-size: 1.2rem; }
    .btn-view-more { width: 100%; justify-content: center; }
    .toast-content { min-width: 250px; padding: 12px 20px; }
    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }
    .delete-single-btn {
        bottom: 60px;
        width: 26px;
        height: 26px;
    }
    .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
    .preview-remove {
        width: 20px;
        height: 20px;
        font-size: 10px;
    }
    .selection-actions {
        flex-wrap: wrap;
        justify-content: center;
    }
    .carousel-slide {
        height: 300px;
    }
    .carousel-title {
        font-size: 1.4rem;
    }
    .carousel-stats {
        gap: 1rem;
    }
    .carousel-stat-number {
        font-size: 1.2rem;
    }
}
`;

// --- ICONS ---
const IconCalendar = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);
const IconClock = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);
const IconUser = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
const IconEdit = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);
const IconPlus = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
const IconArchive = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
);
const IconArrowLeft = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);
const IconArrowRight = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);
const IconMic = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);
const IconPray = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
    </svg>
);
const IconLocation = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);
const IconUpload = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);
const IconFileExcel = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M10 14l4 4m0-4l-4 4"></path>
    </svg>
);
const IconRoadmap = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
    </svg>
);
const IconHistory = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
        <path d="M4 4L8 8M20 4L16 8M4 20L8 16M20 20L16 16"></path>
    </svg>
);
const IconActivity = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);
const IconEye = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
const IconPlay = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);
const IconPhoto = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);
const IconVideo = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <polygon points="10 8 16 12 10 16 10 8"></polygon>
    </svg>
);
const IconCheckCircle = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
const IconXCircle = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);
const IconInfo = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);
const IconTrash = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

// --- COMPOSANT TOAST ---
const Toast = ({ message, type = "success", onClose }) => {
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
            case "success":
                return <IconCheckCircle />;
            case "error":
                return <IconXCircle />;
            default:
                return <IconInfo />;
        }
    };

    return (
        <div className={`toast-notification ${isExiting ? "exit" : ""}`}>
            <div className={`toast-content toast-${type}`}>
                <div className="toast-icon">{getIcon()}</div>
                <div className="toast-message">{message}</div>
                <div
                    className="toast-close"
                    onClick={() => {
                        setIsExiting(true);
                        setTimeout(onClose, 300);
                    }}
                >
                    ✕
                </div>
            </div>
        </div>
    );
};

// --- COMPOSANT CARROUSEL AVEC IMAGES DE LA BD ---
const HeroCarousel = ({ classInfo, eventsCount, mediaImages }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayIntervalRef = useRef(null);

    // Slides par défaut
    const defaultSlides = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200",
            title: "Bienvenue dans votre espace",
            subtitle:
                "Gérez les programmes d'activités de votre classe en toute simplicité",
            icon: "",
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab61?w=1200",
            title: "Programmes & Activités",
            subtitle:
                "Créez, modifiez et organisez les activités de votre classe",
            icon: "",
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200",
            title: "Galerie Photos & Vidéos",
            subtitle: "Partagez vos moments forts avec votre classe",
            icon: "",
        },
        {
            id: 4,
            image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200",
            title: "Import Excel",
            subtitle:
                "Importez facilement vos programmes depuis un fichier Excel",
            icon: "",
        },
    ];

    // Construire les slides à partir des images de la base de données
    const buildSlides = () => {
        if (!mediaImages || mediaImages.length === 0) {
            return defaultSlides;
        }

        // Prendre les 5 premières images de la galerie
        const slidesFromDB = mediaImages.slice(0, 5).map((media, index) => ({
            id: media.id,
            image:
                media.type === "video"
                    ? media.thumbnail || media.url
                    : media.url,
            title: media.title || "Moment de partage",
            subtitle:
                media.description ||
                "Découvrez ce moment capturé lors de nos activités",
            icon: media.type === "video" ? "" : "",
            date: media.date,
            type: media.type,
        }));

        // Si on a moins de 3 images, compléter avec les slides par défaut
        if (slidesFromDB.length < 3) {
            return [
                ...slidesFromDB,
                ...defaultSlides.slice(0, 5 - slidesFromDB.length),
            ];
        }

        return slidesFromDB;
    };

    const slides = buildSlides();

    const startAutoPlay = () => {
        if (autoPlayIntervalRef.current) {
            clearInterval(autoPlayIntervalRef.current);
        }
        autoPlayIntervalRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
    };

    useEffect(() => {
        if (isAutoPlaying && slides.length > 0) {
            startAutoPlay();
        }
        return () => {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
        };
    }, [isAutoPlaying, slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
        if (isAutoPlaying) {
            startAutoPlay();
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        startAutoPlay();
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        startAutoPlay();
    };

    if (slides.length === 0) {
        return null;
    }

    const currentSlideData = slides[currentSlide];
    const className = classInfo?.nom || "";

    return (
        <div
            className="carousel-container"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            <div
                className="carousel-slide"
                style={{ backgroundImage: `url(${currentSlideData.image})` }}
            >
                <div className="carousel-overlay">
                    <div className="carousel-content">
                        <div className="carousel-icon">
                            {currentSlideData.icon}
                        </div>
                        <h2 className="carousel-title">
                            {currentSlideData.title}
                        </h2>
                        <p className="carousel-subtitle">
                            {currentSlideData.subtitle}
                        </p>
                        {currentSlideData.date && (
                            <p
                                style={{
                                    fontSize: "0.9rem",
                                    opacity: 0.8,
                                    marginBottom: "1rem",
                                }}
                            >
                                📅{" "}
                                {new Date(
                                    currentSlideData.date,
                                ).toLocaleDateString("fr-FR")}
                            </p>
                        )}
                        <div className="carousel-stats">
                            <div className="carousel-stat">
                                <div className="carousel-stat-number">
                                    {className || "Classe"}
                                </div>
                                <div className="carousel-stat-label">
                                    Classe
                                </div>
                            </div>
                            <div className="carousel-stat">
                                <div className="carousel-stat-number">
                                    {eventsCount}
                                </div>
                                <div className="carousel-stat-label">
                                    Activités à venir
                                </div>
                            </div>
                            <div className="carousel-stat">
                                <div className="carousel-stat-number">
                                    {new Date().getFullYear()}
                                </div>
                                <div className="carousel-stat-label">Année</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {slides.length > 1 && (
                <>
                    <button
                        className="carousel-nav carousel-nav-left"
                        onClick={prevSlide}
                    >
                        <IconArrowLeft />
                    </button>
                    <button
                        className="carousel-nav carousel-nav-right"
                        onClick={nextSlide}
                    >
                        <IconArrowRight />
                    </button>
                    <div className="carousel-dots">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={`carousel-dot ${currentSlide === index ? "active" : ""}`}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// --- COMPOSANTS ---
const MiniCalendar = ({ eventsDates = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthNames = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
    ];

    const goToPreviousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        );
    };

    const goToNextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        );
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const startPadding = firstDay.getDay();
        const padCount = startPadding === 0 ? 6 : startPadding - 1;
        for (let i = padCount; i > 0; i--) {
            const d = new Date(year, month, -i + 1);
            days.push({ date: d, isCurrentMonth: false });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            days.push({ date: d, isCurrentMonth: false });
        }
        return days;
    };

    const hasEventOnDate = (date) => {
        const dateStr = date.toISOString().split("T")[0];
        return eventsDates.includes(dateStr);
    };

    const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];
    const days = getDaysInMonth(currentDate);
    const today = new Date();
    const isToday = (date) => date.toDateString() === today.toDateString();

    return (
        <div className="mini-calendar">
            <div className="cal-header">
                <button className="cal-nav-btn" onClick={goToPreviousMonth}>
                    ‹
                </button>
                <span className="cal-month-year">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                </span>
                <button className="cal-nav-btn" onClick={goToNextMonth}>
                    ›
                </button>
            </div>
            <div className="cal-grid">
                {daysOfWeek.map((d, idx) => (
                    <div key={`${d}-${idx}`} className="cal-day-label">
                        {d}
                    </div>
                ))}
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        className={`cal-day ${!day.isCurrentMonth ? "empty" : ""} ${isToday(day.date) ? "today" : ""} ${hasEventOnDate(day.date) && day.isCurrentMonth ? "has-event" : ""}`}
                    >
                        {day.date.getDate()}
                    </div>
                ))}
            </div>
        </div>
    );
};

const EventPlannerModal = ({
    isOpen,
    onClose,
    onSave,
    editingEvent = null,
    isLoading = false,
}) => {
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/");
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return dateStr;
    };

    const formatTimeForInput = (timeStr) => {
        if (!timeStr) return "";
        if (timeStr.includes(":")) {
            return timeStr.substring(0, 5);
        }
        return timeStr;
    };

    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        orateur: "",
        moderateur: "",
        dirigeant_priere: "",
        lieu: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (editingEvent) {
                setFormData({
                    title: editingEvent.title || "",
                    date: formatDateForInput(editingEvent.date) || "",
                    time: formatTimeForInput(editingEvent.time) || "",
                    orateur: editingEvent.orateur || "",
                    moderateur: editingEvent.moderateur || "",
                    dirigeant_priere: editingEvent.dirigeant_priere || "",
                    lieu: editingEvent.lieu || "",
                });
            } else {
                setFormData({
                    title: "",
                    date: "",
                    time: "",
                    orateur: "",
                    moderateur: "",
                    dirigeant_priere: "",
                    lieu: "",
                });
            }
        }
    }, [isOpen, editingEvent]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, editingEvent?.id);
    };

    const modalTitle = editingEvent
        ? "Modifier le programme"
        : "Créer un programme d'activité";

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button onClick={onClose}>
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
                    <form onSubmit={handleSubmit} id="event-form">
                        <div className="modal-form-grid">
                            <div className="form-group modal-full">
                                <label>Activité / Titre</label>
                                <span className="input-icon">
                                    <IconEdit />
                                </span>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Ex: Étude biblique, Réunion de prière..."
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <span className="input-icon">
                                    <IconCalendar />
                                </span>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Heure</label>
                                <span className="input-icon">
                                    <IconClock />
                                </span>
                                <input
                                    type="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Orateur</label>
                                <span className="input-icon">
                                    <IconMic />
                                </span>
                                <input
                                    type="text"
                                    name="orateur"
                                    placeholder="Nom de l'orateur..."
                                    value={formData.orateur}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Modérateur</label>
                                <span className="input-icon">
                                    <IconUser />
                                </span>
                                <input
                                    type="text"
                                    name="moderateur"
                                    placeholder="Nom du modérateur..."
                                    value={formData.moderateur}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group modal-full">
                                <label>Dirigeant de la prière</label>
                                <span className="input-icon">
                                    <IconPray />
                                </span>
                                <input
                                    type="text"
                                    name="dirigeant_priere"
                                    placeholder="Nom du dirigeant de la prière..."
                                    value={formData.dirigeant_priere}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group modal-full">
                                <label>Lieu de l'événement</label>
                                <span
                                    className="input-icon"
                                    style={{ top: "42px" }}
                                >
                                    <IconLocation />
                                </span>
                                <textarea
                                    name="lieu"
                                    rows="3"
                                    placeholder="Adresse, salle, lieu de rendez-vous..."
                                    value={formData.lieu}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="event-form"
                        className="btn-add"
                        disabled={isLoading}
                    >
                        <IconPlus />{" "}
                        {isLoading
                            ? "Envoi en cours..."
                            : editingEvent
                              ? "Mettre à jour"
                              : "Ajouter au programme"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImportExcelModal = ({
    isOpen,
    onClose,
    onImport,
    isLoading = false,
    progress = 0,
}) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (
            droppedFile &&
            (droppedFile.name.endsWith(".xlsx") ||
                droppedFile.name.endsWith(".xls") ||
                droppedFile.name.endsWith(".csv"))
        ) {
            handleFileSelect(droppedFile);
        } else {
            alert(
                "Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV",
            );
        }
    };

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setPreviewData([
            {
                title: "Étude biblique",
                date: "2026-04-15",
                time: "18:30",
                lieu: "Salle 101",
            },
            {
                title: "Réunion de prière",
                date: "2026-04-16",
                time: "19:00",
                lieu: "Église",
            },
            {
                title: "Formation",
                date: "2026-04-17",
                time: "15:00",
                lieu: "Salle 202",
            },
        ]);
    };

    const handleImport = async () => {
        if (!file) {
            alert("Veuillez sélectionner un fichier");
            return;
        }
        await onImport(previewData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content import-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Importer des programmes depuis Excel</h2>
                    <button onClick={onClose}>
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
                    <div
                        className={`import-area ${isDragActive ? "drag-active" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="import-icon"></div>
                        <div className="import-title">
                            Glissez-déposez votre fichier Excel ici
                        </div>
                        <div className="import-subtitle">
                            ou cliquez pour parcourir
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="file-input"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) =>
                                e.target.files[0] &&
                                handleFileSelect(e.target.files[0])
                            }
                        />
                        <button
                            className="import-btn-select"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <IconFileExcel /> Sélectionner un fichier
                        </button>
                        {file && (
                            <div className="file-info">
                                <IconFileExcel /> {file.name} (
                                {(file.size / 1024).toFixed(2)} KB)
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}

                    {previewData.length > 0 && !isLoading && (
                        <div className="preview-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Titre</th>
                                        <th>Date</th>
                                        <th>Heure</th>
                                        <th>Lieu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.title}</td>
                                            <td>{item.date}</td>
                                            <td>{item.time}</td>
                                            <td>{item.lieu}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="btn-add"
                        onClick={handleImport}
                        disabled={!file || isLoading}
                    >
                        {isLoading
                            ? `Import en cours... ${progress}%`
                            : "Importer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal pour afficher les médias en grand
const MediaViewerModal = ({ isOpen, onClose, media }) => {
    if (!isOpen || !media) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content modal-content-media"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{media.title}</h2>
                    <button onClick={onClose}>
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
                    <div className="media-viewer">
                        {media.type === "video" ? (
                            <video controls autoPlay>
                                <source src={media.url} type="video/mp4" />
                                Votre navigateur ne supporte pas la lecture
                                vidéo.
                            </video>
                        ) : (
                            <img src={media.url} alt={media.title} />
                        )}
                        <div className="media-viewer-info">
                            <p>
                                <strong>Date:</strong>{" "}
                                {new Date(media.date).toLocaleDateString(
                                    "fr-FR",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    },
                                )}
                            </p>
                            {media.description && (
                                <p>
                                    <strong>Description:</strong>{" "}
                                    {media.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal pour ajouter un contenu média (version améliorée avec sélection multiple)
const AddMediaModal = ({
    isOpen,
    onClose,
    onAdd,
    isLoading = false,
    events = [],
}) => {
    const [mediaType, setMediaType] = useState("photo");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleFilesSelect(droppedFiles);
        }
    };

    const handleFilesSelect = (selectedFiles) => {
        const validFiles = selectedFiles.filter(
            (file) =>
                (mediaType === "photo" && file.type.startsWith("image/")) ||
                (mediaType === "video" && file.type.startsWith("video/")),
        );

        if (validFiles.length !== selectedFiles.length) {
            alert(
                `Seuls les fichiers ${mediaType === "photo" ? "images" : "vidéos"} sont acceptés`,
            );
        }

        setFiles((prev) => [...prev, ...validFiles]);

        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews((prev) => [
                    ...prev,
                    { url: reader.result, name: file.name, type: file.type },
                ]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (files.length === 0) {
            alert("Veuillez sélectionner au moins un fichier");
            return;
        }

        if (!title.trim()) {
            alert("Veuillez saisir un titre");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("date", date);
        formData.append("type", mediaType);
        if (selectedEventId) {
            formData.append("special_event_id", selectedEventId);
        }

        files.forEach((file, index) => {
            formData.append(`media[${index}]`, file);
        });

        await onAdd(formData);
        resetForm();
    };

    const resetForm = () => {
        setMediaType("photo");
        setTitle("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setSelectedEventId("");
        setFiles([]);
        setPreviews([]);
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith("image/")) return "🖼️";
        if (fileType.startsWith("video/")) return "🎬";
        return "📄";
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ajouter des contenus média</h2>
                    <button onClick={onClose}>
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
                    <form onSubmit={handleSubmit} id="add-media-form">
                        <div className="media-type-selector">
                            <button
                                type="button"
                                className={`media-type-btn ${mediaType === "photo" ? "active" : ""}`}
                                onClick={() => {
                                    setMediaType("photo");
                                    setFiles([]);
                                    setPreviews([]);
                                }}
                            >
                                <IconPhoto /> Photos
                            </button>
                            <button
                                type="button"
                                className={`media-type-btn ${mediaType === "video" ? "active" : ""}`}
                                onClick={() => {
                                    setMediaType("video");
                                    setFiles([]);
                                    setPreviews([]);
                                }}
                            >
                                <IconVideo /> Vidéos
                            </button>
                        </div>

                        <div className="form-group modal-full">
                            <label>Titre *</label>
                            <span className="input-icon">
                                <IconEdit />
                            </span>
                            <input
                                type="text"
                                placeholder="Titre du contenu..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group modal-full">
                            <label>Description</label>
                            <span
                                className="input-icon"
                                style={{ top: "42px" }}
                            >
                                <IconEdit />
                            </span>
                            <textarea
                                rows="3"
                                placeholder="Description du contenu..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <span className="input-icon">
                                <IconCalendar />
                            </span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group modal-full">
                            <label>Activité associée (optionnel)</label>
                            <span className="input-icon">
                                <IconActivity />
                            </span>
                            <select
                                value={selectedEventId}
                                onChange={(e) =>
                                    setSelectedEventId(e.target.value)
                                }
                                style={{
                                    appearance: "auto",
                                    paddingLeft: "42px",
                                }}
                            >
                                <option value="">-- Aucune activité --</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.title} -{" "}
                                        {new Date(
                                            event.date,
                                        ).toLocaleDateString("fr-FR")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group modal-full">
                            <label>
                                Fichiers{" "}
                                {mediaType === "photo" ? "images" : "vidéos"} *
                                (sélection multiple possible)
                            </label>
                            <div
                                className={`media-upload-area ${isDragActive ? "drag-active" : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="import-icon">
                                    {mediaType === "photo" ? "🖼️" : "🎬"}
                                </div>
                                <div className="import-title">
                                    Glissez-déposez vos{" "}
                                    {mediaType === "photo"
                                        ? "images"
                                        : "vidéos"}{" "}
                                    ici
                                </div>
                                <div className="import-subtitle">
                                    ou cliquez pour parcourir (sélection
                                    multiple possible)
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="file-input"
                                    accept={
                                        mediaType === "photo"
                                            ? "image/*"
                                            : "video/*"
                                    }
                                    multiple
                                    onChange={(e) =>
                                        e.target.files &&
                                        handleFilesSelect(
                                            Array.from(e.target.files),
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    className="import-btn-select"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    Sélectionner des fichiers
                                </button>
                            </div>

                            {previews.length > 0 && (
                                <div className="files-preview-grid">
                                    <h4
                                        style={{
                                            marginTop: "1rem",
                                            marginBottom: "0.5rem",
                                            fontSize: "0.9rem",
                                            color: "#374151",
                                        }}
                                    >
                                        {files.length} fichier(s) sélectionné(s)
                                    </h4>
                                    <div className="preview-grid">
                                        {previews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="preview-item"
                                            >
                                                <div className="preview-thumbnail">
                                                    {preview.type?.startsWith(
                                                        "image/",
                                                    ) ? (
                                                        <img
                                                            src={preview.url}
                                                            alt={preview.name}
                                                        />
                                                    ) : (
                                                        <video>
                                                            <source
                                                                src={
                                                                    preview.url
                                                                }
                                                            />
                                                        </video>
                                                    )}
                                                    <div className="preview-overlay">
                                                        <span className="preview-file-type">
                                                            {getFileIcon(
                                                                preview.type,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="preview-remove"
                                                        onClick={() =>
                                                            removeFile(index)
                                                        }
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <p
                                                    className="preview-filename"
                                                    title={preview.name}
                                                >
                                                    {preview.name.length > 20
                                                        ? preview.name.substring(
                                                              0,
                                                              20,
                                                          ) + "..."
                                                        : preview.name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="add-media-form"
                        className="btn-add"
                        disabled={isLoading || files.length === 0}
                    >
                        <IconPlus />{" "}
                        {isLoading
                            ? "Ajout en cours..."
                            : `Ajouter ${files.length} fichier(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPOSANT MEDIA CARD ---
const MediaCard = ({ media, isSelected, onSelect, onView, onDelete }) => {
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect(media.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(media);
    };

    return (
        <div className="media-card-wrapper">
            <div
                className={`media-card ${isSelected ? "selected" : ""}`}
                onClick={() => onView(media)}
            >
                <div className="media-checkbox" onClick={handleCheckboxClick}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                    />
                    <div
                        className={`checkbox-custom ${isSelected ? "checked" : ""}`}
                    ></div>
                </div>
                <div className="media-thumbnail">
                    <img
                        src={
                            media.type === "video"
                                ? media.thumbnail || media.url
                                : media.url
                        }
                        alt={media.title}
                    />
                    {media.type === "video" && (
                        <div className="media-play-icon">
                            <IconPlay />
                        </div>
                    )}
                    <div className="media-badge">
                        {media.type === "video" ? <IconVideo /> : <IconPhoto />}
                        {media.type === "video" ? "Vidéo" : "Photo"}
                    </div>
                </div>
                <div className="media-info">
                    <h4 className="media-title">{media.title}</h4>
                    <p className="media-date">
                        <IconCalendar
                            style={{ width: "12px", height: "12px" }}
                        />
                        {new Date(media.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>
            <button
                className="delete-single-btn"
                onClick={handleDeleteClick}
                title="Supprimer ce média"
            >
                <IconTrash style={{ width: "16px", height: "16px" }} />
            </button>
        </div>
    );
};

// --- PAGE PRINCIPALE ---
export default function Programmes() {
    const { props } = usePage();
    const {
        initialClassList = [],
        initialClassHistory = [],
        currentClass = null,
        galleryMedia = [],
    } = props;

    const [activeTab, setActiveTab] = useState("programmes");
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [mediaData, setMediaData] = useState(galleryMedia || []);
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const scrollerRef = useRef(null);

    // Tous les événements pour le sélecteur d'activité (sans doublons)
    const allEvents = [
        ...new Map(
            [...initialClassList, ...initialClassHistory].map((event) => [
                event.id,
                event,
            ]),
        ).values(),
    ];

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const getAllEventDates = () => {
        const dates = allEvents
            .map((event) => {
                const date = new Date(event.date);
                if (Number.isNaN(date.getTime())) return null;
                return date.toISOString().split("T")[0];
            })
            .filter(Boolean);

        return [...new Set(dates)];
    };

    const openEventModal = (event = null) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    const closeEventModal = () => {
        setIsEventModalOpen(false);
        setEditingEvent(null);
    };

    const openImportModal = () => {
        setIsImportModalOpen(true);
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setImportProgress(0);
    };

    const openAddMediaModal = () => {
        setIsAddMediaModalOpen(true);
    };

    const closeAddMediaModal = () => {
        setIsAddMediaModalOpen(false);
    };

    const openMediaViewer = (media) => {
        setSelectedMedia(media);
        setIsMediaViewerOpen(true);
    };

    const closeMediaViewer = () => {
        setSelectedMedia(null);
        setIsMediaViewerOpen(false);
    };

    const handleAddMedia = async (formData) => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                withBasePath("", "/conducteur/galerie/add"),
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            if (response.data.success) {
                setMediaData((prev) => [...response.data.media, ...prev]);
                showToast(
                    `${response.data.media.length} contenu(s) ajouté(s) avec succès !`,
                    "success",
                );
                closeAddMediaModal();
            } else {
                showToast("Erreur lors de l'ajout du contenu", "error");
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout", error);
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
                showToast(errorMessages, "error");
            } else {
                showToast("Erreur lors de l'ajout du contenu", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSingleMedia = async (media) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${media.title}" ?`)) {
            setIsLoading(true);
            try {
                const response = await axios.delete(
                    withBasePath("", `/conducteur/galerie/${media.id}`),
                );
                if (response.data.success) {
                    setMediaData((prev) =>
                        prev.filter((m) => m.id !== media.id),
                    );
                    showToast("Média supprimé avec succès", "success");
                } else {
                    showToast("Erreur lors de la suppression", "error");
                }
            } catch (error) {
                console.error("Erreur lors de la suppression", error);
                showToast("Erreur lors de la suppression", "error");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const toggleMediaSelection = (mediaId) => {
        setSelectedMediaIds((prev) => {
            if (prev.includes(mediaId)) {
                return prev.filter((id) => id !== mediaId);
            } else {
                return [...prev, mediaId];
            }
        });
    };

    const selectAllMedia = () => {
        const currentYearMedia = mediaData.filter((media) => {
            const mediaDate = new Date(media.date);
            const currentYear = new Date().getFullYear();
            return mediaDate.getFullYear() === currentYear;
        });

        if (selectedMediaIds.length === currentYearMedia.length) {
            setSelectedMediaIds([]);
        } else {
            setSelectedMediaIds(currentYearMedia.map((m) => m.id));
        }
    };

    const cancelSelection = () => {
        setSelectedMediaIds([]);
        setIsSelectionMode(false);
    };

    const handleDeleteSelected = async () => {
        if (selectedMediaIds.length === 0) {
            showToast("Aucun média sélectionné", "error");
            return;
        }

        const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedMediaIds.length} média(s) ?`;
        if (confirm(confirmMessage)) {
            setIsLoading(true);
            let successCount = 0;
            let errorCount = 0;

            for (const mediaId of selectedMediaIds) {
                try {
                    const response = await axios.delete(
                        withBasePath("", `/conducteur/galerie/${mediaId}`),
                    );
                    if (response.data.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error("Erreur lors de la suppression", error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                setMediaData((prev) =>
                    prev.filter(
                        (media) => !selectedMediaIds.includes(media.id),
                    ),
                );
                showToast(
                    `${successCount} média(s) supprimé(s) avec succès`,
                    "success",
                );
            }
            if (errorCount > 0) {
                showToast(
                    `${errorCount} média(s) n'ont pas pu être supprimés`,
                    "error",
                );
            }

            setSelectedMediaIds([]);
            setIsSelectionMode(false);
            setIsLoading(false);
        }
    };

    const handleSaveEventModal = async (data, eventId = null) => {
        const payload = {
            title: data.title,
            date: data.date,
            time: data.time,
            orateur: data.orateur || null,
            moderateur: data.moderateur || null,
            dirigeant_priere: data.dirigeant_priere || null,
            lieu: data.lieu || null,
        };

        setIsLoading(true);

        try {
            const endpoint = eventId
                ? withBasePath("", `/conducteur/programmes/event/${eventId}`)
                : withBasePath("", "/conducteur/programmes/event");

            const response = eventId
                ? await axios.put(endpoint, payload)
                : await axios.post(endpoint, payload);

            if (response?.data?.success) {
                closeEventModal();
                showToast(
                    eventId
                        ? "Événement modifié avec succès !"
                        : "Événement créé avec succès !",
                    "success",
                );
                router.reload();
            } else {
                showToast(
                    response?.data?.message ||
                        "Erreur lors de l'enregistrement",
                    "error",
                );
            }
        } catch (error) {
            console.error("Erreur d'enregistrement", error);
            const message =
                error?.response?.data?.message ||
                (eventId
                    ? "Erreur lors de la modification"
                    : "Erreur lors de la création");
            showToast(message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportEvents = async (events) => {
        setIsLoading(true);
        setImportProgress(0);

        try {
            for (let i = 0; i <= 100; i += 20) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                setImportProgress(i);
            }

            const response = await axios.post(
                withBasePath("", "/conducteur/programmes/import-events"),
                { events },
            );
            if (response.data.success) {
                showToast(
                    `${response.data.imported_count} événements importés avec succès !`,
                    "success",
                );
                closeImportModal();
                router.reload();
            } else {
                showToast(
                    "Erreur lors de l'import: " +
                        (response.data.message || "Veuillez réessayer"),
                    "error",
                );
            }
        } catch (error) {
            console.error("Erreur d'import", error);
            showToast("Erreur lors de l'import", "error");
        } finally {
            setIsLoading(false);
            setImportProgress(0);
        }
    };

    const handleEditEvent = (event) => {
        openEventModal(event);
    };

    const handleViewMore = () => {
        router.visit(withBasePath("", "/conducteur/programmes/archive"));
    };

    const handleGoBack = () => {
        router.visit(withBasePath("", "/conducteur/dashboard"));
    };

    const handleViewAllProgrammes = () => {
        router.visit(withBasePath("", "/conducteur/programmes/all"));
    };

    const handleViewAllHistory = () => {
        router.visit(withBasePath("", "/conducteur/programmes/history"));
    };

    const handleViewAllMedia = () => {
        router.visit(withBasePath("", "/conducteur/galerie"));
    };

    const EmptyDialog = ({ onCreateClick }) => {
        return (
            <div className="empty-dialog" onClick={onCreateClick}>
                <div className="empty-dialog-icon">📋</div>
                <div className="empty-dialog-title">
                    ✨ Programme de la classe
                </div>
                <div className="empty-dialog-message">
                    Aucun programme d'activité n'est actuellement disponible
                    pour votre classe. Créez votre premier programme dès
                    maintenant !
                </div>
                <button
                    className="empty-dialog-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCreateClick();
                    }}
                >
                    <IconPlus /> Créer un programme
                </button>
            </div>
        );
    };

    const EmptyGalleryDialog = ({ onCreateClick }) => {
        return (
            <div className="empty-gallery-dialog" onClick={onCreateClick}>
                <div className="empty-gallery-icon">📸</div>
                <div className="empty-gallery-title">
                    ✨ Galerie de la classe
                </div>
                <div className="empty-gallery-message">
                    Aucun média n'est actuellement disponible pour votre classe.
                    Partagez vos moments forts en ajoutant des photos et vidéos
                    !
                </div>
                <button
                    className="empty-gallery-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCreateClick();
                    }}
                >
                    <IconPlus /> Ajouter mon premier contenu
                </button>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "programmes":
                // Récupérer les images de la galerie pour le carrousel (uniquement les photos, max 5)
                const carouselImages = mediaData
                    .filter((media) => media.type === "photo")
                    .slice(0, 5);

                return (
                    <>
                        <HeroCarousel
                            classInfo={currentClass}
                            eventsCount={initialClassList.length}
                            mediaImages={carouselImages}
                        />

                        <div className="action-bar">
                            <h2>
                                🔥 ACTIVITÉS EN COURS
                                <span className="badge-count">
                                    {initialClassList.length} activité
                                    {initialClassList.length !== 1 ? "s" : ""} à
                                    venir
                                </span>
                            </h2>
                            <div className="action-buttons">
                                <button
                                    className="btn-import"
                                    onClick={openImportModal}
                                >
                                    <IconUpload /> Import Excel
                                </button>
                                <button
                                    className="btn-agenda"
                                    onClick={() => openEventModal()}
                                >
                                    <IconPlus /> Créer un programme
                                </button>
                            </div>
                        </div>

                        <div className="glass-container">
                            <div className="main-layout">
                                <div className="cards-container">
                                    {initialClassList.length > 0 ? (
                                        <div
                                            className="horizontal-scroller"
                                            ref={scrollerRef}
                                        >
                                            <div className="cards-wrapper">
                                                {initialClassList.map(
                                                    (event) => (
                                                        <div
                                                            key={event.id}
                                                            className="special-card"
                                                        >
                                                            <button
                                                                className="edit-btn-card"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleEditEvent(
                                                                        event,
                                                                    );
                                                                }}
                                                                title="Modifier"
                                                            >
                                                                <IconEdit />
                                                            </button>
                                                            <div>
                                                                <div className="special-header">
                                                                    <span className="special-date">
                                                                        {new Date(
                                                                            event.date,
                                                                        ).toLocaleDateString(
                                                                            "fr-FR",
                                                                            {
                                                                                day: "numeric",
                                                                                month: "long",
                                                                                year: "numeric",
                                                                            },
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <h4 className="special-title">
                                                                    {
                                                                        event.title
                                                                    }
                                                                </h4>
                                                                {event.lieu && (
                                                                    <p className="special-lieu">
                                                                        <IconLocation
                                                                            style={{
                                                                                display:
                                                                                    "inline",
                                                                                marginRight:
                                                                                    "6px",
                                                                                verticalAlign:
                                                                                    "middle",
                                                                            }}
                                                                        />
                                                                        {
                                                                            event.lieu
                                                                        }
                                                                    </p>
                                                                )}
                                                                {event.time && (
                                                                    <p
                                                                        style={{
                                                                            fontSize:
                                                                                "0.9rem",
                                                                            color: "#2563eb",
                                                                            fontWeight:
                                                                                "bold",
                                                                            marginTop:
                                                                                "0.5rem",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: "6px",
                                                                        }}
                                                                    >
                                                                        <IconClock />{" "}
                                                                        {event.time.substring(
                                                                            0,
                                                                            5,
                                                                        )}
                                                                    </p>
                                                                )}
                                                                {(event.orateur ||
                                                                    event.moderateur ||
                                                                    event.dirigeant_priere) && (
                                                                    <div className="special-meta">
                                                                        {event.orateur && (
                                                                            <div className="special-meta-item">
                                                                                <span className="special-meta-label">
                                                                                    Orateur:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        event.orateur
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {event.moderateur && (
                                                                            <div className="special-meta-item">
                                                                                <span className="special-meta-label">
                                                                                    Modérateur:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        event.moderateur
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {event.dirigeant_priere && (
                                                                            <div className="special-meta-item">
                                                                                <span className="special-meta-label">
                                                                                    Dir.
                                                                                    prière:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        event.dirigeant_priere
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyDialog
                                            onCreateClick={() =>
                                                openEventModal()
                                            }
                                        />
                                    )}
                                </div>
                                <div className="calendar-container">
                                    <MiniCalendar
                                        eventsDates={getAllEventDates()}
                                    />
                                </div>
                            </div>
                        </div>
                        {initialClassList.length > 0 && (
                            <div className="btn-view-more-wrapper">
                                <button
                                    className="btn-view-more"
                                    onClick={handleViewAllProgrammes}
                                >
                                    <IconEye /> Voir tous les programmes en
                                    cours
                                </button>
                            </div>
                        )}
                    </>
                );

            case "historique":
                return (
                    <>
                        <div className="action-bar">
                            <h2>📜 HISTORIQUE DES PROGRAMMES D'ACTIVITÉS</h2>
                        </div>
                        <div className="glass-container">
                            <div className="main-layout">
                                <div className="cards-container">
                                    <div className="horizontal-scroller">
                                        <div className="cards-wrapper">
                                            {initialClassHistory.length > 0 ? (
                                                initialClassHistory.map(
                                                    (item) => (
                                                        <div
                                                            key={item.id}
                                                            className="historical-card"
                                                        >
                                                            <div>
                                                                <div className="historical-header">
                                                                    <span className="historical-date">
                                                                        {new Date(
                                                                            item.date,
                                                                        ).toLocaleDateString(
                                                                            "fr-FR",
                                                                            {
                                                                                day: "numeric",
                                                                                month: "long",
                                                                                year: "numeric",
                                                                            },
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <h4 className="historical-title">
                                                                    {item.title}
                                                                </h4>
                                                                {item.lieu && (
                                                                    <p className="historical-lieu">
                                                                        <IconLocation
                                                                            style={{
                                                                                display:
                                                                                    "inline",
                                                                                marginRight:
                                                                                    "6px",
                                                                                verticalAlign:
                                                                                    "middle",
                                                                            }}
                                                                        />
                                                                        {
                                                                            item.lieu
                                                                        }
                                                                    </p>
                                                                )}
                                                                {item.time && (
                                                                    <p
                                                                        style={{
                                                                            fontSize:
                                                                                "0.85rem",
                                                                            color: "#2563eb",
                                                                            fontWeight:
                                                                                "bold",
                                                                            marginTop:
                                                                                "0.5rem",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: "6px",
                                                                        }}
                                                                    >
                                                                        <IconClock />{" "}
                                                                        {item.time.substring(
                                                                            0,
                                                                            5,
                                                                        )}
                                                                    </p>
                                                                )}
                                                                {(item.orateur ||
                                                                    item.moderateur ||
                                                                    item.dirigeant_priere) && (
                                                                    <div className="historical-meta">
                                                                        {item.orateur && (
                                                                            <div className="historical-meta-item">
                                                                                <span className="historical-meta-label">
                                                                                    Orateur:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        item.orateur
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {item.moderateur && (
                                                                            <div className="historical-meta-item">
                                                                                <span className="historical-meta-label">
                                                                                    Modérateur:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        item.moderateur
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {item.dirigeant_priere && (
                                                                            <div className="historical-meta-item">
                                                                                <span className="historical-meta-label">
                                                                                    Dir.
                                                                                    prière:
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        item.dirigeant_priere
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <div
                                                    style={{
                                                        padding: 40,
                                                        textAlign: "center",
                                                        color: "#9ca3af",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <IconArchive
                                                        style={{
                                                            width: 48,
                                                            height: 48,
                                                            marginBottom: 16,
                                                            opacity: 0.5,
                                                        }}
                                                    />
                                                    <p>
                                                        Aucun historique
                                                        disponible pour cette
                                                        classe.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="calendar-container">
                                    <div className="archive-card">
                                        <div className="cal-header">
                                            <span className="cal-month-year">
                                                <IconArchive /> Archives
                                            </span>
                                        </div>
                                        <div className="archive-stats">
                                            {initialClassHistory.length}{" "}
                                            Activité
                                            {initialClassHistory.length !== 1
                                                ? "s"
                                                : ""}{" "}
                                            archivée
                                            {initialClassHistory.length !== 1
                                                ? "s"
                                                : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {initialClassHistory.length > 0 && (
                            <div className="btn-view-more-wrapper">
                                <button
                                    className="btn-view-more"
                                    onClick={handleViewAllHistory}
                                >
                                    <IconEye /> Voir tout l'historique
                                </button>
                            </div>
                        )}
                    </>
                );

            case "parcours":
                // Filtrer les médias de l'année en cours
                const currentYearMedia = mediaData.filter((media) => {
                    const mediaDate = new Date(media.date);
                    const currentYear = new Date().getFullYear();
                    return mediaDate.getFullYear() === currentYear;
                });

                return (
                    <>
                        <div className="action-bar">
                            <h2>
                                📸 GALERIE PHOTOS & VIDEOS -{" "}
                                {new Date().getFullYear()}
                            </h2>
                            <div className="action-buttons">
                                {!isSelectionMode ? (
                                    <>
                                        <button
                                            className="btn-agenda"
                                            onClick={openAddMediaModal}
                                        >
                                            <IconPlus /> Créer un contenu
                                        </button>
                                        {currentYearMedia.length > 0 && (
                                            <button
                                                className="btn-select-mode"
                                                onClick={() =>
                                                    setIsSelectionMode(true)
                                                }
                                            >
                                                <IconTrash /> Sélectionner
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="selection-actions">
                                        <span className="selection-count">
                                            {selectedMediaIds.length}{" "}
                                            sélectionné(s)
                                        </span>
                                        <button
                                            className="btn-selection-delete"
                                            onClick={handleDeleteSelected}
                                            disabled={
                                                selectedMediaIds.length === 0 ||
                                                isLoading
                                            }
                                        >
                                            <IconTrash /> Supprimer sélection
                                        </button>
                                        <button
                                            className="btn-cancel-selection"
                                            onClick={cancelSelection}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isSelectionMode && currentYearMedia.length > 0 && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    className="select-all-btn"
                                    onClick={selectAllMedia}
                                >
                                    {selectedMediaIds.length ===
                                    currentYearMedia.length
                                        ? "Désélectionner tout"
                                        : "Tout sélectionner"}
                                </button>
                            </div>
                        )}

                        <div className="glass-container">
                            <div className="main-layout">
                                <div className="cards-container">
                                    {currentYearMedia.length > 0 ? (
                                        <div className="media-grid">
                                            {currentYearMedia.map((media) => (
                                                <MediaCard
                                                    key={media.id}
                                                    media={media}
                                                    isSelected={selectedMediaIds.includes(
                                                        media.id,
                                                    )}
                                                    onSelect={
                                                        toggleMediaSelection
                                                    }
                                                    onView={openMediaViewer}
                                                    onDelete={
                                                        handleDeleteSingleMedia
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyGalleryDialog
                                            onCreateClick={openAddMediaModal}
                                        />
                                    )}
                                </div>
                                <div className="calendar-container">
                                    <div
                                        className="archive-card"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #667eea, #764ba2)",
                                        }}
                                    >
                                        <div className="cal-header">
                                            <span className="cal-month-year">
                                                <IconRoadmap /> Médiathèque{" "}
                                                {new Date().getFullYear()}
                                            </span>
                                        </div>
                                        <div className="archive-stats">
                                            {currentYearMedia.length} Médias
                                            disponibles
                                        </div>
                                        <div
                                            className="archive-stats"
                                            style={{
                                                fontSize: "0.8rem",
                                                marginTop: "10px",
                                            }}
                                        >
                                            {
                                                currentYearMedia.filter(
                                                    (m) => m.type === "photo",
                                                ).length
                                            }{" "}
                                            Photos •{" "}
                                            {
                                                currentYearMedia.filter(
                                                    (m) => m.type === "video",
                                                ).length
                                            }{" "}
                                            Vidéos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {currentYearMedia.length > 0 && (
                            <div className="btn-view-more-wrapper">
                                <button
                                    className="btn-view-more"
                                    onClick={handleViewAllMedia}
                                >
                                    <IconEye /> Voir toute la galerie
                                </button>
                            </div>
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Programme et Activités" />
            <style>{styles}</style>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <EventPlannerModal
                isOpen={isEventModalOpen}
                onClose={closeEventModal}
                onSave={handleSaveEventModal}
                editingEvent={editingEvent}
                isLoading={isLoading}
            />

            <ImportExcelModal
                isOpen={isImportModalOpen}
                onClose={closeImportModal}
                onImport={handleImportEvents}
                isLoading={isLoading}
                progress={importProgress}
            />

            <AddMediaModal
                isOpen={isAddMediaModalOpen}
                onClose={closeAddMediaModal}
                onAdd={handleAddMedia}
                isLoading={isLoading}
                events={allEvents}
            />

            <MediaViewerModal
                isOpen={isMediaViewerOpen}
                onClose={closeMediaViewer}
                media={selectedMedia}
            />

            <div
                className="min-h-screen animate-fade-in-up"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                    paddingBottom: "40px",
                }}
            >
                <main style={{ padding: "0 15px" }}>
                    <div className="page-header-wrapper">
                        <button className="btn-back" onClick={handleGoBack}>
                            <IconArrowLeft /> Retour
                        </button>
                        <div className="tabs-container-header">
                            <button
                                className={`tab-btn-header ${activeTab === "programmes" ? "active" : ""}`}
                                onClick={() => setActiveTab("programmes")}
                            >
                                <IconActivity /> Programmes
                            </button>
                            <button
                                className={`tab-btn-header ${activeTab === "historique" ? "active" : ""}`}
                                onClick={() => setActiveTab("historique")}
                            >
                                <IconHistory /> Historique
                            </button>
                            <button
                                className={`tab-btn-header ${activeTab === "parcours" ? "active" : ""}`}
                                onClick={() => setActiveTab("parcours")}
                            >
                                <IconRoadmap /> Galerie
                            </button>
                        </div>
                    </div>

                    {renderContent()}
                </main>
            </div>
        </>
    );
}
