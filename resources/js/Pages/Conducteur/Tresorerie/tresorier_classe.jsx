import React, { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { withBasePath } from "@/Utils/urlHelper";

const fmt = (n) =>
    `${Number(n || 0).toLocaleString("fr-FR", {
        maximumFractionDigits: 0,
    })} F CFA`;

const todayStr = () => new Date().toISOString().slice(0, 10);

const modeLabel = (mode) => {
    if (mode === "ESPECES") return "Espèces";
    if (mode === "VIREMENT") return "Virement";
    return "Mobile Money";
};

const displayDate = (isoDate) => {
    if (!isoDate) return "-";
    const chunks = String(isoDate).split("-");
    if (chunks.length !== 3) return String(isoDate);
    return `${chunks[2]}/${chunks[1]}/${chunks[0]}`;
};

const normalizeDateForCompare = (rawDate) => {
    if (!rawDate) return "";
    const value = String(rawDate).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parts = value.split("/");
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        if (dd && mm && yyyy) {
            return `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }
    }

    return "";
};

const PAGE_SIZE = 10;

const paginateRows = (rows, page, pageSize = PAGE_SIZE) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const total = safeRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageRows = safeRows.slice(start, start + pageSize);

    return {
        rows: pageRows,
        total,
        totalPages,
        currentPage,
        pageSize,
    };
};

const tabBtn = (active, id) => ({
    padding: "8px 14px",
    borderRadius: 10,
    border: active === id ? "1px solid #0B5FFF" : "1px solid #D1D5DB",
    background: active === id ? "#EFF6FF" : "#FFFFFF",
    color: active === id ? "#0B5FFF" : "#374151",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
});

const inputStyle = {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 12,
    outline: "none",
};

const modalBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 14,
};

const modalCard = {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #E5E7EB",
    padding: 16,
};

function Modal({ open, title, onClose, children }) {
    if (!open) return null;
    return (
        <div style={modalBackdrop} onClick={onClose}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                    }}
                >
                    <h3
                        style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "#F3F4F6",
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                    >
                        Fermer
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function PaginationControls({ pagination, onPageChange }) {
    if (!pagination || pagination.total <= pagination.pageSize) return null;

    const pageNumbers = Array.from(
        { length: pagination.totalPages },
        (_, i) => i + 1,
    );

    return (
        <div
            style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
            }}
        >
            <span style={{ fontSize: 11, color: "#6B7280" }}>
                {pagination.total} élément{pagination.total > 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    style={{
                        border: "1px solid #D1D5DB",
                        background: "#fff",
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor:
                            pagination.currentPage <= 1
                                ? "not-allowed"
                                : "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151",
                    }}
                >
                    Préc.
                </button>
                {pageNumbers.map((num) => (
                    <button
                        key={num}
                        onClick={() => onPageChange(num)}
                        style={{
                            border:
                                pagination.currentPage === num
                                    ? "1px solid #0B5FFF"
                                    : "1px solid #D1D5DB",
                            background:
                                pagination.currentPage === num
                                    ? "#EFF6FF"
                                    : "#fff",
                            borderRadius: 8,
                            padding: "6px 9px",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                                pagination.currentPage === num
                                    ? "#0B5FFF"
                                    : "#374151",
                        }}
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    style={{
                        border: "1px solid #D1D5DB",
                        background: "#fff",
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor:
                            pagination.currentPage >= pagination.totalPages
                                ? "not-allowed"
                                : "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151",
                    }}
                >
                    Suiv.
                </button>
            </div>
        </div>
    );
}

export default function TresorierClasse({
    classInfo = {},
    membresClasse = [],
    cotisationsPaiement = [],
    paiementsHistorique = [],
    fimecoHistorique = [],
    donsClasse = [],
    retardsClasse = [],
}) {
    const [activeTab, setActiveTab] = useState("fimeco");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [modalPaiement, setModalPaiement] = useState(false);
    const [modalDon, setModalDon] = useState(false);
    const [modalRappel, setModalRappel] = useState(null);

    const [paiementForm, setPaiementForm] = useState({
        user_id: "",
        cotisation_id: "",
        montant: "",
        mode_paiement: "ESPECES",
        date_paiement: todayStr(),
        note: "Paiement saisi par le trésorier de classe",
    });

    const [donForm, setDonForm] = useState({
        user_id: "",
        montant: "",
        type: "LIBRE",
        mode_paiement: "ESPECES",
        date_don: todayStr(),
        note: "Don saisi par le trésorier de classe",
    });

    const [rappelForm, setRappelForm] = useState({
        user_id: "",
        cotisation: "",
        message: "",
    });

    const [fimecoPage, setFimecoPage] = useState(1);
    const [paiementsPage, setPaiementsPage] = useState(1);
    const [donsPage, setDonsPage] = useState(1);
    const [retardsPage, setRetardsPage] = useState(1);

    const [filters, setFilters] = useState({
        famille: "",
        codeMembre: "",
        typeCotisation: "",
        date: "",
    });

    const [paiementsRows, setPaiementsRows] = useState(paiementsHistorique);
    const [donsRows, setDonsRows] = useState(donsClasse);

    const filterNeedleFamille = String(filters.famille || "")
        .trim()
        .toLowerCase();
    const filterNeedleCode = String(filters.codeMembre || "")
        .trim()
        .toLowerCase();
    const filterNeedleCotisation = String(filters.typeCotisation || "")
        .trim()
        .toLowerCase();
    const filterDate = normalizeDateForCompare(filters.date);

    const csrf = () => {
        const t = document.querySelector('meta[name="csrf-token"]');
        return t ? t.getAttribute("content") : "";
    };

    const postJson = async (url, payload) => {
        const r = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrf(),
                Accept: "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        });

        if (!r.ok) {
            let message = "Erreur serveur.";
            try {
                const data = await r.json();
                message =
                    data?.message ||
                    Object.values(data?.errors || {})
                        .flat()
                        .join(" ") ||
                    message;
            } catch (_e) {
                // no-op
            }
            throw new Error(message);
        }

        return r.json();
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2800);
    };

    const memberOptions = useMemo(
        () =>
            membresClasse.map((m) => ({
                label: `${m.nom} (${m.famille || "-"})${m.code_membre ? ` · ${m.code_membre}` : ""}`,
                value: String(m.id),
            })),
        [membresClasse],
    );

    const cotisationTypeOptions = useMemo(() => {
        const source = [
            ...paiementsRows.map((r) => r.cotisation),
            ...fimecoHistorique.map((r) => r.cotisation),
            ...retardsClasse.map((r) => r.cotisation),
            ...cotisationsPaiement.map((c) => c.nom),
        ];

        return Array.from(
            new Set(
                source
                    .map((value) => String(value || "").trim())
                    .filter(Boolean),
            ),
        ).sort((a, b) => a.localeCompare(b, "fr"));
    }, [cotisationsPaiement, fimecoHistorique, paiementsRows, retardsClasse]);

    const matchesFilters = (row) => {
        const famille = String(row?.famille || "").toLowerCase();
        const codeMembre = String(
            row?.code_membre || row?.codeMembre || "",
        ).toLowerCase();
        const cotisation = String(row?.cotisation || "").toLowerCase();
        const rowDate = normalizeDateForCompare(row?.date || row?.date_echeance);

        if (filterNeedleFamille && !famille.includes(filterNeedleFamille)) {
            return false;
        }

        if (filterNeedleCode && !codeMembre.includes(filterNeedleCode)) {
            return false;
        }

        if (
            filterNeedleCotisation &&
            !cotisation.includes(filterNeedleCotisation)
        ) {
            return false;
        }

        if (filterDate && rowDate !== filterDate) {
            return false;
        }

        return true;
    };

    const filteredFimecoRows = useMemo(
        () => fimecoHistorique.filter(matchesFilters),
        [
            fimecoHistorique,
            filterNeedleFamille,
            filterNeedleCode,
            filterNeedleCotisation,
            filterDate,
        ],
    );

    const filteredPaiementsRows = useMemo(
        () => paiementsRows.filter(matchesFilters),
        [
            paiementsRows,
            filterNeedleFamille,
            filterNeedleCode,
            filterNeedleCotisation,
            filterDate,
        ],
    );

    const filteredRetardsRows = useMemo(
        () => retardsClasse.filter(matchesFilters),
        [
            retardsClasse,
            filterNeedleFamille,
            filterNeedleCode,
            filterNeedleCotisation,
            filterDate,
        ],
    );

    const fimecoPagination = useMemo(
        () => paginateRows(filteredFimecoRows, fimecoPage),
        [filteredFimecoRows, fimecoPage],
    );

    const paiementsPagination = useMemo(
        () => paginateRows(filteredPaiementsRows, paiementsPage),
        [filteredPaiementsRows, paiementsPage],
    );

    const donsPagination = useMemo(
        () => paginateRows(donsRows, donsPage),
        [donsRows, donsPage],
    );

    const retardsPagination = useMemo(
        () => paginateRows(filteredRetardsRows, retardsPage),
        [filteredRetardsRows, retardsPage],
    );

    useEffect(() => {
        setFimecoPage(1);
        setPaiementsPage(1);
        setRetardsPage(1);
    }, [filterNeedleFamille, filterNeedleCode, filterNeedleCotisation, filterDate]);

    const openRappelModal = (row) => {
        setRappelForm({
            user_id: String(row.user_id),
            cotisation: row.cotisation,
            message: `Bonjour ${row.nom}, rappel de paiement pour ${row.cotisation}. Reste dû: ${fmt(row.montant_du)}. Merci de régulariser.`,
        });
        setModalRappel(row);
    };

    const handleSavePaiement = async () => {
        const montant = Number(paiementForm.montant || 0);
        if (!paiementForm.user_id || montant < 100) {
            showToast(
                "Sélectionne un membre et un montant valide (>= 100).",
                "error",
            );
            return;
        }

        setLoading(true);
        try {
            const res = await postJson(withBasePath("", "/tresorier/tresorerie/paiements"), {
                ...paiementForm,
                user_id: Number(paiementForm.user_id),
                cotisation_id: paiementForm.cotisation_id
                    ? Number(paiementForm.cotisation_id)
                    : null,
                montant,
            });

            const selectedMember = membresClasse.find(
                (m) => String(m.id) === String(paiementForm.user_id),
            );
            const selectedCotisation = cotisationsPaiement.find(
                (c) => String(c.id) === String(paiementForm.cotisation_id),
            );
            const createdId =
                res?.data?.id ?? `tmp-paiement-${Date.now()}-${Math.random()}`;

            setPaiementsRows((prev) => [
                {
                    id: createdId,
                    membre: selectedMember?.nom || "-",
                    code_membre: selectedMember?.code_membre || "",
                    famille: selectedMember?.famille || "-",
                    cotisation: selectedCotisation?.nom || "-",
                    montant,
                    mode: paiementForm.mode_paiement,
                    date: displayDate(paiementForm.date_paiement),
                },
                ...prev,
            ]);

            setModalPaiement(false);
            setPaiementForm({
                user_id: "",
                cotisation_id: "",
                montant: "",
                mode_paiement: "ESPECES",
                date_paiement: todayStr(),
                note: "Paiement saisi par le trésorier de classe",
            });
            setPaiementsPage(1);
            setActiveTab("cotisations");
            showToast("Paiement enregistré avec succès.");
        } catch (e) {
            showToast(
                e?.message || "Erreur lors de l'enregistrement du paiement.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDon = async () => {
        const montant = Number(donForm.montant || 0);
        if (!donForm.user_id || montant < 100) {
            showToast(
                "Sélectionne un donateur et un montant valide (>= 100).",
                "error",
            );
            return;
        }

        setLoading(true);
        try {
            const res = await postJson(withBasePath("", "/tresorier/tresorerie/dons"), {
                user_id: Number(donForm.user_id),
                montant,
                type: donForm.type,
                mode_paiement: donForm.mode_paiement,
                date_don: donForm.date_don,
                note: donForm.note,
            });

            const selectedMember = membresClasse.find(
                (m) => String(m.id) === String(donForm.user_id),
            );
            const createdId =
                res?.data?.id ?? `tmp-don-${Date.now()}-${Math.random()}`;

            setDonsRows((prev) => [
                {
                    id: createdId,
                    donateur: selectedMember?.nom || "Anonyme",
                    famille: selectedMember?.famille || "-",
                    type: donForm.type,
                    montant,
                    mode: donForm.mode_paiement,
                    date: displayDate(donForm.date_don),
                    note: donForm.note,
                },
                ...prev,
            ]);

            setModalDon(false);
            setDonForm({
                user_id: "",
                montant: "",
                type: "LIBRE",
                mode_paiement: "ESPECES",
                date_don: todayStr(),
                note: "Don saisi par le trésorier de classe",
            });
            setDonsPage(1);
            setActiveTab("dons");
            showToast("Don enregistré avec succès.");
        } catch (e) {
            showToast(
                e?.message || "Erreur lors de l'enregistrement du don.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSendRappel = async () => {
        if (!rappelForm.user_id || !String(rappelForm.message || "").trim()) {
            showToast("Le membre et le message sont requis.", "error");
            return;
        }

        setLoading(true);
        try {
            await postJson(withBasePath("", "/tresorier/tresorerie/rappels"), {
                user_id: Number(rappelForm.user_id),
                cotisation: rappelForm.cotisation,
                message: rappelForm.message,
            });
            setModalRappel(null);
            showToast("Rappel envoyé avec succès.");
        } catch (e) {
            showToast(
                e?.message || "Erreur lors de l'envoi du rappel.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                // background: "linear-gradient(135deg,#EAF3FF,#F7FAFF)",
                padding: "20px 24px",
            }}
        >
            <Head title="Trésorerie de ma classe" />

            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 16,
                        right: 16,
                        zIndex: 4000,
                        background:
                            toast.type === "success"
                                ? "linear-gradient(135deg,#166534,#15803D)"
                                : "linear-gradient(135deg,#7F1D1D,#B91C1C)",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    {toast.message}
                </div>
            )}

            <div
                style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 14,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        href={withBasePath("", "/dashboard")}
                        style={{
                            textDecoration: "none",
                            border: "1px solid rgba(148,163,184,0.35)",
                            borderRadius: 12,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#1F2937",
                            background: "rgba(255,255,255,0.55)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                            display: "inline-flex",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Retour au dashboard
                    </Link>
                    <div style={{ minWidth: 260 }}>
                        <h1
                            style={{
                                fontSize: 20,
                                fontWeight: 800,
                                color: "#111827",
                            }}
                        >
                            Trésorerie de ma classe
                        </h1>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>
                            Classe: {classInfo?.nom || "-"} · Espace assistant
                            du conducteur
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    flexWrap: "wrap",
                }}
            >
                <button
                    style={tabBtn(activeTab, "fimeco")}
                    onClick={() => setActiveTab("fimeco")}
                >
                    FIMECO
                </button>
                <button
                    style={tabBtn(activeTab, "cotisations")}
                    onClick={() => setActiveTab("cotisations")}
                >
                    Cotisations
                </button>
                <button
                    style={tabBtn(activeTab, "dons")}
                    onClick={() => setActiveTab("dons")}
                >
                    Dons
                </button>
                <button
                    style={tabBtn(activeTab, "rappels")}
                    onClick={() => setActiveTab("rappels")}
                >
                    Rappels
                </button>
            </div>

            <div
                style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 12,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                }}
            >
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                        Recherche par famille
                    </label>
                    <input
                        style={inputStyle}
                        type="text"
                        value={filters.famille}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                famille: e.target.value,
                            }))
                        }
                        placeholder="Nom de famille"
                    />
                </div>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                        Recherche par code membre
                    </label>
                    <input
                        style={inputStyle}
                        type="text"
                        value={filters.codeMembre}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                codeMembre: e.target.value,
                            }))
                        }
                        placeholder="Ex: MBR-001"
                    />
                </div>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                        Type cotisation
                    </label>
                    <select
                        style={inputStyle}
                        value={filters.typeCotisation}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                typeCotisation: e.target.value,
                            }))
                        }
                    >
                        <option value="">Toutes</option>
                        {cotisationTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700 }}>
                        Recherche par date
                    </label>
                    <input
                        style={inputStyle}
                        type="date"
                        value={filters.date}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                date: e.target.value,
                            }))
                        }
                    />
                </div>
            </div>

            <div
                style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 14,
                    padding: 14,
                }}
            >
                {activeTab === "fimeco" && (
                    <>
                        <h2
                            style={{
                                fontSize: 15,
                                fontWeight: 800,
                                marginBottom: 10,
                            }}
                        >
                            Historique FIMECO (paiements enregistrés)
                        </h2>
                        <div style={{ overflowX: "auto" }}>
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
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Membre
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Famille
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Cotisation
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Montant
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "center",
                                            }}
                                        >
                                            Mode
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fimecoPagination.total === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    padding: 12,
                                                    textAlign: "center",
                                                    color: "#9CA3AF",
                                                }}
                                            >
                                                Aucun paiement FIMECO trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        fimecoPagination.rows.map((row) => (
                                            <tr key={row.id}>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.membre}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.famille}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.cotisation}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {fmt(row.montant)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {modeLabel(row.mode)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {row.date}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            pagination={fimecoPagination}
                            onPageChange={setFimecoPage}
                        />
                    </>
                )}

                {activeTab === "cotisations" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                            }}
                        >
                            <h2 style={{ fontSize: 15, fontWeight: 800 }}>
                                Saisie des paiements en espèce
                            </h2>
                            <button
                                onClick={() => setModalPaiement(true)}
                                style={{
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background:
                                        "linear-gradient(135deg,#0F6E56,#1D9E75)",
                                    color: "#fff",
                                }}
                            >
                                Enregistrer un paiement
                            </button>
                        </div>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>
                            Le trésorier saisit ici les paiements manuels
                            (espèces / virement / mobile money).
                        </p>
                        <div style={{ overflowX: "auto", marginTop: 12 }}>
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
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Membre
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Famille
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Cotisation
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Montant
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "center",
                                            }}
                                        >
                                            Mode
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paiementsPagination.total === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    padding: 12,
                                                    textAlign: "center",
                                                    color: "#9CA3AF",
                                                }}
                                            >
                                                Aucun paiement enregistré.
                                            </td>
                                        </tr>
                                    ) : (
                                        paiementsPagination.rows.map((row) => (
                                            <tr key={row.id}>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.membre}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.famille}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.cotisation}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {fmt(row.montant)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {modeLabel(row.mode)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {row.date}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            pagination={paiementsPagination}
                            onPageChange={setPaiementsPage}
                        />
                    </>
                )}

                {activeTab === "dons" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                            }}
                        >
                            <h2 style={{ fontSize: 15, fontWeight: 800 }}>
                                Dons enregistrés
                            </h2>
                            <button
                                onClick={() => setModalDon(true)}
                                style={{
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background:
                                        "linear-gradient(135deg,#1E3A8A,#2563EB)",
                                    color: "#fff",
                                }}
                            >
                                Enregistrer un don
                            </button>
                        </div>
                        <div style={{ overflowX: "auto" }}>
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
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Donateur
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Famille
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "center",
                                            }}
                                        >
                                            Type
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Montant
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "center",
                                            }}
                                        >
                                            Mode
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donsPagination.total === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    padding: 12,
                                                    textAlign: "center",
                                                    color: "#9CA3AF",
                                                }}
                                            >
                                                Aucun don enregistré.
                                            </td>
                                        </tr>
                                    ) : (
                                        donsPagination.rows.map((row) => (
                                            <tr key={row.id}>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.donateur}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                    }}
                                                >
                                                    {row.famille}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {row.type}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {fmt(row.montant)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {modeLabel(row.mode)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: 8,
                                                        borderTop:
                                                            "1px solid #F3F4F6",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {row.date}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            pagination={donsPagination}
                            onPageChange={setDonsPage}
                        />
                    </>
                )}

                {activeTab === "rappels" && (
                    <>
                        <h2
                            style={{
                                fontSize: 15,
                                fontWeight: 800,
                                marginBottom: 10,
                            }}
                        >
                            Membres en retard
                        </h2>
                        <div style={{ overflowX: "auto" }}>
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
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Membre
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Famille
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "left",
                                            }}
                                        >
                                            Cotisation
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Reste dû
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "right",
                                            }}
                                        >
                                            Échéance
                                        </th>
                                        <th
                                            style={{
                                                padding: 8,
                                                textAlign: "center",
                                            }}
                                        >
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {retardsPagination.total === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    padding: 12,
                                                    textAlign: "center",
                                                    color: "#9CA3AF",
                                                }}
                                            >
                                                Aucun retard détecté.
                                            </td>
                                        </tr>
                                    ) : (
                                        retardsPagination.rows.map(
                                            (row, idx) => (
                                                <tr
                                                    key={`${row.user_id}-${row.cotisation}-${idx}`}
                                                >
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                        }}
                                                    >
                                                        {row.nom}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                        }}
                                                    >
                                                        {row.famille}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                        }}
                                                    >
                                                        {row.cotisation}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                            textAlign: "right",
                                                            color: "#B91C1C",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {fmt(row.montant_du)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        {row.date_echeance}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: 8,
                                                            borderTop:
                                                                "1px solid #F3F4F6",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                openRappelModal(
                                                                    row,
                                                                )
                                                            }
                                                            style={{
                                                                border: "none",
                                                                borderRadius: 8,
                                                                background:
                                                                    "linear-gradient(135deg,#7F1D1D,#B91C1C)",
                                                                color: "#fff",
                                                                cursor: "pointer",
                                                                padding:
                                                                    "6px 10px",
                                                                fontWeight: 700,
                                                                fontSize: 11,
                                                            }}
                                                        >
                                                            Rappeler
                                                        </button>
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls
                            pagination={retardsPagination}
                            onPageChange={setRetardsPage}
                        />
                    </>
                )}
            </div>

            <Modal
                open={modalPaiement}
                onClose={() => setModalPaiement(false)}
                title="Enregistrer un paiement"
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                    }}
                >
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Membre
                        </label>
                        <select
                            style={inputStyle}
                            value={paiementForm.user_id}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    user_id: e.target.value,
                                }))
                            }
                        >
                            <option value="">-- Choisir --</option>
                            {memberOptions.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Cotisation
                        </label>
                        <select
                            style={inputStyle}
                            value={paiementForm.cotisation_id}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    cotisation_id: e.target.value,
                                }))
                            }
                        >
                            <option value="">-- Optionnel --</option>
                            {cotisationsPaiement.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Montant
                        </label>
                        <input
                            style={inputStyle}
                            type="number"
                            min="100"
                            value={paiementForm.montant}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    montant: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Mode
                        </label>
                        <select
                            style={inputStyle}
                            value={paiementForm.mode_paiement}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    mode_paiement: e.target.value,
                                }))
                            }
                        >
                            <option value="ESPECES">Espèces</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="VIREMENT">Virement</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Date
                        </label>
                        <input
                            style={inputStyle}
                            type="date"
                            value={paiementForm.date_paiement}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    date_paiement: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Note
                        </label>
                        <input
                            style={inputStyle}
                            value={paiementForm.note}
                            onChange={(e) =>
                                setPaiementForm((p) => ({
                                    ...p,
                                    note: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 12,
                    }}
                >
                    <button
                        onClick={handleSavePaiement}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            background:
                                "linear-gradient(135deg,#0F6E56,#1D9E75)",
                            color: "#fff",
                        }}
                    >
                        {loading ? "En cours..." : "Valider"}
                    </button>
                </div>
            </Modal>

            <Modal
                open={modalDon}
                onClose={() => setModalDon(false)}
                title="Enregistrer un don"
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                    }}
                >
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Donateur
                        </label>
                        <select
                            style={inputStyle}
                            value={donForm.user_id}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    user_id: e.target.value,
                                }))
                            }
                        >
                            <option value="">-- Choisir --</option>
                            {memberOptions.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Type
                        </label>
                        <select
                            style={inputStyle}
                            value={donForm.type}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    type: e.target.value,
                                }))
                            }
                        >
                            <option value="LIBRE">Libre</option>
                            <option value="CAMPAGNE">Campagne</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Montant
                        </label>
                        <input
                            style={inputStyle}
                            type="number"
                            min="100"
                            value={donForm.montant}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    montant: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Mode
                        </label>
                        <select
                            style={inputStyle}
                            value={donForm.mode_paiement}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    mode_paiement: e.target.value,
                                }))
                            }
                        >
                            <option value="ESPECES">Espèces</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="VIREMENT">Virement</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Date
                        </label>
                        <input
                            style={inputStyle}
                            type="date"
                            value={donForm.date_don}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    date_don: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Note
                        </label>
                        <input
                            style={inputStyle}
                            value={donForm.note}
                            onChange={(e) =>
                                setDonForm((p) => ({
                                    ...p,
                                    note: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 12,
                    }}
                >
                    <button
                        onClick={handleSaveDon}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            background:
                                "linear-gradient(135deg,#1E3A8A,#2563EB)",
                            color: "#fff",
                        }}
                    >
                        {loading ? "En cours..." : "Enregistrer"}
                    </button>
                </div>
            </Modal>

            <Modal
                open={!!modalRappel}
                onClose={() => setModalRappel(null)}
                title={`Envoyer un rappel${modalRappel ? ` - ${modalRappel.nom}` : ""}`}
            >
                <div style={{ display: "grid", gap: 8 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Message
                        </label>
                        <textarea
                            rows={5}
                            style={{ ...inputStyle, resize: "vertical" }}
                            value={rappelForm.message}
                            onChange={(e) =>
                                setRappelForm((p) => ({
                                    ...p,
                                    message: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 12,
                    }}
                >
                    <button
                        onClick={handleSendRappel}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            background:
                                "linear-gradient(135deg,#7F1D1D,#B91C1C)",
                            color: "#fff",
                        }}
                    >
                        {loading ? "En cours..." : "Envoyer"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
