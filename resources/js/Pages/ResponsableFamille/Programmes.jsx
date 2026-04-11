// pages/Famille/Programmes.jsx
import React, { useState } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";

// --- STYLES INTÉGRÉS (Identiques au design Conducteur) ---
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
.animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* Global buttons (Désactivés pour le view-only) */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    border: 1px solid transparent;
    gap: 0.5rem;
    cursor: pointer;
}
.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
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
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-decoration: none;
}
.btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Header */
.page-header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 4px auto 30px;
    max-width: 1200px;
    position: relative;
}
.btn-back {
    flex-shrink: 0;
}
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

/* Conteneur blanc glass */
.glass-container {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    padding: 20px;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Layout principal */
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
    flex-direction: column;
    gap: 20px;
}

/* Scroller horizontal */
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
.cards-wrapper {
    display: flex;
    gap: 25px;
    padding: 5px 10px;
}

/* Special Card */
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
    top: 0; left: 0; width: 100%; height: 6px;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    border-top-left-radius: 20px; border-top-right-radius: 20px;
}
.special-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
}
.special-date {
    background: #ec4899; color: white; padding: 8px 16px;
    border-radius: 50px; font-weight: 700; font-size: 0.85rem;
    text-transform: uppercase; letter-spacing: 1px;
    box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
}
.special-title {
    font-size: 1.4rem; color: #111827; margin-bottom: 15px;
    font-weight: 800; line-height: 1.2; padding-right: 35px;
}
.special-lieu {
    color: #6b7280; font-size: 1rem; margin-bottom: 15px; line-height: 1.6;
}
.special-meta {
    display: flex; flex-direction: column; gap: 8px;
    margin-top: 10px; padding-top: 15px; border-top: 1px solid #e5e7eb;
}
.special-meta-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.9rem; color: #374151;
}
.special-meta-label {
    font-weight: 600; color: #6b7280; min-width: 120px;
}

/* Historical Card */
.historical-card {
    flex: 0 0 auto; width: 320px; background: #f9fafb;
    padding: 30px; border-radius: 20px; border: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex; flex-direction: column; justify-content: space-between;
    transition: var(--transition); height: 100%; position: relative; opacity: 0.9;
}
.historical-card:hover {
    transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); opacity: 1;
}
.historical-card::before {
    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
    background: #9ca3af; border-top-left-radius: 20px; border-top-right-radius: 20px;
}
.historical-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
}
.historical-date {
    background: #9ca3af; color: white; padding: 6px 12px;
    border-radius: 50px; font-weight: 700; font-size: 0.75rem;
    text-transform: uppercase; letter-spacing: 1px;
}
.historical-title {
    font-size: 1.3rem; color: #374151; margin-bottom: 15px; font-weight: 700; line-height: 1.2;
}
.historical-lieu {
    color: #6b7280; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.5;
}
.historical-meta {
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 10px; padding-top: 12px; border-top: 1px solid #e5e7eb;
}
.historical-meta-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.85rem; color: #374151;
}
.historical-meta-label {
    font-weight: 600; color: #6b7280; min-width: 100px;
}

/* Media Cards */
.media-card {
    flex: 0 0 auto; width: 320px; background: white; border-radius: 20px;
    overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: var(--transition); cursor: pointer; position: relative;
}
.media-card:hover {
    transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.media-thumbnail {
    position: relative; height: 200px; overflow: hidden;
}
.media-thumbnail img {
    width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;
}
.media-card:hover .media-thumbnail img {
    transform: scale(1.05);
}
.media-play-icon {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7); border-radius: 50%;
    width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;
    color: white; opacity: 0; transition: opacity 0.3s ease;
}
.media-card:hover .media-play-icon {
    opacity: 1;
}
.media-badge {
    position: absolute; top: 10px; right: 10px;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
    padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;
    color: white; display: flex; align-items: center; gap: 4px;
}
.media-info {
    padding: 15px;
}
.media-title {
    font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 5px;
}
.media-date {
    font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 4px;
}

/* Mini Calendar */
.mini-calendar {
    background: white; color: #1f2937; padding: 25px; border-radius: 20px;
    box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.6); width: 100%;
}
.cal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}
.cal-month-year {
    font-weight: 800; color: var(--primary); font-size: 1.1rem; letter-spacing: 1px;
}
.cal-nav-btn {
    background: rgba(37, 99, 235, 0.1); border: none; border-radius: 50%;
    width: 32px; height: 32px; cursor: pointer; font-size: 1.2rem;
    font-weight: bold; color: var(--primary); transition: all 0.2s;
    display: inline-flex; align-items: center; justify-content: center;
}
.cal-nav-btn:hover {
    background: var(--primary); color: white; transform: scale(1.05);
}
.cal-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center;
}
.cal-day-label {
    font-size: 0.75rem; color: #9ca3af; font-weight: 700; padding-bottom: 10px; text-transform: uppercase;
}
.cal-day {
    font-size: 0.9rem; padding: 8px 0; border-radius: 8px;
    color: #1f2937; transition: all 0.2s; cursor: default; font-weight: 600;
}
.cal-day:hover:not(.empty) { background: #f3f4f6; }
.cal-day.today {
    background-color: var(--primary); color: white; font-weight: 800;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}
.cal-day.has-event {
    background-color: rgba(245, 158, 11, 0.1); color: var(--warning);
    border: 1px solid rgba(245, 158, 11, 0.3); position: relative;
}
.cal-day.has-event::after {
    content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
    width: 4px; height: 4px; background: var(--warning); border-radius: 50%;
}
.cal-day.empty { background: transparent; }

/* Archive Card */
.archive-card {
    background: #f97316; border-radius: 20px; padding: 25px; border: none;
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3); color: white;
    display: flex; flex-direction: column; justify-content: space-between; width: 100%;
}
.archive-card .cal-header {
    color: white; justify-content: center; gap: 10px; margin-bottom: 20px;
}
.archive-card .cal-month-year {
    color: white; display: flex; align-items: center; gap: 8px;
}
.archive-stats {
    text-align: center; margin-top: 10px; font-size: 0.9rem;
    font-weight: 600; color: rgba(255, 255, 255, 0.9); margin-bottom: 5px;
}
.archive-footer {
    margin-top: 15px; text-align: center;
}
.archive-btn-more {
    background: white; color: #f97316; border: none; padding: 10px 20px;
    border-radius: 12px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
    width: 100%; text-align: center; font-weight: 700; display: inline-flex;
    align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.archive-btn-more:hover {
    background: #fff7ed; transform: translateY(-1px); box-shadow: 0 6px 10px rgba(0,0,0,0.15);
}

/* Empty Dialog */
.empty-dialog {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px; padding: 48px 32px; text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); margin: 20px 0;
    position: relative; overflow: hidden; animation: float 3s ease-in-out infinite;
}
.empty-dialog::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
}
.empty-dialog-icon {
    font-size: 5rem; margin-bottom: 1.5rem; display: inline-block; animation: pulse 2s ease-in-out infinite;
}
.empty-dialog-title {
    font-size: 1.8rem; font-weight: 800; color: white; margin-bottom: 0.75rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.empty-dialog-message {
    color: rgba(255, 255, 255, 0.95); font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6;
}

/* Modal Viewer */
.modal-overlay {
    position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px); z-index: 1000; display: flex;
    align-items: center; justify-content: center; animation: fadeIn 0.2s ease;
}
.modal-content {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);
    width: 95%; max-width: 900px; max-height: 90vh;
    border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column; overflow: hidden;
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(255, 255, 255, 0.5);
}
@keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
.modal-header {
    padding: 1.5rem 2rem; border-bottom: 1px solid rgba(229, 231, 235, 0.5);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; display: flex; justify-content: space-between; align-items: center;
}
.modal-header h2 {
    font-weight: 700; font-size: 1.5rem; margin: 0; color: white;
}
.modal-header button {
    background: white; border: none; border-radius: 50%;
    width: 2.5rem; height: 2.5rem; display: flex; align-items: center;
    justify-content: center; color: #374151; transition: all 0.2s; cursor: pointer;
}
.modal-header button:hover {
    background: #f3f4f6; transform: scale(1.1);
}
.modal-body {
    padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column;
}
.media-viewer {
    width: 100%; display: flex; flex-direction: column;
}
.media-viewer img, .media-viewer video {
    width: 100%; max-height: 70vh; object-fit: contain; background: black;
}
.media-viewer-info {
    padding: 1.5rem; background: white;
}

/* Action Bar */
.action-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: white; padding: 1rem 1.5rem; border-radius: 1rem;
    margin-bottom: 2rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef2ff;
}
.action-bar h2 {
    font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0;
}

/* Responsive */
@media (max-width: 900px) {
    .main-layout { flex-direction: column; }
    .cards-container { flex: auto; width: 100%; }
    .calendar-container { width: 100%; max-width: 100%; position: static; }
    .glass-container { padding: 15px; }
    .page-header-wrapper { flex-direction: column; align-items: stretch; position: relative; }
    .btn-back { width: auto; justify-content: center; margin-bottom: 0.5rem; }
    .tabs-container-header { position: relative; left: 0; transform: none; justify-content: center; width: 100%; }
}
@media (max-width: 600px) {
    .action-bar { flex-direction: column; gap: 1rem; text-align: center; }
    .action-bar h2 { font-size: 1.3rem; }
    .empty-dialog { padding: 32px 24px; }
    .empty-dialog-title { font-size: 1.4rem; }
    .empty-dialog-icon { font-size: 3.5rem; }
    .tab-btn-header { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
    .special-card, .media-card { width: 280px; padding: 20px; }
    .special-title { font-size: 1.2rem; }
    .btn-view-more { width: 100%; justify-content: center; }
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
                {daysOfWeek.map((d) => (
                    <div key={d} className="cal-day-label">
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

// Modal pour afficher les médias en grand (Seul modal conservé pour la vue)
const MediaViewerModal = ({ isOpen, onClose, media }) => {
    if (!isOpen || !media) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

// --- PAGE PRINCIPALE (FAMILLE) ---
export default function Programmes() {
    const { props } = usePage();
    const {
        initialClassList = [],
        initialClassHistory = [],
        galleryMedia = [],
    } = props;

    const [activeTab, setActiveTab] = useState("programmes");
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

    // Récupérer toutes les dates d'événements pour le calendrier
    const getAllEventDates = () => {
        const allEvents = [...initialClassList, ...initialClassHistory];
        return allEvents.map((event) => {
            const date = new Date(event.date);
            return date.toISOString().split("T")[0];
        });
    };

    const openMediaViewer = (media) => {
        setSelectedMedia(media);
        setIsMediaViewerOpen(true);
    };

    const closeMediaViewer = () => {
        setSelectedMedia(null);
        setIsMediaViewerOpen(false);
    };

    const handleGoBack = () => {
        router.visit(withBasePath("", "/famille/dashboard"));
    };

    const renderContent = () => {
        switch (activeTab) {
            case "programmes":
                return (
                    <>
                        <div className="action-bar">
                            <h2>
                                🔥 ACTIVITÉS À VENIR
                                <span
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "#6b7280",
                                        marginLeft: "10px",
                                        fontWeight: "400",
                                    }}
                                >
                                    {initialClassList.length} activité
                                    {initialClassList.length !== 1 ? "s" : ""}
                                </span>
                            </h2>
                            {/* PAS DE BOUTONS D'ACTION POUR LE RESPONSABLE */}
                        </div>

                        <div className="glass-container">
                            <div className="main-layout">
                                <div className="cards-container">
                                    {initialClassList.length > 0 ? (
                                        <div className="horizontal-scroller">
                                            <div className="cards-wrapper">
                                                {initialClassList.map(
                                                    (event) => (
                                                        <div
                                                            key={event.id}
                                                            className="special-card"
                                                        >
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
                                        <div className="empty-dialog">
                                            <div className="empty-dialog-icon">
                                                📋
                                            </div>
                                            <div className="empty-dialog-title">
                                                Aucune activité à venir
                                            </div>
                                            <div className="empty-dialog-message">
                                                Il n'y a actuellement aucun
                                                programme prévu pour votre
                                                classe.
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="calendar-container">
                                    <MiniCalendar
                                        eventsDates={getAllEventDates()}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case "historique":
                return (
                    <>
                        <div className="action-bar">
                            <h2>📜 HISTORIQUE DES ACTIVITÉS</h2>
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
                    </>
                );

            case "parcours":
                return (
                    <>
                        <div className="action-bar">
                            <h2>📸 GALERIE PHOTOS & VIDEOS</h2>
                        </div>
                        <div className="glass-container">
                            <div className="main-layout">
                                <div className="cards-container">
                                    {galleryMedia.length > 0 ? (
                                        <div className="horizontal-scroller">
                                            <div className="cards-wrapper">
                                                {galleryMedia.map((media) => (
                                                    <div
                                                        key={media.id}
                                                        className="media-card"
                                                        onClick={() =>
                                                            openMediaViewer(
                                                                media,
                                                            )
                                                        }
                                                    >
                                                        <div className="media-thumbnail">
                                                            <img
                                                                src={
                                                                    media.type ===
                                                                    "video"
                                                                        ? media.thumbnail ||
                                                                          media.url
                                                                        : media.url
                                                                }
                                                                alt={
                                                                    media.title
                                                                }
                                                            />
                                                            {media.type ===
                                                                "video" && (
                                                                <div className="media-play-icon">
                                                                    <IconPlay />
                                                                </div>
                                                            )}
                                                            <div className="media-badge">
                                                                {media.type ===
                                                                "video" ? (
                                                                    <IconVideo />
                                                                ) : (
                                                                    <IconPhoto />
                                                                )}
                                                                {media.type ===
                                                                "video"
                                                                    ? "Vidéo"
                                                                    : "Photo"}
                                                            </div>
                                                        </div>
                                                        <div className="media-info">
                                                            <h4 className="media-title">
                                                                {media.title}
                                                            </h4>
                                                            <p className="media-date">
                                                                <IconCalendar
                                                                    style={{
                                                                        width: "12px",
                                                                        height: "12px",
                                                                    }}
                                                                />
                                                                {new Date(
                                                                    media.date,
                                                                ).toLocaleDateString(
                                                                    "fr-FR",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "long",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="empty-dialog">
                                            <div className="empty-dialog-icon">
                                                📸
                                            </div>
                                            <div className="empty-dialog-title">
                                                Galerie Vide
                                            </div>
                                            <div className="empty-dialog-message">
                                                Aucun média n'a été partagé pour
                                                le moment.
                                            </div>
                                        </div>
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
                                                <IconRoadmap /> Médiathèque
                                            </span>
                                        </div>
                                        <div className="archive-stats">
                                            {galleryMedia.length} Médias
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
                                                galleryMedia.filter(
                                                    (m) => m.type === "photo",
                                                ).length
                                            }{" "}
                                            Photos •{" "}
                                            {
                                                galleryMedia.filter(
                                                    (m) => m.type === "video",
                                                ).length
                                            }{" "}
                                            Vidéos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        <Link
                            href={withBasePath("", "/famille/dashboard")}
                            className="btn-back"
                        >
                            <IconArrowLeft /> Retour
                        </Link>
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
