import React, { useState, useEffect } from "react";

/**
 * Couleurs centralisées
 */
const COLORS = {
    labelBg: "#1e40af", // Bleu pour le label
    tickerBg: "#7f1d1d", // Rouge foncé pour le fond
    text: "#ffffff", // Blanc pour le texte
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
        padding: "0 16px",
        fontFamily: "sans-serif",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    label: {
        backgroundColor: COLORS.labelBg,
        color: COLORS.text,
        padding: "4px 12px",
        borderRadius: "4px",
        fontWeight: "700",
        fontSize: "12px",
        marginRight: "16px",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    ticker: {
        flex: 1,
        position: "relative",
        height: "100%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
    },
    message: {
        color: COLORS.text,
        fontSize: "14px",
        fontWeight: "500",
        animation: "slideInFromTop 0.5s ease-in-out",
        position: "absolute",
        width: "100%",
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

    useEffect(() => {
        if (messages.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
        }, interval);

        return () => clearInterval(timer);
    }, [messages.length, interval]);

    if (messages.length === 0) {
        return null;
    }

    const currentMessage = messages[currentIndex];

    return (
        <>
            <style>{`
                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideOutToBottom {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                }
            `}</style>

            <div style={STYLES.container}>
                <div style={STYLES.label}>{label}</div>
                <div style={STYLES.ticker}>
                    <div
                        key={currentMessage.id}
                        style={{
                            ...STYLES.message,
                            animation: "slideInFromTop 0.5s ease-in-out",
                        }}
                    >
                        {currentMessage.text}
                    </div>
                </div>
            </div>
        </>
    );
}
