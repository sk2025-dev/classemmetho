import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    Users,
    ArrowLeft,
    Download,
    Eye,
    Plus,
    Edit,
    X,
    CheckCircle,
    Trash2,
    Move,
    ArrowRightCircle,
} from "lucide-react";
import ProfilePhoto from "@/Components/ProfilePhoto";

// Composant Badge pour le Rôle
const StatusBadge = ({ role }) => {
    const isResp = role === "responsable";
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-transform hover:scale-105
            ${
                isResp
                    ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300"
                    : "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-300"
            }`}
        >
            {isResp ? <Users size={12} /> : <CheckCircle size={12} />}
            {isResp ? "Responsable" : "Membre"}
        </span>
    );
};

// Composant Badge pour le Genre
const GenreBadge = ({ genre }) => {
    const isMale = genre === "M";
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm
            ${
                isMale
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-pink-50 text-pink-600 border border-pink-200"
            }`}
        >
            {isMale ? "Homme" : "Femme"}
        </span>
    );
};

const TransferBadge = ({ member }) => {
    if (!member?.transfer_locked) return null;

    const isArchived = member.transfer_status === "completed";

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                isArchived
                    ? "bg-slate-200 text-slate-700 border border-slate-300"
                    : "bg-orange-100 text-orange-700 border border-orange-300"
            }`}
        >
            {member.transfer_label ||
                (isArchived ? "Ancien membre" : "Transfert en cours")}
        </span>
    );
};

export default function Inscriptions({
    family,
    members,
    familyStats,
    auth,
    classes = [],
}) {
    // États principaux
    const [searchTerm, setSearchTerm] = useState("");
    const [memberToDelete, setMemberToDelete] = useState(null);

    // Filtrage pour la liste principale (Tableau)
    const filteredMembers = members.filter(
        (member) =>
            member.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email &&
                member.email.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const exportToCSV = () => {
        const headers = [
            "Nom",
            "Prénom",
            "Email",
            "Téléphone",
            "Genre",
            "Date de Naissance",
            "Rôle",
            "Ville",
        ];
        const rows = members.map((member) => [
            member.nom,
            member.prenom,
            member.email || "",
            member.telephone || "",
            member.genre === "M" ? "Homme" : "Femme",
            member.date_naissance || "",
            member.is_responsable ? "Responsable" : "Membre",
            member.ville_name || "",
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            headers.join(",") +
            "\n" +
            rows.map((e) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `famille_${family.nom}_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmDelete = () => {
        if (!memberToDelete) return;
        router.delete(withBasePath("", `/responsable-famille/members/${memberToDelete.id}`));
        setMemberToDelete(null);
    };

    return (
        <>
        {memberToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-rose-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 rounded-full">
                            <Trash2 className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Supprimer le membre</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Voulez-vous vraiment supprimer <span className="font-semibold text-gray-900">{memberToDelete.prenom} {memberToDelete.nom}</span> de la famille ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setMemberToDelete(null)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors text-sm flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        )}
        <div
            className="min-h-screen"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href={withBasePath(
                            "",
                            "/responsable-famille/dashboard",
                        )}
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all mb-4 text-sm font-medium backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour au Tableau de Bord
                    </Link>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
                        Membres de la Famille
                    </h1>
                    <p className="text-blue-100 text-lg font-medium flex items-center gap-2">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-md">
                            {family ? family.nom : "Famille inconnue"}
                        </span>
                    </p>
                </div>

                {/* Stats Cards */}
                {familyStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                            {
                                label: "Total Membres",
                                value: familyStats.totalMembers || 0,
                                color: "text-blue-600",
                                bg: "bg-blue-50",
                                iconColor: "text-blue-500",
                            },
                            {
                                label: "Hommes",
                                value: familyStats.maleMembers || 0,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50",
                                iconColor: "text-emerald-500",
                            },
                            {
                                label: "Femmes",
                                value: familyStats.femaleMembers || 0,
                                color: "text-pink-600",
                                bg: "bg-pink-50",
                                iconColor: "text-pink-500",
                            },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="bg-white/90 backdrop-blur-md rounded-xl p-7 shadow-lg border border-white/60 flex items-start justify-between transition-all hover:shadow-xl hover:border-white/80"
                            >
                                <div>
                                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-2">
                                        {stat.label}
                                    </p>
                                    <p
                                        className={`text-5xl font-black ${stat.color}`}
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Users
                                        className={`w-6 h-6 ${stat.iconColor}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Controls Bar */}
                <div className="bg-white/95 rounded-xl shadow-md p-5 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between border border-gray-200/50 backdrop-blur-sm">
                    <div className="relative w-full lg:flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                            placeholder="Rechercher un membre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
                        {/* Bouton Transfert */}
                        <button
                            onClick={() =>
                                router.get(withBasePath("", "/responsable-famille/transferts"))
                            }
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
                            title="Transférer"
                        >
                            <Move className="w-4 h-4" />
                            <span className="hidden sm:inline">Transférer</span>
                        </button>

                        <button
                            onClick={() =>
                                router.get(withBasePath("", "/responsable-famille/family/edit"))
                            }
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all text-sm shadow-sm"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                Voir Famille
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                family &&
                                router.get(
                                    withBasePath(
                                        "",
                                        `/responsable-famille/members/create?family_id=${family.id}`,
                                    ),
                                )
                            }
                            disabled={!family || family?.transfer_locked}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#1E40AF" }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Ajouter</span>
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
                            style={{ backgroundColor: "#B6C01A" }}
                            title="Exporter CSV"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    {members.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)" }}>
                                        {[
                                            "ID", "Nom & Photo", "Code Membre", "Code Famille",
                                            "Genre", "Email", "Téléphone", "Ville",
                                            "Profession", "Fonction Église", "Rôle", "Actions",
                                        ].map((label, i) => (
                                            <th
                                                key={label}
                                                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-white/90 whitespace-nowrap ${i === 11 ? "text-center" : "text-left"}`}
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMembers.map((member, index) => (
                                        <tr
                                            key={member.id}
                                            className={`transition-colors duration-150 ${
                                                member.is_deceased
                                                    ? "bg-gray-50 opacity-60"
                                                    : member.transfer_locked
                                                    ? "bg-amber-50/40 opacity-70"
                                                    : index % 2 === 0
                                                    ? "bg-white hover:bg-indigo-50/40"
                                                    : "bg-slate-50/60 hover:bg-indigo-50/40"
                                            }`}
                                        >
                                            <td className="px-5 py-3.5 text-left">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                                                    {member.id}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-left">
                                                <div className="flex items-center gap-3">
                                                    <ProfilePhoto
                                                        user={member}
                                                        size="sm"
                                                        rounded={true}
                                                    />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                                                            {member.prenom}{" "}{member.nom}
                                                        </span>
                                                        {member.is_deceased && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                                                                ✝ Décédé
                                                            </span>
                                                        )}
                                                        {!member.is_deceased && <TransferBadge member={member} />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-left">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 border border-violet-200 text-xs font-bold text-violet-700 tracking-wide">
                                                    {member.code_membre || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-left">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 tracking-wide">
                                                    {family?.code_famille || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-left">
                                                <GenreBadge genre={member.genre} />
                                            </td>
                                            <td className="px-5 py-3.5 text-left text-sm text-gray-500 max-w-[160px] truncate">
                                                {member.email || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-left text-sm text-gray-600 whitespace-nowrap">
                                                {member.telephone || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-left text-sm text-gray-600">
                                                {member.ville_name || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-left text-sm text-gray-600">
                                                {member.profession || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-left text-sm text-gray-600">
                                                {member.fonction_name || <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-left">
                                                <StatusBadge
                                                    role={member.is_responsable ? "responsable" : "membre"}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            router.get(
                                                                withBasePath(
                                                                    "",
                                                                    `/responsable-famille/members/${member.id}`,
                                                                ),
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            router.get(
                                                                withBasePath(
                                                                    "",
                                                                    `/responsable-famille/members/${member.id}/edit`,
                                                                ),
                                                            )
                                                        }
                                                        disabled={member.transfer_locked}
                                                        className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {!member.is_responsable && (
                                                        <button
                                                            onClick={() => {
                                                                if (!member.transfer_locked) {
                                                                    setMemberToDelete(member);
                                                                }
                                                            }}
                                                            disabled={member.transfer_locked}
                                                            className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Aucun membre
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Votre famille n'a pas encore d'autres membres
                                enregistrés.
                            </p>
                            <Link
                                href={withBasePath(
                                    "",
                                    `/responsable-famille/members/create?family_id=${family?.id}`,
                                )}
                                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Inscrire un Membre
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
