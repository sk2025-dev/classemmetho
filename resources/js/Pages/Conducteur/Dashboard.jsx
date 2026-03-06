import React from "react";
import { Link, router } from "@inertiajs/react";

// --- COMPOSANT ICÔNE ---
const Icon = ({ name, className }) => {
    const icons = {
        inscription: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
        ),
        presence: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
        ),
        tresorerie: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        ),
        liturgique: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
        ),
        sondage: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
        ),
        priere: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
        ),
        programme: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
            />
        ),
        annuaire: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
        ),
        logout: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
        ),
    };
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            {icons[name] || icons.inscription}
        </svg>
    );
};

export default function Dashboard({ role, pendingInscriptions, pendingLiturgieCount = 0, auth, className = 'Ma Classe' }) {
    const menuItems = [
        {
            title: "Inscription",
            desc: "Famille et classe méthodiste",
            icon: "inscription",
            href: "/conducteur/inscriptions",
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            title: "Présences",
            desc: "Gestion des présences",
            icon: "presence",
            href: "/conducteur/presences",
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            title: "Trésorerie",
            desc: "FIMECO, Autres cotisations",
            icon: "tresorerie",
            href: "/conducteur/tresorerie",
            color: "text-yellow-600",
            bg: "bg-yellow-100",
        },
        {
            title: "Actes Liturgiques",
            desc: "Mariage, Baptême, etc.",
            icon: "liturgique",
            href: "/conducteur/liturgie",
            color: "text-purple-600",
            bg: "bg-purple-100",
        },
        {
            title: "Sondage",
            desc: "Participez aux sondages",
            icon: "sondage",
            href: "/conducteur/sondages",
            color: "text-pink-600",
            bg: "bg-pink-100",
        },
        {
            title: "Sujets de Prières",
            desc: "Partagez vos intentions",
            icon: "priere",
            href: "/conducteur/prieres",
            color: "text-indigo-600",
            bg: "bg-indigo-100",
        },
        {
            title: "Programme d'Activité",
            desc: "Calendrier des événements",
            icon: "programme",
            href: "/conducteur/activites",
            color: "text-red-600",
            bg: "bg-red-100",
        },
        {
            title: "Annuaire",
            desc: "Annuaire de la communauté",
            icon: "annuaire",
            href: "/conducteur/annuaire",
            color: "text-teal-600",
            bg: "bg-teal-100",
        },
    ];

    const handleLogout = (e) => {
        e.preventDefault();
        router.post("/logout");
    };

    // Utilise uniquement le layout MainLayout qui fournit déjà le header
    return (
        <div
            className="min-h-screen admin-page px-4 sm:px-6 lg:px-8"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                minHeight: "100vh",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h6 className="dashboard-title">
                        Espace du Conducteur
                    </h6>
                    <p className="mb-2 text-lg text-center" style={{ color: "#EEE00F" }}>
                        Classe: <strong>{className}</strong>
                    </p>
                    <div className="animated-text-container">
                        <p className="animated-text">
                            Bienvenue sur la plateforme de gestion des classes
                            méthodistes du Jubilé
                        </p>
                    </div>
                </div>
                {/* GRID DASHBOARD - Cartes blanches sur fond violet */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="group block relative"
                        >
                            {/* Filigrane logo supprimé */}
                            <div className="bg-white text-gray-800 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6 h-full border-2 border-yellow-400 group-hover:border-t-4 group-hover:border-blue-500 relative overflow-hidden z-10">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Icon
                                        name={item.icon}
                                        className="w-24 h-24"
                                    />
                                </div>
                                <div className="relative z-10">
                                    <div
                                        className={`w-12 h-12 ${item.bg} ${item.color} rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors`}
                                    >
                                        <Icon
                                            name={item.icon}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-snug">
                                        {item.desc}
                                    </p>
                                </div>
                                {/* Badge pour Inscription si pending */}
                                {item.icon === "inscription" &&
                                    pendingInscriptions > 0 && (
                                        <span className="absolute top-4 right-4 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                {item.icon === "liturgique" && pendingLiturgieCount > 0 && (
                                    <span className="absolute top-4 right-4 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                        {pendingLiturgieCount}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
