import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { withBasePath } from "../../../Utils/urlHelper";

export default function AdminPrieresIndex() {
    return (
        <>
            <Head title="Prieres - Admin" />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center gap-3 text-white">
                        <Link
                            href={withBasePath("", "/admin/dashboard")}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Prieres
                            </h1>
                            <p className="text-sm text-blue-100">
                                Module minimal pret a etre enrichi.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Espace prieres
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            Cette page sert de base pour le module prieres cote
                            admin.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
