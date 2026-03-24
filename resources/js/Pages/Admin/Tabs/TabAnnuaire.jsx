import React from "react";
import { Link } from "@inertiajs/react";
import {
    EyeIcon,
    PencilIcon,
    UserGroupIcon,
    PhoneIcon,
} from "@heroicons/react/24/outline";

const TabAnnuaire = ({
    annuaireData = [],
    stats = {},
    classes = [],
    onViewMember,
    onEditMember,
}) => {
    const formatRole = (role) => {
        const emojis = {
            admin: "👑",
            conducteur: "🟢",
            pasteur: "✝️",
            responsable_famille: "🏠",
            membre_famille: "👤",
        };
        return `${emojis[role] || "👤"} ${role}`;
    };

    return (
        <div className="space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <UserGroupIcon className="w-12 h-12 opacity-75 mr-4" />
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">
                                Total membres
                            </p>
                            <p className="text-3xl font-bold">
                                {stats.total_users || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <svg
                            className="w-12 h-12 opacity-75 mr-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">
                                Actifs
                            </p>
                            <p className="text-3xl font-bold">
                                {stats.active_users || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center">
                        <svg
                            className="w-12 h-12 opacity-75 mr-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4 1h1m-1 4h1m-1-4h1m0-4h1"
                            />
                        </svg>
                        <div>
                            <p className="text-blue-100 text-sm font-medium">
                                Classes
                            </p>
                            <p className="text-3xl font-bold">
                                {stats.classes_count || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau annuaire */}
            <div className="bg-white shadow-xl rounded-3xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Membre
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Contact
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Classe & Rôle
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Famille
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-right">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Statut
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-right">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {annuaireData.map((member) => (
                                <tr
                                    key={member.id}
                                    className="hover:bg-indigo-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <ProfilePhoto
                                                user={member}
                                                size="md"
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {member.full_name}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {member.identifiant}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {member.telephone}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {member.classe}
                                        </div>
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {formatRole(member.role)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {member.family_code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                member.is_active
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {member.is_active
                                                ? "✅ Actif"
                                                : "❌ Inactif"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-lg transition">
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TabAnnuaire;
