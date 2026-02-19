import React, { useState, useEffect, useRef } from "react";
import { Link } from "@inertiajs/react";
import {
    Menu,
    X,
    ArrowRight,
    Phone,
    MapPin,
    Mail,
    Clock,
    Users,
    User,
    Cross,
    Car,
    CheckCircle2,
    Facebook,
    Instagram,
    Youtube,
} from "lucide-react";
import { clearOldStepData } from "../Hooks/usePersistentState";

const CHURCH_DATA = {
    name: "Église Methodiste du Jubile",
    tagline: "Une communauté de foi, d'amour et de partage",
    stats: [
        { label: "Membres Actifs", value: "500+" },
        { label: "Années de Service", value: "25+" },
        { label: "Cultes par An", value: "52" },
    ],
    services: [
        {
            id: "family",
            title: "Inscription Famille",
            description:
                "Gérez le profil de tous les membres de votre famille sous un seul compte parent.",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            id: "driver",
            title: "Conducteur",
            description: "Inscrivez-vous en tant que conducteur .",
            icon: Users,
            color: "text-amber-600",
            bg: "bg-amber-100",
        },
    ],
};

const Navbar = ({ activeSection, isScrolled }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: "Accueil", href: "#home" },
        { name: "Services", href: "#services" },
        { name: "Contact", href: "#contact" },
    ];

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 ${
                isScrolled
                    ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
                    : "bg-transparent py-6 text-white"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-lg shadow-md">
                            <img
                                src="/images/image.png"
                                alt="Logo Église ClasseMethodo Jubile"
                                className="h-10 w-10 object-contain"
                            />
                        </div>
                        <span
                            className={`text-xl font-bold tracking-tight ${
                                isScrolled ? "text-slate-900" : "text-white"
                            }`}
                        >
                            {CHURCH_DATA.name}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-amber-500 ${
                                    activeSection === link.href.replace("#", "")
                                        ? "text-amber-500 font-semibold"
                                        : isScrolled
                                        ? "text-slate-600"
                                        : "text-white/90"
                                }`}
                            >
                                {link.name}
                            </a>
                        ))}
                        <Link
                            href="/login"
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                                isScrolled
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-white text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            Connexion
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden ${
                            isScrolled ? "text-slate-900" : "text-white"
                        }`}
                    >
                        {isMobileMenuOpen ? (
                            <X size={28} />
                        ) : (
                            <Menu size={28} />
                        )}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl animate-fade-in-down">
                    <div className="flex flex-col p-4 space-y-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-slate-700 font-medium hover:text-amber-600"
                            >
                                {link.name}
                            </a>
                        ))}
                        <Link
                            href="/login"
                            className="w-full bg-amber-500 text-white text-center py-3 rounded-lg font-bold"
                        >
                            Connexion Membre
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default function Welcome() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");

    const joinRef = useRef(null);

    useEffect(() => {
        clearOldStepData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            const sections = ["home", "services", "contact"];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom > 100) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen overflow-x-hidden">
            <Navbar activeSection={activeSection} isScrolled={isScrolled} />

            <section
                id="home"
                className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}
            >
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
                            alt="Church Background"
                            className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-slate-900/30"></div>
                    </div>

                    <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
                            Votre lieu de <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                                Connexion Spirituelle
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
                            {CHURCH_DATA.tagline}. Rejoignez une communauté
                            dynamique qui change des vies.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => {
                                    const el = document.getElementById("services");
                                    if (el) {
                                        el.scrollIntoView({
                                            behavior: "smooth",
                                            block: "center",
                                        });
                                    }
                                }}
                                className="group relative px-8 py-4 bg-amber-500 text-white rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-2xl shadow-amber-500/30"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Rejoindre la communauté{" "}
                                    <ArrowRight
                                        size={20}
                                        className="group-hover:translate-x-1 transition-transform"
                                    />
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <ArrowRight className="rotate-90 text-white/50 w-8 h-8" />
                    </div>
                </section>

                <section id="services" className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-amber-600 font-bold tracking-wider text-sm uppercase">
                                Nos Services
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-2 mb-6">
                                Comment souhaitez-vous vous inscrire ?
                            </h2>
                            <p className="text-xl text-slate-600">
                                Choisissez le type de profil qui correspond à
                                votre situation pour rejoindre la base de
                                données de l'église.
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="grid md:grid-cols-2 gap-6 justify-center max-w-2xl mx-auto">
                                {CHURCH_DATA.services.map((service) => {
                                    const Icon = service.icon;

                                    // Mapping des services vers les routes
                                    const routeMap = {
                                        family: '/register/famille',

                                        driver: '/register/conducteur',
                                    };

                                    return (
                                        <Link
                                            key={service.id}
                                            href={routeMap[service.id] || '#'}
                                            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl border border-slate-100 hover:border-amber-200 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
                                        >
                                            <div
                                                className={`w-16 h-16 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                                            >
                                                <Icon
                                                    size={32}
                                                    strokeWidth={2}
                                                />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                                {service.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">
                                                {service.description}
                                            </p>
                                            <span className="text-amber-600 font-bold text-sm uppercase tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all">
                                                S'inscrire{" "}
                                                <ArrowRight size={14} />
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="contact" className="py-24 bg-white relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16">
                            <div></div>
                        </div>
                    </div>
                </section>

            <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-4">
                <div
                    id="join"
                    ref={joinRef}
                    className="max-w-4xl mx-auto text-center text-white"
                >
                    <h2 className="text-4xl font-black mb-6">
                        Prêt à nous rejoindre ?
                    </h2>
                    <p className="text-xl text-slate-300 mb-8">
                        Commencez votre voyage spirituel avec nous dès
                        aujourd'hui.
                    </p>
                    <Link
                        href="/register/famille"
                        className="inline-block px-10 py-4 bg-amber-500 rounded-full font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-amber-500/30 text-white"
                    >
                        Devenir Membre
                    </Link>
                </div>
            </section>

            <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400 text-sm">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-2">
                            <span className="inline-flex items-center gap-2 text-white font-bold text-lg">
                                <MapPin size={20} className="text-amber-500" />
                                Abidjan, Cocody, Rue des Jardins, Côte d'Ivoire
                            </span>
                        </div>
                        <p className="text-slate-400">
                            &copy; {new Date().getFullYear()} Église Methodiste
                            du Jubile. Tous droits réservés.
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <a
                            href="https://www.facebook.com/emujubiledecocody"
                            className="hover:text-white transition-colors"
                            aria-label="Facebook"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Facebook
                                size={28}
                                className="text-blue-500 hover:scale-110 transition-transform"
                            />
                        </a>
                        <a
                            href="https://www.instagram.com/emcijubiledecocody/"
                            className="hover:text-white transition-colors"
                            aria-label="Instagram"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Instagram
                                size={28}
                                className="text-pink-500 hover:scale-110 transition-transform"
                            />
                        </a>
                        <a
                            href="https://youtube.com/@eglisemethodistejubiledecocody?si=Y17DEcGhySc1AhYx"
                            className="hover:text-white transition-colors"
                            aria-label="YouTube"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Youtube
                                size={28}
                                className="text-red-500 hover:scale-110 transition-transform"
                            />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
