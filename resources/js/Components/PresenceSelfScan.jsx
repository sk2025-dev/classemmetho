import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import QrCodeScanner from "@/Components/QrCodeScanner";
import { withBasePath } from "../Utils/urlHelper";

/**
 * Bouton + modal permettant à un membre connecté de pointer sa propre présence
 * en scannant, avec la caméra du téléphone/ordinateur, le QR code affiché pour
 * l'activité (pas de saisie manuelle de code membre : l'utilisateur connecté
 * est directement le membre pointé côté serveur).
 */
export default function PresenceSelfScan({ label = "Scanner ma présence" }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [cameraActive, setCameraActive] = useState(true);
    const lastScanRef = useRef({ code: null, at: 0 });
    // Garde de ré-entrance en ref (pas en state) : un state comme dépendance
    // ferait changer l'identité de handleScan à chaque scan, ce qui forçait
    // QrCodeScanner à arrêter/redémarrer la caméra en pleine lecture — source
    // de plantages laissant la page vierge (aucun Error Boundary auparavant).
    const loadingRef = useRef(false);

    const close = () => {
        setOpen(false);
        setFeedback(null);
        setCameraActive(true);
        lastScanRef.current = { code: null, at: 0 };
    };

    const handleScan = useCallback(async (decodedText) => {
        const content = String(decodedText || "").trim();
        if (!content || loadingRef.current) return;

        const now = Date.now();
        if (
            lastScanRef.current.code === content &&
            now - lastScanRef.current.at < 4000
        ) {
            return;
        }
        lastScanRef.current = { code: content, at: now };

        loadingRef.current = true;
        setLoading(true);
        setFeedback(null);

        try {
            const response = await axios.post(
                withBasePath("", "/presence/scan-self"),
                { qr_content: content },
            );
            setFeedback({
                type: "success",
                message: response?.data?.message || "Présence enregistrée avec succès.",
            });
            setCameraActive(false);
        } catch (error) {
            setFeedback({
                type: "error",
                message:
                    error?.response?.data?.message ||
                    "Impossible d'enregistrer votre présence.",
            });
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    borderRadius: 20,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                📷 {label}
            </button>

            {open && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: 16,
                    }}
                    onClick={close}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: 20,
                            padding: 24,
                            width: "100%",
                            maxWidth: 380,
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: 17, color: "#1e2070" }}>
                                Scanner le QR de l'activité
                            </h3>
                            <button
                                type="button"
                                onClick={close}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    fontSize: 20,
                                    lineHeight: 1,
                                    cursor: "pointer",
                                    color: "#64748b",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                            Pointez la caméra vers le QR code affiché pour l'activité.
                        </p>

                        {cameraActive && (
                            <QrCodeScanner onScan={handleScan} active={cameraActive} />
                        )}

                        {loading && (
                            <p style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
                                Vérification...
                            </p>
                        )}

                        {feedback && (
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: "12px 14px",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: 13,
                                    background:
                                        feedback.type === "success" ? "#e6f4ea" : "#fce8e8",
                                    color: feedback.type === "success" ? "#1a7740" : "#c0392b",
                                }}
                            >
                                {feedback.message}
                            </div>
                        )}

                        {feedback && feedback.type === "error" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedback(null);
                                    setCameraActive(true);
                                }}
                                style={{
                                    marginTop: 12,
                                    background: "#1e2070",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Réessayer
                            </button>
                        )}

                        {feedback && feedback.type === "success" && (
                            <button
                                type="button"
                                onClick={close}
                                style={{
                                    marginTop: 12,
                                    background: "#1a7740",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Fermer
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
