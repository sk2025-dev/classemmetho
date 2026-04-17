import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { withBasePath } from "../Utils/urlHelper";

const AddressAutocomplete = ({
    value,
    onChange,
    onAddressSelect,
    disabled = false,
}) => {
    const inputRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const timeoutRef = useRef(null);

    // Plus besoin de charger Google Maps côté client - utilisation de l'API backend

    // Gérer la saisie avec debounce
    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        onChange(inputValue);
        setSelectedIndex(-1);

        // Annuler la requête précédente
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Lancer la recherche après 300ms d'inactivité
        if (inputValue.length >= 3) {
            setLoading(true);
            timeoutRef.current = setTimeout(() => {
                fetchAddressSuggestions(inputValue);
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Récupérer les suggestions d'adresses via l'API backend
    const fetchAddressSuggestions = async (input) => {
        try {
            const response = await axios.post(
                withBasePath("", "/api/address/autocomplete"),
                {
                    input: input,
                },
            );

            if (response.data.success && response.data.predictions) {
                // Transformer les données pour maintenir la compatibilité
                const formattedSuggestions = response.data.predictions.map(
                    (pred) => ({
                        description: pred.description,
                        place_id: pred.place_id,
                        structured_formatting: {
                            main_text:
                                pred.structured_formatting?.main_text ||
                                pred.description,
                            secondary_text:
                                pred.structured_formatting?.secondary_text ||
                                "",
                        },
                    }),
                );

                setSuggestions(formattedSuggestions);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error(
                "Erreur lors de la récupération des suggestions:",
                error,
            );
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    // Sélectionner une adresse
    const handleSelectSuggestion = async (suggestion) => {
        const { place_id, description } = suggestion;
        onChange(description);
        setShowSuggestions(false);

        // Obtenir les détails du lieu via l'API backend
        try {
            const response = await axios.post(
                withBasePath("", "/api/address/details"),
                {
                    place_id: place_id,
                },
            );

            if (response.data.success) {
                const place = response.data.place;
                const addressDetails = {
                    full_address: description,
                    place_id: place_id,
                    latitude: place.latitude || null,
                    longitude: place.longitude || null,
                    formatted_address: place.formatted_address || description,
                    address_components: place.address_components || [],
                    components: place.components || {},
                };

                onAddressSelect(addressDetails);
            } else {
                onAddressSelect({ full_address: description });
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des détails:", error);
            onAddressSelect({ full_address: description });
        }
    };

    // Gestion au clavier
    const handleKeyDown = (e) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() =>
                    value && suggestions.length > 0 && setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Entrez une adresse en Côte d'Ivoire..."
                disabled={disabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            {loading && (
                <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 text-blue-500">
                        <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 12m0 0l-4 4m4-4l4 4"
                            />
                        </svg>
                    </div>
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.place_id}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`px-4 py-2 cursor-pointer transition-colors ${
                                index === selectedIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <div className="text-sm font-medium">
                                {suggestion.main_text}
                            </div>
                            <div
                                className={`text-xs ${index === selectedIndex ? "text-blue-100" : "text-gray-500"}`}
                            >
                                {suggestion.secondary_text}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSuggestions &&
                suggestions.length === 0 &&
                value.length >= 3 &&
                !loading && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 px-4 py-2 text-center text-gray-500">
                        Aucune adresse trouvée
                    </div>
                )}
        </div>
    );
};

export default AddressAutocomplete;
