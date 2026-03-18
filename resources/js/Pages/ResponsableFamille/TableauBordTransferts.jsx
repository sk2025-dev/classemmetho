import React, { useState, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  ArrowLeft, ArrowRight, Move, CheckCircle, Clock, XCircle,
  Eye, Plus, User, UsersRound, Inbox, Search, X, ChevronRight
} from 'lucide-react';



// --- SMART PROGRESS BAR (Adaptée aux couleurs Orange/Vert/Rouge) ---
const SmartProgressBar = ({ status }) => {
  const statusToPercent = {
    'SOUMISE': 15, 'EN_ATTENTE_SOURCE': 30, 'VALIDEE_SOURCE': 50,
    'EN_ATTENTE_ACCUEIL': 70, 'VALIDEE_ACCUEIL': 90, 'TERMINEE': 100, 'REFUSEE': 100,
  };
  const percent = statusToPercent[status] ?? 0;
  const isRefused = status === 'REFUSEE';
  const isComplete = status === 'TERMINEE' || status === 'VALIDEE_ACCUEIL';

  return (
    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${
          isRefused ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-orange-500'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// --- DETAILED TIMELINE ---
const TransferTimeline = ({ transfer }) => {
  const isRefused = transfer.status === 'REFUSEE';
  const statusOrder = ['SOUMISE', 'EN_ATTENTE_SOURCE', 'VALIDEE_SOURCE', 'EN_ATTENTE_ACCUEIL', 'VALIDEE_ACCUEIL', 'TERMINEE'];
  const currentIndex = statusOrder.indexOf(transfer.status);

  const steps = [
    {
      label: 'Soumission',
      date: transfer.created_at,
      person: transfer.member?.name || transfer.family?.name || '—',
      done: currentIndex >= 0,
      active: currentIndex === 0 || currentIndex === 1,
    },
    {
      label: 'Validation Source',
      date: transfer.validated_source_at,
      person: transfer.validated_source_by,
      done: currentIndex >= 2,
      active: currentIndex === 2 || currentIndex === 3,
    },
    {
      label: isRefused ? 'Refusé' : 'Validation Accueil',
      date: transfer.validated_accueil_at,
      person: transfer.validated_accueil_by,
      done: currentIndex >= 4,
      active: currentIndex === 4 || currentIndex === 5,
      refused: isRefused,
    },
  ];

  return (
    <div className="relative flex flex-col gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        let dotColor = 'bg-gray-300 border-gray-300';
        if (step.refused) dotColor = 'bg-red-500 border-red-500';
        else if (step.done) dotColor = 'bg-green-500 border-green-500';
        else if (step.active) dotColor = 'bg-orange-500 border-orange-500 animate-pulse';

        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 ${dotColor}`} />
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[32px] ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-semibold ${step.refused ? 'text-red-600' : step.done || step.active ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>
              )}
              {step.person && (
                <p className="text-xs text-gray-500">par {step.person}</p>
              )}
              {!step.date && !step.done && !step.refused && (
                <p className="text-xs text-gray-400 italic mt-0.5">En attente</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- STATUS BADGE (Couleurs vives) ---
const StatusBadge = ({ status }) => {
  const configs = {
    'SOUMISE': { label: 'Soumise', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
    'EN_ATTENTE_SOURCE': { label: 'Attente Source', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'VALIDEE_SOURCE': { label: 'Validée Source', classes: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'EN_ATTENTE_ACCUEIL': { label: 'Attente Accueil', classes: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    'VALIDEE_ACCUEIL': { label: 'Terminé', classes: 'bg-green-100 text-green-800 border-green-200' },
    'TERMINEE': { label: 'Terminé', classes: 'bg-green-100 text-green-800 border-green-200' },
    'REFUSEE': { label: 'Refusé', classes: 'bg-red-100 text-red-800 border-red-200' },
  };
  const config = configs[status] || { label: status, classes: 'bg-gray-100 text-gray-800 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.classes}`}>
      {config.label}
    </span>
  );
};

// --- STAT CARD ---
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white/90 backdrop-blur rounded-xl p-5 flex items-center gap-4 shadow-lg border border-white/60 transition-all hover:-translate-y-0.5 duration-200">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- STEP DOTS ---
const StepDots = ({ current, total }) => (
  <div className="flex items-center gap-2 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-200 ${
          i + 1 === current
            ? 'w-6 h-2 bg-orange-500'
            : i + 1 < current
            ? 'w-2 h-2 bg-green-500'
            : 'w-2 h-2 bg-gray-300'
        }`}
      />
    ))}
  </div>
);

// --- MAIN COMPONENT ---
export default function Index({ transfers = [], classes = [], family = {}, members = [] }) {
  const { flash } = usePage().props;
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (flash?.success) {
      setNotification({ type: 'success', message: flash.success });
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
    if (flash?.error) {
      setNotification({ type: 'error', message: flash.error });
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [formData, setFormData] = useState({ type: 'member', member_id: '', target_class_id: '', reason: '' });
  const [processing, setProcessing] = useState(false);

  const stats = useMemo(() => ({
    total: transfers.length,
    pending: transfers.filter(t => ['SOUMISE', 'EN_ATTENTE_SOURCE', 'EN_ATTENTE_ACCUEIL'].includes(t.status)).length,
    completed: transfers.filter(t => ['VALIDEE_ACCUEIL', 'TERMINEE'].includes(t.status)).length,
    rejected: transfers.filter(t => t.status === 'REFUSEE').length,
  }), [transfers]);

  const filteredTransfers = transfers.filter(t => {
    const matchSearch = !searchTerm ||
      t.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.family?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNextStep = () => {
    if (modalStep === 1 && !formData.type) return;
    if (modalStep === 2) {
      if (formData.type === 'member' && !formData.member_id) return;
      if (!formData.target_class_id) return;
    }
    setModalStep(modalStep + 1);
  };

  const handleSubmit = () => {
    setProcessing(true);

    router.post('/responsable-famille/transferts', {
      type: formData.type,
      user_id: formData.type === 'member' ? parseInt(formData.member_id) : null,
      target_class_id: parseInt(formData.target_class_id),
      reason: formData.reason || null,
    }, {
      onFinish: () => {
        setProcessing(false);
        setIsModalOpen(false);
        setModalStep(1);
        setFormData({ type: 'member', member_id: '', target_class_id: '', reason: '' });
      },
    });
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setModalStep(1);
    setFormData({ type: 'member', member_id: '', target_class_id: '', reason: '' });
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-xl text-white font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-right-10 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.type === 'success' ? '✓' : '✕'}
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Transferts de Classe</h1>
            <p className="text-blue-100 text-lg">Suivi des demandes en 3 étapes</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Demande
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Move} label="Total" value={stats.total} accent="bg-blue-100 text-blue-600" />
          <StatCard icon={Clock} label="En Cours" value={stats.pending} accent="bg-yellow-100 text-yellow-600" />
          <StatCard icon={CheckCircle} label="Validés" value={stats.completed} accent="bg-green-100 text-green-600" />
          <StatCard icon={XCircle} label="Refusés" value={stats.rejected} accent="bg-red-100 text-red-600" />
        </div>

        {/* Filtres (Affichés seulement s'il y a des données) */}
        {transfers.length > 0 && (
          <div className="bg-white/90 backdrop-blur rounded-xl p-6 mb-6 border border-white/60 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher un membre ou une famille..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les statuts</option>
                <option value="SOUMISE">Soumise</option>
                <option value="VALIDEE_SOURCE">Validée Source</option>
                <option value="TERMINEE">Terminée</option>
                <option value="REFUSEE">Refusée</option>
              </select>
            </div>
          </div>
        )}

        {/* Contenu Principal */}
        {filteredTransfers.length === 0 ? (
          // État Vide
          <div className="flex flex-col items-center justify-center py-20 bg-white/90 backdrop-blur rounded-xl border border-white/60 shadow-2xl">
            <Inbox className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-xl font-bold text-gray-800 mb-2">Aucune demande de transfert</p>
            <p className="text-sm text-gray-500 mb-6">Commencez par créer votre première demande.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              Créer une demande
            </button>
          </div>
        ) : (
          // Grille de Cartes
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransfers.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTransfer(t)}
                className="group bg-white/90 backdrop-blur rounded-xl border border-white/60 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Top: name + badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{t.member?.name || t.family?.name}</p>
                    <p className="text-xs text-gray-500">{t.member ? 'Membre' : 'Famille'} · {t.reference || `TRF-${t.id}`}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 py-2 px-3 rounded-lg border">
                  <span className="font-medium text-gray-800 truncate">{t.classe_source?.nom || '—'}</span>
                  <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="font-bold text-orange-600 truncate">{t.classe_cible?.nom || '—'}</span>
                </div>

                {/* Progress */}
                <SmartProgressBar status={t.status} />

                {/* Hover CTA */}
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Eye className="w-3.5 h-3.5" />
                  Voir détails
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL CRÉATION --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={resetModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h2 className="text-xl font-bold">Nouvelle Demande</h2>
              <div className="mt-3">
                <StepDots current={modalStep} total={3} />
              </div>
            </div>

            {/* Body */}
            <div className="p-6 min-h-[200px]">
              {modalStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium mb-4">Qui concerne ce transfert ?</p>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'member' })}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${formData.type === 'member' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-bold">Un Membre</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'family', member_id: '' })}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${formData.type === 'family' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <UsersRound className="w-5 h-5" />
                    <span className="font-bold">Toute la Famille</span>
                  </button>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-4">
                  {formData.type === 'member' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Membre</label>
                      <select
                        value={formData.member_id}
                        onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.nom} {m.prenom}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Classe cible</label>
                    <select
                      value={formData.target_class_id}
                      onChange={e => setFormData({ ...formData, target_class_id: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Motif (optionnel)</label>
                    <textarea
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Expliquez la raison..."
                    />
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700">Récapitulatif</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-semibold text-gray-800">{formData.type === 'member' ? 'Membre' : 'Famille'}</span>
                    </div>
                    {formData.type === 'member' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Membre</span>
                        <span className="font-semibold text-gray-800">{members.find(m => String(m.id) === formData.member_id) ? `${members.find(m => String(m.id) === formData.member_id)?.nom} ${members.find(m => String(m.id) === formData.member_id)?.prenom}` : '—'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Classe cible</span>
                      <span className="font-semibold text-gray-800">{classes.find(c => String(c.id) === formData.target_class_id)?.nom || '—'}</span>
                    </div>
                    {formData.reason && (
                      <div className="pt-2 border-t mt-2">
                        <span className="block text-gray-500 mb-1">Motif</span>
                        <span className="text-gray-800">{formData.reason}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 italic">Votre demande sera validée par le conducteur source, puis par le conducteur d'accueil.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50">
              <button
                onClick={() => modalStep > 1 ? setModalStep(modalStep - 1) : resetModal()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {modalStep > 1 ? 'Retour' : 'Annuler'}
              </button>
              {modalStep < 3 ? (
                <button onClick={handleNextStep} className="px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-all shadow-sm">
                  Suivant
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={processing} className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 shadow-sm">
                  {processing ? 'Envoi...' : 'Confirmer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DÉTAILS --- */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedTransfer(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTransfer.member?.name || selectedTransfer.family?.name}</h2>
                <p className="text-xs text-gray-500">{selectedTransfer.reference || `TRF-${selectedTransfer.id}`}</p>
              </div>
              <button onClick={() => setSelectedTransfer(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTransfer.status} />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-24 shrink-0">Source</span>
                  <span className="font-medium text-gray-800">{selectedTransfer.classe_source?.nom}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-24 shrink-0">Destination</span>
                  <span className="font-bold text-orange-600">{selectedTransfer.classe_cible?.nom}</span>
                </div>
                {selectedTransfer.reason && (
                  <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500 w-24 shrink-0">Motif</span>
                    <span className="text-gray-800 italic">{selectedTransfer.reason}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Progression</p>
                <TransferTimeline transfer={selectedTransfer} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
