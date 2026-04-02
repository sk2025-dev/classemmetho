import React from "react";
import Select, { components } from "react-select";
import { Check, ChevronsUpDown, X } from "lucide-react";

const VARIANT_STYLES = {
    default: {
        focusBorder: "#7da8d6",
        focusRing: "0 0 0 3px rgba(125,168,214,0.16)",
        activeBg: "#eff6ff",
        activeText: "#111827",
        selectedIcon: "#5b8fc5",
        text: "#111827",
        hoverBorder: "#93b7dd",
    },
    green: {
        focusBorder: "#059669",
        focusRing: "0 0 0 3px rgba(5,150,105,0.16)",
        activeBg: "#059669",
        activeText: "#111827",
        selectedIcon: "#059669",
        text: "#111827",
        hoverBorder: "#059669",
    },
    orange: {
        focusBorder: "#ea580c",
        focusRing: "0 0 0 3px rgba(234,88,12,0.16)",
        activeBg: "#ea580c",
        activeText: "#111827",
        selectedIcon: "#ea580c",
        text: "#111827",
        hoverBorder: "#ea580c",
    },
};

const DropdownIndicator = (props) => (
    <components.DropdownIndicator {...props}>
        {props.selectProps.menuIsOpen || props.selectProps.isFocused ? (
            <Check className="h-4 w-4" />
        ) : (
            <ChevronsUpDown className="h-4 w-4" />
        )}
    </components.DropdownIndicator>
);

const ClearIndicator = (props) => (
    <components.ClearIndicator {...props}>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-slate-100">
            <X className="h-3.5 w-3.5" />
        </span>
    </components.ClearIndicator>
);

const Option = (props) => {
    const { data, isFocused, isSelected, selectProps } = props;
    const variantStyle =
        VARIANT_STYLES[selectProps.variant] || VARIANT_STYLES.default;

    if (data.__isClearOption) {
        return (
            <components.Option {...props}>
                <div
                    className="border-b border-slate-200/80 px-4 py-2.5 italic"
                    style={{
                        color: isFocused ? "#334155" : "#475569",
                        backgroundColor: isFocused ? "#f8fafc" : "#ffffff",
                        fontSize: "0.8125rem",
                        lineHeight: 1.4,
                    }}
                >
                    Aucune selection
                </div>
            </components.Option>
        );
    }

    return (
        <components.Option {...props}>
            <div className="relative flex min-h-[42px] items-center pl-6 pr-1">
                {isSelected ? (
                    <span
                        className="absolute left-0 inline-flex items-center"
                        style={{
                            color: isFocused
                                ? variantStyle.activeText
                                : variantStyle.selectedIcon,
                        }}
                    >
                        <Check className="h-4 w-4" />
                    </span>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                    <span
                        className="truncate"
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: isSelected ? 600 : 500,
                            lineHeight: 1.4,
                            color: isFocused
                                ? variantStyle.activeText
                                : variantStyle.text,
                        }}
                    >
                        {data.label}
                    </span>
                    {data.description ? (
                        <span
                            className="truncate text-xs"
                            style={{
                                lineHeight: 1.35,
                                color: isFocused
                                    ? "#111827"
                                    : "#475569",
                            }}
                        >
                            {data.description}
                        </span>
                    ) : null}
                </div>
            </div>
        </components.Option>
    );
};

const NoOptionsMessage = (props) => {
    const inputValue = props.selectProps.inputValue?.trim();

    return (
        <components.NoOptionsMessage {...props}>
            <div className="px-2 py-2 text-center">
                <div
                    className="font-medium text-slate-600"
                    style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}
                >
                    {inputValue
                        ? "Aucun resultat trouve"
                        : "Aucune option disponible"}
                </div>
                {inputValue ? (
                    <p className="mt-1 text-xs text-slate-400">
                        Essayez une autre recherche
                    </p>
                ) : null}
            </div>
        </components.NoOptionsMessage>
    );
};

const MenuList = (props) => {
    const count =
        props.selectProps.filteredOptionCount ?? props.children?.length;
    const hasSearch = Boolean(props.selectProps.inputValue?.trim());

    return (
        <components.MenuList {...props}>
            {props.children}
            {typeof count === "number" && count > 0 ? (
                <div className="mt-1 border-t border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-500">
                    <span>
                        {count} option{count > 1 ? "s" : ""}
                    </span>
                    {hasSearch ? (
                        <span className="ml-2">Recherche active</span>
                    ) : null}
                </div>
            ) : null}
        </components.MenuList>
    );
};

const buildStyles = (variant = "default", hasError = false) => {
    const palette = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

    return {
        control: (provided, state) => ({
            ...provided,
            minHeight: "48px",
            borderRadius: "0.5rem",
            borderColor: hasError
                ? "#ef4444"
                : state.isFocused
                  ? palette.focusBorder
                  : "#d1d5db",
            backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
            boxShadow: state.isFocused
                ? hasError
                    ? "0 0 0 3px rgba(239,68,68,0.12)"
                    : palette.focusRing
                : "0 1px 2px rgba(15,23,42,0.03)",
            transition: "all 120ms ease-out",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            paddingLeft: "0.25rem",
            paddingRight: "0.25rem",
            "&:hover": {
                borderColor: hasError ? "#ef4444" : palette.hoverBorder,
                boxShadow: hasError
                    ? "0 1px 2px rgba(239,68,68,0.04)"
                    : "0 4px 12px rgba(148,163,184,0.08)",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: "0 0 0 0.25rem",
            minHeight: "46px",
        }),
        input: (provided) => ({
            ...provided,
            color: palette.text,
            fontSize: "0.8125rem",
            fontWeight: 500,
            margin: 0,
            padding: 0,
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#475569",
            fontSize: "0.8125rem",
            fontWeight: 500,
        }),
        singleValue: (provided) => ({
            ...provided,
            color: palette.text,
            fontSize: "0.8125rem",
            fontWeight: 500,
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            color: state.isFocused ? palette.focusBorder : "#94a3b8",
            padding: "0 0.5rem",
            transform: "none",
            transition: "color 120ms ease-out",
            "&:hover": {
                color: palette.focusBorder,
            },
        }),
        clearIndicator: (provided) => ({
            ...provided,
            color: "#94a3b8",
            padding: "0 0.125rem",
            "&:hover": {
                color: palette.text,
            },
        }),
        menu: (provided) => ({
            ...provided,
            overflow: "hidden",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            boxShadow: "0 14px 30px rgba(15,23,42,0.10)",
            marginTop: "0.5rem",
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        menuList: (provided) => ({
            ...provided,
            padding: "0.25rem 0",
        }),
        option: (provided, state) => ({
            ...provided,
            padding: 0,
            margin: 0,
            backgroundColor: state.data.__isClearOption
                ? state.isFocused
                    ? "#f8fafc"
                    : "#ffffff"
                : state.isFocused
                  ? palette.activeBg
                  : "#ffffff",
            color: state.isFocused ? palette.activeText : palette.text,
            cursor: "pointer",
            transition: "all 100ms ease-out",
        }),
        noOptionsMessage: (provided) => ({
            ...provided,
            padding: 0,
        }),
    };
};

export default function Select2Single({
    id,
    name,
    value = "",
    onChange,
    options = [],
    placeholder = "Selectionner...",
    disabled = false,
    isClearable = true,
    noOptionsMessage = "Aucune option disponible",
    hasError = false,
    variant = "default",
    allowClearOption = true,
}) {
    const menuPortalTarget =
        typeof document !== "undefined" ? document.body : null;

    const normalizedOptions = options.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
    }));

    const selectedValue =
        normalizedOptions.find(
            (option) => String(option.value) === String(value),
        ) || null;

    const displayOptions =
        allowClearOption && selectedValue
            ? [
                  {
                      value: "__clear__",
                      label: "Aucune selection",
                      __isClearOption: true,
                  },
                  ...normalizedOptions,
              ]
            : normalizedOptions;

    const handleChange = (selectedOption) => {
        if (!onChange) return;

        onChange({
            target: {
                name,
                value:
                    !selectedOption || selectedOption.__isClearOption
                        ? ""
                        : selectedOption.value,
            },
        });
    };

    return (
        <div className="w-full">
            <Select
                inputId={id}
                name={name}
                value={selectedValue}
                onChange={handleChange}
                options={displayOptions}
                placeholder={placeholder}
                isDisabled={disabled}
                isClearable={isClearable}
                isSearchable
                styles={buildStyles(variant, hasError)}
                components={{
                    DropdownIndicator,
                    ClearIndicator,
                    Option,
                    NoOptionsMessage,
                    MenuList,
                }}
                classNamePrefix="react-select"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={menuPortalTarget}
                noOptionsMessage={() => noOptionsMessage}
                hasError={hasError}
                variant={variant}
                filteredOptionCount={normalizedOptions.length}
            />
        </div>
    );
}
