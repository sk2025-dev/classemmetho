import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ArrowLeft,
    Eye,
    Edit,
    User,
} from "lucide-react";
import ProfilePhoto from "@/Components/ProfilePhoto";
import { withBasePath } from "../../Utils/urlHelper";

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
            {isResp ? <Users size={12} /> : <User size={12} />}
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

const PER_PAGE = 10;

export default function Inscriptions({ family, members, familyStats }) {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [page, setPage] = useState(1);

    const filteredMembers = members.filter(
        (member) =>
            member.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email &&
                member.email.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PER_PAGE));
    const paginatedMembers = filteredMembers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
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
                        href={withBasePath("", "/membre-famille/dashboard")}
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
                        {family?.classe && (
                            <span className="ml-2 inline-block text-sm text-white/90 bg-white/10 px-2 py-0.5 rounded">
                                Classe: {family.classe}
                            </span>
                        )}
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

                {/* Controls Bar - Lecture seule */}
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
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <button
                            onClick={() =>
                                router.get(
                                    withBasePath(
                                        "",
                                        "/membre-famille/profile/edit",
                                    ),
                                )
                            }
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
                            style={{ backgroundColor: "#1E40AF" }}
                            onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#1a3a8a")
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "#1E40AF")
                            }
                        >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Mon Profil</span>
                        </button>
                    </div>
                </div>

                {/* Members Table - Lecture seule */}
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    {members.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead
                                    style={{ backgroundColor: "#B6C01A" }}
                                    className="text-white font-semibold"
                                >
                                    <tr>
                                        <th className="px-6 py-4 text-left w-12">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Nom & Photo
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Genre
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Téléphone
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Ville
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Profession
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Fonction Église
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Rôle
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Code Famille
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            Code Membre
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedMembers.map((member, index) => {
                                        const isCurrentUser =
                                            auth.user.id === member.id;
                                        const rowNumber = (page - 1) * PER_PAGE + index + 1;
                                        return (
                                            <tr
                                                key={member.id}
                                                className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                            >
                                                <td className="px-6 py-4 text-left text-sm text-gray-400 font-medium">
                                                    {rowNumber}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm font-medium text-gray-900 flex items-center gap-3">
                                                    <ProfilePhoto
                                                        user={member}
                                                        size="sm"
                                                        rounded={true}
                                                    />
                                                    <div>
                                                        <span>
                                                            {member.prenom}{" "}
                                                            {member.nom}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                (Moi)
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm">
                                                    <GenreBadge
                                                        genre={member.genre}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm text-gray-600">
                                                    {member.email || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm text-gray-600">
                                                    {member.telephone || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm text-gray-600">
                                                    {member.ville_name || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm text-gray-600">
                                                    {member.profession || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm text-gray-600">
                                                    {member.fonction_name ||
                                                        "—"}
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm">
                                                    <StatusBadge
                                                        role={
                                                            member.is_responsable
                                                                ? "responsable"
                                                                : "membre"
                                                        }
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                                                        {member.code_famille ||
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left text-sm">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                                                        {member.code_membre ||
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isCurrentUser ? (
                                                            <button
                                                                onClick={() =>
                                                                    router.get(
                                                                        withBasePath("", "/membre-famille/profile/edit"),
                                                                    )
                                                                }
                                                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1.5 rounded transition-colors"
                                                                title="Modifier mes informations"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedMember(
                                                                        member,
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                                                title="Voir les détails"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {/* Pagination */}
                    {filteredMembers.length > PER_PAGE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
                            <span className="text-sm text-gray-500">
                                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredMembers.length)} sur {filteredMembers.length} membres
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ‹ Préc.
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        p === "…" ? (
                                            <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                                    p === page
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Suiv. ›
                                </button>
                            </div>
                        </div>
                    )}

                    {members.length === 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Aucun membre
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Votre famille n'a pas encore d'autres membres
                                enregistrés.
                            </p>
                        </div>
                    )}
                </div>
                {/* Member Details Modal */}
                {selectedMember && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                            <div className="flex items-start justify-between">
                                <h3 className="text-lg font-bold">
                                    Détails de {selectedMember.prenom}{" "}
                                    {selectedMember.nom}
                                </h3>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Fermer
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Email
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.email || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Téléphone
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.telephone || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Ville
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.ville_name || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Profession
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.profession || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Fonction
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.fonction_name || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Date de naissance
                                    </p>
                                    <p className="font-medium">
                                        {selectedMember.date_naissance || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
