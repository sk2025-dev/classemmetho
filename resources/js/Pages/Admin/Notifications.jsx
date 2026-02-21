import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Notifications({ notifications }) {
    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'email':
                return '📧';
            case 'sms':
                return '📱';
            default:
                return '📬';
        }
    };

    const getChannelColor = (channel) => {
        switch (channel) {
            case 'email':
                return 'bg-blue-100 text-blue-800';
            case 'sms':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
            <Head title="Historique des notifications" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
                        ← Retour au dashboard
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        📬 Historique des notifications
                    </h1>
                    <p className="text-gray-600">
                        {notifications.total} notification{notifications.total !== 1 ? 's' : ''} envoyée{notifications.total !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* No notifications */}
                {notifications.data.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune notification</h2>
                        <p className="text-gray-600">Les notifications apparaîtront ici quand vous approuverez des inscriptions.</p>
                    </div>
                ) : (
                    /* Notifications List */
                    <div className="space-y-4">
                        {notifications.data.map((notification) => (
                            <Link
                                key={notification.id}
                                href={`/admin/notifications/${notification.id}`}
                                className="block"
                            >
                                <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-indigo-600">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{getChannelIcon(notification.channel)}</span>
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getChannelColor(notification.channel)}`}>
                                                    {notification.channel.toUpperCase()}
                                                </span>
                                                {notification.sent_at && (
                                                    <span className="text-green-600 text-sm font-medium">✓ Envoyé</span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {notification.subject}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                À: {notification.to}
                                            </p>
                                            {notification.user && (
                                                <p className="text-gray-500 text-sm">
                                                    Utilisateur: {notification.user.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-500 text-sm">
                                                {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {notifications.links && notifications.links.length > 0 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {notifications.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-indigo-600 hover:bg-gray-50'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
