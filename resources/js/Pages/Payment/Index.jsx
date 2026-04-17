import React, { useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { ArrowLeft, Wallet, Waves, Smartphone, Coins } from "lucide-react";
import { withBasePath } from "@/Utils/urlHelper";

const METHODS = [
    {
        key: "wave",
        label: "Wave",
        icon: Waves,
        description: "Paiement mobile rapide via Wave",
    },
    {
        key: "orange_money",
        label: "Orange Money",
        icon: Smartphone,
        description: "Paiement sécurisé via Orange Money",
    },
    {
        key: "espece",
        label: "Espèce",
        icon: Coins,
        description: "Déclaration d\'un paiement en espèce",
    },
];

export default function PaymentIndex() {
    const { app } = usePage().props;
    const basePath = app?.basePath || "";

    const [form, setForm] = useState({
        payer_name: "",
        payer_phone: "",
        amount: "5000",
        payment_method: "wave",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const amountFormatted = useMemo(() => {
        const amount = Number(form.amount || 0);
        return new Intl.NumberFormat("fr-FR").format(amount);
    }, [form.amount]);

    const apiUrl = withBasePath(basePath, "/api/payment");

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        const amount = Number(form.amount || 0);
        if (!form.payer_name.trim()) {
            setError("Le nom du payeur est requis.");
            return;
        }
        if (!/^\d{8,15}$/.test(form.payer_phone.trim())) {
            setError("Le numéro doit contenir entre 8 et 15 chiffres.");
            return;
        }
        if (Number.isNaN(amount) || amount < 100) {
            setError("Le montant minimum est de 100 F CFA.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(apiUrl, {
                payer_name: form.payer_name.trim(),
                payer_phone: form.payer_phone.trim(),
                amount,
                payment_method: form.payment_method,
            });

            if (response.data?.payment_url) {
                window.location.href = response.data.payment_url;
                return;
            }

            setError("Aucune URL de paiement reçue.");
        } catch (e) {
            const message =
                e?.response?.data?.message ||
                "Impossible d'initialiser le paiement pour le moment.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Paiement de don" />
            <div
                className="min-h-screen px-4 py-10"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-4xl">
                    <Link
                        href={withBasePath(basePath, "/")}
                        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
                    >
                        <ArrowLeft size={16} /> Retour à l'accueil
                    </Link>

                    <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                        <form
                            onSubmit={submit}
                            className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
                        >
                            <h1 className="mb-2 text-2xl font-black text-white">
                                Paiement de don
                            </h1>
                            <p className="mb-6 text-sm text-slate-200">
                                Renseignez vos informations et finalisez votre
                                don en ligne.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-100">
                                        Nom du payeur
                                    </label>
                                    <input
                                        type="text"
                                        value={form.payer_name}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                payer_name: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-slate-900 outline-none ring-0 focus:border-emerald-500"
                                        placeholder="Ex: KOUASSI Jean"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="payer_phone"
                                        className="mb-1 block text-sm font-semibold text-slate-100"
                                    >
                                        Numéro du payeur
                                    </label>
                                    <input
                                        id="payer_phone"
                                        name="payer_phone"
                                        type="tel"
                                        required
                                        inputMode="numeric"
                                        value={form.payer_phone}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                payer_phone: e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 15),
                                            }))
                                        }
                                        className="mt-1 w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-slate-900 outline-none ring-0 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        placeholder="Ex: 0700000000"
                                    />
                                    <p className="mt-1 text-xs text-white/90">
                                        Entrez un numéro entre 8 et 15 chiffres.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-100">
                                        Montant (F CFA)
                                    </label>
                                    <input
                                        type="number"
                                        min="100"
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                amount: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-slate-900 outline-none ring-0 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-slate-100">
                                        Moyen de paiement
                                    </p>
                                    <div className="grid gap-2">
                                        {METHODS.map((method) => {
                                            const Icon = method.icon;
                                            const active =
                                                form.payment_method ===
                                                method.key;

                                            return (
                                                <button
                                                    type="button"
                                                    key={method.key}
                                                    onClick={() =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            payment_method:
                                                                method.key,
                                                        }))
                                                    }
                                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                                        active
                                                            ? "border-emerald-400 bg-emerald-500/15 text-white"
                                                            : "border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                    <div>
                                                        <div className="text-sm font-bold">
                                                            {method.label}
                                                        </div>
                                                        <div className="text-xs opacity-80">
                                                            {method.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-3 text-sm font-medium text-rose-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Wallet size={18} />
                                {loading
                                    ? "Initialisation..."
                                    : "Payer maintenant"}
                            </button>
                        </form>

                        <aside className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                            <h2 className="mb-4 text-lg font-extrabold text-white">
                                Résumé du paiement
                            </h2>
                            <div className="space-y-3 text-sm text-slate-100">
                                <div className="flex items-center justify-between">
                                    <span>Payeur</span>
                                    <span className="font-semibold">
                                        {form.payer_name || "-"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Montant</span>
                                    <span className="text-base font-extrabold text-emerald-300">
                                        {amountFormatted} F CFA
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Numéro</span>
                                    <span className="font-semibold">
                                        {form.payer_phone || "-"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Méthode</span>
                                    <span className="font-semibold">
                                        {
                                            METHODS.find(
                                                (m) =>
                                                    m.key ===
                                                    form.payment_method,
                                            )?.label
                                        }
                                    </span>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
