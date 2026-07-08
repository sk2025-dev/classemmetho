import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft, User, Users, ArrowRight, FileUp } from "lucide-react";
import ExcelImportForm from "./Inscriptions/ExcelImportForm";
import { withBasePath } from "../../Utils/urlHelper";

export default function SelectionTypeInscription() {
    const [showExcelForm, setShowExcelForm] = useState(false);

    const cards = [
        {
            title: "Pasteur",
            desc: "Inscrire un nouveau pasteur",
            href: withBasePath("", "/admin/inscriptions/pasteur/create"),
            colorClass: "text-indigo-600",
            bgIconClass: "bg-indigo-50",
            hoverBorder: "hover:border-indigo-500",
            icon: <User size={40} />,
        },
        {
            title: "Conducteur",
            desc: "Inscrire un nouveau conducteur",
            href: withBasePath("", "/admin/inscriptions/conducteur/create"),
            colorClass: "text-blue-600",
            bgIconClass: "bg-blue-50",
            hoverBorder: "hover:border-blue-500",
            icon: <User size={40} />,
        },
        {
            title: "Responsable de Famille",
            desc: "Inscrire un responsable de famille",
            href: withBasePath("", "/admin/inscriptions/famille/create"),
            colorClass: "text-emerald-600",
            bgIconClass: "bg-emerald-50",
            hoverBorder: "hover:border-emerald-500",
            icon: <Users size={40} />,
        },
        {
            title: "Importer via Excel",
            desc: "Importer plusieurs personnes depuis un fichier Excel",
            action: () => setShowExcelForm(true),
            colorClass: "text-amber-600",
            bgIconClass: "bg-amber-50",
            hoverBorder: "hover:border-amber-500",
            icon: <FileUp size={40} />,
            isAction: true,
        },
    ];

    return (
        <>
            {showExcelForm && (
                <ExcelImportForm onClose={() => setShowExcelForm(false)} />
            )}

            {!showExcelForm && (
                <div
                    className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                    }}
                >
                    <div className="max-w-7xl mx-auto w-full relative z-10">
                        {/* Header */}
                        <div className="mb-8 flex justify-between items-center">
                            <Link
                                href={withBasePath("", "/admin/dashboard")}
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-all duration-300 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/20"
                            >
                                <ArrowLeft size={18} />
                                <span>Retour</span>
                            </Link>
                        </div>

                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-sm tracking-tight">
                                Type d'inscription
                            </h1>
                            <p className="text-white/80 text-lg font-medium">
                                Choisissez le profil que vous souhaitez
                                enregistrer
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                            {cards.map((card, idx) =>
                                card.isAction ? (
                                    <button
                                        key={idx}
                                        onClick={card.action}
                                        className={`
                                            group relative flex flex-col items-center p-10 text-center
                                            bg-white/95 backdrop-blur-xl
                                            rounded-3xl
                                            shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]
                                            border-2 border-transparent
                                            transform transition-all duration-300 ease-out
                                            hover:-translate-y-2
                                            ${card.hoverBorder}
                                            cursor-pointer
                                        `}
                                    >
                                        {/* Zone de l'icône */}
                                        <div
                                            className={`
                                            mb-6 p-5 rounded-full transition-all duration-500 ease-out shadow-sm
                                            group-hover:scale-110 group-hover:rotate-3
                                            ${card.bgIconClass}
                                        `}
                                        >
                                            <div className={card.colorClass}>
                                                {card.icon}
                                            </div>
                                        </div>

                                        {/* Titre avec flèche intégrée */}
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                                                {card.title}
                                            </h2>
                                            {/* La flèche apparaît au survol à côté du titre */}
                                            <ArrowRight
                                                className={`
                                                    w-5 h-5 -translate-x-4 opacity-0 transition-all duration-300
                                                    group-hover:translate-x-0 group-hover:opacity-100
                                                    ${card.colorClass}
                                                `}
                                            />
                                        </div>

                                        {/* Description */}
                                        <p className="text-slate-500 font-medium leading-relaxed">
                                            {card.desc}
                                        </p>

                                        {/* Petit indicateur visuel en bas (optionnel) */}
                                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                ) : (
                                    <Link
                                        key={idx}
                                        href={card.href}
                                        className={`
                                            group relative flex flex-col items-center p-10 text-center
                                            bg-white/95 backdrop-blur-xl
                                            rounded-3xl
                                            shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]
                                            border-2 border-transparent
                                            transform transition-all duration-300 ease-out
                                            hover:-translate-y-2
                                            ${card.hoverBorder}
                                        `}
                                    >
                                        {/* Zone de l'icône */}
                                        <div
                                            className={`
                                            mb-6 p-5 rounded-full transition-all duration-500 ease-out shadow-sm
                                            group-hover:scale-110 group-hover:rotate-3
                                            ${card.bgIconClass}
                                        `}
                                        >
                                            <div className={card.colorClass}>
                                                {card.icon}
                                            </div>
                                        </div>

                                        {/* Titre avec flèche intégrée */}
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                                                {card.title}
                                            </h2>
                                            {/* La flèche apparaît au survol à côté du titre */}
                                            <ArrowRight
                                                className={`
                                                    w-5 h-5 -translate-x-4 opacity-0 transition-all duration-300
                                                    group-hover:translate-x-0 group-hover:opacity-100
                                                    ${card.colorClass}
                                                `}
                                            />
                                        </div>

                                        {/* Description */}
                                        <p className="text-slate-500 font-medium leading-relaxed">
                                            {card.desc}
                                        </p>

                                        {/* Petit indicateur visuel en bas (optionnel) */}
                                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </Link>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
