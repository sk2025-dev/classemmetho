import { Head, useForm } from '@inertiajs/react';

export default function ChangePassword({ mustChange }) {
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('profile.change-password.update'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)" }}>
            <Head title="Changer le mot de passe" />

            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Modifier votre mot de passe
                </h1>
                {mustChange && (
                    <p className="text-sm text-amber-600 mb-6 bg-amber-50 p-3 rounded">
                        ⚠️ Vous devez modifier votre mot de passe lors de la première connexion.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe actuel
                        </label>
                        <input
                            type="password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.current_password
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.current_password && (
                            <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.password
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                errors.password_confirmation
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.password_confirmation && (
                            <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                            processing
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {processing ? 'Modification en cours...' : 'Modifier le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
}
