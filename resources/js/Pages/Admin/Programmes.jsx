// resources/js/Pages/Admin/Programmes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';

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
.animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

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

/* Tabs glassmorphism */
.tabs-nav {
    display: flex;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    padding: 8px;
    border-radius: 16px;
    margin: 4px auto 40px;
    max-width: 800px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid var(--glass-border);
}
.tab-btn {
    flex: 1;
    padding: 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    color: #6b7280;
    transition: var(--transition);
    border-radius: 12px;
    position: relative;
    z-index: 2;
}
.tab-btn:hover {
    color: var(--primary);
}
.tab-btn.active {
    background: white;
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    font-weight: 700;
}

/* Tab Content */
.tab-content { display: none; animation: fadeIn 0.5s ease; }
.tab-content.active { display: block; }

/* Section Divider (gardé pour d'éventuelles utilisations) */
.section-divider {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;
    padding: 0 10px;
}
.section-divider h3 {
    color: #1f2937;
    font-size: 1.4rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.btn-section {
    background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition);
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
}
.btn-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    filter: brightness(1.1);
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

/* Permanent Layout (à l'intérieur du conteneur) */
.permanent-layout {
    display: flex;
    gap: 30px;
    align-items: flex-start;
}
.permanent-content {
    flex: 1;
    min-width: 0;
}

/* Horizontal scroll cards */
.grid-cards {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 25px;
    padding: 10px 5px 20px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}
.grid-cards::-webkit-scrollbar {
    display: none;
}

/* Card glass style */
.card {
    flex: 0 0 auto;
    width: 320px;
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    overflow: hidden;
    transition: var(--transition);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    scroll-snap-align: start;
}
.card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
    border-color: rgba(255,255,255,0.8);
    z-index: 10;
}
.card.active {
    border: 2px solid var(--primary);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15), 0 20px 40px -5px rgba(0,0,0,0.1);
}

.card-img-wrapper {
    height: 180px;
    width: 100%;
    overflow: hidden;
    position: relative;
}
.card-img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.card:hover .card-img {
    transform: scale(1.1);
}
.card-img-overlay {
    position: absolute;
    top: 15px;
    left: 15px;
    background: rgba(37, 99, 235, 0.85);
    backdrop-filter: blur(4px);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.card.tag-classes .card-img-overlay {
    background: rgba(37, 99, 235, 0.85);
}
.card-body {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
}
.card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}
.card-title {
    font-size: 1.25rem;
    color: #2563eb;
    margin: 0;
    font-weight: 700;
    line-height: 1.3;
}
.card-next-date {
    font-size: 0.8rem;
    font-weight: 700;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    padding: 6px 10px;
    border-radius: 8px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.card-desc {
    font-size: 0.95rem;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 0;
    flex: 1;
}

/* Agenda Sidebar - mêmes dimensions que les cartes */
.agenda-sidebar {
    width: 320px;
    flex-shrink: 0;
}
.agenda-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    box-shadow: var(--shadow-lg);
    transition: var(--transition);
    padding: 24px;
    display: flex;
    flex-direction: column;
    min-height: 400px;
}
.agenda-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
    border-color: rgba(255,255,255,0.8);
}
.agenda-card h4 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary);
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(0,0,0,0.1);
    text-transform: uppercase;
    letter-spacing: 1px;
}
.slider-container {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.slider-viewport {
    overflow: hidden;
    width: 100%;
    height: 100%;
}
.slider-track {
    display: flex;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    height: 100%;
}
.agenda-item {
    min-width: 100%;
    box-sizing: border-box;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.slider-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    color: var(--primary);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: var(--transition);
    font-size: 1rem;
}
.slider-btn:hover {
    transform: translateY(-50%) scale(1.1);
    background: var(--primary);
    color: white;
}
.slider-btn.prev-btn { left: -18px; }
.slider-btn.next-btn { right: -18px; }

/* Agenda Slide Content */
.agenda-slide-content {
    background: white;
    border-radius: 16px;
    padding: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    position: relative;
    overflow: hidden;
}
.agenda-slide-content::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary);
}
.agenda-tag {
    align-self: flex-start;
    font-size: 0.7rem;
    padding: 3px 10px;
    border-radius: 20px;
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.agenda-time-wrapper {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
}
.agenda-time {
    font-weight: 800;
    color: #111827;
    font-size: 1.5rem;
    line-height: 1;
}
.agenda-date {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 600;
}
.agenda-info {
    font-size: 0.9rem;
    line-height: 1.4;
    color: #1f2937;
}
.agenda-info strong {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 6px;
}
.agenda-roles {
    font-size: 0.75rem;
    line-height: 1.6;
    margin-top: 8px;
    background: #f8fafc;
    padding: 12px;
    border-radius: 12px;
}
.agenda-role-item {
    display: flex;
    gap: 8px;
    align-items: baseline;
}
.role-label {
    color: #9ca3af;
    min-width: 70px;
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: 600;
}
.role-name {
    color: #1f2937;
    font-weight: 500;
}

/* Split Layout (special events) - à l'intérieur du conteneur glass */
.layout-split-wrapper {
    display: flex;
    gap: 30px;
    align-items: flex-start;
}
.split-content {
    flex: 1;
}
.special-grid {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 25px;
    padding: 5px;
    scrollbar-width: none;
}
.special-grid::-webkit-scrollbar {
    display: none;
}
.special-card {
    flex: 0 0 auto;
    width: 320px;
    background: white;
    padding: 30px;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: var(--transition);
    scroll-snap-align: start;
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
}
.special-desc {
    color: #6b7280;
    font-size: 1rem;
    margin-bottom: 25px;
    line-height: 1.6;
}
.special-link {
    color: var(--primary);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: gap 0.2s;
}
.special-link:hover {
    gap: 10px;
    color: #8b5cf6;
}
.split-sidebar {
    width: 320px;
    flex-shrink: 0;
    position: sticky;
    top: 90px;
}

/* Historical cards - style atténué */
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
.historical-desc {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 20px;
    line-height: 1.5;
}
.historical-link {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: gap 0.2s;
}
.historical-link:hover {
    gap: 8px;
    color: #1d4ed8;
}

/* Mini Calendar avec navigation manuelle */
.mini-calendar {
    background: white;
    color: #1f2937;
    padding: 25px;
    border-radius: 20px;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255,255,255,0.6);
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
.modal-overlay.closing {
    animation: fadeOut 0.2s ease forwards;
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
@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}
@keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
@keyframes scaleOut {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.95); opacity: 0; }
}
.modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
    background: #fbbf24;
    color: #1f2937;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h2 {
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
.modal-actions {
    padding: 20px 30px 30px;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    border-top: 1px solid rgba(0,0,0,0.05);
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
.btn-add:active {
    transform: translateY(0);
}

/* BARRES COMMUNES */
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
.action-bar h1,
.action-bar h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

/* Boutons jaune orangé */
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
    filter: brightness(1.05);
}

/* Responsive */
@media (max-width: 900px) {
    .glass-container {
        padding: 15px;
    }
    .permanent-layout {
        flex-direction: column;
    }
    .layout-split-wrapper {
        flex-direction: column;
    }
    .agenda-sidebar, .split-sidebar {
        width: 100%;
        position: static;
        margin-top: 20px;
    }
    .slider-btn {
        display: none;
    }
    .slider-track {
        overflow-x: auto;
        scroll-snap-type: x mandatory;
    }
    .agenda-item {
        scroll-snap-align: center;
    }
}
@media (max-width: 600px) {
    .tabs-nav {
        flex-direction: column;
        border-radius: 12px;
    }
    .tab-btn {
        border-bottom: 1px solid rgba(0,0,0,0.05);
        text-align: left;
    }
    .tab-btn.active {
        border-radius: 8px;
    }
    .modal-form-grid {
        grid-template-columns: 1fr;
    }
    .modal-full {
        grid-column: auto;
    }
    .modal-box {
        width: 95%;
        border-radius: 20px;
    }
    .section-divider {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }
    .btn-section {
        width: 100%;
        justify-content: center;
    }
    .action-bar {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    .action-bar h1,
    .action-bar h2 {
        font-size: 1.3rem;
    }
    .glass-container {
        padding: 12px;
    }
}
`;

// --- DONNÉES INITIALES (inchangées) ---
const initialParishSchedule = [
  { id: 'mass1', type: 'mass', tag: 'Culte', day: 'Dimanche', time: '09h30', title: 'Café & Prière', roles: { speaker: 'P. Jean', prayer: 'Sœur Anne', master: 'Michel D.', choir: 'Groupe Louange' } },
  { id: 'mass2', type: 'mass', tag: 'Culte', day: 'Dimanche', time: '10h30', title: 'Messe Principale', roles: { speaker: 'P. Jean', prayer: 'P. Marc', master: 'Jacques D.', choir: 'Chœur Saint-Cecile' } },
  { id: 'charity1', type: 'charity', tag: 'Social', day: 'Mercredi', time: '14h00', title: 'Épicerie Solidaire', roles: { speaker: 'Resp. Bénévoles', prayer: '-', master: 'Équipe d\'accueil', choir: '-' } },
  { id: 'youth1', type: 'youth', tag: 'Jeunes', day: 'Samedi', time: '18h00', title: 'Groupe Lycéens', roles: { speaker: 'P. Marc', prayer: 'Sarah', master: 'Thomas', choir: 'Groupe Jeunes' } }
];
const initialClassSchedule = [
  { id: 'class1', type: 'eveil', tag: 'Primaire', day: 'Samedi', time: '10h00', title: 'Éveil à la foi', roles: { speaker: 'Claire', prayer: 'Parents', master: '-', choir: '-' } },
  { id: 'class2', type: 'catechese', tag: 'CM1-CM2', day: 'Mercredi', time: '16h30', title: 'Catéchèse', roles: { speaker: 'Marie-Lou', prayer: '-', master: '-', choir: 'Enfants' } },
  { id: 'class3', type: 'catechese', tag: 'CM1-CM2', day: 'Mercredi', time: '17h15', title: 'Partage', roles: { speaker: 'P. Jean', prayer: '-', master: '-', choir: '-' } },
  { id: 'class4', type: 'aumonerie', tag: 'Collège', day: 'Vendredi', time: '18h30', title: 'Aumônerie', roles: { speaker: 'P. Marc', prayer: 'Léa', master: 'Camille', choir: 'Groupe Jeunes' } }
];

// Données historiques (exemples)
const parishHistory = [
  { id: 1, date: '15 Mars 2025', title: 'Carême Solidaire', description: 'Collecte de denrées et partage fraternel.', link: '#' },
  { id: 2, date: '1 Février 2025', title: 'Veillée de Prière', description: 'Soirée de louange et d’intercession.', link: '#' },
  { id: 3, date: '25 Décembre 2024', title: 'Messe de Noël', description: 'Célébration de la Nativité.', link: '#' },
];
const classHistory = [
  { id: 1, date: '10 Mars 2025', title: 'Retraite de Carême', description: 'Week-end spirituel pour les confirmands.', link: '#' },
  { id: 2, date: '5 Février 2025', title: 'Atelier Catéchèse', description: 'Jeux et enseignements sur la foi.', link: '#' },
  { id: 3, date: '20 Décembre 2024', title: 'Spectacle de Noël', description: 'Représentation par les enfants.', link: '#' },
];

// --- ICONS ---
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

// --- COMPOSANTS ---
const SectionDivider = ({ title, buttonLabel, onButtonClick }) => (
  <div className="section-divider">
    <h3>{title}</h3>
    {buttonLabel && (
      <button className="btn-section" onClick={onButtonClick}>
        <IconPlus /> {buttonLabel}
      </button>
    )}
  </div>
);

const AgendaSlider = ({ items }) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const nextSlide = () => setIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

  useEffect(() => {
    if (items.length <= 1) return;
    if (!isPaused) {
      intervalRef.current = setInterval(nextSlide, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [index, isPaused, items.length]);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  if (!items || items.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Aucun événement prévu.</div>;

  return (
    <div className="slider-container" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <button className="slider-btn prev-btn" onClick={prevSlide}>&#10094;</button>
      <div className="slider-viewport">
        <div className="slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {items.map((evt, i) => (
            <div key={i} className="agenda-item">
              <div className="agenda-slide-content">
                <span className="agenda-tag">{evt.tag}</span>
                <div className="agenda-time-wrapper">
                  <span className="agenda-time">{evt.time}</span>
                  <span className="agenda-date">{evt.day}</span>
                </div>
                <div className="agenda-info">
                  <strong>{evt.title}</strong>
                  <div className="agenda-roles">
                    <div className="agenda-role-item"><span className="role-label">Orateur:</span> <span className="role-name">{evt.roles.speaker}</span></div>
                    <div className="agenda-role-item"><span className="role-label">Dirigeant:</span> <span className="role-name">{evt.roles.prayer}</span></div>
                    <div className="agenda-role-item"><span className="role-label">Cérémonie:</span> <span className="role-name">{evt.roles.master}</span></div>
                    <div className="agenda-role-item"><span className="role-label">Chorale:</span> <span className="role-name">{evt.roles.choir}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="slider-btn next-btn" onClick={nextSlide}>&#10095;</button>
    </div>
  );
};

const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([1, 11, 24]); // exemples, jours avec événements

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    // jours du mois précédent pour remplir le début
    const startPadding = firstDay.getDay(); // 0 = dimanche, mais on veut lundi = 0
    const padCount = (startPadding === 0 ? 6 : startPadding - 1); // adapter pour lundi comme premier jour
    for (let i = padCount; i > 0; i--) {
      const d = new Date(year, month, -i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // compléter pour avoir 42 cases (6 lignes)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  };

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (date) => date.toDateString() === today.toDateString();

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={goToPreviousMonth}>‹</button>
        <span className="cal-month-year">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button className="cal-nav-btn" onClick={goToNextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {daysOfWeek.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`cal-day ${!day.isCurrentMonth ? 'empty' : ''} ${isToday(day.date) ? 'today' : ''} ${events.includes(day.date.getDate()) && day.isCurrentMonth ? 'has-event' : ''}`}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

const AgendaModal = ({ isOpen, onClose, onSave, context }) => {
  if (!isOpen) return null;
  const [formData, setFormData] = useState({
    type: context === 'parish' ? 'mass' : 'eveil',
    date: '',
    theme: '',
    time: '',
    speaker: '',
    president: '',
    leader: '',
    choir: ''
  });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); onClose(); };

  const typeOptions = context === 'parish'
    ? [{ value: 'mass', label: 'Messe / Culte' }, { value: 'charity', label: 'Social / Solidaire' }, { value: 'youth', label: 'Jeunes' }, { value: 'other', label: 'Autre' }]
    : [{ value: 'eveil', label: 'Éveil à la foi' }, { value: 'catechese', label: 'Catéchèse' }, { value: 'aumonerie', label: 'Aumônerie' }];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer l'ordre du jour</h2>
          <button onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-form-grid">
              <div className="form-group"><label>Type de programme</label><select name="type" value={formData.type} onChange={handleChange} required>{typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div className="form-group"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required /></div>
              <div className="form-group"><label>Heure</label><input type="time" name="time" value={formData.time} onChange={handleChange} required /></div>
              <div className="form-group modal-full"><label>Thème / Titre</label><input type="text" name="theme" placeholder="Ex: Messe de l'Avent" value={formData.theme} onChange={handleChange} required /></div>
              <div className="form-group"><label>Orateur</label><input type="text" name="speaker" value={formData.speaker} onChange={handleChange} /></div>
              <div className="form-group"><label>Personne présidant</label><input type="text" name="president" value={formData.president} onChange={handleChange} /></div>
              <div className="form-group"><label>Dirigeant(e)</label><input type="text" name="leader" value={formData.leader} onChange={handleChange} /></div>
              <div className="form-group"><label>Chorale</label><input type="text" name="choir" value={formData.choir} onChange={handleChange} /></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn-add">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EventPlannerModal = ({ isOpen, onClose, onSave, context }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    category: context === 'parish' ? 'culte' : 'CM1',
    desc: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{context === 'parish' ? 'Planifier un Événement' : 'Planifier une Séance'}</h2>
          <button onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-form-grid">
              <div className="form-group modal-full">
                <label>{context === 'parish' ? "Titre de l'événement" : 'Activité / Titre'}</label>
                <span className="input-icon"><IconEdit /></span>
                <input type="text" name="title" placeholder={context === 'parish' ? "Ex: Assemblée générale" : "Ex: Sortie nature"} value={formData.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <span className="input-icon"><IconCalendar /></span>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Heure</label>
                <span className="input-icon"><IconClock /></span>
                <input type="time" name="time" value={formData.time} onChange={handleChange} required />
              </div>
              <div className="form-group modal-full">
                <label>{context === 'parish' ? "Type d'événement" : 'Classe / Groupe'}</label>
                <span className="input-icon"><IconTag /></span>
                {context === 'parish' ? (
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="culte">Culte / Prière</option>
                    <option value="social">Social / Partage</option>
                    <option value="reunion">Réunion</option>
                    <option value="sortie">Sortie / Voyage</option>
                  </select>
                ) : (
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="CM1">Classe CM1</option>
                    <option value="CM2">Classe CM2</option>
                    <option value="6eme">Classe 6ème</option>
                    <option value="Aumônerie">Aumônerie Collège</option>
                  </select>
                )}
              </div>
              <div className="form-group modal-full">
                <label>{context === 'parish' ? 'Détails' : 'Lieu / Notes'}</label>
                <span className="input-icon" style={{ top: '42px' }}><IconEdit /></span>
                <textarea name="desc" rows="3" placeholder={context === 'parish' ? "Informations complémentaires..." : "Rendez-vous, matériel à prévoir..."} value={formData.desc} onChange={handleChange}></textarea>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-add" onClick={(e) => { e.preventDefault(); document.querySelector('form').requestSubmit(); }}>
            <IconPlus /> Ajouter au programme
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PAGE PRINCIPALE ---
export default function Programmes() {
  const [activeTab, setActiveTab] = useState('parish');
  const [parishFilter, setParishFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const [parishSchedule, setParishSchedule] = useState(initialParishSchedule);
  const [classSchedule, setClassSchedule] = useState(initialClassSchedule);
  const [parishList, setParishList] = useState([]);
  const [classList, setClassList] = useState([]);

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaModalContext, setAgendaModalContext] = useState('parish');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventModalContext, setEventModalContext] = useState('parish');

  const openAgendaModal = (type) => { setAgendaModalContext(type); setIsAgendaModalOpen(true); };
  const closeAgendaModal = () => setIsAgendaModalOpen(false);
  const handleSaveAgendaModal = (data) => {
    const getDayName = (dateStr) => {
      const date = new Date(dateStr);
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return days[date.getDay()] || 'Date';
    };
    const getTag = (type) => {
      const map = { mass: 'Culte', charity: 'Social', youth: 'Jeunes', other: 'Autre', eveil: 'Primaire', catechese: 'Élémentaire', aumonerie: 'Collège' };
      return map[type] || 'Activité';
    };
    const newItem = {
      id: Date.now(),
      type: data.type,
      tag: getTag(data.type),
      day: getDayName(data.date),
      time: data.time,
      title: data.theme,
      roles: {
        speaker: data.speaker || '-',
        prayer: data.president || '-',
        master: data.leader || '-',
        choir: data.choir || '-'
      }
    };
    if (agendaModalContext === 'parish') setParishSchedule([...parishSchedule, newItem]);
    else setClassSchedule([...classSchedule, newItem]);
  };

  const openEventModal = (type) => { setEventModalContext(type); setIsEventModalOpen(true); };
  const closeEventModal = () => setIsEventModalOpen(false);
  const handleSaveEventModal = (data) => {
    const newItem = {
      id: Date.now(),
      title: data.title,
      date: data.date,
      time: data.time,
      type: eventModalContext === 'parish' ? data.category : 'classe',
      label: eventModalContext === 'classes' ? data.category : '',
      desc: data.desc
    };
    if (eventModalContext === 'parish') setParishList([...parishList, newItem]);
    else setClassList([...classList, newItem]);
  };

  return (
    <>
      <Head title="Programme et Activités" />
      <style>{styles}</style>

      <AgendaModal isOpen={isAgendaModalOpen} onClose={closeAgendaModal} onSave={handleSaveAgendaModal} context={agendaModalContext} />
      <EventPlannerModal isOpen={isEventModalOpen} onClose={closeEventModal} onSave={handleSaveEventModal} context={eventModalContext} />

      <div className="min-h-screen animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)", paddingBottom: '40px' }}>
        <main style={{ padding: '0 15px' }}>
          <div className="tabs-nav">
            <button className={`tab-btn ${activeTab === 'parish' ? 'active' : ''}`} onClick={() => setActiveTab('parish')}>
              Programmes et Activités paroissiales
            </button>
            <button className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
              Programmes et Activités des classes
            </button>
          </div>

          {activeTab === 'parish' && (
            <div className="tab-content active">
              <div className="action-bar">
                <h1>🏛️ Nos Activités Permanentes</h1>
                <button className="btn-agenda" onClick={() => openAgendaModal('parish')}>
                  <IconPlus /> Crée l'ordre du jour
                </button>
              </div>

              <div className="glass-container">
                <div className="permanent-layout">
                  <div className="permanent-content">
                    <div className="grid-cards">
                      <div className={`card ${parishFilter === 'all' ? 'active' : ''}`} onClick={() => setParishFilter('all')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/church/400/250" alt="Semaine" className="card-img" />
                          <div className="card-img-overlay">Vue Globale</div>
                        </div>
                        <div className="card-body">
                          <div className="card-header-row"><h4 className="card-title">Semaine Complète</h4></div>
                          <p className="card-desc">Toutes les activités de la semaine.</p>
                        </div>
                      </div>
                      <div className={`card ${parishFilter === 'mass' ? 'active' : ''}`} onClick={() => setParishFilter('mass')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/mass/400/250" alt="Messe" className="card-img" />
                          <div className="card-img-overlay">Culte</div>
                        </div>
                        <div className="card-body">
                          <div className="card-header-row"><h4 className="card-title">Messes Dominicales</h4><span className="card-next-date">Dim 12/11</span></div>
                          <p className="card-desc">Célébration hebdomadaire du dimanche.</p>
                        </div>
                      </div>
                      <div className={`card ${parishFilter === 'charity' ? 'active' : ''}`} onClick={() => setParishFilter('charity')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/charity/400/250" alt="Solidaire" className="card-img" />
                          <div className="card-img-overlay">Social</div>
                        </div>
                        <div className="card-body">
                          <div className="card-header-row"><h4 className="card-title">Épicerie Solidaire</h4><span className="card-next-date">Mer 14h</span></div>
                          <p className="card-desc">Distribution de denrées aux familles.</p>
                        </div>
                      </div>
                      <div className={`card ${parishFilter === 'youth' ? 'active' : ''}`} onClick={() => setParishFilter('youth')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/youth/400/250" alt="Jeunes" className="card-img" />
                          <div className="card-img-overlay">Jeunes</div>
                        </div>
                        <div className="card-body">
                          <div className="card-header-row"><h4 className="card-title">Groupe Lycéens</h4><span className="card-next-date">Sam 18h</span></div>
                          <p className="card-desc">Rencontres mensuelles de partage.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="agenda-sidebar">
                    <div className="agenda-card">
                      <h4>📅 Ordre du jour</h4>
                      <AgendaSlider items={parishFilter === 'all' ? parishSchedule : parishSchedule.filter(e => e.type === parishFilter)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-bar">
                <h2>✨ Programmes Particuliers</h2>
                <button className="btn-agenda" onClick={() => openEventModal('parish')}>
                  <IconPlus /> Programmer une Activité
                </button>
              </div>

              <div className="glass-container">
                <div className="layout-split-wrapper">
                  <div className="split-content">
                    <div className="special-grid">
                      <div className="special-card">
                        <div><div className="special-header"><span className="special-date">24 DÉCEMBRE</span></div><h4 className="special-title">Veillée de Noël</h4><p className="special-desc">Soirée de chants et prière.</p></div>
                        <a href="#" className="special-link">Détails →</a>
                      </div>
                    </div>
                  </div>
                  <div className="split-sidebar">
                    <MiniCalendar />
                  </div>
                </div>
              </div>

              <div className="action-bar">
                <h2>📜 HISTORIQUE DES PROGRAMMES D'ACTIVITES</h2>
              </div>
              <div className="glass-container">
                <div className="layout-split-wrapper">
                  <div className="split-content">
                    <div className="special-grid">
                      {parishHistory.map(item => (
                        <div key={item.id} className="historical-card">
                          <div>
                            <div className="historical-header">
                              <span className="historical-date">{item.date}</span>
                            </div>
                            <h4 className="historical-title">{item.title}</h4>
                            <p className="historical-desc">{item.description}</p>
                          </div>
                          <a href={item.link} className="historical-link">Voir plus →</a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="split-sidebar">
                    <div className="mini-calendar" style={{ background: 'rgba(255,255,255,0.7)' }}>
                      <div className="cal-header">
                        <span className="cal-month-year">Archives</span>
                      </div>
                      <div className="cal-grid">
                        <div className="cal-day-label" style={{ gridColumn: 'span 7', textAlign: 'center' }}>Événements passés</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="tab-content active">
              {/* Barre pour "Nos Parcours Pédagogiques" au lieu du SectionDivider */}
              <div className="action-bar">
                <h2>🎒 Nos Parcours Pédagogiques</h2>
                <button className="btn-agenda" onClick={() => openAgendaModal('classes')}>
                  <IconPlus /> Crée l'ordre du jour
                </button>
              </div>

              <div className="glass-container">
                <div className="permanent-layout">
                  <div className="permanent-content">
                    <div className="grid-cards">
                      <div className={`card tag-classes ${classFilter === 'all' ? 'active' : ''}`} onClick={() => setClassFilter('all')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/school/400/250" alt="Semaine" className="card-img" />
                          <div className="card-img-overlay">Vue Globale</div>
                        </div>
                        <div className="card-body"><div className="card-header-row"><h4 className="card-title">Semaine École</h4></div><p className="card-desc">Toutes les séances.</p></div>
                      </div>
                      <div className={`card tag-classes ${classFilter === 'eveil' ? 'active' : ''}`} onClick={() => setClassFilter('eveil')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/kids1/400/250" alt="Primaire" className="card-img" />
                          <div className="card-img-overlay">Primaire</div>
                        </div>
                        <div className="card-body"><div className="card-header-row"><h4 className="card-title">Éveil à la foi</h4><span className="card-next-date">Sam 10h</span></div><p className="card-desc">Approche sensorielle.</p></div>
                      </div>
                      <div className={`card tag-classes ${classFilter === 'catechese' ? 'active' : ''}`} onClick={() => setClassFilter('catechese')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/kids2/400/250" alt="CM1-CM2" className="card-img" />
                          <div className="card-img-overlay">Élémentaire</div>
                        </div>
                        <div className="card-body"><div className="card-header-row"><h4 className="card-title">Catéchèse</h4><span className="card-next-date">Mer 16h30</span></div><p className="card-desc">Préparation communion.</p></div>
                      </div>
                      <div className={`card tag-classes ${classFilter === 'aumonerie' ? 'active' : ''}`} onClick={() => setClassFilter('aumonerie')}>
                        <div className="card-img-wrapper">
                          <img src="https://picsum.photos/seed/teens/400/250" alt="Collège" className="card-img" />
                          <div className="card-img-overlay">Collège</div>
                        </div>
                        <div className="card-body"><div className="card-header-row"><h4 className="card-title">Aumônerie</h4><span className="card-next-date">Ven 18h</span></div><p className="card-desc">Partage.</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="agenda-sidebar">
                    <div className="agenda-card">
                      <h4>📅 Ordre du jour</h4>
                      <AgendaSlider items={classFilter === 'all' ? classSchedule : classSchedule.filter(e => e.type === classFilter)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-bar">
                <h2>✨ Programmes Particuliers</h2>
                <button className="btn-agenda" onClick={() => openEventModal('classes')}>
                  <IconPlus /> Programmer une Activité
                </button>
              </div>

              <div className="glass-container">
                <div className="layout-split-wrapper">
                  <div className="split-content">
                    <div className="special-grid">
                      <div className="special-card">
                        <div><div className="special-header"><span className="special-date">JUIN</span></div><h4 className="special-title">Retraite Confirmation</h4><p className="special-desc">Week-end de retraite.</p></div>
                        <a href="#" className="special-link">Inscriptions →</a>
                      </div>
                    </div>
                  </div>
                  <div className="split-sidebar">
                    <MiniCalendar />
                  </div>
                </div>
              </div>

              <div className="action-bar">
                <h2>📜 HISTORIQUE DES PROGRAMMES D'ACTIVITES</h2>
              </div>
              <div className="glass-container">
                <div className="layout-split-wrapper">
                  <div className="split-content">
                    <div className="special-grid">
                      {classHistory.map(item => (
                        <div key={item.id} className="historical-card">
                          <div>
                            <div className="historical-header">
                              <span className="historical-date">{item.date}</span>
                            </div>
                            <h4 className="historical-title">{item.title}</h4>
                            <p className="historical-desc">{item.description}</p>
                          </div>
                          <a href={item.link} className="historical-link">Voir plus →</a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="split-sidebar">
                    <div className="mini-calendar" style={{ background: 'rgba(255,255,255,0.7)' }}>
                      <div className="cal-header">
                        <span className="cal-month-year">Archives</span>
                      </div>
                      <div className="cal-grid">
                        <div className="cal-day-label" style={{ gridColumn: 'span 7', textAlign: 'center' }}>Événements passés</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}