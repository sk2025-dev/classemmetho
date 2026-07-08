import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    PieChart,
    Download,
    Plus,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const fmtCurrency = (n) => `${fmt(n)} F`;

export default function AdminTresorerie({
    stats: statsProp,
    cotisations: cotisationsProp,
    paiementsRecents: paiementsRecentsProp,
    dons: donsProp,
}) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedCotisation, setSelectedCotisation] = useState(null);
    const [cotisationsPage, setCotisationsPage] = useState(1);
    const COTISATIONS_PER_PAGE = 10;
    const [paiementsPage, setPaiementsPage] = useState(1);
    const PAIEMENTS_PER_PAGE = 10;
    const [donSearch, setDonSearch] = useState("");

    const emptyStats = {
        cotisationsTotales: 0,
        cotisationsPayees: 0,
        cotisationsEnRetard: 0,
        tauxPaiement: 0,
        donsTotaux: 0,
        famillesActives: 0,
    };

    const stats = statsProp || emptyStats;
    const cotisations = Array.isArray(cotisationsProp) ? cotisationsProp : [];
    const paiementsRecents = Array.isArray(paiementsRecentsProp) ? paiementsRecentsProp : [];
    const dons = Array.isArray(donsProp) ? donsProp : [];
    const donsFiltres = donSearch.trim() === "" ? dons : dons.filter((d) => {
        const q = donSearch.toLowerCase();
        return (
            (d.donor_name || "").toLowerCase().includes(q) ||
            (d.numero_donateur || "").includes(q) ||
            (d.reference_recu || "").toLowerCase().includes(q) ||
            (d.mode_paiement || "").toLowerCase().includes(q) ||
            (d.donation_date || "").includes(q) ||
            (d.note || "").toLowerCase().includes(q)
        );
    });
    const reportDate = new Date();
    const currentMonthValue = `${reportDate.getFullYear()}-${String(
        reportDate.getMonth() + 1,
    ).padStart(2, "0")}`;
    const currentYearValue = String(reportDate.getFullYear());
    const currentMonthLabel = reportDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });
    const currentYearLabel = reportDate.toLocaleDateString("fr-FR", {
        year: "numeric",
    });
    const monthlyReportUrl = withBasePath(
        "",
        `/admin/tresorerie/export?scope=monthly&month=${encodeURIComponent(currentMonthValue)}`,
    );
    const annualReportUrl = withBasePath(
        "",
        `/admin/tresorerie/export?scope=annual&year=${encodeURIComponent(currentYearValue)}`,
    );

    // Debug: Log les dons reçus
    React.useEffect(() => {
        console.log('Dons reçus du serveur:', donsProp);
        console.log('Dons affichés:', dons);
    }, [donsProp, dons]);

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute("content") : "";
    };

    const postJson = async (url, payload, method = "POST") => {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                Accept: "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Requête API invalide");
        }
    };

    const handleAddCotisation = async () => {
        if (isSubmitting) return;

        const nom = window.prompt(
            "Nom de la cotisation ?",
            "Nouvelle cotisation",
        );
        if (!nom) return;

        const montantInput = window.prompt("Montant (F CFA) ?", "15000");
        const montant = Number(montantInput || 0);
        if (!Number.isFinite(montant) || montant < 100) {
            alert("Montant invalide.");
            return;
        }

        setIsSubmitting(true);
        try {
            await postJson(withBasePath("", "/api/admin/tresorerie/cotisations"), {
                nom,
                montant,
                periodicite: "MENSUEL",
                statut: "ACTIVE",
                classe_id: null,
            });
            alert("Cotisation créée.");
            window.location.reload();
        } catch (error) {
            alert("Échec de création de la cotisation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCotisation = async (cotisation) => {
        if (isSubmitting) return;

        const montantInput = window.prompt(
            `Nouveau montant pour ${cotisation.nom} (F CFA)`,
            String(cotisation.montant || 0),
        );
        if (!montantInput) return;

        const montant = Number(montantInput);
        if (!Number.isFinite(montant) || montant < 100) {
            alert("Montant invalide.");
            return;
        }

        setIsSubmitting(true);
        try {
            await postJson(
                withBasePath("", `/api/admin/tresorerie/cotisations/${cotisation.id}`),
                { montant },
                "PUT",
            );
            alert("Cotisation mise à jour.");
            window.location.reload();
        } catch (error) {
            alert("Échec de mise à jour de la cotisation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewCotisation = (cotisation) => {
        setSelectedCotisation(cotisation);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedCotisation(null);
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background: "var(--main-gradient)",
            }}
        >
            <Head title="Trésorerie - Admin" />

            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
                <div className="mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={withBasePath("", "/admin/dashboard")}
                            className="p-2 hover:bg-white/20 rounded-lg transition"
                        >
                            <ArrowLeft size={24} className="text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Gestion Financière
                            </h1>
                            <p className="text-white/80 text-sm mt-1">
                                Supervision complète des finances
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Cotisations totales
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {fmtCurrency(stats.cotisationsTotales ?? 0)}
                                </p>
                            </div>
                            <DollarSign className="text-blue-600" size={32} />
                        </div>
                        <p className="text-xs text-green-600 font-semibold">
                            ↑ 12% ce mois
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Taux de paiement
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.tauxPaiement}%
                                </p>
                            </div>
                            <TrendingUp className="text-green-600" size={32} />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: `${stats.tauxPaiement}%`,
                                    backgroundColor:
                                        stats.tauxPaiement >= 75 ? "#16a34a"
                                        : stats.tauxPaiement >= 50 ? "#f59e0b"
                                        : "#ef4444",
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Dons collectés
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {fmtCurrency(stats.donsTotaux ?? 0)}
                                </p>
                            </div>
                            <PieChart className="text-purple-600" size={32} />
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">
                            Collectes en cours
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Familles actives
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.famillesActives}
                                </p>
                            </div>
                            <Users className="text-orange-600" size={32} />
                        </div>
                        <p className="text-xs text-orange-600 font-semibold">
                            → Stables
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {[
                            {
                                id: "dashboard",
                                label: "📊 Paiements",
                                icon: BarChart3,
                            },
                            {
                                id: "fimeco",
                                label: "🏛️ FIMECO",
                                icon: Users,
                            },
                            {
                                id: "don",
                                label: "🎁 Dons",
                                icon: PieChart,
                            },
                            {
                                id: "cotisations",
                                label: "💰 Cotisations",
                                icon: DollarSign,
                            },
                            {
                                id: "rapport",
                                label: "📈 Rapports",
                                icon: Download,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-6 py-4 font-semibold transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-blue-600 text-blue-600 bg-blue-50"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {activeTab === "dashboard" && (() => {
                            const totalPagesPaiements = Math.ceil(paiementsRecents.length / PAIEMENTS_PER_PAGE);
                            const paginatedPaiements = paiementsRecents.slice(
                                (paiementsPage - 1) * PAIEMENTS_PER_PAGE,
                                paiementsPage * PAIEMENTS_PER_PAGE,
                            );
                            return (
                                <div className="space-y-6">
                                    {/* Paiements récents */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                Paiements récents
                                                <span className="ml-2 text-sm font-normal text-gray-500">
                                                    ({paiementsRecents.length})
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Famille
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Type
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Montant
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Mode
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                            Statut
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {paginatedPaiements.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                                                                Aucun paiement enregistré pour le moment.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        paginatedPaiements.map((paiement) => (
                                                            <tr key={paiement.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                                    {paiement.famille}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-700">
                                                                    {paiement.type}
                                                                </td>
                                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                                    {fmtCurrency(paiement.montant)}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {paiement.mode}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {paiement.date}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                                        {paiement.statut}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalPagesPaiements > 1 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                                <p className="text-sm text-gray-500">
                                                    Page {paiementsPage} sur {totalPagesPaiements} — {paiementsRecents.length} paiement{paiementsRecents.length > 1 ? "s" : ""}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setPaiementsPage((p) => Math.max(1, p - 1))}
                                                        disabled={paiementsPage === 1}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft size={16} /> Précédent
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: totalPagesPaiements }, (_, i) => i + 1).map((page) => (
                                                            <button
                                                                key={page}
                                                                onClick={() => setPaiementsPage(page)}
                                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                                    page === paiementsPage
                                                                        ? "bg-blue-600 text-white"
                                                                        : "text-gray-700 hover:bg-gray-100"
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setPaiementsPage((p) => Math.min(totalPagesPaiements, p + 1))}
                                                        disabled={paiementsPage === totalPagesPaiements}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Suivant <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === "fimeco" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <p className="text-sm text-blue-900 font-semibold">
                                            Cotisations FIMECO
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">
                                            {fmtCurrency(
                                                stats.cotisationsTotales ?? 0,
                                            )}
                                        </p>
                                        <p className="text-xs text-blue-700 mt-2">
                                            {fmtCurrency(
                                                stats.cotisationsPayees ?? 0,
                                            )}{" "}
                                            payés
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                        <p className="text-sm text-green-900 font-semibold">
                                            Familles actives
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">
                                            {stats.famillesActives ?? 0}
                                        </p>
                                        <p className="text-xs text-green-700 mt-2">
                                            Participation régulière
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                        <p className="text-sm text-purple-900 font-semibold">
                                            Dons collectés
                                        </p>
                                        <p className="text-2xl font-bold text-purple-600 mt-2">
                                            {fmtCurrency(stats.donsTotaux ?? 0)}
                                        </p>
                                        <p className="text-xs text-purple-700 mt-2">
                                            Contributions volontaires
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                                        Gestion FIMECO
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h5 className="font-semibold text-gray-900 mb-2">
                                                📊 Suivi des paiements
                                            </h5>
                                            <p className="text-sm text-gray-600">
                                                Gérez les cotisations mensuelles
                                                et suivez les retards de
                                                paiement.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h5 className="font-semibold text-gray-900 mb-2">
                                                👥 Gestion des familles
                                            </h5>
                                            <p className="text-sm text-gray-600">
                                                Supervisez l'adhésion des
                                                familles et leur participation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "don" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                        <p className="text-sm text-purple-900 font-semibold">
                                            Total des dons
                                        </p>
                                        <p className="text-2xl font-bold text-purple-600 mt-2">
                                            {fmtCurrency(stats.donsTotaux ?? 0)}
                                        </p>
                                        <p className="text-xs text-purple-700 mt-2">
                                            Dons enregistrés dans le système
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                        <p className="text-sm text-green-900 font-semibold">
                                            Nombre de dons
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">
                                            {dons.length}
                                        </p>
                                        <p className="text-xs text-green-700 mt-2">
                                            Contributions individuelles
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <p className="text-sm text-blue-900 font-semibold">
                                            Don moyen
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">
                                            {dons.length > 0 ? fmtCurrency(Math.round((stats.donsTotaux ?? 0) / dons.length)) : fmtCurrency(0)}
                                        </p>
                                        <p className="text-xs text-blue-700 mt-2">
                                            Par contribution
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900">
                                                Liste des dons
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {donsFiltres.length} / {dons.length} don{dons.length > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <input
                                            type="text"
                                            value={donSearch}
                                            onChange={(e) => setDonSearch(e.target.value)}
                                            placeholder="Rechercher par nom, numéro, référence, réseau..."
                                            className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                                        />
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donateur</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réseau</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {donsFiltres.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">
                                                            {donSearch ? "Aucun résultat pour cette recherche." : "Aucun don enregistré pour le moment."}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    donsFiltres.map((don) => (
                                                        <tr key={don.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {don.donor_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                                                {don.numero_donateur || <span className="text-gray-300">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                                {fmtCurrency(don.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                {don.is_online ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                                        {don.mode_paiement}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                                                        {don.mode_paiement}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                                                {don.reference_recu || <span className="text-gray-300">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                                <div className="font-medium">{don.donation_date}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {don.donation_time || '—'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                                                                {don.note || <span className="text-gray-300">—</span>}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "cotisations" && (() => {
                            const totalPages = Math.ceil(cotisations.length / COTISATIONS_PER_PAGE);
                            const paginated = cotisations.slice(
                                (cotisationsPage - 1) * COTISATIONS_PER_PAGE,
                                cotisationsPage * COTISATIONS_PER_PAGE,
                            );
                            return (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Types de cotisations
                                            <span className="ml-2 text-sm font-normal text-gray-500">
                                                ({cotisations.length})
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {paginated.map((cot) => (
                                            <div
                                                key={cot.id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {cot.nom}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {cot.montant.toLocaleString()}{" "}
                                                        F CFA • {cot.periodicite}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        {cot.statut}
                                                    </span>
                                                    <button
                                                        onClick={() => handleViewCotisation(cot)}
                                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
                                                    >
                                                        Voir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-500">
                                                Page {cotisationsPage} sur {totalPages} — {cotisations.length} cotisation{cotisations.length > 1 ? "s" : ""}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCotisationsPage((p) => Math.max(1, p - 1))}
                                                    disabled={cotisationsPage === 1}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronLeft size={16} /> Précédent
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCotisationsPage(page)}
                                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                                page === cotisationsPage
                                                                    ? "bg-blue-600 text-white"
                                                                    : "text-gray-700 hover:bg-gray-100"
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setCotisationsPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={cotisationsPage === totalPages}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Suivant <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {activeTab === "rapport" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Générer des rapports
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a
                                        href={monthlyReportUrl}
                                        className="block p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <Download
                                            className="text-blue-600 mx-auto mb-3"
                                            size={32}
                                        />
                                        <h4 className="font-semibold text-gray-900">
                                            Rapport Mensuel
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Exports cotisations & dons du mois
                                        </p>
                                        <p className="text-xs text-blue-700 mt-3 font-medium">
                                            Excel du mois en cours ({currentMonthLabel})
                                        </p>
                                    </a>
                                    <a
                                        href={annualReportUrl}
                                        className="block p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <Download
                                            className="text-blue-600 mx-auto mb-3"
                                            size={32}
                                        />
                                        <h4 className="font-semibold text-gray-900">
                                            Rapport Annuel
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Bilan financier complet de l'année
                                        </p>
                                        <p className="text-xs text-blue-700 mt-3 font-medium">
                                            Excel de l'annee {currentYearLabel}
                                        </p>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isViewModalOpen && selectedCotisation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Détails de la cotisation
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Informations de création et participation
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="text-gray-400 hover:text-gray-700 transition"
                            >
                                Fermer
                            </button>
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Cotisation</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {selectedCotisation.nom}
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[.24em] text-slate-500">
                                        Créée le
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {selectedCotisation.created_at
                                            ? new Date(selectedCotisation.created_at).toLocaleDateString('fr-FR')
                                            : 'Non disponible'}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[.24em] text-slate-500">
                                        Créée par
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {selectedCotisation.created_by || 'Non spécifié'}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[.24em] text-slate-500">
                                        Classe
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {selectedCotisation.classe_nom || 'Non spécifié'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
