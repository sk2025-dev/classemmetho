import React, { useState, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    User,
    Users,
    Calendar,
    MapPin,
    FileText,
    AlertCircle,
    History,
    ShieldCheck,
    Building2,
} from "lucide-react";

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');
  * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .mono { font-family: 'DM Mono', monospace; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.97); }      to { opacity:1; transform:scale(1); } }
  @keyframes flashIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulseRing {
    0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
    50%      { box-shadow: 0 0 0 6px rgba(249,115,22,0); }
  }

  .fade-up  { animation: fadeUp  0.38s ease both; }
  .scale-in { animation: scaleIn 0.22s ease both; }
  .flash-in { animation: flashIn 0.28s ease both; }

  .action-card {
    background: #fff; border-radius: 18px;
    border: 1px solid #e8edf3;
    box-shadow: 0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    transition: box-shadow 0.22s ease, transform 0.22s ease;
    overflow: hidden;
  }
  .action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 48px rgba(15,23,42,0.12), 0 6px 16px rgba(15,23,42,0.06);
  }

  .stat-card {
    background: rgba(255,255,255,0.92); backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.85); border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.09);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.13); background: #fff; }

  .tab-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 20px; border-radius:10px; font-size:13.5px;
    font-weight:600; border:none; cursor:pointer; transition:all 0.18s ease;
  }
  .tab-active   { background:#fff; color:#0f172a; box-shadow:0 2px 12px rgba(0,0,0,0.12); }
  .tab-inactive { background:rgba(255,255,255,0.12); color:rgba(255,255,255,0.85); }
  .tab-inactive:hover { background:rgba(255,255,255,0.2); color:#fff; }

  .btn-approve {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    padding:10px 0; width:100%; border:none; cursor:pointer;
    background:linear-gradient(135deg,#16a34a,#15803d);
    color:#fff; font-size:13.5px; font-weight:700; border-radius:11px;
    box-shadow:0 3px 10px rgba(22,163,74,0.35); transition:all 0.16s ease;
    font-family:'DM Sans',sans-serif;
  }
  .btn-approve:hover:not(:disabled) { background:linear-gradient(135deg,#15803d,#166534); transform:translateY(-1px); box-shadow:0 6px 18px rgba(22,163,74,0.4); }
  .btn-approve:disabled { opacity:0.55; cursor:not-allowed; transform:none; }

  .btn-refuse {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    padding:10px 16px; background:#fff; color:#dc2626;
    border:1.5px solid #fca5a5; border-radius:11px; cursor:pointer;
    font-size:13.5px; font-weight:700; transition:all 0.16s ease;
    font-family:'DM Sans',sans-serif;
  }
  .btn-refuse:hover:not(:disabled) { background:#fef2f2; border-color:#f87171; transform:translateY(-1px); }
  .btn-refuse:disabled { opacity:0.55; cursor:not-allowed; }

  .btn-cancel-sm {
    flex:1; padding:8px 0; background:#f8fafc; border:1px solid #e2e8f0;
    border-radius:9px; font-size:12.5px; font-weight:600; color:#475569;
    cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;
  }
  .btn-cancel-sm:hover { background:#f1f5f9; }

  .btn-confirm-refuse {
    flex:1; padding:8px 0; background:#dc2626; border:none;
    border-radius:9px; font-size:12.5px; font-weight:700; color:#fff;
    cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif;
  }
  .btn-confirm-refuse:hover:not(:disabled) { background:#b91c1c; }
  .btn-confirm-refuse:disabled { background:#fca5a5; cursor:not-allowed; }

  .refuse-area {
    width:100%; padding:9px 12px; background:#fff; border:1.5px solid #fca5a5;
    border-radius:9px; font-size:13px; color:#111; resize:none;
    transition:border-color 0.2s, box-shadow 0.2s; font-family:'DM Sans',sans-serif;
  }
  .refuse-area:focus { outline:none; border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.12); }
  .refuse-area::placeholder { color:#cbd5e1; }

  .hist-table { width:100%; border-collapse:collapse; }
  .hist-table thead tr { background:#f8fafc; }
  .hist-table th { padding:11px 18px; text-align:left; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.07em; }
  .hist-table tbody tr { border-top:1px solid #f1f5f9; transition:background 0.12s; }
  .hist-table tbody tr:hover { background:#fafbfc; }
  .hist-table td { padding:13px 18px; font-size:13px; color:#334155; vertical-align:middle; }

  .empty-state {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:72px 24px; text-align:center;
    background:rgba(255,255,255,0.06); backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.12); border-radius:18px;
  }
`;

// ─────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const configs = {
        EN_ATTENTE_SOURCE: {
            label: "Attente Source",
            bg: "#FFFBEB",
            color: "#92400E",
            dot: "#F59E0B",
        },
        EN_ATTENTE_ACCUEIL: {
            label: "Attente Accueil",
            bg: "#ECFEFF",
            color: "#155E75",
            dot: "#06B6D4",
        },
        TERMINEE: {
            label: "Terminée",
            bg: "#F0FDF4",
            color: "#14532D",
            dot: "#22C55E",
        },
        REFUSEE: {
            label: "Refusée",
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
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                background: c.bg,
                color: c.color,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.dot,
                    flexShrink: 0,
                }}
            />
            {c.label}
        </span>
    );
};

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────
const StatCard = ({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    delay = 0,
}) => (
    <div
        className="stat-card fade-up"
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
                fontWeight: 800,
                color: "#0f172a",
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
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
            }}
        >
            {title}
        </p>
    </div>
);

// ─────────────────────────────────────────
// ACTION CARD
// ─────────────────────────────────────────
const TransferCard = ({ transfer, onApprove, onRefuse, delay = 0 }) => {
    const [showRefuseForm, setShowRefuseForm] = useState(false);
    const [refuseReason, setRefuseReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Debug: Log famille_source data
    React.useEffect(() => {
        console.log("TransferCard - Transfer data:", {
            id: transfer.id,
            type: transfer.type,
            famille_source: transfer.famille_source,
            family: transfer.family,
            member: transfer.member,
        });
    }, [transfer]);

    const isSource = transfer.status === "EN_ATTENTE_SOURCE";
    const isFamily = transfer.type !== "member";
    const name = transfer.member?.name || transfer.family?.name || "—";
    const initial = name.charAt(0).toUpperCase();

    const accent = isSource ? "#f59e0b" : "#06b6d4";
    const accentLight = isSource ? "#fffbeb" : "#ecfeff";
    const accentMid = isSource ? "#fde68a" : "#a5f3fc";
    const accentText = isSource ? "#92400e" : "#155e75";
    const gradFrom = isSource ? "#fffbeb" : "#ecfeff";

    const doApprove = () => {
        setIsProcessing(true);
        onApprove(transfer.id);
    };
    const doRefuse = () => {
        if (!refuseReason.trim()) return;
        setIsProcessing(true);
        onRefuse(transfer.id, refuseReason);
    };

    return (
        <div
            className="action-card fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Header coloré */}
            <div
                style={{
                    background: `linear-gradient(135deg,${gradFrom} 0%,#fff 100%)`,
                    borderBottom: `1px solid ${accentMid}55`,
                    padding: "16px 18px 14px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: -20,
                        right: -20,
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: accent,
                        opacity: 0.08,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: accent,
                        opacity: 0.05,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: `linear-gradient(180deg,${accent},${accent}66)`,
                        borderRadius: "0 2px 2px 0",
                    }}
                />

                <div
                    style={{
                        paddingLeft: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                        }}
                    >
                        <div
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 11,
                                flexShrink: 0,
                                background: accent,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                fontWeight: 800,
                                boxShadow: `0 4px 10px ${accent}50`,
                            }}
                        >
                            {isFamily ? (
                                <Users style={{ width: 18, height: 18 }} />
                            ) : (
                                initial
                            )}
                        </div>
                        <div>
                            <p
                                style={{
                                    fontWeight: 800,
                                    fontSize: 15,
                                    color: "#0f172a",
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
                                        textTransform: "uppercase",
                                        letterSpacing: "0.03em",
                                        color: accentText,
                                        background: accentLight,
                                        border: `1px solid ${accentMid}`,
                                        borderRadius: 20,
                                        padding: "1px 7px",
                                    }}
                                >
                                    {isFamily ? "Famille" : "Membre"}
                                </span>
                                <span
                                    className="mono"
                                    style={{
                                        fontSize: 10.5,
                                        color: "#94a3b8",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {transfer.reference}
                                </span>
                            </div>
                        </div>
                    </div>
                    <StatusBadge status={transfer.status} />
                </div>
            </div>

            {/* Corps */}
            <div style={{ padding: "14px 18px 16px" }}>
                {/* Date */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 12,
                    }}
                >
                    <Calendar
                        style={{ width: 12, height: 12, color: "#cbd5e1" }}
                    />
                    <span
                        className="mono"
                        style={{ fontSize: 11.5, color: "#94a3b8" }}
                    >
                        {transfer.created_at}
                    </span>
                </div>

                {/* ── Bloc personnes ── */}
                <div
                    style={{
                        background: "#f7f8ff",
                        border: "1px solid #e8eaff",
                        borderRadius: 10,
                        marginBottom: 12,
                        overflow: "hidden",
                    }}
                >
                    {/* Demandeur */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 12px",
                            borderBottom: "1px solid #eceeff",
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 7,
                                background: "#e0e7ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <User
                                style={{
                                    width: 12,
                                    height: 12,
                                    color: "#4f46e5",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#a5b4fc",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    flexShrink: 0,
                                }}
                            >
                                Demandeur
                            </span>
                            <div style={{ textAlign: "right", minWidth: 0 }}>
                                <span
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: "#3730a3",
                                        display: "block",
                                    }}
                                >
                                    {transfer.created_by || "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Concerné + code (membre seulement) */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 12px",
                            borderBottom: "1px solid #eceeff",
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 7,
                                background: isFamily ? "#f0fdf4" : "#fff7ed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            {isFamily ? (
                                <Users
                                    style={{
                                        width: 12,
                                        height: 12,
                                        color: "#16a34a",
                                    }}
                                />
                            ) : (
                                <User
                                    style={{
                                        width: 12,
                                        height: 12,
                                        color: "#ea580c",
                                    }}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flex: 1,
                                minWidth: 0,
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: isFamily ? "#86efac" : "#fdba74",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    flexShrink: 0,
                                }}
                            >
                                Concerné
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    minWidth: 0,
                                    justifyContent: "flex-end",
                                }}
                            >
                                {!isFamily && transfer.member?.code_membre && (
                                    <span
                                        className="mono"
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: "#fff",
                                            background: "#ea580c",
                                            borderRadius: 5,
                                            padding: "1px 6px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {transfer.member.code_membre}
                                    </span>
                                )}
                                <div
                                    style={{ textAlign: "right", minWidth: 0 }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            color: isFamily
                                                ? "#15803d"
                                                : "#c2410c",
                                            display: "block",
                                        }}
                                    >
                                        {transfer.member?.name ||
                                            transfer.family?.name ||
                                            "—"}
                                    </span>
                                    {transfer.member?.email && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "#94a3b8",
                                                display: "block",
                                            }}
                                        >
                                            {transfer.member.email}
                                        </span>
                                    )}
                                    {transfer.member?.telephone && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "#94a3b8",
                                                display: "block",
                                            }}
                                        >
                                            {transfer.member.telephone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Famille d'origine + code_famille */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "8px 12px",
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 7,
                                background: "#faf5ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Users
                                style={{
                                    width: 12,
                                    height: 12,
                                    color: "#9333ea",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#d8b4fe",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    flexShrink: 0,
                                }}
                            >
                                Famille d'origine
                            </span>
                            <div style={{ textAlign: "right", minWidth: 0 }}>
                                {transfer.famille_source?.code_famille && (
                                    <span
                                        className="mono"
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: "#fff",
                                            background: "#9333ea",
                                            borderRadius: 5,
                                            padding: "1px 6px",
                                            marginRight: 6,
                                            display: "inline-block",
                                        }}
                                    >
                                        {transfer.famille_source.code_famille}
                                    </span>
                                )}
                                <span
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: "#7c3aed",
                                        display: "inline",
                                    }}
                                >
                                    {transfer.famille_source?.nom ||
                                        transfer.family?.nom ||
                                        "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trajet */}
                <div style={{ marginBottom: 12 }}>
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
                                {transfer.classe_source?.nom || "—"}
                            </p>
                        </div>
                        <div
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: accent,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: `0 2px 8px ${accent}40`,
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
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
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                background: accentLight,
                                border: `1px solid ${accentMid}`,
                                borderRadius: 8,
                                padding: "7px 10px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: accent,
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
                                    color: accentText,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    margin: 0,
                                }}
                            >
                                {transfer.external_destination ||
                                    transfer.classe_cible?.nom ||
                                    "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Motif */}
                {transfer.reason && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-start",
                            background: "#fafafa",
                            border: "1px dashed #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 11px",
                            marginBottom: 14,
                        }}
                    >
                        <FileText
                            style={{
                                width: 12,
                                height: 12,
                                color: "#94a3b8",
                                marginTop: 2,
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <p
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 2,
                                }}
                            >
                                Motif initial
                            </p>
                            <p
                                style={{
                                    fontSize: 12.5,
                                    color: "#64748b",
                                    fontStyle: "italic",
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                {transfer.reason}
                            </p>
                        </div>
                    </div>
                )}

                {/* Séparateur */}
                <div
                    style={{
                        height: 1,
                        background:
                            "linear-gradient(90deg,transparent,#e2e8f0 30%,#e2e8f0 70%,transparent)",
                        marginBottom: 14,
                    }}
                />

                {/* Actions */}
                {!showRefuseForm ? (
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            className="btn-approve"
                            onClick={doApprove}
                            disabled={isProcessing}
                        >
                            <CheckCircle style={{ width: 16, height: 16 }} />
                            {isProcessing ? "Traitement…" : "Approuver"}
                        </button>
                        <button
                            className="btn-refuse"
                            onClick={() => setShowRefuseForm(true)}
                            disabled={isProcessing}
                        >
                            <XCircle style={{ width: 15, height: 15 }} />
                            Refuser
                        </button>
                    </div>
                ) : (
                    <div
                        className="scale-in"
                        style={{
                            background: "#fff5f5",
                            border: "1.5px solid #fecaca",
                            borderRadius: 12,
                            padding: "13px 14px",
                        }}
                    >
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#991b1b",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 8,
                            }}
                        >
                            Motif du refus{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                        </p>
                        <textarea
                            className="refuse-area"
                            value={refuseReason}
                            onChange={(e) => setRefuseReason(e.target.value)}
                            placeholder="Indiquez la raison du refus…"
                            rows={2}
                            style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                className="btn-cancel-sm"
                                onClick={() => {
                                    setShowRefuseForm(false);
                                    setRefuseReason("");
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-confirm-refuse"
                                onClick={doRefuse}
                                disabled={!refuseReason.trim()}
                            >
                                Confirmer le refus
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
export default function Transfers() {
    const {
        pendingTransfers = [],
        processedTransfers = [],
        userClass = {},
        flash = {},
    } = usePage().props;
    const [activeTab, setActiveTab] = useState("pending");

    const handleApprove = (id) => {
        const t = pendingTransfers.find((x) => x.id === id);
        if (!t) return;
        let url = "";
        if (t.status === "EN_ATTENTE_SOURCE")
            url = `/conducteur/transferts/${id}/approve-source`;
        if (t.status === "EN_ATTENTE_ACCUEIL")
            url = `/conducteur/transferts/${id}/approve-accueil`;
        if (url) router.post(url, {}, { preserveScroll: true });
    };

    const handleRefuse = (id, reason) =>
        router.post(
            withBasePath("", `/conducteur/transferts/${id}/refuse`),
            { reason },
            { preserveScroll: true },
        );

    const pendingByStatus = useMemo(
        () => ({
            source: pendingTransfers.filter(
                (t) => t.status === "EN_ATTENTE_SOURCE",
            ),
            accueil: pendingTransfers.filter(
                (t) => t.status === "EN_ATTENTE_ACCUEIL",
            ),
        }),
        [pendingTransfers],
    );

    return (
        <>
            <style>{fontStyle}</style>

            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg,#6B46C1 0%,#1E40AF 50%,#B6C01A 100%)",
                    padding: "36px 24px",
                }}
            >
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    {/* HEADER */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 32,
                        }}
                    >
                        <div className="fade-up">
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.5)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 6,
                                }}
                            >
                                Tableau de validation
                            </p>
                            <h1
                                style={{
                                    fontSize: 32,
                                    fontWeight: 800,
                                    color: "#fff",
                                    lineHeight: 1.1,
                                    marginBottom: 6,
                                }}
                            >
                                Gestion des Transferts
                            </h1>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <Building2
                                    style={{
                                        width: 14,
                                        height: 14,
                                        color: "rgba(255,255,255,0.5)",
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 14,
                                        color: "rgba(255,255,255,0.65)",
                                        margin: 0,
                                    }}
                                >
                                    Classe :{" "}
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: "#fff",
                                        }}
                                    >
                                        {userClass.nom || "—"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {pendingTransfers.length > 0 && (
                            <div
                                className="fade-up"
                                style={{
                                    animationDelay: "80ms",
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    borderRadius: 14,
                                    padding: "10px 18px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: "#f97316",
                                        animation: "pulseRing 2s infinite",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        color: "#fff",
                                    }}
                                >
                                    {pendingTransfers.length} en attente
                                </span>
                            </div>
                        )}
                    </div>

                    {/* FLASH */}
                    {(flash.success || flash.error) && (
                        <div style={{ marginBottom: 20 }} className="flash-in">
                            {flash.success && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: "rgba(34,197,94,0.12)",
                                        border: "1px solid rgba(34,197,94,0.3)",
                                        color: "#fff",
                                        borderRadius: 11,
                                        padding: "12px 16px",
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        backdropFilter: "blur(8px)",
                                    }}
                                >
                                    <CheckCircle
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: "#86efac",
                                        }}
                                    />
                                    {flash.success}
                                </div>
                            )}
                            {flash.error && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: "rgba(239,68,68,0.12)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        color: "#fff",
                                        borderRadius: 11,
                                        padding: "12px 16px",
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        backdropFilter: "blur(8px)",
                                        marginTop: flash.success ? 8 : 0,
                                    }}
                                >
                                    <AlertCircle
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: "#fca5a5",
                                        }}
                                    />
                                    {flash.error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STATS */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3,1fr)",
                            gap: 16,
                            marginBottom: 28,
                        }}
                    >
                        <StatCard
                            title="Attente Source"
                            value={pendingByStatus.source.length}
                            icon={ShieldCheck}
                            iconBg="#FEF3C7"
                            iconColor="#D97706"
                            delay={0}
                        />
                        <StatCard
                            title="Attente Accueil"
                            value={pendingByStatus.accueil.length}
                            icon={MapPin}
                            iconBg="#ECFEFF"
                            iconColor="#0891B2"
                            delay={60}
                        />
                        <StatCard
                            title="Traitées"
                            value={processedTransfers.length}
                            icon={CheckCircle}
                            iconBg="#DCFCE7"
                            iconColor="#16A34A"
                            delay={120}
                        />
                    </div>

                    {/* TABS */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                        {[
                            {
                                key: "pending",
                                label: "En cours",
                                icon: Clock,
                                count: pendingTransfers.length,
                                countBg: "#f97316",
                            },
                            {
                                key: "processed",
                                label: "Historique",
                                icon: History,
                                count: processedTransfers.length,
                                countBg: "#64748b",
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                className={`tab-btn ${activeTab === tab.key ? "tab-active" : "tab-inactive"}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <tab.icon style={{ width: 15, height: 15 }} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span
                                        style={{
                                            background:
                                                activeTab === tab.key
                                                    ? tab.countBg
                                                    : "rgba(255,255,255,0.22)",
                                            color: "#fff",
                                            borderRadius: 20,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: "1px 7px",
                                        }}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* CONTENU */}
                    {activeTab === "pending" ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 32,
                            }}
                        >
                            {/* Source */}
                            {pendingByStatus.source.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 3,
                                                height: 24,
                                                borderRadius: 2,
                                                background:
                                                    "linear-gradient(180deg,#f59e0b,#d97706)",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <h2
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: "#fff",
                                                margin: 0,
                                            }}
                                        >
                                            Étape 1 — Validation Source
                                        </h2>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background:
                                                    "rgba(245,158,11,0.2)",
                                                color: "#fde68a",
                                                border: "1px solid rgba(245,158,11,0.3)",
                                                borderRadius: 20,
                                                padding: "2px 9px",
                                                letterSpacing: "0.03em",
                                            }}
                                        >
                                            {pendingByStatus.source.length}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(2,1fr)",
                                            gap: 18,
                                        }}
                                    >
                                        {pendingByStatus.source.map((t, i) => (
                                            <TransferCard
                                                key={t.id}
                                                transfer={t}
                                                onApprove={handleApprove}
                                                onRefuse={handleRefuse}
                                                delay={i * 50}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Accueil */}
                            {pendingByStatus.accueil.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 3,
                                                height: 24,
                                                borderRadius: 2,
                                                background:
                                                    "linear-gradient(180deg,#06b6d4,#0891b2)",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <h2
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: "#fff",
                                                margin: 0,
                                            }}
                                        >
                                            Étape 2 — Validation Accueil
                                        </h2>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background:
                                                    "rgba(6,182,212,0.2)",
                                                color: "#a5f3fc",
                                                border: "1px solid rgba(6,182,212,0.3)",
                                                borderRadius: 20,
                                                padding: "2px 9px",
                                                letterSpacing: "0.03em",
                                            }}
                                        >
                                            {pendingByStatus.accueil.length}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(2,1fr)",
                                            gap: 18,
                                        }}
                                    >
                                        {pendingByStatus.accueil.map((t, i) => (
                                            <TransferCard
                                                key={t.id}
                                                transfer={t}
                                                onApprove={handleApprove}
                                                onRefuse={handleRefuse}
                                                delay={i * 50}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vide */}
                            {pendingTransfers.length === 0 && (
                                <div className="empty-state fade-up">
                                    <div
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            borderRadius: "50%",
                                            padding: 20,
                                            marginBottom: 18,
                                        }}
                                    >
                                        <CheckCircle
                                            style={{
                                                width: 36,
                                                height: 36,
                                                color: "rgba(255,255,255,0.5)",
                                            }}
                                        />
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 17,
                                            fontWeight: 700,
                                            color: "#fff",
                                            marginBottom: 6,
                                        }}
                                    >
                                        Aucune demande en attente
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.5)",
                                            maxWidth: 280,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Le flux de validation est vide. Vous
                                        êtes à jour.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* HISTORIQUE */
                        <div
                            className="fade-up"
                            style={{
                                background: "#fff",
                                borderRadius: 18,
                                border: "1px solid #e8edf3",
                                boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <History
                                        style={{
                                            width: 16,
                                            height: 16,
                                            color: "#94a3b8",
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                        }}
                                    >
                                        Historique des transferts
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#94a3b8",
                                    }}
                                >
                                    {processedTransfers.length} entrées
                                </span>
                            </div>

                            {processedTransfers.length === 0 ? (
                                <div
                                    style={{
                                        padding: "60px 24px",
                                        textAlign: "center",
                                        color: "#94a3b8",
                                        fontSize: 14,
                                    }}
                                >
                                    Aucun historique disponible.
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="hist-table">
                                        <thead>
                                            <tr>
                                                <th>Bénéficiaire</th>
                                                <th>Trajet</th>
                                                <th>Date</th>
                                                <th
                                                    style={{
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Statut
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {processedTransfers.map((t) => (
                                                <tr key={t.id}>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 11,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    borderRadius: 9,
                                                                    flexShrink: 0,
                                                                    background:
                                                                        t.status ===
                                                                        "REFUSEE"
                                                                            ? "#fee2e2"
                                                                            : "#f0fdf4",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    fontSize: 13,
                                                                    fontWeight: 700,
                                                                    color:
                                                                        t.status ===
                                                                        "REFUSEE"
                                                                            ? "#dc2626"
                                                                            : "#16a34a",
                                                                    border: `1px solid ${t.status === "REFUSEE" ? "#fca5a5" : "#86efac"}`,
                                                                }}
                                                            >
                                                                {t.type ===
                                                                "member" ? (
                                                                    (
                                                                        t.member
                                                                            ?.name ||
                                                                        "?"
                                                                    )
                                                                        .charAt(
                                                                            0,
                                                                        )
                                                                        .toUpperCase()
                                                                ) : (
                                                                    <Users
                                                                        style={{
                                                                            width: 15,
                                                                            height: 15,
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p
                                                                    style={{
                                                                        fontWeight: 700,
                                                                        color: "#0f172a",
                                                                        fontSize: 13.5,
                                                                        margin: 0,
                                                                        marginBottom: 2,
                                                                    }}
                                                                >
                                                                    {t.member
                                                                        ?.name ||
                                                                        t.family
                                                                            ?.name}
                                                                </p>
                                                                <p
                                                                    className="mono"
                                                                    style={{
                                                                        fontSize: 10.5,
                                                                        color: "#94a3b8",
                                                                        margin: 0,
                                                                    }}
                                                                >
                                                                    {
                                                                        t.reference
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 7,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: "#64748b",
                                                                    fontSize: 13,
                                                                }}
                                                            >
                                                                {
                                                                    t
                                                                        .classe_source
                                                                        ?.nom
                                                                }
                                                            </span>
                                                            <div
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    borderRadius:
                                                                        "50%",
                                                                    background:
                                                                        "#f1f5f9",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <ArrowRight
                                                                    style={{
                                                                        width: 11,
                                                                        height: 11,
                                                                        color: "#94a3b8",
                                                                    }}
                                                                />
                                                            </div>
                                                            <span
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: "#0f172a",
                                                                    fontSize: 13,
                                                                }}
                                                            >
                                                                {t.external_destination ||
                                                                    t
                                                                        .classe_cible
                                                                        ?.nom ||
                                                                    "—"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="mono"
                                                            style={{
                                                                fontSize: 12,
                                                                color: "#94a3b8",
                                                            }}
                                                        >
                                                            {t.created_at}
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        <StatusBadge
                                                            status={t.status}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
