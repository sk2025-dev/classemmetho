import React, { useEffect, useRef, useState } from "react";
import { X, Loader, ExternalLink } from "lucide-react";
import { withBasePath } from "../Utils/urlHelper";

/**
 * PaymentModal - Popup pour les paiements Paydunya
 * Ouvre une popup pour PayDunya et effectue du polling pour détecter la fin du paiement
 */
export function PaymentModal({
    isOpen,
    paymentUrl,
    paiementId,
    onClose,
    onSuccess,
    onError,
}) {
    const [isWaiting, setIsWaiting] = useState(false);
    const [error, setError] = useState(null);
    const popupRef = useRef(null);
    const pollingRef = useRef(null);
    const [pollingCount, setPollingCount] = useState(0);
    const popupCheckRef = useRef(null);

    // Vérifier le statut du paiement
    const checkPaymentStatus = async () => {
        try {
            const res = await fetch(
                withBasePath("", `/responsable-famille/tresorerie/paiement/${paiementId}/verify`),
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    credentials: "same-origin",
                }
            );

            if (res.ok) {
                const result = await res.json();

                // Si le paiement est terminé
                if (result.success || result.status === "PAYE") {
                    clearInterval(pollingRef.current);
                    clearInterval(popupCheckRef.current);
                    // Fermer la popup si elle est toujours ouverte
                    if (popupRef.current && !popupRef.current.closed) {
                        popupRef.current.close();
                    }
                    onSuccess?.(result);
                    setTimeout(() => onClose(), 1500);
                    return true;
                } else if (
                    result.status === "ECHEC" ||
                    result.status === "ANNULE"
                ) {
                    clearInterval(pollingRef.current);
                    clearInterval(popupCheckRef.current);
                    if (popupRef.current && !popupRef.current.closed) {
                        popupRef.current.close();
                    }
                    onError?.(result.message || "Paiement échoué");
                    return true;
                }
            }
        } catch (err) {
            console.error("Erreur lors de la vérification du paiement:", err);
        }
        return false;
    };

    // Vérifier que la popup existe toujours
    const checkPopupStatus = () => {
        if (popupRef.current && popupRef.current.closed) {
            // La popup a été fermée
            clearInterval(popupCheckRef.current);
            // Continuer à vérifier le statut du paiement pendant 30s de plus
            if (pollingCount < 50) {
                // Ne rien faire, le polling continue
            }
        }
    };

    useEffect(() => {
        if (!isOpen || !paymentUrl || !paiementId) {
            return;
        }

        setIsWaiting(true);
        setError(null);

        // Ouvrir la popup
        const features =
            "width=800,height=900,left=100,top=100,resizable=yes,scrollbars=yes";
        popupRef.current = window.open(paymentUrl, "PayDunya_Checkout", features);

        // Vérifier que la popup a pu s'ouvrir
        if (!popupRef.current) {
            setError(
                "La popup a été bloquée. Veuillez autoriser les popups et réessayer."
            );
            setIsWaiting(false);
            return;
        }

        // Vérifier régulièrement si la popup est fermée
        popupCheckRef.current = setInterval(() => {
            checkPopupStatus();
        }, 500);

        // Commencer le polling du statut après 2 secondes
        const pollTimer = setTimeout(() => {
            pollingRef.current = setInterval(async () => {
                setPollingCount((prev) => prev + 1);
                const isDone = await checkPaymentStatus();
                // Arrêter après 300 secondes (5 minutes)
                if (isDone || pollingCount > 100) {
                    clearInterval(pollingRef.current);
                    clearInterval(popupCheckRef.current);
                    if (pollingCount > 100) {
                        onError?.("Dépassement du délai - Paiement expiré");
                        setTimeout(() => onClose(), 2000);
                    }
                }
            }, 3000);
        }, 2000);

        return () => {
            clearTimeout(pollTimer);
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (popupCheckRef.current) clearInterval(popupCheckRef.current);
            if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
            }
        };
    }, [isOpen, paymentUrl, paiementId, pollingCount]);

    const handleClose = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (popupCheckRef.current) clearInterval(popupCheckRef.current);
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.6)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    maxWidth: "500px",
                    width: "100%",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px",
                        borderBottom: "1px solid #f0f0f0",
                        background: "#fafafa",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#1a1a2e",
                            margin: 0,
                        }}
                    >
                        Paiement en cours
                    </h2>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#999",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        title="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenu */}
                <div style={{ padding: "32px", textAlign: "center" }}>
                    {error ? (
                        <>
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    background: "#fcebeb",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}
                            >
                                <X
                                    size={36}
                                    style={{ color: "#e24b4a" }}
                                />
                            </div>
                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1a1a2e",
                                    marginBottom: "12px",
                                }}
                            >
                                La popup a été bloquée
                            </h3>
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#888",
                                    marginBottom: "20px",
                                }}
                            >
                                Votre navigateur a bloqué la fenêtre de paiement.
                                Cliquez sur le lien ci-dessous pour payer.
                            </p>
                            <a
                                href={paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-block",
                                    background: "#1d9e75",
                                    color: "white",
                                    border: "none",
                                    padding: "12px 28px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    marginBottom: "12px",
                                }}
                            >
                                Ouvrir la page de paiement →
                            </a>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#aaa",
                                    marginTop: "16px",
                                }}
                            >
                                Une fois le paiement effectué, revenez ici.
                                <br />
                                Le statut se mettra à jour automatiquement.
                            </p>
                            <button
                                onClick={handleClose}
                                style={{
                                    marginTop: "16px",
                                    background: "#f0f0f0",
                                    color: "#555",
                                    border: "none",
                                    padding: "10px 24px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Fermer
                            </button>
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    background: "#e6f1fb",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}
                            >
                                <Loader
                                    size={36}
                                    style={{
                                        color: "#3b2a8a",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                            </div>

                            <h3
                                style={{
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#1a1a2e",
                                    marginBottom: "12px",
                                }}
                            >
                                Une fenêtre de paiement s'est ouverte
                            </h3>

                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#888",
                                    marginBottom: "8px",
                                }}
                            >
                                Complétez votre paiement dans la fenêtre
                                (popup) qui s'est ouverte.
                            </p>

                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#aaa",
                                    marginBottom: "20px",
                                }}
                            >
                                Cette fenêtre se fermera automatiquement une
                                fois le paiement confirmé.
                            </p>

                            {popupRef.current && !popupRef.current.closed && (
                                <button
                                    onClick={() =>
                                        popupRef.current?.focus()
                                    }
                                    style={{
                                        background: "#1d9e75",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 24px",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        margin: "0 auto",
                                    }}
                                >
                                    <ExternalLink size={16} />
                                    Revenir à la popup
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "12px 20px",
                        background: "#f8f8fc",
                        borderTop: "1px solid #f0f0f0",
                        fontSize: "12px",
                        color: "#888",
                        textAlign: "center",
                    }}
                >
                    Vérification en cours... Attendez que le paiement se
                    termine
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
