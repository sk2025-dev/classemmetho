import React, { useEffect, useState } from "react";

/**
 * Couleurs centralisées
 */
const COLORS = {
    labelBg: "#1e40af",
    tickerBg: "#7f1d1d",
    text: "#ffffff",
    border: "rgba(255,255,255,0.16)",
    glow: "rgba(0,0,0,0.18)",
};

/**
 * Styles centralisés
 */
const STYLES = {
    container: {
        display: "flex",
        alignItems: "center",
        height: "40px",
        backgroundColor: COLORS.tickerBg,
        padding: "0",
        fontFamily: "sans-serif",
        overflow: "hidden",
        boxShadow: `0 4px 18px ${COLORS.glow}`,
        borderTop: `1px solid ${COLORS.border}`,
        borderBottom: `1px solid ${COLORS.border}`,
        width: "100%",
    },
    label: {
        backgroundColor: COLORS.labelBg,
        color: COLORS.text,
        height: "40px",
        minWidth: "132px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 14px",
        fontWeight: "700",
        fontSize: "12px",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.9px",
        borderRight: `1px solid ${COLORS.border}`,
    },
    ticker: {
        flex: 1,
        position: "relative",
        height: "40px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 16px",
    },
    message: {
        color: COLORS.text,
        fontSize: "13px",
        fontWeight: "700",
        width: "100%",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        letterSpacing: "0.1px",
    },
};

/**
 * Composant VerticalTicker
 * Affiche des messages qui changent automatiquement avec une animation verticale
 *
 * @param {Object} props
 * @param {Array} props.messages - Tableau de messages avec {id, text}
 * @param {number} props.interval - Intervalle de changement en ms (défaut 4000)
 * @param {string} props.label - Texte du label (défaut "Flash Infos")
 */
export default function VerticalTicker({
    messages = [],
    interval = 4000,
    label = "Flash Infos",
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        if (messages.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
            setAnimKey((prev) => prev + 1);
        }, interval);

        return () => clearInterval(timer);
    }, [messages.length, interval]);

    if (messages.length === 0) {
        return null;
    }

    const safeIndex =
        messages.length > 0 ? currentIndex % messages.length : 0;
    const currentMessage = messages[safeIndex];
    const displayText = currentMessage?.text || "";
    const titleText = currentMessage?.fullText || displayText;

    return (
        <>
            <style>{`
                @keyframes slideInFromTop {
                    0% {
                        opacity: 0;
                        transform: translateY(-12px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .vertical-ticker-message {
                    animation: slideInFromTop 0.45s ease-out;
                }
            `}</style>

            <div style={STYLES.container}>
                <div style={STYLES.label}>{label}</div>
                <div style={STYLES.ticker}>
                    <div
                        key={`${currentMessage?.id ?? "ticker"}-${animKey}`}
                         className="vertical-ticker-message"
                         style={STYLES.message}
                         title={titleText}
                    >
                        {displayText}
                    </div>
                </div>
            </div>
        </>
    );
}

export function App() {
    const messages = [
        {
            id: 1,
            text: "Demande de prière publiée: Culte d'action de grâce ce dimanche à 9h.",
        },
        { id: 2, text: "Demande de prière publiée: Veillée de prière vendredi à 19h30." },
        {
            id: 3,
            text: "Demande de prière publiée: Réunion des responsables après le culte.",
        },
    ];

    return (
        <div style={{ padding: 16, background: "#0b1738" }}>
            <VerticalTicker messages={messages} />
        </div>
    );
}
