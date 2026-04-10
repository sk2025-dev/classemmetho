import FieldLabel from "./FieldLabel";

export default function FormField({
    label,
    children,
    icon: Icon = null,
    required = false,
    hint = null,
    htmlFor,
    className = "space-y-2",
    labelClassName = "",
}) {
    return (
        <div className={className}>
            <FieldLabel
                label={label}
                icon={Icon}
                required={required}
                htmlFor={htmlFor}
                className={labelClassName}
            />
            {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
            {children}
        </div>
    );
}
