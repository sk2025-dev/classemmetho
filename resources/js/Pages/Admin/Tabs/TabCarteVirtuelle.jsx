import React from "react";
import { useForm } from "@inertiajs/react";
import { CreditCard } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function TabCarteVirtuelle({ theme, onSuccess }) {
    const { data, setData, post, processing, errors } = useForm({
        carte_virtuelle_theme_texte: theme || "",
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

    return (
        <div className="max-w-2xl mx-auto w-full py-6">
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
        </div>
    );
}
