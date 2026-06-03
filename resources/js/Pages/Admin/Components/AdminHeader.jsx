import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";

const AdminHeader = ({ activeTab, setActiveTab, auth }) => {
    const [profileOpen, setProfileOpen] = useState(false);

    const getRoleLabel = (role) => {
        const labels = {
            admin: "Administrateur",
            pasteur: "Pasteur",
            conducteur: "Conducteur",
            responsable: "Responsable",
            responsable_famille: "Responsable Famille",
            membre_famille: "Membre Famille",
        };
        return labels[role?.toLowerCase()] || "Utilisateur";
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm"></header>
    );
};

export default AdminHeader;
