/**
 * Utilitaire pour générer le HTML du loading screen
 * Utilisé par app.jsx, AppLayout.jsx et LoadingScreen.jsx
 */

import { withBasePath } from "./urlHelper";

const LOGO_URL = withBasePath("", "/images/image.png");

// Précharger l'image dès que possible
if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = LOGO_URL;
    document.head.appendChild(link);
}

export const loadingScreenHTML = `
    <div class="loading-background">
        <div class="loading-particle"></div>
        <div class="loading-particle"></div>
        <div class="loading-particle"></div>
        <div class="loading-particle"></div>
        <div class="loading-particle"></div>
    </div>
    <div class="loading-content">
        <div class="logo-wrapper">
            <div class="logo-glow"></div>
            <img
                src="${LOGO_URL}"
                alt="Logo"
                class="loading-logo"
                loading="eager"
                decoding="async"
                onerror="this.style.background='radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%)'"
            />
        </div>
        <div class="loading-spinner-container">
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
        </div>
        <div class="loading-text">
            <span class="loading-dots">
                <span class="dot">.</span>
                <span class="dot">.</span>
                <span class="dot">.</span>
            </span>
        </div>
    </div>
`;

/**
 * Composant React pour le loading screen
 */
export const LoadingScreenComponent = () => (
    <>
        <div className="loading-background">
            <div className="loading-particle"></div>
            <div className="loading-particle"></div>
            <div className="loading-particle"></div>
            <div className="loading-particle"></div>
            <div className="loading-particle"></div>
        </div>
        <div className="loading-content">
            <div className="logo-wrapper">
                <div className="logo-glow"></div>
                <img
                    src={LOGO_URL}
                    alt="Logo"
                    className="loading-logo"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                        e.target.style.background =
                            "radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%)";
                        e.target.style.border =
                            "3px solid rgba(212, 175, 55, 0.6)";
                    }}
                />
            </div>
            <div className="loading-spinner-container">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
            </div>
            <div className="loading-text">
                <span className="loading-dots">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                </span>
            </div>
        </div>
    </>
);
