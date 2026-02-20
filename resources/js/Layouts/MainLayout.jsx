import React, { useState, useEffect, useRef } from "react";
import { Link, router } from "@inertiajs/react";
import GoodbyeLoader from "../Components/GoodbyeLoader";

// Menu items data
const menuItems = [
    {
        title: "Inscription",
        subtitle: "Famille et classe méthodiste",
        href: "/admin/inscriptions",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        ),
        color: "bg-purple-500"
    },
    {
        title: "Présences",
        subtitle: "Gestion des présences",
        href: "/presences",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        color: "bg-blue-500"
    },
    {
        title: "Trésorerie",
        subtitle: "FIMECO, Autres cotisations",
        href: "/tresorerie",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: "bg-green-500"
    },
    {
        title: "Actes Liturgiques",
        subtitle: "Mariage, Baptême, etc.",
        href: "/actes-liturgiques",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        color: "bg-pink-500"
    },
    {
        title: "Sondage",
        subtitle: "Participez aux sondages",
        href: "/sondages",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        color: "bg-yellow-500"
    },
    {
        title: "Sujets de Prières",
        subtitle: "Partagez vos intentions",
        href: "/prieres",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
        color: "bg-indigo-500"
    },
    {
        title: "Programme d'Activité",
        subtitle: "Calendrier des événements",
        href: "/calendrier",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        color: "bg-orange-500"
    },
    {
        title: "Annuaire",
        subtitle: "Annuaire de la communauté",
        href: "/annuaire",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        color: "bg-teal-500"
    },
    {
        title: "Administration",
        subtitle: "Gestion du système",
        href: "/admin/administration",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        color: "bg-red-500"
    }
];

// Header professionnel et minimaliste
function AppHeader({ auth, onLogout }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

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
                    {/* Menu Hamburger */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            aria-label="Menu principal"
                        >
                            <svg
                                className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Menu Déroulant Principal */}
                        {menuOpen && (
                            <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-left transition-all duration-300 z-50">
                                {/* En-tête du menu */}
                                <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
                                    <h3 className="text-white font-semibold text-lg">Menu Principal</h3>
                                    <p className="text-purple-100 text-xs">Navigation rapide</p>
                                </div>

                                {/* Liste des items */}
                                <div className="max-h-[70vh] overflow-y-auto py-2">
                                    {menuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 group border-b border-gray-50 last:border-b-0"
                                        >
                                            <div className={`${item.color} p-2 rounded-lg text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                            <svg
                                                className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pied de page du menu */}
                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 text-center">Église Méthodiste Jubilé</p>
                                </div>
                            </div>
                        )}
                    </div>

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
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-mono">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                </div>

                                {/* Infos utilisateur (desktop) */}
                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {auth?.user?.prenom && auth?.user?.nom ? `${auth?.user?.prenom} ${auth?.user?.nom}` : auth?.user?.name || "Utilisateur"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getRoleLabel(auth?.user?.role)}
                                    </div>
                                </div>

                                {/* Icône dropdown */}
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Menu Dropdown */}
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                    {/* En-tête du profil */}
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                                                {auth?.user?.profile_photo_url ? (
                                                    <img
                                                        src={auth?.user?.profile_photo_url}
                                                        alt={auth?.user?.prenom}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <span style={{ display: !auth?.user?.profile_photo_url ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                    {auth?.user?.prenom?.[0]?.toUpperCase() ||
                                                     auth?.user?.name?.[0]?.toUpperCase() || "U"}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {auth?.user?.prenom && auth?.user?.nom ? `${auth?.user?.prenom} ${auth?.user?.nom}` : auth?.user?.name || "Utilisateur"}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {getRoleLabel(auth?.user?.role)}
                                                </p>
                                                {auth?.user?.identifiant && (
                                                    <p className="text-xs text-gray-700 font-semibold mt-1">
                                                        ID: {auth?.user?.identifiant}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations détaillées */}
                                    <div className="p-4 bg-gray-50 space-y-2 text-sm">
                                        {auth?.user?.email && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{auth?.user?.email}</span>
                                            </div>
                                        )}
                                        {auth?.user?.telephone && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{auth?.user?.telephone}</span>
                                            </div>
                                        )}
                                        {auth?.user?.classe && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-.5 0h-5m0 0H9" />
                                                </svg>
                                                <span>{auth?.user?.classe?.nom}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
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
                        auth?.user?.prenom && auth.user.prenom.trim() !== ''
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
