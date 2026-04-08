const GENERIC_ERROR_KEYS = new Set([
    "access",
    "answers",
    "error",
    "global",
    "message",
    "survey",
]);

function getFirstErrorMessage(errorValue) {
    if (Array.isArray(errorValue)) {
        return String(errorValue[0] || "").trim();
    }

    return String(errorValue || "").trim();
}

function normalizeFieldCandidates(fieldName) {
    const raw = String(fieldName || "").trim();

    if (!raw) {
        return [];
    }

    const bracketNotation = raw
        .split(".")
        .reduce((result, part, index) => {
            if (index === 0) {
                return part;
            }

            return `${result}[${part}]`;
        }, "");

    return Array.from(
        new Set([
            raw,
            raw.replace(/\./g, "_"),
            raw.replace(/\./g, "-"),
            bracketNotation,
            `form.${raw}`,
        ]),
    );
}

function escapeSelector(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
    }

    return String(value).replace(/([^\w-])/g, "\\$1");
}

function resolveFocusableElement(element) {
    if (!element) {
        return null;
    }

    if (
        element.matches?.(
            'input, textarea, select, button, [tabindex], [role="combobox"]',
        )
    ) {
        return element;
    }

    return (
        element.querySelector?.(
            'input, textarea, select, [role="combobox"], button, [tabindex]',
        ) || null
    );
}

function findFieldContainer(fieldName) {
    const candidates = normalizeFieldCandidates(fieldName);

    for (const candidate of candidates) {
        const selectors = [
            `[name="${candidate}"]`,
            `[data-field-name="${candidate}"]`,
            `#${escapeSelector(candidate)}`,
        ];

        for (const selector of selectors) {
            const directMatch = document.querySelector(selector);

            if (directMatch) {
                return directMatch;
            }
        }
    }

    return null;
}

function highlightFieldTarget(target) {
    if (!target) {
        return;
    }

    const previousOutline = target.style.outline;
    const previousOutlineOffset = target.style.outlineOffset;
    const previousBoxShadow = target.style.boxShadow;
    const previousScrollMarginTop = target.style.scrollMarginTop;

    target.style.outline = "2px solid rgba(239, 68, 68, 0.9)";
    target.style.outlineOffset = "2px";
    target.style.boxShadow = "0 0 0 4px rgba(239, 68, 68, 0.16)";
    target.style.scrollMarginTop = "96px";

    const resetStyles = () => {
        target.style.outline = previousOutline;
        target.style.outlineOffset = previousOutlineOffset;
        target.style.boxShadow = previousBoxShadow;
        target.style.scrollMarginTop = previousScrollMarginTop;
        target.removeEventListener("input", resetStyles);
        target.removeEventListener("change", resetStyles);
        target.removeEventListener("focus", resetStyles);
    };

    target.addEventListener("input", resetStyles, { once: true });
    target.addEventListener("change", resetStyles, { once: true });
    target.addEventListener("focus", resetStyles, { once: true });
}

export function focusFieldByName(fieldName, options = {}) {
    const { delay = 120 } = options;
    const container = findFieldContainer(fieldName);

    if (!container) {
        return null;
    }

    const focusTarget = resolveFocusableElement(container) || container;

    window.setTimeout(() => {
        container.scrollIntoView({ behavior: "smooth", block: "center" });

        if (typeof focusTarget.focus === "function") {
            focusTarget.focus({ preventScroll: true });
        }

        if (typeof focusTarget.select === "function") {
            focusTarget.select();
        }

        highlightFieldTarget(container);
    }, delay);

    return focusTarget;
}

export function focusFirstErrorField(errors, options = {}) {
    const errorEntries = Object.entries(errors || {});

    for (const [fieldName] of errorEntries) {
        if (GENERIC_ERROR_KEYS.has(fieldName)) {
            continue;
        }

        const focusedElement = focusFieldByName(fieldName, options);

        if (focusedElement) {
            return fieldName;
        }
    }

    return null;
}

export function buildValidationToastMessage(errors, maxItems = 3) {
    const messages = Object.values(errors || {})
        .map(getFirstErrorMessage)
        .filter(Boolean);

    if (messages.length === 0) {
        return "Veuillez corriger les champs obligatoires.";
    }

    const preview = messages.slice(0, maxItems);
    const suffix =
        messages.length > maxItems
            ? ` et ${messages.length - maxItems} autre(s) champ(s).`
            : "";

    return `Veuillez corriger les champs en erreur : ${preview.join(" | ")}${suffix}`;
}

export function getErrorSignature(errors) {
    return JSON.stringify(
        Object.entries(errors || {}).map(([fieldName, value]) => [
            fieldName,
            getFirstErrorMessage(value),
        ]),
    );
}

function appendRequiredMarker(labelElement) {
    if (!labelElement || labelElement.dataset.requiredMarked === "true") {
        return;
    }

    if (labelElement.querySelector('[data-required-marker="true"]')) {
        labelElement.dataset.requiredMarked = "true";
        return;
    }

    const marker = document.createElement("span");
    marker.textContent = " *";
    marker.dataset.requiredMarker = "true";
    marker.className = "text-red-500";
    marker.setAttribute("aria-label", "Champ obligatoire");
    marker.setAttribute("title", "Champ obligatoire");
    labelElement.appendChild(marker);
    labelElement.dataset.requiredMarked = "true";
}

function findAssociatedLabels(field) {
    const labels = [];

    if (field.id) {
        document
            .querySelectorAll(`label[for="${escapeSelector(field.id)}"]`)
            .forEach((label) => labels.push(label));
    }

    const parentLabel = field.closest("label");
    if (parentLabel) {
        labels.push(parentLabel);
    }

    const nearestWrapperLabel = field.parentElement?.querySelector?.("label");
    if (nearestWrapperLabel) {
        labels.push(nearestWrapperLabel);
    }

    return Array.from(new Set(labels));
}

export function markRequiredFieldLabels(root = document) {
    if (!root?.querySelectorAll) {
        return;
    }

    const requiredFields = root.querySelectorAll(
        'input[required], textarea[required], select[required], [aria-required="true"]',
    );

    requiredFields.forEach((field) => {
        findAssociatedLabels(field).forEach(appendRequiredMarker);
    });
}
