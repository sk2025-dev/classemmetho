import React, { useState, useMemo } from "react";
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

/* ─────────────────────────────────────────
   FALLBACK DATA
───────────────────────────────────────── */
const FALLBACK_FAMILY = {
    id: 1,
    nom: "N'GORAN",
    chef: "MARYSE N'GORAN",
    classe: "Romains",
    totalMembers: 3,
};

const FALLBACK_MEMBRES = [
    {
        id: 1,
        nom: "MARYSE N'GORAN",
        role: "Chef",
        cotisationDue: 50000,
        paiements: 65000,
    },
    {
        id: 2,
        nom: "KONAN N'GORAN",
        role: "Conjoint",
        cotisationDue: 75000,
        paiements: 15000,
    },
    {
        id: 3,
        nom: "ANGE N'GORAN",
        role: "Enfant",
        cotisationDue: 50000,
        paiements: 0,
    },
];

const FALLBACK_COTISATIONS = [
    {
        id: 1,
        nom: "FIMECO",
        montant: 15000,
        periodicite: "Mensuel",
        statut: "Actif",
    },
    {
        id: 2,
        nom: "Affiliation CEMEC",
        montant: 50000,
        periodicite: "Annuel",
        statut: "Actif",
    },
    {
        id: 3,
        nom: "Cotisation Romains",
        montant: 10000,
        periodicite: "Mensuel",
        statut: "Actif",
    },
];

const FALLBACK_HISTORIQUE = [
    {
        id: 1,
        membre: "MARYSE N'GORAN",
        type: "FIMECO",
        montant: 15000,
        date: "16/03/2026",
        mode: "Virement",
        recu: "RECU-2-1-1",
    },
    {
        id: 2,
        membre: "MARYSE N'GORAN",
        type: "Affiliation CEMEC",
        montant: 50000,
        date: "15/03/2026",
        mode: "Virement",
        recu: "RECU-2-2-2",
    },
    {
        id: 3,
        membre: "KONAN N'GORAN",
        type: "FIMECO",
        montant: 15000,
        date: "10/03/2026",
        mode: "Mobile Money",
        recu: "RECU-2-3-1",
    },
    {
        id: 4,
        membre: "ANGE N'GORAN",
        type: "Cotisation Romains",
        montant: 10000,
        date: "05/03/2026",
        mode: "Espèces",
        recu: "RECU-2-4-1",
    },
    {
        id: 5,
        membre: "MARYSE N'GORAN",
        type: "FIMECO",
        montant: 15000,
        date: "14/02/2026",
        mode: "Virement",
        recu: "RECU-1-1-3",
    },
];

const FALLBACK_DONS = [
    {
        id: 1,
        date: "15/03/2026",
        montant: 25000,
        campagne: "Rénovation temple",
        contributeur: "MARYSE N'GORAN",
        affectation: "Campagne",
        recu: "DON-2026-001523",
    },
    {
        id: 2,
        date: "01/03/2026",
        montant: 10000,
        campagne: "Aide aux nécessiteux",
        contributeur: "KONAN N'GORAN",
        affectation: "Global",
        recu: "DON-2026-001401",
    },
    {
        id: 3,
        date: "14/02/2026",
        montant: 15000,
        campagne: "Solidarité classe",
        contributeur: "ANGE N'GORAN",
        affectation: "Classe",
        recu: "DON-2026-001203",
    },
];

const FALLBACK_NOTIFICATIONS = [
    {
        id: 1,
        type: "success",
        titre: "Paiement confirmé",
        message: "FIMECO 15 000 F validé — RECU-2-1-1",
        date: "Aujourd'hui, 09h14",
        lu: false,
    },
    {
        id: 2,
        type: "warning",
        titre: "Rappel de cotisation",
        message: "ANGE N'GORAN — Affiliation CEMEC due avant le 31/03",
        date: "Hier, 18h30",
        lu: false,
    },
    {
        id: 3,
        type: "info",
        titre: "Reçu disponible",
        message: "RECU-2-2-2 prêt au téléchargement",
        date: "15/03/2026",
        lu: true,
    },
    {
        id: 4,
        type: "purple",
        titre: "Clôture de campagne",
        message: "Campagne Rentrée 2025 clôturée — 450 000 F collectés",
        date: "28/02/2026",
        lu: true,
    },
];

const CAMPAGNES_DONS = [
    {
        id: "global",
        label: "Don libre",
        desc: "Contribution générale à l'église",
        tag: "Global",
        color: "#534ab7",
    },
    {
        id: "classe",
        label: "Classe Romains",
        desc: "Solidarité de classe",
        tag: "Classe",
        color: "#0f6e56",
    },
    {
        id: "renovation",
        label: "Rénovation temple",
        desc: "Campagne travaux en cours",
        tag: "Campagne",
        color: "#854f0b",
    },
    {
        id: "construction",
        label: "Projet Construction",
        desc: "Extension du bâtiment paroissial",
        tag: "Campagne",
        color: "#854f0b",
    },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const fmtK = (n) => `${Math.round(n / 1000)}K`;

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
function TabMembres({ membres }) {
    return (
        <div>
            <h3 style={sectionTitle}>
                Situation de vos {membres.length} membres
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
                                "Rôle",
                                "À payer",
                                "Payé",
                                "Statut",
                                "Actions",
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
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {membres.map((m) => (
                            <tr
                                key={m.id}
                                style={{ borderBottom: "0.5px solid #f0f0f0" }}
                            >
                                <td
                                    style={{
                                        padding: "11px 12px",
                                        fontWeight: 600,
                                        color: "#1a1a2e",
                                    }}
                                >
                                    {m.nom}
                                </td>
                                <td style={{ padding: "11px 12px" }}>
                                    <Badge color="purple">{m.role}</Badge>
                                </td>
                                <td
                                    style={{
                                        padding: "11px 12px",
                                        fontWeight: 700,
                                        color: "#e24b4a",
                                    }}
                                >
                                    {fmtK(m.cotisationDue)}
                                </td>
                                <td
                                    style={{
                                        padding: "11px 12px",
                                        fontWeight: 700,
                                        color: "#1d9e75",
                                    }}
                                >
                                    {fmtK(m.paiements)}
                                </td>
                                <td style={{ padding: "11px 12px" }}>
                                    <Badge
                                        color={
                                            m.cotisationDue === 0
                                                ? "green"
                                                : "red"
                                        }
                                    >
                                        {m.cotisationDue === 0
                                            ? "À jour ✓"
                                            : "En retard"}
                                    </Badge>
                                </td>
                                <td style={{ padding: "11px 12px" }}>
                                    <button
                                        style={{
                                            color: "#3b2a8a",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontWeight: 500,
                                        }}
                                    >
                                        Détails
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB — PAIEMENT
───────────────────────────────────────── */
function TabPaiement({ membres, cotisations, familyInfo }) {
    const [selectedMembre, setSelectedMembre] = useState(membres[0]?.id ?? "");
    const [selectedCotisation, setSelectedCotisation] = useState(
        cotisations[0]?.id ?? "",
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [montant, setMontant] = useState(cotisations[0]?.montant ?? 0);
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

    const handleCotisationChange = (e) => {
        const id = Number(e.target.value);
        setSelectedCotisation(id);
        const cot = cotisations.find((c) => c.id === id);
        if (cot) setMontant(cot.montant);
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
                    "/responsable-famille/tresorerie/paiements/initiate",
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
                    alert(
                        error.message ||
                            "Erreur initiation paiement"
                    );
                    setIsSubmitting(false);
                    return;
                }
                const data = await res.json();
                // Redirection vers PayDunya
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
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
                        payMethod === "virement" ? virementForm.reference : null,
                    banque_emettrice:
                        payMethod === "virement" ? virementForm.banque : null,
                };
                const res = await fetch(
                    "/responsable-famille/tresorerie/paiements",
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
                                {c.nom} — {fmt(c.montant)} F
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
                        disabled
                    />
                    <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
                        Montant fixe selon la cotisation
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
                                    src="/images/wave.jpg"
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
                                    src="/images/OM-logo.jpg"
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
                                    src="/images/mtn-logo.png"
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
                        background: payMethod === "mobile" ? "#e6f1fb" : "#e6f1fb",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#185fa5",
                    }}
                >
                    {payMethod === "mobile"
                        ? "💳 Vous serez redirigé vers PayDunya pour confirmer le paiement."
                        : "📝 Vous enregistrez manuellement ce paiement dans le système."}
                </div>
            </div>
        </div>
    );
}


function TabDons({ membres, donsFamille }) {
    const [selectedCampagne, setSelectedCampagne] = useState(null);
    const [donMontant, setDonMontant] = useState("");
    const [donMode, setDonMode] = useState("wave");
    const [donMembre, setDonMembre] = useState(membres[0]?.id ?? "");
    const [confirming, setConfirming] = useState(false);
    const [donSuccess, setDonSuccess] = useState(false);

    const PRESETS = [5000, 10000, 25000, 50000];

    const handleDonSubmit = async () => {
        if (!selectedCampagne || !donMontant) return;
        setConfirming(true);
        try {
            await fetch("/responsable-famille/tresorerie/dons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    Accept: "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    user_id: donMembre,
                    campagne: selectedCampagne,
                    montant: Number(donMontant),
                    mode_paiement: donMode,
                }),
            });
            setDonSuccess(true);
            setDonMontant("");
            setSelectedCampagne(null);
            setTimeout(() => setDonSuccess(false), 4000);
        } catch {
            alert("Erreur lors de l'enregistrement du don.");
        } finally {
            setConfirming(false);
        }
    };

    const totalDons = donsFamille.reduce((s, d) => s + d.montant, 0);

    return (
        <div>
            <h3 style={sectionTitle}>Réaliser un don</h3>

            {donSuccess && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#eeedfe",
                        border: "0.5px solid #7f77dd",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        color: "#534ab7",
                        fontSize: 13,
                    }}
                >
                    <CheckCircle size={16} /> Don enregistré ! Un reçu numérique
                    est disponible dans l'historique.
                </div>
            )}

            {/* Campagnes */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 20,
                }}
            >
                {CAMPAGNES_DONS.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => setSelectedCampagne(c.id)}
                        style={{
                            border:
                                selectedCampagne === c.id
                                    ? `2px solid ${c.color}`
                                    : "1px solid #e8e8f0",
                            borderRadius: 12,
                            padding: 14,
                            cursor: "pointer",
                            background:
                                selectedCampagne === c.id ? "#faf9ff" : "white",
                            transition: "all .15s",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#1a1a2e",
                            }}
                        >
                            {c.label}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "#888",
                                margin: "4px 0 8px",
                            }}
                        >
                            {c.desc}
                        </div>
                        <span
                            style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 10,
                                fontWeight: 500,
                                background: c.color + "22",
                                color: c.color,
                            }}
                        >
                            {c.tag}
                        </span>
                    </div>
                ))}
            </div>

            {/* Formulaire don */}
            {selectedCampagne && (
                <div
                    style={{
                        background: "#f8f8fc",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>
                        Don —{" "}
                        {
                            CAMPAGNES_DONS.find(
                                (c) => c.id === selectedCampagne,
                            )?.label
                        }
                    </p>

                    <div>
                        <label style={labelStyle}>Contributeur</label>
                        <select
                            style={inputStyle}
                            value={donMembre}
                            onChange={(e) =>
                                setDonMembre(Number(e.target.value))
                            }
                        >
                            {membres.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Montant rapide</label>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {PRESETS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setDonMontant(String(p))}
                                    style={{
                                        border:
                                            donMontant === String(p)
                                                ? "1.5px solid #7f77dd"
                                                : "0.5px solid #ddd",
                                        borderRadius: 8,
                                        padding: "5px 12px",
                                        background:
                                            donMontant === String(p)
                                                ? "#eeedfe"
                                                : "white",
                                        color:
                                            donMontant === String(p)
                                                ? "#534ab7"
                                                : "#555",
                                        fontSize: 12,
                                        cursor: "pointer",
                                    }}
                                >
                                    {fmt(p)} F
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>
                            Ou saisir un montant libre (F CFA)
                        </label>
                        <input
                            type="number"
                            style={inputStyle}
                            placeholder="Montant personnalisé"
                            value={donMontant}
                            onChange={(e) => setDonMontant(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Mode de paiement</label>
                        <select
                            style={inputStyle}
                            value={donMode}
                            onChange={(e) => setDonMode(e.target.value)}
                        >
                            <option value="wave">Wave</option>
                            <option value="orange">Orange Money</option>
                            <option value="mtn">MTN Money</option>
                            <option value="especes">Espèces</option>
                            <option value="virement">Virement</option>
                        </select>
                    </div>

                    <button
                        onClick={handleDonSubmit}
                        disabled={confirming || !donMontant}
                        style={{
                            background:
                                confirming || !donMontant
                                    ? "#b8b6d9"
                                    : "#7f77dd",
                            color: "white",
                            border: "none",
                            borderRadius: 10,
                            padding: "11px 0",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor:
                                confirming || !donMontant
                                    ? "not-allowed"
                                    : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <Heart size={16} />
                        {confirming
                            ? "Confirmation…"
                            : `Confirmer le don — ${fmt(Number(donMontant) || 0)} F`}
                    </button>
                </div>
            )}

            {/* Historique dons */}
            <h3 style={{ ...sectionTitle, marginTop: 24, marginBottom: 10 }}>
                Historique des dons familiaux
            </h3>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                <span style={{ fontSize: 12, color: "#888" }}>
                    Total :{" "}
                    <strong style={{ color: "#7f77dd" }}>
                        {fmt(totalDons)} F CFA
                    </strong>
                </span>
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
                                "Contributeur",
                                "Campagne",
                                "Affectation",
                                "Montant",
                                "Date",
                                "Reçu",
                            ].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "7px 10px",
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
                        {donsFamille.map((d) => (
                            <tr
                                key={d.id}
                                style={{ borderBottom: "0.5px solid #f5f5f5" }}
                            >
                                <td
                                    style={{
                                        padding: "9px 10px",
                                        fontWeight: 500,
                                    }}
                                >
                                    {d.contributeur}
                                </td>
                                <td
                                    style={{
                                        padding: "9px 10px",
                                        color: "#555",
                                    }}
                                >
                                    {d.campagne}
                                </td>
                                <td style={{ padding: "9px 10px" }}>
                                    <Badge
                                        color={
                                            d.affectation === "Global"
                                                ? "blue"
                                                : d.affectation === "Classe"
                                                  ? "green"
                                                  : "amber"
                                        }
                                    >
                                        {d.affectation}
                                    </Badge>
                                </td>
                                <td
                                    style={{
                                        padding: "9px 10px",
                                        fontWeight: 700,
                                        color: "#7f77dd",
                                    }}
                                >
                                    {fmt(d.montant)} F
                                </td>
                                <td
                                    style={{
                                        padding: "9px 10px",
                                        color: "#888",
                                    }}
                                >
                                    {d.date}
                                </td>
                                <td
                                    style={{
                                        padding: "9px 10px",
                                        color: "#3b2a8a",
                                        fontSize: 11,
                                    }}
                                >
                                    {d.recu}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
                const byStatus = !filterStatus || p.payment_status === filterStatus;
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
                bg: "#f0effc",
                color: "#3b2a8a",
                label: "Initié",
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
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="ECHEC">Échoué</option>
                    <option value="ANNULE">Annulé</option>
                    <option value="INITIE">Initié</option>
                    <option value="EXPIRE">Expiré</option>
                </select>
            </div>

            {/* Export */}
            <button
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#3b2a8a",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 16,
                }}
            >
                <Download size={14} /> Exporter PDF
            </button>

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
                                "Année",
                                "Montant",
                                "Mode",
                                "Date",
                                "Statut",
                                "Reçu",
                                "Actions",
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
                            const statusBadge = getStatusBadge(p.payment_status);
                            return (
                                <tr
                                    key={p.id}
                                    style={{ borderBottom: "0.5px solid #f5f5f5" }}
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
                                            color: "#888",
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.year || "-"}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 10px",
                                            fontWeight: 700,
                                            color: "#3b2a8a",
                                        }}
                                    >
                                        {fmtK(p.montant)}
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
                                    <td style={{ padding: "9px 10px" }}>
                                        <button
                                            onClick={() => onOpenReceipt(p)}
                                            style={{
                                                color: "#3b2a8a",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontSize: 11,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {p.recu}
                                        </button>
                                    </td>
                                    <td style={{ padding: "9px 10px" }}>
                                        <button
                                            onClick={() => onOpenReceipt(p)}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                color: "#3b2a8a",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontSize: 11,
                                                fontWeight: 500,
                                            }}
                                        >
                                            <Download size={13} /> PDF
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
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
    historiquePaiements: historiqueProp,
    donsFamille: donsProp,
    notifications: notifsProp,
}) {
    const [activeTab, setActiveTab] = useState("consultation");
    const [openReceipt, setOpenReceipt] = useState(null);

    const familyInfo = familyInfoProp || FALLBACK_FAMILY;
    const membres =
        Array.isArray(membresProp) && membresProp.length
            ? membresProp
            : FALLBACK_MEMBRES;
    const cotisations =
        Array.isArray(cotisationsProp) && cotisationsProp.length
            ? cotisationsProp
            : FALLBACK_COTISATIONS;
    const historique =
        Array.isArray(historiqueProp) && historiqueProp.length
            ? historiqueProp
            : FALLBACK_HISTORIQUE;
    const donsFamille =
        Array.isArray(donsProp) && donsProp.length ? donsProp : FALLBACK_DONS;
    const notifs =
        Array.isArray(notifsProp) && notifsProp.length
            ? notifsProp
            : FALLBACK_NOTIFICATIONS;

    const totalDues = membres.reduce((s, m) => s + m.cotisationDue, 0);
    const totalPaid = membres.reduce((s, m) => s + m.paiements, 0);
    const totalDons = donsFamille.reduce((s, d) => s + d.montant, 0);
    const unreadNotifs = notifs.filter((n) => !n.lu).length;

    const TABS = [
        { id: "consultation", label: "📋 Consultation" },
        { id: "membres", label: "👥 Membres" },
        { id: "paiement", label: "💳 Paiement" },
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
                        maxWidth: 960,
                        margin: "0 auto",
                        padding: "18px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <Link
                        href="/dashboard"
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
                    maxWidth: 960,
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
                            value: `${fmtK(totalPaid)}`,
                            color: "#1d9e75",
                            border: "#1d9e75",
                            sub: "Famille entière",
                            icon: <DollarSign size={28} color="#1d9e75" />,
                        },
                        {
                            label: "À payer",
                            value: `${fmtK(totalDues)}`,
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
                            label: "Dons collectés",
                            value: `${fmtK(totalDons)}`,
                            color: "#7f77dd",
                            border: "#7f77dd",
                            sub: "Solidarité familiale",
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
                                borderTop: `3px solid ${c.border}`,
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
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: c.color,
                                            margin: 0,
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
                        {activeTab === "consultation" && (
                            <TabConsultation
                                cotisations={cotisations}
                                membres={membres}
                                totalDues={totalDues}
                            />
                        )}
                        {activeTab === "membres" && (
                            <TabMembres membres={membres} />
                        )}
                        {activeTab === "paiement" && (
                            <TabPaiement
                                membres={membres}
                                cotisations={cotisations}
                                familyInfo={familyInfo}
                            />
                        )}
                        {activeTab === "dons" && (
                            <TabDons
                                membres={membres}
                                donsFamille={donsFamille}
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

