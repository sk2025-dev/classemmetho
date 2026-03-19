import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    CreditCard,
    DollarSign,
    Heart,
    Download,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

export default function MembreFamilleFinances({
    familyInfo: familyInfoProp,
    cotisations: cotisationsProp,
    historiquePaiements: historiquePaiementsProp,
    donsFamille: donsFamilleProp,
    campagnesActives: campagnesActivesProp,
}) {
    const [activeTab, setActiveTab] = useState("consultation");
    const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
    const [mobileProvider, setMobileProvider] = useState("wave");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedCotisationId, setSelectedCotisationId] = useState("");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [freeDonAmount, setFreeDonAmount] = useState("");
    const [isSubmittingDon, setIsSubmittingDon] = useState(false);

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

    const fallbackHistoriquePaiements = [
        {
            id: 1,
            type: "FIMECO",
            montant: 15000,
            date: "14/03/2026",
            mode: "Mobile Money",
            recu: "REÇ-2026-003245",
        },
        {
            id: 2,
            type: "FIMECO",
            montant: 15000,
            date: "14/02/2026",
            mode: "Espèces",
            recu: "REÇ-2026-002845",
        },
        {
            id: 3,
            type: "FIMECO",
            montant: 15000,
            date: "14/01/2026",
            mode: "Virement",
            recu: "REÇ-2026-002145",
        },
        {
            id: 4,
            type: "Affiliation CEMEC",
            montant: 50000,
            date: "20/01/2026",
            mode: "Virement",
            recu: "REÇ-2026-001545",
        },
        {
            id: 5,
            type: "Cotisation paroissiale",
            montant: 10000,
            date: "15/03/2026",
            mode: "Mobile Money",
            recu: "REÇ-2026-003125",
        },
    ];

    const fallbackDonsFamille = [
        {
            id: 1,
            date: "15/03/2026",
            montant: 25000,
            campagne: "Rénovation temple",
            recu: "DON-2026-001523",
        },
        {
            id: 2,
            date: "01/03/2026",
            montant: 10000,
            campagne: "Aide aux nécessiteux",
            recu: "DON-2026-001401",
        },
        {
            id: 3,
            date: "14/02/2026",
            montant: 15000,
            campagne: "Rénovation temple",
            recu: "DON-2026-001203",
        },
    ];

    const fallbackCampagnesActives = [
        {
            id: 1,
            titre: "Rénovation temple",
            objectif: 5000000,
            collecte: 3200000,
            progression: 64,
        },
        {
            id: 2,
            titre: "Aide aux nécessiteux",
            objectif: 2000000,
            collecte: 1400000,
            progression: 70,
        },
    ];

    const famillyInfo = familyInfoProp || fallbackFamilyInfo;
    const cotisationsRaw =
        Array.isArray(cotisationsProp) && cotisationsProp.length
            ? cotisationsProp
            : fallbackCotisations;
    const historiquePaiements =
        Array.isArray(historiquePaiementsProp) && historiquePaiementsProp.length
            ? historiquePaiementsProp
            : fallbackHistoriquePaiements;
    const donsFamille =
        Array.isArray(donsFamilleProp) && donsFamilleProp.length
            ? donsFamilleProp
            : fallbackDonsFamille;
    const campagnesActives =
        Array.isArray(campagnesActivesProp) && campagnesActivesProp.length
            ? campagnesActivesProp
            : fallbackCampagnesActives;

    const cotisations = cotisationsRaw.map((c) => ({
        ...c,
        paye: c.paye ?? c.payé ?? 0,
        du: c.du ?? c.dû ?? 0,
    }));

    const dueCotisations = cotisations.filter((c) => c.du > 0);
    const selectedCotisation =
        dueCotisations.find((c) => String(c.id) === String(selectedCotisationId)) ||
        dueCotisations[0] ||
        null;
    const selectedMontant = selectedCotisation ? Number(selectedCotisation.du) : 0;

    const totalCotisations = cotisations.reduce((sum, c) => sum + c.du, 0);

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute("content") : "";
    };

    const handleSubmitPaiement = async () => {
        if (totalCotisations <= 0 || isSubmittingPayment || !selectedCotisation) {
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const basePayload = {
                cotisation_id: selectedCotisation.id,
                montant: selectedMontant,
                year: selectedYear,
                date_paiement: new Date().toISOString().slice(0, 10),
            };

            const response =
                paymentMethod === "MOBILE_MONEY"
                    ? await fetch("/membre-famille/finances/paiements/initiate", {
                          method: "POST",
                          headers: {
                              "Content-Type": "application/json",
                              "X-CSRF-TOKEN": getCsrfToken(),
                              Accept: "application/json",
                          },
                          credentials: "same-origin",
                          body: JSON.stringify({
                              ...basePayload,
                              mode_paiement: "MOBILE_MONEY",
                              provider: mobileProvider,
                          }),
                      })
                    : await fetch("/membre-famille/finances/paiements", {
                          method: "POST",
                          headers: {
                              "Content-Type": "application/json",
                              "X-CSRF-TOKEN": getCsrfToken(),
                              Accept: "application/json",
                          },
                          credentials: "same-origin",
                          body: JSON.stringify({
                              ...basePayload,
                              mode_paiement: paymentMethod,
                              note: "Paiement saisi depuis l'espace membre famille",
                          }),
                      });

            if (!response.ok) {
                throw new Error("Paiement impossible");
            }

            if (paymentMethod === "MOBILE_MONEY") {
                const data = await response.json();
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                    return;
                }
            }

            alert("Paiement enregistré avec succès.");
            window.location.reload();
        } catch (error) {
            alert("Échec de l'enregistrement du paiement.");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleSubmitDonLibre = async () => {
        const amount = Number(freeDonAmount || 0);
        if (amount < 100 || isSubmittingDon) {
            alert(
                "Veuillez saisir un montant de don valide (minimum 100 F CFA).",
            );
            return;
        }

        setIsSubmittingDon(true);
        try {
            const response = await fetch("/membre-famille/finances/dons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    Accept: "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    campagne_id: null,
                    montant: amount,
                    type: "LIBRE",
                    mode_paiement: paymentMethod,
                    date_don: new Date().toISOString().slice(0, 10),
                    note: "Don libre depuis l'espace membre famille",
                }),
            });

            if (!response.ok) {
                throw new Error("Don impossible");
            }

            alert("Don enregistré avec succès.");
            setFreeDonAmount("");
            window.location.reload();
        } catch (error) {
            alert("Échec de l'enregistrement du don.");
        } finally {
            setIsSubmittingDon(false);
        }
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
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
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
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Cotisations payées
                                </p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {(
                                        cotisations.reduce(
                                            (sum, c) => sum + c.paye,
                                            0,
                                        ) / 1000
                                    ).toFixed(0)}
                                    K
                                </p>
                            </div>
                            <DollarSign className="text-green-500" size={32} />
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            Cette année
                        </p>
                    </div>

                    <div
                        className={`bg-white rounded-lg p-6 shadow-md border-l-4 ${totalCotisations > 0 ? "border-red-500" : "border-blue-500"}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    À payer ce mois
                                </p>
                                <p
                                    className={`text-3xl font-bold mt-2 ${totalCotisations > 0 ? "text-red-600" : "text-blue-600"}`}
                                >
                                    {(totalCotisations / 1000).toFixed(0)}K
                                </p>
                            </div>
                            <CreditCard
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

                    <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">
                                    Dons cette année
                                </p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">
                                    {(
                                        donsFamille.reduce(
                                            (sum, d) => sum + d.montant,
                                            0,
                                        ) / 1000
                                    ).toFixed(0)}
                                    K
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
                            { id: "consultation", label: "📋 Consultation" },
                            { id: "paiement", label: "💳 Paiement" },
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
                        {activeTab === "consultation" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    État de vos cotisations
                                </h3>
                                <div className="space-y-4">
                                    {cotisations.map((cot, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
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
                                                        Montant
                                                    </p>
                                                    <p className="font-bold text-gray-900 mt-1">
                                                        {(
                                                            cot.montant / 1000
                                                        ).toFixed(0)}
                                                        K
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
                                                        Payé
                                                    </p>
                                                    <p className="font-bold text-green-600 mt-1">
                                                        {(
                                                            cot.paye / 1000
                                                        ).toFixed(0)}
                                                        K
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-semibold">
                                                        Status
                                                    </p>
                                                    <p
                                                        className={`font-bold mt-1 ${cot.du === 0 ? "text-green-600" : "text-red-600"}`}
                                                    >
                                                        {cot.du === 0
                                                            ? "✓ À jour"
                                                            : "⚠️ En retard"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-teal-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${(cot.paye / (cot.paye + cot.du || 1)) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {totalCotisations > 0 && (
                                    <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                                        <p className="font-semibold text-orange-900">
                                            ⚠️ Montant total à régulariser
                                        </p>
                                        <p className="text-2xl font-bold text-orange-600 mt-2">
                                            {(totalCotisations / 1000).toFixed(
                                                0,
                                            )}
                                            K F CFA
                                        </p>
                                        <button className="mt-4 px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2">
                                            <CreditCard size={18} /> Payer
                                            maintenant
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "paiement" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Effectuer un paiement
                                </h3>

                                {totalCotisations === 0 ? (
                                    <div className="p-8 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                                        <Heart
                                            className="text-green-600 mx-auto mb-4"
                                            size={48}
                                        />
                                        <h4 className="text-xl font-bold text-green-700 mb-2">
                                            Vous êtes à jour ✓
                                        </h4>
                                        <p className="text-green-700">
                                            Toutes vos cotisations sont payées.
                                        </p>
                                        <p className="text-green-600 text-sm mt-3">
                                            Vous pouvez néanmoins faire un don
                                            libre pour soutenir les campagnes
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Cotisation individuelle à payer */}
                                        <div className="p-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
                                            <h4 className="font-bold text-gray-900 mb-4">
                                                Sélectionnez votre cotisation
                                            </h4>
                                            <div className="mb-4">
                                                <label className="block font-semibold text-gray-900 mb-2">
                                                    Type de cotisation
                                                </label>
                                                <select
                                                    value={selectedCotisation?.id ?? ""}
                                                    onChange={(e) =>
                                                        setSelectedCotisationId(e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                >
                                                    {dueCotisations.map((cot) => (
                                                        <option key={cot.id} value={cot.id}>
                                                            {cot.nom} — {(cot.du / 1000).toFixed(0)}K F CFA
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-semibold text-gray-900 mb-2">
                                                        Année
                                                    </label>
                                                    <select
                                                        value={selectedYear}
                                                        onChange={(e) =>
                                                            setSelectedYear(Number(e.target.value))
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                                                            <option key={y} value={y}>
                                                                {y}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block font-semibold text-gray-900 mb-2">
                                                        Montant à payer
                                                    </label>
                                                    <input
                                                        value={selectedMontant}
                                                        disabled
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-bold text-orange-700"
                                                    />
                                                </div>
                                            </div>

                                            {/* Payment Method */}
                                            <div className="mb-6">
                                                <label className="block font-semibold text-gray-900 mb-3">
                                                    Mode de paiement
                                                </label>
                                                <div className="space-y-2">
                                                    {[
                                                        {
                                                            id: "momo",
                                                            label: "📱 Mobile Money (Orange Money, MTN Money)",
                                                            description:
                                                                "Rapide et sûr",
                                                        },
                                                        {
                                                            id: "cash",
                                                            label: "💵 Espèces",
                                                            description:
                                                                "Remise directe",
                                                        },
                                                        {
                                                            id: "bank",
                                                            label: "🏦 Virement bancaire",
                                                            description:
                                                                "Compte paroissial",
                                                        },
                                                    ].map((method) => (
                                                        <label
                                                            key={method.id}
                                                            className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-teal-500 cursor-pointer"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="paymentMethod"
                                                                className="w-4 h-4 text-teal-600"
                                                                checked={
                                                                    paymentMethod ===
                                                                    (method.id ===
                                                                    "momo"
                                                                        ? "MOBILE_MONEY"
                                                                        : method.id ===
                                                                            "cash"
                                                                          ? "ESPECES"
                                                                          : "VIREMENT")
                                                                }
                                                                onChange={() =>
                                                                    setPaymentMethod(
                                                                        method.id ===
                                                                            "momo"
                                                                            ? "MOBILE_MONEY"
                                                                            : method.id ===
                                                                                "cash"
                                                                              ? "ESPECES"
                                                                              : "VIREMENT",
                                                                    )
                                                                }
                                                            />
                                                            <div className="ml-3">
                                                                <p className="font-semibold text-gray-900">
                                                                    {
                                                                        method.label
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    {
                                                                        method.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>

                                                {paymentMethod === "MOBILE_MONEY" && (
                                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                                        {[
                                                            { id: "wave", label: "Wave", logo: "/images/wave.jpg" },
                                                            { id: "orange", label: "Orange", logo: "/images/OM-logo.jpg" },
                                                            { id: "mtn", label: "MTN", logo: "/images/mtn-logo.png" },
                                                        ].map((provider) => (
                                                            <button
                                                                key={provider.id}
                                                                type="button"
                                                                onClick={() => setMobileProvider(provider.id)}
                                                                className={`p-3 rounded-lg border transition ${mobileProvider === provider.id ? "border-teal-600 bg-teal-50" : "border-gray-300 bg-white"}`}
                                                            >
                                                                <img
                                                                    src={provider.logo}
                                                                    alt={provider.label}
                                                                    className="h-8 mx-auto object-contain"
                                                                />
                                                                <div className="text-xs font-semibold mt-2 text-gray-700">
                                                                    {provider.label}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleSubmitPaiement}
                                                disabled={isSubmittingPayment}
                                                className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-teal-300 transition-colors inline-flex items-center justify-center gap-2"
                                            >
                                                <CreditCard size={20} />{" "}
                                                {isSubmittingPayment
                                                    ? "Traitement..."
                                                    : paymentMethod === "MOBILE_MONEY"
                                                      ? `Payer avec ${mobileProvider.toUpperCase()}`
                                                      : "Enregistrer le paiement"}
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-blue-900 text-sm font-semibold">
                                                ℹ️ Information
                                            </p>
                                            <p className="text-blue-800 text-sm mt-2">
                                                Vous recevrez un reçu PDF par
                                                email après confirmation du
                                                paiement. Conservez-le
                                                précieusement.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "dons" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Contribuer par don
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Campagnes */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900">
                                            Campagnes en cours
                                        </h4>
                                        <div className="space-y-3">
                                            {campagnesActives.map(
                                                (campagne) => (
                                                    <div
                                                        key={campagne.id}
                                                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-400 cursor-pointer transition-colors"
                                                    >
                                                        <p className="font-semibold text-gray-900">
                                                            {campagne.titre}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Objectif :{" "}
                                                            {(
                                                                campagne.objectif /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M - Collecté :{" "}
                                                            {(
                                                                campagne.collecte /
                                                                1000000
                                                            ).toFixed(1)}
                                                            M (
                                                            {
                                                                campagne.progression
                                                            }
                                                            %)
                                                        </p>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                                            <div
                                                                className="bg-purple-600 h-2 rounded-full"
                                                                style={{
                                                                    width: `${campagne.progression}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            placeholder="Montant (K F CFA)"
                                                            className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* Don libre */}
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-4">
                                            Don libre
                                        </h4>
                                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg">
                                            <p className="text-gray-700 mb-4 font-semibold">
                                                Montant de votre don
                                            </p>
                                            <input
                                                type="number"
                                                placeholder="Entrez le montant en F CFA"
                                                value={freeDonAmount}
                                                onChange={(e) =>
                                                    setFreeDonAmount(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                            <p className="text-xs text-gray-600 mt-3">
                                                Votre contribution est
                                                volontaire et soutient les
                                                projets communautaires.
                                            </p>
                                            <button
                                                onClick={handleSubmitDonLibre}
                                                disabled={isSubmittingDon}
                                                className="w-full mt-4 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
                                            >
                                                {isSubmittingDon
                                                    ? "Enregistrement..."
                                                    : "Faire un don"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "historique" && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">
                                    Historique des paiements
                                </h3>
                                <div className="mb-6 flex gap-2">
                                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-colors inline-flex items-center gap-2">
                                        <Download size={16} /> Exporter PDF
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
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
                                                    Reçu
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {historiquePaiements.map(
                                                (paiement) => (
                                                    <tr
                                                        key={paiement.id}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                                            {paiement.type}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-teal-600">
                                                            {(
                                                                paiement.montant /
                                                                1000
                                                            ).toFixed(0)}
                                                            K
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {paiement.mode}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {paiement.date}
                                                        </td>
                                                        <td className="px-4 py-3 text-blue-600 font-semibold text-sm">
                                                            {paiement.recu}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1">
                                                                <Download
                                                                    size={14}
                                                                />{" "}
                                                                PDF
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
