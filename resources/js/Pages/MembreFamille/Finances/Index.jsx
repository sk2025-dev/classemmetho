import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { DollarSign, Heart, ArrowLeft } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const fmtCurrency = (n) => `${fmt(n)} F`;

export default function MembreFamilleFinances({
    familyInfo: familyInfoProp,
    cotisations: cotisationsProp,
    historiquePaiements: historiquePaiementsProp,
    donsFamille: donsFamilleProp,
    initialTab = "fimeco",
}) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const fallbackFamilyInfo = {
        nom: "Famille Koné",
        chef: "Monsieur Jean-Pierre Koné",
        classe: "Classe 1 - Juniors",
    };

    const fallbackCotisations = [
        {
            id: 1,
            nom: "FIMECO",
            montant: 15000,
            periodicite: "Mensuel",
            payé: 45000,
            dû: 15000,
            reliquat: 0,
        },
        {
            id: 2,
            nom: "Affiliation CEMEC",
            montant: 50000,
            periodicite: "Annuel",
            payé: 50000,
            dû: 0,
            reliquat: 0,
        },
        {
            id: 3,
            nom: "Cotisation paroissiale",
            montant: 10000,
            periodicite: "Mensuel",
            payé: 30000,
            dû: 10000,
            reliquat: 0,
        },
    ];



    const famillyInfo = familyInfoProp || fallbackFamilyInfo;
    const cotisationsRaw =
        Array.isArray(cotisationsProp) && cotisationsProp.length
            ? cotisationsProp
            : fallbackCotisations;
    const historiquePaiements = Array.isArray(historiquePaiementsProp) ? historiquePaiementsProp : [];
    const donsFamille = Array.isArray(donsFamilleProp) ? donsFamilleProp : [];

    const cotisations = cotisationsRaw.map((c) => ({
        ...c,
        type_finance:
            c.type_finance ||
            (String(c.nom || "")
                .toLowerCase()
                .includes("fimeco")
                ? "FIMECO"
                : "COTISATION"),
        paye: c.paye ?? c.payé ?? 0,
        du: c.du ?? c.dû ?? 0,
    }));

    const fimecoCotisations = cotisations.filter(
        (c) => c.type_finance === "FIMECO",
    );
    const autresCotisations = cotisations.filter(
        (c) => c.type_finance !== "FIMECO",
    );
    const totalCotisations = cotisations.reduce((sum, c) => sum + c.du, 0);




    const renderCotisationsList = (list, emptyMessage) => {
        if (!list.length) {
            return (
                <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                    {emptyMessage}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {list.map((cot) => {
                    const expected = Number(
                        cot.montant_attendu ?? cot.montant ?? cot.paye + cot.du,
                    );
                    const progress =
                        expected > 0
                            ? Math.min(100, (Number(cot.paye) / expected) * 100)
                            : 0;

                    return (
                        <div
                            key={cot.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Cotisation
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {cot.nom}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Montant attendu
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {fmtCurrency(expected)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Fréquence
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {cot.periodicite}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Portée
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {cot.target_scope === "INDIVIDUELLE"
                                            ? "Individuelle"
                                            : "Famille"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Payé
                                    </p>
                                    <p className="font-bold text-green-600 mt-1">
                                        {fmtCurrency(Number(cot.paye))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">
                                        Statut
                                    </p>
                                    <p
                                        className={`font-bold mt-1 ${Number(cot.du) === 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {Number(cot.du) === 0
                                            ? "A jour"
                                            : `Reste ${fmtCurrency(
                                                  Number(cot.du),
                                              )}`}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <div
                                    className="bg-teal-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background: "var(--main-gradient)",
            }}
        >
            <Head title="Finances - Membre Familie" />

            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40 shadow-sm">
                <div className=" mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={withBasePath("", "/membre-famille/dashboard")}
                            className="p-2 hover:bg-white/20 rounded-lg transition"
                        >
                            <ArrowLeft size={24} className="text-white" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {famillyInfo.nom}
                            </h1>
                            <p className="text-white/80 text-sm mt-1">
                                {famillyInfo.chef} • {famillyInfo.classe}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className=" mx-auto px-4 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-md ">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Cotisations payées
                                </p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {fmtCurrency(
                                        cotisations.reduce(
                                            (sum, c) => sum + c.paye,
                                            0,
                                        ),
                                    )}
                                </p>
                            </div>
                            <DollarSign className="text-green-500" size={32} />
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            Cette année
                        </p>
                    </div>

                    <div
                        className={`bg-white rounded-lg p-6 shadow-md ${totalCotisations > 0 ? "" : "border-blue-500"}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    À payer ce mois
                                </p>
                                <p
                                    className={`text-3xl font-bold mt-2 ${totalCotisations > 0 ? "text-red-600" : "text-blue-600"}`}
                                >
                                    {fmtCurrency(totalCotisations)}
                                </p>
                            </div>
                            <DollarSign
                                className={
                                    totalCotisations > 0
                                        ? "text-red-500"
                                        : "text-blue-500"
                                }
                                size={32}
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            {totalCotisations > 0
                                ? "Action requise"
                                : "Tout payé ✓"}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-md ">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Dons cette année
                                </p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">
                                    {fmtCurrency(
                                        donsFamille.reduce(
                                            (sum, d) => sum + d.montant,
                                            0,
                                        ),
                                    )}
                                </p>
                            </div>
                            <Heart className="text-purple-500" size={32} />
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            Générosité fidèles
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: "fimeco", label: "🏦 FIMECO" },
                            { id: "cotisations", label: "📋 Mes cotisations" },
                            { id: "dons", label: "❤️ Dons" },
                            { id: "historique", label: "📜 Historique" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-6 py-4 font-semibold transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-teal-600 text-teal-600 bg-teal-50"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {activeTab === "fimeco" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Cotisations FIMECO
                                </h3>
                                {renderCotisationsList(
                                    fimecoCotisations,
                                    "Aucune cotisation FIMECO active pour le moment.",
                                )}

                            </div>
                        )}

                        {activeTab === "cotisations" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Toutes les autres cotisations
                                </h3>
                                {renderCotisationsList(
                                    autresCotisations,
                                    "Aucune autre cotisation active pour le moment.",
                                )}

                            </div>
                        )}

                        {activeTab === "dons" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Mes dons
                                </h3>
                                {donsFamille.length === 0 ? (
                                    <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                                        Aucun don enregistré pour le moment.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Campagne / Motif</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {donsFamille.map((don) => (
                                                    <tr key={don.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-600">{don.date}</td>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">{don.campagne}</td>
                                                        <td className="px-4 py-3 font-bold text-purple-600">{fmtCurrency(don.montant)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "historique" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Historique des paiements
                                </h3>
                                {historiquePaiements.length === 0 ? (
                                    <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                                        Aucun paiement enregistré pour le moment.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Cotisation</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Montant</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Mode</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {historiquePaiements.map((paiement) => (
                                                    <tr key={paiement.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-semibold text-gray-900">{paiement.type}</td>
                                                        <td className="px-4 py-3 font-bold text-teal-600">{fmtCurrency(paiement.montant)}</td>
                                                        <td className="px-4 py-3 text-gray-600">{paiement.mode}</td>
                                                        <td className="px-4 py-3 text-gray-600">{paiement.date}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                paiement.payment_status === 'PAYE'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : paiement.payment_status === 'EN_ATTENTE'
                                                                      ? 'bg-yellow-100 text-yellow-700'
                                                                      : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {paiement.payment_status === 'PAYE' ? 'Payé'
                                                                    : paiement.payment_status === 'EN_ATTENTE' ? 'En attente'
                                                                    : paiement.payment_status ?? 'Payé'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
