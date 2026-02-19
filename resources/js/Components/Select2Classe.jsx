import React from "react";
import Select from "react-select";

/**
 * Select2Classe — Composant React-Select personnalisé pour sélectionner une classe
 * Avec recherche automatique et sélection unique
 */
const Select2Classe = ({
    id = "classe_select",
    name = "classe",
    value = null,
    onChange,
    options = [],
    placeholder = "Sélectionner une classe",
    disabled = false,
}) => {
    // Transformer les options pour react-select
    const selectOptions = options.map((option) => ({
        value: option.id,
        label: option.nom,
    }));

    // Trouver la valeur sélectionnée
    const selectedValue = selectOptions.find((option) => option.value === value) || null;

    // Auto-sélection si une seule option et autoSelectIfSingle activé

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
            lineHeight: "48px",
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
                noOptionsMessage={() => "Aucune classe ne correspond"}
                isSearchable={true}
            />
        </div>
    );
};

export default Select2Classe;
