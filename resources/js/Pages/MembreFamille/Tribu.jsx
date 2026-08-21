import React, { useEffect, useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    X,
    Users,
    Crown,
    Wallet,
    CalendarCheck,
    ArrowRightLeft,
    Send,
    Clock,
    Check,
    Search,
    History,
} from "lucide-react";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../Helpers/select2SingleOptions";
import ProfilePhoto from "../../Components/ProfilePhoto";
import Select2Single from "../../Components/Select2Single";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

const STYLES = `
    .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1rem 0; flex-wrap: wrap; }
    .pagination-info { margin-right: 1rem; color: #4b5563; font-size: 0.875rem; font-weight: 600; }
    .pagination-btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: white; border: 1px solid #d1d5db; color: #374151; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; }
    .pagination-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .pagination-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }
    .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ROLE_LABELS = {
    membre_famille: "Membre de famille",
    responsable_famille: "Responsable de famille",
    conducteur: "Conducteur",
    pasteur: "Pasteur",
};
const formatRole = (role) => ROLE_LABELS[role] || role || "-";
const formatGenre = (genre) =>
    genre === "M" ? "Masculin" : genre === "F" ? "Féminin" : "-";
const employmentLabel = (value) =>
    EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === value)?.label ||
    "Non renseigné";

const Pagination = ({ currentPage, totalPages, paginate }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <span className="pagination-info">
                Page {currentPage} sur {totalPages}
            </span>
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Précédent
            </button>
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    className={`pagination-btn ${currentPage === number ? "active" : ""}`}
                    onClick={() => paginate(number)}
                >
                    {number}
                </button>
            ))}
            <button
                className="pagination-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Suivant
            </button>
        </div>
    );
};

export default function Tribu({
    basePath = "/membre-famille",
    tribu,
    isTribuChef = false,
    membresScope = "famille",
    autresTribus = [],
    demandeEnCours = null,
    demandesRecues = [],
}) {
    const toast = useToast();
    const membres = tribu?.membres ?? [];
    const [searchInput, setSearchInput] = useState("");
    const [searchMembres, setSearchMembres] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const lancerRecherche = () => setSearchMembres(searchInput);

    const filteredMembres = membres.filter((m) => {
        const term = searchMembres.trim().toLowerCase();
        if (!term) return true;
        return (
            m.nom.toLowerCase().includes(term) ||
            (m.prenom || "").toLowerCase().includes(term)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredMembres.length / itemsPerPage));
    const paginatedMembres = filteredMembres.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchMembres]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    // --- Demander un transfert (membre ordinaire) ---
    const [showDemandeModal, setShowDemandeModal] = useState(false);
    const [demandeTribuId, setDemandeTribuId] = useState("");
    const [demandeMotif, setDemandeMotif] = useState("");
    const [sendingDemande, setSendingDemande] = useState(false);

    const tribuOptions = autresTribus.map((t) => ({
        value: t.id,
        label: t.nom,
    }));

    const envoyerDemande = () => {
        if (!demandeTribuId) return;
        setSendingDemande(true);
        router.post(
            withBasePath("", `${basePath}/tribu/demander-transfert`),
            { tribu_id: demandeTribuId, motif: demandeMotif },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDemandeModal(false);
                    setDemandeTribuId("");
                    setDemandeMotif("");
                },
                onError: (errors) =>
                    toast.error(
                        errors?.error || "Erreur lors de l'envoi de la demande.",
                    ),
                onFinish: () => setSendingDemande(false),
            },
        );
    };

    return (
        <>
            <Head title="Ma Tribu" />
            <style>{STYLES}</style>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div
                    className={`w-full mx-auto py-8 ${membresScope === "tribu" ? "max-w-6xl" : "max-w-4xl"}`}
                >
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", `${basePath}/dashboard`)}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Ma Tribu
                        </h1>
                    </div>

                    {!tribu ? (
                        <div className="bg-white/90 rounded-2xl p-10 text-center text-gray-500">
                            Vous n'êtes pas encore affecté à une tribu. Rapprochez-vous
                            de votre conducteur de classe.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                        {tribu.nom}
                                    </h2>
                                    {isTribuChef && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                                            <Crown className="w-3.5 h-3.5" /> Chef de
                                            tribu
                                        </span>
                                    )}
                                </div>
                                {tribu.description && (
                                    <p className="text-sm text-gray-500 mb-3">
                                        {tribu.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    Chef{tribu.chefs.length > 1 ? "s" : ""} :{" "}
                                    {tribu.chefs.length > 0
                                        ? tribu.chefs
                                              .map((c) => c.nom)
                                              .join(", ")
                                        : "Aucun chef nommé pour le moment"}
                                </div>
                            </div>

                            {isTribuChef && (
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={withBasePath(
                                            "",
                                            `${basePath}/tribu/finances`,
                                        )}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg transition transform hover:scale-[1.02]"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Suivi des finances
                                    </Link>
                                    <Link
                                        href={withBasePath(
                                            "",
                                            `${basePath}/tribu/presences`,
                                        )}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-lg transition transform hover:scale-[1.02]"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                        Suivi des présences
                                    </Link>
                                    <Link
                                        href={withBasePath(
                                            "",
                                            `${basePath}/tribu/assigner`,
                                        )}
                                        className="relative inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg transition transform hover:scale-[1.02]"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Transfert
                                        {demandesRecues.length > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white animate-pulse ring-2 ring-white">
                                                {demandesRecues.length}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        href={withBasePath(
                                            "",
                                            `${basePath}/tribu/historique-transferts`,
                                        )}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold shadow-lg transition"
                                    >
                                        <History className="w-4 h-4" />
                                        Historique
                                    </Link>
                                </div>
                            )}

                            {!isTribuChef && (
                                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                    {demandeEnCours ? (
                                        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-amber-900">
                                                    {demandeEnCours.etape ===
                                                    "depart"
                                                        ? "Départ en attente de validation"
                                                        : "Arrivée en attente de validation"}
                                                </p>
                                                <p className="text-sm text-amber-700 mt-0.5">
                                                    {demandeEnCours.etape ===
                                                    "depart" ? (
                                                        <>
                                                            Transfert vers{" "}
                                                            <span className="font-bold">
                                                                {
                                                                    demandeEnCours.tribuDestination
                                                                }
                                                            </span>{" "}
                                                            demandé — le chef
                                                            de{" "}
                                                            <span className="font-bold">
                                                                {
                                                                    demandeEnCours.tribuOrigine
                                                                }
                                                            </span>{" "}
                                                            doit d'abord
                                                            valider votre
                                                            départ.
                                                        </>
                                                    ) : (
                                                        <>
                                                            Départ validé par
                                                            le chef de{" "}
                                                            <span className="font-bold">
                                                                {
                                                                    demandeEnCours.tribuOrigine
                                                                }
                                                            </span>{" "}
                                                            — en attente de
                                                            validation par le
                                                            chef de{" "}
                                                            <span className="font-bold">
                                                                {
                                                                    demandeEnCours.tribuDestination
                                                                }
                                                            </span>
                                                            .
                                                        </>
                                                    )}
                                                </p>
                                                {demandeEnCours.motif && (
                                                    <p className="text-xs text-amber-600/80 italic mt-1.5">
                                                        « {demandeEnCours.motif}{" "}
                                                        »
                                                    </p>
                                                )}
                                                {demandeEnCours.date && (
                                                    <p className="text-xs text-amber-500 mt-1.5">
                                                        Envoyée le{" "}
                                                        {demandeEnCours.date}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                                                            demandeEnCours.etape ===
                                                            "accueil"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {demandeEnCours.etape ===
                                                        "accueil" ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <Clock className="w-3 h-3" />
                                                        )}
                                                        1. Départ
                                                    </span>
                                                    <div className="w-4 h-px bg-amber-300 shrink-0" />
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                                                            demandeEnCours.etape ===
                                                            "accueil"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-gray-100 text-gray-400"
                                                        }`}
                                                    >
                                                        {demandeEnCours.etape ===
                                                        "accueil" ? (
                                                            <Clock className="w-3 h-3" />
                                                        ) : (
                                                            <span className="w-3 h-3 rounded-full border border-gray-300" />
                                                        )}
                                                        2. Arrivée
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setShowDemandeModal(true)
                                            }
                                            disabled={autresTribus.length === 0}
                                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                            Demander un transfert
                                        </button>
                                    )}

                                    <div className="mt-3">
                                        <Link
                                            href={withBasePath(
                                                "",
                                                `${basePath}/tribu/historique-transferts`,
                                            )}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                                        >
                                            <History className="w-3.5 h-3.5" />
                                            Voir l'historique de mes demandes
                                            de transfert
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                                    <h3 className="text-sm font-bold text-gray-700">
                                        {membresScope === "tribu"
                                            ? `Membres de la tribu (${filteredMembres.length})`
                                            : `Membres de ma famille (${membres.length})`}
                                    </h3>
                                    {membresScope === "tribu" &&
                                        membres.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="relative max-w-xs">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={searchInput}
                                                        onChange={(e) =>
                                                            setSearchInput(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {
                                                                lancerRecherche();
                                                            }
                                                        }}
                                                        placeholder="Rechercher un membre..."
                                                        className="pl-9 pr-3 py-2 rounded-xl border-[1.5px] border-gray-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={lancerRecherche}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shrink-0"
                                                >
                                                    <Search className="w-4 h-4" />
                                                    Rechercher
                                                </button>
                                            </div>
                                        )}
                                </div>

                                {membresScope === "tribu" ? (
                                    membres.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun autre membre dans cette tribu
                                            pour le moment.
                                        </p>
                                    ) : filteredMembres.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucun membre ne correspond à "
                                            {searchMembres}".
                                        </p>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2"></th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Nom
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Prénom
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Code famille
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Code membre
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Email
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Téléphone
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Genre
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Rôle
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Fonction
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Baptisé
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                1ère Comm.
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Statut matrimonial
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Famille
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Date Naiss.
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Relation
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Profession
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Statut emploi
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Lieu Naiss.
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                N° CNI
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Hors Comm.
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Retrait
                                                            </th>
                                                            <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                                Date Retrait
                                                            </th>
                                                            <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                                Statut
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {paginatedMembres.map(
                                                            (m) => {
                                                                const estChef =
                                                                    tribu.chefs.some(
                                                                        (c) =>
                                                                            c.id ===
                                                                            m.id,
                                                                    );
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            m.id
                                                                        }
                                                                    >
                                                                        <td className="px-4 py-2">
                                                                            <ProfilePhoto
                                                                                user={
                                                                                    m
                                                                                }
                                                                                size="sm"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 font-medium text-gray-800">
                                                                            <div className="flex items-center gap-2">
                                                                                {
                                                                                    m.nom
                                                                                }
                                                                                {estChef && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide shrink-0">
                                                                                        <Crown className="w-3 h-3" />
                                                                                        Chef
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-700">
                                                                            {
                                                                                m.prenom
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {m.code_famille ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {m.code_membre ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {m.email ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {m.telephone ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {formatGenre(
                                                                                m.genre,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {formatRole(
                                                                                m.role,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500">
                                                                            {m.fonction ||
                                                                                "Non renseigné"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            {m.baptise ? (
                                                                                <span className="text-green-600 font-bold">
                                                                                    Oui
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">
                                                                                    Non
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            {m.premiere_communion ? (
                                                                                <span className="text-green-600 font-bold">
                                                                                    Oui
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">
                                                                                    Non
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                                                {
                                                                                    m.statut_marital
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {
                                                                                m.famille
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.date_naissance ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.relation ||
                                                                                "Non renseigné"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.profession ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center whitespace-nowrap">
                                                                            {m.employment_status ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                                                    {employmentLabel(
                                                                                        m.employment_status,
                                                                                    )}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.lieu_naissance ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.numero_cni ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            {m.hors_communaute ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                                                                    Oui
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">
                                                                                    Non
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            {m.retrait ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                                                    Oui
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-400">
                                                                                    Non
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                                                            {m.date_retrait ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <span
                                                                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                                                            >
                                                                                {m.is_active
                                                                                    ? "Actif"
                                                                                    : "Inactif"}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {totalPages > 1 && (
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={totalPages}
                                                    paginate={goToPage}
                                                />
                                            )}
                                        </>
                                    )
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {membres.map((m) => (
                                            <li
                                                key={m.id}
                                                className="py-2 flex items-center gap-2 text-sm text-gray-700"
                                            >
                                                {m.nom}
                                                {tribu.chefs.some(
                                                    (c) => c.id === m.id,
                                                ) && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide shrink-0">
                                                        <Crown className="w-3 h-3" />
                                                        Chef
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DEMANDER UN TRANSFERT (modal) */}
                    {showDemandeModal && (
                        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Demander un transfert
                                    </h2>
                                    <button
                                        onClick={() =>
                                            setShowDemandeModal(false)
                                        }
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                            Tribu de destination
                                        </label>
                                        <Select2Single
                                            name="demande_tribu"
                                            value={demandeTribuId}
                                            onChange={(e) =>
                                                setDemandeTribuId(
                                                    e.target.value,
                                                )
                                            }
                                            options={tribuOptions}
                                            placeholder="Choisir une tribu..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                            Motif (facultatif)
                                        </label>
                                        <textarea
                                            value={demandeMotif}
                                            onChange={(e) =>
                                                setDemandeMotif(
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Pourquoi souhaitez-vous être transféré(e) ?"
                                            className="w-full px-4 py-2.5 rounded-xl border-[1.5px] border-gray-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Le chef de la tribu de destination
                                        devra valider votre demande. Votre
                                        historique (cotisations, présences)
                                        vous suivra automatiquement.
                                    </p>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            onClick={() =>
                                                setShowDemandeModal(false)
                                            }
                                            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={envoyerDemande}
                                            disabled={
                                                !demandeTribuId ||
                                                sendingDemande
                                            }
                                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Envoyer la demande
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
