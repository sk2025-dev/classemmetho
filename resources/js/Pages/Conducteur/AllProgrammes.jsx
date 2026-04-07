// pages/Conducteur/AllProgrammes.jsx

import React, { useState, useRef, useEffect } from 'react';
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
    cursor: pointer;
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
.btn-table-edit:hover {
    background: #2563eb;
    transform: translateY(-1px);
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
.btn-table-delete:hover {
    background: #dc2626;
    transform: translateY(-1px);
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

/* Modal Styles */
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

/* Responsive */
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
const IconPray = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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

// Modal d'édition
const EditProgrammeModal = ({ isOpen, onClose, event, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    orateur: '',
    moderateur: '',
    dirigeant_priere: '',
    lieu: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time?.substring(0, 5) || '',
        orateur: event.orateur || '',
        moderateur: event.moderateur || '',
        dirigeant_priere: event.dirigeant_priere || '',
        lieu: event.lieu || ''
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
          <button onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} id="edit-event-form">
            <div className="modal-form-grid">
              <div className="form-group modal-full">
                <label>Activité / Titre *</label>
                <span className="input-icon"><IconEdit /></span>
                <input type="text" name="title" placeholder="Ex: Étude biblique, Réunion de prière..." value={formData.title} onChange={handleChange} required />
                {errors.title && <small style={{ color: '#dc2626', marginTop: '4px' }}>{errors.title}</small>}
              </div>
              <div className="form-group">
                <label>Date *</label>
                <span className="input-icon"><IconCalendar /></span>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                {errors.date && <small style={{ color: '#dc2626', marginTop: '4px' }}>{errors.date}</small>}
              </div>
              <div className="form-group">
                <label>Heure *</label>
                <span className="input-icon"><IconClock /></span>
                <input type="time" name="time" value={formData.time} onChange={handleChange} required />
                {errors.time && <small style={{ color: '#dc2626', marginTop: '4px' }}>{errors.time}</small>}
              </div>
              <div className="form-group">
                <label>Orateur</label>
                <span className="input-icon"><IconMic /></span>
                <input type="text" name="orateur" placeholder="Nom de l'orateur..." value={formData.orateur} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Modérateur</label>
                <span className="input-icon"><IconUser /></span>
                <input type="text" name="moderateur" placeholder="Nom du modérateur..." value={formData.moderateur} onChange={handleChange} />
              </div>
              <div className="form-group modal-full">
                <label>Dirigeant de la prière</label>
                <span className="input-icon"><IconPray /></span>
                <input type="text" name="dirigeant_priere" placeholder="Nom du dirigeant de la prière..." value={formData.dirigeant_priere} onChange={handleChange} />
              </div>
              <div className="form-group modal-full">
                <label>Lieu de l'événement</label>
                <span className="input-icon" style={{ top: '42px' }}><IconLocation /></span>
                <textarea name="lieu" rows="3" placeholder="Adresse, salle, lieu de rendez-vous..." value={formData.lieu} onChange={handleChange} />
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
          <button type="submit" form="edit-event-form" className="btn-save" disabled={isSubmitting}>
            <IconPlus /> {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const tableRef = useRef(null);

  // Filtrer pour n'afficher que les activités présentes et futures
  const currentAndUpcomingProgrammes = allProgrammes.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleGoBack = () => {
    router.visit('/conducteur/programmes');
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleUpdateEvent = async (data, eventId) => {
    try {
      const response = await axios.put(`/conducteur/programmes/event/${eventId}`, data);
      if (response.data.success) {
        showToast('Événement modifié avec succès', 'success');
        closeEditModal();
        router.reload();
      } else {
        showToast('Erreur lors de la modification', 'error');
      }
    } catch (error) {
      console.error('Erreur de modification', error);
      if (error.response?.data?.errors) {
        throw error;
      }
      showToast('Erreur lors de la modification', 'error');
      throw error;
    }
  };

  const handleDelete = async (event, e) => {
    e.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
      try {
        const response = await axios.delete(`/conducteur/programmes/event/${event.id}`);
        if (response.data.success) {
          showToast('Événement supprimé avec succès', 'success');
          router.reload();
        } else {
          showToast('Erreur lors de la suppression', 'error');
        }
      } catch (error) {
        console.error('Erreur de suppression', error);
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = tableRef.current;
      if (!element) return;

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `programmes_${new Date().toISOString().split('T')[0]}.pdf`,
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

  const getStatus = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return 'Aujourd\'hui';
    if (date > today) return 'À venir';
    return 'Passé';
  };

  const getStatusClass = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return 'status-today';
    if (date > today) return 'status-upcoming';
    return 'status-past';
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
      <Head title="Tous les programmes" />
      <style>{tableStyles}</style>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <EditProgrammeModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        event={selectedEvent}
        onSave={handleUpdateEvent}
      />

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
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAndUpcomingProgrammes.length > 0 ? (
                  currentAndUpcomingProgrammes.map(event => (
                    <tr key={event.id} style={{ cursor: 'pointer' }}>
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
                       <td>
                        <span className={`status-badge ${getStatusClass(event.date)}`}>
                          {getStatus(event.date)}
                        </span>
                       </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="table-actions">
                          <button 
                            className="btn-table-edit" 
                            onClick={() => openEditModal(event)}
                          >
                            <IconEdit style={{ width: '14px', height: '14px' }} /> Modifier
                          </button>
                          <button 
                            className="btn-table-delete" 
                            onClick={(e) => handleDelete(event, e)}
                          >
                            <IconTrash style={{ width: '14px', height: '14px' }} /> Supprimer
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
                      <p style={{ fontSize: '1rem' }}>Aucun programme d'activité à venir pour l'année en cours.</p>
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