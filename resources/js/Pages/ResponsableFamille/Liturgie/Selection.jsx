import React from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft, ChevronRight } from "lucide-react";

const ACTE_OPTIONS = [
    {
        key: "bapteme",
        title: "Bapteme",
        badge: "Sacrement",
        description: "Demande de bapteme pour enfant ou adulte.",
        tone: "blue",
    },
    {
        key: "mariage",
        title: "Mariage",
        badge: "Union",
        description: "Demande pour mariage religieux ou celebration.",
        tone: "rose",
    },
    {
        key: "naissance",
        title: "Declaration de Naissance",
        badge: "Declaration",
        description: "Declaration de naissance avec informations parentales.",
        tone: "green",
    },
    {
        key: "deces",
        title: "Declaration de Deces",
        badge: "Declaration",
        description: "Declaration de deces pour accompagnement de l'eglise.",
        tone: "slate",
    },
];

export default function Selection({
    basePath = "/responsable-famille/liturgie",
}) {
    return (
        <div
            className="min-h-screen py-10 px-4"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <div className="max-w-6xl mx-auto">
                <Link
                    href={basePath}
                    className="inline-flex items-center gap-2 text-white hover:text-yellow-300 font-semibold transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    Retour
                </Link>

                <div className="text-center mb-8">
                    <p className="inline-flex items-center px-4 py-1 rounded-full bg-white/20 text-white text-xs font-semibold tracking-wider uppercase mb-3">
                        Actes Liturgiques
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Choisir le type de demande
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                        Selectionnez un acte. Vous serez ensuite redirige vers
                        le formulaire correspondant.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {ACTE_OPTIONS.map((option) => (
                        <Link
                            key={option.key}
                            href={`${basePath}/nouvelle/formulaire?type_acte=${option.key}`}
                            className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all"
                        >
                            <div className={`h-1.5 ${toneBar(option.tone)}`} />
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${toneBadge(option.tone)}`}
                                    >
                                        {option.badge}
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {option.title}
                                </h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    {option.description}
                                </p>

                                <div className="inline-flex items-center justify-between w-full text-sm font-semibold text-slate-500">
                                    Cliquer pour ouvrir
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-6 bg-white/95 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-700">
                        Le dossier suit ce circuit: <strong>Conducteur</strong>{" "}
                        puis <strong>Pasteur</strong>. Vous serez notifie a
                        chaque etape.
                    </p>
                </div>
            </div>
        </div>
    );
}

function toneBar(tone) {
    const map = {
        blue: "bg-blue-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        green: "bg-green-500",
        slate: "bg-slate-500",
    };
    return map[tone] || "bg-blue-500";
}

function toneBadge(tone) {
    const map = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        green: "bg-green-50 text-green-700 border-green-200",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return map[tone] || "bg-blue-50 text-blue-700 border-blue-200";
}

function toneCta(tone) {
    const map = {
        blue: "border-blue-200 text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white",
        rose: "border-rose-200 text-rose-700 bg-rose-50 group-hover:bg-rose-600 group-hover:text-white",
        amber: "border-amber-200 text-amber-700 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white",
        green: "border-green-200 text-green-700 bg-green-50 group-hover:bg-green-600 group-hover:text-white",
        slate: "border-slate-200 text-slate-700 bg-slate-50 group-hover:bg-slate-600 group-hover:text-white",
    };
    return (
        map[tone] ||
        "border-blue-200 text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white"
    );
}
