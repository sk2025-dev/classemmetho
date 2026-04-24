import React, { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import ProfilePhoto from "@/Components/ProfilePhoto";
import { ToastContainer } from "@/Components/Toast";
import { withBasePath } from "../../Utils/urlHelper";

const STATUS_MAP = {
    en_attente: {
        label: "En attente",
        bgColor: "#FCD34D",
        textColor: "#92400E",
    },
    approuve: {
        label: "Approuvé",
        bgColor: "#86EFAC",
        textColor: "#166534",
    },
    rejete: {
        label: "Rejeté",
        bgColor: "#FCA5A5",
        textColor: "#991B1B",
    },
};

export default function Inscriptions() {
    const { inscriptions: initialInscriptions = [] } = usePage().props;
    const [inscriptions, setInscriptions] = useState(initialInscriptions);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [approving, setApproving] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [toasts, setToasts] = useState([]);
    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        action: null,
        inscription: null,
    });

    useEffect(() => {
        setInscriptions(initialInscriptions);
    }, [initialInscriptions]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const addToast = (message, type = "success", duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const getInscriptionTypeLabel = (inscription) => {
        const labels = {
            famille: "de famille",
            individuel: "individuelle",
            pasteur: "de pasteur",
            conducteur: "de conducteur",
        };

        return labels[inscription?.type] || "de membre";
    };

    const getDisplayName = (inscription) =>
        [inscription?.prenom, inscription?.nom].filter(Boolean).join(" ");

    const openConfirmation = (action, inscription) => {
        setConfirmationState({
            isOpen: true,
            action,
            inscription,
        });
    };

    const closeConfirmation = () => {
        setConfirmationState({
            isOpen: false,
            action: null,
            inscription: null,
        });
    };

    const filteredInscriptions = inscriptions.filter((inscription) => {
        const matchSearch =
            (inscription.nom?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            ) ||
            (inscription.prenom?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            );

        const matchStatus =
            !statusFilter || inscription.status === statusFilter;

        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredInscriptions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInscriptions = filteredInscriptions.slice(
        startIndex,
        startIndex + itemsPerPage,
    );

    const handleApprove = (id) => {
        setApproving(id);

        router.post(
            `/admin/inscriptions/${id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const approvedInscription =
                        confirmationState.inscription ||
                        inscriptions.find(
                            (inscription) => inscription.id === id,
                        );

                    setApproving(null);
                    closeConfirmation();
                    setInscriptions((prev) =>
                        prev.map((inscription) =>
                            inscription.id === id
                                ? { ...inscription, status: "approuve" }
                                : inscription,
                        ),
                    );
                    addToast(
                        `Inscription ${getInscriptionTypeLabel(approvedInscription)} de ${getDisplayName(approvedInscription)} approuvée avec succès.`,
                        "success",
                    );
                },
                onError: (errors) => {
                    setApproving(null);
                    closeConfirmation();
                    const firstError =
                        Object.values(errors || {}).flat()[0] ||
                        "Une erreur est survenue pendant l'approbation.";
                    addToast(firstError, "error", 5000);
                },
            },
        );
    };

    const handleReject = (id) => {
        setRejectingId(id);

        router.post(
            `/admin/inscriptions/${id}/reject`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const rejectedInscription =
                        confirmationState.inscription ||
                        inscriptions.find(
                            (inscription) => inscription.id === id,
                        );

                    setRejectingId(null);
                    closeConfirmation();
                    setInscriptions((prev) =>
                        prev.map((inscription) =>
                            inscription.id === id
                                ? { ...inscription, status: "rejete" }
                                : inscription,
                        ),
                    );
                    addToast(
                        `Inscription ${getInscriptionTypeLabel(rejectedInscription)} de ${getDisplayName(rejectedInscription)} rejetée.`,
                        "warning",
                        4500,
                    );
                },
                onError: (errors) => {
                    setRejectingId(null);
                    closeConfirmation();
                    const firstError =
                        Object.values(errors || {}).flat()[0] ||
                        "Une erreur est survenue pendant le rejet.";
                    addToast(firstError, "error", 5000);
                },
            },
        );
    };

    const confirmCurrentAction = () => {
        const { action, inscription } = confirmationState;

        if (!action || !inscription?.id) {
            return;
        }

        if (action === "approve") {
            handleApprove(inscription.id);
            return;
        }

        handleReject(inscription.id);
    };

    return (
        <div
            className="min-h-screen admin-page py-8 px-2 sm:px-6 lg:px-8"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                minHeight: "100vh",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            <Head title="Gestion des inscriptions" />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

            <div className="mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <Link
                            href={withBasePath("", "/admin/dashboard")}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Liste des Inscriptions
                            </h1>
                            <p className="text-indigo-200 text-sm">
                                Gérez les demandes d'adhésion
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={withBasePath(
                                "",
                                "/admin/inscriptions/type-selection",
                            )}
                            className="text-white px-5 py-2.5 rounded-lg shadow-lg transition flex items-center gap-2 font-medium"
                            style={{
                                backgroundColor: "#B6C01A",
                                border: "none",
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            Nouvelle Inscription
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
                    <div className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                        </span>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B6C01A] focus:border-[#B6C01A] sm:text-sm transition duration-150 ease-in-out shadow"
                            placeholder="Rechercher un membre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#B6C01A] focus:border-[#B6C01A] transition duration-150 ease-in-out shadow"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="approuve">Approuvé</option>
                        <option value="rejete">Rejeté</option>
                    </select>
                </div>

                <div className="bg-white rounded-xl shadow-xl overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead
                            className="sticky top-0 z-10"
                            style={{ backgroundColor: "#B6C01A" }}
                        >
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Nom complet
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Créé par
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Classe Méthodiste
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Ville
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-white">
                                    Statut
                                </th>
                                <th className="px-4 py-3 text-center font-semibold text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedInscriptions.length > 0 ? (
                                paginatedInscriptions.map(
                                    (inscription, idx) => {
                                        const statusInfo = STATUS_MAP[
                                            inscription.status
                                        ] || {
                                            label: inscription.status,
                                            bgColor: "#D1D5DB",
                                            textColor: "#374151",
                                        };

                                        return (
                                            <tr
                                                key={inscription.id}
                                                className="hover:bg-[#EDD31D]/20 transition-colors"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                                                    {startIndex + idx + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap flex items-center gap-3">
                                                    <ProfilePhoto
                                                        user={inscription}
                                                        size="md"
                                                        rounded={true}
                                                    />
                                                    <span className="font-medium text-gray-900">
                                                        {getDisplayName(
                                                            inscription,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 text-xs font-semibold">
                                                    <span
                                                        style={{
                                                            backgroundColor:
                                                                inscription.created_by ===
                                                                "Famille (Responsable)"
                                                                    ? "#DDD6FE"
                                                                    : "#FEE2E2",
                                                            color:
                                                                inscription.created_by ===
                                                                "Famille (Responsable)"
                                                                    ? "#4F46E5"
                                                                    : "#DC2626",
                                                            borderRadius:
                                                                "9999px",
                                                            padding: "3px 10px",
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    >
                                                        {inscription.created_by}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {inscription.email || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {inscription.classe ||
                                                        "Non assignée"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {inscription.ville || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {inscription.created_at}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        style={{
                                                            backgroundColor:
                                                                statusInfo.bgColor,
                                                            color: statusInfo.textColor,
                                                            borderRadius:
                                                                "9999px",
                                                            padding: "4px 12px",
                                                            fontWeight: "bold",
                                                            fontSize: "0.85em",
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    >
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {inscription.status ===
                                                    "en_attente" ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    openConfirmation(
                                                                        "approve",
                                                                        inscription,
                                                                    )
                                                                }
                                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-semibold shadow transition"
                                                                title="Approuver"
                                                                disabled={
                                                                    approving ===
                                                                    inscription.id
                                                                }
                                                            >
                                                                {approving ===
                                                                inscription.id
                                                                    ? "Approbation..."
                                                                    : "Approuver"}
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    openConfirmation(
                                                                        "reject",
                                                                        inscription,
                                                                    )
                                                                }
                                                                className="text-white px-3 py-1 rounded font-semibold shadow transition"
                                                                style={{
                                                                    backgroundColor:
                                                                        "#800020",
                                                                }}
                                                                title="Rejeter"
                                                                disabled={
                                                                    rejectingId ===
                                                                    inscription.id
                                                                }
                                                            >
                                                                {rejectingId ===
                                                                inscription.id
                                                                    ? "Rejet..."
                                                                    : "Rejeter"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">
                                                            Action effectuée
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    },
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan="9"
                                        className="px-6 py-10 text-center text-gray-500"
                                    >
                                        <p>Aucune inscription trouvée.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-4 border-t border-gray-200 mt-4 gap-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold">
                                {filteredInscriptions.length}
                            </span>{" "}
                            inscription
                            {filteredInscriptions.length !== 1 ? "s" : ""}{" "}
                            trouvée
                            {filteredInscriptions.length !== 1 ? "s" : ""} •
                            Page{" "}
                            <span className="font-semibold">{currentPage}</span>{" "}
                            sur{" "}
                            <span className="font-semibold">{totalPages}</span>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                                title="Page précédente"
                            >
                                ← Précédent
                            </button>
                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded font-medium transition ${
                                        page === currentPage
                                            ? "bg-[#B6C01A] text-white border-[#B6C01A]"
                                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    setCurrentPage(
                                        Math.min(totalPages, currentPage + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                                title="Page suivante"
                            >
                                Suivant →
                            </button>
                        </div>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value, 10));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#B6C01A]"
                        >
                            <option value="5">5/page</option>
                            <option value="10">10/page</option>
                            <option value="20">20/page</option>
                            <option value="50">50/page</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end bg-gray-50 px-4 py-3 border-t border-gray-200 mt-4 gap-4 rounded-b-lg">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition font-medium"
                        title="Actualiser la liste"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                type={
                    confirmationState.action === "reject" ? "reject" : "approve"
                }
                title={
                    confirmationState.action === "reject"
                        ? "Rejeter l'inscription"
                        : "Approuver l'inscription"
                }
                message={
                    confirmationState.action === "reject"
                        ? `Voulez-vous vraiment rejeter cette inscription ${getInscriptionTypeLabel(confirmationState.inscription)} ?`
                        : `Voulez-vous approuver cette inscription ${getInscriptionTypeLabel(confirmationState.inscription)} ?`
                }
                itemName={getDisplayName(confirmationState.inscription)}
                confirmText={
                    confirmationState.action === "reject"
                        ? "Oui, rejeter"
                        : "Oui, approuver"
                }
                cancelText="Annuler"
                loading={
                    (confirmationState.action === "approve" &&
                        approving === confirmationState.inscription?.id) ||
                    (confirmationState.action === "reject" &&
                        rejectingId === confirmationState.inscription?.id)
                }
                onConfirm={confirmCurrentAction}
                onCancel={closeConfirmation}
            />
        </div>
    );
}
