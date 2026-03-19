import React, { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    CheckCircle,
    AlertCircle,
    Download,
    ArrowLeft,
    Clock,
} from "lucide-react";

export default function PaiementResultat({
    paiement = {},
    message = "",
    success = false,
}) {
    const [showDetails, setShowDetails] = useState(false);

    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);

    const getStatusBadge = (status) => {
        const styles = {
            PAYE: {
                bg: "#eaf3de",
                color: "#3b6d11",
                icon: <CheckCircle size={20} color="#3b6d11" />,
                label: "Paiement confirmé",
            },
            ECHEC: {
                bg: "#fcebeb",
                color: "#a32d2d",
                icon: <AlertCircle size={20} color="#a32d2d" />,
                label: "Paiement échoué",
            },
            ANNULE: {
                bg: "#faeeda",
                color: "#854f0b",
                icon: <AlertCircle size={20} color="#854f0b" />,
                label: "Paiement annulé",
            },
            EN_ATTENTE: {
                bg: "#e6f1fb",
                color: "#185fa5",
                icon: <Clock size={20} color="#185fa5" />,
                label: "En attente de confirmation",
            },
        };

        return styles[status] || styles.EN_ATTENTE;
    };

    const badge = getStatusBadge(paiement.status);

    return (
        <div
            className="min-h-screen"
            style={{
                background:
                    "linear-gradient(135deg,#1a1a6e 0%,#3b2a8a 30%,#2d5a8e 60%,#4a7c59 100%)",
            }}
        >
            <Head title="Résultat Paiement" />

            {/* Header */}
            <div
                style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    padding: "18px 20px",
                }}
            >
                <div
                    style={{
                        maxWidth: 600,
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <Link
                        href="/responsable-famille/tresorerie"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>
                        Résultat de paiement
                    </h1>
                </div>
            </div>

            {/* Main content */}
            <div
                style={{
                    maxWidth: 600,
                    margin: "0 auto",
                    padding: "40px 20px",
                }}
            >
                {/* Status card */}
                <div
                    style={{
                        background: "white",
                        borderRadius: 20,
                        padding: 40,
                        textAlign: "center",
                        marginBottom: 24,
                        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                    }}
                >
                    {/* Icon */}
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background: badge.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                        }}
                    >
                        {badge.icon}
                    </div>

                    {/* Status text */}
                    <h2
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: badge.color,
                            margin: "0 0 8px",
                        }}
                    >
                        {badge.label}
                    </h2>

                    {/* Message */}
                    <p
                        style={{
                            fontSize: 14,
                            color: "#666",
                            margin: "0 0 24px",
                        }}
                    >
                        {message}
                    </p>

                    {/* Montant */}
                    {paiement.montant && (
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: "#1a1a2e",
                                margin: "20px 0",
                            }}
                        >
                            {fmt(paiement.montant)} XOF
                        </div>
                    )}
                </div>

                {/* Détails paiement */}
                {paiement.id && (
                    <div
                        style={{
                            background: "white",
                            borderRadius: 14,
                            padding: 20,
                            marginBottom: 24,
                            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                        }}
                    >
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                                width: "100%",
                                padding: 14,
                                background: "#f8f8fc",
                                border: "0.5px solid #ddd",
                                borderRadius: 10,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1a1a2e",
                            }}
                        >
                            Détails du paiement
                            <span style={{ fontSize: 18 }}>
                                {showDetails ? "−" : "+"}
                            </span>
                        </button>

                        {showDetails && (
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                {paiement.member_name && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: 12,
                                            borderBottom: "0.5px solid #eee",
                                        }}
                                    >
                                        <span style={{ color: "#888" }}>Membre</span>
                                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                            {paiement.member_name}
                                        </span>
                                    </div>
                                )}

                                {paiement.cotisation_nom && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: 12,
                                            borderBottom: "0.5px solid #eee",
                                        }}
                                    >
                                        <span style={{ color: "#888" }}>Cotisation</span>
                                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                            {paiement.cotisation_nom}
                                        </span>
                                    </div>
                                )}

                                {paiement.year && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: 12,
                                            borderBottom: "0.5px solid #eee",
                                        }}
                                    >
                                        <span style={{ color: "#888" }}>Année</span>
                                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                            {paiement.year}
                                        </span>
                                    </div>
                                )}

                                {paiement.reference_recu && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingBottom: 12,
                                            borderBottom: "0.5px solid #eee",
                                        }}
                                    >
                                        <span style={{ color: "#888" }}>Référence</span>
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                color: "#3b2a8a",
                                                fontSize: 12,
                                            }}
                                        >
                                            {paiement.reference_recu}
                                        </span>
                                    </div>
                                )}

                                {paiement.date_paiement && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span style={{ color: "#888" }}>Date</span>
                                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                            {paiement.date_paiement}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexDirection: "column",
                    }}
                >
                    {success && paiement.reference_recu && (
                        <button
                            style={{
                                padding: 14,
                                background: "#3b2a8a",
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Download size={16} /> Télécharger le reçu
                        </button>
                    )}

                    <Link
                        href="/responsable-famille/tresorerie"
                        style={{
                            padding: 14,
                            background: "#f5f5f5",
                            color: "#1a1a2e",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "center",
                            textDecoration: "none",
                        }}
                    >
                        Retour à la trésorerie
                    </Link>
                </div>
            </div>
        </div>
    );
}
