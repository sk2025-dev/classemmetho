import React from "react";
import VerticalTicker from "../Components/VerticalTicker";

/**
 * Exemple d'utilisation du composant VerticalTicker
 * Affiche plusieurs messages qui changent automatiquement
 */
export default function App() {
    // Messages d'exemple
    const flashMessages = [
        { id: 1, text: "✝️ La messe dominicale commence à 10h30" },
        {
            id: 2,
            text: "📢 Inscription baptême : délai limite 15 mars 2026",
        },
        { id: 3, text: "🎉 Bienvenue aux nouveaux membres de la paroisse" },
        {
            id: 4,
            text: "🙏 Prière communautaire vendredi à 19h en l'église",
        },
        {
            id: 5,
            text: "👨‍👩‍👧‍👦 Réunion parents confirmands 12 mars à 18h30",
        },
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
            {/* VerticalTicker en haut de la page */}
            <VerticalTicker messages={flashMessages} interval={4000} label="Flash Infos" />

            {/* Contenu principal */}
            <div style={{ padding: "40px 20px" }}>
                <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
                    Dashboard Paroissial
                </h1>

                <div
                    style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        marginBottom: "20px",
                    }}
                >
                    <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>
                        À propos du VerticalTicker
                    </h2>
                    <p style={{ color: "#666", lineHeight: "1.6" }}>
                        Le composant VerticalTicker affiche automatiquement des messages
                        avec une animation verticale fluide. Les messages changent en boucle toutes les 4 secondes (configurable).
                    </p>
                </div>

                <div
                    style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>
                        Caractéristiques
                    </h2>
                    <ul
                        style={{
                            color: "#666",
                            lineHeight: "1.8",
                            paddingLeft: "20px",
                        }}
                    >
                        <li>✅ Animation slideInFromTop avec opacity</li>
                        <li>✅ Changement automatique tous les 4 secondes</li>
                        <li>✅ Label fixe à gauche</li>
                        <li>✅ Texte blanc sur fond rouge foncé</li>
                        <li>✅ Hauteur 40px (hauteur fixe)</li>
                        <li>✅ Utilise useState et useEffect</li>
                        <li>✅ Styles centralisés avec objets COLORS et STYLES</li>
                        <li>✅ Animation CSS dans &lt;style jsx global&gt;</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
