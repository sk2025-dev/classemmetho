import React, { useState, useRef } from "react";
import { X, Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import axios from "axios";

export default function ExcelImportForm({ onClose }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Vérifier que c'est un fichier Excel
            const validTypes = [
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];
            if (validTypes.includes(selectedFile.type)) {
                setFile(selectedFile);
                setError(null);
            } else {
                setError(
                    "Veuillez sélectionner un fichier Excel valide (.xls ou .xlsx)"
                );
                setFile(null);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const validTypes = [
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];
            if (validTypes.includes(droppedFile.type)) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError(
                    "Veuillez sélectionner un fichier Excel valide (.xls ou .xlsx)"
                );
                setFile(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError("Veuillez sélectionner un fichier Excel");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(
                "/admin/inscriptions/import-excel",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100
                        );
                        setUploadProgress(progress);
                    },
                }
            );

            if (response.data.success) {
                setSuccess(
                    `Import réussi! ${response.data.imported} enregistrements importés.`
                );
                setFile(null);
                setUploadProgress(0);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Fermer le formulaire après 3 secondes
                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setError(
                    response.data.message ||
                        "Une erreur est survenue lors de l'import"
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Une erreur est survenue lors du traitement du fichier"
            );
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-2xl mx-auto w-full">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative">
                    {/* Bouton Fermer */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Titre */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                            Importer un fichier Excel
                        </h1>
                        <p className="text-slate-600 font-medium">
                            Importez les données depuis un fichier Excel pour enregistrer
                            plusieurs personnes à la fois
                        </p>
                    </div>

                    {/* Infos sur le format */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                        <h3 className="text-blue-900 font-semibold mb-2">
                            Format attendu du fichier Excel:
                        </h3>
                        <ul className="text-blue-800 text-sm space-y-1">
                            <li>• Colonnes users: name, email, password, etc.</li>
                            <li>• Colonnes user_sacrements: baptise, marie_religieusement, etc.</li>
                            <li>• Colonnes families: nom, adresse, quartier, telephone, etc.</li>
                        </ul>
                    </div>

                    {/* Zone de dépôt */}
                    <form onSubmit={handleSubmit}>
                        <div
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {!file ? (
                                <div>
                                    <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                                    <p className="text-slate-700 font-semibold mb-2">
                                        Déposez votre fichier Excel ici
                                    </p>
                                    <p className="text-slate-500">
                                        ou cliquez pour parcourir (.xls, .xlsx)
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                                    <p className="text-slate-700 font-semibold">
                                        {file.name}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        Cliquez pour changer le fichier
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Messages d'erreur */}
                        {error && (
                            <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                                <div>
                                    <h4 className="font-semibold text-red-900">Erreur</h4>
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Messages de succès */}
                        {success && (
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                                <div>
                                    <h4 className="font-semibold text-green-900">Succès</h4>
                                    <p className="text-green-800 text-sm">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Barre de progression */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Loader className="text-blue-600 animate-spin" size={20} />
                                    <span className="text-slate-700 font-medium">
                                        Upload en cours: {uploadProgress}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex gap-4 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={!file || loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Importer
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
