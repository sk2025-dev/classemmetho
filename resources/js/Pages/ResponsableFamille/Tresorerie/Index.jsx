import React, { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    CreditCard,
    DollarSign,
    Heart,
    Download,
    ArrowLeft,
    Bell,
    Gift,
    History,
    Users,
    FileText,
    CheckCircle,
    AlertTriangle,
    X,
    ChevronDown,
} from "lucide-react";
import { PaymentModal } from "../../../Components/PaymentModal";
import { withBasePath } from "../../../Utils/urlHelper";


/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const fmtCurrency = (n) => `${fmt(n)} F`;

const getCsrfToken = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") ?? "";

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function Badge({ children, color }) {
    const styles = {
        green: { background: "#eaf3de", color: "#3b6d11" },
        red: { background: "#fcebeb", color: "#a32d2d" },
        amber: { background: "#faeeda", color: "#854f0b" },
        purple: { background: "#eeedfe", color: "#534ab7" },
        blue: { background: "#e6f1fb", color: "#185fa5" },
        gray: { background: "#f1efe8", color: "#5f5e5a" },
    };
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
                ...styles[color],
            }}
        >
            {children}
        </span>
    );
}

function ReceiptModal({ receipt, onClose }) {
    if (!receipt) return null;
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 28,
                    width: 340,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    <h3
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#1a1a2e",
                        }}
                    >
                        Reçu de paiement
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#888",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                {[
                    ["Numéro", receipt.recu, "#3b2a8a"],
                    ["Membre", receipt.membre, null],
                    ["Type", receipt.type, null],
                    ["Mode", receipt.mode, null],
                    ["Date", receipt.date, null],
                ].map(([label, val, col]) => (
                    <div
                        key={label}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "7px 0",
                            borderBottom: "0.5px solid #f0f0f0",
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: "#888" }}>{label}</span>
                        <span
                            style={{
                                color: col || "#1a1a2e",
                                fontWeight: col ? 500 : 400,
                            }}
                        >
                            {val}
                        </span>
                    </div>
                ))}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        fontSize: 15,
                        fontWeight: 600,
                    }}
                >
                    <span>Montant</span>
                    <span style={{ color: "#1d9e75" }}>
                        {fmt(receipt.montant)} F CFA
                    </span>
                </div>
                <div
                    style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "#eaf3de",
                        borderRadius: 8,
                        textAlign: "center",
                        fontSize: 12,
                        color: "#3b6d11",
                    }}
                >
                    ✓ Paiement validé
                </div>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: 14,
                        width: "100%",
                        padding: "9px 0",
                        background: "#f5f5f5",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: "pointer",
                        color: "#555",
                    }}
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — CONSULTATION
───────────────────────────────────────── */
function TabConsultation({ cotisations, membres, totalDues }) {
    const [filterPeriode, setFilterPeriode] = useState("");
    const [filterType, setFilterType] = useState("");

    return (
        <div>
            <h3 style={sectionTitle}>Situation financière de la famille</h3>

            {/* Balance Summary */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 20,
                }}
            >
                {[
                    {
                        label: "Total payé",
                        val: membres.reduce((s, m) => s + m.paiements, 0),
                        color: "#1d9e75",
                        border: "#1d9e75",
                    },
                    {
                        label: "Solde restant",
                        val: totalDues,
                        color: "#e24b4a",
                        border: "#e24b4a",
                    },
                ].map(({ label, val, color, border }) => (
                    <div
                        key={label}
                        style={{
                            background: "#f8f8fc",
                            borderRadius: 10,
                            padding: "12px 14px",
                            borderLeft: `3px solid ${border}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "#999",
                                marginBottom: 4,
                            }}
                        >
                            {label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 600, color }}>
                            {fmt(val)} F
                        </div>
                    </div>
                ))}
            </div>

            {/* Cotisations detail */}
            <h3 style={{ ...sectionTitle, marginBottom: 10 }}>
                Types de cotisations actives
            </h3>
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    flexWrap: "wrap",
                }}
            >
                <select
                    style={selectStyle}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Tous types</option>
                    {cotisations.map((c) => (
                        <option key={c.id}>{c.nom}</option>
                    ))}
                </select>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 24,
                }}
            >
                {cotisations
                    .filter((c) => !filterType || c.nom === filterType)
                    .map((cot) => (
                        <div
                            key={cot.id}
                            style={{
                                padding: "12px 16px",
                                border: "0.5px solid #e8e8f0",
                                borderRadius: 10,
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                                gap: 8,
                                alignItems: "center",
                                fontSize: 13,
                            }}
                        >
                            <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                {cot.nom}
                            </span>
                            <span style={{ color: "#3b2a8a", fontWeight: 600 }}>
                                {fmt(cot.montant)} F
                            </span>
                            <span style={{ color: "#666" }}>
                                {cot.periodicite}
                            </span>
                            <Badge color="green">✓ {cot.statut}</Badge>
                            <span style={{ color: "#888", fontSize: 11 }}>
                                Famille entière
                            </span>
                        </div>
                    ))}
            </div>

            {/* Per-member breakdown */}
            <h3 style={{ ...sectionTitle, marginBottom: 10 }}>
                Détail par membre
            </h3>
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                    }}
                >
                    <thead>
                        <tr style={{ background: "#f8f8fc" }}>
                            {[
                                "Membre",
                                "Type",
                                "Montant dû",
                                "Payé",
                                "Statut",
                            ].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        color: "#888",
                                        fontWeight: 500,
                                        fontSize: 11,
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {membres.map((m) =>
                            cotisations.map((cot) => {
                                const statut =
                                    m.cotisationDue === 0
                                        ? "Payé"
                                        : m.paiements > 0
                                          ? "Partiel"
                                          : "En attente";
                                return (
                                    <tr
                                        key={`${m.id}-${cot.id}`}
                                        style={{
                                            borderBottom: "0.5px solid #f5f5f5",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "9px 12px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {m.nom}
                                        </td>
                                        <td
                                            style={{
                                                padding: "9px 12px",
                                                color: "#555",
                                            }}
                                        >
                                            {cot.nom}
                                        </td>
                                        <td
                                            style={{
                                                padding: "9px 12px",
                                                color: "#e24b4a",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {fmt(cot.montant)} F
                                        </td>
                                        <td
                                            style={{
                                                padding: "9px 12px",
                                                color: "#1d9e75",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {fmt(m.paiements)} F
                                        </td>
                                        <td style={{ padding: "9px 12px" }}>
                                            <Badge
                                                color={
                                                    statut === "Payé"
                                                        ? "green"
                                                        : statut === "Partiel"
                                                          ? "amber"
                                                          : "red"
                                                }
                                            >
                                                {statut}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            }),
                        )}
                    </tbody>
                </table>
            </div>

            {totalDues > 0 && (
                <div
                    style={{
                        marginTop: 20,
                        padding: "14px 18px",
                        background: "#fff8f0",
                        borderLeft: "4px solid #ef9f27",
                        borderRadius: 10,
                    }}
                >
                    <p
                        style={{
                            fontWeight: 600,
                            color: "#7a4a00",
                            fontSize: 13,
                        }}
                    >
                        ⚠️ Total à régulariser (Famille)
                    </p>
                    <p
                        style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#854f0b",
                            margin: "6px 0",
                        }}
                    >
                        {fmt(totalDues)} F CFA
                    </p>
                    <p style={{ fontSize: 11, color: "#9a6010" }}>
                        Répartition sur {membres.length} membres ·{" "}
                        {membres.filter((m) => m.cotisationDue > 0).length}{" "}
                        membre(s) en retard
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — MEMBRES
───────────────────────────────────────── */
const PROFIL_STYLES = {
    homme:   { bg: "#e6f1fb", color: "#185fa5", label: "👨 Homme" },
    femme:   { bg: "#f5effe", color: "#7c3aed", label: "👩 Femme" },
    enfant:  { bg: "#faeeda", color: "#854f0b", label: "🧒 Enfant" },
    inconnu: { bg: "#f1efe8", color: "#5f5e5a", label: "—" },
};

function ProfilBadge({ profil }) {
    const s = PROFIL_STYLES[profil] ?? PROFIL_STYLES.inconnu;
    return (
        <span
            style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: s.bg,
                color: s.color,
                whiteSpace: "nowrap",
            }}
        >
            {s.label}
        </span>
    );
}

function TabMembres({ membres, cotisations }) {
    const [selectedCotisationId, setSelectedCotisationId] = useState("");

    const selectedCotisation = cotisations.find(
        (c) => String(c.id) === String(selectedCotisationId),
    ) ?? null;

    return (
        <div>
            <h3 style={sectionTitle}>
                Situation de vos {membres.length} membres
            </h3>

            {/* Sélecteur de cotisation */}
            <div
                style={{
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <label
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#3b2a8a",
                        whiteSpace: "nowrap",
                    }}
                >
                    Cotisation :
                </label>
                <select
                    value={selectedCotisationId}
                    onChange={(e) => setSelectedCotisationId(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: 200,
                        maxWidth: 380,
                        height: 38,
                        border: "1.5px solid #d1d5db",
                        borderRadius: 8,
                        padding: "0 12px",
                        fontSize: 13,
                        color: "#1a1a2e",
                        background: "#fff",
                        outline: "none",
                        cursor: "pointer",
                    }}
                >
                    <option value="">— Sélectionner une cotisation —</option>
                    {cotisations.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nom} ({c.periodicite})
                        </option>
                    ))}
                </select>

                {selectedCotisation && (
                    <span
                        style={{
                            fontSize: 12,
                            color: "#3b2a8a",
                            background: "#eeedfe",
                            borderRadius: 20,
                            padding: "4px 12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Base : {fmtCurrency(selectedCotisation.montant)} · {selectedCotisation.periodicite}
                    </span>
                )}
            </div>

            {!selectedCotisation ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#aaa",
                        fontSize: 13,
                        border: "1.5px dashed #e0e0e0",
                        borderRadius: 10,
                    }}
                >
                    Sélectionnez une cotisation pour voir le montant à payer par membre.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13,
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f8f8fc" }}>
                                {["Membre", "Rôle", "Profil", "Montant à payer"].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "9px 12px",
                                            textAlign: "left",
                                            color: "#888",
                                            fontWeight: 500,
                                            fontSize: 11,
                                            borderBottom: "1px solid #eee",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {membres.map((m) => {
                                const amountRaw =
                                    selectedCotisation.amounts_par_membre?.[m.id];
                                const isCible = amountRaw !== null && amountRaw !== undefined;
                                const amount = isCible ? amountRaw : 0;
                                const remainingRaw =
                                    selectedCotisation.remaining_par_membre?.[m.id];
                                const remaining =
                                    remainingRaw !== null && remainingRaw !== undefined
                                        ? Number(remainingRaw)
                                        : null;
                                const isFullyPaid = isCible && remaining === 0;

                                return (
                                    <tr
                                        key={m.id}
                                        style={{
                                            borderBottom: "0.5px solid #f0f0f0",
                                            opacity: isCible ? 1 : 0.5,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "11px 12px",
                                                fontWeight: 600,
                                                color: "#1a1a2e",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {m.nom}
                                        </td>
                                        <td style={{ padding: "11px 12px" }}>
                                            <Badge color="purple">{m.role}</Badge>
                                        </td>
                                        <td style={{ padding: "11px 12px" }}>
                                            <ProfilBadge profil={m.profil ?? "inconnu"} />
                                        </td>
                                        <td
                                            style={{
                                                padding: "11px 12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {isCible ? (
                                                isFullyPaid ? (
                                                    <span style={{ color: "#1d9e75" }}>
                                                        Déjà payé
                                                    </span>
                                                ) : (
                                                    <span style={{ color: amount === 0 ? "#1d9e75" : "#e24b4a" }}>
                                                        {fmtCurrency(remaining ?? amount)}
                                                    </span>
                                                )
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#bbb",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    Non ciblé
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ModalVoirCotisation({ cotisation, paiements, onClose }) {
    if (!cotisation) return null;
    const lignes = paiements.filter(
        (p) => p.cotisation_id === cotisation.id,
    );
    const totalPaye = lignes.reduce((s, p) => s + p.montant, 0);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 14,
                    width: "100%",
                    maxWidth: 560,
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête */}
                <div
                    style={{
                        padding: "18px 22px 14px",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
                            {cotisation.nom}
                        </div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                            {cotisation.periodicite} · Base : {fmtCurrency(cotisation.montant)}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Récap chiffres */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                        padding: "14px 22px",
                        background: "#f8f8fc",
                        borderBottom: "1px solid #eee",
                    }}
                >
                    {[
                        { label: "À payer",       val: cotisation.montant_attendu, color: "#3b2a8a" },
                        { label: "Déjà payé",     val: cotisation.montant_paye,    color: "#1d9e75" },
                        { label: "Reste à payer", val: cotisation.montant_restant, color: cotisation.montant_restant > 0 ? "#e24b4a" : "#1d9e75" },
                    ].map(({ label, val, color }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#999", marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color }}>{fmtCurrency(Number(val) || 0)}</div>
                        </div>
                    ))}
                </div>

                {/* Liste des paiements */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 22px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#3b2a8a", marginBottom: 10 }}>
                        Historique des paiements ({lignes.length})
                    </div>
                    {lignes.length === 0 ? (
                        <div style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                            Aucun paiement enregistré pour cette cotisation.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {lignes.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        border: "0.5px solid #eee",
                                        borderRadius: 10,
                                        padding: "10px 14px",
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto",
                                        gap: 8,
                                        alignItems: "center",
                                        background: "#fafafa",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
                                            {fmtCurrency(p.montant)}
                                            <span style={{ fontWeight: 400, color: "#888", marginLeft: 8, fontSize: 11 }}>
                                                · {p.mode}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: "#888", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <span>📅 {p.date}</span>
                                            {p.membre && p.membre !== "Famille" && (
                                                <span>👤 Enregistré pour : <strong style={{ color: "#3b2a8a" }}>{p.membre}</strong></span>
                                            )}
                                            {p.recu && (
                                                <span style={{ color: "#1d9e75" }}>🧾 {p.recu}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        color={
                                            p.payment_status === "PAYE" ? "green"
                                            : p.payment_status === "EN_ATTENTE" ? "amber"
                                            : "gray"
                                        }
                                    >
                                        {p.payment_status === "PAYE" ? "Confirmé"
                                         : p.payment_status === "EN_ATTENTE" ? "En attente"
                                         : p.payment_status ?? "—"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pied */}
                {lignes.length > 0 && (
                    <div
                        style={{
                            padding: "12px 22px",
                            borderTop: "1px solid #f0f0f0",
                            fontSize: 12,
                            color: "#888",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>Total enregistré</span>
                        <strong style={{ color: "#1d9e75", fontSize: 14 }}>{fmtCurrency(totalPaye)}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabCotisations({ title, cotisations, historiquePaiements, familyInfo }) {
    const [voirCotisation, setVoirCotisation] = useState(null);

    return (
        <div>
            <h3 style={sectionTitle}>{title}</h3>

            {cotisations.length === 0 ? (
                <div
                    style={{
                        padding: "18px 16px",
                        borderRadius: 10,
                        background: "#f8f8fc",
                        color: "#888",
                        fontSize: 13,
                    }}
                >
                    Aucune cotisation disponible.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13,
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f8f8fc" }}>
                                {[
                                    "Cotisation",
                                    "À payer",
                                    "Déjà payé",
                                    "Reste à payer",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "9px 12px",
                                            textAlign: "left",
                                            color: "#888",
                                            fontWeight: 500,
                                            fontSize: 11,
                                            borderBottom: "1px solid #eee",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cotisations.map((cot) => {
                                // Montant ciblé uniquement pour le responsable de famille
                                const respId = String(familyInfo?.responsable_id ?? "");
                                const amountMap = cot.amounts_par_membre || {};
                                const amountRaw = respId && respId in amountMap
                                    ? amountMap[respId]
                                    : null;
                                const aPayer = amountRaw != null ? Number(amountRaw) : 0;
                                const estCible = amountRaw != null;
                                const dejaPaye = Number(cot.montant_paye || 0);
                                const reste = Math.max(0, aPayer - dejaPaye);
                                // Objet enrichi pour le modal
                                const cotEnrichi = { ...cot, montant_attendu: aPayer, montant_restant: reste };

                                return (
                                    <tr
                                        key={cot.id}
                                        style={{ borderBottom: "0.5px solid #f5f5f5" }}
                                    >
                                        {/* Cotisation */}
                                        <td style={{ padding: "11px 12px" }}>
                                            <div style={{ fontWeight: 600, color: "#1a1a2e" }}>
                                                {cot.nom}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                                                {cot.periodicite}
                                            </div>
                                        </td>

                                        {/* À payer */}
                                        <td style={{ padding: "11px 12px", fontWeight: 700, color: "#3b2a8a", whiteSpace: "nowrap" }}>
                                            {estCible
                                                ? fmtCurrency(aPayer)
                                                : <span style={{ color: "#bbb", fontWeight: 400, fontSize: 12, fontStyle: "italic" }}>Non ciblé</span>
                                            }
                                        </td>

                                        {/* Déjà payé */}
                                        <td style={{ padding: "11px 12px", fontWeight: 700, color: "#1d9e75", whiteSpace: "nowrap" }}>
                                            {dejaPaye > 0
                                                ? fmtCurrency(dejaPaye)
                                                : <span style={{ color: "#ccc", fontWeight: 400, fontSize: 12 }}>Aucun</span>
                                            }
                                        </td>

                                        {/* Reste à payer */}
                                        <td style={{ padding: "11px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                            {!estCible ? (
                                                <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                                            ) : reste > 0 ? (
                                                <span style={{ color: "#e24b4a" }}>{fmtCurrency(reste)}</span>
                                            ) : (
                                                <Badge color="green">À jour ✓</Badge>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {voirCotisation && (
                <ModalVoirCotisation
                    cotisation={voirCotisation}
                    paiements={historiquePaiements}
                    onClose={() => setVoirCotisation(null)}
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — PAIEMENT
───────────────────────────────────────── */
function TabPaiement({
    membres,
    cotisations,
    familyInfo,
    preselectedCotisationId,
    preselectedAmount,
}) {
    const [selectedMembre, setSelectedMembre] = useState(membres[0]?.id ?? "");
    const [selectedCotisation, setSelectedCotisation] = useState(
        preselectedCotisationId || cotisations[0]?.id || "",
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [montant, setMontant] = useState(
        preselectedAmount ||
            cotisations[0]?.montant_restant ||
            cotisations[0]?.montant ||
            0,
    );
    const [payMethod, setPayMethod] = useState("mobile");
    const [mobileProvider, setMobileProvider] = useState("wave");
    const [cashForm, setCashForm] = useState({
        nom: "",
        fonction: "",
        date: "",
    });
    const [virementForm, setVirementForm] = useState({
        reference: "",
        banque: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // États pour le PaymentModal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [paymentPaiementId, setPaymentPaiementId] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);

    useEffect(() => {
        if (preselectedCotisationId) {
            setSelectedCotisation(preselectedCotisationId);
        }
        if (preselectedAmount) {
            setMontant(preselectedAmount);
        }
    }, [preselectedCotisationId, preselectedAmount]);

    const handleCotisationChange = (e) => {
        const id = Number(e.target.value);
        setSelectedCotisation(id);
        const cot = cotisations.find((c) => c.id === id);
        if (cot) {
            setMontant(
                Number(
                    cot.montant_restant ||
                        cot.montant_attendu ||
                        cot.montant ||
                        0,
                ),
            );
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (payMethod === "mobile") {
                // Paiement en ligne via PayDunya
                const body = {
                    family_id: familyInfo?.id,
                    user_id: selectedMembre,
                    cotisation_id: selectedCotisation,
                    montant,
                    year: selectedYear,
                    mode_paiement: "MOBILE_MONEY",
                    provider: mobileProvider,
                    date_paiement: new Date().toISOString().slice(0, 10),
                };
                const res = await fetch(
                    withBasePath("", "/responsable-famille/tresorerie/paiements/initiate"),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": getCsrfToken(),
                            Accept: "application/json",
                        },
                        credentials: "same-origin",
                        body: JSON.stringify(body),
                    },
                );
                if (!res.ok) {
                    const error = await res.json();
                    alert(error.message || "Erreur initiation paiement");
                    setIsSubmitting(false);
                    return;
                }
                const data = await res.json();
                // Ouvrir le modal au lieu de rediriger
                if (data.redirect_url && data.paiement_id) {
                    setPaymentUrl(data.redirect_url);
                    setPaymentPaiementId(data.paiement_id);
                    setIsPaymentModalOpen(true);
                }
            } else {
                // Paiement manuel (espèces/virement)
                const body = {
                    family_id: familyInfo?.id,
                    user_id: selectedMembre,
                    cotisation_id: selectedCotisation,
                    montant,
                    mode_paiement: payMethod.toUpperCase(),
                    date_paiement: new Date().toISOString().slice(0, 10),
                    fournisseur_mobile:
                        payMethod === "mobile" ? mobileProvider : null,
                    encaisseur_nom:
                        payMethod === "especes" ? cashForm.nom : null,
                    encaisseur_fonction:
                        payMethod === "especes" ? cashForm.fonction : null,
                    date_remise: payMethod === "especes" ? cashForm.date : null,
                    reference_virement:
                        payMethod === "virement"
                            ? virementForm.reference
                            : null,
                    banque_emettrice:
                        payMethod === "virement" ? virementForm.banque : null,
                };
                const res = await fetch(
                    withBasePath("", "/responsable-famille/tresorerie/paiements"),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": getCsrfToken(),
                            Accept: "application/json",
                        },
                        credentials: "same-origin",
                        body: JSON.stringify(body),
                    },
                );
                if (!res.ok) throw new Error();
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                }, 4000);
            }
        } catch (err) {
            console.error(err);
            alert("Échec de l'enregistrement du paiement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
        <div>
            <h3 style={sectionTitle}>Effectuer un paiement</h3>

            {success && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#eaf3de",
                        border: "0.5px solid #97c459",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        color: "#3b6d11",
                        fontSize: 13,
                    }}
                >
                    <CheckCircle size={16} /> Paiement enregistré avec succès !
                    Un reçu a été généré.
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Membre */}
                <div>
                    <label style={labelStyle}>Membre concerné</label>
                    <select
                        style={inputStyle}
                        value={selectedMembre}
                        onChange={(e) =>
                            setSelectedMembre(Number(e.target.value))
                        }
                    >
                        {membres.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.nom} — {m.role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type de cotisation */}
                <div>
                    <label style={labelStyle}>Type de cotisation</label>
                    <select
                        style={inputStyle}
                        value={selectedCotisation}
                        onChange={handleCotisationChange}
                    >
                        {cotisations.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nom} — Reste{" "}
                                {fmt(Number(c.montant_restant || 0))} F
                            </option>
                        ))}
                    </select>
                </div>

                {/* Année de cotisation */}
                <div>
                    <label style={labelStyle}>Année de cotisation</label>
                    <select
                        style={inputStyle}
                        value={selectedYear}
                        onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                        }
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Montant */}
                <div>
                    <label style={labelStyle}>Montant (F CFA)</label>
                    <input
                        type="number"
                        style={inputStyle}
                        value={montant}
                        onChange={(e) =>
                            setMontant(Number(e.target.value || 0))
                        }
                    />
                    <p
                        style={{
                            fontSize: 11,
                            color: "#888",
                            margin: "4px 0 0",
                        }}
                    >
                        Montant pré-rempli sur le reste à payer (modifiable)
                    </p>
                </div>

                {/* Mode de paiement */}
                <div>
                    <label style={labelStyle}>Mode de paiement</label>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                        }}
                    >
                        {[
                            {
                                id: "mobile",
                                label: "Mobile Money",
                                logo: (
                                    <svg
                                        viewBox="0 0 48 48"
                                        width="32"
                                        height="32"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect
                                            width="48"
                                            height="48"
                                            rx="10"
                                            fill="#f0effc"
                                        />
                                        <rect
                                            x="14"
                                            y="6"
                                            width="20"
                                            height="36"
                                            rx="3"
                                            fill="#3b2a8a"
                                        />
                                        <rect
                                            x="16"
                                            y="10"
                                            width="16"
                                            height="22"
                                            rx="1"
                                            fill="white"
                                        />
                                        <circle
                                            cx="24"
                                            cy="37"
                                            r="2"
                                            fill="white"
                                        />
                                        <rect
                                            x="20"
                                            y="8"
                                            width="8"
                                            height="1.5"
                                            rx="1"
                                            fill="#8b80cc"
                                        />
                                    </svg>
                                ),
                            },
                            {
                                id: "especes",
                                label: "Espèces",
                                logo: (
                                    <svg
                                        viewBox="0 0 48 48"
                                        width="32"
                                        height="32"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect
                                            width="48"
                                            height="48"
                                            rx="10"
                                            fill="#eaf3de"
                                        />
                                        <rect
                                            x="6"
                                            y="15"
                                            width="36"
                                            height="22"
                                            rx="3"
                                            fill="#1d9e75"
                                        />
                                        <rect
                                            x="10"
                                            y="19"
                                            width="28"
                                            height="14"
                                            rx="2"
                                            fill="#17855f"
                                        />
                                        <circle
                                            cx="24"
                                            cy="26"
                                            r="5"
                                            fill="#eaf3de"
                                        />
                                        <text
                                            x="24"
                                            y="30"
                                            textAnchor="middle"
                                            fontSize="8"
                                            fontWeight="700"
                                            fill="#1d9e75"
                                        >
                                            F
                                        </text>
                                        <rect
                                            x="8"
                                            y="13"
                                            width="6"
                                            height="4"
                                            rx="1"
                                            fill="#eaf3de"
                                        />
                                        <rect
                                            x="34"
                                            y="31"
                                            width="6"
                                            height="4"
                                            rx="1"
                                            fill="#eaf3de"
                                        />
                                    </svg>
                                ),
                            },
                            {
                                id: "virement",
                                label: "Virement",
                                logo: (
                                    <svg
                                        viewBox="0 0 48 48"
                                        width="32"
                                        height="32"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect
                                            width="48"
                                            height="48"
                                            rx="10"
                                            fill="#e6f1fb"
                                        />
                                        <rect
                                            x="8"
                                            y="28"
                                            width="32"
                                            height="12"
                                            rx="2"
                                            fill="#185fa5"
                                        />
                                        <rect
                                            x="8"
                                            y="22"
                                            width="32"
                                            height="7"
                                            rx="0"
                                            fill="#378add"
                                        />
                                        <path
                                            d="M8 24 L24 14 L40 24"
                                            fill="#185fa5"
                                        />
                                        <rect
                                            x="20"
                                            y="30"
                                            width="8"
                                            height="10"
                                            rx="1"
                                            fill="#b5d4f4"
                                        />
                                        <rect
                                            x="12"
                                            y="30"
                                            width="5"
                                            height="4"
                                            rx="1"
                                            fill="#b5d4f4"
                                        />
                                        <rect
                                            x="31"
                                            y="30"
                                            width="5"
                                            height="4"
                                            rx="1"
                                            fill="#b5d4f4"
                                        />
                                    </svg>
                                ),
                            },
                        ].map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setPayMethod(m.id)}
                                style={{
                                    border:
                                        payMethod === m.id
                                            ? "2px solid #3b2a8a"
                                            : "1px solid #e0e0e8",
                                    borderRadius: 12,
                                    padding: "14px 8px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    background:
                                        payMethod === m.id
                                            ? "#f0effc"
                                            : "white",
                                    transition: "all .15s",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                {m.logo}
                                <div
                                    style={{
                                        fontSize: 12,
                                        color:
                                            payMethod === m.id
                                                ? "#3b2a8a"
                                                : "#555",
                                        fontWeight:
                                            payMethod === m.id ? 600 : 400,
                                    }}
                                >
                                    {m.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile sub-providers avec logos locaux */}
                    {payMethod === "mobile" && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                marginTop: 10,
                            }}
                        >
                            {/* ── WAVE ── */}
                            <div
                                onClick={() => setMobileProvider("wave")}
                                style={{
                                    border:
                                        mobileProvider === "wave"
                                            ? "2px solid #1dc9fd"
                                            : "1px solid #e0e0e8",
                                    borderRadius: 10,
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                    background:
                                        mobileProvider === "wave"
                                            ? "#e6faff"
                                            : "white",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <img
                                    src={withBasePath("", "/images/wave.jpg")}
                                    alt="Wave"
                                    style={{
                                        width: 88,
                                        height: 36,
                                        objectFit: "contain",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight:
                                            mobileProvider === "wave"
                                                ? 700
                                                : 400,
                                        color:
                                            mobileProvider === "wave"
                                                ? "#0099bb"
                                                : "#888",
                                    }}
                                >
                                    Wave
                                </span>
                            </div>

                            {/* ── ORANGE MONEY ── */}
                            <div
                                onClick={() => setMobileProvider("orange")}
                                style={{
                                    border:
                                        mobileProvider === "orange"
                                            ? "2px solid #ff6600"
                                            : "1px solid #e0e0e8",
                                    borderRadius: 10,
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                    background:
                                        mobileProvider === "orange"
                                            ? "#fff5ee"
                                            : "white",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <img
                                    src={withBasePath(
                                        "",
                                        "/images/OM-logo.jpg",
                                    )}
                                    alt="Orange Money"
                                    style={{
                                        width: 88,
                                        height: 36,
                                        objectFit: "contain",
                                        background: "#111",
                                        borderRadius: 6,
                                        padding: 4,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight:
                                            mobileProvider === "orange"
                                                ? 700
                                                : 400,
                                        color:
                                            mobileProvider === "orange"
                                                ? "#cc4400"
                                                : "#888",
                                    }}
                                >
                                    Orange Money
                                </span>
                            </div>

                            {/* ── MTN MONEY ── */}
                            <div
                                onClick={() => setMobileProvider("mtn")}
                                style={{
                                    border:
                                        mobileProvider === "mtn"
                                            ? "2px solid #ffcc00"
                                            : "1px solid #e0e0e8",
                                    borderRadius: 10,
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                    background:
                                        mobileProvider === "mtn"
                                            ? "#fffbe6"
                                            : "white",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <img
                                    src={withBasePath(
                                        "",
                                        "/images/mtn-logo.png",
                                    )}
                                    alt="MTN Money"
                                    style={{
                                        width: 88,
                                        height: 36,
                                        objectFit: "contain",
                                        background: "#ffcc00",
                                        borderRadius: 6,
                                        padding: 4,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight:
                                            mobileProvider === "mtn"
                                                ? 700
                                                : 400,
                                        color:
                                            mobileProvider === "mtn"
                                                ? "#996600"
                                                : "#888",
                                    }}
                                >
                                    MTN Money
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Espèces form */}
                    {payMethod === "especes" && (
                        <div
                            style={{
                                marginTop: 10,
                                background: "#f8f8fc",
                                borderRadius: 10,
                                padding: 14,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#444",
                                    marginBottom: 2,
                                }}
                            >
                                📋 Formulaire de remise en espèces
                            </p>
                            <div>
                                <label style={labelStyle}>
                                    Nom de la personne ayant reçu l'argent *
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="Ex : Pasteur KOUAME"
                                    value={cashForm.nom}
                                    onChange={(e) =>
                                        setCashForm((p) => ({
                                            ...p,
                                            nom: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    Fonction / Rôle *
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="Ex : Trésorier"
                                    value={cashForm.fonction}
                                    onChange={(e) =>
                                        setCashForm((p) => ({
                                            ...p,
                                            fonction: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    Date de remise *
                                </label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={cashForm.date}
                                    onChange={(e) =>
                                        setCashForm((p) => ({
                                            ...p,
                                            date: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Virement form */}
                    {payMethod === "virement" && (
                        <div
                            style={{
                                marginTop: 10,
                                background: "#f8f8fc",
                                borderRadius: 10,
                                padding: 14,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#444",
                                    marginBottom: 2,
                                }}
                            >
                                🏦 Détails du virement
                            </p>
                            <div>
                                <label style={labelStyle}>
                                    Référence du virement *
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="Ex : VIR-2026-0042"
                                    value={virementForm.reference}
                                    onChange={(e) =>
                                        setVirementForm((p) => ({
                                            ...p,
                                            reference: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    Banque émettrice *
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="Ex : SGBCI, BNI, BSIC…"
                                    value={virementForm.banque}
                                    onChange={(e) =>
                                        setVirementForm((p) => ({
                                            ...p,
                                            banque: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        background: isSubmitting ? "#a09abe" : "#3b2a8a",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        padding: "13px 0",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "background .2s",
                    }}
                >
                    <CreditCard size={18} />
                    {isSubmitting
                        ? "Traitement…"
                        : payMethod === "mobile"
                          ? `Payer avec ${mobileProvider.charAt(0).toUpperCase() + mobileProvider.slice(1)} — ${fmt(montant)} XOF`
                          : `Valider le paiement — ${fmt(montant)} XOF`}
                </button>

                <div
                    style={{
                        padding: "10px 14px",
                        background:
                            payMethod === "mobile" ? "#e6f1fb" : "#e6f1fb",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#185fa5",
                    }}
                >
                    {payMethod === "mobile"
                        ? "💳 Confirmez votre paiement dans la fenêtre de paiement sécurisée."
                        : "📝 Vous enregistrez manuellement ce paiement dans le système."}
                </div>
            </div>

            {/* PaymentModal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                paymentUrl={paymentUrl}
                paiementId={paymentPaiementId}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentUrl(null);
                    setPaymentPaiementId(null);
                }}
                onSuccess={(result) => {
                    setPaymentResult({
                        status: "success",
                        message: "Paiement réussi !",
                        data: result,
                    });
                }}
                onError={(error) => {
                    setPaymentResult({
                        status: "error",
                        message: error || "Erreur lors du paiement",
                    });
                }}
            />

            {/* Résultat du paiement modal */}
            {paymentResult && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.6)",
                        zIndex: 1001,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                    onClick={() => setPaymentResult(null)}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "32px",
                            maxWidth: "400px",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {paymentResult.status === "success" ? (
                            <>
                                <div
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        background: "#eaf3de",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 20px",
                                    }}
                                >
                                    <CheckCircle
                                        size={36}
                                        style={{ color: "#1d9e75" }}
                                    />
                                </div>
                                <h2
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        color: "#1a1a2e",
                                        marginBottom: "12px",
                                    }}
                                >
                                    {paymentResult.message}
                                </h2>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#888",
                                        marginBottom: "24px",
                                    }}
                                >
                                    Votre transaction a été traitée avec succès.
                                </p>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        background: "#fcebeb",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 20px",
                                    }}
                                >
                                    <AlertTriangle
                                        size={36}
                                        style={{ color: "#e24b4a" }}
                                    />
                                </div>
                                <h2
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        color: "#1a1a2e",
                                        marginBottom: "12px",
                                    }}
                                >
                                    Erreur de paiement
                                </h2>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#888",
                                        marginBottom: "24px",
                                    }}
                                >
                                    {paymentResult.message}
                                </p>
                            </>
                        )}
                        <button
                            onClick={() => setPaymentResult(null)}
                            style={{
                                background: "#3b2a8a",
                                color: "white",
                                border: "none",
                                padding: "10px 24px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                            }}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabDons({ membres, donsFamille, campagnesActives, familyInfo }) {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Notification au retour d'un paiement en ligne (PayDunya)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const donStatus = params.get("don");
        if (!donStatus) return;
        if (donStatus === "success")
            showToast("✅ Paiement confirmé. Merci pour votre don !", "success");
        else if (donStatus === "cancelled")
            showToast("Paiement annulé.", "error");
        else if (donStatus === "failed")
            showToast("Le paiement a échoué. Veuillez réessayer.", "error");
        else
            showToast("Erreur lors du traitement du don.", "error");
        window.history.replaceState({}, "", window.location.pathname);
    }, []);

    const totalDons = donsFamille.reduce((s, d) => s + (d.montant ?? 0), 0);
    const dons = donsFamille;

    return (
        <div>
            {/* Toast retour paiement en ligne */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                    zIndex: 9999, background: toast.type === "error" ? "#e24b4a" : "#1d9e75",
                    color: "#fff", borderRadius: 10, padding: "12px 22px", fontSize: 13,
                    fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", gap: 10, minWidth: 260,
                }}>
                    <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
                    {toast.message}
                </div>
            )}

            {/* Info */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f0f4ff", border: "1px solid #d0d8f0",
                borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#444",
            }}>
                <span style={{ fontSize: 18 }}>ℹ️</span>
                Les dons sont enregistrés par le trésorier de classe ou via un paiement en ligne. Voici l'historique des contributions de votre famille.
            </div>

            {/* KPI total */}
            <div style={{
                background: "linear-gradient(135deg,#7f77dd,#534ab7)",
                borderRadius: 14, padding: "16px 20px", color: "white",
                display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            }}>
                <div style={{ fontSize: 28 }}>🎁</div>
                <div>
                    <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 1 }}>
                        Total des dons de la famille
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
                        {fmt(totalDons)} <span style={{ fontSize: 14, fontWeight: 500 }}>F CFA</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                        {dons.length} contribution{dons.length > 1 ? "s" : ""} enregistrée{dons.length > 1 ? "s" : ""}
                    </div>
                </div>
            </div>

            {/* Historique */}
            <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Historique des dons</h3>
            {dons.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "40px 0", color: "#aaa", fontSize: 13,
                    background: "#fafafa", borderRadius: 12, border: "1px dashed #e0e0e0",
                }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
                    Aucun don enregistré pour votre famille.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f8f8fc" }}>
                                {["Date", "Contributeur", "Campagne", "Affectation", "Montant"].map(h => (
                                    <th key={h} style={{
                                        padding: "8px 10px", textAlign: "left", color: "#888",
                                        fontWeight: 600, fontSize: 11, borderBottom: "2px solid #eee",
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dons.map((d, i) => (
                                <tr key={d.id ?? i} style={{
                                    borderBottom: "0.5px solid #f0f0f5",
                                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                                }}>
                                    <td style={{ padding: "10px 10px", color: "#666" }}>{d.date ?? "—"}</td>
                                    <td style={{ padding: "10px 10px", fontWeight: 600, color: "#1e2070" }}>{d.contributeur ?? "—"}</td>
                                    <td style={{ padding: "10px 10px", color: "#555" }}>{d.campagne ?? "Don libre"}</td>
                                    <td style={{ padding: "10px 10px" }}>
                                        <Badge color={d.affectation === "Classe" ? "green" : d.affectation === "Campagne" ? "orange" : "blue"}>
                                            {d.affectation ?? "GLOBAL"}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: "10px 10px", fontWeight: 700, color: "#1d9e75" }}>
                                        {fmt(Number(d.montant ?? 0))} F
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — HISTORIQUE
───────────────────────────────────────── */
function TabHistorique({ historique, membres, cotisations, onOpenReceipt }) {
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterMembre, setFilterMembre] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const filtered = useMemo(
        () =>
            historique.filter((p) => {
                const byType = !filterType || p.type === filterType;
                const byMembre = !filterMembre || p.membre === filterMembre;
                const byStatus =
                    !filterStatus || p.payment_status === filterStatus;
                return byType && byMembre && byStatus;
            }),
        [historique, filterType, filterMembre, filterStatus],
    );

    const getStatusBadge = (status) => {
        const styles = {
            PAYE: {
                bg: "#eaf3de",
                color: "#3b6d11",
                label: "Payé",
            },
            PARTIEL: {
                bg: "#fff8e1",
                color: "#b45309",
                label: "Partiel",
            },
            ECHEC: {
                bg: "#fcebeb",
                color: "#a32d2d",
                label: "Échoué",
            },
            ANNULE: {
                bg: "#faeeda",
                color: "#854f0b",
                label: "Annulé",
            },
            EN_ATTENTE: {
                bg: "#e6f1fb",
                color: "#185fa5",
                label: "En attente",
            },
            INITIE: {
                bg: "#e6f1fb",
                color: "#185fa5",
                label: "En attente",
            },
            EXPIRE: {
                bg: "#f5f5f5",
                color: "#666",
                label: "Expiré",
            },
        };
        return styles[status] || styles.EN_ATTENTE;
    };

    return (
        <div>
            <h3 style={sectionTitle}>Historique des paiements (Famille)</h3>

            {/* Récap */}
            <div style={{ marginBottom: 14 }}>
                <div
                    style={{
                        display: "inline-block",
                        background: "#f8f8fc",
                        borderRadius: 10,
                        padding: "12px 24px",
                        borderLeft: "3px solid #3b2a8a",
                    }}
                >
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
                        Nombre de paiements
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#3b2a8a", lineHeight: 1 }}>
                        {filtered.length}
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 14,
                }}
            >
                <select
                    style={selectStyle}
                    value={filterMembre}
                    onChange={(e) => setFilterMembre(e.target.value)}
                >
                    <option value="">Tous les membres</option>
                    {membres.map((m) => (
                        <option key={m.id}>{m.nom}</option>
                    ))}
                </select>
                <select
                    style={selectStyle}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Tous les types</option>
                    {cotisations.map((c) => (
                        <option key={c.id}>{c.nom}</option>
                    ))}
                </select>
                <select
                    style={selectStyle}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="PAYE">Payé</option>
                    <option value="PARTIEL">Partiel</option>
                    <option value="INITIE">En cours</option>
                    <option value="ECHEC">Échoué</option>
                    <option value="ANNULE">Annulé</option>
                </select>
            </div>


            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                    }}
                >
                    <thead>
                        <tr style={{ background: "#f8f8fc" }}>
                            {[
                                "Membre",
                                "Type",
                                "Montant",
                                "Mode",
                                "Date",
                                "Statut",
                            ].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "8px 10px",
                                        textAlign: "left",
                                        color: "#888",
                                        fontWeight: 500,
                                        fontSize: 11,
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => {
                            const statusBadge = getStatusBadge(
                                p.payment_status,
                            );
                            return (
                                <tr
                                    key={p.id}
                                    style={{
                                        borderBottom: "0.5px solid #f5f5f5",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            fontWeight: 500,
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.membre}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {p.type}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            fontWeight: 700,
                                            color: "#3b2a8a",
                                        }}
                                    >
                                        {fmtCurrency(p.montant)}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            color: "#666",
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.mode}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            color: "#888",
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.date}
                                    </td>
                                    <td style={{ padding: "9px 10px" }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "2px 10px",
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 500,
                                                background: statusBadge.bg,
                                                color: statusBadge.color,
                                            }}
                                        >
                                            {statusBadge.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#aaa",
                                        fontSize: 13,
                                    }}
                                >
                                    Aucun paiement pour ces filtres
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — NOTIFICATIONS
───────────────────────────────────────── */
function TabNotifications({ notifications }) {
    const icons = {
        success: {
            bg: "#eaf3de",
            icon: <CheckCircle size={16} color="#3b6d11" />,
        },
        warning: {
            bg: "#faeeda",
            icon: <AlertTriangle size={16} color="#854f0b" />,
        },
        info: { bg: "#e6f1fb", icon: <FileText size={16} color="#185fa5" /> },
        purple: { bg: "#eeedfe", icon: <Bell size={16} color="#534ab7" /> },
    };
    return (
        <div>
            <h3 style={sectionTitle}>Notifications</h3>
            {notifications.length === 0 && (
                <div style={{
                    textAlign: "center", padding: "40px 0", color: "#aaa",
                    background: "#fafafa", borderRadius: 12, border: "1px dashed #e0e0e0",
                    fontSize: 13,
                }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                    Aucune notification pour le moment.
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifications.map((n) => {
                    const ic = icons[n.type] || icons.info;
                    return (
                        <div
                            key={n.id}
                            style={{
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-start",
                                padding: "12px 14px",
                                background: n.lu ? "white" : "#f8f8fc",
                                border: "0.5px solid #eee",
                                borderRadius: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: ic.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {ic.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 13,
                                            color: "#1a1a2e",
                                        }}
                                    >
                                        {n.titre}
                                    </p>
                                    {!n.lu && (
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: "#3b2a8a",
                                                flexShrink: 0,
                                                marginTop: 4,
                                            }}
                                        />
                                    )}
                                </div>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "#666",
                                        margin: "3px 0 4px",
                                    }}
                                >
                                    {n.message}
                                </p>
                                <p style={{ fontSize: 10, color: "#bbb" }}>
                                    {n.date}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────── */
const sectionTitle = {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 16,
};
const labelStyle = {
    display: "block",
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
};
const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "0.5px solid #dde0ee",
    borderRadius: 8,
    fontSize: 13,
    color: "#1a1a2e",
    background: "white",
    outline: "none",
};
const selectStyle = {
    padding: "6px 10px",
    border: "0.5px solid #dde0ee",
    borderRadius: 8,
    fontSize: 12,
    color: "#444",
    background: "white",
    cursor: "pointer",
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ResponsableFamilleFinances({
    familyInfo: familyInfoProp,
    membres: membresProp,
    cotisations: cotisationsProp,
    campagnesActives: campagnesActivesProp,
    historiquePaiements: historiqueProp,
    donsFamille: donsProp,
    notifications: notifsProp,
}) {
    const [activeTab, setActiveTab] = useState("fimeco");
    const [openReceipt, setOpenReceipt] = useState(null);

    const familyInfo = familyInfoProp || null;
    const membres = Array.isArray(membresProp) ? membresProp : [];
    const cotisations = Array.isArray(cotisationsProp) ? cotisationsProp : [];
    const historique = Array.isArray(historiqueProp) ? historiqueProp : [];
    const donsFamille = Array.isArray(donsProp) ? donsProp : [];
    const campagnesActives = Array.isArray(campagnesActivesProp) ? campagnesActivesProp : [];
    const notifs = Array.isArray(notifsProp) ? notifsProp : [];

    const cotisationsNorm = cotisations.map((c) => ({
        ...c,
        montant_attendu:
            Number(c.montant_attendu) ||
            Number(c.montant || 0) * Math.max(1, membres.length),
        montant_paye: Number(c.montant_paye) || 0,
        montant_restant:
            Number(c.montant_restant) ||
            Math.max(
                0,
                (Number(c.montant_attendu) ||
                    Number(c.montant || 0) * Math.max(1, membres.length)) -
                    (Number(c.montant_paye) || 0),
            ),
        type_finance:
            c.type_finance ||
            (String(c.nom || "")
                .toLowerCase()
                .includes("fimeco")
                ? "FIMECO"
                : "COTISATION"),
    }));
    const fimecoCotisations = cotisationsNorm.filter(
        (c) => c.type_finance === "FIMECO",
    );
    const autresCotisations = cotisationsNorm.filter(
        (c) => c.type_finance !== "FIMECO",
    );

    const totalDues = membres.reduce((s, m) => s + m.cotisationDue, 0);
    const totalPaid = membres.reduce((s, m) => s + m.paiements, 0);
    const totalDons = donsFamille.reduce((s, d) => s + d.montant, 0);
    const unreadNotifs = notifs.filter((n) => !n.lu).length;

    const TABS = [
        { id: "fimeco", label: "🏦 FIMECO" },
        { id: "mes_cotisations", label: "📋 Mes cotisations" },
        { id: "membres", label: "👥 Membres" },
        { id: "dons", label: "🎁 Dons" },
        { id: "historique", label: "📜 Historique" },
        { id: "notifications", label: "🔔 Notifs", badge: unreadNotifs },
    ];

    return (
        <div
            className="min-h-screen"
            style={{
                background:
                    "var(--main-gradient, linear-gradient(135deg,#1a1a6e 0%,#3b2a8a 30%,#2d5a8e 60%,#4a7c59 100%))",
            }}
        >
            <Head title={`Finances — ${familyInfo.nom}`} />

            {/* Receipt modal */}
            <ReceiptModal
                receipt={openReceipt}
                onClose={() => setOpenReceipt(null)}
            />

            {/* Header */}
            <div
                style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    position: "sticky",
                    top: 0,
                    zIndex: 40,
                }}
            >
                <div
                    style={{
                        padding: "18px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <Link
                        href={withBasePath("", "/dashboard")}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1
                            style={{
                                color: "white",
                                fontSize: 20,
                                fontWeight: 700,
                                margin: 0,
                            }}
                        >
                            {familyInfo.nom}
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: 12,
                                margin: "3px 0 0",
                            }}
                        >
                            {familyInfo.chef} · {familyInfo.classe} ·{" "}
                            {familyInfo.totalMembers} membres
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    maxWidth: 10000,
                    margin: "0 auto",
                    padding: "28px 20px",
                }}
            >
                {/* KPI Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 14,
                        marginBottom: 24,
                    }}
                >
                    {[
                        {
                            label: "Cotisations payées",
                            value: `${fmtCurrency(totalPaid)}`,
                            color: "#1d9e75",
                            border: "#1d9e75",
                            sub: "Famille entière",
                            icon: <DollarSign size={28} color="#1d9e75" />,
                        },
                        {
                            label: "À payer",
                            value: `${fmtCurrency(totalDues)}`,
                            color: totalDues > 0 ? "#e24b4a" : "#185fa5",
                            border: totalDues > 0 ? "#e24b4a" : "#185fa5",
                            sub: totalDues > 0 ? "Action requise" : "À jour ✓",
                            icon: (
                                <CreditCard
                                    size={28}
                                    color={
                                        totalDues > 0 ? "#e24b4a" : "#185fa5"
                                    }
                                />
                            ),
                        },
                        {
                            label: "Dons effectués",
                            value: donsFamille.length,
                            color: "#7f77dd",
                            border: "#7f77dd",
                            sub: donsFamille.length > 0 ? `Total : ${fmtCurrency(totalDons)}` : "Aucun don",
                            icon: <Heart size={28} color="#7f77dd" />,
                        },
                    ].map((c) => (
                        <div
                            key={c.label}
                            style={{
                                background: "white",
                                borderRadius: 14,
                                padding: "18px 20px",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                                // borderTop: `3px solid ${c.border}`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: "#888",
                                            fontWeight: 500,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {c.label}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: typeof c.value === "number" ? 40 : 28,
                                            fontWeight: 800,
                                            color: c.color,
                                            margin: 0,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {c.value}
                                    </p>
                                </div>
                                {c.icon}
                            </div>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "#aaa",
                                    marginTop: 8,
                                }}
                            >
                                {c.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main panel */}
                <div
                    style={{
                        background: "white",
                        borderRadius: 14,
                        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                    }}
                >
                    {/* Tabs */}
                    <div
                        style={{
                            display: "flex",
                            borderBottom: "1px solid #eee",
                            overflowX: "auto",
                        }}
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "14px 18px",
                                    fontSize: 13,
                                    fontWeight:
                                        activeTab === tab.id ? 600 : 400,
                                    color:
                                        activeTab === tab.id
                                            ? "#3b2a8a"
                                            : "#888",
                                    background:
                                        activeTab === tab.id
                                            ? "#f5f4ff"
                                            : "transparent",
                                    borderTop: "none",
                                    borderLeft: "none",
                                    borderRight: "none",
                                    borderBottom:
                                        activeTab === tab.id
                                            ? "2px solid #3b2a8a"
                                            : "2px solid transparent",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    transition: "all .15s",
                                }}
                            >
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span
                                        style={{
                                            background: "#e24b4a",
                                            color: "white",
                                            borderRadius: 10,
                                            fontSize: 10,
                                            padding: "1px 6px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ padding: 24 }}>
                        {activeTab === "fimeco" && (
                            <TabCotisations
                                title="Cotisations FIMECO"
                                cotisations={fimecoCotisations}
                                historiquePaiements={historique}
                                familyInfo={familyInfo}
                            />
                        )}
                        {activeTab === "mes_cotisations" && (
                            <TabCotisations
                                title="Mes cotisations"
                                cotisations={autresCotisations}
                                historiquePaiements={historique}
                                familyInfo={familyInfo}
                            />
                        )}
                        {activeTab === "membres" && (
                            <TabMembres membres={membres} cotisations={cotisationsNorm} />
                        )}
                        {activeTab === "dons" && (
                            <TabDons
                                membres={membres}
                                donsFamille={donsFamille}
                                campagnesActives={campagnesActives}
                                familyInfo={familyInfo}
                            />
                        )}
                        {activeTab === "historique" && (
                            <TabHistorique
                                historique={historique}
                                membres={membres}
                                cotisations={cotisations}
                                onOpenReceipt={setOpenReceipt}
                            />
                        )}
                        {activeTab === "notifications" && (
                            <TabNotifications notifications={notifs} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
