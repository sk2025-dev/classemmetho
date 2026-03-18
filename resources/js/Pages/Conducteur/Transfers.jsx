import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  CheckCircle, XCircle, Clock, ArrowRight, User, Users,
  Calendar, MapPin, FileText, AlertCircle
} from 'lucide-react';

// --- Composants UI ---

const StatusBadge = ({ status }) => {
  const configs = {
    'EN_ATTENTE_SOURCE': {
      label: 'Validation Source',
      classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
    },
    'EN_ATTENTE_ACCUEIL': {
      label: 'Validation Accueil',
      classes: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20'
    },
    'TERMINEE': {
      label: 'Terminée',
      classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
    },
    'REFUSEE': {
      label: 'Refusée',
      classes: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
    },
  };
  const config = configs[status] || { label: status, classes: 'bg-gray-50 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, bgColor }) => (
  <div className={`rounded-xl p-5 flex items-center gap-4 shadow-lg backdrop-blur-sm ${bgColor}`}>
    <div className="p-3 rounded-lg bg-white/20">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const TransferCard = ({ transfer, onApprove, onRefuse }) => {
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action, payload = {}) => {
    setIsProcessing(true);
    action(transfer.id, payload.reason);
  };

  return (
    <div className="bg-white rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
        <div>
          <h3 className="font-bold text-lg text-slate-900">{transfer.member?.name || transfer.family?.name}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <FileText className="w-3.5 h-3.5" />
            Réf: {transfer.reference}
          </p>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Type & Date */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            {transfer.type === 'member' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span>{transfer.type === 'member' ? 'Membre Individuel' : 'Famille'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{transfer.created_at}</span>
          </div>
        </div>

        {/* Trajet */}
        <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-700">{transfer.classe_source.nom}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400" />
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-indigo-600">{transfer.classe_cible.nom}</span>
          </div>
        </div>

        {/* Motif initial */}
        {transfer.reason && (
          <div className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <span className="font-semibold text-amber-800">Motif initial :</span> {transfer.reason}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          {!showRefuseForm ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(onApprove)}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <CheckCircle className="w-5 h-5" />
                Approuver
              </button>
              <button
                onClick={() => setShowRefuseForm(true)}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Refuser
              </button>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
              <label className="block text-sm font-semibold text-red-800">Motif du refus (obligatoire)</label>
              <textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Veuillez indiquer la raison..."
                rows={2}
                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowRefuseForm(false); setRefuseReason(''); }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction(onRefuse, { reason: refuseReason })}
                  disabled={!refuseReason.trim()}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Composant Principal ---

export default function Transfers() {
  const { pendingTransfers = [], processedTransfers = [], stats = {}, userClass = {}, flash = {} } = usePage().props;
  const [activeTab, setActiveTab] = useState('pending');

  const handleApprove = (transferId) => {
    const transfer = pendingTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    let url = '';
    if (transfer.status === 'EN_ATTENTE_SOURCE') url = `/conducteur/transferts/${transferId}/approve-source`;
    if (transfer.status === 'EN_ATTENTE_ACCUEIL') url = `/conducteur/transferts/${transferId}/approve-accueil`;

    if (url) router.post(url, {}, { preserveScroll: true });
  };

  const handleRefuse = (transferId, reason) => {
    router.post(`/conducteur/transferts/${transferId}/refuse`, { reason }, { preserveScroll: true });
  };

  const pendingByStatus = useMemo(() => {
    return {
      source: pendingTransfers.filter(t => t.status === 'EN_ATTENTE_SOURCE'),
      accueil: pendingTransfers.filter(t => t.status === 'EN_ATTENTE_ACCUEIL')
    };
  }, [pendingTransfers]);

  return (
    <div className="min-h-screen font-sans antialiased px-4 sm:px-6 lg:px-8 py-8"
      style={{
        background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header Area */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Gestion des Transferts</h1>
          <p className="text-white/80">
            Classe courante : <span className="font-semibold text-white">{userClass.nom}</span>
          </p>
        </div>

        {/* Flash Messages */}
        <div className="mb-6 space-y-3">
          {flash.success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm font-medium shadow-lg">
              <CheckCircle className="w-5 h-5 text-green-300" />
              {flash.success}
            </div>
          )}
          {flash.error && (
             <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-red-400/30 rounded-lg text-white text-sm font-medium shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-300" />
              {flash.error}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="En attente Source"
            value={pendingByStatus.source.length}
            icon={User}
            bgColor="bg-white/10 border border-white/20"
          />
          <StatCard
            title="En attente Accueil"
            value={pendingByStatus.accueil.length}
            icon={MapPin}
            bgColor="bg-white/10 border border-white/20"
          />
          <StatCard
            title="Traitées"
            value={processedTransfers.length}
            icon={CheckCircle}
            bgColor="bg-white/10 border border-white/20"
          />
        </div>

        {/* Tabs (Style Pills pour fond sombre) */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            En cours ({pendingTransfers.length})
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2 ${
              activeTab === 'processed'
                ? 'bg-white text-slate-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Historique
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'pending' ? (
          <div className="space-y-8">
            {/* Section Validation Source */}
            {pendingByStatus.source.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1 bg-amber-400 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-white drop-shadow-md">Étape 1 : Validation Source</h2>
                  <span className="text-xs font-medium bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded-full border border-amber-400/30">{pendingByStatus.source.length}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingByStatus.source.map(t => (
                    <TransferCard key={t.id} transfer={t} onApprove={handleApprove} onRefuse={handleRefuse} />
                  ))}
                </div>
              </div>
            )}

            {/* Section Validation Accueil */}
            {pendingByStatus.accueil.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1 bg-sky-400 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-white drop-shadow-md">Étape 2 : Validation Accueil</h2>
                  <span className="text-xs font-medium bg-sky-500/30 text-sky-100 px-2 py-0.5 rounded-full border border-sky-400/30">{pendingByStatus.accueil.length}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingByStatus.accueil.map(t => (
                    <TransferCard key={t.id} transfer={t} onApprove={handleApprove} onRefuse={handleRefuse} />
                  ))}
                </div>
              </div>
            )}

            {pendingTransfers.length === 0 && (
              <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="text-lg font-medium text-white">Aucune demande en attente</h3>
                <p className="mt-1 text-sm text-white/60">Le flux de travail est vide. Vous êtes à jour.</p>
              </div>
            )}
          </div>
        ) : (
          // Vue Tableau pour l'historique
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bénéficiaire</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trajet</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {processedTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            {t.type === 'member' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{t.member?.name || t.family?.name}</div>
                            <div className="text-xs text-slate-500">{t.reference}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{t.classe_source.nom}</span>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                          <span className="font-medium text-slate-900">{t.classe_cible.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.created_at}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedTransfers.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-white">
                Aucun historique disponible.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
