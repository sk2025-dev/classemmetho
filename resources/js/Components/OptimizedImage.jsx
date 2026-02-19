import React, { useState } from 'react';

/**
 * Composant image optimisé avec lazy loading et fallback
 */
export default function OptimizedImage({
    src,
    alt = 'Image',
    className = '',
    width = 'auto',
    height = 'auto',
    placeholder = '/images/placeholder.png'
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    return (
        <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
            {/* Image placeholder pendant le chargement */}
            {!isLoaded && !hasError && (
                <img
                    src={placeholder}
                    alt="placeholder"
                    className="w-full h-full object-cover blur-sm"
                    style={{ width, height }}
                />
            )}

            {/* Image réelle */}
            <img
                src={hasError ? placeholder : src}
                alt={alt}
                className={`transition-opacity duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                style={{ width, height }}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />

            {/* Spinner de chargement */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}
        </div>
    );
}
