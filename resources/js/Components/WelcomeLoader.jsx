import React, { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { withBasePath } from "../Utils/urlHelper";

export default function WelcomeLoader({ userName, redirectUrl }) {
    const { app } = usePage().props;
    const basePath = app?.basePath || "";
    const withBase = (path) => withBasePath(basePath, path);

    useEffect(() => {
        // Notifier app.jsx que le welcome loader est actif
        window.setWelcomeLoaderActive(true);

        // Masquer le body et empêcher toute interaction
        document.body.style.overflow = "hidden";
        document.body.style.pointerEvents = "none";

        // Rediriger après 1.5 secondes
        const timer = setTimeout(() => {
            // Marquer qu'on vient du welcome loader pour éviter l'initial loader
            sessionStorage.setItem("comingFromWelcomeLoader", "true");

            // Redirection simple
            window.location.href = redirectUrl || withBase("/dashboard");
        }, 1500);

        return () => {
            clearTimeout(timer);
            window.setWelcomeLoaderActive(false);
            document.body.style.overflow = "auto";
            document.body.style.pointerEvents = "auto";
        };
    }, [redirectUrl]);

    return (
        <div className="welcome-loader">
            <div className="welcome-background">
                <div className="welcome-particle"></div>
                <div className="welcome-particle"></div>
                <div className="welcome-particle"></div>
                <div className="welcome-particle"></div>
                <div className="welcome-particle"></div>
            </div>
            <div className="welcome-content">
                <img
                    src={withBase("/images/image.png")}
                    alt="Logo"
                    className="welcome-logo"
                />
                <div className="welcome-text-container">
                    <h1 className="welcome-title">{`Bienvenue, ${userName} !`}</h1>
                    <p className="welcome-subtitle">
                        Chargement de votre espace...
                    </p>
                </div>
                <div className="welcome-spinner-container">
                    <div className="welcome-spinner">
                        <div className="welcome-spinner-ring"></div>
                        <div className="welcome-spinner-ring"></div>
                        <div className="welcome-spinner-ring"></div>
                    </div>
                </div>
            </div>

            <style>{`
                .welcome-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100);
                    background: linear-gradient(135deg, #1e2a78 0%, #2c3e90 50%, #FFD700 100%);
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    flex-direction: column;
                    z-index: 99999;
                    overflow: hidden;
                }

                .welcome-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .welcome-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #FFD700;
                    border-radius: 50%;
                    opacity: 0.6;
                    box-shadow: 0 0 10px #FFD700;
                }

                .welcome-particle:nth-child(1) {
                    top: 20%;
                    left: 20%;
                    animation: float 6s ease-in-out infinite;
                }

                .welcome-particle:nth-child(2) {
                    top: 60%;
                    left: 80%;
                    animation: float 8s ease-in-out infinite;
                    animation-delay: 1s;
                }

                .welcome-particle:nth-child(3) {
                    top: 80%;
                    left: 30%;
                    animation: float 7s ease-in-out infinite;
                    animation-delay: 2s;
                }

                .welcome-particle:nth-child(4) {
                    top: 30%;
                    left: 70%;
                    animation: float 9s ease-in-out infinite;
                    animation-delay: 0.5s;
                }

                .welcome-particle:nth-child(5) {
                    top: 50%;
                    left: 10%;
                    animation: float 6.5s ease-in-out infinite;
                    animation-delay: 1.5s;
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    50% {
                        transform: translateY(-40px) translateX(-10px);
                    }
                    75% {
                        transform: translateY(-20px) translateX(10px);
                    }
                }

                .welcome-content {
                    text-align: center;
                    color: white;
                    max-width: 700px;
                    padding: 50px 40px;
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .welcome-logo {
                    width: 140px;
                    height: 140px;
                    object-fit: cover;
                    border-radius: 50%;
                    margin: 0 auto 40px auto;
                    animation: logoWelcome 1s ease-out;
                    filter: drop-shadow(0 15px 40px rgba(255, 215, 0, 0.6));
                    border: 4px solid rgba(255, 215, 0, 0.4);
                    box-shadow:
                        0 0 30px rgba(255, 215, 0, 0.5),
                        inset 0 0 20px rgba(255, 215, 0, 0.2);
                    flex-shrink: 0;
                }

                @keyframes logoWelcome {
                    0% {
                        transform: scale(0) rotate(-180deg);
                        opacity: 0;
                    }
                    60% {
                        transform: scale(1.1) rotate(10deg);
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }

                .welcome-text-container {
                    margin-bottom: 50px;
                    min-height: 120px;
                    width: 100%;
                }

                .welcome-title {
                    font-size: 36px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    opacity: 0;
                    line-height: 1.5;
                    letter-spacing: 0.5px;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    background: linear-gradient(135deg, #ffffff 0%, #FFD700 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: titleAppear 1.2s ease-out 0.5s forwards;
                }

                @keyframes titleAppear {
                    0% {
                        opacity: 0;
                        transform: translateY(40px) scale(0.9);
                        filter: blur(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }

                .welcome-subtitle {
                    font-size: 20px;
                    font-weight: 300;
                    opacity: 0;
                    color: rgba(255, 255, 255, 0.95);
                    letter-spacing: 1px;
                    line-height: 1.6;
                    text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
                    animation: subtitleAppear 1s ease-out 1.2s forwards;
                }

                @keyframes subtitleAppear {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .welcome-spinner-container {
                    margin: 30px auto 0;
                    position: relative;
                    width: 80px;
                    height: 80px;
                    opacity: 0;
                    animation: spinnerAppear 1s ease-out 1.5s forwards;
                }

                @keyframes spinnerAppear {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .welcome-spinner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .welcome-spinner-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 3px solid transparent;
                    border-top-color: #FFD700;
                    border-radius: 50%;
                    animation: spinRing 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
                }

                .welcome-spinner-ring:nth-child(1) {
                    border-top-color: #FFD700;
                    animation-delay: 0s;
                }

                .welcome-spinner-ring:nth-child(2) {
                    border-top-color: rgba(147, 112, 219, 0.7);
                    width: 70%;
                    height: 70%;
                    top: 15%;
                    left: 15%;
                    animation-delay: 0.2s;
                    animation-duration: 1.2s;
                }

                .welcome-spinner-ring:nth-child(3) {
                    border-top-color: rgba(44, 62, 144, 0.7);
                    width: 40%;
                    height: 40%;
                    top: 30%;
                    left: 30%;
                    animation-delay: 0.4s;
                    animation-duration: 1s;
                }

                @keyframes spinRing {
                    0% {
                        transform: rotate(0deg);
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                    100% {
                        transform: rotate(360deg);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
