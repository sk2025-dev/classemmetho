import React from "react";
import Select from "react-select";

/**
 * Select2Fonction — Composant React-Select personnalisé pour sélectionner des fonctions d'église
 * Multiselect avec recherche automatique
 */
const Select2Fonction = ({
    id = "fonction_select",
    name = "fonction",
    value = [],
    onChange,
    options = [],
    placeholder = "Sélectionner des fonctions...",
    disabled = false,
}) => {
    const normalizedFieldKey = String(name || id || "")
        .trim()
        .replace(/\s+/g, "_");

    // Transformer les options pour react-select
    const selectOptions = options.map((option) => ({
        value: option.id,
        label: option.nom,
    }));

    // Trouver les valeurs sélectionnées
    const selectedValues = selectOptions.filter((option) =>
        Array.isArray(value) &&
        value.some((v) => String(v) === String(option.value))
    );

    // Styles personnalisés pour ressembler à Select2 avec Tailwind
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "48px",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
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
            flexWrap: "wrap",
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: "#dbeafe",
            borderRadius: "0.375rem",
            margin: "4px 4px",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "#1e40af",
            fontSize: "0.75rem",
            fontWeight: "500",
            padding: "0px 4px",
        }),
        multiValueRemove: (provided, state) => ({
            ...provided,
            color: "#3b82f6",
            backgroundColor: state.isFocused ? "#bfdbfe" : "transparent",
            borderRadius: "2px",
            padding: "0px 2px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: "1",
            "&:hover": {
                backgroundColor: "#bfdbfe",
                color: "#1d4ed8",
            },
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

    const handleChange = (selectedOptions) => {
        if (onChange) {
            const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
            onChange({
                target: {
                    name: name,
                    value: values,
                },
            });
        }
    };

    return (
        <div
            className="w-full"
            data-field-name={name || normalizedFieldKey}
            data-error-target="true"
            id={!id && normalizedFieldKey ? normalizedFieldKey : undefined}
        >
            <Select
                id={id || normalizedFieldKey}
                inputId={id || normalizedFieldKey}
                name={name}
                value={selectedValues}
                onChange={handleChange}
                options={selectOptions}
                placeholder={placeholder}
                isMulti={true}
                isClearable={true}
                isDisabled={disabled}
                styles={customStyles}
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucune fonction ne correspond"}
                isSearchable={true}
            />
        </div>
    );
};

export default Select2Fonction;
