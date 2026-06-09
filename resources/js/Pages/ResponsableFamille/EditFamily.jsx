import React from "react";
import { useForm } from "@inertiajs/react";
import { Link, router } from "@inertiajs/react";
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
} from "lucide-react";

export default function EditFamily({ family, classes, villes, routeBase: routeBaseProp }) {
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
        post(`${routeBase}/family/update`);
    };

    const handleCancel = () => {
        router.get(`${routeBase}/inscriptions`);
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
                        href={`${routeBase}/inscriptions`}
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
        </div>
    );
}



