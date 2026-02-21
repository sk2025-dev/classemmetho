import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Save,
    X,
    User,
    MapPin,
    Building2,
    Phone,
    Mail,
} from "lucide-react"; // Ajout d'icônes pour le design

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

    return (
        <div
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-4xl mx-auto">
                {/* En-tête de la page */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            href={`${routeBase}/inscriptions`}
                            className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full transition-all text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour
                        </Link>
                    </div>
                    <div className="text-center md:text-right">
                        <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">
                            Modifier la Famille
                        </h1>
                        <p className="text-white/80 font-medium mt-1">
                            {family.nom}
                        </p>
                        <p className="text-white/70 text-xs mt-2">
                            Inscrite le: {formatDateTime(family.created_at)} | Modifiée le: {formatDateTime(family.updated_at)}
                        </p>
                    </div>
                </div>

                {/* Conteneur du Formulaire */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20"
                >
                    <div className="p-8 md:p-10 space-y-10">
                        {/* Section 1: Informations Générales */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Informations Générales
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Nom de la Famille
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nom}
                                        onChange={(e) =>
                                            setData("nom", e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                    {errors.nom && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.nom}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={data.email}
                                            disabled
                                            className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl opacity-60 cursor-not-allowed text-gray-500 transition-all"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Téléphone Principal
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            value={data.telephone}
                                            onChange={(e) =>
                                                setData(
                                                    "telephone",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    {errors.telephone && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.telephone}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Téléphone Secondaire
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            value={data.telephone2}
                                            onChange={(e) =>
                                                setData(
                                                    "telephone2",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    {errors.telephone2 && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.telephone2}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Adresse */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Adresse & Quartier
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Adresse Complète
                                    </label>
                                    <textarea
                                        value={data.adresse}
                                        onChange={(e) =>
                                            setData("adresse", e.target.value)
                                        }
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                                    />
                                    {errors.adresse && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.adresse}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Quartier
                                    </label>
                                    <input
                                        type="text"
                                        value={data.quartier}
                                        onChange={(e) =>
                                            setData("quartier", e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                    {errors.quartier && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.quartier}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Ville
                                    </label>
                                    <select
                                        value={data.ville_id}
                                        onChange={(e) =>
                                            setData("ville_id", e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            Sélectionnez une ville
                                        </option>
                                        {villes.map((ville) => (
                                            <option
                                                key={ville.id}
                                                value={ville.id}
                                            >
                                                {ville.nom}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ville_id && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.ville_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Informations Église */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Informations Église
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Classe Méthodiste
                                    </label>
                                    <select
                                        value={data.classe_id}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl opacity-60 cursor-not-allowed text-gray-500 transition-all appearance-none"
                                    >
                                        <option value="">
                                            Sélectionnez une classe
                                        </option>
                                        {classes.map((classe) => (
                                            <option
                                                key={classe.id}
                                                value={classe.id}
                                            >
                                                {classe.nom}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.classe_id && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <X size={12} /> {errors.classe_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full sm:w-auto order-2 sm:order-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



