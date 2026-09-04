import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Lecteur de QR code via la caméra du navigateur.
 * @param {(decodedText: string) => void} props.onScan - appelé à chaque QR décodé
 * @param {boolean} props.active - démarre/arrête la caméra
 */
export default function QrCodeScanner({ onScan, active = true }) {
    const containerId = useRef(
        `qr-scanner-${Math.random().toString(36).slice(2)}`,
    ).current;
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    // La dernière callback est lue via une ref plutôt que mise en dépendance
    // de l'effet : si le composant parent passe une nouvelle fonction à
    // chaque rendu (cas fréquent, ex. un handler défini inline), l'effet ne
    // doit pas redémarrer la caméra pour autant — la relancer en pleine
    // lecture est ce qui provoquait un plantage (page vierge).
    const onScanRef = useRef(onScan);
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!active) return;

        let cancelled = false;
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 240 },
                (decodedText) => {
                    if (!cancelled) onScanRef.current?.(decodedText);
                },
                () => {
                    // erreurs de décodage image par image, ignorées volontairement
                },
            )
            .catch(() => {
                if (!cancelled) {
                    setError(
                        "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.",
                    );
                }
            });

        return () => {
            cancelled = true;
            const scannerToStop = scannerRef.current;
            scannerRef.current = null;
            if (scannerToStop) {
                scannerToStop
                    .stop()
                    .then(() => scannerToStop.clear())
                    .catch(() => {});
            }
        };
    }, [active, containerId]);

    if (error) {
        return (
            <div className="text-center py-8 text-sm text-red-500 font-medium">
                {error}
            </div>
        );
    }

    return (
        <div
            id={containerId}
            className="w-full max-w-xs mx-auto rounded-xl overflow-hidden"
        />
    );
}
