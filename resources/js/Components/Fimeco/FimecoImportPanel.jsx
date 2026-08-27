import React, { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle, Loader, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { withBasePath } from "../../Utils/urlHelper";

function UploadBlock({ title, description, endpoint }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [showErrors, setShowErrors] = useState(false);
    const inputRef = useRef(null);

    const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const pickFile = (candidate) => {
        if (!candidate) return;
        if (!validTypes.includes(candidate.type)) {
            setError("Veuillez sélectionner un fichier Excel valide (.xls ou .xlsx)");
            setFile(null);
            return;
        }
        setError(null);
        setResult(null);
        setFile(candidate);
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Veuillez sélectionner un fichier Excel");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(withBasePath("", endpoint), formData, {
                onUploadProgress: (e) => {
                    if (e.total) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                },
            });

            if (response.data.success) {
                setResult(response.data);
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
            } else {
                setError(response.data.message || "Une erreur est survenue lors de l'import");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Une erreur est survenue lors du traitement du fichier",
            );
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const errors = result?.data?.errors || [];

    return (
        <div className="border border-slate-200 rounded-2xl p-5 bg-white">
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <p className="text-slate-500 text-sm mt-1 mb-4">{description}</p>

            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                    className="hidden"
                    id={`fimeco-file-${endpoint}`}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                    {file ? file.name : "Choisir un fichier Excel"}
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader size={16} className="animate-spin" />
                            {progress > 0 ? `${progress}%` : "Import..."}
                        </>
                    ) : (
                        <>
                            <Upload size={16} />
                            Importer
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex gap-2 items-start">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-green-800 text-sm">{result.message}</p>
                    </div>
                    {errors.length > 0 && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setShowErrors((v) => !v)}
                                className="text-xs font-medium text-green-900 flex items-center gap-1 hover:underline"
                            >
                                {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {errors.length} ligne(s) ignorée(s) — voir le détail
                            </button>
                            {showErrors && (
                                <div className="mt-2 max-h-48 overflow-y-auto text-xs border border-green-200 rounded-lg divide-y divide-green-100">
                                    {errors.map((e, idx) => (
                                        <div key={idx} className="p-2 bg-white/60">
                                            <span className="font-medium">Ligne {e.line ?? "-"}</span>
                                            {e.chef_famille_id ? ` · ${e.chef_famille_id}` : ""}
                                            {e.chef_nom ? ` (${e.chef_nom})` : ""}
                                            {e.annee ? ` · ${e.annee}` : ""}
                                            {" — "}
                                            <span className="text-slate-600">{e.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function FimecoImportPanel() {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Import annuel FIMECO</h3>
            <p className="text-slate-500 text-sm mb-4">
                Réservé au Responsable FIMECO — importez chaque année les fichiers de souscription et de
                versements. Un fichier déjà importé peut être ré-uploadé sans créer de doublons.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
                <UploadBlock
                    title="Souscriptions annuelles"
                    description='Fichier "Etat souscription par famille" — montant souscrit par famille et par année.'
                    endpoint="/fimeco/import/souscriptions"
                />
                <UploadBlock
                    title="Versements annuels"
                    description='Fichier "Etat des versements annuels par famille" — historique des versements réels.'
                    endpoint="/fimeco/import/versements"
                />
            </div>
        </div>
    );
}
