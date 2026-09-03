import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { BarChart3, Globe, TrendingUp, Users, Send, Clock, CheckCircle } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function TabTresorerie({
    globalStats: globalStatsProp,
    tresorerieClasses: classesProp,
    cotisationsParClasse: cotisationsParClasseProp,
    encouragements: encouragementsProp = [],
}) {
    const { props } = usePage();
    const [activeTab, setActiveTab] = useState("fimeco");
    const [fimecoPage, setFimecoPage] = useState(1);
    const [encMessage, setEncMessage] = useState("");
    const [encLoading, setEncLoading] = useState(false);
    const [encError, setEncError] = useState("");
    const FIMECO_PER_PAGE = 5;
    const [classeModal, setClasseModal] = useState(null);
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                {classes.length ? (() => {
                                    const totalPages = Math.max(1, Math.ceil(classes.length / FIMECO_PER_PAGE));
                                    const paginated = classes.slice((fimecoPage - 1) * FIMECO_PER_PAGE, fimecoPage * FIMECO_PER_PAGE);
                                    return (
                                        <>
                                            <div className="space-y-3">
                                                {paginated.map((classe, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
                                                        onClick={() => setClasseModal(classe)}
                                                    >
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {classe.nom}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {asNumber(classe.familles)}{" "}familles
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-gray-900">
                                                                    {asNumber(classe.taux)}%
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    Taux paiement
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className="bg-blue-600 h-2.5 rounded-full transition-all"
                                                                style={{ width: `${Math.max(0, Math.min(100, asNumber(classe.taux)))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-sm text-gray-500">
                                                        {(fimecoPage - 1) * FIMECO_PER_PAGE + 1}–{Math.min(fimecoPage * FIMECO_PER_PAGE, classes.length)} sur {classes.length} classes
                                                    </p>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setFimecoPage(p => Math.max(1, p - 1))}
                                                            disabled={fimecoPage === 1}
                                                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            ‹ Préc.
                                                        </button>
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setFimecoPage(p)}
                                                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${p === fimecoPage ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => setFimecoPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={fimecoPage === totalPages}
                                                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Suiv. ›
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })() : (
                                    <div className="p-6 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600">
                                        Aucune donnee de classe disponible pour le moment.
                                    </div>
                                )}
                            </div>
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
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Encouragement cotisation</h3>
                                <p className="text-sm text-gray-500 mt-1">Votre message apparaîtra immédiatement dans le flash info de tous les membres connectés.</p>
                            </div>

                            {/* Flash success */}
                            {props.flash?.success && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    {props.flash.success}
                                </div>
                            )}

                            {/* Formulaire */}
                            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Rédiger un message pastoral
                                </label>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                                    rows="4"
                                    maxLength={500}
                                    placeholder="Ex : Chers fidèles, nous vous encourageons à vous acquitter de vos cotisations FIMECO pour ce mois de mai. Que le Seigneur bénisse vos efforts !"
                                    value={encMessage}
                                    onChange={(e) => { setEncMessage(e.target.value); setEncError(""); }}
                                />
                                <div className="flex items-center justify-between mt-1 mb-3">
                                    {encError ? (
                                        <p className="text-xs text-red-500">{encError}</p>
                                    ) : (
                                        <span />
                                    )}
                                    <span className={`text-xs ${encMessage.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {encMessage.length}/500
                                    </span>
                                </div>
                                <button
                                    disabled={encLoading || encMessage.trim().length < 10}
                                    onClick={() => {
                                        if (encMessage.trim().length < 10) {
                                            setEncError("Le message doit contenir au moins 10 caractères.");
                                            return;
                                        }
                                        setEncLoading(true);
                                        router.post(
                                            withBasePath("", "/president-conducteurs/tresorerie/encouragement"),
                                            { message: encMessage.trim() },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                onSuccess: () => { setEncMessage(""); setEncLoading(false); },
                                                onError: () => { setEncError("Une erreur est survenue."); setEncLoading(false); },
                                            }
                                        );
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    {encLoading ? "Publication..." : "Publier dans le flash info"}
                                </button>
                            </div>

                            {/* Historique */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Historique des encouragements
                                </h4>
                                {encouragementsProp.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Aucun encouragement publié pour le moment.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {encouragementsProp.map((enc) => (
                                            <div key={enc.id} className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800">{enc.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{enc.created_at}</p>
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">
                                                    Publié
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal familles par classe */}
            {classeModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setClasseModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{classeModal.nom}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {asNumber(classeModal.familles)} famille{asNumber(classeModal.familles) > 1 ? 's' : ''} · Taux {asNumber(classeModal.taux)}%
                                </p>
                            </div>
                            <button
                                onClick={() => setClasseModal(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Stats rapides */}
                        <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Soldées</p>
                                <p className="text-xl font-bold text-green-600">
                                    {(classeModal.famillesList ?? []).filter(f => f.solde).length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Non soldées</p>
                                <p className="text-xl font-bold text-red-500">
                                    {(classeModal.famillesList ?? []).filter(f => !f.solde).length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Total collecté</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {formatAmount(classeModal.payees)} F
                                </p>
                            </div>
                        </div>

                        {/* Liste familles */}
                        <div className="overflow-y-auto flex-1 px-6 py-4">
                            {(classeModal.famillesList ?? []).length === 0 ? (
                                <p className="text-center text-gray-400 italic py-8">Aucune famille trouvée pour cette classe.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(classeModal.famillesList ?? [])
                                        .slice()
                                        .sort((a, b) => b.solde - a.solde)
                                        .map((famille) => (
                                        <div
                                            key={famille.id}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${famille.solde ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${famille.solde ? 'bg-green-500' : 'bg-red-400'}`} />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm truncate">{famille.nom}</p>
                                                    {famille.code_famille && (
                                                        <p className="text-xs text-gray-400">{famille.code_famille}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                                <span className="text-xs text-gray-500">{formatAmount(famille.montant_paye)} F</span>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${famille.solde ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {famille.solde ? '✓ Soldé' : '✗ Impayé'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setClasseModal(null)}
                                className="px-5 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
