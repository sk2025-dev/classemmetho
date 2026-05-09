import React, { useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import GoodbyeLoader from "../Components/GoodbyeLoader";
import ProfilePhoto from "@/Components/ProfilePhoto";
import VerticalTicker from "@/Components/VerticalTicker";
import useToast from "../Hooks/useToast";
import ToastContainer from "../Components/ToastContainer";
import { withBasePath } from "../Utils/urlHelper";

// Header professionnel et minimaliste
function AppHeader({ auth, onLogout, basePath }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const withBase = (path) => withBasePath(basePath, path);

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
                                src={withBase("/images/image.png")}
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
                                    <ProfilePhoto
                                        user={auth?.user}
                                        size="lg"
                                        className="w-full h-full"
                                    />
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
                                                <ProfilePhoto
                                                    user={auth?.user}
                                                    size="2xl"
                                                    className="w-full h-full"
                                                />
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
                                                {auth?.user?.code_membre && (
                                                    <p className="text-xs text-gray-700 font-semibold mt-1">
                                                        Code membre:{" "}
                                                        {auth?.user?.code_membre}
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
                                            href={withBase("/profile")}
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
    const [showInfoMenu, setShowInfoMenu] = useState(false);
    const { flashAnnouncements = [], flash = {}, app } = usePage().props;
    const basePath = app?.basePath || "";
    const { toasts, removeToast, success, error } = useToast();
    const lastSuccessRef = useRef(null);
    const lastErrorRef = useRef(null);
    const infoMenuRef = useRef(null);

    useEffect(() => {
        if (flash?.success && flash.success !== lastSuccessRef.current) {
            lastSuccessRef.current = flash.success;
            success(flash.success);
        }
    }, [flash?.success, success]);

    useEffect(() => {
        if (flash?.error && flash.error !== lastErrorRef.current) {
            lastErrorRef.current = flash.error;
            error(flash.error);
        }
    }, [flash?.error, error]);

    useEffect(() => {
        if (!showInfoMenu) return;
        const handleClickOutside = (e) => {
            if (infoMenuRef.current && !infoMenuRef.current.contains(e.target)) {
                setShowInfoMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showInfoMenu]);

    const announcements = Array.isArray(flashAnnouncements)
        ? flashAnnouncements
        : [];

    const TRUNCATE_DEFAULT = 120;

    const getAnnonceTitle = (annonce) => {
        const details = annonce?.details;
        if (typeof details === "string") {
            return details;
        }
        return (
            details?.titre || details?.contenu || details?.message || "Demande de prière"
        );
    };

    const getAnnonceContent = (annonce) => {
        const details = annonce?.details;
        if (typeof details === "string") {
            return details;
        }
        return details?.contenu || details?.message || "";
    };

    const getConcernedPerson = (annonce) => {
        const details = annonce?.details;
        const fromDetails =
            details?.nom_concerne ||
            details?.nom_defunt ||
            details?.personne_concernee ||
            "";
        if (fromDetails && String(fromDetails).trim()) {
            return String(fromDetails).trim();
        }

        const membreName = [annonce?.membre?.prenom, annonce?.membre?.nom]
            .filter(Boolean)
            .join(" ")
            .trim();
        return membreName;
    };

    const buildFlashSentence = (annonce) => {
        const familyName = annonce?.family?.nom?.trim();
        const isAdminInfo = !annonce?.family && !annonce?.family_id;
        const source = isAdminInfo
            ? "L'Église du Jubilé"
            : familyName
            ? `Famille ${familyName.toUpperCase()}`
            : "Une famille de la paroisse";
        const type = String(annonce?.type_acte || "").toLowerCase();
        const title = getAnnonceTitle(annonce);
        const content = getAnnonceContent(annonce);
        const person = getConcernedPerson(annonce);
        const normalizedTitle = String(title || "").trim();
        const normalizedContent = String(content || "").trim();
        const isGenericTitle =
            normalizedTitle === "" ||
            /^annonce$/i.test(normalizedTitle) ||
            /^annonce\s+generale$/i.test(normalizedTitle);
        const isGenericContent =
            normalizedContent === "" ||
            /^annonce$/i.test(normalizedContent) ||
            /^annonce\s+generale$/i.test(normalizedContent);

        const motif = !isGenericContent
            ? normalizedContent
            : !isGenericTitle
              ? normalizedTitle
              : "";

        if (type === "deces" || type === "funerailles") {
            if (person) {
                return `${source} annonce le deces de ${person}.`;
            }
            return `${source} annonce le deces d'un membre de famille.`;
        }

        if (type === "grace" || type === "remerciement") {
            if (motif) {
                return `${source} demande une action de grace pour ${motif}.`;
            }
            return `${source} demande une action de grace.`;
        }

        if (type === "mariage") {
            if (person) {
                return `${source} annonce un mariage pour ${person}.`;
            }
            return `${source} annonce un mariage.`;
        }

        if (type === "priere") {
            if (motif) {
                return `${source} demande une priere pour ${motif}.`;
            }
            return `${source} demande une priere communautaire.`;
        }

        if (type === "naissance") {
            if (person) {
                return `${source} annonce une naissance: ${person}.`;
            }
            return `${source} annonce une naissance dans sa famille.`;
        }

        if (isAdminInfo) {
            if (normalizedTitle && normalizedContent) {
                return `${normalizedTitle} — ${normalizedContent}`;
            }
            return normalizedTitle || normalizedContent || "Information de l'Église du Jubilé.";
        }

        if (motif) {
            return `${source} annonce: ${motif}`;
        }
        return `${source} a soumis une demande de prière.`;
    };

    const truncateText = (text, limit = TRUNCATE_DEFAULT) => {
        const raw = String(text ?? "");
        if (raw.length <= limit) {
            return raw;
        }
        const cut = raw.slice(0, limit).trim();
        const trimmed =
            cut.endsWith(",") || cut.endsWith(";")
                ? cut.slice(0, -1).trim()
                : cut;
        return `${trimmed}…`;
    };

    const composeTickerMessage = (annonce) => {
        const sentence = buildFlashSentence(annonce);
        if (!sentence) return null;
        return {
            id: annonce.id,
            text: truncateText(sentence),
            fullText: sentence,
        };
    };

    const tickerMessages = announcements
        .map(composeTickerMessage)
        .filter((message) => message && message.text);

    // Infos eglise fictives demandees pour enrichir le flash info dashboard.
    const churchInfoMessages = [
        {
            id: "church-1",
            text: "Information paroissiale: Horaires de culte ce dimanche - 07h30, 09h30 et 11h30.",
        },
        {
            id: "church-2",
            text: "Information paroissiale: Ce dimanche, 3 cultes sont programmes au Temple du Jubile de Cocody.",
        },
        {
            id: "church-3",
            text: "Information paroissiale: Programme de prieres - Mardi 18h30 (intercession), Jeudi 18h30 (delivrance), Vendredi 20h00 (veillee).",
        },
    ];

    const mergedTickerMessages = [...churchInfoMessages, ...tickerMessages];

    const isAdminAnnonce = (a) => !a?.family && !a?.family_id;

    const categorizedInfo = {
        infosEglise: announcements.filter(isAdminAnnonce),
        annonces: announcements.filter(
            (a) =>
                !isAdminAnnonce(a) &&
                ["annonce", "annonce_liturgique", "grace", "generale"].includes(
                    String(a?.type_acte || "").toLowerCase(),
                ),
        ),
        mariage: announcements.filter(
            (a) => !isAdminAnnonce(a) && String(a?.type_acte || "").toLowerCase() === "mariage",
        ),
        deces: announcements.filter(
            (a) => !isAdminAnnonce(a) && String(a?.type_acte || "").toLowerCase() === "deces",
        ),
        prieres: announcements.filter(
            (a) => !isAdminAnnonce(a) && String(a?.type_acte || "").toLowerCase() === "priere",
        ),
        infos: churchInfoMessages,
    };

    const totalAnnouncementsCount =
        categorizedInfo.infosEglise.length +
        categorizedInfo.annonces.length +
        categorizedInfo.mariage.length +
        categorizedInfo.deces.length +
        categorizedInfo.prieres.length;

    const hasExtraInfo =
        categorizedInfo.infosEglise.length > 0 ||
        categorizedInfo.annonces.length > 0 ||
        categorizedInfo.mariage.length > 0 ||
        categorizedInfo.deces.length > 0 ||
        categorizedInfo.prieres.length > 0 ||
        categorizedInfo.infos.length > 0;

    const handleLogout = () => {
        // Afficher le loader d'au revoir
        setShowGoodbyeLoader(true);
    };

    const handleGoodbyeAnimationComplete = () => {
        // Effectuer la déconnexion après l'animation
        router.post(withBasePath(basePath, "/logout"));
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
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <AppHeader
                auth={auth}
                onLogout={handleLogout}
                basePath={basePath}
            />

            {mergedTickerMessages.length > 0 && (
                <section className="w-full sticky top-16 z-40 relative">
                    <VerticalTicker
                        messages={mergedTickerMessages}
                        interval={4000}
                        label="Flash Infos"
                    />

                    {hasExtraInfo && (
                        <div className="absolute right-3 top-1.5" ref={infoMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowInfoMenu((v) => !v)}
                                className="relative flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/95 text-slate-800 text-xs font-semibold shadow border border-slate-200 hover:bg-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-blue-600">
                                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                                </svg>
                                Voir plus d'info
                                {totalAnnouncementsCount > 0 && (
                                    <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                        {totalAnnouncementsCount > 9 ? "9+" : totalAnnouncementsCount}
                                    </span>
                                )}
                            </button>

                            {showInfoMenu && (
                                <div className="absolute right-0 mt-2 w-[360px] max-w-[94vw] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700">
                                        <div className="flex items-center gap-2 text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"/>
                                            </svg>
                                            <span className="text-sm font-bold">Informations paroissiales</span>
                                        </div>
                                        <button
                                            onClick={() => setShowInfoMenu(false)}
                                            className="text-white/70 hover:text-white transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path d="M18 6L6 18M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                                        <InfoCategory
                                            title="🏛️ Infos de l'Église"
                                            items={categorizedInfo.infosEglise.map((a) =>
                                                truncateText(buildFlashSentence(a))
                                            )}
                                            accent="blue"
                                        />
                                        <InfoCategory
                                            title="🙏 Demandes de prière"
                                            items={categorizedInfo.annonces.map((a) =>
                                                truncateText(buildFlashSentence(a))
                                            )}
                                            accent="purple"
                                        />
                                        <InfoCategory
                                            title="💍 Mariages programmés"
                                            items={categorizedInfo.mariage.map((a) =>
                                                truncateText(buildFlashSentence(a))
                                            )}
                                            accent="pink"
                                        />
                                        <InfoCategory
                                            title="🕯️ Avis de décès"
                                            items={categorizedInfo.deces.map((a) =>
                                                truncateText(buildFlashSentence(a))
                                            )}
                                            accent="gray"
                                        />
                                        <InfoCategory
                                            title="🙏 Sujets de prière"
                                            items={categorizedInfo.prieres.map((a) =>
                                                truncateText(buildFlashSentence(a))
                                            )}
                                            accent="indigo"
                                        />
                                        <InfoCategory
                                            title="⏰ Horaires des cultes"
                                            items={categorizedInfo.infos.map((i) => i.text)}
                                            accent="green"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

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

function InfoCategory({ title, items = [], accent = "blue" }) {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const borderColors = {
        blue: "border-blue-200 bg-blue-50",
        purple: "border-purple-200 bg-purple-50",
        pink: "border-pink-200 bg-pink-50",
        gray: "border-gray-200 bg-gray-50",
        indigo: "border-indigo-200 bg-indigo-50",
        green: "border-green-200 bg-green-50",
    };
    const textColors = {
        blue: "text-blue-700",
        purple: "text-purple-700",
        pink: "text-pink-700",
        gray: "text-gray-700",
        indigo: "text-indigo-700",
        green: "text-green-700",
    };
    const dotColors = {
        blue: "bg-blue-400",
        purple: "bg-purple-400",
        pink: "bg-pink-400",
        gray: "bg-gray-400",
        indigo: "bg-indigo-400",
        green: "bg-green-400",
    };

    const borderClass = borderColors[accent] || borderColors.blue;
    const textClass = textColors[accent] || textColors.blue;
    const dotClass = dotColors[accent] || dotColors.blue;

    return (
        <div className={`rounded-lg border ${borderClass} p-2.5`}>
            <div className={`text-[11px] font-bold mb-1.5 ${textClass}`}>
                {title}
            </div>
            <ul className="space-y-1.5">
                {items.slice(0, 5).map((item, idx) => (
                    <li key={`${title}-${idx}`} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                        <span className="text-[11px] text-slate-700 leading-snug">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
