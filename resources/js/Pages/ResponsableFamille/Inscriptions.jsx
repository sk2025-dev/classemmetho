import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ArrowLeft,
    Download,
    Eye,
    Plus,
    Edit,
    X,
    CheckCircle,
    Trash2,
    Lock,
    LockOpen,
} from "lucide-react";
import ConfirmationModal from "../../Components/ConfirmationModal";

// Composant Badge pour le Rôle avec style moderne
const StatusBadge = ({ role }) => {
    const isResp = role === "responsable";

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-transform hover:scale-105
            ${isResp
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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm
            ${isMale
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-pink-50 text-pink-600 border border-pink-200"
            }`}
        >
            {isMale ? "Homme" : "Femme"}
        </span>
    );
};

export default function Inscriptions({ family, members, familyStats, auth }) {
    const [expandedMember, setExpandedMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [memberList, setMemberList] = useState(members);

    // Debug: Log les données reçues du serveur
    React.useEffect(() => {
        console.log("Members data received from server:", members);
        if (members && members.length > 0) {
            console.log("First member:", members[0]);
            console.log("Identifier of first member:", members[0].identifier);
        }
    }, [members]);

    // State for confirmation modal
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationType, setConfirmationType] = useState(null); // delete, deactivate, activate
    const [selectedMember, setSelectedMember] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleToggleMemberClick = (member) => {
        setSelectedMember(member);
        setConfirmationType(member.is_active ? "deactivate" : "activate");
        setShowConfirmation(true);
    };

    const handleDeleteMemberClick = (member) => {
        setSelectedMember(member);
        setConfirmationType("delete");
        setShowConfirmation(true);
    };

    const handleConfirmationAction = () => {
        if (!selectedMember) return;

        setIsProcessing(true);

        if (confirmationType === "delete") {
            router.delete(
                `/responsable-famille/members/${selectedMember.id}`,
                {
                    onSuccess: () => {
                        const updatedMembers = memberList.filter(m => m.id !== selectedMember.id);
                        setMemberList(updatedMembers);
                        setShowConfirmation(false);
                        setIsProcessing(false);
                    },
                    onError: (errors) => {
                        console.error('Erreur lors de la suppression:', errors);
                        setIsProcessing(false);
                    }
                }
            );
        } else if (confirmationType === "deactivate" || confirmationType === "activate") {
            router.put(
                `/responsable-famille/members/${selectedMember.id}/toggle-status`,
                {},
                {
                    onSuccess: () => {
                        const updatedMembers = memberList.map(m =>
                            m.id === selectedMember.id ? { ...m, is_active: !m.is_active } : m
                        );
                        setMemberList(updatedMembers);
                        setShowConfirmation(false);
                        setIsProcessing(false);
                    },
                    onError: (errors) => {
                        console.error('Erreur lors de la mise à jour du statut:', errors);
                        setIsProcessing(false);
                    }
                }
            );
        }
    };

    const filteredMembers = memberList.filter(
        (member) =>
            member.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const exportToCSV = () => {
        const headers = ["Nom", "Prénom", "Email", "Téléphone", "Genre", "Date de Naissance", "Rôle", "Ville"];
        const rows = memberList.map((member) => [
            member.nom,
            member.prenom,
            member.email || "",
            member.telephone || "",
            member.genre === "M" ? "Homme" : "Femme",
            member.date_naissance || "",
            member.is_responsable ? "Responsable" : "Membre",
            member.ville_name || "",
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `famille_${family.nom}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen" style={{
            background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
        }}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href="/responsable-famille/dashboard"
                        className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all mb-4 text-sm font-medium backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour au Tableau de Bord
                    </Link>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
                        Ma famille et les membres de ma famille
                    </h1>
                    <p className="text-blue-100 text-lg font-medium flex items-center gap-2">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-md">
                            {family ? family.nom : "Famille inconnue"}
                        </span>
                    </p>
                </div>

                {/* Stats Cards - Style Glassmorphism */}
                {familyStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[
                            { label: "Total Membres", value: familyStats.totalMembers || 0, color: "text-blue-600", bg: "bg-blue-50", iconColor: "text-blue-500" },
                            { label: "Hommes", value: familyStats.maleMembers || 0, color: "text-emerald-600", bg: "bg-emerald-50", iconColor: "text-emerald-500" },
                            { label: "Femmes", value: familyStats.femaleMembers || 0, color: "text-pink-600", bg: "bg-pink-50", iconColor: "text-pink-500" },
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white/90 backdrop-blur-md rounded-xl p-7 shadow-lg border border-white/60 flex items-start justify-between transition-all hover:shadow-xl hover:border-white/80">
                                <div>
                                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
                                    <p className={`text-5xl font-black ${stat.color}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Users className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Controls Bar */}
                <div className="bg-white/95 rounded-xl shadow-md p-5 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between border border-gray-200/50 backdrop-blur-sm">
                    <div className="relative w-full lg:flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
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

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <button
                            onClick={() => router.get('/responsable-famille/family/edit')}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all text-sm shadow-sm"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Voir Famille</span>
                        </button>

                        <button
                            onClick={() => family && router.get(`/responsable-famille/members/create?family_id=${family.id}`)}
                            disabled={!family}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: "#1E40AF" }}
                            onMouseEnter={(e) => family && (e.target.style.backgroundColor = "#1a3a8a")}
                            onMouseLeave={(e) => family && (e.target.style.backgroundColor = "#1E40AF")}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Ajouter</span>
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
                            style={{ backgroundColor: "#B6C01A" }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "#a8b01a"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "#B6C01A"}
                            title="Exporter CSV"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    {memberList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead style={{ backgroundColor: "#B6C01A" }} className="text-white font-semibold sticky top-0">
                                    <tr>
                                        <th className="px-3 py-6 text-left font-bold">N°</th>
                                        <th className="px-3 py-6 text-center font-bold">Photo</th>
                                        <th className="px-4 py-6 text-left font-bold">Nom</th>
                                        <th className="px-4 py-6 text-left font-bold">Prénoms</th>
                                        <th className="px-4 py-6 text-left font-bold">Identifiant</th>
                                        <th className="px-3 py-6 text-left font-bold">Genre</th>
                                        <th className="px-4 py-6 text-left font-bold">Email</th>
                                        <th className="px-4 py-6 text-left font-bold">Téléphone</th>
                                        <th className="px-4 py-6 text-left font-bold">Ville</th>
                                        <th className="px-4 py-6 text-left font-bold">Profession</th>
                                        <th className="px-4 py-6 text-left font-bold">Fonction Église</th>
                                        <th className="px-4 py-6 text-left font-bold">Rôle</th>
                                        <th className="px-3 py-6 text-left font-bold">Statut</th>
                                        <th className="px-3 py-6 text-center font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member, index) => (
                                        <tr key={member.id} className={`border-b border-gray-300 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}>
                                            <td className="px-3 py-6 text-left font-bold text-gray-800">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-6 text-center">
                                                {member.profile_photo_url ? (
                                                    <img
                                                        src={member.profile_photo_url}
                                                        alt={`${member.prenom} ${member.nom}`}
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-300 mx-auto"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <span style={{ display: !member.profile_photo_url ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#FCD34D', borderRadius: '50%', fontWeight: 'bold', fontSize: '14px', color: '#0B4E82', flexShrink: 0, margin: '0 auto' }}>
                                                    {member.prenom?.[0]?.toUpperCase()}{member.nom?.[0]?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-left font-bold text-gray-900">
                                                {member.nom}
                                            </td>
                                            <td className="px-4 py-6 text-left text-gray-700">
                                                {member.prenom}
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm font-bold text-blue-700 bg-blue-50 rounded">
                                                {member.identifier || "—"}
                                            </td>
                                            <td className="px-3 py-6 text-left text-xs">
                                                <GenreBadge genre={member.genre} />
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm text-gray-700">
                                                {member.email || "—"}
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm text-gray-700">
                                                {member.telephone || "—"}
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm text-gray-700">
                                                {member.ville_name || "—"}
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm text-gray-700">
                                                {member.profession || "—"}
                                            </td>
                                            <td className="px-4 py-6 text-left text-sm text-gray-700">
                                                {member.fonction_name || "—"}
                                            </td>
                                            <td className="px-4 py-6 text-left text-xs">
                                                <StatusBadge role={member.is_responsable ? "responsable" : "membre"} />
                                            </td>
                                            <td className="px-3 py-6 text-left text-xs">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    member.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                    {member.is_active ? "Actif" : "Inactif"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => router.get(`/responsable-famille/members/${member.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                                        title="Voir détails"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.get(`/responsable-famille/members/${member.id}/edit`)}
                                                        className="text-green-600 hover:text-green-800 hover:bg-green-100 p-2 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {!member.is_responsable && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleMemberClick(member)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    member.is_active
                                                                        ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                                                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                                                }`}
                                                                title={member.is_active ? "Désactiver le membre" : "Activer le membre"}
                                                            >
                                                                {member.is_active ? (
                                                                    <LockOpen className="w-4 h-4" />
                                                                ) : (
                                                                    <Lock className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMemberClick(member)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
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
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun membre</h3>
                            <p className="text-gray-500 mb-6">
                                Votre famille n'a pas encore d'autres membres enregistrés.
                            </p>
                            <Link
                                href={`/responsable-famille/members/store?family_id=${family.id}`}
                                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Inscrire un Membre
                            </Link>
                        </div>
                    )}
            <ConfirmationModal
                isOpen={showConfirmation}
                type={confirmationType}
                title={
                    confirmationType === "delete"
                        ? "Supprimer le membre"
                        : confirmationType === "deactivate"
                        ? "Désactiver le membre"
                        : "Activer le membre"
                }
                message={
                    confirmationType === "delete"
                        ? "Êtes-vous sûr de vouloir supprimer définitivement ce membre ? Cette action est irréversible."
                        : confirmationType === "deactivate"
                        ? "Le membre sera désactivé et ne pourra plus accéder au système. Voulez-vous continuer ?"
                        : "Le membre sera activé et pourra accéder au système. Voulez-vous continuer ?"
                }
                confirmText={
                    confirmationType === "delete"
                        ? "Supprimer"
                        : confirmationType === "deactivate"
                        ? "Désactiver"
                        : "Activer"
                }
                itemName={selectedMember ? `${selectedMember.prenom} ${selectedMember.nom}` : ""}
                loading={isProcessing}
                onConfirm={handleConfirmationAction}
                onCancel={() => {
                    setShowConfirmation(false);
                    setSelectedMember(null);
                    setConfirmationType(null);
                }}
            />
                </div>
            </div>
        </div>
    );
}
