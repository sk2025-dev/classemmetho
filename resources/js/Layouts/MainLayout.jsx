import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import GoodbyeLoader from "../Components/GoodbyeLoader";
import { getPhotoUrl } from "../Helpers/PhotoHelper";

// Header professionnel et minimaliste
function AppHeader({ auth, onLogout }) {
    const [profileOpen, setProfileOpen] = useState(false);

    const getRoleLabel = (role) => {
        const labels = {
            admin: "Administrateur",
            pasteur: "Pasteur",
            conducteur: "Conducteur",
            responsable: "Responsable",
            responsable_famille: "Responsable Famille",
            membre_famille: "Membre Famille",
        };
        return labels[role?.toLowerCase()] || "Utilisateur";
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo et Titre */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                                src="/images/image.png"
                                alt="Logo Jubilé"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                Jubilé
                            </h1>
                            <p className="text-xs text-gray-500">
                                Plateforme de gestion
                            </p>
                        </div>
                    </div>

                    {/* Informations utilisateur */}
                    <div className="flex items-center gap-4">
                        {/* Date et heure (desktop uniquement) */}
                        <div className="hidden lg:flex items-center gap-4 text-sm text-gray-600 mr-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>
                                    {new Date().toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="font-mono">
                                    {new Date().toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Profil Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium overflow-hidden">
                                    {auth?.user?.profile_photo_url ? (
                                        <img
                                            src={auth?.user?.profile_photo_url}
                                            alt={auth?.user?.prenom}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    ) : null}
                                </div>

                                {/* Infos utilisateur (desktop) */}
                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {auth?.user?.prenom && auth?.user?.nom
                                            ? `${auth?.user?.prenom} ${auth?.user?.nom}`
                                            : auth?.user?.name || "Utilisateur"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getRoleLabel(auth?.user?.role)}
                                    </div>
                                </div>

                                {/* Icône dropdown */}
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Menu Dropdown */}
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    {/* En-tête du profil */}
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                                                {auth?.user
                                                    ?.profile_photo_url ? (
                                                    <img
                                                        src={
                                                            auth?.user
                                                                ?.profile_photo_url
                                                        }
                                                        alt={auth?.user?.prenom}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display =
                                                                "none";
                                                            e.target.nextElementSibling.style.display =
                                                                "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                <span
                                                    style={{
                                                        display: !auth?.user
                                                            ?.profile_photo_url
                                                            ? "flex"
                                                            : "none",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        width: "100%",
                                                        height: "100%",
                                                    }}
                                                >
                                                    {auth?.user?.prenom?.[0]?.toUpperCase() ||
                                                        auth?.user?.name?.[0]?.toUpperCase() ||
                                                        "U"}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {auth?.user?.prenom &&
                                                    auth?.user?.nom
                                                        ? `${auth?.user?.prenom} ${auth?.user?.nom}`
                                                        : auth?.user?.name ||
                                                          "Utilisateur"}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {getRoleLabel(
                                                        auth?.user?.role,
                                                    )}
                                                </p>
                                                {auth?.user?.identifiant && (
                                                    <p className="text-xs text-gray-700 font-semibold mt-1">
                                                        ID:{" "}
                                                        {
                                                            auth?.user
                                                                ?.identifiant
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations détaillées */}
                                    <div className="p-4 bg-gray-50 space-y-2 text-sm">
                                        {auth?.user?.email && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg
                                                    className="w-4 h-4 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <span className="truncate">
                                                    {auth?.user?.email}
                                                </span>
                                            </div>
                                        )}
                                        {auth?.user?.telephone && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg
                                                    className="w-4 h-4 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                    />
                                                </svg>
                                                <span>
                                                    {auth?.user?.telephone}
                                                </span>
                                            </div>
                                        )}
                                        {auth?.user?.classe && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg
                                                    className="w-4 h-4 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-.5 0h-5m0 0H9"
                                                    />
                                                </svg>
                                                <span>
                                                    {auth?.user?.classe?.nom}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            onClick={() =>
                                                setProfileOpen(false)
                                            }
                                        >
                                            <svg
                                                className="w-4 h-4 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            <span>Mon profil</span>
                                        </Link>

                                        <div className="my-2 border-t border-gray-200"></div>
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            <span>Déconnexion</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

// Layout principal
export default function MainLayout({ children, auth }) {
    const [showGoodbyeLoader, setShowGoodbyeLoader] = useState(false);

    const handleLogout = () => {
        // Afficher le loader d'au revoir
        setShowGoodbyeLoader(true);
    };

    const handleGoodbyeAnimationComplete = () => {
        // Effectuer la déconnexion après l'animation
        router.post("/logout");
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                minHeight: "100vh",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            <AppHeader auth={auth} onLogout={handleLogout} />

            {/* Loader de déconnexion */}
            {showGoodbyeLoader && (
                <GoodbyeLoader
                    userName={
                        auth?.user?.prenom && auth.user.prenom.trim() !== ""
                            ? auth.user.prenom
                            : auth?.user?.nom
                    }
                    onAnimationComplete={handleGoodbyeAnimationComplete}
                />
            )}

            <main>{children}</main>
        </div>
    );
}
