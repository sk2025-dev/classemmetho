import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";

const DEFAULT_PER_PAGE = 10;

/* ─────────────────────────── HELPERS ─────────────────────────── */
function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).catch(() => {});
}

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function Index({
    families = [],
    search: initialSearch = "",
    stats = {},
}) {
    const { flash = {} } = usePage().props;

    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(1);
    const [copied, setCopied] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [generatingId, setGeneratingId] = useState(null);

    /* ── client-side filter (all families already loaded) ── */
    const needle = search.trim().toLowerCase();
    const filtered = useMemo(
        () =>
            families.filter((f) => {
                if (!needle) return true;
                return (
                    (f.nom || "").toLowerCase().includes(needle) ||
                    (f.code_famille || "").toLowerCase().includes(needle) ||
                    (f.responsable || "").toLowerCase().includes(needle) ||
                    (f.classe || "").toLowerCase().includes(needle)
                );
            }),
        [families, needle],
    );

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / DEFAULT_PER_PAGE),
    );
    const paged = filtered.slice(
        (page - 1) * DEFAULT_PER_PAGE,
        page * DEFAULT_PER_PAGE,
    );

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleCopy = (code, id) => {
        copyToClipboard(code);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleGenerateAll = () => {
        setGeneratingAll(true);
        router.post(
            "/admin/families/generate-all",
            {},
            { onFinish: () => setGeneratingAll(false) },
        );
    };

    const handleGenerate = (id) => {
        setGeneratingId(id);
        router.post(
            `/admin/families/${id}/generate`,
            {},
            { onFinish: () => setGeneratingId(null) },
        );
    };

    return (
        <div style={styles.page}>
            <div style={styles.pageBefore} />

            {/* ── HERO ── */}
            <div style={styles.hero}>
                <Link href="/admin/dashboard" style={styles.backBtn}>
                    ← Retour au tableau de bord
                </Link>
                <p style={styles.heroKicker}>Espace Admin</p>
                <h1 style={styles.heroTitle}>Codes familles</h1>
                <p style={styles.heroSubtitle}>
                    Générez et gérez les codes d'identification unique par
                    famille
                </p>
            </div>

            {/* ── KPI CARDS ── */}
            <div style={styles.kpiRow}>
                {[
                    {
                        label: "Total familles",
                        value: stats.total ?? families.length,
                        accent: "#6B46C1",
                    },
                    {
                        label: "Avec code",
                        value:
                            stats.avec_code ??
                            families.filter((f) => f.code_famille).length,
                        accent: "#16A34A",
                    },
                    {
                        label: "Sans code",
                        value:
                            stats.sans_code ??
                            families.filter((f) => !f.code_famille).length,
                        accent: "#DC2626",
                    },
                ].map((k) => (
                    <div
                        key={k.label}
                        style={{
                            ...styles.kpiCard,
                            borderTop: `3px solid ${k.accent}`,
                        }}
                    >
                        <span style={{ ...styles.kpiValue, color: k.accent }}>
                            {k.value}
                        </span>
                        <span style={styles.kpiLabel}>{k.label}</span>
                    </div>
                ))}
            </div>

            {/* ── PANEL ── */}
            <div style={styles.panel}>
                {/* flash message */}
                {flash.success && (
                    <div style={styles.flashSuccess}>{flash.success}</div>
                )}

                {/* toolbar */}
                <div style={styles.toolbar}>
                    <input
                        type="text"
                        placeholder="Rechercher par nom, code, responsable…"
                        value={search}
                        onChange={handleSearch}
                        style={styles.input}
                    />
                    <button
                        onClick={handleGenerateAll}
                        disabled={generatingAll || stats.sans_code === 0}
                        style={
                            generatingAll || stats.sans_code === 0
                                ? styles.btnDisabled
                                : styles.btnPrimary
                        }
                    >
                        {generatingAll
                            ? "Génération…"
                            : `⚡ Générer les codes manquants${stats.sans_code ? ` (${stats.sans_code})` : ""}`}
                    </button>
                </div>

                {/* table */}
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thead}>
                                <th style={styles.th}>Famille</th>
                                <th style={styles.th}>Code</th>
                                <th style={styles.th}>Responsable</th>
                                <th style={styles.th}>Classe</th>
                                <th style={styles.th}>Ville</th>
                                <th style={styles.th}>Membre depuis</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={styles.tdEmpty}>
                                        Aucune famille trouvée.
                                    </td>
                                </tr>
                            ) : (
                                paged.map((f) => (
                                    <tr key={f.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={styles.tdMain}>
                                                {f.nom}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {f.code_famille ? (
                                                <div style={styles.codeCell}>
                                                    <span
                                                        style={styles.codeBadge}
                                                    >
                                                        {f.code_famille}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleCopy(
                                                                f.code_famille,
                                                                f.id,
                                                            )
                                                        }
                                                        style={styles.copyBtn}
                                                        title="Copier le code"
                                                    >
                                                        {copied === f.id
                                                            ? "✓"
                                                            : "⎘"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={styles.noCode}>
                                                    — aucun —
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            {f.responsable || "—"}
                                        </td>
                                        <td style={styles.td}>
                                            {f.classe || "—"}
                                        </td>
                                        <td style={styles.td}>
                                            {f.ville || "—"}
                                        </td>
                                        <td style={styles.td}>
                                            {f.created_at || "—"}
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() =>
                                                    handleGenerate(f.id)
                                                }
                                                disabled={generatingId === f.id}
                                                style={
                                                    generatingId === f.id
                                                        ? styles.btnSmDisabled
                                                        : styles.btnSmSecondary
                                                }
                                                title={
                                                    f.code_famille
                                                        ? "Régénérer le code"
                                                        : "Générer un code"
                                                }
                                            >
                                                {generatingId === f.id
                                                    ? "…"
                                                    : f.code_famille
                                                      ? "↻ Régénérer"
                                                      : "+ Générer"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* pagination */}
                {totalPages > 1 && (
                    <div style={styles.tableFooter}>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={
                                page === 1
                                    ? styles.pagesBtnDisabled
                                    : styles.pageBtnActive
                            }
                        >
                            ← Précédent
                        </button>
                        <span style={styles.pageCounter}>
                            Page {page} / {totalPages} — {filtered.length}{" "}
                            famille(s)
                        </span>
                        <button
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                            style={
                                page === totalPages
                                    ? styles.pagesBtnDisabled
                                    : styles.pageBtnActive
                            }
                        >
                            Suivant →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────── STYLES ─────────────────────────── */
const styles = {
    page: {
        minHeight: "100vh",
        background:
            "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
        position: "relative",
        padding: "0 0 60px",
        fontFamily: "system-ui, sans-serif",
    },
    pageBefore: {
        position: "absolute",
        inset: 0,
        background:
            "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)",
        pointerEvents: "none",
    },
    hero: {
        textAlign: "center",
        padding: "56px 24px 40px",
        position: "relative",
    },
    heroKicker: {
        display: "inline-block",
        background: "rgba(255,255,255,0.18)",
        color: "#fff",
        borderRadius: 999,
        padding: "4px 16px",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 14,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 800,
        color: "#fff",
        margin: "0 0 10px",
        letterSpacing: "-0.5px",
    },
    heroSubtitle: {
        fontSize: 15,
        color: "rgba(255,255,255,0.82)",
        margin: "0 auto",
        maxWidth: 500,
    },
    backBtn: {
        position: "absolute",
        top: 56,
        left: 24,
        display: "inline-block",
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        fontWeight: 500,
        textDecoration: "none",
        cursor: "pointer",
    },
    kpiRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        padding: "0 24px 28px",
        justifyContent: "center",
        position: "relative",
    },
    kpiCard: {
        background: "rgba(255,255,255,0.93)",
        backdropFilter: "blur(14px)",
        borderRadius: 14,
        padding: "22px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 150,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    },
    kpiValue: {
        fontSize: 36,
        fontWeight: 800,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginTop: 4,
    },
    panel: {
        background: "rgba(255,255,255,0.93)",
        backdropFilter: "blur(14px)",
        borderRadius: 18,
        margin: "0 24px",
        padding: "24px 24px 20px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
        position: "relative",
    },
    flashSuccess: {
        background: "rgba(22,163,74,0.1)",
        border: "1px solid rgba(22,163,74,0.3)",
        color: "#15803D",
        borderRadius: 8,
        padding: "10px 16px",
        marginBottom: 16,
        fontSize: 13,
        fontWeight: 500,
    },
    toolbar: {
        display: "flex",
        gap: 10,
        marginBottom: 18,
        flexWrap: "wrap",
        alignItems: "center",
    },
    input: {
        flex: "1 1 260px",
        border: "1.5px solid rgba(107,70,193,0.25)",
        borderRadius: 8,
        padding: "9px 14px",
        fontSize: 13,
        color: "#374151",
        outline: "none",
        background: "#fff",
    },
    btnPrimary: {
        background: "linear-gradient(135deg, #6B46C1, #1E40AF)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    btnDisabled: {
        background: "rgba(107,70,193,0.12)",
        color: "#C4B5FD",
        border: "1px solid rgba(107,70,193,0.15)",
        borderRadius: 8,
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "not-allowed",
        whiteSpace: "nowrap",
    },
    tableWrap: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
    },
    thead: {
        background:
            "linear-gradient(135deg, rgba(107,70,193,0.08), rgba(30,64,175,0.08))",
    },
    th: {
        padding: "10px 14px",
        textAlign: "left",
        fontWeight: 700,
        fontSize: 11,
        color: "#6B46C1",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom: "2px solid rgba(107,70,193,0.15)",
        whiteSpace: "nowrap",
    },
    tr: {
        borderBottom: "1px solid rgba(107,70,193,0.08)",
    },
    td: {
        padding: "10px 14px",
        color: "#374151",
        verticalAlign: "middle",
    },
    tdEmpty: {
        padding: "32px",
        textAlign: "center",
        color: "#9CA3AF",
        fontSize: 14,
    },
    tdMain: {
        fontWeight: 600,
        color: "#1F2937",
    },
    codeCell: {
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    codeBadge: {
        display: "inline-block",
        background: "rgba(107,70,193,0.1)",
        color: "#6B46C1",
        border: "1px solid rgba(107,70,193,0.25)",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "monospace",
        letterSpacing: "0.04em",
    },
    copyBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 16,
        color: "#9CA3AF",
        padding: "0 2px",
        lineHeight: 1,
    },
    noCode: {
        color: "#D1D5DB",
        fontSize: 12,
        fontStyle: "italic",
    },
    btnSmSecondary: {
        background: "rgba(107,70,193,0.08)",
        color: "#6B46C1",
        border: "1px solid rgba(107,70,193,0.2)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    btnSmDisabled: {
        background: "rgba(107,70,193,0.04)",
        color: "#C4B5FD",
        border: "1px solid rgba(107,70,193,0.1)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        cursor: "not-allowed",
        whiteSpace: "nowrap",
    },
    tableFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginTop: 18,
        paddingTop: 14,
        borderTop: "1px solid rgba(107,70,193,0.12)",
    },
    pageBtnActive: {
        background: "linear-gradient(135deg, #6B46C1, #1E40AF)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
    },
    pagesBtnDisabled: {
        background: "rgba(107,70,193,0.07)",
        color: "#C4B5FD",
        border: "1px solid rgba(107,70,193,0.15)",
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
        cursor: "not-allowed",
    },
    pageCounter: {
        fontSize: 13,
        fontWeight: 600,
        color: "#6B46C1",
    },
};
