import React, { useEffect, useRef } from "react";
import { withBasePath } from "../Utils/urlHelper";

export default function GoodbyeLoader({ userName, onAnimationComplete }) {
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const spinnerRef = useRef(null);

    useEffect(() => {
        // Notifier app.jsx que le goodbye loader est actif
        window.setGoodbyeLoaderActive(true);

        // Masquer le body
        document.body.style.overflow = "hidden";
        document.body.style.pointerEvents = "none";

        // Animer le titre avec typewriter
        if (titleRef.current) {
            const displayName = userName
                ? userName.charAt(0).toUpperCase() + userName.slice(1)
                : "Ami";
            const titleText = `À bientôt, ${displayName} !`;
            titleRef.current.textContent = "";

            let charIndex = 0;
            const typeWriter = setInterval(() => {
                if (charIndex < titleText.length) {
                    titleRef.current.textContent += titleText.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeWriter);
                }
            }, 50);
        }

        // Animer le sous-titre après un délai
        setTimeout(() => {
            if (subtitleRef.current) {
                const subtitleText = "Nous espérons vous revoir bientôt.";
                subtitleRef.current.textContent = "";

                let charIndex = 0;
                const typeWriter = setInterval(() => {
                    if (charIndex < subtitleText.length) {
                        subtitleRef.current.textContent +=
                            subtitleText.charAt(charIndex);
                        charIndex++;
                    } else {
                        clearInterval(typeWriter);
                    }
                }, 30);
            }
        }, 600);

        // Afficher le spinner après un délai
        setTimeout(() => {
            if (spinnerRef.current) {
                spinnerRef.current.style.opacity = "1";
            }
        }, 1200);

        // Appeler le callback après l'animation (4 secondes)
        const timer = setTimeout(() => {
            if (onAnimationComplete) {
                onAnimationComplete();
            }
        }, 4000);

        return () => {
            clearTimeout(timer);
            window.setGoodbyeLoaderActive(false);
            document.body.style.overflow = "auto";
            document.body.style.pointerEvents = "auto";
        };
    }, [userName, onAnimationComplete]);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 9999,
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {/* Particules animées */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: "4px",
                            height: "4px",
                            background: "#D4AF37",
                            borderRadius: "50%",
                            opacity: 0.6,
                            boxShadow: "0 0 10px #D4AF37",
                            top: ["20%", "60%", "80%", "30%", "50%"][i],
                            left: ["20%", "80%", "30%", "70%", "10%"][i],
                            animation: `float ${[6, 8, 7, 9, 6.5][i]}s ease-in-out infinite`,
                            animationDelay: `${[0, 1, 2, 0.5, 1.5][i]}s`,
                        }}
                    />
                ))}
            </div>

            {/* Contenu */}
            <div
                style={{
                    textAlign: "center",
                    color: "white",
                    maxWidth: "700px",
                    padding: "50px 40px",
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        width: "140px",
                        height: "140px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        marginBottom: "40px",
                        filter: "drop-shadow(0 15px 40px rgba(212, 175, 55, 0.6))",
                        border: "4px solid rgba(212, 175, 55, 0.4)",
                        boxShadow:
                            "0 0 30px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.2)",
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={withBasePath("", "/images/image.png")}
                        alt="Logo"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>

                {/* Texte animé */}
                <div style={{ marginBottom: "50px", minHeight: "120px" }}>
                    <h1
                        ref={titleRef}
                        style={{
                            fontSize: "36px",
                            fontWeight: "700",
                            marginBottom: "20px",
                            lineHeight: "1.5",
                            letterSpacing: "0.5px",
                            textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
                        }}
                    />
                    <p
                        ref={subtitleRef}
                        style={{
                            fontSize: "20px",
                            fontWeight: "300",
                            color: "rgba(255, 255, 255, 0.95)",
                            letterSpacing: "1px",
                            lineHeight: "1.6",
                            textShadow: "0 1px 5px rgba(0, 0, 0, 0.2)",
                        }}
                    />
                </div>

                {/* Spinner */}
                <div
                    ref={spinnerRef}
                    style={{
                        margin: "30px auto 0",
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        opacity: 0,
                        transition: "opacity 0.5s ease-out",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    width: ["100%", "70%", "40%"][i],
                                    height: ["100%", "70%", "40%"][i],
                                    border: "3px solid transparent",
                                    borderTopColor: [
                                        "#FFD700",
                                        "rgba(147, 112, 219, 0.7)",
                                        "rgba(44, 62, 144, 0.7)",
                                    ][i],
                                    borderRadius: "50%",
                                    animation: `spinRing ${[1.5, 1.2, 1][i]}s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite`,
                                    animationDelay: `${[0, 0.2, 0.4][i]}s`,
                                    top: ["15%", "15%", "30%"][i],
                                    left: ["15%", "15%", "30%"][i],
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
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
