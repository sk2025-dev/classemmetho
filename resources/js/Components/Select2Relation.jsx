import React from "react";
import Select from "react-select";

/**
 * Select2Relation — Composant React-Select personnalisé pour sélectionner un lien de parenté
 * Avec recherche automatique et sélection unique
 */
const Select2Relation = ({
    id = "relation_select",
    name = "relation",
    value = "",
    onChange,
    placeholder = "Sélectionner un lien de parenté",
    disabled = false,
}) => {
    const formatRelationLabel = (raw) => {
        if (!raw) return "";
        return String(raw)
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    // Options pour les liens de parenté
    const relationOptions = [
        { value: "pere", label: "Père" },
        { value: "mere", label: "Mère" },
        { value: "grandpere", label: "Grand-père" },
        { value: "grandmere", label: "Grand-mère" },
        { value: "fils", label: "Fils" },
        { value: "fille", label: "Fille" },
        { value: "frere", label: "Frère" },
        { value: "soeur", label: "Sœur" },
        { value: "oncle", label: "Oncle" },
        { value: "tante", label: "Tante" },
        { value: "cousin", label: "Cousin" },
        { value: "cousine", label: "Cousine" },
        { value: "epoux", label: "Époux" },
        { value: "epouse", label: "Épouse" },
        { value: "beaupere", label: "Beau-père" },
        { value: "bellemere", label: "Belle-mère" },
        { value: "beaufils", label: "Beau-fils" },
        { value: "beaufille", label: "Belle-fille" },
        { value: "tuteur", label: "Tuteur" },
        { value: "tutrice", label: "Tutrice" },
        { value: "ami", label: "Ami de la famille" },
        { value: "neveu", label: "Neveu" },
        { value: "niece", label: "Niece" },
        { value: "demi_frere", label: "Demi-frere" },
        { value: "demi_soeur", label: "Demi-soeur" },
        { value: "petit_fils", label: "Petit-fils" },
        { value: "petite_fille", label: "Petite-fille" },
        { value: "arriere_grandpere", label: "Arriere-grand-pere" },
        { value: "arriere_grandmere", label: "Arriere-grand-mere" },
        { value: "beau_frere", label: "Beau-frere" },
        { value: "belle_soeur", label: "Belle-soeur" },
        { value: "gendre", label: "Gendre" },
        { value: "bru", label: "Bru" },
        { value: "conjoint", label: "Conjoint(e)" },
        { value: "parrain", label: "Parrain" },
        { value: "marraine", label: "Marraine" },
        { value: "responsable", label: "Responsable" },
        { value: "chef_famille", label: "Chef de famille" },
        { value: "autre", label: "Autre" },
    ];

    // Trouver la valeur sélectionnée
    const customValueOption =
        value && !relationOptions.some((option) => option.value === value)
            ? { value, label: formatRelationLabel(value) }
            : null;

    const mergedOptions = customValueOption
        ? [customValueOption, ...relationOptions]
        : relationOptions;

    const selectedValue = mergedOptions.find((option) => option.value === value) || null;

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
                options={mergedOptions}
                placeholder={placeholder}
                isClearable={true}
                isDisabled={disabled}
                styles={customStyles}
                classNamePrefix="react-select"
                noOptionsMessage={() => "Aucun lien de parenté ne correspond"}
                isSearchable={true}
            />
        </div>
    );
};

export default Select2Relation;
