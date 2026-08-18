import React from "react";
import { Link, useForm, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import { ArrowLeft, Users } from "lucide-react";

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

export default function TribuCreer({ classeNom }) {
    const { data, setData, post, processing, errors } = useForm({
        nom: "",
        description: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(withBasePath("", "/conducteur/tribus"));
    };

    return (
        <>
            <Head title="Créer une tribu" />
            <style>{FORM_STYLES}</style>

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-16 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-xl mx-auto py-8">
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", "/conducteur/tribus")}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Créer une tribu
                            </h1>
                            <p className="text-blue-100 opacity-90">
                                Classe :{" "}
                                <span className="font-semibold text-yellow-300">
                                    {classeNom}
                                </span>
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl shadow-xl p-6 space-y-5"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Nom de la tribu{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nom}
                                onChange={(e) => setData("nom", e.target.value)}
                                className={`input-control ${errors.nom ? "border-red-500" : ""}`}
                                placeholder="Ex: Tribu de Juda"
                                autoFocus
                            />
                            {errors.nom && (
                                <p className="text-red-600 text-xs mt-1">
                                    {errors.nom}
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                rows="4"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                className="input-control resize-none"
                                placeholder="Décrivez cette tribu..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Link
                                href={withBasePath("", "/conducteur/tribus")}
                                className="btn btn-secondary"
                            >
                                Annuler
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn btn-primary"
                            >
                                Créer la tribu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
