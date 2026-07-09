// pages/ResponsableFamille/AllProgrammes.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import html2pdf from 'html2pdf.js';
import { withBasePath } from '../../Utils/urlHelper';
import { exportProgrammesWorkbook } from '../../Utils/excelExport';

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
tr.past-row td {
    background-color: #f3f4f6;
}
tr.past-row td {
    color: #9ca3af;
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

// Icônes
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const IconLocation = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconFamily = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><path d="M17 3.5a4 4 0 0 1 0 7"></path><path d="M21 21v-2a4 4 0 0 0-3-3.85"></path></svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const IconExcel = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 14l4 4m0-4l-4 4"></path></svg>
);
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const IconXCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const IconFilter = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"></polygon></svg>
);
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>
);
const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01"></path><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path></svg>
);

// Composant Toast
const Toast = ({ message, type = 'success', onClose }) => {
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
      case 'success':
        return <IconCheckCircle />;
      case 'warning':
        return <IconWarning />;
      default:
        return <IconXCircle />;
    }
  };

  return (
    <div className={`toast-notification ${isExiting ? 'exit' : ''}`}>
      <div className={`toast-content toast-${type}`}>
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{message}</div>
        <div className="toast-close" onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}>
          ✕
        </div>
      </div>
    </div>
  );
};

export default function AllProgrammes() {
  const { props } = usePage();
  const { allProgrammes = [], currentClass = null } = props;
  const [toast, setToast] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const tableRef = useRef(null);
  
  // Pagination - 15 éléments par page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    month: 'all',
    year: new Date().getFullYear().toString()
  });
  
  // Années disponibles - utilise start_date
  const availableYears = [...new Set(allProgrammes.map(event => new Date(event.start_date || event.date).getFullYear()))].sort((a, b) => b - a);

  // ========== FONCTIONS DE GESTION DES DATES ==========
  const getDateOnly = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getDateOnly(new Date());

  const getEventStartDate = (event) => {
    return event.start_date || event.date;
  };

  const isPastEvent = (event) => {
    const eventDate = getDateOnly(getEventStartDate(event));
    return eventDate < today;
  };

  const isUpcomingEvent = (event) => {
    const eventDate = getDateOnly(getEventStartDate(event));
    return eventDate > today;
  };

  const isToday = (eventDate) => {
    if (!eventDate) return false;
    const eventDateObj = getDateOnly(eventDate);
    return eventDateObj.getTime() === today.getTime();
  };

  const getStatus = (event) => {
    const eventDate = getEventStartDate(event);
    if (isToday(eventDate)) return 'Aujourd\'hui';
    if (isUpcomingEvent(event)) return 'À venir';
    return 'Passé';
  };

  const getStatusClass = (event) => {
    const eventDate = getEventStartDate(event);
    if (isToday(eventDate)) return 'status-today';
    if (isUpcomingEvent(event)) return 'status-upcoming';
    return 'status-past';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDateRange = (event) => {
    const startDate = getEventStartDate(event);
    const endDate = event.end_date;
    
    if (endDate && startDate !== endDate) {
      return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    }
    return formatDate(startDate);
  };
  // ========== FIN DES FONCTIONS ==========

  // Calcul des statistiques
  const totalCount = allProgrammes.length;
  const upcomingCount = allProgrammes.filter(event => isUpcomingEvent(event)).length;
  const pastCount = allProgrammes.filter(event => isPastEvent(event)).length;
  const todayCount = allProgrammes.filter(event => isToday(getEventStartDate(event))).length;

  // Fonction de filtrage des programmes
  const filteredProgrammes = allProgrammes.filter(event => {
    const eventStartDate = getEventStartDate(event);
    
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        (event.title || '').toLowerCase().includes(searchLower) ||
        (event.orateur || '').toLowerCase().includes(searchLower) ||
        (event.moderateur || '').toLowerCase().includes(searchLower) ||
        (event.famille_reception || '').toLowerCase().includes(searchLower) ||
        (event.lieu || '').toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Filtre par statut
    if (filters.status !== 'all') {
      if (filters.status === 'upcoming' && !isUpcomingEvent(event)) return false;
      if (filters.status === 'past' && !isPastEvent(event)) return false;
      if (filters.status === 'today' && !isToday(eventStartDate)) return false;
    }
    
    // Filtre par mois
    if (filters.month !== 'all') {
      const eventMonth = new Date(eventStartDate).getMonth() + 1;
      if (eventMonth.toString() !== filters.month) return false;
    }
    
    // Filtre par année
    if (filters.year !== 'all') {
      const eventYear = new Date(eventStartDate).getFullYear();
      if (eventYear.toString() !== filters.year) return false;
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);
  const paginatedProgrammes = filteredProgrammes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleGoBack = () => {
    router.visit(withBasePath("", '/responsable-famille/programmes'));
  };

  // Génération du PDF avec ajout de la classe
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const pdfElement = document.createElement('div');
      pdfElement.style.padding = '20px';
      pdfElement.style.backgroundColor = 'white';
      pdfElement.style.fontFamily = 'Arial, sans-serif';
      
      const className = currentClass?.nom || currentClass?.name || 'Non spécifiée';
      const classDisplay = currentClass ? `Classe : ${className}` : '';
      
      pdfElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin-bottom: 5px;">📋 Tous les programmes d'activités</h1>
          ${classDisplay ? `<h2 style="color: #6b7280; margin-bottom: 10px; font-size: 1.2rem;">${classDisplay}</h2>` : ''}
          <p style="color: #6b7280;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 15px 0;">
        </div>
      `;
      
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '12px';
      
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = ['#', 'Date', 'Activités', 'Heure', 'Lieu', 'Orateur', 'Modérateur', 'Famille de réception', 'Statut'];
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.padding = '12px';
        th.style.textAlign = 'left';
        th.style.backgroundColor = '#f59e0b';
        th.style.color = 'white';
        th.style.border = '1px solid #e5e7eb';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      const tbody = document.createElement('tbody');
      filteredProgrammes.forEach((event, index) => {
        const row = document.createElement('tr');
        
        const numCell = document.createElement('td');
        numCell.textContent = (index + 1).toString();
        numCell.style.padding = '10px';
        numCell.style.border = '1px solid #e5e7eb';
        numCell.style.textAlign = 'center';
        row.appendChild(numCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDateRange(event);
        dateCell.style.padding = '10px';
        dateCell.style.border = '1px solid #e5e7eb';
        row.appendChild(dateCell);
        
        const titleCell = document.createElement('td');
        titleCell.textContent = event.title || '';
        titleCell.style.padding = '10px';
        titleCell.style.border = '1px solid #e5e7eb';
        titleCell.style.backgroundColor = '#ffffff';
        row.appendChild(titleCell);
        
        const timeCell = document.createElement('td');
        const startTime = event.start_time || event.time;
        const endTime = event.end_time;
        timeCell.textContent = startTime ? (endTime ? `${startTime.substring(0, 5)} → ${endTime.substring(0, 5)}` : startTime.substring(0, 5)) : '';
        timeCell.style.padding = '10px';
        timeCell.style.border = '1px solid #e5e7eb';
        row.appendChild(timeCell);
        
        const lieuCell = document.createElement('td');
        lieuCell.textContent = event.lieu || '';
        lieuCell.style.padding = '10px';
        lieuCell.style.border = '1px solid #e5e7eb';
        row.appendChild(lieuCell);
        
        const orateurCell = document.createElement('td');
        orateurCell.textContent = event.orateur || '';
        orateurCell.style.padding = '10px';
        orateurCell.style.border = '1px solid #e5e7eb';
        row.appendChild(orateurCell);
        
        const moderateurCell = document.createElement('td');
        moderateurCell.textContent = event.moderateur || '';
        moderateurCell.style.padding = '10px';
        moderateurCell.style.border = '1px solid #e5e7eb';
        row.appendChild(moderateurCell);
        
        const familleCell = document.createElement('td');
        familleCell.textContent = event.famille_reception || '';
        familleCell.style.padding = '10px';
        familleCell.style.border = '1px solid #e5e7eb';
        row.appendChild(familleCell);
        
        const statusCell = document.createElement('td');
        statusCell.textContent = getStatus(event);
        statusCell.style.padding = '10px';
        statusCell.style.border = '1px solid #e5e7eb';
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      pdfElement.appendChild(table);
      
      pdfElement.innerHTML += `
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px;">
          <p>Total: ${filteredProgrammes.length} programme(s) | À venir: ${filteredProgrammes.filter(e => isUpcomingEvent(e)).length} | Aujourd'hui: ${filteredProgrammes.filter(e => isToday(getEventStartDate(e))).length} | Passés: ${filteredProgrammes.filter(e => isPastEvent(e)).length}</p>
        </div>
      `;
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `programmes_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(pdfElement).save();
      showToast('PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Génération du fichier Excel avec ajout de la classe
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const className = currentClass?.nom || currentClass?.name || 'Non spécifiée';
      const classDisplay = currentClass ? `Classe : ${className}` : 'Classe : Non spécifiée';
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const currentTime = new Date().toLocaleTimeString('fr-FR');
      
      const excelData = filteredProgrammes.map((event, index) => ({
        '#': index + 1,
        'Date': formatDateRange(event),
        'Heure': (() => {
          const startTime = event.start_time || event.time;
          const endTime = event.end_time;
          return startTime ? (endTime ? `${startTime.substring(0, 5)} → ${endTime.substring(0, 5)}` : startTime.substring(0, 5)) : '';
        })(),
        'Activités': event.title || '',
        'Lieu': event.lieu || '',
        'Orateur': event.orateur || '',
        'Modérateur': event.moderateur || '',
        'Famille de réception': event.famille_reception || '',
        'Statut': getStatus(event)
      }));

      const dataRows = excelData.map(item => [
        item['#'],
        item['Date'],
        item['Heure'],
        item['Activités'],
        item['Lieu'],
        item['Orateur'],
        item['Modérateur'],
        item['Famille de réception'],
        item['Statut']
      ]);

      const statsData = [
        { 'Statistique': 'Classe', 'Valeur': className },
        { 'Statistique': 'Total des programmes', 'Valeur': filteredProgrammes.length },
        { 'Statistique': 'Programmes à venir', 'Valeur': filteredProgrammes.filter(e => isUpcomingEvent(e)).length },
        { 'Statistique': 'Programmes aujourd\'hui', 'Valeur': filteredProgrammes.filter(e => isToday(getEventStartDate(e))).length },
        { 'Statistique': 'Programmes passés', 'Valeur': filteredProgrammes.filter(e => isPastEvent(e)).length },
        { 'Statistique': 'Date de génération', 'Valeur': new Date().toLocaleString('fr-FR') },
        { 'Statistique': 'Filtres appliqués', 'Valeur': `Recherche: ${filters.search || 'Aucune'} | Statut: ${filters.status} | Mois: ${filters.month} | Année: ${filters.year}` }
      ];

      const fileName = `programmes_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      await exportProgrammesWorkbook({
        titleRows: [
          'LISTE DES PROGRAMMES D\'ACTIVITÉS',
          classDisplay,
          `Date de génération : ${currentDate} à ${currentTime}`,
        ],
        headers: ['#', 'Date', 'Heure', 'Activités', 'Lieu', 'Orateur', 'Modérateur', 'Famille de réception', 'Statut'],
        dataRows,
        colWidths: [5, 25, 15, 35, 25, 20, 20, 25, 12],
        statsRows: statsData,
        filename: fileName,
      });
      
      showToast('Excel téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la génération de l\'Excel', error);
      showToast('Erreur lors de la génération de l\'Excel', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      month: 'all',
      year: new Date().getFullYear().toString()
    });
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

      <div className="min-h-screen animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)", paddingBottom: '40px' }}>
        <main style={{ padding: '0 20px', width: '100%', margin: '0 auto' }}>
          <div className="page-header">
            <button className="btn-back-table" onClick={handleGoBack}>
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
                style={{ opacity: isExportingExcel ? 0.6 : 1, cursor: isExportingExcel ? 'wait' : 'pointer' }}
              >
                <IconExcel /> {isExportingExcel ? 'Génération...' : 'Exporter Excel'}
              </button>
              <button 
                className="btn-pdf" 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? 'wait' : 'pointer' }}
              >
                <IconDownload /> {isDownloading ? 'Génération...' : 'Télécharger PDF'}
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
          </div>

          {/* Tableau principal */}
          <div className="table-container" ref={tableRef}>
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
                  <th>Famille de réception</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProgrammes.length > 0 ? (
                  paginatedProgrammes.map((event, index) => {
                    const past = isPastEvent(event);
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    const startDate = getEventStartDate(event);
                    const startTime = event.start_time || event.time;
                    const endTime = event.end_time;
                    const isMultiDay = event.end_date && startDate !== event.end_date;
                    
                    return (
                      <tr key={event.id} className={past ? 'past-row' : ''}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: past ? '#9ca3af' : '#6b7280' }}>
                          {rowNumber}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                            <IconCalendar style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {isMultiDay ? `${formatDate(startDate)} → ${formatDate(event.end_date)}` : formatDate(startDate)}
                          </div>
                        </td>
                        <td style={{ fontWeight: '600', color: past ? '#9ca3af' : '#111827' }}>{event.title}</td>
                        <td>
                          {startTime && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                              <IconClock style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                              {endTime ? `${startTime.substring(0, 5)} → ${endTime.substring(0, 5)}` : startTime.substring(0, 5)}
                            </div>
                          )}
                        </td>
                        <td>
                          {event.lieu && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                              <IconLocation style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                              {event.lieu.length > 30 ? event.lieu.substring(0, 30) + '...' : event.lieu}
                            </div>
                          )}
                        </td>
                        <td>
                          {event.orateur && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                              <IconMic style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                              {event.orateur}
                            </div>
                          )}
                        </td>
                        <td>
                          {event.moderateur && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                              <IconUser style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                              {event.moderateur}
                            </div>
                          )}
                        </td>
                        <td>
                          {event.famille_reception && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: past ? '#9ca3af' : '#4b5563' }}>
                              <IconFamily style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                              {event.famille_reception}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(event)}`}>
                            {getStatus(event)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
                      <p style={{ fontSize: '1rem' }}>Aucun programme d'activité ne correspond à vos critères.</p>
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
                Page {currentPage} sur {totalPages} ({filteredProgrammes.length} éléments)
              </span>
            </div>
          )}
        </main>
      </div>
    </>
  );
}