import React, { useState } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import {
    ArrowLeft,
    ArrowRightLeft,
    Send,
    Check,
    X,
    Search,
    History,
} from "lucide-react";
import Select2Single from "../../Components/Select2Single";
import useToast from "../../Hooks/useToast";
import ToastContainer from "../../Components/ToastContainer";

const FORM_STYLES = `
    :root {
        --primary: #4f46e5; --primary-hover: #4338ca;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .input-control { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1.5px solid #d1d5db; background-color: #ffffff; font-size: 0.9rem; color: #111827; transition: all 0.2s; }
    .input-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); outline: none; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.25rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; gap: 0.5rem; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background-color: white; border-color: #d1d5db; color: #111827; }
    .btn-secondary:hover { background-color: #f3f4f6; }
`;

export default function TribuAssigner({
    basePath = "/membre-famille",
    tribu,
    membresActuels = [],
    autresTribus = [],
    demandesRecues = [],
}) {
    const toast = useToast();
    const [processingDemandeId, setProcessingDemandeId] = useState(null);
    const [selectedDemandeIds, setSelectedDemandeIds] = useState(new Set());
    const [processingBulk, setProcessingBulk] = useState(false);

    const toggleDemandeSelection = (id) => {
        setSelectedDemandeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAllDemandes = () => {
        setSelectedDemandeIds((prev) =>
            prev.size === demandesRecues.length
                ? new Set()
                : new Set(demandesRecues.map((d) => d.id)),
        );
    };

    // --- Faire un transfert (chef, au nom d'un membre de sa tribu) ---
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferMembreId, setTransferMembreId] = useState("");
    const [transferTribuId, setTransferTribuId] = useState("");
    const [transferMotif, setTransferMotif] = useState("");
    const [sendingTransfer, setSendingTransfer] = useState(false);

    const membreOptions = membresActuels.map((m) => ({
        value: m.id,
        label: m.nom,
    }));
    const tribuCibleOptions = autresTribus.map((t) => ({
        value: t.id,
        label: t.nom,
    }));

    const envoyerTransfert = () => {
        if (!transferMembreId || !transferTribuId) return;
        setSendingTransfer(true);
        router.post(
            withBasePath("", `${basePath}/tribu/demander-transfert`),
            {
                membre_id: transferMembreId,
                tribu_id: transferTribuId,
                motif: transferMotif,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowTransferModal(false);
                    setTransferMembreId("");
                    setTransferTribuId("");
                    setTransferMotif("");
                },
                onError: (errors) =>
                    toast.error(
                        errors?.error || "Erreur lors de l'envoi de la demande.",
                    ),
                onFinish: () => setSendingTransfer(false),
            },
        );
    };

    const validerDemande = (demandeId) => {
        setProcessingDemandeId(demandeId);
        router.post(
            withBasePath("", `${basePath}/tribu/demandes/${demandeId}/valider`),
            {},
            {
                preserveScroll: true,
                onError: (errors) =>
                    toast.error(errors?.error || "Erreur lors de la validation."),
                onFinish: () => setProcessingDemandeId(null),
            },
        );
    };

    const refuserDemande = (demandeId) => {
        setProcessingDemandeId(demandeId);
        router.post(
            withBasePath("", `${basePath}/tribu/demandes/${demandeId}/refuser`),
            {},
            {
                preserveScroll: true,
                onError: (errors) =>
                    toast.error(errors?.error || "Erreur lors du refus."),
                onFinish: () => setProcessingDemandeId(null),
            },
        );
    };

    const validerSelection = () => {
        if (selectedDemandeIds.size === 0) return;
        setProcessingBulk(true);
        router.post(
            withBasePath("", `${basePath}/tribu/demandes/valider-plusieurs`),
            { demande_ids: Array.from(selectedDemandeIds) },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedDemandeIds(new Set()),
                onError: (errors) =>
                    toast.error(
                        errors?.error ||
                            "Erreur lors de la validation groupée.",
                    ),
                onFinish: () => setProcessingBulk(false),
            },
        );
    };

    const refuserSelection = () => {
        if (selectedDemandeIds.size === 0) return;
        setProcessingBulk(true);
        router.post(
            withBasePath("", `${basePath}/tribu/demandes/refuser-plusieurs`),
            { demande_ids: Array.from(selectedDemandeIds) },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedDemandeIds(new Set()),
                onError: (errors) =>
                    toast.error(
                        errors?.error || "Erreur lors du refus groupé.",
                    ),
                onFinish: () => setProcessingBulk(false),
            },
        );
    };

    return (
        <>
            <Head title={`Transfert - ${tribu.nom}`} />
            <style>{FORM_STYLES}</style>
            <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-16 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-6xl mx-auto py-8">
                    {/* HEADER */}
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", `${basePath}/tribu`)}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                {tribu.nom}
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Transférer un membre de votre tribu
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
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
                            <button
                                onClick={() => setShowTransferModal(true)}
                                disabled={
                                    membresActuels.length === 0 ||
                                    autresTribus.length === 0
                                }
                                title={
                                    membresActuels.length === 0
                                        ? "Aucun membre dans votre tribu"
                                        : autresTribus.length === 0
                                          ? "Aucune autre tribu dans la classe"
                                          : undefined
                                }
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                                Faire un transfert
                            </button>
                        </div>
                    </div>

                    {/* DEMANDES DE TRANSFERT REÇUES */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Send className="w-5 h-5 text-indigo-500" />
                                Demandes de transfert reçues (
                                {demandesRecues.length})
                            </h2>
                            {demandesRecues.length > 1 && (
                                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedDemandeIds.size ===
                                                demandesRecues.length &&
                                            demandesRecues.length > 0
                                        }
                                        onChange={toggleSelectAllDemandes}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Tout sélectionner
                                </label>
                            )}
                        </div>

                        {demandesRecues.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                Aucune demande de transfert pour le moment.
                            </p>
                        ) : (
                            <>
                            {selectedDemandeIds.size > 0 && (
                                <div className="flex items-center justify-between gap-4 flex-wrap mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <span className="text-sm font-bold text-indigo-700">
                                        {selectedDemandeIds.size} sélectionnée
                                        {selectedDemandeIds.size > 1
                                            ? "s"
                                            : ""}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={validerSelection}
                                            disabled={processingBulk}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Valider la sélection
                                        </button>
                                        <button
                                            onClick={refuserSelection}
                                            disabled={processingBulk}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold disabled:opacity-50"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Refuser la sélection
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                {demandesRecues.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between gap-4 flex-wrap p-3 rounded-xl bg-indigo-50/60 border border-indigo-100"
                                    >
                                        <div className="flex items-start gap-3 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedDemandeIds.has(
                                                    d.id,
                                                )}
                                                onChange={() =>
                                                    toggleDemandeSelection(
                                                        d.id,
                                                    )
                                                }
                                                className="w-4 h-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                                            />
                                            <div>
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold mr-2 align-middle ${
                                                    d.etape === "depart"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-indigo-100 text-indigo-700"
                                                }`}
                                            >
                                                {d.etape === "depart"
                                                    ? "Départ"
                                                    : "Arrivée"}
                                            </span>
                                            <span className="font-bold text-gray-800">
                                                {d.membre}
                                            </span>
                                            <span className="text-gray-500">
                                                {" "}
                                                {d.etape === "depart" ? (
                                                    <>
                                                        souhaite quitter votre
                                                        tribu pour rejoindre{" "}
                                                        {d.tribuDestination}
                                                    </>
                                                ) : (
                                                    <>
                                                        souhaite rejoindre
                                                        votre tribu depuis{" "}
                                                        {d.tribuOrigine}
                                                    </>
                                                )}{" "}
                                                — {d.date}
                                            </span>
                                            {d.motif && (
                                                <div className="text-xs text-gray-400 italic mt-0.5">
                                                    "{d.motif}"
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() =>
                                                    validerDemande(d.id)
                                                }
                                                disabled={
                                                    processingDemandeId ===
                                                    d.id
                                                }
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Valider
                                            </button>
                                            <button
                                                onClick={() =>
                                                    refuserDemande(d.id)
                                                }
                                                disabled={
                                                    processingDemandeId ===
                                                    d.id
                                                }
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold disabled:opacity-50"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Refuser
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </>
                        )}
                    </div>

                    {/* FAIRE UN TRANSFERT (modal) */}
                    {showTransferModal && (
                        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Faire un transfert
                                    </h2>
                                    <button
                                        onClick={() =>
                                            setShowTransferModal(false)
                                        }
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Membre à transférer
                                        </label>
                                        <Select2Single
                                            name="transfer_membre"
                                            value={transferMembreId}
                                            onChange={(e) =>
                                                setTransferMembreId(
                                                    e.target.value,
                                                )
                                            }
                                            options={membreOptions}
                                            placeholder="Rechercher un membre..."
                                            icon={Search}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Tribu de destination
                                        </label>
                                        <Select2Single
                                            name="transfer_tribu"
                                            value={transferTribuId}
                                            onChange={(e) =>
                                                setTransferTribuId(
                                                    e.target.value,
                                                )
                                            }
                                            options={tribuCibleOptions}
                                            placeholder="Rechercher une tribu..."
                                            icon={Search}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Motif (facultatif)
                                        </label>
                                        <textarea
                                            value={transferMotif}
                                            onChange={(e) =>
                                                setTransferMotif(
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Raison du transfert..."
                                            className="input-control"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Le chef de la tribu de destination
                                        devra valider ce transfert. L'historique
                                        du membre (cotisations, présences) le
                                        suivra automatiquement.
                                    </p>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            onClick={() =>
                                                setShowTransferModal(false)
                                            }
                                            className="btn btn-secondary"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={envoyerTransfert}
                                            disabled={
                                                !transferMembreId ||
                                                !transferTribuId ||
                                                sendingTransfer
                                            }
                                            className="btn btn-primary"
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
