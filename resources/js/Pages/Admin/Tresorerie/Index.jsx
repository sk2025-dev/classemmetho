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

    const fallbackStats = {
        cotisationsTotales: 2500000,
        cotisationsPayees: 1875000,
        cotisationsEnRetard: 625000,
        tauxPaiement: 75,
        donsTotaux: 450000,
        famillesActives: 45,
    };

    const fallbackCotisations = [
        {
            id: 1,
            nom: "FIMECO",
            montant: 15000,
            periodicite: "Mensuel",
            statut: "Actif",
            classes: "Toutes",
        },
        {
            id: 2,
            nom: "Affiliation CEMEC",
            montant: 50000,
            periodicite: "Annuel",
            statut: "Actif",
            classes: "Toutes",
        },
        {
            id: 3,
            nom: "Cotisation paroissiale",
            montant: 10000,
            periodicite: "Mensuel",
            statut: "Actif",
            classes: "Toutes",
        },
    ];

    const fallbackPaiementsRecents = [
        {
            id: 1,
            famille: "Famille Koné",
            montant: 150000,
            type: "FIMECO",
            date: "15/03/2026",
            mode: "Mobile Money",
            statut: "✓ Payé",
        },
        {
            id: 2,
            famille: "Famille Traoré",
            montant: 50000,
            type: "Affiliation CEMEC",
            date: "12/03/2026",
            mode: "Espèces",
            statut: "✓ Payé",
        },
        {
            id: 3,
            famille: "Famille Diallo",
            montant: 75000,
            type: "FIMECO",
            date: "10/03/2026",
            mode: "Virement",
            statut: "✓ Payé",
        },
        {
            id: 4,
            famille: "Famille Cissé",
            montant: 10000,
            type: "Cotisation paroissiale",
            date: "05/03/2026",
            mode: "Mobile Money",
            statut: "✓ Payé",
        },
    ];

    const fallbackDons = [
        {
            id: 1,
            donor_name: "Famille Koné",
            amount: 50000,
            donation_date: "15/03/2026",
            treasurer_name: "Marie Dupont",
            class_name: "Classe A",
        },
        {
            id: 2,
            donor_name: "Famille Traoré",
            amount: 25000,
            donation_date: "12/03/2026",
            treasurer_name: "Jean Martin",
            class_name: "Classe B",
        },
        {
            id: 3,
            donor_name: "Famille Diallo",
            amount: 100000,
            donation_date: "10/03/2026",
            treasurer_name: "Sophie Bernard",
            class_name: "Classe A",
        },
    ];

    const stats = statsProp || fallbackStats;
    const cotisations =
        Array.isArray(cotisationsProp) && cotisationsProp.length
            ? cotisationsProp
            : fallbackCotisations;
    const paiementsRecents =
        Array.isArray(paiementsRecentsProp) && paiementsRecentsProp.length
            ? paiementsRecentsProp
            : fallbackPaiementsRecents;
    const dons =
        Array.isArray(donsProp) && donsProp.length
            ? donsProp
            : fallbackDons;
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
            await postJson("/api/admin/tresorerie/cotisations", {
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
                `/api/admin/tresorerie/cotisations/${cotisation.id}`,
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
                                className="bg-green-60 h-2 rounded-full"
                                style={{ width: `${stats.tauxPaiement}%` }}
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
                        {activeTab === "dashboard" && (
                            <div className="space-y-6">
                                {/* Paiements récents */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Paiements récents
                                    </h3>
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
                                                {paiementsRecents.map(
                                                    (paiement) => (
                                                        <tr
                                                            key={paiement.id}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {
                                                                    paiement.famille
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-700">
                                                                {paiement.type}
                                                            </td>
                                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                                {fmtCurrency(
                                                                    paiement.montant,
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {paiement.mode}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {paiement.date}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                                    {
                                                                        paiement.statut
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h4 className="text-lg font-bold text-gray-900">
                                            Liste des dons
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Dons enregistrés par les trésoriers de classe
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Donateur
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Montant
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Trésorier
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Classe
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Motif
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {dons.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                                            Aucun don enregistré pour le moment
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    dons.map((don) => (
                                                        <tr key={don.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {don.donor_name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {fmtCurrency(don.amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {don.donation_date}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {don.treasurer_name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {don.class_name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {don.note || ''}
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

                        {activeTab === "cotisations" && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Types de cotisations
                                    </h3>
                                    <button
                                        onClick={handleAddCotisation}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                                    >
                                        <Plus size={18} /> Ajouter
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {cotisations.map((cot) => (
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
                                                    onClick={() =>
                                                        handleViewCotisation(
                                                            cot,
                                                        )
                                                    }
                                                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
                                                >
                                                    Voir
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
