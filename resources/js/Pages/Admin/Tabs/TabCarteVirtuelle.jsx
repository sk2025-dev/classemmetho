import React from "react";
import { useForm } from "@inertiajs/react";
import { CreditCard, FileSignature, ShieldCheck } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function TabCarteVirtuelle({
    theme,
    pasteurPrincipalNom = "",
    consentementActif = false,
    consentementTexte = "",
    onSuccess,
}) {
    const { data, setData, post, processing, errors } = useForm({
        carte_virtuelle_theme_texte: theme || "",
    });

    const pasteurForm = useForm({
        pasteur_principal_nom: pasteurPrincipalNom || "",
    });

    const consentForm = useForm({
        consentement_actif: !!consentementActif,
        consentement_texte: consentementTexte || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(withBasePath("", "/admin/parametres/carte-theme"), {
            preserveScroll: true,
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess("Thème de la carte virtuelle mis à jour avec succès !");
                }
            },
        });
    };

    const handleSubmitPasteur = (e) => {
        e.preventDefault();
        pasteurForm.post(withBasePath("", "/admin/parametres/pasteur-principal"), {
            preserveScroll: true,
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess("Nom du Pasteur Principal mis à jour !");
                }
            },
        });
    };

    const handleSubmitConsentement = (e) => {
        e.preventDefault();
        consentForm.post(withBasePath("", "/admin/parametres/consentement"), {
            preserveScroll: true,
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess("Paramètres de consentement mis à jour !");
                }
            },
        });
    };

    return (
        <div className="max-w-2xl mx-auto w-full py-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                        <FileSignature className="w-5 h-5" />
                    </span>
                    <h2 className="text-lg font-bold text-gray-800">
                        Pasteur Principal
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Nom utilisé comme destinataire et référence sur les fiches
                        d'actes liturgiques (lettre au pasteur, nécrologie de l'annonce
                        de décès…). Ex.&nbsp;: <em>Jacob Essoh AKPA</em>.
                    </p>
                    <form onSubmit={handleSubmitPasteur} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nom du Pasteur Principal
                            </label>
                            <input
                                type="text"
                                value={pasteurForm.data.pasteur_principal_nom}
                                onChange={(e) =>
                                    pasteurForm.setData(
                                        "pasteur_principal_nom",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Ex : Jacob Essoh AKPA"
                            />
                            {pasteurForm.errors.pasteur_principal_nom && (
                                <p className="text-red-600 text-xs mt-1">
                                    {pasteurForm.errors.pasteur_principal_nom}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={pasteurForm.processing}
                            className={`inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition ${pasteurForm.processing ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                            {pasteurForm.processing ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <CreditCard className="w-5 h-5" />
                    </span>
                    <h2 className="text-lg font-bold text-gray-800">
                        Paramètres de la carte virtuelle
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Ce texte (thème / verset) s'affiche en pied de la
                        carte virtuelle de tous les membres, quelle que soit
                        leur classe.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Thème de la carte virtuelle
                            </label>
                            <textarea
                                rows="3"
                                value={data.carte_virtuelle_theme_texte}
                                onChange={(e) =>
                                    setData(
                                        "carte_virtuelle_theme_texte",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                placeholder="Ex : « Qui enverrai-je, et qui marchera pour nous ? Me voici, envoie-moi » – Ésaïe 6:8"
                            />
                            {errors.carte_virtuelle_theme_texte && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.carte_virtuelle_theme_texte}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition ${processing ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                            {processing ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <span className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                        <ShieldCheck className="w-5 h-5" />
                    </span>
                    <h2 className="text-lg font-bold text-gray-800">
                        Consentement aux données personnelles
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Quand c'est <strong>activé</strong>, chaque famille doit
                        valider les conditions ci-dessous (une seule validation
                        par le responsable de famille suffit pour tout le
                        foyer) avant de pouvoir utiliser la plateforme — sinon
                        l'accès reste bloqué. <strong>Désactivé</strong>,
                        tout redevient accessible sans restriction, comme
                        aujourd'hui.
                    </p>
                    <form onSubmit={handleSubmitConsentement} className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={consentForm.data.consentement_actif}
                                onChange={(e) =>
                                    consentForm.setData(
                                        "consentement_actif",
                                        e.target.checked,
                                    )
                                }
                                className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                            />
                            <span className="text-sm font-semibold text-gray-800">
                                Exiger la validation des conditions d'utilisation
                                des données personnelles
                            </span>
                        </label>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Texte des conditions
                            </label>
                            <textarea
                                rows="6"
                                value={consentForm.data.consentement_texte}
                                onChange={(e) =>
                                    consentForm.setData(
                                        "consentement_texte",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-sm"
                                placeholder="Texte affiché aux familles lors de la validation…"
                            />
                            {consentForm.errors.consentement_texte && (
                                <p className="text-red-600 text-xs mt-1">
                                    {consentForm.errors.consentement_texte}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={consentForm.processing}
                            className={`inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-rose-600 hover:bg-rose-700 transition ${consentForm.processing ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                            {consentForm.processing ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
