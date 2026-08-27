import React from "react";
import { Head } from "@inertiajs/react";
import { ArrowLeft, CreditCard } from "lucide-react";
import CarteVirtuelle from "../Components/CarteVirtuelle";

export default function CarteVirtuellePage({ carte, classeActive }) {
    return (
        <>
            <Head title="Ma carte virtuelle" />
            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-16 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #0F3D24 0%, #1B6B3A 55%, #D4AF37 100%)",
                }}
            >
                <div className="w-full max-w-2xl mx-auto py-8">
                    <div className="flex items-center gap-4 text-white mb-8">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                <CreditCard className="w-6 h-6" />
                                Ma carte virtuelle
                            </h1>
                        </div>
                    </div>

                    <div className="bg-white/95 rounded-3xl shadow-xl p-8">
                        {carte ? (
                            <CarteVirtuelle carte={carte} />
                        ) : (
                            <div className="text-center py-10">
                                <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">
                                    {classeActive
                                        ? "Votre carte virtuelle n'a pas pu être générée."
                                        : "La carte virtuelle n'est pas encore activée pour votre classe. Contactez votre conducteur ou l'administration."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
