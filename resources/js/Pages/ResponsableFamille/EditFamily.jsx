import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Link, router } from "@inertiajs/react";
import { ArrowLeft, Save, X } from "lucide-react";

export default function EditFamily({ family, classes, villes }) {
    const { data, setData, post, processing, errors } = useForm({
        nom: family.nom || "",
        email: family.email || "",
        telephone: family.telephone || "",
        telephone2: family.telephone2 || "",
        adresse: family.adresse || "",
        quartier: family.quartier || "",
        classe_id: family.classe_id || "",
        ville_id: family.ville_id || "",
        contact_urgence: family.contact_urgence || "",
        contact_urgence_tel: family.contact_urgence_tel || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/responsable-famille/family/update");
    };

    const handleCancel = () => {
        router.get("/responsable-famille/inscriptions");
    };

    return (
        <div className="min-h-screen" style={{
            background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
        }}>
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/responsable-famille/inscriptions"
                        className="inline-flex items-center gap-2 text-white hover:text-yellow-300 transition-colors mb-4 font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Retour à la Liste des Membres
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Modifier les Informations de la Famille
                    </h1>
                    <p className="text-yellow-100 text-lg">
                        {family.nom}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section Nom et Contacts */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-600">
                                Informations Générales
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nom */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nom de la Famille
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nom}
                                        onChange={(e) => setData("nom", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="Entrez le nom de la famille"
                                    />
                                    {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="exemple@email.com"
                                    />
                                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                                </div>

                                {/* Téléphone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Téléphone Principal
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.telephone}
                                        onChange={(e) => setData("telephone", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                    {errors.telephone && <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>}
                                </div>

                                {/* Téléphone 2 */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Téléphone Secondaire
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.telephone2}
                                        onChange={(e) => setData("telephone2", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="+33 6 98 76 54 32"
                                    />
                                    {errors.telephone2 && <p className="text-red-600 text-sm mt-1">{errors.telephone2}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section Adresse */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-green-600">
                                Adresse
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Adresse */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Adresse
                                    </label>
                                    <textarea
                                        value={data.adresse}
                                        onChange={(e) => setData("adresse", e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="Entrez l'adresse complète"
                                    />
                                    {errors.adresse && <p className="text-red-600 text-sm mt-1">{errors.adresse}</p>}
                                </div>

                                {/* Quartier */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Quartier
                                    </label>
                                    <input
                                        type="text"
                                        value={data.quartier}
                                        onChange={(e) => setData("quartier", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="Entrez le quartier"
                                    />
                                    {errors.quartier && <p className="text-red-600 text-sm mt-1">{errors.quartier}</p>}
                                </div>

                                {/* Ville */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ville
                                    </label>
                                    <select
                                        value={data.ville_id}
                                        onChange={(e) => setData("ville_id", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    >
                                        <option value="">Sélectionnez une ville</option>
                                        {villes.map((ville) => (
                                            <option key={ville.id} value={ville.id}>
                                                {ville.nom}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ville_id && <p className="text-red-600 text-sm mt-1">{errors.ville_id}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section Classe et Autres */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-purple-600">
                                Informations Église
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Classe */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Classe Méthodiste
                                    </label>
                                    <select
                                        value={data.classe_id}
                                        onChange={(e) => setData("classe_id", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    >
                                        <option value="">Sélectionnez une classe</option>
                                        {classes.map((classe) => (
                                            <option key={classe.id} value={classe.id}>
                                                {classe.nom}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.classe_id && <p className="text-red-600 text-sm mt-1">{errors.classe_id}</p>}
                                </div>

                                {/* Contact d'Urgence */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Contact d'Urgence
                                    </label>
                                    <input
                                        type="text"
                                        value={data.contact_urgence}
                                        onChange={(e) => setData("contact_urgence", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="Nom du contact"
                                    />
                                    {errors.contact_urgence && <p className="text-red-600 text-sm mt-1">{errors.contact_urgence}</p>}
                                </div>

                                {/* Téléphone Contact d'Urgence */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Téléphone du Contact d'Urgence
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.contact_urgence_tel}
                                        onChange={(e) => setData("contact_urgence_tel", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                        placeholder="+33 6 00 00 00 00"
                                    />
                                    {errors.contact_urgence_tel && <p className="text-red-600 text-sm mt-1">{errors.contact_urgence_tel}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {processing ? "Sauvegarde..." : "Sauvegarder"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-8 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <X className="w-5 h-5" />
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
