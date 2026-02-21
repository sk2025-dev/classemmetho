import React, { useState } from "react";
import { Link, usePage, Head } from "@inertiajs/react";
import {
    Users,
    User,
    Search,
    Filter,
    Check,
    X,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    BookOpen,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    Plus,
    Menu,
    Eye,
    Calendar,
    MapPin,
} from "lucide-react";

// --- DONNÉES SIMULÉES (Pour la démonstration) ---
// Dans votre projet réel, ces données proviendront du backend via les props
const mockClasses = [
    {
        id: 1,
        name: "Classe Bethel",
        leader: "Fr. Jean Dupont",
        members_count: 124,
        attendance: 88,
        status: "active", // active, alert, inactive
        transfers_pending: [
            { id: 101, name: "Famille Kouassi", date: "24/10/2023" },
        ],
    },
    {
        id: 2,
        name: "Classe Eben-Ézer",
        leader: "Sœur Marie Claire",
        members_count: 95,
        attendance: 82,
        status: "active",
        transfers_pending: [],
    },
    {
        id: 3,
        name: "Classe Siloé",
        leader: "Fr. Paul Martin",
        members_count: 78,
        attendance: 45,
        status: "alert", // Faible présence
        transfers_pending: [
            { id: 102, name: "Thomas Bernard", date: "22/10/2023" },
        ],
    },
    {
        id: 4,
        name: "Classe Béthanie",
        leader: "Sœur Julie Moreau",
        members_count: 110,
        attendance: 76,
        status: "active",
        transfers_pending: [],
    },
    {
        id: 5,
        name: "Classe Galilée",
        leader: "Fr. Marc Levy",
        members_count: 85,
        attendance: 92,
        status: "active",
        transfers_pending: [],
    },
    {
        id: 6,
        name: "Classe Jéricho",
        leader: "Fr. David Cohen",
        members_count: 60,
        attendance: 60,
        status: "alert",
        transfers_pending: [],
    },
    {
        id: 7,
        name: "Nouvelles Convertis",
        leader: "Pasteur Martin",
        members_count: 140,
        attendance: 65,
        status: "active",
        transfers_pending: [],
    },
    {
        id: 8,
        name: "Jeunes Adults",
        leader: "Sœur Sophie",
        members_count: 150,
        attendance: 70,
        status: "active",
        transfers_pending: [],
    },
];

export default function ClassesView({ classes = [], pendingCount = 0 }) {
    const { auth } = usePage().props;

    // Utiliser les props si disponibles, sinon utiliser le mock
    // Supporter réponse paginée Inertia: `classes.data` ou simple tableau `classes`
    let rawClasses;
    let paginationMeta = null;
    if (classes && Array.isArray(classes.data)) {
        rawClasses = classes.data;
        paginationMeta = classes.meta || null;
    } else if (Array.isArray(classes)) {
        rawClasses = classes.length > 0 ? classes : mockClasses;
    } else if (classes && Array.isArray(classes)) {
        rawClasses = classes;
    } else {
        rawClasses = mockClasses;
    }

    // Normaliser les données entrantes pour garantir les clés attendues
    const classesData = rawClasses.map((cls) => ({
        id: cls.id ?? cls.ID ?? null,
        name: cls.name ?? cls.nom ?? "",
        leader: cls.leader ?? cls.conducteur ?? "",
        members_count:
            cls.members_count ??
            cls.nombre_membres ??
            (cls.users ? cls.users.length : 0),
        attendance: cls.attendance ?? cls.presence ?? 0,
        status: cls.status ?? "active",
        transfers_pending: cls.transfers_pending ?? cls.transfers ?? [],
        __raw: cls,
    }));

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("all"); // all, active, alert
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);

    // --- CALCULS & STATISTIQUES ---
    const totalClasses = classesData.length;
    const totalMembers = classesData.reduce(
        (acc, curr) => acc + (curr.members_count || 0),
        0,
    );
    const averageAttendance =
        totalClasses > 0
            ? Math.round(
                  classesData.reduce(
                      (acc, curr) => acc + (curr.attendance || 0),
                      0,
                  ) / totalClasses,
              )
            : 0;
    const alertCount = classesData.filter((c) => c.status === "alert").length;

    // --- FILTRAGE ---
    const filteredClasses = classesData.filter((cls) => {
        const name = (cls.name || "").toString();
        const leader = (cls.leader || "").toString();
        const term = (searchTerm || "").toString();

        const matchesSearch =
            name.toLowerCase().includes(term.toLowerCase()) ||
            leader.toLowerCase().includes(term.toLowerCase());

        let matchesTab = true;
        if (activeTab === "active") matchesTab = cls.status === "active";
        if (activeTab === "alert") matchesTab = cls.status === "alert";

        return matchesSearch && matchesTab;
    });

    return (
        <>
            <Head title="Vision Pastorale - Classes" />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full mx-auto py-8 px-2">
                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 text-white">
                            <Link
                                href="/dashboard"
                                className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Vision Pastorale Globale
                                </h1>
                                <p className="text-blue-100 opacity-90">
                                    Supervision des Classes & Familles
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Rapport PDF
                            </button>
                        </div>
                    </div>

                    {/* KPIs (Transparent Design) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <Users />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Classes Actives
                                </div>
                                <div className="text-2xl font-bold">
                                    {totalClasses}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <User />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Membres Actifs
                                </div>
                                <div className="text-2xl font-bold">
                                    {totalMembers}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
                                <CheckCircle />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Présence Moy.
                                </div>
                                <div className="text-2xl font-bold">
                                    {averageAttendance}%
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center text-white text-xl border border-red-500/50">
                                <AlertTriangle />
                            </div>
                            <div>
                                <div className="text-sm opacity-70 uppercase tracking-wider font-medium">
                                    Alertes
                                </div>
                                <div className="text-2xl font-bold text-yellow-300">
                                    {alertCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS (Search & Filters) */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-slate-100">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            {/* Search */}
                            <div className="relative w-full lg:max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher une classe (ex: Bethel)..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                                />
                            </div>

                            {/* Tabs Filters */}
                            <div className="flex p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
                                {["all", "active", "alert"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 lg:flex-none px-6 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                            activeTab === tab
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {tab === "all" && (
                                            <Users className="w-4 h-4" />
                                        )}
                                        {tab === "active" && (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {tab === "alert" && (
                                            <AlertTriangle className="w-4 h-4" />
                                        )}
                                        <span className="capitalize">
                                            {tab === "all"
                                                ? "Toutes"
                                                : tab === "active"
                                                  ? "Actives"
                                                  : "Alertes"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* GRID DES CLASSES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredClasses.map((cls) => (
                            <ClassCard
                                key={cls.id}
                                data={cls}
                                onClick={() => setSelectedClass(cls)}
                            />
                        ))}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white">
                            <Users className="w-16 h-16 mx-auto mb-4 text-white/50" />
                            <p className="text-xl font-semibold">
                                Aucune classe trouvée
                            </p>
                            <p className="text-sm opacity-70">
                                Essayez d'ajuster vos filtres de recherche.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination controls (si meta présent) */}
                {paginationMeta && (
                    <div className="w-full flex justify-center items-center gap-4 mt-6">
                        <Link
                            href={`?page=${Math.max(1, (paginationMeta.current_page || 1) - 1)}`}
                            className={`px-4 py-2 rounded-md border ${paginationMeta.current_page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            Précédent
                        </Link>
                        <div className="text-sm text-slate-600">
                            Page {paginationMeta.current_page} /{" "}
                            {paginationMeta.last_page}
                        </div>
                        <Link
                            href={`?page=${Math.min(paginationMeta.last_page || 1, (paginationMeta.current_page || 1) + 1)}`}
                            className={`px-4 py-2 rounded-md border ${paginationMeta.current_page >= (paginationMeta.last_page || 1) ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            Suivant
                        </Link>
                    </div>
                )}

                {/* MODAL DETAILS CLASSE */}
                {selectedClass && (
                    <ClassDetailModal
                        data={selectedClass}
                        onClose={() => setSelectedClass(null)}
                    />
                )}
            </div>
        </>
    );
}

// --- SOUS-COMPOSANT : CARTE CLASSE ---
const ClassCard = ({ data, onClick }) => {
    const getAttendanceColor = (val) => {
        if (val < 50) return "bg-red-500";
        if (val < 70) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer group relative overflow-hidden"
        >
            {/* Border Top Color based on status */}
            <div
                className={`absolute top-0 left-0 w-full h-1 ${data.status === "alert" ? "bg-red-500" : "bg-blue-500"}`}
            ></div>

            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-6 h-6" />
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        data.status === "alert"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                    {data.status === "alert" ? "Attention" : "Active"}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
                {data.name}
            </h3>
            <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> {data.leader}
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-600">
                        Effectif
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                        {data.members_count}
                    </span>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                            Familles
                        </span>
                        <button
                            onClick={() => setSelectedClass(data)}
                            className="text-xs px-3 py-1 bg-white/10 text-slate-700 rounded-lg hover:bg-white/20"
                        >
                            Voir (
                            {data.families_count ??
                                (data.families ? data.families.length : 0)}
                            )
                        </button>
                    </div>
                    <div className="text-sm text-slate-500">
                        {data.families && data.families.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {data.families.slice(0, 6).map((fam) => (
                                    <div
                                        key={fam.id}
                                        className="flex items-center justify-between bg-slate-50 rounded-lg p-2 border border-slate-200"
                                    >
                                        <div className="text-sm font-medium">
                                            {fam.nom}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {fam.telephone ?? ""}
                                        </div>
                                    </div>
                                ))}
                                {data.families.length > 6 && (
                                    <div className="text-xs text-slate-400">
                                        Affiché 6 sur {data.families.length}{" "}
                                        familles. Cliquez sur "Voir" pour la
                                        liste complète.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400">
                                Aucune famille associée affichable.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                            Présence
                        </span>
                        <span
                            className={`text-xs font-bold ${data.attendance < 70 ? "text-yellow-600" : "text-emerald-600"}`}
                        >
                            {data.attendance}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${getAttendanceColor(data.attendance)}`}
                            style={{ width: `${data.attendance}%` }}
                        ></div>
                    </div>
                </div>

                {data.transfers_pending &&
                    data.transfers_pending.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-yellow-800">
                                Transfert en attente
                            </span>
                            <ChevronDown className="w-4 h-4 text-yellow-700" />
                        </div>
                    )}
            </div>
        </div>
    );
};

// --- SOUS-COMPOSANT : MODAL DETAILS ---
const ClassDetailModal = ({ data, onClose }) => {
    const [validating, setValidating] = useState(false);

    const handleValidate = (transferId) => {
        if (!confirm("Confirmer le transfert ?")) return;
        setValidating(true);
        // Simulation API Call
        setTimeout(() => {
            setValidating(false);
            alert("Transfert validé !");
            // Dans Inertia : router.reload();
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-fadeIn">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{data.name}</h2>
                        <p className="text-slate-400 text-sm">
                            Géré par {data.leader}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                                Membres
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {data.members_count}
                            </div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl text-center">
                            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                Présence
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {data.attendance}%
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-center">
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Statut
                            </div>
                            <div
                                className={`text-sm font-bold uppercase mt-2 ${data.status === "alert" ? "text-red-500" : "text-green-500"}`}
                            >
                                {data.status}
                            </div>
                        </div>
                    </div>

                    {/* Transfers Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Transferts en attente
                        </h3>

                        {/* Inscription pending list (real data) */}
                        {data.inscriptions && data.inscriptions.length > 0 ? (
                            <div className="space-y-3">
                                {data.inscriptions.map((ins) => (
                                    <div
                                        key={ins.id}
                                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {ins.responsable_nom}{" "}
                                                {ins.responsable_prenom}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Type: {ins.type} — Déposé:{" "}
                                                {ins.created_at}
                                            </div>
                                            {ins.family && (
                                                <div className="text-xs text-slate-500">
                                                    Famille: {ins.family.nom}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleValidate(ins.id)
                                            }
                                            disabled={validating}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition shadow-md disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />{" "}
                                            Valider
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-sm">
                                    Aucun transfert ou inscription en attente
                                    pour cette classe.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Dernières Activités
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">
                                    Dernière réunion : Il y a 3 jours
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">
                                    Lieu : Salle Principale
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-8 py-4 flex justify-end gap-3 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition"
                    >
                        Fermer
                    </button>
                    <button
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition flex items-center gap-2"
                        onClick={() =>
                            alert("Ouverture de l'historique complet...")
                        }
                    >
                        <Eye className="w-4 h-4" /> Voir tout l'historique
                    </button>
                </div>
            </div>
        </div>
    );
};
