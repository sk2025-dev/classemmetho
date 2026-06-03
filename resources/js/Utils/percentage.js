export function truncateDecimal(value, decimals = 2) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return 0;
    }

    const factor = 10 ** decimals;

    return Math.floor(numericValue * factor + 1e-9) / factor;
}

export function formatFixedTruncated(value, decimals = 2) {
    return truncateDecimal(value, decimals).toFixed(decimals);
}

export function formatPercentage(value, decimals = 2) {
    return `${formatFixedTruncated(value, decimals)}%`;
}
