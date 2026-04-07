export function resolveBasePath(basePath = "") {
    if (basePath && basePath !== "/") {
        return basePath.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined" && window.__APP_BASE_PATH__) {
        return String(window.__APP_BASE_PATH__).replace(/\/+$/, "");
    }

    const viteBase = import.meta.env.BASE_URL || "";
    if (!viteBase || viteBase === "/") {
        return "";
    }

    return String(viteBase).replace(/\/+$/, "");
}

export function withBasePath(basePath = "", path = "") {
    const cleanBase = resolveBasePath(basePath);

    if (!path || path === "/") {
        return cleanBase || "/";
    }

    const cleanPath = `/${String(path).replace(/^\/+/, "")}`;
    return `${cleanBase}${cleanPath}`;
}
