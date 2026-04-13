import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { CheckCircle2 } from "lucide-react";
import { withBasePath } from "@/Utils/urlHelper";

export default function PaymentSuccess() {
    const { app, transaction } = usePage().props;
    const basePath = app?.basePath || "";

    return (
        <>
            <Head title="Paiement réussi" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-900 px-4">
                <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
                    <CheckCircle2 className="mx-auto mb-4" size={52} />
                    <h1 className="text-3xl font-black">Paiement réussi</h1>
                    <p className="mt-3 text-slate-200">
                        Merci pour votre don. Votre paiement a été confirmé.
                    </p>
                    {transaction && (
                        <p className="mt-3 text-xs text-slate-300">
                            Transaction: {transaction}
                        </p>
                    )}

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={withBasePath(basePath, "/")}
                            className="rounded-xl bg-white px-5 py-3 font-bold text-slate-900"
                        >
                            Retour à l'accueil
                        </Link>
                        <Link
                            href={withBasePath(basePath, "/paiement")}
                            className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white"
                        >
                            Nouveau paiement
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
