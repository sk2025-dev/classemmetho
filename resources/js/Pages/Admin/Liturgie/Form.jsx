import React from "react";
import { Link } from "@inertiajs/react";
import MariageForm from "../../Liturgie/forms/MariageForm";
import BaptemeForm from "../../Liturgie/forms/BaptemeForm";
import CommunionForm from "../../Liturgie/forms/CommunionForm";
import NaissanceForm from "../../Liturgie/forms/NaissanceForm";
import DecesForm from "../../Liturgie/forms/DecesForm";
import ConfirmationForm from "../../Liturgie/forms/ConfirmationForm";

export default function Form({ actes = [], familyMembers = [], classes = [], initialType = null }) {
    const commonProps = {
        backHref: "/admin/liturgie/nouvelle",
        submitUrl: "/admin/liturgie",
        actes,
        familyMembers,
        classes,
        canSelectMember: true,
    };

    if (initialType === "mariage") return <MariageForm {...commonProps} />;
    if (initialType === "bapteme") return <BaptemeForm {...commonProps} />;
    if (initialType === "premiere_communion") return <CommunionForm {...commonProps} />;
    if (initialType === "confirmation") return <ConfirmationForm {...commonProps} />;
    if (initialType === "naissance") return <NaissanceForm {...commonProps} />;
    if (initialType === "deces") return <DecesForm {...commonProps} />;

    return (
        <div
            className="min-h-screen py-10 px-4"
            style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}
        >
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Type d'acte non defini</h1>
                <p className="text-gray-600 mb-6">Selectionnez d'abord un type de demande liturgique.</p>
                <Link
                    href="/admin/liturgie/nouvelle"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Aller a la selection
                </Link>
            </div>
        </div>
    );
}