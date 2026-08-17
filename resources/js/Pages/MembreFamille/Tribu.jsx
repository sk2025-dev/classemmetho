import React from "react";
import { Link, Head } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";
import { X, Users, Crown } from "lucide-react";

export default function Tribu({ tribu, isTribuChef = false, finances = [] }) {
    return (
        <>
            <Head title="Ma Tribu" />

            <div
                className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 font-sans"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full max-w-4xl mx-auto py-8">
                    <div className="flex items-center gap-4 text-white mb-8">
                        <Link
                            href={withBasePath("", "/membre-famille/dashboard")}
                            className="hover:text-blue-200 transition p-2 bg-white/10 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Ma Tribu
                        </h1>
                    </div>

                    {!tribu ? (
                        <div className="bg-white/90 rounded-2xl p-10 text-center text-gray-500">
                            Vous n'êtes pas encore affecté à une tribu. Rapprochez-vous
                            de votre conducteur de classe.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                        {tribu.nom}
                                    </h2>
                                    {isTribuChef && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                                            <Crown className="w-3.5 h-3.5" /> Chef de
                                            tribu
                                        </span>
                                    )}
                                </div>
                                {tribu.description && (
                                    <p className="text-sm text-gray-500 mb-3">
                                        {tribu.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    Chef :{" "}
                                    {tribu.chef
                                        ? tribu.chef.nom
                                        : "Aucun chef nommé pour le moment"}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">
                                    Membres de la tribu ({tribu.membres.length})
                                </h3>
                                <ul className="divide-y divide-gray-100">
                                    {tribu.membres.map((m) => (
                                        <li
                                            key={m.id}
                                            className="py-2 flex items-center gap-2 text-sm text-gray-700"
                                        >
                                            {m.nom}
                                            {tribu.chef?.id === m.id && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide shrink-0">
                                                    <Crown className="w-3 h-3" />
                                                    Chef
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {isTribuChef && (
                                <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-yellow-400/60">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">
                                        Suivi des cotisations de la tribu
                                    </h3>
                                    {finances.length === 0 ? (
                                        <p className="text-sm text-gray-400">
                                            Aucune donnée financière disponible.
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Membre
                                                        </th>
                                                        <th className="text-left px-4 py-2 font-semibold text-gray-600">
                                                            Famille
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Cotisation
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Payé
                                                        </th>
                                                        <th className="text-right px-4 py-2 font-semibold text-gray-600">
                                                            Dû
                                                        </th>
                                                        <th className="text-center px-4 py-2 font-semibold text-gray-600">
                                                            Statut
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {finances.map((m) => (
                                                        <tr key={m.id}>
                                                            <td className="px-4 py-2 font-medium text-gray-800">
                                                                {m.nom}
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500">
                                                                {m.famille}
                                                            </td>
                                                            <td className="px-4 py-2 text-right text-gray-700">
                                                                {m.cotisation.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-right text-green-700">
                                                                {m.totalPaye.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-right text-red-600">
                                                                {m.totalDu.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                        m.statut ===
                                                                        "A JOUR"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-amber-100 text-amber-700"
                                                                    }`}
                                                                >
                                                                    {m.statut}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
