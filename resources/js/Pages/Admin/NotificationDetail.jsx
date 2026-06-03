import React from "react";
import { Head, Link } from "@inertiajs/react";
import { withBasePath } from "../../Utils/urlHelper";

export default function NotificationDetail({ notification }) {
    const getChannelIcon = (channel) => {
        switch (channel) {
            case "email":
                return "📧";
            case "sms":
                return "📱";
            default:
                return "📬";
        }
    };

    const getChannelColor = (channel) => {
        switch (channel) {
            case "email":
                return "bg-blue-100 text-blue-800";
            case "sms":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div
            className="min-h-screen p-6"
            style={{
                background:
                    "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
            }}
        >
            <Head title="Détail de la notification" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Link
                    href={withBasePath("", "/admin/notifications")}
                    className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
                >
                    ← Retour à l'historique
                </Link>

                {/* Notification Card */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">
                                {getChannelIcon(notification.channel)}
                            </span>
                            <div>
                                <span
                                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getChannelColor(notification.channel)}`}
                                >
                                    {notification.channel.toUpperCase()}
                                </span>
                                {notification.sent_at && (
                                    <p className="text-green-600 text-sm font-medium mt-2">
                                        ✓ Envoyé avec succès
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right text-gray-500">
                            <p className="text-sm">
                                {new Date(
                                    notification.created_at,
                                ).toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                            <p className="text-sm">
                                {new Date(
                                    notification.created_at,
                                ).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Notification Details */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">
                                Destinataire
                            </h3>
                            <p className="text-lg text-gray-900 mt-1">
                                {notification.to}
                            </p>
                        </div>
                        {notification.user && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">
                                    Utilisateur
                                </h3>
                                <p className="text-lg text-gray-900 mt-1">
                                    {notification.user.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {notification.user.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Objet
                        </h3>
                        <p className="text-lg text-gray-900">
                            {notification.subject}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Contenu
                        </h3>
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {notification.body}
                            </p>
                        </div>
                    </div>

                    {/* Data JSON (if any) */}
                    {notification.data &&
                        Object.keys(notification.data).length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                    Données additionnelles
                                </h3>
                                <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto">
                                    <pre className="text-sm">
                                        {JSON.stringify(
                                            notification.data,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
