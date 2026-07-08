import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    ArrowLeft,
    Download,
    Plus,
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Wallet,
    CreditCard,
    Send,
    FileText,
    BarChart3,
    X,
    Check,
    Clock,
} from "lucide-react";

const C = {
    teal: {
        from: "#1E40AF",
        mid: "#3B82F6",
        light: "#93C5FD",
        pale: "#EFF6FF",
    },
    blue: {
        from: "#1E3A8A",
        mid: "#2563EB",
        light: "#60A5FA",
        pale: "#EAF2FF",
    },
    amber: {
        from: "#8A6A0A",
        mid: "#B6C01A",
        light: "#D4AF37",
        pale: "#FFFBEA",
    },
    red: { from: "#7F1D1D", mid: "#B91C1C", light: "#EF4444", pale: "#FEECEC" },
    purple: {
        from: "#5B21B6",
        mid: "#6B46C1",
        light: "#A78BFA",
        pale: "#F3EFFF",
    },
    gray: {
        from: "#334155",
        mid: "#64748B",
        light: "#CBD5E1",
        pale: "#F8FAFC",
    },
};

const Pill = ({ color = "blue", children }) => {
    const c = C[color] || C.blue;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                background: `linear-gradient(135deg,${c.pale},${c.light}30)`,
                color: c.from,
                border: `1px solid ${c.light}40`,
            }}
        >
            {children}
        </span>
    );
};

const GradBtn = ({
    onClick,
    disabled,
    loading,
    color = "teal",
    children,
    icon: Icon,
    full,
    sm,
}) => {
    const c = C[color] || C.teal;
    const [h, setH] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setH(true)}
            onMouseLeave={() => setH(false)}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: sm ? "7px 14px" : "10px 20px",
                width: full ? "100%" : "auto",
                borderRadius: 10,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                background: disabled
                    ? `${c.light}40`
                    : `linear-gradient(135deg,${c.from},${c.mid})`,
                color: disabled ? c.mid : "#fff",
                fontWeight: 700,
                fontSize: sm ? 11 : 13,
                fontFamily: "inherit",
                boxShadow: disabled ? "none" : `0 4px 16px ${c.mid}45`,
                opacity: h && !disabled ? 0.9 : 1,
                transition: "opacity .15s",
            }}
        >
            {Icon && <Icon size={sm ? 13 : 15} />}
            {loading ? "Traitement…" : children}
        </button>
    );
};

const OutlineBtn = ({
    onClick,
    color = "teal",
    children,
    icon: Icon,
    sm,
    disabled,
}) => {
    const c = C[color] || C.teal;
    const [h, setH] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setH(true)}
            onMouseLeave={() => setH(false)}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: sm ? "5px 11px" : "8px 16px",
                borderRadius: 9,
                border: `1.5px solid ${c.light}`,
                background: h && !disabled ? c.pale : "transparent",
                color: c.mid,
                fontWeight: 700,
                fontSize: sm ? 11 : 12,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.65 : 1,
                transition: "background .15s",
                fontFamily: "inherit",
            }}
        >
            {Icon && <Icon size={sm ? 12 : 14} />}
            {children}
        </button>
    );
};

const inputStyle = {
    padding: "10px 13px",
    borderRadius: 9,
    fontSize: 13,
    border: "1.5px solid #D3D1C7",
    background: "#fff",
    color: "#2C2C2A",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
};
const FW = ({ label, span2, children }) => (
    <div
        style={{
            gridColumn: span2 ? "1/-1" : "auto",
            display: "flex",
            flexDirection: "column",
            gap: 5,
        }}
    >
        {label && (
            <label
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#5F5E5A",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                }}
            >
                {label}
            </label>
        )}
        {children}
    </div>
);
const FInput = ({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
    span2,
}) => (
    <FW label={label} span2={span2}>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#6B46C1")}
            onBlur={(e) => (e.target.style.borderColor = "#D3D1C7")}
        />
    </FW>
);
const FSelect = ({ label, value, onChange, children, span2 }) => (
    <FW label={label} span2={span2}>
        <select
            value={value}
            onChange={onChange}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => (e.target.style.borderColor = "#6B46C1")}
            onBlur={(e) => (e.target.style.borderColor = "#D3D1C7")}
        >
            {children}
        </select>
    </FW>
);
const FTextarea = ({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
    span2,
}) => (
    <FW label={label} span2={span2}>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = "#6B46C1")}
            onBlur={(e) => (e.target.style.borderColor = "#D3D1C7")}
        />
    </FW>
);

const Card = ({ children, style = {} }) => (
    <div
        style={{
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #E8E6DF",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            padding: "20px 22px",
            ...style,
        }}
    >
        {children}
    </div>
);
const SecTitle = ({ accent = "teal", children, right }) => {
    const c = C[accent] || C.teal;
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                    style={{
                        width: 4,
                        height: 18,
                        borderRadius: 2,
                        background: `linear-gradient(180deg,${c.mid},${c.from})`,
                    }}
                />
                <span
                    style={{ fontSize: 14, fontWeight: 800, color: "#2C2C2A" }}
                >
                    {children}
                </span>
            </div>
            {right && <div>{right}</div>}
        </div>
    );
};
const FormGrid = ({ children, cols = 2 }) => (
    <div
        style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols},1fr)`,
            gap: 14,
            padding: "18px 20px",
            background: "#F9F8F5",
            borderRadius: 14,
            border: "1px solid #E8E6DF",
            marginBottom: 20,
        }}
    >
        {children}
    </div>
);
const ProgressBar = ({ value, color = "teal", showPct = true }) => {
    const c = C[color] || C.teal;
    const pct = Math.min(100, Math.max(0, value || 0));
    return (
        <div>
            <div
                style={{
                    height: 8,
                    background: "#F1EFE8",
                    borderRadius: 4,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 4,
                        background: `linear-gradient(90deg,${c.from},${c.light})`,
                        transition: "width .6s ease",
                    }}
                />
            </div>
            {showPct && (
                <p
                    style={{
                        textAlign: "right",
                        fontSize: 10,
                        color: "#888780",
                        marginTop: 3,
                        fontWeight: 600,
                    }}
                >
                    {pct}%
                </p>
            )}
        </div>
    );
};

const Table = ({ heads, rows, empty = "Aucune donnée disponible." }) => (
    <div
        style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #E8E6DF",
        }}
    >
        <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
            <thead>
                <tr
                    style={{
                        background: "linear-gradient(90deg,#F3EFFF,#EAF2FF)",
                    }}
                >
                    {heads.map((h, i) => (
                        <th
                            key={i}
                            style={{
                                padding: "11px 16px",
                                textAlign: h.right
                                    ? "right"
                                    : h.center
                                      ? "center"
                                      : "left",
                                fontSize: 10,
                                fontWeight: 800,
                                color: "#6B7280",
                                textTransform: "uppercase",
                                letterSpacing: ".6px",
                                borderBottom: "1px solid #E8E6DF",
                            }}
                        >
                            {h.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td
                            colSpan={heads.length}
                            style={{
                                textAlign: "center",
                                padding: "32px 16px",
                                color: "#B4B2A9",
                                fontSize: 13,
                            }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>
                                🗂️
                            </div>
                            {empty}
                        </td>
                    </tr>
                ) : (
                    rows
                )}
            </tbody>
        </table>
    </div>
);
const Tr = ({ children, highlight }) => {
    const [h, setH] = useState(false);
    return (
        <tr
            onMouseEnter={() => setH(true)}
            onMouseLeave={() => setH(false)}
            style={{
                borderBottom: "1px solid #F1EFE8",
                background: highlight ? "#FFFBF0" : h ? "#F9F8F5" : "#fff",
                transition: "background .15s",
            }}
        >
            {children}
        </tr>
    );
};
const Td = ({ children, right, center, bold, color }) => {
    const clr =
        { green: "#27500A", red: "#791F1F", amber: "#633806", blue: "#042C53" }[
            color
        ] || "#2C2C2A";
    return (
        <td
            style={{
                padding: "11px 16px",
                textAlign: right ? "right" : center ? "center" : "left",
                fontWeight: bold ? 700 : 400,
                color: clr,
                fontSize: 13,
            }}
        >
            {children}
        </td>
    );
};

const Modal = ({ open, onClose, title, children, width = 520 }) => {
    if (!open) return null;
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(15,15,15,0.55)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 20,
                    width: "100%",
                    maxWidth: width,
                    maxHeight: "90vh",
                    overflow: "auto",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 22px",
                        borderBottom: "1px solid #E8E6DF",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 1,
                    }}
                >
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#2C2C2A",
                        }}
                    >
                        {title}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "none",
                            background: "#F1EFE8",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={16} color="#5F5E5A" />
                    </button>
                </div>
                <div style={{ padding: "20px 22px" }}>{children}</div>
            </div>
        </div>
    );
};

const KpiCard = ({ icon: Icon, label, value, sub, color, trend }) => {
    const c = C[color] || C.teal;
    return (
        <div
            style={{
                background: "rgba(255,255,255,0.92)",
                borderRadius: 12,
                padding: "18px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 10px 25px rgba(15,23,42,0.16)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: -25,
                    right: -25,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `${c.pale}`,
                }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: `linear-gradient(135deg,${c.from},${c.mid})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                    }}
                >
                    <Icon size={18} color="#fff" strokeWidth={2.2} />
                </div>
                <p
                    style={{
                        fontSize: 10,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: ".8px",
                        marginBottom: 4,
                        fontWeight: 700,
                    }}
                >
                    {label}
                </p>
                <p
                    style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#1F2937",
                        lineHeight: 1,
                        marginBottom: 3,
                    }}
                >
                    {value}
                </p>
                {sub && <p style={{ fontSize: 11, color: "#6B7280" }}>{sub}</p>}
                {trend && (
                    <div
                        style={{
                            marginTop: 8,
                            fontSize: 10,
                            color: c.mid,
                            fontWeight: 700,
                        }}
                    >
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};

const fmt = (v) => Number(v || 0).toLocaleString("fr-FR") + " F";
const modePill = (mode) => {
    const map = {
        MOBILE_MONEY: { color: "purple", label: "Mobile Money" },
        ESPECES: { color: "amber", label: "Espèces" },
        VIREMENT: { color: "blue", label: "Virement" },
    };
    const m = map[mode] || { color: "gray", label: mode };
    return <Pill color={m.color}>{m.label}</Pill>;
};
const paginate = (arr, page, size) => arr.slice((page - 1) * size, page * size);
const Pagination = ({ page, total, onChange }) => (
    <div
        style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 12,
        }}
    >
        <button
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #D6D3D1",
                background: "#fff",
                cursor: page === 1 ? "not-allowed" : "pointer",
                fontSize: 12,
            }}
        >
            Précédent
        </button>
        <span style={{ fontSize: 12, color: "#6B7280", alignSelf: "center" }}>
            Page {page}/{total}
        </span>
        <button
            onClick={() => onChange(Math.min(total, page + 1))}
            disabled={page === total}
            style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #D6D3D1",
                background: "#fff",
                cursor: page === total ? "not-allowed" : "pointer",
                fontSize: 12,
            }}
        >
            Suivant
        </button>
    </div>
);

export default function ConducteurTresorerie({
    classInfo = {},
    stats = {},
    famillesSuivi = [],
    famillesEnRetard = [],
    paiementsRecents = [],
    paiementsParFamille = [],
    collectesClasse = [],
    donsClasse = [],
    cotisationsCreees = [],
    cotisationsPaiement = [],
    fimecoSuivi = [],
    membresClasse = [],
    tresorierClasse = null,
    notificationsFinancieres = [],
}) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [modalPaiement, setModalPaiement] = useState(null);
    const [modalRappel, setModalRappel] = useState(null);
    const [modalMembresFamille, setModalMembresFamille] = useState(null);
    const [modalCotisation, setModalCotisation] = useState(false);
    const [modalCollecte, setModalCollecte] = useState(false);
    const [modalTresorier, setModalTresorier] = useState(false);
    const [modalVoirCotisation, setModalVoirCotisation] = useState(null);
    const [modalEditCotisation, setModalEditCotisation] = useState(false);
    const [modalDeleteCotisation, setModalDeleteCotisation] = useState(null);
    const [modalDon, setModalDon] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedMemberTresorier, setSelectedMemberTresorier] = useState("");
    const [motifRetraitTresorier, setMotifRetraitTresorier] = useState("");
    const [newCotisation, setNewCotisation] = useState({
        nom: "",
        periodicite: "MENSUEL",
        target_scope: "INDIVIDUELLE",
        ciblage: "AUCUN",
        montant: "",
        montants: { F: "", M: "", TRAVAILLEUR: "", RETRAITE: "", SANS_EMPLOI: "", ETUDIANT: "", ENFANT: "" },
        description: "",
        date_debut: new Date().toISOString().slice(0, 10),
        date_fin: "",
        date_echeance: "",
        late_after_days: 2,
    });
    const [editCotisation, setEditCotisation] = useState(null);
    const [newCollecte, setNewCollecte] = useState({
        titre: "",
        objectif_montant: "",
        date_debut: "",
        date_fin: "",
        description: "",
    });
    const [newDon, setNewDon] = useState({
        montant: "",
        type: "LIBRE",
        mode_paiement: "MOBILE_MONEY",
        date_don: new Date().toISOString().slice(0, 10),
        note: "",
    });
    const [paymentForm, setPaymentForm] = useState({
        user_id: "",
        cotisation_id: "",
        montant: "",
        mode_paiement: "MOBILE_MONEY",
        date_paiement: new Date().toISOString().slice(0, 10),
        note: "",
    });
    const [rappelMsg, setRappelMsg] = useState("");
    const [recentPage, setRecentPage] = useState(1);
    const [fimecoPage, setFimecoPage] = useState(1);
    const [famillesPage, setFamillesPage] = useState(1);
    const [donsPage, setDonsPage] = useState(1);

    const csrf = () => {
        const t = document.querySelector('meta[name="csrf-token"]');
        return t ? t.getAttribute("content") : "";
    };
    const postJson = async (url, payload, method = "POST") => {
        const r = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrf(),
                Accept: "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });
        if (!r.ok) {
            let d = "";
            try {
                const b = await r.json();
                const validationDetails = b?.errors
                    ? Object.values(b.errors).flat().filter(Boolean).join(" | ")
                    : "";
                if (validationDetails) {
                    d = ` (${validationDetails})`;
                } else {
                    d = b.message ? ` (${b.message})` : "";
                }
            } catch {}
            throw new Error(`Action impossible${d}`);
        }
        return r.json();
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const reloadWithToast = (message, type = "success") => {
        showToast(message, type);
        setTimeout(() => window.location.reload(), 700);
    };

    const buildRules = (ciblage, montants) => {
        const rules = [];
        if (ciblage === "GENRE") {
            if (Number(montants.F) >= 100) rules.push({ type: "GENRE", value: "F", amount: Number(montants.F), priority: 1 });
            if (Number(montants.M) >= 100) rules.push({ type: "GENRE", value: "M", amount: Number(montants.M), priority: 2 });
            if (Number(montants.ENFANT) >= 100) rules.push({ type: "ENFANT", value: "ENFANT", amount: Number(montants.ENFANT), priority: 3 });
        } else if (ciblage === "EMPLOI") {
            if (Number(montants.TRAVAILLEUR) >= 100) rules.push({ type: "EMPLOI", value: "TRAVAILLEUR", amount: Number(montants.TRAVAILLEUR), priority: 1 });
            if (Number(montants.RETRAITE) >= 100) rules.push({ type: "EMPLOI", value: "RETRAITE", amount: Number(montants.RETRAITE), priority: 2 });
            if (Number(montants.SANS_EMPLOI) >= 100) rules.push({ type: "EMPLOI", value: "SANS_EMPLOI", amount: Number(montants.SANS_EMPLOI), priority: 3 });
            if (Number(montants.ETUDIANT) >= 100) rules.push({ type: "EMPLOI", value: "ETUDIANT", amount: Number(montants.ETUDIANT), priority: 4 });
            if (Number(montants.ENFANT) >= 100) rules.push({ type: "ENFANT", value: "ENFANT", amount: Number(montants.ENFANT), priority: 5 });
        }
        return rules;
    };

    const parseRulesToMontants = (rawRules) => {
        const rules = Array.isArray(rawRules) ? rawRules : [];
        const montants = { F: "", M: "", TRAVAILLEUR: "", RETRAITE: "", SANS_EMPLOI: "", ETUDIANT: "", ENFANT: "" };
        const hasGenre = rules.some((r) => String(r?.type || "").toUpperCase() === "GENRE");
        const hasEmploi = rules.some((r) => String(r?.type || "").toUpperCase() === "EMPLOI");
        let ciblage = "AUCUN";
        if (hasGenre) {
            ciblage = "GENRE";
            for (const r of rules) {
                const type = String(r?.type || "").toUpperCase();
                const value = String(r?.value || r?.option || "").toUpperCase();
                const amount = String(r?.amount || "");
                if (type === "GENRE" && value === "F") montants.F = amount;
                if (type === "GENRE" && value === "M") montants.M = amount;
                if (type === "ENFANT") montants.ENFANT = amount;
            }
        } else if (hasEmploi) {
            ciblage = "EMPLOI";
            for (const r of rules) {
                const type = String(r?.type || "").toUpperCase();
                const value = String(r?.value || r?.option || "").toUpperCase();
                const amount = String(r?.amount || "");
                if (type === "EMPLOI" && value === "TRAVAILLEUR") montants.TRAVAILLEUR = amount;
                if (type === "EMPLOI" && value === "RETRAITE") montants.RETRAITE = amount;
                if (type === "EMPLOI" && value === "SANS_EMPLOI") montants.SANS_EMPLOI = amount;
                if (type === "EMPLOI" && value === "ETUDIANT") montants.ETUDIANT = amount;
                if (type === "ENFANT") montants.ENFANT = amount;
            }
        }
        return { ciblage, montants };
    };

    const handleCreateCotisation = async () => {
        const { ciblage, montant, montants } = newCotisation;
        const rules = buildRules(ciblage, montants || {});

        if (!newCotisation.nom.trim()) {
            showToast("Nom de cotisation requis.", "error");
            return;
        }

        if (ciblage === "AUCUN" && Number(montant) < 100) {
            showToast("Le montant doit être au moins 100 F CFA.", "error");
            return;
        }

        if ((ciblage === "GENRE" || ciblage === "EMPLOI") && rules.length === 0) {
            showToast("Au moins une catégorie doit avoir un montant >= 100 F CFA.", "error");
            return;
        }

        if (newCotisation.date_fin && newCotisation.date_debut && newCotisation.date_fin < newCotisation.date_debut) {
            showToast("La date de fin doit être postérieure ou égale à la date de début.", "error");
            return;
        }

        const fallbackMontant = ciblage === "AUCUN"
            ? Number(montant)
            : rules.length > 0
                ? Math.min(...rules.map((r) => Number(r.amount)))
                : 100;

        setLoading(true);
        try {
            await postJson(withBasePath("", "/conducteur/tresorerie/cotisations"), {
                nom: newCotisation.nom,
                periodicite: newCotisation.periodicite,
                target_scope: newCotisation.target_scope,
                description: newCotisation.description,
                date_debut: newCotisation.date_debut,
                date_fin: newCotisation.date_fin || null,
                date_echeance: newCotisation.date_echeance || null,
                late_after_days: Number(newCotisation.late_after_days || 2),
                montant: fallbackMontant,
                target_rules: rules,
            });
            reloadWithToast("Cotisation créée avec succès.");
            setModalCotisation(false);
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setLoading(false);
        }
    };
    const handleUpdateCotisation = async () => {
        if (!editCotisation?.id) return;

        const ciblage = editCotisation.ciblage || "AUCUN";
        const montant = editCotisation.montant || "";
        const montants = editCotisation.montants || {};
        const rules = buildRules(ciblage, montants);

        if (!String(editCotisation.nom || "").trim()) {
            alert("Nom de cotisation requis.");
            return;
        }

        if (ciblage === "AUCUN" && Number(montant) < 100) {
            alert("Le montant doit être au moins 100 F CFA.");
            return;
        }

        if ((ciblage === "GENRE" || ciblage === "EMPLOI") && rules.length === 0) {
            alert("Au moins une catégorie doit avoir un montant >= 100 F CFA.");
            return;
        }

        if (editCotisation.date_fin && editCotisation.date_debut && editCotisation.date_fin < editCotisation.date_debut) {
            alert("La date de fin doit être postérieure ou égale à la date de début.");
            return;
        }

        const fallbackMontant = ciblage === "AUCUN"
            ? Number(montant)
            : rules.length > 0
                ? Math.min(...rules.map((r) => Number(r.amount)))
                : 100;

        setLoading(true);
        try {
            await postJson(
                `/conducteur/tresorerie/cotisations/${editCotisation.id}`,
                {
                    nom: editCotisation.nom,
                    periodicite: editCotisation.periodicite,
                    description: editCotisation.description,
                    date_debut: editCotisation.date_debut || null,
                    date_fin: editCotisation.date_fin || null,
                    late_after_days: Number(editCotisation.late_after_days || 2),
                    target_scope: "INDIVIDUELLE",
                    montant: fallbackMontant,
                    target_rules: rules,
                },
                "PUT",
            );
            reloadWithToast("Cotisation modifiée avec succès.");
            setModalEditCotisation(false);
            setEditCotisation(null);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteCotisation = async (c) => {
        setLoading(true);
        try {
            await postJson(
                `/conducteur/tresorerie/cotisations/${c.id}`,
                {},
                "DELETE",
            );
            reloadWithToast("Cotisation supprimée avec succès.");
            setModalDeleteCotisation(null);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };
    const handleCreateCollecte = async () => {
        const objectif = Number(newCollecte.objectif_montant || 0);
        if (!newCollecte.titre.trim() || objectif < 1000) {
            alert("Titre et objectif valide requis (min 1000).");
            return;
        }
        setLoading(true);
        try {
            await postJson(withBasePath("", "/conducteur/tresorerie/collectes"), {
                ...newCollecte,
                objectif_montant: objectif,
            });
            reloadWithToast("Collecte créée avec succès.");
            setModalCollecte(false);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };
    const handlePaiement = async () => {
        const montant = Number(paymentForm.montant || 0);
        if (!paymentForm.user_id || montant < 100) {
            alert("Membre et montant valide requis.");
            return;
        }
        setLoading(true);
        try {
            await postJson(withBasePath("", "/conducteur/tresorerie/paiements"), {
                ...paymentForm,
                user_id: Number(paymentForm.user_id),
                cotisation_id: paymentForm.cotisation_id
                    ? Number(paymentForm.cotisation_id)
                    : null,
                montant,
            });
            reloadWithToast("Paiement enregistré avec succès.");
            setModalPaiement(null);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDon = async () => {
        const montant = Number(newDon.montant || 0);
        if (montant < 100) {
            alert("Montant de don invalide (minimum 100).");
            return;
        }

        setLoading(true);
        try {
            await postJson(withBasePath("", "/conducteur/tresorerie/dons"), {
                montant,
                type: newDon.type,
                mode_paiement: newDon.mode_paiement,
                date_don: newDon.date_don,
                note: newDon.note,
            });
            reloadWithToast("Don enregistré avec succès.");
            setModalDon(false);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedMember = useMemo(
        () =>
            membresClasse.find(
                (m) => String(m.id) === String(paymentForm.user_id),
            ),
        [membresClasse, paymentForm.user_id],
    );

    const selectedCotisation = useMemo(
        () =>
            cotisationsPaiement.find(
                (c) => String(c.id) === String(paymentForm.cotisation_id),
            ),
        [cotisationsPaiement, paymentForm.cotisation_id],
    );

    const paymentSummary = useMemo(() => {
        if (!selectedMember || !selectedCotisation) {
            return null;
        }

        const rules = Array.isArray(selectedCotisation.target_rules)
            ? selectedCotisation.target_rules
            : [];

        let expected = Number(selectedCotisation.montant || 0);
        for (const rule of rules) {
            const type = String(rule?.type || "").toUpperCase();
            const value = String(rule?.value || "").toUpperCase();
            const amount = Number(rule?.amount || 0);
            if (amount < 100) continue;

            if (type === "ENFANT" && selectedMember.role === "membre_famille") {
                expected = amount;
                break;
            }
            if (
                type === "GENRE" &&
                String(selectedMember.genre || "").toUpperCase() === value
            ) {
                expected = amount;
                break;
            }
            if (
                type === "EMPLOI" &&
                String(selectedMember.employment_status || "").toUpperCase() ===
                    value
            ) {
                expected = amount;
                break;
            }
        }

        const paid = Number(selectedMember.totalPaye || 0);
        const remaining = Math.max(0, expected - paid);

        return {
            expected,
            paid,
            remaining,
            dueDate: selectedCotisation.date_echeance || null,
            lateAfterDays: Number(selectedCotisation.late_after_days || 2),
        };
    }, [selectedCotisation, selectedMember]);


    const targetLabel = (type) => {
        const key = String(type || "").toUpperCase();
        if (key === "GENRE") return "Genre";
        if (key === "EMPLOI") return "Statut d'emploi";
        if (key === "ENFANT") return "Enfant";
        return "-";
    };

    const optionLabel = (type, value) => {
        const t = String(type || "").toUpperCase();
        const v = String(value || "").toUpperCase();

        if (v === "ENFANT" || v === "MEMBRE_FAMILLE") return "Enfant";

        if (t === "GENRE") {
            if (v === "M") return "Homme";
            if (v === "F") return "Femme";
        }

        if (t === "EMPLOI") {
            if (v === "TRAVAILLEUR") return "Travailleur";
            if (v === "RETRAITE") return "Retraité";
            if (v === "SANS_EMPLOI") return "Sans emploi";
            if (v === "ETUDIANT") return "Étudiant";
        }

        return value || "-";
    };

    const rulesForDisplay = (cotisation) => {
        const rules = Array.isArray(cotisation?.target_rules)
            ? cotisation.target_rules
            : [];

        return rules.flatMap((rule, index) => {
            const type = String(rule?.type || rule?.target || "").toUpperCase();
            const amount = Number(rule?.amount || 0);
            const priority = Number(rule?.priority || index + 1);
            const rawValues =
                Array.isArray(rule?.values) && rule.values.length
                    ? rule.values
                    : [rule?.option ?? rule?.value];

            return rawValues
                .map((v) =>
                    String(v || "")
                        .toUpperCase()
                        .trim(),
                )
                .filter(Boolean)
                .map((value) => ({ type, value, amount, priority }));
        });
    };

    const cotisationTargetSummary = (cotisation) => {
        const rules = rulesForDisplay(cotisation);
        if (rules.length === 0) return "-";

        const hasGenre = rules.some((r) => r.type === "GENRE");
        const hasEmploi = rules.some((r) => r.type === "EMPLOI");
        const hasEnfant = rules.some(
            (r) => r.type === "ENFANT" || r.value === "MEMBRE_FAMILLE",
        );

        const labels = [];
        if (hasGenre) labels.push("Genre");
        if (hasEmploi) labels.push("Statut d'emploi");
        if (!hasGenre && !hasEmploi && hasEnfant) labels.push("Enfant");

        return labels.join(" / ");
    };

    const openEditCotisation = (c) => {
        const { ciblage, montants } = parseRulesToMontants(c.target_rules);
        const resolvedMontant = ciblage === "AUCUN" ? String(c.montant || "") : "";

        setEditCotisation({
            id: c.id,
            nom: c.nom || "",
            periodicite: c.periodicite || "MENSUEL",
            description: c.description || "",
            date_debut: c.date_debut || new Date().toISOString().slice(0, 10),
            date_fin: c.date_fin || "",
            late_after_days: Number(c.late_after_days || 2),
            ciblage,
            montant: resolvedMontant,
            montants,
        });
        setModalEditCotisation(true);
    };
    const handleEnvoyerRappel = async (famille) => {
        const msg =
            rappelMsg ||
            `Bonjour famille ${famille.nom}, votre cotisation est en retard. Merci de régulariser.`;
        setLoading(true);
        try {
            await postJson(withBasePath("", "/conducteur/tresorerie/rappels"), {
                famille_id: famille.id,
                message: msg,
            });
            showToast(`Rappel envoyé à ${famille.nom}.`);
            setModalRappel(null);
            setRappelMsg("");
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };
    const handleExport = (format) =>
        window.open(
            withBasePath("", `/conducteur/tresorerie/export?format=${format}`),
            "_blank",
        );

    const handleAssignTresorier = async () => {
        if (!selectedMemberTresorier) {
            showToast("Veuillez selectionner un membre.", "warning");
            return;
        }

        try {
            setLoading(true);
            const response = await postJson(
                "/conducteur/tresorerie/assign-tresorier",
                { user_id: selectedMemberTresorier },
            );
            reloadWithToast(
                response?.message || "Trésorier assigné avec succès.",
            );
            setModalTresorier(false);
            setSelectedMemberTresorier("");
        } catch (error) {
            showToast(
                "Erreur lors de l'assignation du tresorier: " + error.message,
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleUnassignTresorier = async () => {
        if (!tresorierClasse?.id) {
            showToast("Aucun tresorier n'est actuellement assigne.", "warning");
            return;
        }

        if (!String(motifRetraitTresorier || "").trim()) {
            showToast(
                "Veuillez saisir le motif de retrait du tresorier.",
                "warning",
            );
            return;
        }

        try {
            setLoading(true);
            const response = await postJson(
                "/conducteur/tresorerie/unassign-tresorier",
                {
                    user_id: tresorierClasse.id,
                    motif_retrait: motifRetraitTresorier,
                },
            );
            reloadWithToast(
                response?.message ||
                    "Fonction de trésorier retirée avec succès.",
            );
            setModalTresorier(false);
            setSelectedMemberTresorier("");
            setMotifRetraitTresorier("");
        } catch (error) {
            showToast(
                "Erreur lors du retrait du tresorier: " + error.message,
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const retardTotal = useMemo(
        () =>
            famillesEnRetard.reduce((s, f) => s + Number(f.montantDu || 0), 0),
        [famillesEnRetard],
    );
    const collectesActives = collectesClasse.filter(
        (c) => c.statut === "ACTIF" || c.statut === "EN COURS",
    );
    const totalCollecte = collectesClasse.reduce(
        (s, c) => s + Number(c.collecte || 0),
        0,
    );
    const recentTotalPages = Math.max(
        1,
        Math.ceil(paiementsRecents.length / 10),
    );
    const fimecoTotalPages = Math.max(1, Math.ceil(fimecoSuivi.length / 20));
    const famillesTotalPages = Math.max(
        1,
        Math.ceil(famillesSuivi.length / 10),
    );
    const recentRows = paginate(paiementsRecents, recentPage, 10);
    const fimecoRows = paginate(fimecoSuivi, fimecoPage, 20);
    const famillesRows = paginate(famillesSuivi, famillesPage, 10);
    const donsTotalPages = Math.max(1, Math.ceil(donsClasse.length / 10));
    const donsRows = paginate(donsClasse, donsPage, 10);

    const latestByFamily = useMemo(() => {
        const map = new Map();
        paiementsParFamille.forEach((p) => {
            if (!map.has(p.famille)) map.set(p.famille, p);
        });
        return map;
    }, [paiementsParFamille]);
    const cotisationsByFamily = useMemo(() => {
        const map = new Map();
        paiementsParFamille.forEach((p) => {
            const familyName = p.famille || "Famille";
            const current = map.get(familyName) || [];
            const key = `${p.cotisation || "-"}|${p.cotisationStatut || "TERMINE"}`;
            if (!current.some((item) => item.key === key)) {
                current.push({
                    key,
                    nom: p.cotisation || "-",
                    statut: p.cotisationStatut || "TERMINE",
                });
            }
            map.set(familyName, current);
        });
        return map;
    }, [paiementsParFamille]);
    const membersOfFamily = useMemo(() => {
        if (!modalMembresFamille?.nom) return [];
        return membresClasse.filter(
            (m) => m.famille === modalMembresFamille.nom,
        );
    }, [modalMembresFamille, membresClasse]);

    const rapportTopFamilles = useMemo(() => {
        return [...famillesSuivi]
            .sort(
                (a, b) => Number(b?.totalPaye || 0) - Number(a?.totalPaye || 0),
            )
            .slice(0, 8);
    }, [famillesSuivi]);

    const rapportCotisations = useMemo(() => {
        return [...cotisationsCreees]
            .map((c) => {
                const raw = String(c?.statut || "").toUpperCase();
                const statut =
                    raw === "ACTIVE" || raw === "ACTIF" || raw === "EN COURS"
                        ? "EN COURS"
                        : "TERMINE";
                return {
                    id: c?.id,
                    nom: c?.nom || "-",
                    periodicite: c?.periodicite || "-",
                    montant: Number(c?.montant || 0),
                    statut,
                };
            })
            .sort((a, b) => a.nom.localeCompare(b.nom));
    }, [cotisationsCreees]);

    const rapportStats = useMemo(() => {
        const totalPaye = famillesSuivi.reduce(
            (sum, f) => sum + Number(f?.totalPaye || 0),
            0,
        );
        const totalReste = famillesSuivi.reduce(
            (sum, f) => sum + Number(f?.totalDu || 0),
            0,
        );
        const cotisationsEnCours = rapportCotisations.filter(
            (c) => c.statut === "EN COURS",
        ).length;
        const cotisationsTerminees = rapportCotisations.filter(
            (c) => c.statut === "TERMINE",
        ).length;

        return {
            totalPaye,
            totalReste,
            cotisationsEnCours,
            cotisationsTerminees,
        };
    }, [famillesSuivi, rapportCotisations]);

    const tabs = [
        { id: "dashboard", emoji: "📊", label: "Vue d'ensemble" },
        { id: "rapports", emoji: "🧾", label: "Rapports" },
        { id: "cotisations", emoji: "💰", label: "Cotisations" },
        { id: "dons", emoji: "🎁", label: "Dons" },
        { id: "fimeco", emoji: "📌", label: "FIMECO" },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--main-gradient)",
                fontFamily: "'Outfit',system-ui,sans-serif",
            }}
        >
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 18,
                        right: 18,
                        zIndex: 2000,
                        background:
                            toast.type === "success"
                                ? "linear-gradient(135deg,#14532D,#15803D)"
                                : "linear-gradient(135deg,#7F1D1D,#B91C1C)",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    }}
                >
                    {toast.message}
                </div>
            )}
            <Head title="Trésorerie Conducteur" />

            {/* HEADER */}
            <div
                style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(6px)",
                    borderBottom: "1px solid rgba(255,255,255,0.20)",
                    padding: "22px 28px 0",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {[
                    { top: -60, right: -60, size: 200 },
                    { bottom: -80, left: "28%", size: 260 },
                ].map((o, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            top: o.top,
                            bottom: o.bottom,
                            left: o.left,
                            right: o.right,
                            width: o.size,
                            height: o.size,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.05)",
                        }}
                    />
                ))}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <Link
                            href={withBasePath("", "/conducteur/dashboard")}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 11,
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                textDecoration: "none",
                            }}
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 3,
                                }}
                            >
                                <h1
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 800,
                                        color: "#fff",
                                    }}
                                >
                                    Trésorerie — {classInfo.nom || "Classe"}
                                </h1>
                                {famillesEnRetard.length > 0 && (
                                    <span
                                        style={{
                                            background: "#E24B4A",
                                            color: "#fff",
                                            fontSize: 10,
                                            fontWeight: 800,
                                            padding: "2px 8px",
                                            borderRadius: 20,
                                        }}
                                    >
                                        {famillesEnRetard.length} en retard
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.65)",
                                }}
                            >
                                Suivi financier · Cotisations · Dons · FIMECO
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => setModalTresorier(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.25)",
                                borderRadius: 10,
                                padding: "8px 14px",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <Plus size={14} /> Assigner Trésorier
                        </button>
                    </div>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5,minmax(0,1fr))",
                        gap: 14,
                        marginBottom: 20,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <KpiCard
                        icon={TrendingUp}
                        color="teal"
                        label="Taux global"
                        value={`${stats.tauxPaiement ?? 0}%`}
                        sub="cotisations réglées"
                    />
                    <KpiCard
                        icon={CheckCircle}
                        color="blue"
                        label="Familles à jour"
                        value={`${classInfo.payeesAJour ?? 0}/${classInfo.totalFamilles ?? 0}`}
                        sub="sur ce mois"
                    />
                    <KpiCard
                        icon={AlertCircle}
                        color="red"
                        label="En retard"
                        value={classInfo.enRetard ?? 0}
                        sub="à relancer"
                        trend={
                            famillesEnRetard.length > 0
                                ? "⚠ Action requise"
                                : "✓ Tout va bien"
                        }
                    />
                    <KpiCard
                        icon={Wallet}
                        color="amber"
                        label="Retard cumulé"
                        value={fmt(retardTotal)}
                        sub="F CFA non versés"
                    />
                    <KpiCard
                        icon={Target}
                        color="purple"
                        label="Collectes actives"
                        value={collectesActives.length}
                        sub={`${fmt(totalCollecte)} collectés`}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        position: "relative",
                        zIndex: 1,
                        overflowX: "auto",
                    }}
                >
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: "11px 18px",
                                fontWeight: 700,
                                fontSize: 12,
                                color:
                                    activeTab === t.id
                                        ? "#fff"
                                        : "rgba(255,255,255,0.55)",
                                background: "transparent",
                                border: "none",
                                borderBottom:
                                    activeTab === t.id
                                        ? "2.5px solid #FAC775"
                                        : "2.5px solid transparent",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                transition: "color .15s",
                                fontFamily: "inherit",
                            }}
                        >
                            <span style={{ fontSize: 15 }}>{t.emoji}</span>
                            {t.label}
                            {t.badge > 0 && (
                                <span
                                    style={{
                                        background: "#E24B4A",
                                        color: "#fff",
                                        fontSize: 9,
                                        fontWeight: 800,
                                        padding: "1px 6px",
                                        borderRadius: 20,
                                    }}
                                >
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div
                style={{
                    margin: "0 auto",
                    padding: "26px 24px",
                }}
            >
                {/* DASHBOARD */}
                {activeTab === "dashboard" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.3fr 1fr",
                                gap: 20,
                            }}
                        >
                            <Card>
                                <SecTitle
                                    accent="teal"
                                    right={
                                        <OutlineBtn
                                            color="teal"
                                            icon={Download}
                                            sm
                                            onClick={() =>
                                                handleExport("excel")
                                            }
                                        >
                                            Exporter
                                        </OutlineBtn>
                                    }
                                >
                                    Paiements récents
                                </SecTitle>
                                <Table
                                    heads={[
                                        { label: "Famille" },
                                        { label: "Cotisation" },
                                        { label: "Montant", right: true },
                                        { label: "Mode", center: true },
                                        { label: "Date", right: true },
                                    ]}
                                    rows={recentRows.map((p, i) => (
                                        <Tr key={p.id || i}>
                                            <Td bold>{p.famille}</Td>
                                            <Td>{p.cotisation}</Td>
                                            <Td right bold color="green">
                                                {fmt(p.montant)}
                                            </Td>
                                            <Td center>{modePill(p.mode)}</Td>
                                            <Td right>{p.date}</Td>
                                        </Tr>
                                    ))}
                                    empty="Aucun paiement récent."
                                />
                                <Pagination
                                    page={recentPage}
                                    total={recentTotalPages}
                                    onChange={setRecentPage}
                                />
                            </Card>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {famillesEnRetard.length > 0 && (
                                    <div
                                        style={{
                                            background:
                                                "linear-gradient(135deg,#FCEBEB,#F7C1C150)",
                                            border: "1.5px solid #E24B4A40",
                                            borderRadius: 16,
                                            padding: "16px 18px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <AlertCircle
                                                size={16}
                                                color="#A32D2D"
                                            />
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    color: "#A32D2D",
                                                }}
                                            >
                                                {famillesEnRetard.length}{" "}
                                                famille(s) en retard
                                            </span>
                                        </div>
                                        {famillesEnRetard
                                            .slice(0, 3)
                                            .map((f) => (
                                                <div
                                                    key={f.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        padding: "7px 0",
                                                        borderBottom:
                                                            "1px solid #F0C0C020",
                                                    }}
                                                >
                                                    <div>
                                                        <p
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: 12,
                                                                color: "#2C2C2A",
                                                            }}
                                                        >
                                                            {f.nom}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontSize: 11,
                                                                color: "#A32D2D",
                                                            }}
                                                        >
                                                            {fmt(f.montantDu)}{" "}
                                                            en retard
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setModalRappel(f);
                                                            setRappelMsg("");
                                                        }}
                                                        style={{
                                                            background:
                                                                "#A32D2D",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: 8,
                                                            padding: "5px 10px",
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <Send size={10} />{" "}
                                                        Relancer
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <Card style={{ flex: 1 }}>
                                    <SecTitle accent="amber">
                                        Notifications
                                    </SecTitle>
                                    <div
                                        style={{
                                            maxHeight: 220,
                                            overflowY: "auto",
                                            paddingRight: 4,
                                        }}
                                    >
                                        {notificationsFinancieres.length ===
                                        0 ? (
                                            <p
                                                style={{
                                                    textAlign: "center",
                                                    color: "#B4B2A9",
                                                    fontSize: 13,
                                                    padding: "20px 0",
                                                }}
                                            >
                                                🔔 Aucune notification
                                            </p>
                                        ) : (
                                            notificationsFinancieres.map(
                                                (n) => (
                                                    <div
                                                        key={n.id}
                                                        style={{
                                                            padding: "9px 12px",
                                                            borderRadius: 10,
                                                            background:
                                                                "#FDF9F0",
                                                            borderLeft:
                                                                "3px solid #EF9F27",
                                                            marginBottom: 8,
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: 12,
                                                                color: "#2C2C2A",
                                                                marginBottom: 2,
                                                            }}
                                                        >
                                                            {n.titre}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontSize: 11,
                                                                color: "#5F5E5A",
                                                            }}
                                                        >
                                                            {n.message}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontSize: 10,
                                                                color: "#B4B2A9",
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            {n.date}
                                                        </p>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                        {collectesActives.length > 0 && (
                            <Card>
                                <SecTitle
                                    accent="purple"
                                    right={
                                        <OutlineBtn
                                            color="purple"
                                            sm
                                            onClick={() => setActiveTab("dons")}
                                        >
                                            Voir tout
                                        </OutlineBtn>
                                    }
                                >
                                    Collectes en cours
                                </SecTitle>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3,1fr)",
                                        gap: 14,
                                    }}
                                >
                                    {collectesActives.slice(0, 3).map((c) => {
                                        const pct = Math.min(
                                            100,
                                            c.progression || 0,
                                        );
                                        return (
                                            <div
                                                key={c.id}
                                                style={{
                                                    background: "#F9F8F5",
                                                    borderRadius: 14,
                                                    padding: "14px 16px",
                                                    border: "1px solid #E8E6DF",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 13,
                                                            color: "#2C2C2A",
                                                        }}
                                                    >
                                                        {c.nom}
                                                    </span>
                                                    <Pill color="purple">
                                                        {pct}%
                                                    </Pill>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        fontSize: 12,
                                                        color: "#888780",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    <span>
                                                        Collecté :{" "}
                                                        <b
                                                            style={{
                                                                color: "#27500A",
                                                            }}
                                                        >
                                                            {fmt(c.collecte)}
                                                        </b>
                                                    </span>
                                                    <span>
                                                        / {fmt(c.objectif)}
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={pct}
                                                    color="purple"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* RAPPORTS */}
                {activeTab === "rapports" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        <Card>
                            <SecTitle
                                accent="blue"
                                right={
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <OutlineBtn
                                            color="blue"
                                            icon={Download}
                                            sm
                                            onClick={() =>
                                                handleExport("excel")
                                            }
                                        >
                                            Excel
                                        </OutlineBtn>
                                        <OutlineBtn
                                            color="blue"
                                            icon={FileText}
                                            sm
                                            onClick={() => handleExport("pdf")}
                                        >
                                            PDF
                                        </OutlineBtn>
                                    </div>
                                }
                            >
                                Rapports de la classe
                            </SecTitle>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(4,minmax(0,1fr))",
                                    gap: 12,
                                    marginTop: 12,
                                }}
                            >
                                <div
                                    style={{
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#6B7280",
                                        }}
                                    >
                                        Total payé
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 800,
                                            marginTop: 4,
                                        }}
                                    >
                                        {fmt(rapportStats.totalPaye)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#6B7280",
                                        }}
                                    >
                                        Total restant
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 800,
                                            marginTop: 4,
                                        }}
                                    >
                                        {fmt(rapportStats.totalReste)}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#6B7280",
                                        }}
                                    >
                                        Cotisations en cours
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 800,
                                            marginTop: 4,
                                        }}
                                    >
                                        {rapportStats.cotisationsEnCours}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#6B7280",
                                        }}
                                    >
                                        Cotisations terminées
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 800,
                                            marginTop: 4,
                                        }}
                                    >
                                        {rapportStats.cotisationsTerminees}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 16,
                            }}
                        >
                            <Card>
                                <SecTitle accent="teal">
                                    Top familles (paiements)
                                </SecTitle>
                                <Table
                                    heads={[
                                        { label: "Famille" },
                                        { label: "Payé", right: true },
                                        { label: "Reste", right: true },
                                        { label: "Statut", center: true },
                                    ]}
                                    rows={rapportTopFamilles.map((f) => (
                                        <Tr key={f.id}>
                                            <Td bold>{f.nom}</Td>
                                            <Td right bold color="green">
                                                {fmt(f.totalPaye)}
                                            </Td>
                                            <Td
                                                right
                                                bold
                                                color={
                                                    f.totalDu > 0
                                                        ? "red"
                                                        : "green"
                                                }
                                            >
                                                {fmt(f.totalDu)}
                                            </Td>
                                            <Td center>
                                                <Pill
                                                    color={
                                                        f.statut === "A JOUR"
                                                            ? "teal"
                                                            : "red"
                                                    }
                                                >
                                                    {f.statut}
                                                </Pill>
                                            </Td>
                                        </Tr>
                                    ))}
                                    empty="Aucune donnée de famille disponible."
                                />
                            </Card>

                            <Card>
                                <SecTitle accent="amber">
                                    Cotisations de la classe
                                </SecTitle>
                                <Table
                                    heads={[
                                        { label: "Cotisation" },
                                        { label: "Périodicité" },
                                        { label: "Montant", right: true },
                                        { label: "Statut", center: true },
                                    ]}
                                    rows={rapportCotisations.map((c, i) => (
                                        <Tr key={c.id || i}>
                                            <Td bold>{c.nom}</Td>
                                            <Td>{c.periodicite}</Td>
                                            <Td right bold color="teal">
                                                {fmt(c.montant)}
                                            </Td>
                                            <Td center>
                                                <Pill
                                                    color={
                                                        c.statut === "EN COURS"
                                                            ? "amber"
                                                            : "teal"
                                                    }
                                                >
                                                    {c.statut}
                                                </Pill>
                                            </Td>
                                        </Tr>
                                    ))}
                                    empty="Aucune cotisation à afficher."
                                />
                            </Card>
                        </div>
                    </div>
                )}

                {/* FAMILLES */}
                {activeTab === "familles" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        <Card>
                            <SecTitle
                                accent="teal"
                                right={
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <OutlineBtn
                                            color="teal"
                                            icon={Download}
                                            sm
                                            onClick={() =>
                                                handleExport("excel")
                                            }
                                        >
                                            Excel
                                        </OutlineBtn>
                                        <OutlineBtn
                                            color="teal"
                                            icon={FileText}
                                            sm
                                            onClick={() => handleExport("pdf")}
                                        >
                                            PDF
                                        </OutlineBtn>
                                    </div>
                                }
                            >
                                Suivi des cotisations par famille
                            </SecTitle>
                            <Table
                                heads={[
                                    { label: "Famille" },
                                    { label: "Membres", center: true },
                                    { label: "Cotisation" },
                                    { label: "Date" },
                                    { label: "Mode", center: true },
                                    { label: "Payé", right: true },
                                    { label: "Reste", right: true },
                                    { label: "Statut", center: true },
                                    { label: "Action", center: true },
                                ]}
                                rows={famillesRows.map((f) => {
                                    const total =
                                        Number(f.totalPaye || 0) +
                                        Number(f.totalDu || 0);
                                    const pct =
                                        total > 0
                                            ? Math.round(
                                                  (Number(f.totalPaye || 0) /
                                                      total) *
                                                      100,
                                              )
                                            : 0;
                                    const last = latestByFamily.get(f.nom);
                                    const cotisations =
                                        cotisationsByFamily.get(f.nom) || [];
                                    return (
                                        <Tr key={f.id}>
                                            <Td bold>{f.nom}</Td>
                                            <Td center>{f.membersCount}</Td>
                                            <Td>
                                                {cotisations.length === 0 ? (
                                                    "—"
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        {cotisations
                                                            .slice(0, 2)
                                                            .map((c) => (
                                                                <div
                                                                    key={c.key}
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 6,
                                                                        flexWrap:
                                                                            "wrap",
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {c.nom}
                                                                    </span>
                                                                    <Pill
                                                                        color={
                                                                            c.statut ===
                                                                            "EN COURS"
                                                                                ? "amber"
                                                                                : "teal"
                                                                        }
                                                                    >
                                                                        {
                                                                            c.statut
                                                                        }
                                                                    </Pill>
                                                                </div>
                                                            ))}
                                                        {cotisations.length >
                                                            2 && (
                                                            <span
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: "#6B7280",
                                                                }}
                                                            >
                                                                +
                                                                {cotisations.length -
                                                                    2}{" "}
                                                                autres
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </Td>
                                            <Td>{last?.date || "—"}</Td>
                                            <Td center>
                                                {last
                                                    ? modePill(last.mode)
                                                    : "—"}
                                            </Td>
                                            <Td right bold color="green">
                                                {fmt(f.totalPaye)}
                                            </Td>
                                            <Td
                                                right
                                                bold
                                                color={
                                                    f.totalDu > 0
                                                        ? "red"
                                                        : "green"
                                                }
                                            >
                                                {fmt(f.totalDu)}
                                            </Td>
                                            <Td center>
                                                <Pill
                                                    color={
                                                        f.statut === "A JOUR"
                                                            ? "teal"
                                                            : "red"
                                                    }
                                                >
                                                    {f.statut} ({pct}%)
                                                </Pill>
                                            </Td>
                                            <Td center>
                                                <button
                                                    onClick={() => {
                                                        setModalPaiement(f);
                                                        setPaymentForm((p) => ({
                                                            ...p,
                                                            user_id: "",
                                                        }));
                                                    }}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        background:
                                                            "linear-gradient(135deg,#0F6E56,#1D9E75)",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 8,
                                                        padding: "5px 11px",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <CreditCard size={11} />{" "}
                                                    Paiement
                                                </button>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                                empty="Aucune famille dans cette classe."
                            />
                            <Pagination
                                page={famillesPage}
                                total={famillesTotalPages}
                                onChange={setFamillesPage}
                            />
                        </Card>
                    </div>
                )}

                {/* COTISATIONS */}
                {activeTab === "cotisations" && (
                    <Card>
                        <SecTitle
                            accent="amber"
                            right={
                                <GradBtn
                                    color="amber"
                                    icon={Plus}
                                    sm
                                    onClick={() => setModalCotisation(true)}
                                >
                                    Nouvelle cotisation
                                </GradBtn>
                            }
                        >
                            Cotisations de la classe
                        </SecTitle>
                        <div
                            style={{
                                background: "#FDF9F0",
                                border: "1px solid #EF9F2740",
                                borderRadius: 10,
                                padding: "10px 14px",
                                marginBottom: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 12,
                                color: "#633806",
                            }}
                        >
                            <AlertCircle size={14} color="#EF9F27" />
                            Les cotisations créées ici s'appliquent uniquement à
                            votre classe. Les cotisations globales (admin) sont
                            en lecture seule.
                        </div>
                        <Table
                            heads={[
                                { label: "Nom" },
                                { label: "Périodicité" },
                                { label: "Début" },
                                { label: "Fin" },
                                { label: "Cible" },
                                { label: "Statut" },
                                { label: "Actions", center: true },
                            ]}
                            rows={cotisationsCreees.map((c, i) => (
                                <Tr key={c.id || i}>
                                    <Td bold>{c.nom}</Td>
                                    <Td>{c.periodicite}</Td>
                                    <Td>{c.date_debut || "-"}</Td>
                                    <Td>{c.date_fin || "-"}</Td>
                                    <Td>{cotisationTargetSummary(c)}</Td>
                                    <Td>
                                        <Pill
                                            color={
                                                c.statut === "ACTIF"
                                                    ? "teal"
                                                    : "gray"
                                            }
                                        >
                                            {c.statut}
                                        </Pill>
                                    </Td>
                                    <Td center>
                                        {!c._global ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <button
                                                    onClick={() =>
                                                        openEditCotisation(c)
                                                    }
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg,#FAEEDA,#FAC775)",
                                                        color: "#412402",
                                                        border: "none",
                                                        borderRadius: 7,
                                                        padding: "4px 10px",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setModalDeleteCotisation(
                                                            c,
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg,#FCEBEB,#F7C1C1)",
                                                        color: "#791F1F",
                                                        border: "none",
                                                        borderRadius: 7,
                                                        padding: "4px 10px",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Supprimer
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setModalVoirCotisation(
                                                            c,
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
                                                        color: "#1E3A8A",
                                                        border: "none",
                                                        borderRadius: 7,
                                                        padding: "4px 10px",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Voir
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "#B4B2A9",
                                                }}
                                            >
                                                Lecture seule
                                            </span>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                            empty="Aucune cotisation. Créez-en une !"
                        />
                    </Card>
                )}

                {/* DONS */}
                {activeTab === "dons" && (
                    <Card>
                        <SecTitle
                            accent="purple"
                            right={
                                <GradBtn
                                    color="purple"
                                    icon={Plus}
                                    sm
                                    onClick={() => setModalDon(true)}
                                >
                                    Faire un don
                                </GradBtn>
                            }
                        >
                            Dons de la classe
                        </SecTitle>
                        <Table
                            heads={[
                                { label: "Donateur" },
                                { label: "Famille" },
                                { label: "Type", center: true },
                                { label: "Montant", right: true },
                                { label: "Mode", center: true },
                                { label: "Date", right: true },
                            ]}
                            rows={donsRows.map((d, i) => (
                                <Tr key={d.id || i}>
                                    <Td bold>{d.donateur || "-"}</Td>
                                    <Td>{d.famille || "-"}</Td>
                                    <Td center>
                                        <Pill
                                            color={
                                                d.type === "CAMPAGNE"
                                                    ? "purple"
                                                    : "teal"
                                            }
                                        >
                                            {d.type}
                                        </Pill>
                                    </Td>
                                    <Td right bold color="green">
                                        {fmt(d.montant)}
                                    </Td>
                                    <Td center>{modePill(d.mode)}</Td>
                                    <Td right>{d.date || "-"}</Td>
                                </Tr>
                            ))}
                            empty="Aucun don enregistré dans votre classe."
                        />
                        <Pagination
                            page={donsPage}
                            total={donsTotalPages}
                            onChange={setDonsPage}
                        />
                    </Card>
                )}

                {/* FIMECO */}
                {activeTab === "fimeco" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                        }}
                    >
                        <Card>
                            <SecTitle
                                accent="blue"
                                right={
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <OutlineBtn
                                            color="blue"
                                            icon={Download}
                                            sm
                                            onClick={() =>
                                                handleExport("excel")
                                            }
                                        >
                                            Excel
                                        </OutlineBtn>
                                        <OutlineBtn
                                            color="blue"
                                            icon={FileText}
                                            sm
                                            onClick={() => handleExport("pdf")}
                                        >
                                            PDF
                                        </OutlineBtn>
                                        <GradBtn
                                            color="blue"
                                            icon={CreditCard}
                                            sm
                                            onClick={() =>
                                                setModalPaiement({
                                                    nom: "Paiement FIMECO",
                                                })
                                            }
                                        >
                                            Faire un paiement
                                        </GradBtn>
                                    </div>
                                }
                            >
                                Suivi FIMECO par membre
                            </SecTitle>
                            <Table
                                heads={[
                                    { label: "Membre" },
                                    { label: "Famille" },
                                    { label: "Cible", right: true },
                                    { label: "Payé", right: true },
                                    { label: "Reste", right: true },
                                    { label: "Progression", center: true },
                                    { label: "Statut", center: true },
                                ]}
                                rows={fimecoRows.map((item) => {
                                    const pct =
                                        item.montant_cible > 0
                                            ? Math.round(
                                                  (item.montant_paye /
                                                      item.montant_cible) *
                                                      100,
                                              )
                                            : 0;
                                    return (
                                        <Tr key={item.user_id}>
                                            <Td bold>{item.nom}</Td>
                                            <Td>{item.famille}</Td>
                                            <Td right>
                                                {fmt(item.montant_cible)}
                                            </Td>
                                            <Td right bold color="green">
                                                {fmt(item.montant_paye)}
                                            </Td>
                                            <Td
                                                right
                                                bold
                                                color={
                                                    item.montant_restant > 0
                                                        ? "red"
                                                        : "green"
                                                }
                                            >
                                                {fmt(item.montant_restant)}
                                            </Td>
                                            <Td center>
                                                <div
                                                    style={{
                                                        width: 80,
                                                        margin: "0 auto",
                                                    }}
                                                >
                                                    <ProgressBar
                                                        value={pct}
                                                        color={
                                                            item.statut ===
                                                            "A JOUR"
                                                                ? "teal"
                                                                : "red"
                                                        }
                                                        showPct={false}
                                                    />
                                                    <p
                                                        style={{
                                                            fontSize: 9,
                                                            textAlign: "center",
                                                            color: "#888780",
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {pct}%
                                                    </p>
                                                </div>
                                            </Td>
                                            <Td center>
                                                <Pill
                                                    color={
                                                        item.statut === "A JOUR"
                                                            ? "teal"
                                                            : "red"
                                                    }
                                                >
                                                    {item.statut}
                                                </Pill>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                                empty="Aucun suivi FIMECO disponible."
                            />
                            <Pagination
                                page={fimecoPage}
                                total={fimecoTotalPages}
                                onChange={setFimecoPage}
                            />
                        </Card>
                    </div>
                )}
            </div>

            {/* PANNEAU PAIEMENT */}
            <Modal
                open={!!modalPaiement}
                onClose={() => setModalPaiement(null)}
                title={`Enregistrer un paiement — ${modalPaiement?.nom || ""}`}
            >
                <FormGrid cols={2}>
                    <FSelect
                        label="Membre de la famille"
                        value={paymentForm.user_id}
                        onChange={(e) =>
                            setPaymentForm((p) => ({
                                ...p,
                                user_id: e.target.value,
                            }))
                        }
                    >
                        <option value="">— Sélectionner —</option>
                        {membresClasse.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.nom}
                            </option>
                        ))}
                    </FSelect>
                    <FSelect
                        label="Cotisation"
                        value={paymentForm.cotisation_id}
                        onChange={(e) => {
                            const cotisationId = e.target.value;
                            setPaymentForm((p) => ({
                                ...p,
                                cotisation_id: cotisationId,
                            }));
                        }}
                    >
                        <option value="">— Optionnel —</option>
                        {cotisationsPaiement.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nom}
                            </option>
                        ))}
                    </FSelect>
                    <FInput
                        label="Montant (F CFA)"
                        type="number"
                        value={paymentForm.montant}
                        onChange={(e) =>
                            setPaymentForm((p) => ({
                                ...p,
                                montant: e.target.value,
                            }))
                        }
                        placeholder="Ex: 15000"
                    />
                    <FSelect
                        label="Mode de paiement"
                        value={paymentForm.mode_paiement}
                        onChange={(e) =>
                            setPaymentForm((p) => ({
                                ...p,
                                mode_paiement: e.target.value,
                            }))
                        }
                    >
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="ESPECES">Espèces</option>
                        <option value="VIREMENT">Virement</option>
                    </FSelect>
                    <FInput
                        label="Date"
                        type="date"
                        value={paymentForm.date_paiement}
                        onChange={(e) =>
                            setPaymentForm((p) => ({
                                ...p,
                                date_paiement: e.target.value,
                            }))
                        }
                    />
                    <FInput
                        label="Note"
                        value={paymentForm.note}
                        onChange={(e) =>
                            setPaymentForm((p) => ({
                                ...p,
                                note: e.target.value,
                            }))
                        }
                        placeholder="Observation…"
                    />
                </FormGrid>
                {paymentSummary && (
                    <div
                        style={{
                            background: "#F9F8F5",
                            border: "1px solid #E8E6DF",
                            borderRadius: 10,
                            padding: "10px 12px",
                            fontSize: 12,
                            color: "#44403C",
                            marginBottom: 14,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                            }}
                        >
                            <span>Montant attendu</span>
                            <strong>{fmt(paymentSummary.expected)}</strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                            }}
                        >
                            <span>Déjà payé</span>
                            <strong>{fmt(paymentSummary.paid)}</strong>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                            }}
                        >
                            <span>Reste à payer</span>
                            <strong
                                style={{
                                    color:
                                        paymentSummary.remaining > 0
                                            ? "#B91C1C"
                                            : "#166534",
                                }}
                            >
                                {fmt(paymentSummary.remaining)}
                            </strong>
                        </div>
                        {paymentSummary.dueDate && (
                            <div style={{ marginTop: 6, color: "#6B7280" }}>
                                Échéance: {paymentSummary.dueDate} · Retard
                                après J+{paymentSummary.lateAfterDays}
                            </div>
                        )}
                        <div style={{ marginTop: 6, color: "#6B7280" }}>
                            Paiement partiel autorisé, mais le montant ne doit
                            pas dépasser le reste.
                        </div>
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalPaiement(null)}
                    >
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        onClick={handlePaiement}
                        disabled={loading}
                        loading={loading}
                        color="teal"
                        icon={Check}
                    >
                        Valider le paiement
                    </GradBtn>
                </div>
            </Modal>

            <Modal
                open={!!modalDeleteCotisation}
                onClose={() => setModalDeleteCotisation(null)}
                title="Confirmer la suppression"
                width={460}
            >
                <div
                    style={{
                        background: "#FCEBEB",
                        border: "1px solid #E24B4A40",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 16,
                        fontSize: 12,
                        color: "#791F1F",
                    }}
                >
                    Cette action va supprimer la cotisation
                    <strong> {modalDeleteCotisation?.nom || ""}</strong>. Cette
                    opération est irréversible.
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalDeleteCotisation(null)}
                    >
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        color="red"
                        icon={X}
                        disabled={loading}
                        loading={loading}
                        onClick={() =>
                            handleDeleteCotisation(modalDeleteCotisation)
                        }
                    >
                        Supprimer
                    </GradBtn>
                </div>
            </Modal>

            {/* PANNEAU RAPPEL */}
            <Modal
                open={!!modalRappel}
                onClose={() => setModalRappel(null)}
                title={`Envoyer un rappel — ${modalRappel?.nom || ""}`}
            >
                <div
                    style={{
                        background: "#FCEBEB",
                        border: "1px solid #E24B4A40",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 16,
                        fontSize: 12,
                        color: "#791F1F",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <AlertCircle size={14} />
                    Montant dû : <strong>{fmt(modalRappel?.montantDu)}</strong>
                </div>
                <FTextarea
                    label="Message de rappel"
                    value={rappelMsg}
                    onChange={(e) => setRappelMsg(e.target.value)}
                    placeholder={`Bonjour famille ${modalRappel?.nom}, votre cotisation est en retard. Merci de régulariser.`}
                    rows={5}
                />
                <p
                    style={{
                        fontSize: 11,
                        color: "#888780",
                        marginTop: 6,
                        marginBottom: 20,
                    }}
                >
                    Ce message sera envoyé par notification interne au
                    responsable de la famille.
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalRappel(null)}
                    >
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        onClick={() => handleEnvoyerRappel(modalRappel)}
                        disabled={loading}
                        loading={loading}
                        color="red"
                        icon={Send}
                    >
                        Envoyer le rappel
                    </GradBtn>
                </div>
            </Modal>

            {/* PANNEAU MEMBRES FAMILLE */}
            <Modal
                open={!!modalMembresFamille}
                onClose={() => setModalMembresFamille(null)}
                title={`Membres — ${modalMembresFamille?.nom || ""}`}
            >
                {membersOfFamily.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#6B7280" }}>
                        Aucun membre trouvé pour cette famille.
                    </p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {membersOfFamily.map((m) => (
                            <div
                                key={m.id}
                                style={{
                                    padding: "10px 12px",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 10,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: "#1F2937",
                                    }}
                                >
                                    {m.nom}
                                </span>
                                <Pill
                                    color={
                                        m.statut === "A JOUR" ? "teal" : "red"
                                    }
                                >
                                    {m.statut}
                                </Pill>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* PANNEAU COTISATION */}
            <Modal
                open={modalCotisation}
                onClose={() => setModalCotisation(false)}
                title="Nouvelle règle de cotisation"
            >
                <FormGrid cols={2}>
                    <FInput
                        label="Nom de la cotisation"
                        value={newCotisation.nom}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                nom: e.target.value,
                            }))
                        }
                        placeholder="Ex: FIMECO, Cotisation mensuelle…"
                        span2
                    />
                    <FSelect
                        label="Périodicité"
                        value={newCotisation.periodicite}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                periodicite: e.target.value,
                            }))
                        }
                    >
                        <option value="MENSUEL">Mensuel</option>
                        <option value="TRIMESTRIEL">Trimestriel</option>
                        <option value="ANNUEL">Annuel</option>
                        <option value="UNIQUE">Unique</option>
                    </FSelect>
                    <FInput
                        label="Date de début"
                        type="date"
                        value={newCotisation.date_debut}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                date_debut: e.target.value,
                            }))
                        }
                    />
                    <FInput
                        label="Date de fin"
                        type="date"
                        value={newCotisation.date_fin}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                date_fin: e.target.value,
                            }))
                        }
                    />
                    <FInput
                        label="Retard après (jours)"
                        type="number"
                        value={newCotisation.late_after_days}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                late_after_days: e.target.value,
                            }))
                        }
                        placeholder="2"
                    />
                    <FTextarea
                        label="Description (optionnel)"
                        value={newCotisation.description}
                        onChange={(e) =>
                            setNewCotisation((p) => ({
                                ...p,
                                description: e.target.value,
                            }))
                        }
                        placeholder="Détails…"
                        rows={3}
                        span2
                    />
                    <FW label="Ciblage" span2>
                        <select
                            value={newCotisation.ciblage}
                            onChange={(e) => setNewCotisation((p) => ({ ...p, ciblage: e.target.value }))}
                            style={{ ...inputStyle }}
                        >
                            <option value="AUCUN">Aucun — montant unique pour tous</option>
                            <option value="GENRE">Par genre (Femme / Homme / Enfant)</option>
                            <option value="EMPLOI">Par statut d'emploi</option>
                        </select>
                    </FW>
                    {newCotisation.ciblage === "AUCUN" && (
                        <FInput
                            label="Montant (F CFA)"
                            type="number"
                            min="100"
                            value={newCotisation.montant}
                            onChange={(e) => setNewCotisation((p) => ({ ...p, montant: e.target.value }))}
                            placeholder="Ex: 5000"
                            span2
                        />
                    )}
                </FormGrid>
                {(newCotisation.ciblage === "GENRE" || newCotisation.ciblage === "EMPLOI") && (
                    <div style={{ background: "#F9F8F5", border: "1px solid #E8E6DF", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                        <strong style={{ fontSize: 13, color: "#2C2C2A", display: "block", marginBottom: 4 }}>
                            Montants par catégorie
                        </strong>
                        <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
                            Laissez vide ou à 0 pour exclure une catégorie (ces membres ne cotiseront pas).
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: newCotisation.ciblage === "GENRE" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
                            {newCotisation.ciblage === "GENRE"
                                ? [["F", "Femme"], ["M", "Homme"], ["ENFANT", "Enfant (< 20 ans)"]].map(([key, lbl]) => (
                                    <div key={key}>
                                        <label style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 4, display: "block" }}>{lbl}</label>
                                        <input type="number" min="0" value={newCotisation.montants[key]} onChange={(e) => setNewCotisation((p) => ({ ...p, montants: { ...p.montants, [key]: e.target.value } }))} placeholder="Montant F CFA" style={{ ...inputStyle }} />
                                    </div>
                                ))
                                : [["TRAVAILLEUR", "Travailleur"], ["RETRAITE", "Retraité"], ["SANS_EMPLOI", "Sans emploi"], ["ETUDIANT", "Étudiant"], ["ENFANT", "Enfant (< 20 ans)"]].map(([key, lbl]) => (
                                    <div key={key}>
                                        <label style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 4, display: "block" }}>{lbl}</label>
                                        <input type="number" min="0" value={newCotisation.montants[key]} onChange={(e) => setNewCotisation((p) => ({ ...p, montants: { ...p.montants, [key]: e.target.value } }))} placeholder="Montant F CFA" style={{ ...inputStyle }} />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalCotisation(false)}
                    >
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        onClick={handleCreateCotisation}
                        disabled={loading}
                        loading={loading}
                        color="amber"
                        icon={Plus}
                    >
                        Créer la règle
                    </GradBtn>
                </div>
            </Modal>

            <Modal
                open={!!modalVoirCotisation}
                onClose={() => setModalVoirCotisation(null)}
                title={`Récapitulatif cotisation — ${modalVoirCotisation?.nom || ""}`}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginBottom: 16,
                    }}
                >
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Nom:</strong> {modalVoirCotisation?.nom || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Périodicité:</strong>{" "}
                        {modalVoirCotisation?.periodicite || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Date début:</strong>{" "}
                        {modalVoirCotisation?.date_debut || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Date fin:</strong>{" "}
                        {modalVoirCotisation?.date_fin || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Retard après:</strong> J+
                        {Number(modalVoirCotisation?.late_after_days || 2)}
                    </div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                        <strong>Cible:</strong>{" "}
                        {cotisationTargetSummary(modalVoirCotisation)}
                    </div>
                </div>

                {modalVoirCotisation?.description ? (
                    <div
                        style={{
                            background: "#F9F8F5",
                            border: "1px solid #E8E6DF",
                            borderRadius: 10,
                            padding: "10px 12px",
                            fontSize: 12,
                            color: "#44403C",
                            marginBottom: 14,
                        }}
                    >
                        <strong>Description:</strong>{" "}
                        {modalVoirCotisation.description}
                    </div>
                ) : null}

                <div
                    style={{
                        border: "1px solid #E8E6DF",
                        borderRadius: 10,
                        overflow: "hidden",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 12,
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#F3F4F6" }}>
                                <th
                                    style={{
                                        padding: "10px 12px",
                                        textAlign: "left",
                                    }}
                                >
                                    Ciblage
                                </th>
                                <th
                                    style={{
                                        padding: "10px 12px",
                                        textAlign: "left",
                                    }}
                                >
                                    Option
                                </th>
                                <th
                                    style={{
                                        padding: "10px 12px",
                                        textAlign: "right",
                                    }}
                                >
                                    Montant
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rulesForDisplay(modalVoirCotisation).length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            color: "#9CA3AF",
                                        }}
                                    >
                                        Aucune règle de ciblage.
                                    </td>
                                </tr>
                            ) : (
                                rulesForDisplay(modalVoirCotisation).map(
                                    (rule, idx) => (
                                        <tr
                                            key={`${rule.type}-${rule.value}-${idx}`}
                                        >
                                            <td
                                                style={{
                                                    padding: "10px 12px",
                                                    borderTop:
                                                        "1px solid #F1EFE8",
                                                }}
                                            >
                                                {targetLabel(rule.type)}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px 12px",
                                                    borderTop:
                                                        "1px solid #F1EFE8",
                                                }}
                                            >
                                                {optionLabel(
                                                    rule.type,
                                                    rule.value,
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px 12px",
                                                    borderTop:
                                                        "1px solid #F1EFE8",
                                                    textAlign: "right",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fmt(rule.amount)}
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 14,
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalVoirCotisation(null)}
                    >
                        Fermer
                    </OutlineBtn>
                </div>
            </Modal>

            <Modal
                open={modalEditCotisation}
                onClose={() => {
                    setModalEditCotisation(false);
                    setEditCotisation(null);
                }}
                title="Modifier la cotisation"
            >
                {editCotisation && (
                    <>
                        <FormGrid cols={2}>
                            <FInput
                                label="Nom de la cotisation"
                                value={editCotisation.nom}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        nom: e.target.value,
                                    }))
                                }
                                span2
                            />
                            <FSelect
                                label="Périodicité"
                                value={editCotisation.periodicite}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        periodicite: e.target.value,
                                    }))
                                }
                            >
                                <option value="MENSUEL">Mensuel</option>
                                <option value="TRIMESTRIEL">Trimestriel</option>
                                <option value="ANNUEL">Annuel</option>
                                <option value="UNIQUE">Unique</option>
                            </FSelect>
                            <FInput
                                label="Date de début"
                                type="date"
                                value={editCotisation.date_debut}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        date_debut: e.target.value,
                                    }))
                                }
                            />
                            <FInput
                                label="Date de fin"
                                type="date"
                                value={editCotisation.date_fin}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        date_fin: e.target.value,
                                    }))
                                }
                            />
                            <FInput
                                label="Retard après (jours)"
                                type="number"
                                value={editCotisation.late_after_days}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        late_after_days: e.target.value,
                                    }))
                                }
                                placeholder="2"
                            />
                            <FTextarea
                                label="Description (optionnel)"
                                value={editCotisation.description}
                                onChange={(e) =>
                                    setEditCotisation((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                                rows={3}
                                span2
                            />
                        </FormGrid>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Ciblage</label>
                            <select
                                value={editCotisation.ciblage || "AUCUN"}
                                onChange={(e) => setEditCotisation((p) => ({ ...p, ciblage: e.target.value }))}
                                style={{ ...inputStyle, width: "100%" }}
                            >
                                <option value="AUCUN">Aucun — montant unique pour tous</option>
                                <option value="GENRE">Par genre (Femme / Homme / Enfant)</option>
                                <option value="EMPLOI">Par statut d'emploi</option>
                            </select>
                        </div>
                        {(editCotisation.ciblage || "AUCUN") === "AUCUN" && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Montant (F CFA)</label>
                                <input type="number" min="100" value={editCotisation.montant || ""} onChange={(e) => setEditCotisation((p) => ({ ...p, montant: e.target.value }))} placeholder="Ex: 5000" style={{ ...inputStyle, width: "100%" }} />
                            </div>
                        )}
                        {((editCotisation.ciblage || "AUCUN") === "GENRE" || (editCotisation.ciblage || "AUCUN") === "EMPLOI") && (
                            <div style={{ background: "#F9F8F5", border: "1px solid #E8E6DF", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                                <strong style={{ fontSize: 13, color: "#2C2C2A", display: "block", marginBottom: 4 }}>
                                    Montants par catégorie
                                </strong>
                                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
                                    Laissez vide ou à 0 pour exclure une catégorie.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: (editCotisation.ciblage || "AUCUN") === "GENRE" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
                                    {(editCotisation.ciblage || "AUCUN") === "GENRE"
                                        ? [["F", "Femme"], ["M", "Homme"], ["ENFANT", "Enfant (< 20 ans)"]].map(([key, lbl]) => (
                                            <div key={key}>
                                                <label style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 4, display: "block" }}>{lbl}</label>
                                                <input type="number" min="0" value={(editCotisation.montants || {})[key] || ""} onChange={(e) => setEditCotisation((p) => ({ ...p, montants: { ...(p.montants || {}), [key]: e.target.value } }))} placeholder="Montant F CFA" style={{ ...inputStyle }} />
                                            </div>
                                        ))
                                        : [["TRAVAILLEUR", "Travailleur"], ["RETRAITE", "Retraité"], ["SANS_EMPLOI", "Sans emploi"], ["ETUDIANT", "Étudiant"], ["ENFANT", "Enfant (< 20 ans)"]].map(([key, lbl]) => (
                                            <div key={key}>
                                                <label style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 4, display: "block" }}>{lbl}</label>
                                                <input type="number" min="0" value={(editCotisation.montants || {})[key] || ""} onChange={(e) => setEditCotisation((p) => ({ ...p, montants: { ...(p.montants || {}), [key]: e.target.value } }))} placeholder="Montant F CFA" style={{ ...inputStyle }} />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                justifyContent: "flex-end",
                            }}
                        >
                            <OutlineBtn
                                color="gray"
                                onClick={() => {
                                    setModalEditCotisation(false);
                                    setEditCotisation(null);
                                }}
                            >
                                Annuler
                            </OutlineBtn>
                            <GradBtn
                                onClick={handleUpdateCotisation}
                                disabled={loading}
                                loading={loading}
                                color="amber"
                                icon={Check}
                            >
                                Enregistrer
                            </GradBtn>
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                open={modalDon}
                onClose={() => setModalDon(false)}
                title="Faire un don"
            >
                <FormGrid cols={2}>
                    <FSelect
                        label="Type de don"
                        value={newDon.type}
                        onChange={(e) =>
                            setNewDon((p) => ({
                                ...p,
                                type: e.target.value,
                            }))
                        }
                    >
                        <option value="LIBRE">Libre</option>
                    </FSelect>
                    <div />
                    <FInput
                        label="Montant (F CFA)"
                        type="number"
                        value={newDon.montant}
                        onChange={(e) =>
                            setNewDon((p) => ({
                                ...p,
                                montant: e.target.value,
                            }))
                        }
                        placeholder="Ex: 5000"
                    />
                    <FSelect
                        label="Mode de paiement"
                        value={newDon.mode_paiement}
                        onChange={(e) =>
                            setNewDon((p) => ({
                                ...p,
                                mode_paiement: e.target.value,
                            }))
                        }
                    >
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="ESPECES">Espèces</option>
                        <option value="VIREMENT">Virement</option>
                    </FSelect>
                    <FInput
                        label="Date du don"
                        type="date"
                        value={newDon.date_don}
                        onChange={(e) =>
                            setNewDon((p) => ({
                                ...p,
                                date_don: e.target.value,
                            }))
                        }
                    />
                    <FInput
                        label="Note"
                        value={newDon.note}
                        onChange={(e) =>
                            setNewDon((p) => ({ ...p, note: e.target.value }))
                        }
                        placeholder="Observation..."
                    />
                </FormGrid>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn color="gray" onClick={() => setModalDon(false)}>
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        onClick={handleCreateDon}
                        disabled={loading}
                        loading={loading}
                        color="purple"
                        icon={Check}
                    >
                        Enregistrer le don
                    </GradBtn>
                </div>
            </Modal>

            {/* PANNEAU COLLECTE */}
            <Modal
                open={modalCollecte}
                onClose={() => setModalCollecte(false)}
                title="Nouvelle collecte de dons"
            >
                <FormGrid cols={2}>
                    <FInput
                        label="Titre de la collecte"
                        value={newCollecte.titre}
                        onChange={(e) =>
                            setNewCollecte((p) => ({
                                ...p,
                                titre: e.target.value,
                            }))
                        }
                        placeholder="Ex: Rénovation salle…"
                        span2
                    />
                    <FInput
                        label="Objectif (F CFA)"
                        type="number"
                        value={newCollecte.objectif_montant}
                        onChange={(e) =>
                            setNewCollecte((p) => ({
                                ...p,
                                objectif_montant: e.target.value,
                            }))
                        }
                        placeholder="Ex: 500000"
                    />
                    <div />
                    <FInput
                        label="Date de début"
                        type="date"
                        value={newCollecte.date_debut}
                        onChange={(e) =>
                            setNewCollecte((p) => ({
                                ...p,
                                date_debut: e.target.value,
                            }))
                        }
                    />
                    <FInput
                        label="Date de fin"
                        type="date"
                        value={newCollecte.date_fin}
                        onChange={(e) =>
                            setNewCollecte((p) => ({
                                ...p,
                                date_fin: e.target.value,
                            }))
                        }
                    />
                    <FTextarea
                        label="Description"
                        value={newCollecte.description || ""}
                        onChange={(e) =>
                            setNewCollecte((p) => ({
                                ...p,
                                description: e.target.value,
                            }))
                        }
                        placeholder="Objectif de la collecte…"
                        rows={3}
                        span2
                    />
                </FormGrid>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalCollecte(false)}
                    >
                        Annuler
                    </OutlineBtn>
                    <GradBtn
                        onClick={handleCreateCollecte}
                        disabled={loading}
                        loading={loading}
                        color="purple"
                        icon={Target}
                    >
                        Créer la collecte
                    </GradBtn>
                </div>
            </Modal>

            {/* PANNEAU ASSIGNER TRESORIER */}
            <Modal
                open={modalTresorier}
                onClose={() => {
                    setModalTresorier(false);
                    setMotifRetraitTresorier("");
                }}
                title="Assigner un trésorier"
            >
                <div
                    style={{
                        background: "#E0F2FE",
                        border: "1px solid #0084FF40",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 16,
                        fontSize: 12,
                        color: "#0C4A6E",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <CheckCircle size={14} />
                    Le tresorier aidera à assister la trésorerie de votre
                    classe.
                </div>
                <FW label="Sélectionner un membre de la classe" span2>
                    <select
                        value={selectedMemberTresorier}
                        onChange={(e) =>
                            setSelectedMemberTresorier(e.target.value)
                        }
                        style={{
                            ...inputStyle,
                            cursor: "pointer",
                        }}
                    >
                        <option value="">-- Choisir un membre --</option>
                        {membresClasse
                            .filter((m) => m.role === "membre_famille")
                            .map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nom} ({m.famille})
                                </option>
                            ))}
                    </select>
                </FW>
                <div
                    style={{
                        marginTop: 8,
                        marginBottom: 14,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        fontSize: 12,
                        color: "#374151",
                    }}
                >
                    <strong>Trésorier actuel:</strong>{" "}
                    {tresorierClasse
                        ? `${tresorierClasse.nom} (${tresorierClasse.famille})`
                        : "Aucun"}
                </div>
                <p
                    style={{
                        fontSize: 11,
                        color: "#888780",
                        marginTop: 6,
                        marginBottom: 10,
                    }}
                >
                    Seuls les membres actifs de votre classe peuvent être
                    assignés comme trésorier.
                </p>
                {tresorierClasse ? (
                    <FTextarea
                        label="Motif de retrait du trésorier"
                        value={motifRetraitTresorier}
                        onChange={(e) =>
                            setMotifRetraitTresorier(e.target.value)
                        }
                        placeholder="Saisir le motif avant de retirer le trésorier..."
                        rows={3}
                    />
                ) : null}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <OutlineBtn
                        color="gray"
                        onClick={() => setModalTresorier(false)}
                    >
                        Annuler
                    </OutlineBtn>
                    {tresorierClasse ? (
                        <OutlineBtn
                            color="red"
                            onClick={handleUnassignTresorier}
                            disabled={loading}
                        >
                            Retirer le trésorier
                        </OutlineBtn>
                    ) : null}
                    <GradBtn
                        onClick={handleAssignTresorier}
                        disabled={loading}
                        loading={loading}
                        color="blue"
                        icon={Plus}
                    >
                        Assigner le trésorier
                    </GradBtn>
                </div>
            </Modal>
        </div>
    );
}
