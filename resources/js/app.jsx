import "./bootstrap";
import "../css/app.css";

import React from "react";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { migrateCorruptedStorageData } from "./Hooks/migrateStorage";
import { router } from "@inertiajs/react";
import AppLayout from "./Layouts/AppLayout";
import MainLayout from "./Layouts/MainLayout";
import GlobalFormErrorHandler from "./Components/GlobalFormErrorHandler";
import { loadingScreenHTML } from "./Utils/loadingScreenTemplate.jsx";

// Migrer les données localStorage corrompues au démarrage
migrateCorruptedStorageData();

// Exposer la clé API Google Maps globalement
window.GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/**
 * Afficher le loading screen initial au chargement de la page
 * (sauf sur la page de login et après une redirection du welcome loader)
 */
const showInitialLoadingScreen = () => {
    if (document.getElementById("initialLoadingScreen")) {
        return;
    }

    // Ne pas afficher le loader sur la page de login
    const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (normalizedPath.endsWith("/login")) {
        return;
    }

    // Ne pas afficher si on vient du welcome loader
    if (sessionStorage.getItem("comingFromWelcomeLoader")) {
        sessionStorage.removeItem("comingFromWelcomeLoader");
        return;
    }

    const loadingHTML_with_wrapper = `
        <div class="loading-screen active" id="initialLoadingScreen">
            ${loadingScreenHTML}
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", loadingHTML_with_wrapper);
};

// Afficher le loading screen initial
showInitialLoadingScreen();

/**
 * Flag pour tracker si on a déjà caché le loader initial
 */
let initialLoadingHidden = false;

/**
 * Masquer le loading screen initial après le chargement de l'app
 */
const hideInitialLoadingScreen = () => {
    // Ne masquer qu'une fois
    if (initialLoadingHidden) return;

    initialLoadingHidden = true;

    const initialScreen = document.getElementById("initialLoadingScreen");
    if (initialScreen) {
        // Attendre un petit délai pour s'assurer que le contenu est rendu
        setTimeout(() => {
            initialScreen.style.animation = "fadeOut 0.8s ease-out forwards";
            setTimeout(() => {
                initialScreen.remove();
            }, 800);
        }, 100);
    }
};

/**
 * Événements de navigation Inertia
 */

// Garder trace de l'URL courante
let currentPageUrl =
    `${window.location.pathname}${window.location.search}` || "/";
let navigationLoaderHideTimeout = null;

// Initialiser les variables window si elles n'existent pas
if (!window.justLoggedIn) {
    window.justLoggedIn = false;
}
if (!window.welcomeUserName) {
    window.welcomeUserName = null;
}
if (!window.welcomeRedirectUrl) {
    window.welcomeRedirectUrl = "/dashboard";
}
if (!window.isWelcomeLoaderActive) {
    window.isWelcomeLoaderActive = false;
}
if (!window.isGoodbyeLoaderActive) {
    window.isGoodbyeLoaderActive = false;
}

// Fonction pour définir l'état du welcome loader
window.setWelcomeLoaderActive = (active) => {
    window.isWelcomeLoaderActive = active;
};

// Fonction pour définir l'état du goodbye loader
window.setGoodbyeLoaderActive = (active) => {
    window.isGoodbyeLoaderActive = active;
};

const clearNavigationLoaderHideTimeout = () => {
    if (navigationLoaderHideTimeout) {
        clearTimeout(navigationLoaderHideTimeout);
        navigationLoaderHideTimeout = null;
    }
};

const showNavigationLoader = () => {
    clearNavigationLoaderHideTimeout();

    let loader = document.getElementById("navigationLoadingScreen");

    if (!loader) {
        const loadingHTML = `
            <div class="loading-screen active" id="navigationLoadingScreen">
                ${loadingScreenHTML}
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", loadingHTML);
        loader = document.getElementById("navigationLoadingScreen");
    }

    if (loader) {
        loader.classList.remove("is-hiding");
        loader.style.opacity = "1";
        loader.style.visibility = "visible";
        loader.style.pointerEvents = "auto";
    }
};

const hideNavigationLoader = () => {
    clearNavigationLoaderHideTimeout();

    const navScreen = document.getElementById("navigationLoadingScreen");

    if (!navScreen) {
        return;
    }

    navScreen.classList.add("is-hiding");
    navigationLoaderHideTimeout = setTimeout(() => {
        navScreen.remove();
        navigationLoaderHideTimeout = null;
    }, 350);
};

const shouldShowNavigationLoader = (visit) => {
    if (
        !visit ||
        window.isWelcomeLoaderActive ||
        window.isGoodbyeLoaderActive
    ) {
        return false;
    }

    if (visit.prefetch) {
        return false;
    }

    const targetUrl = new URL(visit.url, window.location.origin);
    const normalizedTargetUrl = `${targetUrl.pathname}${targetUrl.search}`;

    return normalizedTargetUrl !== currentPageUrl;
};

const normalizeInertiaUrl = (url) => {
    if (typeof url !== "string") {
        return url;
    }

    const basePath = (window.__APP_BASE_PATH__ || "").replace(/\/+$/, "");
    if (!basePath) {
        return url;
    }

    // Ignore absolute/special schemes and already-prefixed paths.
    if (
        /^(https?:)?\/\//i.test(url) ||
        /^[a-z]+:/i.test(url) ||
        url.startsWith(basePath + "/") ||
        url === basePath
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${basePath}${url}`;
    }

    return url;
};

const originalVisit = router.visit.bind(router);
router.visit = (url, options = {}) => {
    return originalVisit(normalizeInertiaUrl(url), options);
};

router.on("before", (event) => {
    if (shouldShowNavigationLoader(event.detail.visit)) {
        showNavigationLoader();
    }
});

router.on("start", (event) => {
    if (shouldShowNavigationLoader(event.detail.visit)) {
        showNavigationLoader();
    }
});

router.on("navigate", () => {
    currentPageUrl = `${window.location.pathname}${window.location.search}`;
    requestAnimationFrame(() => {
        hideNavigationLoader();
    });
});

router.on("finish", (event) => {
    const visit = event.detail.visit;
    const method = String(visit?.method || "").toLowerCase();
    const isMutationRequest = ["post", "put", "patch", "delete"].includes(
        method,
    );

    if (
        visit.cancelled ||
        visit.interrupted ||
        !visit.completed ||
        isMutationRequest
    ) {
        requestAnimationFrame(() => {
            hideNavigationLoader();
        });
    }

    hideInitialLoadingScreen();

    window.justLoggedIn = false;
    window.isWelcomeLoaderActive = false;
    window.isGoodbyeLoaderActive = false;
});

router.on("error", () => {
    hideNavigationLoader();
});

router.on("invalid", () => {
    hideNavigationLoader();
});

/**
 * Configuration de l'app Inertia
 */
createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
        const requestedPath = `./Pages/${name}.jsx`;
        let page = pages[requestedPath];

        if (!page) {
            const requestedPathLower = requestedPath.toLowerCase();
            const matchedKey = Object.keys(pages).find(
                (key) => key.toLowerCase() === requestedPathLower,
            );

            if (matchedKey) {
                page = pages[matchedKey];
            }
        }

        if (!page) {
            console.error(`Page not found: ./Pages/${name}.jsx`);
            console.log("Available pages:", Object.keys(pages));
        }

        // Appliquer automatiquement MainLayout à TOUTES les pages AUTHENTIFIÉES UNIQUEMENT
        // (sauf les pages d'authentification qui n'ont pas besoin de layout)
        const authRoutes = [
            "Auth/Login",
            "Auth/Register",
            "Auth/ForgotPassword",
            "Auth/ResetPassword",
            "Welcome",
            "login", // Page de login - IMPORTANT: en minuscule
        ];

        // Si la page n'a pas déjà un layout défini et qu'elle n'est pas une page d'authentification
        if (page && !page.default.layout && !authRoutes.includes(name)) {
            page.default.layout = (pageContent) => {
                const content = pageContent.props.auth?.user ? (
                    <MainLayout auth={pageContent.props.auth}>
                        {pageContent}
                    </MainLayout>
                ) : (
                    pageContent
                );

                return (
                    <>
                        <GlobalFormErrorHandler />
                        {content}
                    </>
                );
                // Vérifier que l'utilisateur est authentifié (auth.user existe)
                if (pageContent.props.auth?.user) {
                    return (
                        <MainLayout auth={pageContent.props.auth}>
                            {pageContent}
                        </MainLayout>
                    );
                }
                // Si pas authentifié, retourner la page sans layout
                // (Laravel middleware 'auth' redirigera vers login de toute façon)
                return pageContent;
            };
        }

        return page;
    },
    setup({ el, App, props }) {
        window.__APP_BASE_PATH__ =
            props?.initialPage?.props?.app?.basePath || "";

        createRoot(el).render(
            <AppLayout>
                <App {...props} />
            </AppLayout>,
        );

        // Masquer le loading screen après que React ait rendu le contenu
        // On utilise requestAnimationFrame pour s'assurer que le DOM est mis à jour
        requestAnimationFrame(() => {
            setTimeout(() => {
                hideInitialLoadingScreen();
            }, 200);
        });
    },
    progress: false, // Désactiver la progress bar d'Inertia (on gère le loader manuellement)
});
