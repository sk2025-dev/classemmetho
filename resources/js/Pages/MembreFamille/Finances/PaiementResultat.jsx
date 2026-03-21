import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle, AlertCircle, Clock, ArrowLeft } from "lucide-react";

export default function PaiementResultat({
    paiement = {},
    message = "",
    success = false,
}) {
    const [showDetails, setShowDetails] = useState(false);

    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n || 0);

    const statusStyle = (status) => {
        switch (status) {
            case "PAYE":
                return {
                    bg: "bg-green-100",
                    txt: "text-green-700",
                    label: "Paiement confirmé",
                    icon: <CheckCircle className="text-green-700" size={20} />,
                };
            case "ECHEC":
                return {
                    bg: "bg-red-100",
                    txt: "text-red-700",
                    label: "Paiement échoué",
                    icon: <AlertCircle className="text-red-700" size={20} />,
                };
            case "ANNULE":
                return {
                    bg: "bg-amber-100",
                    txt: "text-amber-700",
                    label: "Paiement annulé",
                    icon: <AlertCircle className="text-amber-700" size={20} />,
                };
            default:
                return {
                    bg: "bg-blue-100",
                    txt: "text-blue-700",
                    label: "En attente",
                    icon: <Clock className="text-blue-700" size={20} />,
                };
        }
    };

    const st = statusStyle(paiement.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-800 via-cyan-700 to-blue-800">
            <Head title="Résultat Paiement" />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link
                        href="/membre-famille/tresorerie"
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white"
                    >
                        <ArrowLeft size={18} /> Retour finances
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div
                        className={`w-16 h-16 rounded-full ${st.bg} flex items-center justify-center mx-auto mb-4`}
                    >
                        {st.icon}
                    </div>

                    <h1 className={`text-center text-2xl font-bold ${st.txt}`}>
                        {st.label}
                    </h1>
                    <p className="text-center text-gray-600 mt-2">{message}</p>

                    <div className="text-center text-3xl font-extrabold text-gray-900 mt-4">
                        {fmt(paiement.montant)} XOF
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDetails((v) => !v)}
                        className="mt-6 w-full px-4 py-3 bg-gray-100 rounded-lg font-semibold text-gray-700"
                    >
                        {showDetails
                            ? "Masquer les détails"
                            : "Afficher les détails"}
                    </button>

                    {showDetails && (
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Cotisation
                                </span>
                                <span className="font-semibold">
                                    {paiement.cotisation_nom || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Année</span>
                                <span className="font-semibold">
                                    {paiement.year || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Référence</span>
                                <span className="font-semibold">
                                    {paiement.reference_recu || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date</span>
                                <span className="font-semibold">
                                    {paiement.date_paiement || "-"}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <Link
                            href="/membre-famille/tresorerie"
                            className="w-full inline-flex justify-center px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
                        >
                            Retour à mes finances
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
