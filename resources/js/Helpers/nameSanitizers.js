export function sanitizeUppercasePrenom(value = "") {
    return String(value ?? "")
        .normalize("NFC")
        .replace(/[’`´]/g, "'")
        .replace(/[^\p{L}\s'-]/gu, "")
        .replace(/-{2,}/g, "-")
        .replace(/'{2,}/g, "'")
        .toLocaleUpperCase("fr-FR");
}
