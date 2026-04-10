function normalizeBasePath(value = "") {
    if (!value || value === "/") {
        return "";
    }

    return String(value).replace(/\/+$/, "");
}

function detectBasePathFromAssetUrls() {
    if (typeof document === "undefined") {
        return "";
    }

    const assetElement =
        document.querySelector('script[src*="/build/assets/"]') ||
        document.querySelector('link[href*="/build/assets/"]');

    const assetUrl =
        assetElement?.getAttribute("src") || assetElement?.getAttribute("href") || "";

    if (!assetUrl) {
        return "";
    }

    try {
        const pathname = new URL(assetUrl, window.location.origin).pathname;
        const buildIndex = pathname.indexOf("/build/");

        if (buildIndex === -1) {
            return "";
        }

        return normalizeBasePath(pathname.slice(0, buildIndex));
    } catch {
        return "";
    }
}

export function resolveBasePath(basePath = "") {
    const explicitBasePath = normalizeBasePath(basePath);
    if (explicitBasePath) {
        return explicitBasePath;
    }

    if (typeof window !== "undefined") {
        const windowBasePath = normalizeBasePath(window.__APP_BASE_PATH__ || "");
        if (windowBasePath) {
            return windowBasePath;
        }

        const detectedBasePath = detectBasePathFromAssetUrls();
        if (detectedBasePath) {
            window.__APP_BASE_PATH__ = detectedBasePath;
            return detectedBasePath;
        }
    }

    return "";
}

export function withBasePath(basePath = "", path = "") {
    const cleanBase = resolveBasePath(basePath);

    if (!path || path === "/") {
        return cleanBase || "/";
    }

    const cleanPath = `/${String(path).replace(/^\/+/, "")}`;
    return `${cleanBase}${cleanPath}`;
}
