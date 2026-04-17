import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { AlertCircle } from "lucide-react";
import { withBasePath } from "@/Utils/urlHelper";

export default function PaymentFailed() {
    const { app, transaction } = usePage().props;
    const basePath = app?.basePath || "";

    return (
        <>
            <Head title="Paiement annulé" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-900 via-slate-900 to-orange-900 px-4">
                <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
                    <AlertCircle className="mx-auto mb-4" size={52} />
                    <h1 className="text-3xl font-black">Paiement annulé</h1>
                    <p className="mt-3 text-slate-200">
                        Le paiement n'a pas pu être finalisé. Vous pouvez
                        réessayer.
                    </p>
                    {transaction && (
                        <p className="mt-3 text-xs text-slate-300">
                            Transaction: {transaction}
                        </p>
                    )}

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={withBasePath(basePath, "/paiement")}
                            className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-white"
                        >
                            Réessayer
                        </Link>
                        <Link
                            href={withBasePath(basePath, "/")}
                            className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white"
                        >
                            Retour accueil
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
