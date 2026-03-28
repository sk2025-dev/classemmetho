import { Head, Link } from "@inertiajs/react";

export default function PasteurSondageIndex() {
    return (
        <>
            <Head title="Sondages - Pasteur" />

            <div className="min-h-screen bg-slate-50 px-6 py-10">
                <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">
                        Pasteur
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Sondages</h1>
                    <p className="mt-3 text-base text-slate-600">
                        Cette page Sondage est prete. Vous pouvez maintenant y ajouter la logique metier.
                    </p>

                    <div className="mt-8">
                        <Link
                            href="/pasteur/dashboard"
                            className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Retour au dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
