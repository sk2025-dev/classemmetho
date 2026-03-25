import React, { useMemo, useState } from "react";

const roleLabels = {
    admin: "Admin",
    conducteur: "Conducteur",
    pasteur: "Pasteur",
    responsable_famille: "Responsable de famille",
    membre_famille: "Membre de famille",
};

const formatRoleLabel = (role) => roleLabels[role] || role || "Utilisateur";

// Palette extraite du logo GesParoisse
const ROLE_COLORS = {
    admin: "bg-[#7C3AED] text-white",
    conducteur: "bg-[#C0392B] text-white",
    pasteur: "bg-[#2C3E7A] text-white",
    responsable_famille: "bg-[#4A7C59] text-white",
    membre_famille: "bg-[#6B7280] text-white",
};

const getRoleColor = (role) =>
    ROLE_COLORS[role] || "bg-[#6B7280] text-white";

const TabFamille = ({ familles = [], membersByFamilyCode = {} }) => {
    const [searchCode, setSearchCode] = useState("");
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("info"); // "success" | "error" | "info"
    const [expandedFamilies, setExpandedFamilies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const members = useMemo(() => {
        if (!selectedFamily?.code_famille) return [];
        return membersByFamilyCode[selectedFamily.code_famille] || [];
    }, [membersByFamilyCode, selectedFamily]);

    const handleSearch = (event) => {
        event.preventDefault();
        const normalizedCode = (searchCode || "").trim().toUpperCase();

        if (!normalizedCode) {
            setFeedback("Veuillez renseigner un code de famille.");
            setFeedbackType("error");
            setSelectedFamily(null);
            return;
        }

        const found = familles.find(
            (fam) => (fam.code_famille || "").toUpperCase() === normalizedCode,
        );

        if (!found) {
            setFeedback(`Aucune famille trouvée pour "${normalizedCode}".`);
            setFeedbackType("error");
            setSelectedFamily(null);
            return;
        }

        setSelectedFamily(found);
        setFeedback(`Famille trouvée : ${found.nom} (${found.code_famille}).`);
        setFeedbackType("success");
    };

    const resetSearch = () => {
        setSearchCode("");
        setSelectedFamily(null);
        setFeedback("");
        setFeedbackType("info");
    };

    const toggleFamilyExpansion = (code) => {
        if (!code) return;
        setExpandedFamilies((prev) =>
            prev.includes(code)
                ? prev.filter((item) => item !== code)
                : [...prev, code],
        );
    };

    const totalPages = Math.max(1, Math.ceil(familles.length / itemsPerPage));
    const currentFamilies = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return familles.slice(start, start + itemsPerPage);
    }, [familles, currentPage]);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const firstItemIndex = familles.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const lastItemIndex = Math.min(familles.length, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 font-sans">

            {/* ── Barre de recherche ── */}
            <div
                className="rounded-3xl p-[2px] shadow-xl"
                style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #2C3E7A 40%, #4A7C59 100%)",
                }}
            >
                <div className="bg-white rounded-[22px] p-5">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <label className="sr-only" htmlFor="family-search">
                            Code de famille
                        </label>

                        {/* Input with left accent bar */}
                        <div className="relative flex-1">
                            <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                                style={{ background: "linear-gradient(to bottom, #7C3AED, #4A7C59)" }}
                            />
                            <input
                                id="family-search"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="Code de famille (ex : CF215)"
                                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                        </div>

                        <div className="flex flex-shrink-0 gap-2">
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: "linear-gradient(135deg, #7C3AED, #2C3E7A)",
                                    boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
                                }}
                            >
                                🔍 Rechercher
                            </button>
                            <button
                                type="button"
                                onClick={resetSearch}
                                className="px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-violet-300 hover:text-violet-700 transition-all"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </form>

                    {/* Feedback badge */}
                    {feedback && (
                        <div
                            className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                                feedbackType === "success"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : feedbackType === "error"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-violet-50 text-violet-700 border border-violet-200"
                            }`}
                        >
                            <span>{feedbackType === "success" ? "✓" : feedbackType === "error" ? "✗" : "ℹ"}</span>
                            {feedback}
                        </div>
                    )}
                    {!selectedFamily && !feedback && (
                        <p className="mt-3 text-sm text-gray-400 italic">
                            Entrez un code de famille pour afficher la fiche et ses membres.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Fiche famille sélectionnée ── */}
            {selectedFamily && (
                <div
                    className="rounded-3xl p-[2px] shadow-xl"
                    style={{
                        background: "linear-gradient(135deg, #4A7C59, #2C3E7A, #7C3AED)",
                    }}
                >
                    <section className="bg-white rounded-[22px] p-6">
                        {/* En-tête */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                                    style={{ background: "linear-gradient(135deg, #7C3AED, #2C3E7A)" }}
                                >
                                    {(selectedFamily.nom || "F").charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                        Famille / Code
                                    </p>
                                    <p className="text-2xl font-black text-gray-900 leading-tight">
                                        {selectedFamily.nom}
                                    </p>
                                    <span
                                        className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold"
                                        style={{ background: "linear-gradient(90deg, #7C3AED22, #4A7C5922)", color: "#2C3E7A" }}
                                    >
                                        {selectedFamily.code_famille}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedFamily.status && (
                                    <span
                                        className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide text-white shadow"
                                        style={{ background: "linear-gradient(90deg, #4A7C59, #2C3E7A)" }}
                                    >
                                        {selectedFamily.status}
                                    </span>
                                )}
                                <span
                                    className="px-4 py-1.5 rounded-full text-xs font-bold border-2"
                                    style={{ borderColor: "#7C3AED33", color: "#7C3AED" }}
                                >
                                    {members.length} membre(s)
                                </span>
                            </div>
                        </div>

                        {/* Grid infos */}
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { label: "Responsable", value: selectedFamily.responsable, icon: "👤" },
                                { label: "Classe", value: selectedFamily.classe_nom, icon: "📖" },
                                { label: "Téléphone principal", value: selectedFamily.telephone, icon: "📞" },
                                {
                                    label: "Ville",
                                    value: selectedFamily.ville || "—",
                                    icon: "📍",
                                },
                                { label: "Adresse", value: selectedFamily.adresse, icon: "🏠" },
                                { label: "Email", value: selectedFamily.email, icon: "✉️" },
                            ].map(({ label, value, icon }) => (
                                <div
                                    key={label}
                                    className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100"
                                >
                                    <span className="text-base mt-0.5">{icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                            {label}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {value || "—"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {selectedFamily && members.length > 0 && (
                <section className="rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                    <div
                        className="px-6 py-4 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center"
                        style={{
                            background: "linear-gradient(135deg, #f1f1ff, #edf8ff)",
                        }}
                    >
                        <div>
                            <p className="text-xs uppercase text-gray-500 tracking-widest font-semibold">
                                Membres de la famille
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {members.length} membre(s)
                            </p>
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-white px-3 py-1 rounded-full shadow" style={{ background: "linear-gradient(90deg, #4A7C59, #2C3E7A)" }}>
                            {selectedFamily.status === "active" ? "Active" : selectedFamily.status || "Inconnue"}
                        </span>
                    </div>
                    <div className="px-6 py-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {members.map((member) => (
                                <div
                                    key={`detail-member-${member.id}`}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
                                            style={{
                                                background: "linear-gradient(135deg, #7C3AED, #4A7C59)",
                                            }}
                                        >
                                            {(member.prenom || "?").charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {member.prenom} {member.nom}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                {member.code_membre || member.identifier || "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 text-xs text-gray-500 font-semibold uppercase tracking-widest">
                                        <div className="flex items-center justify-between">
                                            <span>Rôle</span>
                                            <span className="text-[10px] font-black text-indigo-600">
                                                {formatRoleLabel(member.role)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Relation</span>
                                            <span className="text-[10px] font-black text-teal-600">
                                                {member.relation || "—"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 flex flex-col gap-1">
                                        <span>📞 {member.telephone || "—"}</span>
                                        <span>✉️ {member.email || "—"}</span>
                                        <span>📚 {member.classe || "—"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Tableau des familles ── */}
            <section className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                {/* Header coloré */}
                <div
                    className="px-6 py-5 flex items-center justify-between"
                    style={{
                        background: "linear-gradient(135deg, #2C3E7A 0%, #7C3AED 60%, #4A7C59 100%)",
                    }}
                >
                    <div>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5">
                            Tableau des familles
                        </p>
                        <p className="text-2xl font-black text-white">
                            {familles.length} famille(s)
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white/70 text-lg">⊞</span>
                        <span className="text-white text-sm font-semibold">Détails par famille</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white overflow-x-auto">
                    <table
                        className="min-w-full text-sm text-left border-separate"
                        style={{ borderSpacing: "0 0" }}
                    >
                        <thead>
                            <tr
                                style={{ background: "linear-gradient(90deg, #f8f7ff, #f0faf4)" }}
                            >
                                {["Code", "Famille", "Code membre", "Responsable", "Classe", "Téléphone", "Ville", "Membres", "Actions"].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500"
                                        >
                                            {h}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {familles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-10 text-center text-gray-400"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">🏠</span>
                                            <span className="text-sm font-medium">Pas de famille renseignée.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {currentFamilies.map((fam, idx) => {
                                const code = fam.code_famille || fam.nom;
                                const membersList = membersByFamilyCode[fam.code_famille] || [];
                                const isExpanded = expandedFamilies.includes(code);
                                const isEven = idx % 2 === 0;

                                return (
                                    <React.Fragment key={`family-${code}`}>
                                        <tr
                                            className="transition-colors hover:bg-violet-50/50 group"
                                            style={{ background: isEven ? "white" : "#fafaf9" }}
                                        >
                                            {/* Code avec pill */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-black tracking-wide"
                                                    style={{
                                                        background: "linear-gradient(135deg, #7C3AED15, #2C3E7A15)",
                                                        color: "#2C3E7A",
                                                        border: "1px solid #7C3AED22",
                                                    }}
                                                >
                                                    {fam.code_famille || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {fam.nom || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                                                {fam.responsable_code || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">
                                                {fam.responsable || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {fam.classe_nom ? (
                                                    <span
                                                        className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
                                                        style={{
                                                            background: "#4A7C5918",
                                                            color: "#2C6B40",
                                                            border: "1px solid #4A7C5930",
                                                        }}
                                                    >
                                                        {fam.classe_nom}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 tabular-nums">
                                                {fam.telephone || "—"}
                                                {fam.telephone2 && fam.telephone2 !== fam.telephone && (
                                                    <div className="text-xs text-gray-400 mt-0.5">{fam.telephone2}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {fam.ville || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black text-white shadow"
                                                    style={{
                                                        background:
                                                            membersList.length > 0
                                                                ? "linear-gradient(135deg, #7C3AED, #2C3E7A)"
                                                                : "#D1D5DB",
                                                    }}
                                                >
                                                    {membersList.length}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFamilyExpansion(code)}
                                                    className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                                                    style={
                                                        isExpanded
                                                            ? {
                                                                  background: "linear-gradient(135deg, #7C3AED, #2C3E7A)",
                                                                  color: "white",
                                                                  boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
                                                              }
                                                            : {
                                                                  background: "#f3f4f6",
                                                                  color: "#374151",
                                                                  border: "1px solid #E5E7EB",
                                                              }
                                                    }
                                                >
                                                    {isExpanded ? "▲ Masquer" : "▼ Voir membres"}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Ligne expansion membres */}
                                        <tr className={isExpanded ? "" : "hidden"}>
                                            <td
                                                colSpan={9}
                                                className="px-6 py-4"
                                                style={{
                                                    background: "linear-gradient(135deg, #f8f7ff, #f0faf4)",
                                                    borderTop: "2px solid #7C3AED22",
                                                    borderBottom: "2px solid #4A7C5922",
                                                }}
                                            >
                                                {membersList.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic py-2">
                                                        Aucun membre lié à cette famille.
                                                    </p>
                                                ) : (
                                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                        {membersList.map((member) => (
                                                            <div
                                                                key={`member-${member.id}`}
                                                                className="bg-white rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-sm border border-white"
                                                                style={{
                                                                    boxShadow: "0 2px 12px rgba(44,62,122,0.08)",
                                                                }}
                                                            >
                                                                {/* Avatar + nom */}
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                                                                        style={{
                                                                            background:
                                                                                "linear-gradient(135deg, #7C3AED, #4A7C59)",
                                                                        }}
                                                                    >
                                                                        {(member.prenom || "?").charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-gray-900 truncate">
                                                                            {member.prenom} {member.nom}
                                                                        </p>
                                                                        <p className="text-[10px] font-mono text-gray-400">
                                                                            {member.identifier || member.code_membre || "-"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Badges rôle / relation */}
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    <span
                                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${getRoleColor(member.role)}`}
                                                                    >
                                                                        {formatRoleLabel(member.role)}
                                                                    </span>
                                                                    <span
                                                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                                                                        style={{
                                                                            background: "#4A7C5918",
                                                                            color: "#2C6B40",
                                                                            border: "1px solid #4A7C5930",
                                                                        }}
                                                                    >
                                                                        {member.relation ||
                                                                            (member.role === "responsable_famille"
                                                                                ? "Responsable"
                                                                                : "-")}
                                                                    </span>
                                                                </div>

                                                                {/* Téléphone + email */}
                                                                <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-0.5">
                                                                    <span>📞 {member.telephone || "-"}</span>
                                                                    <span className="truncate">✉️ {member.email || "-"}</span>
                                                                    <span>📖 {member.classe || "-"}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-600">
                        Affiche {firstItemIndex || 0} à{" "}
                        {lastItemIndex || 0} sur {familles.length} famille(s)
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-full border border-gray-300 text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:border-gray-400"
                        >
                            Précédent
                        </button>
                        <span className="text-gray-500">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-full border border-gray-300 text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:border-gray-400"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TabFamille;
