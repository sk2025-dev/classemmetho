export default function FieldLabel({
    label,
    icon: Icon = null,
    required = false,
    htmlFor,
    className = "",
    iconClassName = "w-4 h-4 text-blue-500",
    requiredClassName = "text-red-500",
}) {
    return (
        <label
            htmlFor={htmlFor}
            className={`flex items-center gap-2 text-sm font-medium text-gray-700 ${className}`.trim()}
        >
            {Icon ? <Icon className={iconClassName} /> : null}
            <span>{label}</span>
            {required ? (
                <span
                    className={requiredClassName}
                    aria-label="Champ obligatoire"
                    title="Champ obligatoire"
                >
                    *
                </span>
            ) : null}
        </label>
    );
}
