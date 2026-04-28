import React, { useState, useMemo, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Plus,
    User,
    UsersRound,
    Inbox,
    Search,
    X,
    Info,
    MapPin,
    Layers,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import { withBasePath } from "../../Utils/urlHelper";

const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
  * { font-family: 'DM Sans', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(249,115,22,0); }
  }

  .card-enter  { animation: fadeUp 0.4s ease both; }
  .modal-enter { animation: scaleIn 0.25s ease both; }
  .toast-enter { animation: toastIn 0.3s ease both; }

  /* ── Transfer Card — premium ── */
  .transfer-card {
    background: #fff;
    border: 1px solid #e8edf3;
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
  }
  .transfer-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 60px rgba(15,23,42,0.13), 0 8px 20px rgba(15,23,42,0.07);
    border-color: #d0d9e6;
  }
  .transfer-card:hover .card-action-hint { opacity: 1; transform: translateX(0); }
  .card-action-hint { opacity: 0; transform: translateX(-4px); transition: opacity 0.2s ease, transform 0.2s ease; }

  /* ── Stat Card (blanc) ── */
  .stat-card {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .stat-card:hover {
    background: #fff;
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(0,0,0,0.14);
  }

  /* ── Status Pill ── */
  .status-pill {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.02em; text-transform: uppercase;
  }

  /* ── Filter Bar ── */
  .filter-bar {
    background: rgba(255,255,255,0.97);
    border: 1.5px solid rgba(255,255,255,0.9);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }
  .input-field {
    background: #fff; border: 1.5px solid #ddd;
    border-radius: 10px; color: #111;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field::placeholder { color: #aaa; }
  .input-field:focus { outline: none; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.13); }
  select.input-field:focus { outline: none; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.13); }

  /* ── Modal ── */
  .modal-backdrop { background: rgba(10,10,20,0.6); backdrop-filter: blur(6px); }
  .modal-box { background: #fff; border-radius: 20px; box-shadow: 0 32px 80px rgba(0,0,0,0.25); overflow: hidden; }

  .step-option { border: 1.5px solid #e5e5e5; border-radius: 12px; transition: all 0.18s ease; cursor: pointer; }
  .step-option:hover  { border-color: #f97316; background: #fff7f0; }
  .step-option.selected { border-color: #f97316; background: #fff7f0; color: #ea580c; }

  .btn-primary { background: #f97316; color: #fff; font-weight: 600; border-radius: 10px; transition: background 0.15s, transform 0.15s, box-shadow 0.15s; box-shadow: 0 2px 8px rgba(249,115,22,0.3); }
  .btn-primary:hover { background: #ea580c; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(249,115,22,0.4); }

  .btn-confirm { background: #16a34a; color: #fff; font-weight: 600; border-radius: 10px; transition: background 0.15s, transform 0.15s; box-shadow: 0 2px 8px rgba(22,163,74,0.3); }
  .btn-confirm:hover { background: #15803d; transform: translateY(-1px); }
  .btn-confirm:disabled { opacity: 0.55; transform: none; }

  /* ── Timeline dots ── */
  .tl-done    { background: #22c55e; border-color: #22c55e; }
  .tl-active  { background: #f97316; border-color: #f97316; animation: pulse 2s infinite; }
  .tl-refused { background: #ef4444; border-color: #ef4444; }
  .tl-idle    { background: #fff;    border-color: #d1d5db; }

  .empty-state {
    background: rgba(255,255,255,0.94); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.5); border-radius: 18px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
  }
`;

// ─────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const configs = {
        SOUMISE: {
            label: "Soumise",
            bg: "#EFF6FF",
            color: "#1D4ED8",
            dot: "#3B82F6",
        },
        EN_ATTENTE_SOURCE: {
            label: "Attente Source",
            bg: "#FFFBEB",
            color: "#92400E",
            dot: "#F59E0B",
        },
        VALIDEE_SOURCE: {
            label: "Validée Source",
            bg: "#F0F4FF",
            color: "#3730A3",
            dot: "#6366F1",
        },
        EN_ATTENTE_ACCUEIL: {
            label: "Attente Accueil",
            bg: "#ECFEFF",
            color: "#155E75",
            dot: "#06B6D4",
        },
        VALIDEE_ACCUEIL: {
            label: "Terminé",
            bg: "#F0FDF4",
            color: "#14532D",
            dot: "#22C55E",
        },
        TERMINEE: {
            label: "Terminé",
            bg: "#F0FDF4",
            color: "#14532D",
            dot: "#22C55E",
        },
        REFUSEE: {
            label: "Refusé",
            bg: "#FFF1F2",
            color: "#9F1239",
            dot: "#F43F5E",
        },
    };
    const c = configs[status] || {
        label: status,
        bg: "#F9FAFB",
        color: "#374151",
        dot: "#9CA3AF",
    };
    return (
        <span
            className="status-pill"
            style={{ background: c.bg, color: c.color }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.dot,
                    display: "inline-block",
                    marginRight: 6,
                    flexShrink: 0,
                }}
            />
            {c.label}
        </span>
    );
};

// ─────────────────────────────────────────
// STEP PROGRESS BAR — 3 étapes
// ─────────────────────────────────────────
const StepProgressBar = ({ status }) => {
    const isRefused = status === "REFUSEE";
    const steps = [
        { label: "Soumis", doneFrom: 0 },
        { label: "Validation Source", doneFrom: 2 },
        { label: "Validation Accueil", doneFrom: 4 },
    ];
    const order = [
        "SOUMISE",
        "EN_ATTENTE_SOURCE",
        "VALIDEE_SOURCE",
        "EN_ATTENTE_ACCUEIL",
        "VALIDEE_ACCUEIL",
        "TERMINEE",
    ];
    const currentIdx = order.indexOf(status);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0,
                padding: "2px 0 0",
            }}
        >
            {steps.map((step, i) => {
                const done = !isRefused && currentIdx >= step.doneFrom;
                const active =
                    !isRefused && !done && currentIdx >= step.doneFrom - 1;
                const isLast = i === steps.length - 1;
                const dotColor = isRefused
                    ? "#ef4444"
                    : done
                      ? "#22c55e"
                      : active
                        ? "#f97316"
                        : "#d1d5db";
                const labelColor = done
                    ? "#15803d"
                    : active
                      ? "#ea580c"
                      : "#9ca3af";
                const lineColor = isRefused
                    ? "#fca5a5"
                    : done && !isLast
                      ? "#22c55e"
                      : "#e5e7eb";

                return (
                    <React.Fragment key={step.label}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 5,
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: 18,
                                    height: 18,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {(done || active) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            background: done
                                                ? "rgba(34,197,94,0.12)"
                                                : "rgba(249,115,22,0.12)",
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        position: "relative",
                                        zIndex: 1,
                                        background: dotColor,
                                        boxShadow: done
                                            ? "0 0 0 2px rgba(34,197,94,0.3)"
                                            : active
                                              ? "0 0 0 2px rgba(249,115,22,0.3)"
                                              : "none",
                                    }}
                                >
                                    {done && (
                                        <svg
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%,-50%)",
                                            }}
                                            width="7"
                                            height="7"
                                            viewBox="0 0 8 8"
                                            fill="none"
                                        >
                                            <path
                                                d="M1.5 4l2 2 3-3"
                                                stroke="#fff"
                                                strokeWidth="1.4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: labelColor,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                style={{
                                    flex: 1,
                                    height: 1.5,
                                    background: lineColor,
                                    marginTop: 8,
                                    marginBottom: 18,
                                    marginLeft: 4,
                                    marginRight: 4,
                                    borderRadius: 2,
                                    transition: "background 0.4s ease",
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────
// TRANSFER CARD — premium éditorial
// ─────────────────────────────────────────
const TransferCard = ({ t, onClick, delay = 0 }) => {
    const isRefused = t.status === "REFUSEE";
    const isDone = ["TERMINEE", "VALIDEE_ACCUEIL"].includes(t.status);
    const isFamily = !t.member && !!t.family;

    const palette = isRefused
        ? {
              accent: "#ef4444",
              accentLight: "#fff1f2",
              accentMid: "#fca5a5",
              accentText: "#991b1b",
              gradFrom: "#fef2f2",
              gradTo: "#fff",
          }
        : isDone
          ? {
                accent: "#22c55e",
                accentLight: "#f0fdf4",
                accentMid: "#86efac",
                accentText: "#14532d",
                gradFrom: "#f0fdf4",
                gradTo: "#fff",
            }
          : {
                accent: "#f97316",
                accentLight: "#fff7ed",
                accentMid: "#fed7aa",
                accentText: "#9a3412",
                gradFrom: "#fff7ed",
                gradTo: "#fff",
            };

    const name = t.member?.name || t.family?.name || "—";
    const initial = isFamily ? null : name.charAt(0).toUpperCase();

    return (
        <div
            className="transfer-card card-enter cursor-pointer overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            {/* ── Header dégradé coloré ── */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${palette.gradFrom} 0%, ${palette.gradTo} 100%)`,
                    borderBottom: `1px solid ${palette.accentMid}44`,
                    padding: "18px 20px 16px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Cercles décoratifs */}
                <div
                    style={{
                        position: "absolute",
                        top: -24,
                        right: -24,
                        width: 88,
                        height: 88,
                        borderRadius: "50%",
                        background: palette.accent,
                        opacity: 0.07,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: palette.accent,
                        opacity: 0.05,
                        pointerEvents: "none",
                    }}
                />

                {/* Barre verticale colorée */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: `linear-gradient(180deg, ${palette.accent}, ${palette.accent}66)`,
                        borderRadius: "0 2px 2px 0",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        paddingLeft: 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                flexShrink: 0,
                                background: palette.accent,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 17,
                                fontWeight: 800,
                                color: "#fff",
                                boxShadow: `0 4px 12px ${palette.accent}50`,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {isFamily ? (
                                <UsersRound style={{ width: 20, height: 20 }} />
                            ) : (
                                initial
                            )}
                        </div>
                        <div>
                            <p
                                style={{
                                    fontWeight: 800,
                                    color: "#0f172a",
                                    fontSize: 15.5,
                                    lineHeight: 1.2,
                                    marginBottom: 3,
                                }}
                            >
                                {name}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: palette.accentText,
                                        background: palette.accentLight,
                                        border: `1px solid ${palette.accentMid}`,
                                        borderRadius: 20,
                                        padding: "1px 7px",
                                        letterSpacing: "0.03em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {isFamily ? "Famille" : "Membre"}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10.5,
                                        color: "#94a3b8",
                                        fontFamily: "DM Mono, monospace",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {t.reference ||
                                        `TRF-${String(t.id).padStart(4, "0")}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <StatusBadge status={t.status} />
                </div>
            </div>

            {/* ── Corps ── */}
            <div style={{ padding: "14px 20px 16px" }}>
                {/* Trajet */}
                <div style={{ marginBottom: 14 }}>
                    <p
                        style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                        }}
                    >
                        Trajet de transfert
                    </p>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        {/* Source */}
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "7px 10px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 2,
                                }}
                            >
                                Depuis
                            </p>
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#475569",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    margin: 0,
                                }}
                            >
                                {t.classe_source?.nom || "—"}
                            </p>
                        </div>

                        {/* Flèche */}
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                flexShrink: 0,
                                background: palette.accent,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: `0 2px 8px ${palette.accent}40`,
                            }}
                        >
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M3 8h10M9 4l4 4-4 4"
                                    stroke="#fff"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        {/* Destination */}
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: palette.accentLight,
                                border: `1px solid ${palette.accentMid}`,
                                borderRadius: 8,
                                padding: "7px 10px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: palette.accent,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 2,
                                }}
                            >
                                Vers
                            </p>
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: palette.accentText,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    margin: 0,
                                }}
                            >
                                {t.external_destination ||
                                    t.classe_cible?.nom ||
                                    "—"}
                            </p>
                        </div>
                    </div>

                    {/* Motif */}
                    {t.reason && (
                        <div
                            style={{
                                marginTop: 8,
                                background: "#fafafa",
                                border: "1px dashed #e2e8f0",
                                borderRadius: 7,
                                padding: "7px 10px",
                                display: "flex",
                                gap: 7,
                                alignItems: "flex-start",
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{ flexShrink: 0, marginTop: 1 }}
                            >
                                <path
                                    d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 4v4m0 2h.01"
                                    stroke="#94a3b8"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: "#64748b",
                                    fontStyle: "italic",
                                    lineHeight: 1.4,
                                    margin: 0,
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                }}
                            >
                                {t.reason}
                            </p>
                        </div>
                    )}
                </div>

                {/* Séparateur dégradé */}
                <div
                    style={{
                        height: 1,
                        background:
                            "linear-gradient(90deg, transparent, #e2e8f0 30%, #e2e8f0 70%, transparent)",
                        marginBottom: 14,
                    }}
                />

                {/* Progression */}
                <div style={{ marginBottom: 14 }}>
                    <p
                        style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 10,
                        }}
                    >
                        Progression
                    </p>
                    <StepProgressBar status={t.status} />
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 10,
                        borderTop: "1px solid #f1f5f9",
                    }}
                >
                    {t.created_at ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <Clock
                                style={{
                                    width: 11,
                                    height: 11,
                                    color: "#cbd5e1",
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 10.5,
                                    color: "#94a3b8",
                                    fontFamily: "DM Mono, monospace",
                                }}
                            >
                                {t.created_at}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}
                    <span
                        className="card-action-hint"
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: palette.accent,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: palette.accentLight,
                            borderRadius: 20,
                            padding: "3px 10px",
                            border: `1px solid ${palette.accentMid}`,
                        }}
                    >
                        <Eye style={{ width: 11, height: 11 }} />
                        Voir détails
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────
// TIMELINE (modal détails)
// ─────────────────────────────────────────
const TransferTimeline = ({ transfer }) => {
    const isRefused = transfer.status === "REFUSEE";
    const statusOrder = [
        "SOUMISE",
        "EN_ATTENTE_SOURCE",
        "VALIDEE_SOURCE",
        "EN_ATTENTE_ACCUEIL",
        "VALIDEE_ACCUEIL",
        "TERMINEE",
    ];
    const currentIndex = statusOrder.indexOf(transfer.status);
    const steps = [
        {
            label: "Soumission",
            date: transfer.created_at,
            person: transfer.member?.name || transfer.family?.name || "—",
            done: currentIndex >= 0,
            active: currentIndex === 0 || currentIndex === 1,
        },
        {
            label: "Validation Source",
            date: transfer.validated_source_at,
            person: transfer.validated_source_by,
            done: currentIndex >= 2,
            active: currentIndex === 2 || currentIndex === 3,
        },
        {
            label: isRefused ? "Refusé" : "Validation Accueil",
            date: transfer.validated_accueil_at,
            person: transfer.validated_accueil_by,
            done: currentIndex >= 4,
            active: currentIndex === 4 || currentIndex === 5,
            refused: isRefused,
        },
    ];
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                let dotClass = "tl-idle";
                if (step.refused) dotClass = "tl-refused";
                else if (step.done) dotClass = "tl-done";
                else if (step.active) dotClass = "tl-active";
                return (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <div
                                className={dotClass}
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    border: "2px solid",
                                    flexShrink: 0,
                                    marginTop: 2,
                                }}
                            />
                            {!isLast && (
                                <div
                                    style={{
                                        width: 1,
                                        flex: 1,
                                        minHeight: 28,
                                        marginTop: 4,
                                        background: step.done
                                            ? "#22c55e"
                                            : "#e5e7eb",
                                    }}
                                />
                            )}
                        </div>
                        <div style={{ paddingBottom: 16 }}>
                            <p
                                style={{
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    lineHeight: 1.3,
                                    color: step.refused
                                        ? "#dc2626"
                                        : step.done || step.active
                                          ? "#111"
                                          : "#9ca3af",
                                    margin: 0,
                                }}
                            >
                                {step.label}
                            </p>
                            {step.date && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: "#9ca3af",
                                        marginTop: 2,
                                    }}
                                >
                                    {step.date}
                                </p>
                            )}
                            {step.person && (
                                <p style={{ fontSize: 11.5, color: "#9ca3af" }}>
                                    par {step.person}
                                </p>
                            )}
                            {!step.date && !step.done && !step.refused && (
                                <p
                                    style={{
                                        fontSize: 11.5,
                                        color: "#bbb",
                                        fontStyle: "italic",
                                        marginTop: 2,
                                    }}
                                >
                                    En attente…
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────
const StatCard = ({
    icon: Icon,
    label,
    value,
    iconBg,
    iconColor,
    delay = 0,
}) => (
    <div
        className="stat-card card-enter"
        style={{ padding: "18px 20px", animationDelay: `${delay}ms` }}
    >
        <div style={{ marginBottom: 14 }}>
            <div
                style={{
                    background: iconBg,
                    borderRadius: 10,
                    padding: 9,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon style={{ width: 17, height: 17, color: iconColor }} />
            </div>
        </div>
        <p
            style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111",
                lineHeight: 1,
                marginBottom: 5,
            }}
        >
            {value}
        </p>
        <p
            style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
            }}
        >
            {label}
        </p>
    </div>
);

// ─────────────────────────────────────────
// STEP DOTS (modal création)
// ─────────────────────────────────────────
const StepDots = ({ current, total }) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
            marginTop: 12,
        }}
    >
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                style={{
                    borderRadius: 100,
                    height: 4,
                    width: i + 1 === current ? 20 : 8,
                    background:
                        i + 1 <= current
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s ease",
                }}
            />
        ))}
    </div>
);

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
export default function Index({
    transfers = [],
    classes = [],
    family = {},
    members = [],
}) {
    const { flash } = usePage().props;
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (flash?.success) {
            setNotification({ type: "success", message: flash.success });
            const t = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(t);
        }
        if (flash?.error) {
            setNotification({ type: "error", message: flash.error });
            const t = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [formData, setFormData] = useState({
        type: "member",
        member_id: "",
        target_class_id: "",
        reason: "",
        destination_city: "",
        destination_church: "",
    });
    const [processing, setProcessing] = useState(false);
    const isMemberTransferType = ["member", "member_external"].includes(
        formData.type,
    );
    const isExternalTransferType = ["member_external", "family_external"].includes(
        formData.type,
    );

    const getMemberOptionLabel = (member) =>
        member.transfer_status
            ? `${member.nom} ${member.prenom} - ${member.transfer_label || "Action bloquee"}`
            : `${member.nom} ${member.prenom}`;

    const getTransferTypeLabel = (type) => {
        switch (type) {
            case "member":
                return "Transfert d'un membre";
            case "family":
                return "Transfert d'une famille";
            case "member_external":
                return "Sortie externe d'un membre";
            case "family_external":
                return "Sortie externe d'une famille";
            default:
                return type || "Transfert";
        }
    };

    const statusOptions = [
        { value: "SOUMISE", label: "Soumise" },
        { value: "VALIDEE_SOURCE", label: "Validee Source" },
        { value: "TERMINEE", label: "Terminee" },
        { value: "REFUSEE", label: "Refusee" },
    ];

    const classOptions = classes.map((classe) => ({
        value: classe.id,
        label: classe.nom,
    }));

    const memberOptions = members.map((member) => ({
        value: member.id,
        label: getMemberOptionLabel(member),
        disabled: Boolean(member.transfer_status),
    }));
    const matchesSelectedValue = (left, right) =>
        String(left ?? "") === String(right ?? "");
    const getMemberDisplayName = (member) =>
        [member?.nom, member?.prenom].filter(Boolean).join(" ").trim();
    const selectedMember = isMemberTransferType
        ? members.find((member) =>
              matchesSelectedValue(member.id, formData.member_id),
          )
        : null;
    const selectedClass = !isExternalTransferType
        ? classes.find((classe) =>
              matchesSelectedValue(classe.id, formData.target_class_id),
          )
        : null;
    const selectedMemberLabel =
        getMemberDisplayName(selectedMember) ||
        memberOptions.find((option) =>
            matchesSelectedValue(option.value, formData.member_id),
        )?.label ||
        "—";
    const selectedClassLabel =
        selectedClass?.nom ||
        classOptions.find((option) =>
            matchesSelectedValue(option.value, formData.target_class_id),
        )?.label ||
        "—";

    const stats = useMemo(
        () => ({
            total: transfers.length,
            pending: transfers.filter((t) =>
                ["SOUMISE", "EN_ATTENTE_SOURCE", "EN_ATTENTE_ACCUEIL"].includes(
                    t.status,
                ),
            ).length,
            completed: transfers.filter((t) =>
                ["VALIDEE_ACCUEIL", "TERMINEE"].includes(t.status),
            ).length,
            rejected: transfers.filter((t) => t.status === "REFUSEE").length,
        }),
        [transfers],
    );

    const filteredTransfers = transfers.filter((t) => {
        const matchSearch =
            !searchTerm ||
            t.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.family?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !statusFilter || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const resetModal = () => {
        setIsModalOpen(false);
        setModalStep(1);
        setFormData({
            type: "member",
            member_id: "",
            target_class_id: "",
            reason: "",
            destination_city: "",
            destination_church: "",
        });
    };

    const handleNextStep = () => {
        if (modalStep === 2 && isMemberTransferType && !formData.member_id)
            return;
        if (
            modalStep === 2 &&
            isExternalTransferType &&
            (!formData.destination_city || !formData.destination_church)
        )
            return;
        if (modalStep === 2 && !isExternalTransferType && !formData.target_class_id)
            return;
        setModalStep((s) => s + 1);
    };

    const handleSubmit = () => {
        setProcessing(true);
        router.post(
            withBasePath("", "/pasteur/transferts"),
            {
                type: isMemberTransferType ? "member" : "family",
                transfer_mode: isExternalTransferType ? "external" : "internal",
                user_id:
                    isMemberTransferType
                        ? parseInt(formData.member_id)
                        : null,
                target_class_id: isExternalTransferType
                    ? null
                    : parseInt(formData.target_class_id),
                destination_city: isExternalTransferType
                    ? formData.destination_city
                    : null,
                destination_church: isExternalTransferType
                    ? formData.destination_church
                    : null,
                reason: formData.reason || null,
            },
            {
                onFinish: () => {
                    setProcessing(false);
                    resetModal();
                },
            },
        );
    };

    return (
        <>
            <style>{fontStyle}</style>

            <div
                className="min-h-screen"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                {/* Toast */}
                {notification && (
                    <div
                        className="toast-enter"
                        style={{
                            position: "fixed",
                            top: 20,
                            right: 20,
                            zIndex: 200,
                            padding: "12px 20px",
                            borderRadius: 12,
                            background:
                                notification.type === "success"
                                    ? "#16a34a"
                                    : "#dc2626",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                        }}
                    >
                        {notification.type === "success" ? (
                            <CheckCircle size={16} />
                        ) : (
                            <XCircle size={16} />
                        )}
                        {notification.message}
                    </div>
                )}

                <div
                    style={{
                        flex: "1 1 0%",
                        maxWidth: "100%",
                        width: "100%",
                        margin: "0 auto",
                        padding: "40px 24px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 36,
                        }}
                    >
                        <div
                            className="card-enter"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 14,
                            }}
                        >
                            <button
                                onClick={() =>
                                    router.visit(
                                        withBasePath("", "/pasteur/dashboard"),
                                    )
                                }
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "9px 14px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,0.22)",
                                    background: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                <ArrowLeft size={15} />
                                Retour
                            </button>
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.55)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 6,
                                }}
                            >
                                Gestion des demandes
                            </p>
                            <h1
                                style={{
                                    fontSize: 34,
                                    fontWeight: 700,
                                    color: "#fff",
                                    lineHeight: 1.1,
                                    marginBottom: 6,
                                }}
                            >
                                Transferts de Classe
                            </h1>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "rgba(255,255,255,0.6)",
                                }}
                            >
                                Suivi des demandes · Validation en 3 étapes
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary card-enter"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "11px 20px",
                                fontSize: 14,
                                border: "none",
                                cursor: "pointer",
                                animationDelay: "100ms",
                            }}
                        >
                            <Plus size={16} />
                            Nouvelle Demande
                        </button>
                    </div>

                    {/* Stats */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 16,
                            marginBottom: 28,
                        }}
                    >
                        <StatCard
                            icon={Layers}
                            label="Total"
                            value={stats.total}
                            iconBg="#EDE9FE"
                            iconColor="#7C3AED"
                            delay={0}
                        />
                        <StatCard
                            icon={Clock}
                            label="En cours"
                            value={stats.pending}
                            iconBg="#FEF3C7"
                            iconColor="#D97706"
                            delay={60}
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Validés"
                            value={stats.completed}
                            iconBg="#DCFCE7"
                            iconColor="#16A34A"
                            delay={120}
                        />
                        <StatCard
                            icon={XCircle}
                            label="Refusés"
                            value={stats.rejected}
                            iconBg="#FEE2E2"
                            iconColor="#DC2626"
                            delay={180}
                        />
                    </div>

                    {/* Barre de recherche */}
                    {transfers.length > 0 && (
                        <div
                            className="filter-bar card-enter"
                            style={{
                                padding: "14px 18px",
                                marginBottom: 24,
                                animationDelay: "200ms",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ position: "relative", flex: 1 }}>
                                    <Search
                                        style={{
                                            position: "absolute",
                                            left: 13,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 15,
                                            height: 15,
                                            color: "#f97316",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Rechercher un membre ou une famille…"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            paddingLeft: 40,
                                            paddingRight: 16,
                                            paddingTop: 10,
                                            paddingBottom: 10,
                                            fontSize: 13.5,
                                            color: "#111",
                                            boxSizing: "border-box",
                                            fontWeight: 400,
                                        }}
                                    />
                                </div>
                                <div style={{ minWidth: 160 }}>
                                    <Select2Single
                                        name="status_filter"
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        options={statusOptions}
                                        placeholder="Tous les statuts"
                                        variant="orange"
                                        allowClearOption={true}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenu */}
                    {filteredTransfers.length === 0 ? (
                        <div
                            className="empty-state card-enter"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "80px 20px",
                            }}
                        >
                            <div
                                style={{
                                    background: "#f5f5f5",
                                    borderRadius: 16,
                                    padding: 20,
                                    marginBottom: 20,
                                }}
                            >
                                <Inbox
                                    style={{
                                        width: 32,
                                        height: 32,
                                        color: "#bbb",
                                    }}
                                />
                            </div>
                            <p
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: "#111",
                                    marginBottom: 6,
                                }}
                            >
                                Aucune demande de transfert
                            </p>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: "#999",
                                    marginBottom: 24,
                                }}
                            >
                                Commencez par créer votre première demande.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "10px 20px",
                                    fontSize: 14,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <Plus size={16} />
                                Créer une demande
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 18,
                            }}
                        >
                            {filteredTransfers.map((t, i) => (
                                <TransferCard
                                    key={t.id}
                                    t={t}
                                    onClick={() => setSelectedTransfer(t)}
                                    delay={i * 40}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL CRÉATION ── */}
            {isModalOpen && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                    onClick={resetModal}
                >
                    <div
                        className="modal-box modal-enter"
                        style={{ width: "100%", maxWidth: 480 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                background:
                                    "linear-gradient(135deg, #f97316, #ea580c)",
                                padding: "24px 28px 20px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.65)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 4,
                                }}
                            >
                                Étape {modalStep} sur 3
                            </p>
                            <h2
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: "#fff",
                                    margin: 0,
                                }}
                            >
                                Nouvelle Demande
                            </h2>
                            <StepDots current={modalStep} total={3} />
                        </div>

                        <div style={{ padding: "24px 28px", minHeight: 200 }}>
                            {modalStep === 1 && (
                                <div>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: "#555",
                                            marginBottom: 16,
                                        }}
                                    >
                                        Qui concerne ce transfert ?
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {[
                                            {
                                                value: "member",
                                                label: "Un Membre",
                                                icon: User,
                                                desc: "Transfert individuel d'un membre",
                                            },
                                            {
                                                value: "family",
                                                label: "Toute la Famille",
                                                icon: UsersRound,
                                                desc: "Transfert groupé de la famille",
                                            },
                                            {
                                                value: "member_external",
                                                label: "Sortie externe d'un membre",
                                                icon: MapPin,
                                                desc: "Archive un membre comme ancien membre vers une autre eglise apres approbation du conducteur de la classe",
                                            },
                                            {
                                                value: "family_external",
                                                label: "Sortie externe d'une famille",
                                                icon: MapPin,
                                                desc: "Archive toute la famille hors communaute vers une autre eglise apres approbation du conducteur de la classe",
                                            },
                                        ].map((opt) => (
                                            <div
                                                key={opt.value}
                                                className={`step-option ${formData.type === opt.value ? "selected" : ""}`}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 14,
                                                    padding: "14px 16px",
                                                }}
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        type: opt.value,
                                                        member_id: "",
                                                        target_class_id: "",
                                                        destination_city: "",
                                                        destination_church: "",
                                                    }))
                                                }
                                            >
                                                <div
                                                    style={{
                                                        background:
                                                            formData.type ===
                                                            opt.value
                                                                ? "#fff7ed"
                                                                : "#f5f5f5",
                                                        borderRadius: 10,
                                                        padding: 8,
                                                    }}
                                                >
                                                    <opt.icon
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            color:
                                                                formData.type ===
                                                                opt.value
                                                                    ? "#f97316"
                                                                    : "#9ca3af",
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: 14,
                                                            margin: 0,
                                                            color: "inherit",
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#999",
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.type === "member" && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                background: "#eff6ff",
                                                border: "1px solid #dbeafe",
                                                borderRadius: 10,
                                                padding: "12px 14px",
                                                marginTop: 16,
                                            }}
                                        >
                                            <Info
                                                style={{
                                                    width: 15,
                                                    height: 15,
                                                    color: "#3b82f6",
                                                    flexShrink: 0,
                                                    marginTop: 1,
                                                }}
                                            />
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: "#1e40af",
                                                    margin: 0,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Une fois finalisé, le membre
                                                deviendra responsable de sa
                                                nouvelle famille.
                                            </p>
                                        </div>
                                    )}
                                    {formData.type === "member_external" && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                background: "#fff7ed",
                                                border: "1px solid #fed7aa",
                                                borderRadius: 10,
                                                padding: "12px 14px",
                                                marginTop: 16,
                                            }}
                                        >
                                            <Info
                                                style={{
                                                    width: 15,
                                                    height: 15,
                                                    color: "#f97316",
                                                    flexShrink: 0,
                                                    marginTop: 1,
                                                }}
                                            />
                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: "#9a3412",
                                                    margin: 0,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Apres approbation du conducteur
                                                de la classe, ce membre sera
                                                archive comme ancien membre vers
                                                l'eglise de destination.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalStep === 2 && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 16,
                                    }}
                                >
                                    {isMemberTransferType && (
                                        <div>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: "#555",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                Membre concerne
                                            </label>
                                            <Select2Single
                                                name="member_id"
                                                value={formData.member_id}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        member_id: e.target.value,
                                                    }))
                                                }
                                                options={memberOptions}
                                                placeholder="Selectionner un membre"
                                                allowClearOption={true}
                                            />
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    fontSize: 12,
                                                    color: "#64748b",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Les anciens membres et les membres avec un transfert en cours restent visibles, mais ils sont desactives pour eviter une nouvelle action.
                                            </div>
                                        </div>
                                    )}
                                    {!isExternalTransferType ? (
                                        <div>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: "#555",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                Classe cible
                                            </label>
                                            <Select2Single
                                                name="target_class_id"
                                                value={formData.target_class_id}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        target_class_id:
                                                            e.target.value,
                                                    }))
                                                }
                                                options={classOptions}
                                                placeholder="Selectionner une classe..."
                                                allowClearOption={true}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: "#555",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Ville de destination
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.destination_city}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            destination_city:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="input-field"
                                                    placeholder="Ex: Abidjan"
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 14px",
                                                        fontSize: 13,
                                                        color: "#111",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: "#555",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Nom d'eglise de destination
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.destination_church}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            destination_church:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="input-field"
                                                    placeholder="Ex: Eglise genese"
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 14px",
                                                        fontSize: 13,
                                                        color: "#111",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: "#555",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                                marginBottom: 8,
                                            }}
                                        >
                                            Motif{" "}
                                            <span
                                                style={{
                                                    color: "#bbb",
                                                    fontWeight: 400,
                                                    textTransform: "none",
                                                }}
                                            >
                                                (optionnel)
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.reason}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    reason: e.target.value,
                                                }))
                                            }
                                            rows={3}
                                            className="input-field"
                                            placeholder="Expliquez la raison du transfert…"
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px",
                                                fontSize: 13,
                                                color: "#111",
                                                resize: "none",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {modalStep === 3 && (
                                <div>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "#555",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            marginBottom: 14,
                                        }}
                                    >
                                        Récapitulatif
                                    </p>
                                    <div
                                        style={{
                                            background: "#f9f9f9",
                                            border: "1px solid #ebebeb",
                                            borderRadius: 12,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {[
                                            {
                                                key: "Type",
                                                val: getTransferTypeLabel(
                                                    formData.type,
                                                ),
                                            },
                                            ...(isMemberTransferType
                                                ? [
                                                      {
                                                          key: "Membre",
                                                          val: selectedMemberLabel,
                                                      },
                                                  ]
                                                : []),
                                            ...(isExternalTransferType
                                                ? [
                                                      {
                                                          key: "Ville de destination",
                                                          val:
                                                              formData.destination_city ||
                                                              "—",
                                                      },
                                                      {
                                                          key: "Nom d'eglise de destination",
                                                          val:
                                                              formData.destination_church ||
                                                              "—",
                                                      },
                                                  ]
                                                : [
                                                      {
                                                          key: "Classe cible",
                                                          val: selectedClassLabel,
                                                      },
                                                  ]),
                                            ...(formData.reason
                                                ? [
                                                      {
                                                          key: "Motif",
                                                          val: formData.reason,
                                                      },
                                                  ]
                                                : []),
                                        ].map((row, i, arr) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "flex-start",
                                                    padding: "11px 16px",
                                                    borderBottom:
                                                        i < arr.length - 1
                                                            ? "1px solid #ebebeb"
                                                            : "none",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: "#999",
                                                    }}
                                                >
                                                    {row.key}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: "#111",
                                                        textAlign: "right",
                                                        maxWidth: "60%",
                                                    }}
                                                >
                                                    {row.val}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "#bbb",
                                            marginTop: 14,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {isExternalTransferType
                                            ? "Cette sortie externe sera soumise au conducteur de la classe pour confirmation avant archivage."
                                            : "Votre demande sera validée par le conducteur source, puis par le conducteur d'accueil."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                padding: "16px 28px",
                                borderTop: "1px solid #f0f0f0",
                                background: "#fafafa",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={() =>
                                    modalStep > 1
                                        ? setModalStep(modalStep - 1)
                                        : resetModal()
                                }
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#777",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "6px 4px",
                                }}
                            >
                                {modalStep > 1 ? "← Retour" : "Annuler"}
                            </button>
                            {modalStep < 3 ? (
                                <button
                                    onClick={handleNextStep}
                                    className="btn-primary"
                                    style={{
                                        padding: "9px 20px",
                                        fontSize: 13,
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Continuer →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="btn-confirm"
                                    style={{
                                        padding: "9px 20px",
                                        fontSize: 13,
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {processing ? "Envoi…" : "✓ Confirmer"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DÉTAILS ── */}
            {selectedTransfer && (
                <div
                    className="modal-backdrop"
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                    onClick={() => setSelectedTransfer(null)}
                >
                    <div
                        className="modal-box modal-enter"
                        style={{ width: "100%", maxWidth: 440 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: "22px 24px 20px",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <div>
                                <p
                                    className="mono"
                                    style={{
                                        fontSize: 11,
                                        color: "#bbb",
                                        letterSpacing: "0.06em",
                                        marginBottom: 4,
                                    }}
                                >
                                    {selectedTransfer.reference ||
                                        `TRF-${String(selectedTransfer.id).padStart(4, "0")}`}
                                </p>
                                <h2
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 700,
                                        color: "#111",
                                        margin: 0,
                                    }}
                                >
                                    {selectedTransfer.member?.name ||
                                        selectedTransfer.family?.name}
                                </h2>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <StatusBadge status={selectedTransfer.status} />
                                <button
                                    onClick={() => setSelectedTransfer(null)}
                                    style={{
                                        background: "#f5f5f5",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: 7,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <X
                                        style={{
                                            width: 14,
                                            height: 14,
                                            color: "#666",
                                        }}
                                    />
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "20px 24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 20,
                            }}
                        >
                            <div
                                style={{
                                    background: "#f9f9f9",
                                    border: "1px solid #ebebeb",
                                    borderRadius: 12,
                                    padding: "14px 16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                {[
                                    {
                                        label: "Type",
                                        value: getTransferTypeLabel(
                                            selectedTransfer.transfer_mode ===
                                                "external"
                                                ? `${selectedTransfer.type}_external`
                                                : selectedTransfer.type,
                                        ),
                                        color: "#555",
                                    },
                                    {
                                        label: "Source",
                                        value: selectedTransfer.classe_source
                                            ?.nom,
                                        color: "#555",
                                    },
                                    {
                                        label: "Destination",
                                        value:
                                            selectedTransfer.external_destination ||
                                            selectedTransfer.classe_cible
                                                ?.nom ||
                                            "—",
                                        color: "#ea580c",
                                        bold: true,
                                    },
                                    ...(selectedTransfer.reason
                                        ? [
                                              {
                                                  label: "Motif",
                                                  value: selectedTransfer.reason,
                                                  color: "#777",
                                                  italic: true,
                                              },
                                          ]
                                        : []),
                                ].map((row, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "#bbb",
                                                width: 72,
                                                flexShrink: 0,
                                                paddingTop: 1,
                                            }}
                                        >
                                            {row.label}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: row.color,
                                                fontWeight: row.bold
                                                    ? 700
                                                    : 500,
                                                fontStyle: row.italic
                                                    ? "italic"
                                                    : "normal",
                                            }}
                                        >
                                            {row.value || "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#bbb",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        marginBottom: 14,
                                    }}
                                >
                                    Progression
                                </p>
                                <TransferTimeline transfer={selectedTransfer} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
