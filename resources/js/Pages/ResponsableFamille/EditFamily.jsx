import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";
import {
    ArrowLeft,
    Save,
    X,
    Users,
    MapPin,
    Building2,
    Phone,
    Mail,
    Lock,
    Home,
    Hash,
    ArrowRightLeft,
    AlertTriangle,
    Loader2,
    CheckCircle2,
} from "lucide-react";

export default function EditFamily({
    family,
    classes,
    villes,
    routeBase: routeBaseProp,
    membres = [],
    transferLocked = false,
}) {
    const routeBase = routeBaseProp || ((typeof window !== "undefined" && window.location.pathname.startsWith("/pasteur"))
        ? "/pasteur"
        : "/responsable-famille");

    const formatDateTime = (dateValue) => {
        if (!dateValue) return "—";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return typeof dateValue === "string" ? dateValue : "—";
        }
        return date.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const { data, setData, post, processing, errors } = useForm({
        nom: family.nom || "",
        email: family.email || "",
        telephone: family.telephone || "",
        telephone2: family.telephone2 || "",
        adresse: family.adresse || "",
        quartier: family.quartier || "",
        classe_id: family.classe_id || "",
        ville_id: family.ville_id || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(withBasePath("", `${routeBase}/family/update`));
    };

    const handleCancel = () => {
        router.get(withBasePath("", `${routeBase}/inscriptions`));
    };

    const [selectedResponsableId, setSelectedResponsableId] = useState("");
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);
    const [transferProcessing, setTransferProcessing] = useState(false);
    const [transferError, setTransferError] = useState(null);
    const [transferDone, setTransferDone] = useState(null);

    const selectedMembre = membres.find((m) => String(m.id) === String(selectedResponsableId));

    const openTransferConfirm = () => {
        if (!selectedMembre) return;
        setTransferError(null);
        setShowTransferConfirm(true);
    };

    const confirmTransfer = async () => {
        if (!selectedMembre) return;
        setTransferProcessing(true);
        setTransferError(null);
        try {
            const response = await axios.post(
                withBasePath("", `${routeBase}/family/transfer-responsable`),
                { new_responsable_id: selectedMembre.id },
            );
            setTransferDone(response.data?.message || "Transfert effectué avec succès.");
            setShowTransferConfirm(false);
            // Le rôle de l'utilisateur connecté vient de changer (il n'est plus
            // responsable) : rechargement complet plutôt qu'une navigation Inertia,
            // pour repartir sur un état d'authentification/menus totalement neuf.
            window.setTimeout(() => {
                window.location.href = withBasePath("", "/dashboard");
            }, 1800);
        } catch (error) {
            setTransferError(
                error?.response?.data?.message || "Impossible d'effectuer le transfert.",
            );
        } finally {
            setTransferProcessing(false);
        }
    };

    const Field = ({ label, icon: Icon, error, disabled, children }) => (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
                {disabled && <Lock className="w-3 h-3 text-gray-300 ml-1" />}
            </label>
            {children}
            {error && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                    <X size={11} /> {error}
                </p>
            )}
        </div>
    );

    const inputBase = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none";
    const inputActive = `${inputBase} bg-white border-gray-200 text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm`;
    const inputDisabled = `${inputBase} bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed`;

    return (
        <div
            className="min-h-screen py-10 px-4 sm:px-6 lg:px-8"
            style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}
        >
            <div className="max-w-3xl mx-auto">

                {/* Top nav */}
                <div className="flex items-center justify-between mb-6">
                    <Link
                        href={withBasePath("", `${routeBase}/inscriptions`)}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </Link>
                    <span className="text-white/60 text-xs">
                        Modifié le {formatDateTime(family.updated_at)}
                    </span>
                </div>

                {/* Family banner */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 mb-6 flex items-center gap-5 border border-white/20">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Home className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-0.5">Famille</p>
                        <h1 className="text-2xl font-extrabold text-white truncate">{family.nom}</h1>
                        <p className="text-white/70 text-xs mt-0.5">Inscrite le {formatDateTime(family.created_at)}</p>
                    </div>
                    {family.code_famille && (
                        <div className="shrink-0 text-right">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Code</p>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white font-bold text-sm border border-white/30">
                                <Hash className="w-3.5 h-3.5" />
                                {family.code_famille}
                            </span>
                        </div>
                    )}
                </div>

                {/* Form card */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* Section 1 — Informations générales */}
                    <div className="px-8 pt-8 pb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 rounded-full bg-indigo-500"></div>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="text-base font-bold text-gray-800 tracking-tight">Informations générales</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Nom de la famille" icon={Home} error={errors.nom}>
                                <input
                                    type="text"
                                    value={data.nom}
                                    onChange={(e) => setData("nom", e.target.value)}
                                    className={inputActive}
                                    placeholder="Nom de la famille"
                                />
                            </Field>
                            <Field label="Email" icon={Mail} disabled error={errors.email}>
                                <input
                                    type="email"
                                    value={data.email}
                                    disabled
                                    className={inputDisabled}
                                />
                            </Field>
                            <Field label="Téléphone principal" icon={Phone} error={errors.telephone}>
                                <input
                                    type="tel"
                                    value={data.telephone}
                                    onChange={(e) => setData("telephone", e.target.value)}
                                    className={inputActive}
                                    placeholder="Ex: 0102030405"
                                />
                            </Field>
                            <Field label="Téléphone secondaire" icon={Phone} error={errors.telephone2}>
                                <input
                                    type="tel"
                                    value={data.telephone2}
                                    onChange={(e) => setData("telephone2", e.target.value)}
                                    className={inputActive}
                                    placeholder="Optionnel"
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-8" />

                    {/* Section 2 — Adresse */}
                    <div className="px-8 py-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 rounded-full bg-emerald-500"></div>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h2 className="text-base font-bold text-gray-800 tracking-tight">Adresse & localisation</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <Field label="Adresse complète" error={errors.adresse}>
                                    <textarea
                                        value={data.adresse}
                                        onChange={(e) => setData("adresse", e.target.value)}
                                        rows={3}
                                        className={`${inputActive} resize-none`}
                                        placeholder="Rue, numéro, quartier..."
                                    />
                                </Field>
                            </div>
                            <Field label="Quartier" error={errors.quartier}>
                                <input
                                    type="text"
                                    value={data.quartier}
                                    onChange={(e) => setData("quartier", e.target.value)}
                                    className={inputActive}
                                    placeholder="Quartier"
                                />
                            </Field>
                            <Field label="Ville" icon={MapPin} error={errors.ville_id}>
                                <select
                                    value={data.ville_id}
                                    onChange={(e) => setData("ville_id", e.target.value)}
                                    className={`${inputActive} appearance-none cursor-pointer`}
                                >
                                    <option value="">— Sélectionner —</option>
                                    {villes.map((v) => (
                                        <option key={v.id} value={v.id}>{v.nom}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-8" />

                    {/* Section 3 — Église */}
                    <div className="px-8 py-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 rounded-full bg-purple-500"></div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <h2 className="text-base font-bold text-gray-800 tracking-tight">Informations église</h2>
                        </div>
                        <div className="max-w-sm">
                            <Field label="Classe Méthodiste" disabled error={errors.classe_id}>
                                <select
                                    value={data.classe_id}
                                    disabled
                                    className={`${inputDisabled} appearance-none`}
                                >
                                    <option value="">— Aucune —</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nom}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            La classe ne peut être modifiée que par un administrateur.
                        </p>
                    </div>

                    {membres.length > 0 && (
                        <>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-8" />

                            {/* Section 4 — Transfert de responsabilité (zone sensible) */}
                            <div className="px-8 py-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-6 rounded-full bg-amber-500"></div>
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-800 tracking-tight">
                                        Transférer la responsabilité de la famille
                                    </h2>
                                </div>

                                <p className="text-sm text-gray-500 mb-4">
                                    Vous pouvez céder votre rôle de responsable à un autre membre majeur de
                                    votre famille. Vous deviendrez alors un membre ordinaire et perdrez
                                    l'accès à la gestion de la famille — cette action est immédiate.
                                </p>

                                {transferLocked && (
                                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        Aucun transfert n'est possible tant que votre famille est en cours de
                                        transfert de classe ou archivée.
                                    </div>
                                )}

                                {!transferLocked && transferDone && (
                                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>
                                            {transferDone} Redirection en cours…
                                        </span>
                                    </div>
                                )}

                                {!transferLocked && !transferDone && (
                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                        <div className="flex-1">
                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                Nouveau responsable
                                            </label>
                                            <select
                                                value={selectedResponsableId}
                                                onChange={(e) => setSelectedResponsableId(e.target.value)}
                                                className={`${inputActive} appearance-none cursor-pointer`}
                                            >
                                                <option value="">— Sélectionner un membre —</option>
                                                {membres.map((m) => (
                                                    <option key={m.id} value={m.id} disabled={!m.eligible}>
                                                        {m.prenom} {m.nom}
                                                        {m.eligible
                                                            ? ` (${m.age} ans)`
                                                            : m.age !== null
                                                                ? ` (${m.age} ans — mineur, non éligible)`
                                                                : " (date de naissance manquante, non éligible)"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openTransferConfirm}
                                            disabled={!selectedMembre}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                            Transférer
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 60%, #B6C01A 100%)" }}
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>

            {showTransferConfirm && selectedMembre && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2.5 bg-amber-50 rounded-xl shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Confirmer le transfert de responsabilité
                                </h3>
                                <p className="mt-1.5 text-sm text-gray-500">
                                    <strong>{selectedMembre.prenom} {selectedMembre.nom}</strong> deviendra
                                    responsable de la famille <strong>{family.nom}</strong> et aura accès
                                    complet à sa gestion. Vous deviendrez un membre ordinaire et perdrez
                                    immédiatement cet accès. Cette action ne peut pas être annulée par
                                    vous-même ensuite.
                                </p>
                            </div>
                        </div>

                        {transferError && (
                            <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                <X size={13} /> {transferError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTransferConfirm(false)}
                                disabled={transferProcessing}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={confirmTransfer}
                                disabled={transferProcessing}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {transferProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmer le transfert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



