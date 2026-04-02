// pages/Conducteur/HistoryProgrammes.jsx

import React, { useState, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

// Styles pour le tableau
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
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
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
    background-color: #eff6ff;
    cursor: pointer;
}
.programmes-table tr:last-child td {
    border-bottom: none;
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
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    margin-top: 20px;
    position: relative;
}
.page-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
}
.header-buttons {
    display: flex;
    gap: 12px;
    margin-left: auto;
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
        gap: 15px;
        margin-top: 20px;
    }
    .page-title {
        position: static;
        transform: none;
        white-space: normal;
        text-align: center;
        order: -1;
        margin-bottom: 10px;
    }
    .header-buttons {
        margin-left: 0;
        justify-content: center;
        width: 100%;
    }
    .programmes-table th,
    .programmes-table td {
        padding: 12px 16px;
        font-size: 0.8rem;
    }
}
`;

// Icônes (garder les mêmes)
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
const IconPray = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const IconXCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
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

export default function HistoryProgrammes() {
  const { props } = usePage();
  const { historyProgrammes = [], currentClass = null } = props;
  const [toast, setToast] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const tableRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleGoBack = () => {
    router.visit('/conducteur/programmes');
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = tableRef.current;
      if (!element) return;

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `historique_programmes_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(element).save();
      showToast('PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <Head title="Historique des programmes" />
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
              📜 Historique des programmes d'activités
            </div>
            <div className="header-buttons">
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

          <div className="table-container" ref={tableRef}>
            <table className="programmes-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Lieu</th>
                  <th>Orateur</th>
                  <th>Modérateur</th>
                  <th>Dir. prière</th>
                </tr>
              </thead>
              <tbody>
                {historyProgrammes.length > 0 ? (
                  historyProgrammes.map(event => (
                    <tr key={event.id}>
                      <td style={{ fontWeight: '600', color: '#111827' }}>{event.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                          <IconCalendar style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                          {formatDate(event.date)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                          <IconClock style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                          {event.time?.substring(0, 5)}
                        </div>
                      </td>
                      <td>
                        {event.lieu && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconLocation style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {event.lieu}
                          </div>
                        )}
                      </td>
                      <td>
                        {event.orateur && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconMic style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {event.orateur}
                          </div>
                        )}
                      </td>
                      <td>
                        {event.moderateur && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconUser style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {event.moderateur}
                          </div>
                        )}
                      </td>
                      <td>
                        {event.dirigeant_priere && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                            <IconPray style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            {event.dirigeant_priere}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📜</div>
                      <p style={{ fontSize: '1rem' }}>Aucun historique de programme disponible pour l'année en cours.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}