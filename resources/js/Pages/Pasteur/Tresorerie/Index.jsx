import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, BarChart3, Globe, TrendingUp, Users } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function PasteurTresorerie({
    globalStats: globalStatsProp,
    classes: classesProp,
    cotisationsParClasse: cotisationsParClasseProp,
}) {
    const [activeTab, setActiveTab] = useState("fimeco");
    const [selectedCotisationClasseId, setSelectedCotisationClasseId] =
        useState(null);
    const [selectedCotisationModal, setSelectedCotisationModal] =
        useState(null);

    const asNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatAmount = (value) => Math.round(asNumber(value)).toString();

    const formatDate = (dateValue) => {
        const raw = String(dateValue ?? "").trim();
        if (!raw) return "-";

        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return raw;

        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const globalStats = globalStatsProp || {};
    const classes = Array.isArray(classesProp) ? classesProp : [];
    const cotisationsParClasse = Array.isArray(cotisationsParClasseProp)
        ? cotisationsParClasseProp
        : [];

    const cotisationsTotales = asNumber(globalStats.cotisationsTotales);
    const cotisationsPayees = asNumber(globalStats.cotisationsPayees);
    const donsTotaux = asNumber(globalStats.donsTotaux);
    const famillesActives = asNumber(globalStats.famillesActives);
    const tauxPaiement = Math.max(
        0,
        Math.min(100, asNumber(globalStats.tauxPaiement)),
    );
    const cotisationsActivesCount = asNumber(
        globalStats.cotisationsActives ?? globalStats.campaignesActives,
    );

    const selectedCotisationClassKey =
        selectedCotisationClasseId === null
            ? null
            : String(selectedCotisationClasseId);

    const selectedCotisationClasse = useMemo(() => {
        if (selectedCotisationClassKey === null) {
            return null;
        }

        return (
            cotisationsParClasse.find(
                (item) =>
                    String(asNumber(item.classeId)) ===
                    selectedCotisationClassKey,
            ) || null
        );
    }, [cotisationsParClasse, selectedCotisationClassKey]);

    const globalCotisationsStats = useMemo(() => {
        const montantCibleTotal = cotisationsParClasse.reduce(
            (sum, item) => sum + asNumber(item.montantCibleTotal),
            0,
        );
        const montantPayeTotal = cotisationsParClasse.reduce(
            (sum, item) => sum + asNumber(item.montantPayeTotal),
            0,
        );

        const tauxPaiementGlobal =
            montantCibleTotal > 0
                ? Math.max(
                      0,
                      Math.min(
                          100,
                          Math.round(
                              (montantPayeTotal / montantCibleTotal) * 100,
                          ),
                      ),
                  )
                : 0;

        return {
            montantCibleTotal,
            montantPayeTotal,
            tauxPaiementGlobal,
        };
    }, [cotisationsParClasse]);

    return (
        <div
            className="min-h-screen"
            style={{ background: "var(--main-gradient)" }}
        >
            <Head title="Suivi Tresorerie - Pasteur" />

            <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
                <div className=" mx-auto px-4 py-6">
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

            <div className="mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Cotisations collectees
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {formatAmount(cotisationsPayees)} F CFA
                                </p>
                            </div>
                            <BarChart3 className="text-blue-600" size={32} />
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">
                            Donnees consolidees
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Taux global
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {tauxPaiement}%
                                </p>
                            </div>
                            <TrendingUp className="text-green-600" size={32} />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${tauxPaiement}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Dons & solidarite
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {formatAmount(donsTotaux)} F CFA
                                </p>
                            </div>
                            <Globe className="text-purple-600" size={32} />
                        </div>
                        <p className="text-xs text-purple-600 font-semibold">
                            Generosite fideles
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Cotisations actives
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {cotisationsActivesCount}
                                </p>
                            </div>
                            <Users className="text-orange-600" size={32} />
                        </div>
                        <p className="text-xs text-orange-600 font-semibold">
                            En collecte
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: "fimeco", label: "FIMECO" },
                            { id: "classes", label: "Par classe" },
                            { id: "cotisations", label: "Cotisations" },
                            { id: "messages", label: "Encouragements" },
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
                        {activeTab === "fimeco" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg ">
                                        <p className="text-sm text-blue-900 font-semibold">
                                            Objectif mois
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 mt-2">
                                            {formatAmount(cotisationsTotales)} F
                                            CFA
                                        </p>
                                        <p className="text-xs text-blue-700 mt-2">
                                            {formatAmount(cotisationsPayees)}{" "}
                                            recus ({tauxPaiement}%)
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg ">
                                        <p className="text-sm text-green-900 font-semibold">
                                            Familles impliquees
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 mt-2">
                                            {famillesActives}
                                        </p>
                                        <p className="text-xs text-green-700 mt-2">
                                            Cohesion paroissiale forte
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg ">
                                        <p className="text-sm text-purple-900 font-semibold">
                                            Solidarite collective
                                        </p>
                                        <p className="text-2xl font-bold text-purple-600 mt-2">
                                            {formatAmount(donsTotaux)} F CFA
                                        </p>
                                        <p className="text-xs text-purple-700 mt-2">
                                            Dons et contributions libres
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-yellow-50 ">
                                    <p className="text-yellow-900 font-semibold mb-2">
                                        Message pastoral
                                    </p>
                                    <p className="text-yellow-800 text-sm">
                                        Soyez reconnaissants envers vos fideles
                                        pour leur engagement envers la paroisse.
                                        La gestion responsable de nos ressources
                                        est une mission divine.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Distribution par classe
                                    </h3>
                                    {classes.length ? (
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
                                                                {asNumber(
                                                                    classe.familles,
                                                                )}{" "}
                                                                familles
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900">
                                                                {asNumber(
                                                                    classe.taux,
                                                                )}
                                                                %
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                Taux paiement
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.max(0, Math.min(100, asNumber(classe.taux)))}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600">
                                            Aucune donnee de classe disponible
                                            pour le moment.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "classes" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Analyse par classe
                                </h3>
                                {classes.length ? (
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
                                                        Payees
                                                    </th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900">
                                                        Attendues
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
                                                            {asNumber(
                                                                classe.familles,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {asNumber(
                                                                classe.taux,
                                                            )}
                                                            %
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                            {formatAmount(
                                                                classe.payees,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                            {formatAmount(
                                                                classe.cotisations,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600">
                                        Aucune classe disponible pour l'analyse.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "cotisations" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Cotisations creees par les conducteurs
                                </h3>
                                {cotisationsParClasse.length ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <button
                                                onClick={() =>
                                                    setSelectedCotisationClasseId(
                                                        null,
                                                    )
                                                }
                                                className={`p-4 border rounded-xl text-left transition-colors ${
                                                    selectedCotisationClasseId ===
                                                    null
                                                        ? "border-blue-700 bg-blue-50"
                                                        : "border-gray-200 hover:border-blue-300"
                                                }`}
                                            >
                                                <p className="text-xs text-gray-600 mb-1">
                                                    Resume
                                                </p>
                                                <h4 className="font-bold text-gray-900 text-sm mb-2">
                                                    Toutes les classes
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    Paye:{" "}
                                                    {formatAmount(
                                                        globalCotisationsStats.montantPayeTotal,
                                                    )}{" "}
                                                    F CFA
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Cible:{" "}
                                                    {formatAmount(
                                                        globalCotisationsStats.montantCibleTotal,
                                                    )}{" "}
                                                    F CFA
                                                </p>
                                            </button>

                                            {cotisationsParClasse.map(
                                                (item) => {
                                                    const isActive =
                                                        asNumber(
                                                            selectedCotisationClasseId,
                                                        ) ===
                                                        asNumber(item.classeId);

                                                    return (
                                                        <button
                                                            key={item.classeId}
                                                            onClick={() =>
                                                                setSelectedCotisationClasseId(
                                                                    item.classeId,
                                                                )
                                                            }
                                                            className={`p-4 border rounded-xl text-left transition-colors ${
                                                                isActive
                                                                    ? "border-blue-700 bg-blue-50"
                                                                    : "border-gray-200 hover:border-blue-300"
                                                            }`}
                                                        >
                                                            <p className="text-xs text-gray-600 mb-1">
                                                                {asNumber(
                                                                    item.tauxPaiement,
                                                                )}
                                                                % de
                                                                participation
                                                            </p>
                                                            <h4 className="font-bold text-gray-900 text-sm mb-2">
                                                                {item.classeNom}
                                                            </h4>
                                                            <p className="text-xs text-gray-600">
                                                                {asNumber(
                                                                    item.familles,
                                                                )}{" "}
                                                                familles
                                                            </p>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600">
                                            {selectedCotisationClasse
                                                ? `Classe selectionnee: ${selectedCotisationClasse.classeNom}`
                                                : "Selectionnez une classe pour afficher ses cotisations detaillees."}
                                        </p>

                                        {selectedCotisationClasse ? (
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                {Array.isArray(
                                                    selectedCotisationClasse.cotisations,
                                                ) &&
                                                selectedCotisationClasse
                                                    .cotisations.length ? (
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-900">
                                                                    Nom
                                                                    cotisation
                                                                </th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-900">
                                                                    Date
                                                                    creation
                                                                </th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-900">
                                                                    Conducteur
                                                                </th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-900">
                                                                    Action
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {selectedCotisationClasse.cotisations.map(
                                                                (cot) => (
                                                                    <tr
                                                                        key={
                                                                            cot.id
                                                                        }
                                                                    >
                                                                        <td className="px-3 py-2 text-gray-900 font-medium">
                                                                            {
                                                                                cot.nom
                                                                            }
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {formatDate(
                                                                                cot.createdAt,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-gray-700">
                                                                            {cot.createdBy ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <button
                                                                                onClick={() =>
                                                                                    setSelectedCotisationModal(
                                                                                        {
                                                                                            ...cot,
                                                                                            classeNom:
                                                                                                selectedCotisationClasse.classeNom,
                                                                                        },
                                                                                    )
                                                                                }
                                                                                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                                                            >
                                                                                Voir
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="p-4 text-sm text-gray-600">
                                                        Aucune cotisation creee
                                                        pour cette classe.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-dashed border-gray-300 rounded text-sm text-gray-600">
                                                Choisissez une classe pour
                                                afficher son tableau de
                                                cotisations.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600">
                                        Aucune cotisation creee par un
                                        conducteur n'est disponible.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "messages" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Messages d'encouragement
                                </h3>
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        Envoyer un message pastoral aux fideles
                                    </label>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="4"
                                        placeholder="Ecrivez votre message d'encouragement..."
                                    />
                                    <button className="mt-3 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                        Envoyer a tous les fideles
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedCotisationModal && (
                <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">
                                    Classe: {selectedCotisationModal.classeNom}
                                </p>
                                <h4 className="text-lg font-bold text-gray-900">
                                    {selectedCotisationModal.nom}
                                </h4>
                            </div>
                            <button
                                onClick={() => setSelectedCotisationModal(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Date creation
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatDate(
                                        selectedCotisationModal.createdAt,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Conducteur
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {selectedCotisationModal.createdBy || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Montant attendu
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatAmount(
                                        selectedCotisationModal.montant,
                                    )}{" "}
                                    F CFA
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Montant paye
                                </span>
                                <span className="font-semibold text-green-700">
                                    {formatAmount(
                                        selectedCotisationModal.totalPaye,
                                    )}{" "}
                                    F CFA
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
