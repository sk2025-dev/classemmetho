import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    BarChart3,
    TrendingUp,
    Users,
    Globe,
    MessageSquare,
    ArrowLeft,
} from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function PasteurTresorerie({
    globalStats: globalStatsProp,
    classes: classesProp,
    campaignesActives: campaignesActivesProp,
}) {
    const [activeTab, setActiveTab] = useState("dashboard");

    const fallbackGlobalStats = {
        cotisationsTotales: 2500000,
        cotisationsPayees: 1875000,
        tauxPaiement: 75,
        donsTotaux: 450000,
        campaignesActives: 4,
        famillesActives: 45,
    };

    const fallbackClasses = [
        {
            nom: "Classe 1 - Juniors",
            taux: 85,
            familles: 12,
            cotisations: 180000,
            payées: 153000,
        },
        {
            nom: "Classe 2 - Adolescents",
            taux: 70,
            familles: 15,
            cotisations: 225000,
            payées: 157500,
        },
        {
            nom: "Classe 3 - Jeunes adultes",
            taux: 78,
            familles: 10,
            cotisations: 150000,
            payées: 117000,
        },
        {
            nom: "Classe 4 - Adultes",
            taux: 68,
            familles: 8,
            cotisations: 120000,
            payées: 81600,
        },
    ];

    const fallbackCampaignesActives = [
        {
            nom: "Rénovation temple",
            objectif: 5000000,
            collecté: 3200000,
            progression: 64,
            statut: "ACTIVE",
            classes: "Global",
        },
        {
            nom: "Aide aux nécessiteux",
            objectif: 2000000,
            collecté: 1400000,
            progression: 70,
            statut: "ACTIVE",
            classes: "Global",
        },
        {
            nom: "Amélioration infrastructure",
            objectif: 3000000,
            collecté: 2100000,
            progression: 70,
            statut: "ACTIVE",
            classes: "Global",
        },
        {
            nom: "Dons missionaires",
            objectif: 1000000,
            collecté: 600000,
            progression: 60,
            statut: "ACTIVE",
            classes: "Global",
        },
    ];

    const globalStats = globalStatsProp || fallbackGlobalStats;
    const classes =
        Array.isArray(classesProp) && classesProp.length
            ? classesProp
            : fallbackClasses;
    const campaignesActives =
        Array.isArray(campaignesActivesProp) && campaignesActivesProp.length
            ? campaignesActivesProp
            : fallbackCampaignesActives;

    return (
        <div
            className="min-h-screen"
            style={{
                background: "var(--main-gradient)",
            }}
        >
            <Head title="Suivi Trésorerie - Pasteur" />

            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={withBasePath("", "/pasteur/dashboard")}
                            className="p-2 hover:bg-white/20 rounded-lg transition"
                        >
                            <ArrowLeft size={24} className="text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Suivi Financier Paroissial
                            </h1>
                            <p className="text-white/80 text-sm mt-1">
                                Supervision globale - Vue pastorale
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
                                    Cotisations collectées
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {(
                                        globalStats.cotisationsPayees / 1000000
                                    ).toFixed(1)}
                                    M
                                </p>
                            </div>
                            <BarChart3 className="text-blue-600" size={32} />
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">
                            ↑ En hausse
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Taux global
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {globalStats.tauxPaiement}%
                                </p>
                            </div>
                            <TrendingUp className="text-green-600" size={32} />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                    width: `${globalStats.tauxPaiement}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Dons & solidarité
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {(globalStats.donsTotaux / 1000000).toFixed(
                                        2,
                                    )}
                                    M
                                </p>
                            </div>
                            <Globe className="text-purple-600" size={32} />
                        </div>
                        <p className="text-xs text-purple-600 font-semibold">
                            Générosité fidèles
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Campagnes actives
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {globalStats.campaignesActives}
                                </p>
                            </div>
                            <Users className="text-orange-600" size={32} />
                        </div>
                        <p className="text-xs text-orange-600 font-semibold">
                            En collecte
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: "dashboard", label: "📊 Vue globale" },
                            { id: "classes", label: "🎓 Par classe" },
                            { id: "campagnes", label: "🎯 Campagnes" },
                            { id: "messages", label: "💌 Encouragements" },
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
                                {/* Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-600">
                                        <p className="text-sm text-blue-900 font-semibold">
                                            Objectif mois
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">
                                            2.5M F CFA
                                        </p>
                                        <p className="text-xs text-blue-700 mt-2">
                                            ↑ 1.9M reçus (75%)
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-l-4 border-green-600">
                                        <p className="text-sm text-green-900 font-semibold">
                                            Familles impliquées
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">
                                            {globalStats.famillesActives}
                                        </p>
                                        <p className="text-xs text-green-700 mt-2">
                                            Cohésion paroissiale forte
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-600">
                                        <p className="text-sm text-purple-900 font-semibold">
                                            Solidarité collective
                                        </p>
                                        <p className="text-2xl font-bold text-purple-600 mt-2">
                                            450K F CFA
                                        </p>
                                        <p className="text-xs text-purple-700 mt-2">
                                            Dons & contributions libres
                                        </p>
                                    </div>
                                </div>

                                {/* Message spirituel */}
                                <div className="p-6 bg-yellow-50 border-l-4 border-yellow-600 rounded-lg">
                                    <p className="text-yellow-900 font-semibold mb-2">
                                        ✨ Message pastoral
                                    </p>
                                    <p className="text-yellow-800 text-sm">
                                        Soyez reconnaissants envers vos fidèles
                                        pour leur engagement envers la paroisse.
                                        La gestion responsable de nos ressources
                                        est une mission divine. Continuez à les
                                        encourager dans leur parcours de foi et
                                        de communauté.
                                    </p>
                                </div>

                                {/* Distribution by Class */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Distribution par classe
                                    </h3>
                                    <div className="space-y-3">
                                        {classes.map((classe, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {classe.nom}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {classe.familles}{" "}
                                                            familles
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">
                                                            {classe.taux}%
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            Taux paiement
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                    <span>
                                                        {(
                                                            classe.payées / 1000
                                                        ).toFixed(0)}
                                                        K /{" "}
                                                        {(
                                                            classe.cotisations /
                                                            1000
                                                        ).toFixed(0)}
                                                        K reçus
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                                                        style={{
                                                            width: `${classe.taux}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "classes" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Analyse par classe
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                    Classe
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                                    Familles
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Taux
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    Payées
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    Attendues
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {classes.map((classe, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                                        {classe.nom}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {classe.familles}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{
                                                                        width: `${classe.taux}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-semibold text-gray-900 w-8">
                                                                {classe.taux}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                        {(
                                                            classe.payées / 1000
                                                        ).toFixed(0)}
                                                        K
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                        {(
                                                            classe.cotisations /
                                                            1000
                                                        ).toFixed(0)}
                                                        K
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                                                            Consulter
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "campagnes" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Campagnes en cours
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {campaignesActives.map((camp, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {camp.nom}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Portée : {camp.classes}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    {camp.statut}
                                                </span>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Objectif
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {(
                                                            camp.objectif /
                                                            1000000
                                                        ).toFixed(1)}
                                                        M F CFA
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Collecté
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        {(
                                                            camp.collecté /
                                                            1000000
                                                        ).toFixed(1)}
                                                        M ({camp.progression}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                                                        style={{
                                                            width: `${camp.progression}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <button className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded font-semibold text-sm transition-colors">
                                                Voir détails
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "messages" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Messages d'encouragement
                                </h3>
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        Envoyer un message pastoral aux fidèles
                                    </label>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="4"
                                        placeholder="Écrivez votre message d'encouragement..."
                                    />
                                    <button className="mt-3 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                        Envoyer à tous les fidèles
                                    </button>
                                </div>

                                <h4 className="font-bold text-gray-900 mb-4">
                                    Messages récents envoyés
                                </h4>
                                <div className="space-y-3">
                                    <div className="p-4 border border-gray-200 rounded-lg bg-white">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Merci pour votre engagement
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Envoyé le 10/03/2026
                                        </p>
                                        <p className="text-sm text-gray-700 mt-2">
                                            Chers frères et sœurs, je vous
                                            remercie pour votre engagement
                                            envers notre paroisse...
                                        </p>
                                    </div>
                                    <div className="p-4 border border-gray-200 rounded-lg bg-white">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Campagne de rénovation
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Envoyé le 05/03/2026
                                        </p>
                                        <p className="text-sm text-gray-700 mt-2">
                                            Nous lançons ensemble cette belle
                                            campagne pour améliorer notre
                                            temple...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
