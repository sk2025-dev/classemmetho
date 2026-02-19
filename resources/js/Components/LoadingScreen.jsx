import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { LoadingScreenComponent } from '../Utils/loadingScreenTemplate.jsx';

/**
 * Hook pour gérer l'écran de chargement
 */
export const useLoadingScreen = () => {
    const show = useCallback((duration = 2000) => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            loadingScreen.style.opacity = '1';
            loadingScreen.style.pointerEvents = 'auto';

            if (duration > 0) {
                setTimeout(() => hide(), duration);
            }
        }
    }, []);

    const hide = useCallback(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 300);
        }
    }, []);

    return { show, hide };
};

/**
 * Composant principal du loading screen
 */
export default function LoadingScreen({ isVisible = true, duration = 2000 }) {
    const [show, setShow] = useState(isVisible);

    useEffect(() => {
        if (!isVisible) {
            setShow(false);
            return;
        }

        const timer = setTimeout(() => {
            setShow(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [isVisible, duration]);

    if (!show) return null;

    return (
        <div className="loading-screen" id="loadingScreen">
            <LoadingScreenComponent />
        </div>
    );
}

/**
 * Composant de lien pour naviguer avec affichage du loading screen
 */
export function LoadingLink({
    href,
    children,
    className = '',
    loadingDuration = 2000,
    onClick,
    ...props
}) {
    const handleClick = (e) => {
        if (window.showLoadingScreen) {
            window.showLoadingScreen(loadingDuration);
        }

        if (onClick) {
            onClick(e);
        }
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={className}
            {...props}
        >
            {children}
        </Link>
    );
}
