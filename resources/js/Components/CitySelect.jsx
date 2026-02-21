import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";

/**
 * CitySelect — Composant React-Select pour sélectionner une ville
 * Avec recherche asynchrone via API
 */
const CitySelect = ({
    value = null,
    onChange,
    placeholder = "Sélectionner une ville",
    disabled = false,
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Charger les villes au montage
    useEffect(() => {
        loadCities("");
    }, []);

    const loadCities = async (searchTerm = "") => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/villes?nom=${encodeURIComponent(searchTerm)}`);
            const cities = response.data || [];
            const formattedOptions = cities.map(city => ({
                value: city.id,
                label: city.nom,
            }));
            setOptions(formattedOptions);
        } catch (error) {
            console.error("Erreur chargement villes:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // Normaliser la valeur pour gérer les types string/number
    const normalizedValue = typeof value === 'string' ? parseInt(value) : value;
    const selectedValue = options.find((option) => option.value === normalizedValue) || null;

    // Styles personnalisés pour ressembler à Select2 avec Tailwind
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            height: "48px",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: state.isFocused
                ? "0 0 0 3px rgba(59,130,246,.15)"
                : "none",
            borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
            "&:hover": {
                borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
            },
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: 0,
            height: "46px",
            display: "flex",
            alignItems: "center",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#111827",
            fontSize: "0.875rem",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "0.875rem",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: "#3b82f6",
            "&:hover": {
                color: "#2563eb",
            },
        }),
        clearIndicator: (provided) => ({
            ...provided,
            color: "#6b7280",
            cursor: "pointer",
            "&:hover": {
                color: "#3b82f6",
            },
        }),
        menu: (provided) => ({
            ...provided,
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,.1)",
            marginTop: "4px",
            overflow: "hidden",
        }),
        menuList: (provided) => ({
            ...provided,
            padding: "4px 0",
        }),
        option: (provided, state) => ({
            ...provided,
            padding: "8px 12px",
            fontSize: "0.875rem",
            color: "#111827",
            backgroundColor: state.isSelected
                ? "#dbeafe"
                : state.isFocused
                ? "#eff6ff"
                : "#fff",
            cursor: "pointer",
            "&:hover": {
                backgroundColor: state.isSelected ? "#dbeafe" : "#f3f4f6",
            },
        }),
        input: (provided) => ({
            ...provided,
            fontSize: "0.875rem",
        }),
        loadingMessage: (provided) => ({
            ...provided,
            color: "#6b7280",
            fontSize: "0.875rem",
        }),
        noOptionsMessage: (provided) => ({
            ...provided,
            color: "#6b7280",
            fontSize: "0.875rem",
        }),
    };

    const handleChange = (selectedOption) => {
        if (onChange) {
            onChange(selectedOption ? selectedOption.value : null);
        }
    };

    const handleInputChange = (newValue) => {
        setInputValue(newValue);
        // Recharger les villes avec le terme de recherche
        if (newValue.length >= 1) {
            loadCities(newValue);
        } else {
            loadCities("");
        }
    };

    return (
        <div className="w-full">
            <Select
                value={selectedValue}
                onChange={handleChange}
                onInputChange={handleInputChange}
                options={options}
                placeholder={placeholder}
                isClearable={true}
                isDisabled={disabled}
                isLoading={loading}
                styles={customStyles}
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucune ville trouvée"}
                loadingMessage={() => "Recherche en cours..."}
                isSearchable={true}
                filterOption={null} // Désactiver le filtrage côté client car on fait côté serveur
            />
        </div>
    );
};

export default CitySelect;
