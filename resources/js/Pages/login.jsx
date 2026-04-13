import React, { useState, useEffect } from "react";
import { useForm, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import WelcomeLoader from "../Components/WelcomeLoader";
import { withBasePath } from "../Utils/urlHelper";

export default function Login() {
    const { csrf_token, app } = usePage().props;
    const basePath = app?.basePath || "";
    const withBase = (path) => withBasePath(basePath, path);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showWelcomeLoader, setShowWelcomeLoader] = useState(false);
    const [welcomeUserName, setWelcomeUserName] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [postLoginRedirect, setPostLoginRedirect] = useState("");

    const { data, setData } = useForm({
        identifiant: "",
        password: "",
    });
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const redirectTo = query.get("redirect_to") || "";
        setPostLoginRedirect(redirectTo);
    }, []);

    const handleContinue = (e) => {
        e.preventDefault();
        if (data.identifiant.trim() !== "") {
            setStep(2);
            setErrorMessage("");
        }
    };

    const handleBack = () => {
        setStep(1);
        setData("password", "");
        setErrorMessage("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation côté client
        if (!data.identifiant.trim() || !data.password.trim()) {
            return;
        }

        setIsLoggingIn(true);
        setErrorMessage("");

        try {
            const response = await fetch(withBase("/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": csrf_token || "",
                },
                body: JSON.stringify({
                    identifiant: data.identifiant,
                    password: data.password,
                    redirect_to: postLoginRedirect || undefined,
                }),
            });

            const responseData = await response.json();

            if (response.ok) {
                // Succès: construire le nom à afficher (utiliser prenom ou nom)
                let welcomeName = "";
                if (
                    responseData.user?.prenom &&
                    responseData.user.prenom.trim() !== ""
                ) {
                    welcomeName = responseData.user.prenom;
                } else if (
                    responseData.user?.nom &&
                    responseData.user.nom.trim() !== ""
                ) {
                    welcomeName = responseData.user.nom;
                } else {
                    welcomeName = responseData.user?.name || "Utilisateur";
                }

                const redirectUrl = responseData.redirect_url || "/dashboard";

                // Stocker les données dans window pour AppLayout
                window.justLoggedIn = true;
                window.welcomeUserName = welcomeName;
                window.welcomeRedirectUrl = redirectUrl;

                // Afficher le welcome loader pendant 2.5s puis naviguer
                setWelcomeUserName(welcomeName);
                setRedirectUrl(redirectUrl);
                setShowWelcomeLoader(true);
            } else {
                // Erreur: afficher le message d'erreur
                setErrorMessage(
                    responseData.message || "Une erreur est survenue.",
                );
                setIsLoggingIn(false);
            }
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
            setIsLoggingIn(false);
        }
    };

    return (
        <>
            {showWelcomeLoader && (
                <WelcomeLoader
                    userName={welcomeUserName}
                    redirectUrl={redirectUrl}
                />
            )}

            <div
                className="min-h-screen flex flex-col"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                {/* Header avec lien retour */}
                <div className="p-6 flex items-center">
                    <Link
                        href={withBase("/")}
                        className="flex items-center gap-2 text-white hover:text-[#f5c542] transition-colors font-semibold"
                    >
                        <ArrowLeft size={20} />
                        Accueil
                    </Link>
                </div>

                {/* Contenu principal */}
                <div className="flex-1 flex items-center justify-center p-4 pb-20">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-fadeIn">
                        {/* Logo institutionnel */}
                        <div className="mb-6">
                            <img
                                src={withBase("/images/image.png")}
                                alt="Logo Jubilé"
                                className="mx-auto w-24 h-24 object-contain"
                            />
                            <h1 className="text-xl font-bold text-[#1e2a78] mt-2">
                                JUBILÉ DE COCODY
                            </h1>
                        </div>

                        {/* Étape 1 */}
                        {step === 1 && (
                            <div className="animate-slideFade">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Connexion
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Entrez votre identifiant
                                </p>
                                <form
                                    onSubmit={handleContinue}
                                    className="space-y-6"
                                >
                                    <div className="text-left">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Identifiant
                                        </label>
                                        <input
                                            type="text"
                                            value={data.identifiant}
                                            onChange={(e) =>
                                                setData(
                                                    "identifiant",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Votre identifiant"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-[#f5c542] to-[#fbbf24] text-[#1e2a78] py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        Continuer →
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Étape 2 */}
                        {step === 2 && (
                            <div className="animate-slideFade">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Connexion
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Bonjour,{" "}
                                    <span className="font-semibold">
                                        {data.identifiant}
                                    </span>
                                </p>

                                <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-[#f5c542] text-[#1e2a78] text-3xl font-bold shadow-md mb-6">
                                    {data.identifiant.charAt(0).toUpperCase()}
                                </div>

                                <form
                                    onSubmit={handleLogin}
                                    className="space-y-6"
                                >
                                    <div className="text-left relative">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Mot de passe
                                        </label>
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Votre mot de passe"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-9 text-gray-500 hover:text-[#1e2a78]"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>

                                    {/* Zone d'erreur */}
                                    {errorMessage && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoggingIn}
                                        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                                            isLoggingIn
                                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                                : "bg-gradient-to-r from-[#f5c542] to-[#fbbf24] text-[#1e2a78] hover:shadow-lg transform hover:scale-105"
                                        }`}
                                    >
                                        {isLoggingIn && (
                                            <svg
                                                className="animate-spin h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        )}
                                        {isLoggingIn
                                            ? "Connexion en cours..."
                                            : "Se connecter"}
                                    </button>

                                    <div className="flex justify-between items-center mt-4 text-sm text-[#1e2a78]">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="hover:underline flex items-center"
                                        >
                                            ← Retour
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Animations CSS */}
                <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out both;
          }
          @keyframes slideFade {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideFade {
            animation: slideFade 0.5s ease-out both;
          }
        `}</style>
            </div>
        </>
    );
}
