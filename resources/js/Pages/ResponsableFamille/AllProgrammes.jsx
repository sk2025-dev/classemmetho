import React, { useState, useRef, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

// Styles pour le tableau (conservés identiques)
const tableStyles = `
.table-container {
    background: white;
    border-radius: 28px;
    padding: 0;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow-x: auto;
    width: 100%;
}
.programmes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}
.programmes-table th {
    text-align: left;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}
.programmes-table td {
    padding: 14px 20px;
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
.table-actions {
    display: flex;
    gap: 8px;
}
.btn-table-edit {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.btn-table-edit:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
}
.btn-table-edit:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
}
.btn-table-delete {
    background: #ef4444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.btn-table-delete:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
}
.btn-table-delete:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
}
tr.past-row td:last-child,
tr.past-row td.actions-cell {
    background-color: #f3f4f6;
}
tr.past-row td:last-child .btn-table-edit,
tr.past-row td:last-child .btn-table-delete,
tr.past-row td.actions-cell .btn-table-edit,
tr.past-row td.actions-cell .btn-table-delete {
    opacity: 0.5;
    cursor: not-allowed;
}
.btn-back-table {
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
}
.btn-back-table:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
}
.btn-pdf {
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
.btn-pdf:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
.btn-excel {
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
.btn-excel:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    margin-top: 20px;
    position: relative;
    flex-wrap: wrap;
    gap: 15px;
}
.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
}
.header-buttons {
    display: flex;
    gap: 12px;
}
.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
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
.toast-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
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
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
    border-color: #2563eb;
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
.btn-save {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 12px 28px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    display: flex;
    align-items: center;
    gap: 8px;
}
.btn-save:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
}
.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}
.confirm-modal-content {
    max-width: 450px;
}
.confirm-icon {
    font-size: 4rem;
    text-align: center;
    margin-bottom: 1rem;
}
.confirm-title {
    text-align: center;
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}
.confirm-message {
    text-align: center;
    color: #6b7280;
    margin-bottom: 1.5rem;
}
.confirm-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
}
.btn-confirm {
    background: #ef4444;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-confirm:hover {
    background: #dc2626;
    transform: translateY(-1px);
}
.btn-confirm-edit {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-confirm-edit:hover {
    background: #d97706;
    transform: translateY(-1px);
}
.btn-cancel-confirm {
    background: #9ca3af;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-cancel-confirm:hover {
    background: #6b7280;
    transform: translateY(-1px);
}
@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        justify-content: center;
        text-align: center;
    }
    .page-title {
        white-space: normal;
    }
    .header-buttons {
        justify-content: center;
        width: 100%;
    }
    .table-container {
        border-radius: 20px;
    }
    .programmes-table th,
    .programmes-table td {
        padding: 12px 16px;
        font-size: 0.8rem;
    }
    .table-actions {
        flex-direction: column;
        gap: 5px;
    }
    .btn-table-edit,
    .btn-table-delete {
        padding: 4px 8px;
        font-size: 0.7rem;
    }
    .modal-form-grid {
        grid-template-columns: 1fr;
    }
    .modal-full {
        grid-column: auto;
    }
    .filter-bar {
        flex-direction: column;
    }
    .filter-group {
        width: 100%;
    }
    .filter-actions {
        width: 100%;
    }
    .btn-filter-reset {
        flex: 1;
        justify-content: center;
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
    .pagination {
        flex-wrap: wrap;
        gap: 5px;
    }
    .pagination button {
        padding: 6px 10px;
        font-size: 0.75rem;
    }
}
@media (max-width: 480px) {
    .stats-cards {
        grid-template-columns: 1fr;
    }
}
`;

// Icônes (conservées identiques)
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
const IconCalendar = () => (
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
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);
const IconClock = () => (
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
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);
const IconLocation = () => (
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
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);
const IconMic = () => (
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
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);
const IconUser = () => (
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
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
const IconFamily = () => (
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
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
        <path d="M17 3.5a4 4 0 0 1 0 7"></path>
        <path d="M21 21v-2a4 4 0 0 0-3-3.85"></path>
    </svg>
);
const IconEdit = () => (
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
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);
const IconTrash = () => (
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
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);
const IconDownload = () => (
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);
const IconExcel = () => (
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M10 14l4 4m0-4l-4 4"></path>
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
const IconFilter = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"></polygon>
    </svg>
);
const IconRefresh = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
    </svg>
);
const IconWarning = () => (
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
        <path d="M12 9v4M12 17h.01"></path>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
    </svg>
);

// Composant Toast
const Toast = ({ message, type = "success", onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    React.useEffect(() => {
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
            case "warning":
                return <IconWarning />;
            default:
                return <IconXCircle />;
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

// Modal de confirmation
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    icon = "⚠️",
    confirmButtonClass = "btn-confirm",
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content confirm-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Confirmation</h2>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="confirm-icon">{icon}</div>
                    <div className="confirm-title">{title}</div>
                    <div className="confirm-message">{message}</div>
                    <div className="confirm-buttons">
                        <button
                            className="btn-cancel-confirm"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={confirmButtonClass}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal d'alerte
const AlertModal = ({ isOpen, onClose, title, message, icon = "⚠️" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content confirm-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Information</h2>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="confirm-icon">{icon}</div>
                    <div className="confirm-title">{title}</div>
                    <div className="confirm-message">{message}</div>
                    <div className="confirm-buttons">
                        <button className="btn-confirm-edit" onClick={onClose}>
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal d'édition
const EditProgrammeModal = ({ isOpen, onClose, event, onSave }) => {
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        orateur: "",
        moderateur: "",
        famille_reception: "",
        lieu: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && event) {
            setFormData({
                title: event.title || "",
                date: event.date ? event.date.split("T")[0] : "",
                time: event.time?.substring(0, 5) || "",
                orateur: event.orateur || "",
                moderateur: event.moderateur || "",
                famille_reception: event.famille_reception || "",
                lieu: event.lieu || "",
            });
            setErrors({});
        }
    }, [isOpen, event]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSave(formData, event.id);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Modifier le programme</h2>
                    <button onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="edit-event-form">
                        <div className="modal-form-grid">
                            <div className="form-group modal-full">
                                <label>Activité / Titre *</label>
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
                                {errors.title && (
                                    <small
                                        style={{
                                            color: "#dc2626",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {errors.title}
                                    </small>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Date *</label>
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
                                {errors.date && (
                                    <small
                                        style={{
                                            color: "#dc2626",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {errors.date}
                                    </small>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Heure *</label>
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
                                {errors.time && (
                                    <small
                                        style={{
                                            color: "#dc2626",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {errors.time}
                                    </small>
                                )}
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
                                <label>Famille de réception</label>
                                <span className="input-icon">
                                    <IconFamily />
                                </span>
                                <input
                                    type="text"
                                    name="famille_reception"
                                    placeholder="Nom de la famille de réception..."
                                    value={formData.famille_reception}
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
                                />
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
                        form="edit-event-form"
                        className="btn-save"
                        disabled={isSubmitting}
                    >
                        <IconPlus />{" "}
                        {isSubmitting
                            ? "Enregistrement..."
                            : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function AllProgrammes() {
    const { props } = usePage();
    const { allProgrammes: initialAllProgrammes = [], currentClass = null } =
        props;
    const [allProgrammes, setAllProgrammes] = useState(initialAllProgrammes);
    const [toast, setToast] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const tableRef = useRef(null);

    // Pagination - 15 éléments par page
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // États pour les modales de confirmation
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        action: null,
        event: null,
        title: "",
        message: "",
        confirmText: "",
        icon: "",
        confirmButtonClass: "btn-confirm",
    });

    // État pour la modale d'alerte des activités passées
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        icon: "⚠️",
    });

    // États pour les filtres
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        month: "all",
        year: new Date().getFullYear().toString(),
    });

    // Années disponibles
    const availableYears = [
        ...new Set(
            allProgrammes.map((event) => new Date(event.date).getFullYear()),
        ),
    ].sort((a, b) => b - a);

    // Calcul des statistiques avec correction du fuseau horaire
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Fonction pour vérifier si une date est aujourd'hui (indépendante du fuseau horaire)
    const isToday = (eventDate) => {
        const eventDateObj = new Date(eventDate);
        eventDateObj.setHours(0, 0, 0, 0);
        return eventDateObj.getTime() === today.getTime();
    };

    const totalCount = allProgrammes.length;
    const upcomingCount = allProgrammes.filter(
        (event) => new Date(event.date) >= today,
    ).length;
    const pastCount = allProgrammes.filter(
        (event) => new Date(event.date) < today,
    ).length;
    const todayCount = allProgrammes.filter((event) =>
        isToday(event.date),
    ).length;

    // Fonction pour vérifier si un événement est passé
    const isPastEvent = (event) => {
        const eventDate = new Date(event.date);
        return eventDate < today;
    };

    // Fonction de filtrage des programmes
    const filteredProgrammes = allProgrammes.filter((event) => {
        const eventDate = new Date(event.date);
        const eventDateStr = event.date;

        // Filtre par recherche
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
                (event.title || "").toLowerCase().includes(searchLower) ||
                (event.orateur || "").toLowerCase().includes(searchLower) ||
                (event.moderateur || "").toLowerCase().includes(searchLower) ||
                (event.famille_reception || "")
                    .toLowerCase()
                    .includes(searchLower) ||
                (event.lieu || "").toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Filtre par statut
        if (filters.status !== "all") {
            const isUpcoming = eventDate >= today;
            const isPast = eventDate < today;
            const isTodayEvent = isToday(event.date);

            if (filters.status === "upcoming" && !isUpcoming) return false;
            if (filters.status === "past" && !isPast) return false;
            if (filters.status === "today" && !isTodayEvent) return false;
        }

        // Filtre par mois
        if (filters.month !== "all") {
            const eventMonth = eventDate.getMonth() + 1;
            if (eventMonth.toString() !== filters.month) return false;
        }

        // Filtre par année
        if (filters.year !== "all") {
            const eventYear = eventDate.getFullYear();
            if (eventYear.toString() !== filters.year) return false;
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);
    const paginatedProgrammes = filteredProgrammes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Réinitialiser la page quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        let isMounted = true;

        const loadActivities = async () => {
            try {
                const response = await axios.get(
                    "/api/responsable-famille/activites",
                );
                if (!isMounted || !response?.data?.success) {
                    return;
                }

                const apiAll = response.data.all || [];
                if (apiAll.length > 0) {
                    setAllProgrammes(apiAll);
                    return;
                }

                const merged = [
                    ...(response.data.current || []),
                    ...(response.data.history || []),
                ];
                setAllProgrammes(merged);
            } catch (error) {
                console.error(
                    "Erreur chargement activités responsable (all):",
                    error,
                );
            }
        };

        loadActivities();

        return () => {
            isMounted = false;
        };
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const handleGoBack = () => {
        router.visit("/conducteur/programmes");
    };

    const openEditModal = (event) => {
        if (isPastEvent(event)) {
            setAlertModal({
                isOpen: true,
                title: "Activité passée",
                message: `Cette activité "${event.title}" est déjà passée et ne peut plus être modifiée.`,
                icon: "📅",
            });
            return;
        }
        setConfirmModal({
            isOpen: true,
            action: "edit",
            event: event,
            title: "Confirmation de modification",
            message: `Êtes-vous sûr de vouloir modifier l'activité "${event.title}" ?`,
            confirmText: "Oui, modifier",
            icon: "✏️",
            confirmButtonClass: "btn-confirm-edit",
        });
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEvent(null);
    };

    const openDeleteConfirm = (event) => {
        if (isPastEvent(event)) {
            setAlertModal({
                isOpen: true,
                title: "Activité passée",
                message: `Cette activité "${event.title}" est déjà passée et ne peut plus être supprimée.`,
                icon: "📅",
            });
            return;
        }
        setConfirmModal({
            isOpen: true,
            action: "delete",
            event: event,
            title: "Supprimer le programme",
            message: `Êtes-vous sûr de vouloir supprimer "${event.title}" ? Cette action est irréversible.`,
            confirmText: "Supprimer",
            icon: "🗑️",
            confirmButtonClass: "btn-confirm",
        });
    };

    const handleUpdateEvent = async (data, eventId) => {
        try {
            const response = await axios.put(
                `/conducteur/programmes/event/${eventId}`,
                data,
            );
            if (response.data.success) {
                showToast("Événement modifié avec succès", "success");
                closeEditModal();
                router.reload();
            } else {
                showToast("Erreur lors de la modification", "error");
            }
        } catch (error) {
            console.error("Erreur de modification", error);
            if (error.response?.data?.errors) {
                throw error;
            }
            showToast("Erreur lors de la modification", "error");
            throw error;
        }
    };

    const handleConfirmAction = async () => {
        const { action, event } = confirmModal;

        if (action === "edit") {
            setConfirmModal({ ...confirmModal, isOpen: false });
            setSelectedEvent(event);
            setIsEditModalOpen(true);
        } else if (action === "delete") {
            try {
                const response = await axios.delete(
                    `/conducteur/programmes/event/${event.id}`,
                );
                if (response.data.success) {
                    showToast("Événement supprimé avec succès", "success");
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    router.reload();
                } else {
                    showToast("Erreur lors de la suppression", "error");
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            } catch (error) {
                console.error("Erreur de suppression", error);
                showToast("Erreur lors de la suppression", "error");
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        }
    };

    const closeConfirmModal = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const closeAlertModal = () => {
        setAlertModal({ ...alertModal, isOpen: false });
    };

    // Génération du PDF sans les colonnes Statut et Actions
    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            // Créer un élément temporaire pour le PDF
            const pdfElement = document.createElement("div");
            pdfElement.style.padding = "20px";
            pdfElement.style.backgroundColor = "white";
            pdfElement.style.fontFamily = "Arial, sans-serif";

            // Ajouter l'en-tête
            pdfElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin-bottom: 5px;">📋 Tous les programmes d'activités</h1>
          <p style="color: #6b7280;">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 15px 0;">
        </div>
      `;

            // Créer le tableau pour le PDF (sans les colonnes Statut et Actions)
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = "12px";

            // En-tête du tableau - Colonne Date en premier
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            const headers = [
                "#",
                "Date",
                "Activités",
                "Heure",
                "Lieu",
                "Orateur",
                "Modérateur",
                "Famille de réception",
            ];
            headers.forEach((header) => {
                const th = document.createElement("th");
                th.textContent = header;
                th.style.padding = "12px";
                th.style.textAlign = "left";
                th.style.backgroundColor = "#f59e0b";
                th.style.color = "white";
                th.style.border = "1px solid #e5e7eb";
                th.style.fontWeight = "bold";
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Corps du tableau
            const tbody = document.createElement("tbody");
            filteredProgrammes.forEach((event, index) => {
                const row = document.createElement("tr");

                // Numéro
                const numCell = document.createElement("td");
                numCell.textContent = (index + 1).toString();
                numCell.style.padding = "10px";
                numCell.style.border = "1px solid #e5e7eb";
                numCell.style.textAlign = "center";
                row.appendChild(numCell);

                // Date
                const dateCell = document.createElement("td");
                dateCell.textContent = formatDate(event.date);
                dateCell.style.padding = "10px";
                dateCell.style.border = "1px solid #e5e7eb";
                row.appendChild(dateCell);

                // Titre
                const titleCell = document.createElement("td");
                titleCell.textContent = event.title || "";
                titleCell.style.padding = "10px";
                titleCell.style.border = "1px solid #e5e7eb";
                titleCell.style.backgroundColor = "#ffffff";
                row.appendChild(titleCell);

                // Heure
                const timeCell = document.createElement("td");
                timeCell.textContent = event.time?.substring(0, 5) || "";
                timeCell.style.padding = "10px";
                timeCell.style.border = "1px solid #e5e7eb";
                row.appendChild(timeCell);

                // Lieu
                const lieuCell = document.createElement("td");
                lieuCell.textContent = event.lieu || "";
                lieuCell.style.padding = "10px";
                lieuCell.style.border = "1px solid #e5e7eb";
                row.appendChild(lieuCell);

                // Orateur
                const orateurCell = document.createElement("td");
                orateurCell.textContent = event.orateur || "";
                orateurCell.style.padding = "10px";
                orateurCell.style.border = "1px solid #e5e7eb";
                row.appendChild(orateurCell);

                // Modérateur
                const moderateurCell = document.createElement("td");
                moderateurCell.textContent = event.moderateur || "";
                moderateurCell.style.padding = "10px";
                moderateurCell.style.border = "1px solid #e5e7eb";
                row.appendChild(moderateurCell);

                // Famille de réception
                const familleCell = document.createElement("td");
                familleCell.textContent = event.famille_reception || "";
                familleCell.style.padding = "10px";
                familleCell.style.border = "1px solid #e5e7eb";
                row.appendChild(familleCell);

                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            pdfElement.appendChild(table);

            // Ajouter les statistiques en bas
            pdfElement.innerHTML += `
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px;">
          <p>Total: ${filteredProgrammes.length} programme(s) | À venir: ${filteredProgrammes.filter((e) => new Date(e.date) >= today).length} | Passés: ${filteredProgrammes.filter((e) => new Date(e.date) < today).length}</p>
        </div>
      `;

            // Options pour html2pdf
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `programmes_${new Date().toISOString().split("T")[0]}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, letterRendering: true },
                jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
            };

            await html2pdf().set(opt).from(pdfElement).save();
            showToast("PDF téléchargé avec succès", "success");
        } catch (error) {
            console.error("Erreur lors de la génération du PDF", error);
            showToast("Erreur lors de la génération du PDF", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    // Génération du fichier Excel
    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            // Préparer les données pour Excel
            const excelData = filteredProgrammes.map((event, index) => ({
                "#": index + 1,
                Date: formatDate(event.date),
                Activités: event.title || "",
                Heure: event.time?.substring(0, 5) || "",
                Lieu: event.lieu || "",
                Orateur: event.orateur || "",
                Modérateur: event.moderateur || "",
                "Famille de réception": event.famille_reception || "",
                Statut: getStatus(event.date),
            }));

            // Créer un nouveau classeur
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Ajuster la largeur des colonnes
            const colWidths = [
                { wch: 5 }, // #
                { wch: 15 }, // Date
                { wch: 30 }, // Activités
                { wch: 10 }, // Heure
                { wch: 25 }, // Lieu
                { wch: 20 }, // Orateur
                { wch: 20 }, // Modérateur
                { wch: 25 }, // Famille de réception
                { wch: 12 }, // Statut
            ];
            ws["!cols"] = colWidths;

            // Créer le classeur
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Programmes");

            // Ajouter une feuille de statistiques
            const statsData = [
                {
                    Statistique: "Total des programmes",
                    Valeur: filteredProgrammes.length,
                },
                {
                    Statistique: "Programmes à venir",
                    Valeur: filteredProgrammes.filter(
                        (e) => new Date(e.date) >= today,
                    ).length,
                },
                {
                    Statistique: "Programmes passés",
                    Valeur: filteredProgrammes.filter(
                        (e) => new Date(e.date) < today,
                    ).length,
                },
                {
                    Statistique: "Programmes aujourd'hui",
                    Valeur: filteredProgrammes.filter((e) => isToday(e.date))
                        .length,
                },
                {
                    Statistique: "Date de génération",
                    Valeur: new Date().toLocaleString("fr-FR"),
                },
                {
                    Statistique: "Filtres appliqués",
                    Valeur: `Recherche: ${filters.search || "Aucune"} | Statut: ${filters.status} | Mois: ${filters.month} | Année: ${filters.year}`,
                },
            ];

            const statsWs = XLSX.utils.json_to_sheet(statsData);
            statsWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, statsWs, "Statistiques");

            // Générer et télécharger le fichier
            const fileName = `programmes_${new Date().toISOString().split("T")[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            showToast("Excel téléchargé avec succès", "success");
        } catch (error) {
            console.error("Erreur lors de la génération de l'Excel", error);
            showToast("Erreur lors de la génération de l'Excel", "error");
        } finally {
            setIsExportingExcel(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            status: "all",
            month: "all",
            year: new Date().getFullYear().toString(),
        });
    };

    const getStatus = (date) => {
        if (isToday(date)) return "Aujourd'hui";
        if (date > todayStr) return "À venir";
        return "Passé";
    };

    const getStatusClass = (date) => {
        if (isToday(date)) return "status-today";
        if (date > todayStr) return "status-upcoming";
        return "status-past";
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const months = [
        { value: "1", label: "Janvier" },
        { value: "2", label: "Février" },
        { value: "3", label: "Mars" },
        { value: "4", label: "Avril" },
        { value: "5", label: "Mai" },
        { value: "6", label: "Juin" },
        { value: "7", label: "Juillet" },
        { value: "8", label: "Août" },
        { value: "9", label: "Septembre" },
        { value: "10", label: "Octobre" },
        { value: "11", label: "Novembre" },
        { value: "12", label: "Décembre" },
    ];

    // Générer les numéros de page à afficher
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
        <>
            <Head title="Tous les programmes" />
            <style>{tableStyles}</style>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                icon={confirmModal.icon}
                confirmButtonClass={confirmModal.confirmButtonClass}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={closeAlertModal}
                title={alertModal.title}
                message={alertModal.message}
                icon={alertModal.icon}
            />

            <EditProgrammeModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                event={selectedEvent}
                onSave={handleUpdateEvent}
            />

            <div
                className="min-h-screen animate-fade-in-up"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                    paddingBottom: "40px",
                }}
            >
                <main
                    style={{
                        padding: "0 20px",
                        width: "100%",
                        margin: "0 auto",
                    }}
                >
                    <div className="page-header">
                        <button
                            className="btn-back-table"
                            onClick={handleGoBack}
                        >
                            <IconArrowLeft /> Retour
                        </button>
                        <div className="page-title">
                            📋 Tous les programmes d'activités
                        </div>
                        <div className="header-buttons">
                            <button
                                className="btn-excel"
                                onClick={handleExportExcel}
                                disabled={isExportingExcel}
                                style={{
                                    opacity: isExportingExcel ? 0.6 : 1,
                                    cursor: isExportingExcel
                                        ? "wait"
                                        : "pointer",
                                }}
                            >
                                <IconExcel />{" "}
                                {isExportingExcel
                                    ? "Génération..."
                                    : "Exporter Excel"}
                            </button>
                            <button
                                className="btn-pdf"
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                style={{
                                    opacity: isDownloading ? 0.6 : 1,
                                    cursor: isDownloading ? "wait" : "pointer",
                                }}
                            >
                                <IconDownload />{" "}
                                {isDownloading
                                    ? "Génération..."
                                    : "Télécharger PDF"}
                            </button>
                        </div>
                    </div>

                    {/* Cartes statistiques */}
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

                    {/* Barre de filtre */}
                    <div className="filter-bar">
                        <div className="filter-group" style={{ flex: 2 }}>
                            <label>
                                <IconFilter
                                    style={{
                                        display: "inline",
                                        marginRight: "4px",
                                    }}
                                />{" "}
                                Recherche
                            </label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Rechercher par titre, orateur, modérateur, famille, lieu..."
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        search: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="filter-group">
                            <label>Statut</label>
                            <select
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        status: e.target.value,
                                    })
                                }
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
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        year: e.target.value,
                                    })
                                }
                            >
                                <option value="all">Toutes</option>
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Mois</label>
                            <select
                                className="filter-select"
                                value={filters.month}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        month: e.target.value,
                                    })
                                }
                            >
                                <option value="all">Tous</option>
                                {months.map((month) => (
                                    <option
                                        key={month.value}
                                        value={month.value}
                                    >
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button
                                className="btn-filter-reset"
                                onClick={resetFilters}
                            >
                                <IconRefresh /> Réinitialiser
                            </button>
                        </div>
                    </div>

                    {/* Tableau principal avec la colonne # en premier */}
                    <div className="table-container" ref={tableRef}>
                        <table className="programmes-table">
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            width: "50px",
                                            textAlign: "center",
                                        }}
                                    >
                                        #
                                    </th>
                                    <th>Date</th>
                                    <th>Activités</th>
                                    <th>Heure</th>
                                    <th>Lieu</th>
                                    <th>Orateur</th>
                                    <th>Modérateur</th>
                                    <th>Famille de réception</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProgrammes.length > 0 ? (
                                    paginatedProgrammes.map((event, index) => {
                                        const past = isPastEvent(event);
                                        const rowNumber =
                                            (currentPage - 1) * itemsPerPage +
                                            index +
                                            1;
                                        return (
                                            <tr
                                                key={event.id}
                                                className={
                                                    past ? "past-row" : ""
                                                }
                                            >
                                                <td
                                                    style={{
                                                        textAlign: "center",
                                                        fontWeight: "bold",
                                                        color: past
                                                            ? "#9ca3af"
                                                            : "#6b7280",
                                                    }}
                                                >
                                                    {rowNumber}
                                                </td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "6px",
                                                            color: past
                                                                ? "#9ca3af"
                                                                : "#4b5563",
                                                        }}
                                                    >
                                                        <IconCalendar
                                                            style={{
                                                                width: "14px",
                                                                height: "14px",
                                                                color: "#9ca3af",
                                                            }}
                                                        />
                                                        {formatDate(event.date)}
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        fontWeight: "600",
                                                        color: past
                                                            ? "#9ca3af"
                                                            : "#111827",
                                                    }}
                                                >
                                                    {event.title}
                                                </td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "6px",
                                                            color: past
                                                                ? "#9ca3af"
                                                                : "#4b5563",
                                                        }}
                                                    >
                                                        <IconClock
                                                            style={{
                                                                width: "14px",
                                                                height: "14px",
                                                                color: "#9ca3af",
                                                            }}
                                                        />
                                                        {event.time?.substring(
                                                            0,
                                                            5,
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {event.lieu && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                color: past
                                                                    ? "#9ca3af"
                                                                    : "#4b5563",
                                                            }}
                                                        >
                                                            <IconLocation
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                    color: "#9ca3af",
                                                                }}
                                                            />
                                                            {event.lieu.length >
                                                            30
                                                                ? event.lieu.substring(
                                                                      0,
                                                                      30,
                                                                  ) + "..."
                                                                : event.lieu}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {event.orateur && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                color: past
                                                                    ? "#9ca3af"
                                                                    : "#4b5563",
                                                            }}
                                                        >
                                                            <IconMic
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                    color: "#9ca3af",
                                                                }}
                                                            />
                                                            {event.orateur}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {event.moderateur && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                color: past
                                                                    ? "#9ca3af"
                                                                    : "#4b5563",
                                                            }}
                                                        >
                                                            <IconUser
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                    color: "#9ca3af",
                                                                }}
                                                            />
                                                            {event.moderateur}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {event.famille_reception && (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                color: past
                                                                    ? "#9ca3af"
                                                                    : "#4b5563",
                                                            }}
                                                        >
                                                            <IconFamily
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                    color: "#9ca3af",
                                                                }}
                                                            />
                                                            {
                                                                event.famille_reception
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${getStatusClass(event.date)}`}
                                                    >
                                                        {getStatus(event.date)}
                                                    </span>
                                                </td>
                                                <td
                                                    className="actions-cell"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-table-edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    event,
                                                                )
                                                            }
                                                            disabled={past}
                                                            title={
                                                                past
                                                                    ? "Impossible de modifier une activité passée"
                                                                    : "Modifier"
                                                            }
                                                        >
                                                            <IconEdit
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                }}
                                                            />{" "}
                                                            Modifier
                                                        </button>
                                                        <button
                                                            className="btn-table-delete"
                                                            onClick={() =>
                                                                openDeleteConfirm(
                                                                    event,
                                                                )
                                                            }
                                                            disabled={past}
                                                            title={
                                                                past
                                                                    ? "Impossible de supprimer une activité passée"
                                                                    : "Supprimer"
                                                            }
                                                        >
                                                            <IconTrash
                                                                style={{
                                                                    width: "14px",
                                                                    height: "14px",
                                                                }}
                                                            />{" "}
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            style={{
                                                textAlign: "center",
                                                padding: "60px 20px",
                                                color: "#9ca3af",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "4rem",
                                                    marginBottom: "1rem",
                                                    opacity: 0.5,
                                                }}
                                            >
                                                📋
                                            </div>
                                            <p style={{ fontSize: "1rem" }}>
                                                Aucun programme d'activité ne
                                                correspond à vos critères.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(1, prev - 1),
                                    )
                                }
                                disabled={currentPage === 1}
                            >
                                ◀
                            </button>

                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    className={
                                        currentPage === page
                                            ? "active-page"
                                            : ""
                                    }
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="pagination-arrows"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(totalPages, prev + 1),
                                    )
                                }
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
                                Page {currentPage} sur {totalPages} (
                                {filteredProgrammes.length} éléments)
                            </span>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
