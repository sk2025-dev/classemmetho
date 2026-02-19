import React from "react";
import Select from "react-select";

/**
 * Select2Family — Composant React-Select personnalisé pour sélectionner une famille
 * Select simple avec recherche automatique
 */
const Select2Family = ({
    id = "family_select",
    name = "family",
    value = "",
    onChange,
    options = [],
    placeholder = "Sélectionner une famille...",
    disabled = false,
}) => {
    // Transformer les options pour react-select
    const selectOptions = [
        { value: "", label: "Toutes les familles" },
        { value: "no_family", label: "Sans famille" },
        ...options.map((option) => ({
            value: option.familyId,
            label: option.nom,
        }))
    ];

    // Trouver la valeur sélectionnée
    const selectedValue = selectOptions.find((option) => option.value == value);

    // Styles personnalisés pour ressembler à la barre de recherche avec icône
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "48px",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            padding: "0 12px 0 44px", // Espace pour l'icône à gauche
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8fafc", // Même couleur que la barre de recherche
            transition: "border-color 0.2s",
            boxShadow: "none",
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
            minHeight: "46px",
            display: "flex",
            alignItems: "center",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "0.875rem",
            position: "relative",
            zIndex: 1,
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
            position: "relative",
            zIndex: 1,
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#111827",
            fontSize: "0.875rem",
        }),
    };

    const handleChange = (selectedOption) => {
        if (onChange) {
            onChange({
                target: {
                    name: name,
                    value: selectedOption ? selectedOption.value : "",
                },
            });
        }
    };

    return (
        <div className="w-full">
            <Select
                id={id}
                name={name}
                value={selectedValue}
                onChange={handleChange}
                options={selectOptions}
                placeholder={placeholder}
                isClearable={true}
                isDisabled={disabled}
                styles={customStyles}
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucune famille ne correspond"}
                isSearchable={true}
            />
        </div>
    );
};

export default Select2Family;
