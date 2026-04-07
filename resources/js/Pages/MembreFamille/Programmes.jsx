import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';

// Configuration d'axios avec le token CSRF
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

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
    margin-bottom: 1rem;
}
.btn-back:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

/* Carte Archive en orange lumineux avec icône */
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
.archive-card .cal-day-label {
    color: rgba(255, 255, 255, 0.9);
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

/* Empty Dialog - Style moderne et animé */
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
.empty-dialog-button:active {
    transform: translateY(0);
}

/* Responsive */
@media (max-width: 900px) {
    .glass-container {
        padding: 15px;
    }
    .layout-split-wrapper {
        flex-direction: column;
    }
    .split-sidebar {
        width: 100%;
        position: static;
        margin-top: 20px;
    }
    .btn-back {
        width: 100%;
        justify-content: center;
    }
}
@media (max-width: 600px) {
    .modal-form-grid {
        grid-template-columns: 1fr;
    }
    .modal-full {
        grid-column: auto;
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
    .empty-dialog {
        padding: 32px 24px;
    }
    .empty-dialog-title {
        font-size: 1.4rem;
    }
    .empty-dialog-icon {
        font-size: 3.5rem;
    }
}
`;

// --- ICONS ---
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconArchive = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
);
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
);

// --- COMPOSANTS ---
const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([1, 11, 24]);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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
    const startPadding = firstDay.getDay();
    const padCount = (startPadding === 0 ? 6 : startPadding - 1);
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

// --- PAGE PRINCIPALE ---
export default function ProgrammesClasse() {
  const { props } = usePage();
  const {
    initialClassList = [],
    initialClassHistory = [],
    classeNom = '',
  } = props;

  const handleGoBack = () => {
    router.visit('/dashboard');
  };

  // Composant de boîte de dialogue pour section vide
  const EmptyDialog = () => {
    return (
      <div className="empty-dialog">
        <div className="empty-dialog-icon">📋</div>
        <div className="empty-dialog-title">Aucun programme</div>
        <div className="empty-dialog-message">
          Aucun programme d'activité n'est actuellement disponible pour votre classe.
          <br />
          Revenez plus tard pour découvrir les activités à venir.
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title={`Programmes - ${classeNom}`} />
      <style>{styles}</style>

      <div className="min-h-screen animate-fade-in-up" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)", paddingBottom: '40px' }}>
        <main style={{ padding: '0 15px' }}>
          {/* Bouton Retour */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '20px 0' }}>
            <button className="btn-back" onClick={handleGoBack}>
              <IconArrowLeft /> Retour
            </button>
          </div>

          {/* Titre avec le nom de la classe */}
          <div className="action-bar" style={{ marginTop: 0 }}>
            <h2>📘 Programmes d'activités - {classeNom}</h2>
          </div>

          {/* Activités à venir */}
          <div className="glass-container">
            <div className="layout-split-wrapper">
              <div className="split-content">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>🔥 Activités à venir</h3>
                {initialClassList.length > 0 ? (
                  <div className="special-grid">
                    {initialClassList.map(event => (
                      <div key={event.id} className="special-card">
                        <div>
                          <div className="special-header">
                            <span className="special-date">{event.date}</span>
                          </div>
                          <h4 className="special-title">{event.title}</h4>
                          <p className="special-desc">{event.desc}</p>
                          {event.time && (
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                              ⏰ {event.time}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyDialog />
                )}
              </div>
              <div className="split-sidebar">
                <MiniCalendar />
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="action-bar">
            <h2>📜 HISTORIQUE DES PROGRAMMES</h2>
          </div>
          <div className="glass-container">
            <div className="layout-split-wrapper">
              <div className="split-content">
                {initialClassHistory.length > 0 ? (
                  <div className="special-grid">
                    {initialClassHistory.map(item => (
                      <div key={item.id} className="historical-card">
                        <div>
                          <div className="historical-header">
                            <span className="historical-date">{item.date}</span>
                          </div>
                          <h4 className="historical-title">{item.title}</h4>
                          <p className="historical-desc">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', width: '100%' }}>
                    Aucun historique disponible.
                  </div>
                )}
              </div>
              <div className="split-sidebar">
                <div className="archive-card">
                  <div className="cal-header">
                    <span className="cal-month-year">
                      <IconArchive /> Archives
                    </span>
                  </div>
                  <div className="archive-stats">
                    {initialClassHistory.length} Activités archivées
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}