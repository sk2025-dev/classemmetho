import React, { useMemo, useState } from "react";
import {
    Search,
    Home,
    Users,
    CheckCircle2,
    User,
    BookOpen,
    Phone,
    MapPin,
    Mail,
    ChevronDown,
    ChevronUp,
    RotateCcw,
} from "lucide-react";

const roleLabels = {
    admin: "Admin",
    conducteur: "Conducteur",
    pasteur: "Pasteur",
    responsable_famille: "Responsable de famille",
    membre_famille: "Membre de famille",
};

const formatRoleLabel = (role) => roleLabels[role] || role || "Utilisateur";

const ROLE_BADGE_CLASSES = {
    admin: "bg-violet-100 text-violet-700",
    conducteur: "bg-rose-100 text-rose-700",
    pasteur: "bg-indigo-100 text-indigo-700",
    responsable_famille: "bg-emerald-100 text-emerald-700",
    membre_famille: "bg-gray-100 text-gray-600",
};

const getRoleBadgeClass = (role) =>
    ROLE_BADGE_CLASSES[role] || "bg-gray-100 text-gray-600";

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

    const stats = useMemo(() => {
        const totalMembres = familles.reduce(
            (sum, fam) => sum + (membersByFamilyCode[fam.code_famille]?.length || 0),
            0,
        );
        const totalActives = familles.filter((fam) => fam.status === "active").length;

        return { totalFamilles: familles.length, totalMembres, totalActives };
    }, [familles, membersByFamilyCode]);

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

    const firstItemIndex =
        familles.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const lastItemIndex = Math.min(familles.length, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <Home className="w-12 h-12 opacity-75 mr-4" />
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">
                                Familles enregistrées
                            </p>
                            <p className="text-3xl font-bold">{stats.totalFamilles}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <Users className="w-12 h-12 opacity-75 mr-4" />
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">
                                Membres rattachés
                            </p>
                            <p className="text-3xl font-bold">{stats.totalMembres}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <CheckCircle2 className="w-12 h-12 opacity-75 mr-4" />
                        <div>
                            <p className="text-blue-100 text-sm font-medium">
                                Familles actives
                            </p>
                            <p className="text-3xl font-bold">{stats.totalActives}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="bg-white shadow-xl rounded-3xl border border-gray-200 p-5">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                    <label className="sr-only" htmlFor="family-search">
                        Code de famille
                    </label>
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            id="family-search"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="Code de famille (ex : CF215)"
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-shrink-0 gap-2">
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                        >
                            Rechercher
                        </button>
                        <button
                            type="button"
                            onClick={resetSearch}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                        >
                            <RotateCcw size={14} />
                            Réinitialiser
                        </button>
                    </div>
                </form>

                {feedback && (
                    <div
                        className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                            feedbackType === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : feedbackType === "error"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                    >
                        {feedback}
                    </div>
                )}
                {!selectedFamily && !feedback && (
                    <p className="mt-3 text-sm text-gray-400 italic">
                        Entrez un code de famille pour afficher la fiche et ses membres.
                    </p>
                )}
            </div>

            {/* Fiche famille sélectionnée */}
            {selectedFamily && (
                <div className="bg-white shadow-xl rounded-3xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-white text-xl font-black">
                                {(selectedFamily.nom || "F").charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-0.5">
                                    Famille
                                </p>
                                <p className="text-2xl font-black text-white leading-tight">
                                    {selectedFamily.nom}
                                </p>
                                <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white">
                                    {selectedFamily.code_famille}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedFamily.status && (
                                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/15 text-white">
                                    {selectedFamily.status === "active"
                                        ? "Active"
                                        : selectedFamily.status}
                                </span>
                            )}
                            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-indigo-700">
                                {members.length} membre(s)
                            </span>
                        </div>
                    </div>

                    {/* Grid infos */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 p-6">
                        {[
                            {
                                label: "Responsable",
                                value: selectedFamily.responsable,
                                icon: User,
                            },
                            {
                                label: "Classe",
                                value: selectedFamily.classe_nom,
                                icon: BookOpen,
                            },
                            {
                                label: "Téléphone principal",
                                value: selectedFamily.telephone,
                                icon: Phone,
                            },
                            {
                                label: "Adresse",
                                value: selectedFamily.adresse,
                                icon: MapPin,
                            },
                            {
                                label: "Email",
                                value: selectedFamily.email,
                                icon: Mail,
                            },
                        ].map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                            >
                                <Icon size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
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

                    {/* Membres de la famille sélectionnée */}
                    {members.length > 0 && (
                        <div className="border-t border-gray-100 px-6 py-5">
                            <p className="text-xs uppercase text-gray-400 tracking-widest font-semibold mb-3">
                                Membres de la famille
                            </p>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {members.map((member) => (
                                    <div
                                        key={`detail-member-${member.id}`}
                                        className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {(member.prenom || "?").charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {member.prenom} {member.nom}
                                                </p>
                                                <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                                                    {member.code_membre || member.identifier || "—"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getRoleBadgeClass(member.role)}`}>
                                                {formatRoleLabel(member.role)}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                                                {member.relation || "—"}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5">
                                                <Phone size={12} /> {member.telephone || "—"}
                                            </span>
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Mail size={12} /> {member.email || "—"}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen size={12} /> {member.classe || "—"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tableau des familles */}
            <div className="bg-white shadow-xl rounded-3xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Tableau des familles
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                            {familles.length} famille(s)
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                {[
                                    "Code",
                                    "Famille",
                                    "Code membre",
                                    "Responsable",
                                    "Classe",
                                    "Téléphone",
                                    "Membres",
                                    "",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {familles.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Home size={32} className="text-gray-300" />
                                            <span className="text-sm font-medium">
                                                Pas de famille renseignée.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {currentFamilies.map((fam) => {
                                const code = fam.code_famille || fam.nom;
                                const membersList = membersByFamilyCode[fam.code_famille] || [];
                                const isExpanded = expandedFamilies.includes(code);

                                return (
                                    <React.Fragment key={`family-${code}`}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {fam.code_famille || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {fam.nom || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {fam.responsable_code ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                                                        {fam.responsable_code}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-medium">
                                                {fam.responsable || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {fam.classe_nom ? (
                                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {fam.classe_nom}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 tabular-nums">
                                                {fam.telephone || "—"}
                                                {fam.telephone2 && fam.telephone2 !== fam.telephone && (
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {fam.telephone2}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black text-white ${
                                                        membersList.length > 0
                                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                                                            : "bg-gray-300"
                                                    }`}
                                                >
                                                    {membersList.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFamilyExpansion(code)}
                                                    className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${
                                                        isExpanded
                                                            ? "bg-indigo-600 text-white"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp size={14} /> Masquer
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={14} /> Voir membres
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                                    {membersList.length === 0 ? (
                                                        <p className="text-xs text-gray-400 italic py-2">
                                                            Aucun membre lié à cette famille.
                                                        </p>
                                                    ) : (
                                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                            {membersList.map((member) => (
                                                                <div
                                                                    key={`member-${member.id}`}
                                                                    className="bg-white rounded-xl px-4 py-3 flex flex-col gap-2 shadow-sm border border-gray-100"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                                                            {(member.prenom || "?").charAt(0)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                                                {member.prenom} {member.nom}
                                                                            </p>
                                                                            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                                                                                {member.identifier || member.code_membre || "-"}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getRoleBadgeClass(member.role)}`}>
                                                                            {formatRoleLabel(member.role)}
                                                                        </span>
                                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                                                                            {member.relation ||
                                                                                (member.role === "responsable_famille"
                                                                                    ? "Responsable"
                                                                                    : "-")}
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Phone size={12} /> {member.telephone || "-"}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5 truncate">
                                                                            <Mail size={12} /> {member.email || "-"}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <BookOpen size={12} /> {member.classe || "-"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-600">
                        Affiche {firstItemIndex || 0} à {lastItemIndex || 0} sur {familles.length} famille(s)
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:border-gray-400 transition-colors"
                        >
                            Précédent
                        </button>
                        <span className="text-gray-500 font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 disabled:text-gray-300 disabled:border-gray-200 hover:border-gray-400 transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabFamille;
