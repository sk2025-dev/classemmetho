import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
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
    campagnes: campagnesProp,
    paiementsRecents: paiementsRecentsProp,
}) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fallbackStats = {
        cotisationsTotales: 2500000,
        cotisationsPayees: 1875000,
        cotisationsEnRetard: 625000,
        tauxPaiement: 75,
        donsTotaux: 450000,
        campagnesActives: 1,
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

    const fallbackCampagnes = [
        {
            id: 1,
            nom: "Rénovation temple",
            objectif: 5000000,
            collecté: 3200000,
            classe: "Global",
            statut: "ACTIVE",
            progression: 64,
        },
        {
            id: 2,
            nom: "Achat chaises",
            objectif: 1000000,
            collecté: 750000,
            classe: "Classe 1",
            statut: "ACTIVE",
            progression: 75,
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

    const stats = statsProp || fallbackStats;
    const cotisations =
        Array.isArray(cotisationsProp) && cotisationsProp.length
            ? cotisationsProp
            : fallbackCotisations;
    const campagnes =
        Array.isArray(campagnesProp) && campagnesProp.length
            ? campagnesProp
            : fallbackCampagnes;
    const paiementsRecents =
        Array.isArray(paiementsRecentsProp) && paiementsRecentsProp.length
            ? paiementsRecentsProp
            : fallbackPaiementsRecents;

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

    const handleAddCampagne = async () => {
        if (isSubmitting) return;

        const titre = window.prompt(
            "Titre de la campagne ?",
            "Nouvelle campagne",
        );
        if (!titre) return;

        const objectifInput = window.prompt("Objectif (F CFA) ?", "1000000");
        const objectif = Number(objectifInput || 0);
        if (!Number.isFinite(objectif) || objectif < 1000) {
            alert("Objectif invalide.");
            return;
        }

        setIsSubmitting(true);
        try {
            await postJson("/api/admin/tresorerie/campagnes", {
                titre,
                objectif_montant: objectif,
                scope: "GLOBAL",
                classe_id: null,
                statut: "ACTIVE",
            });
            alert("Campagne créée.");
            window.location.reload();
        } catch (error) {
            alert("Échec de création de la campagne.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseCampagne = async (campagne) => {
        if (isSubmitting) return;
        if (!window.confirm(`Clôturer la campagne \"${campagne.nom}\" ?`))
            return;

        setIsSubmitting(true);
        try {
            await postJson(
                `/api/admin/tresorerie/campagnes/${campagne.id}/close`,
                {},
            );
            alert("Campagne clôturée.");
            window.location.reload();
        } catch (error) {
            alert("Échec de clôture de la campagne.");
        } finally {
            setIsSubmitting(false);
        }
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
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/dashboard"
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
            <div className="max-w-7xl mx-auto px-4 py-8">
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
                            +{stats.campagnesActives} campagnes
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
                                label: "📊 Dashboard",
                                icon: BarChart3,
                            },
                            {
                                id: "cotisations",
                                label: "💰 Cotisations",
                                icon: DollarSign,
                            },
                            {
                                id: "campagnes",
                                label: "🎯 Campagnes",
                                icon: TrendingUp,
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
                                {/* Campagnes actives */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Campagnes en cours
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {campagnes.map((campagne) => (
                                            <div
                                                key={campagne.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {campagne.nom}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Classe :{" "}
                                                            {campagne.classe}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        ACTIVE
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {(
                                                                campagne.collecté /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M /{" "}
                                                            {(
                                                                campagne.objectif /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M F CFA
                                                        </span>
                                                        <span className="font-semibold text-gray-900">
                                                            {
                                                                campagne.progression
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                                            style={{
                                                                width: `${campagne.progression}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

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
                                                        handleEditCotisation(
                                                            cot,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:text-blue-300 rounded-lg transition-colors font-semibold"
                                                >
                                                    Éditer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "campagnes" && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Dernières campagnes
                                    </h3>
                                    <button
                                        onClick={handleAddCampagne}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                                    >
                                        <Plus size={18} /> Nouvelle
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {campagnes.map((campagne) => (
                                        <div
                                            key={campagne.id}
                                            className="border border-gray-200 rounded-lg p-5"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {campagne.nom}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Classe :{" "}
                                                        {campagne.classe}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded font-semibold text-sm">
                                                        ✎ Éditer
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleCloseCampagne(
                                                                campagne,
                                                            )
                                                        }
                                                        disabled={isSubmitting}
                                                        className="px-3 py-1 text-red-600 hover:bg-red-50 disabled:text-red-300 rounded font-semibold text-sm"
                                                    >
                                                        ✕ Clôturer
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            Objectif
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {(
                                                                campagne.objectif /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M F CFA
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">
                                                            Collecté
                                                        </span>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {(
                                                                campagne.collecté /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M F CFA (
                                                            {
                                                                campagne.progression
                                                            }
                                                            %)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all"
                                                        style={{
                                                            width: `${campagne.progression}%`,
                                                        }}
                                                    ></div>
                                                </div>
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
                                    <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors">
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
                                    </button>
                                    <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors">
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
                                    </button>
                                    <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors">
                                        <Download
                                            className="text-blue-600 mx-auto mb-3"
                                            size={32}
                                        />
                                        <h4 className="font-semibold text-gray-900">
                                            Par Classe
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Détails financiers par classe
                                        </p>
                                    </button>
                                    <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors">
                                        <Download
                                            className="text-blue-600 mx-auto mb-3"
                                            size={32}
                                        />
                                        <h4 className="font-semibold text-gray-900">
                                            Par Famille
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Détails des cotisations & dons
                                        </p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
