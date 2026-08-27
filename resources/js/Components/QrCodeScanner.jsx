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
                    if (!cancelled) onScan(decodedText);
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
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .then(() => scannerRef.current.clear())
                    .catch(() => {});
            }
        };
    }, [active, containerId, onScan]);

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
