import React, { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";

export default function PresenceScan() {
    const {
        token,
        event,
        isInvalidToken,
        isExpired,
        isNotYetOpen,
        isClosed,
        openingAt,
    } = usePage().props;

    const [codeMembre, setCodeMembre] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [status, setStatus] = useState("idle");

    const submit = async (e) => {
        e.preventDefault();

        if (!codeMembre.trim()) {
            setStatus("error");
            setMessage("Veuillez renseigner votre code membre.");
            return;
        }

        setLoading(true);
        setStatus("idle");
        setMessage(null);

        try {
            const response = await axios.post("/api/presence", {
                token,
                code_membre: codeMembre.trim(),
            });

            setStatus("success");
            setMessage(response.data?.message || "Présence enregistrée");
            setCodeMembre("");
        } catch (error) {
            setStatus("error");
            setMessage(
                error.response?.data?.message || "Une erreur est survenue.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Scan présence" />
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
                    padding: "24px",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "520px",
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                    }}
                >
                    <h1
                        style={{
                            marginBottom: "8px",
                            fontSize: "1.5rem",
                            color: "#0f172a",
                        }}
                    >
                        Validation de présence
                    </h1>

                    {event && (
                        <p style={{ marginBottom: "18px", color: "#475569" }}>
                            {event.title} - {event.date}
                        </p>
                    )}

                    {isInvalidToken && (
                        <p
                            style={{
                                marginBottom: "16px",
                                color: "#dc2626",
                                fontWeight: 600,
                            }}
                        >
                            QR code invalide.
                        </p>
                    )}

                    {!isInvalidToken && isExpired && (
                        <p
                            style={{
                                marginBottom: "16px",
                                color: "#dc2626",
                                fontWeight: 600,
                            }}
                        >
                            Ce QR code a expiré.
                        </p>
                    )}

                    {!isInvalidToken && !isExpired && isNotYetOpen && (
                        <p
                            style={{
                                marginBottom: "16px",
                                color: "#b45309",
                                fontWeight: 600,
                            }}
                        >
                            Le scan sera disponible deux jours avant l'activité
                            {openingAt
                                ? ` (activation: ${new Date(openingAt).toLocaleString("fr-FR")}).`
                                : "."}
                        </p>
                    )}

                    {!isInvalidToken && !isExpired && !isNotYetOpen && isClosed && (
                        <p
                            style={{
                                marginBottom: "16px",
                                color: "#dc2626",
                                fontWeight: 600,
                            }}
                        >
                            Cette activité est passée. Le scan n'est plus disponible.
                        </p>
                    )}

                    {!isInvalidToken && !isExpired && !isNotYetOpen && !isClosed && (
                        <form onSubmit={submit}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    color: "#334155",
                                    fontWeight: 600,
                                }}
                            >
                                Code membre
                            </label>
                            <input
                                type="text"
                                value={codeMembre}
                                onChange={(e) => setCodeMembre(e.target.value)}
                                placeholder="Ex: A123"
                                style={{
                                    width: "100%",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    fontSize: "1rem",
                                    marginBottom: "14px",
                                }}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    background: "#1d4ed8",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? "Validation..." : "Valider"}
                            </button>
                        </form>
                    )}

                    {message && (
                        <p
                            style={{
                                marginTop: "14px",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background:
                                    status === "success"
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                color:
                                    status === "success"
                                        ? "#166534"
                                        : "#991b1b",
                                fontWeight: 600,
                            }}
                        >
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
