import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
    ArrowLeft,
    Banknote,
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    Download,
    Eye,
    History,
    Landmark,
    LayoutGrid,
    Loader2,
    Search,
    Trophy,
    UploadCloud,
    Users,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import FimecoImportPanel from "../../Components/Fimeco/FimecoImportPanel";
import Select2Single from "../../Components/Select2Single";
import { withBasePath } from "../../Utils/urlHelper";

const formatAmount = (value) =>
    `${new Intl.NumberFormat("fr-FR").format(Number(value) || 0)} F CFA`;

const statusStyles = {
    SOLDE: "bg-emerald-100 text-emerald-800",
    EN_COURS: "bg-amber-100 text-amber-800",
    NON_SOUSCRIT: "bg-slate-100 text-slate-600",
};

const statusLabels = {
    SOLDE: "Soldé",
    EN_COURS: "En cours",
    NON_SOUSCRIT: "Non souscrit",
};

const CHART_COLORS = { souscrit: "#c7d2fe", verse: "#10b981" };

const progressTone = (pct) => {
    const value = Number(pct) || 0;
    if (value >= 100)
        return { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800" };
    if (value >= 50)
        return { bar: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700" };
    if (value > 0)
        return { bar: "bg-amber-500", chip: "bg-amber-100 text-amber-800" };
    return { bar: "bg-slate-300", chip: "bg-slate-100 text-slate-600" };
};

const compactAmount = (value) =>
    new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(
        Number(value) || 0,
    );

const MODE_OPTIONS = [
    { value: "ESPECES", label: "Espèces" },
    { value: "VIREMENT", label: "Virement" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "MOBILE_MONEY", label: "Mobile Money" },
];

const STATUT_OPTIONS = [
    { value: "SOLDE", label: "Soldé" },
    { value: "EN_COURS", label: "En cours" },
    { value: "NON_SOUSCRIT", label: "Non souscrit" },
];

const CLASSE_SORT_OPTIONS = [
    { value: "classe", label: "Classe (A → Z)" },
    { value: "souscriptions", label: "Nombre de souscriptions" },
    { value: "montant", label: "Montant de souscription" },
    { value: "taux", label: "Taux de paiement" },
];

const CLASSE_SORT_CAPTIONS = {
    souscriptions: "Classées par nombre de souscriptions décroissant.",
    montant: "Classées par montant de souscription décroissant.",
    taux: "Classées par taux de paiement décroissant.",
};

const rankOrdinal = (rank) => (rank === 1 ? "1er" : `${rank}e`);

const rankBadgeStyle = (rank) =>
    ({
        1: "bg-amber-400 text-white shadow-sm shadow-amber-200",
        2: "bg-slate-300 text-slate-800",
        3: "bg-orange-300 text-orange-950",
    })[rank] || "bg-slate-100 text-slate-500";

const rankCardStyle = (rank) =>
    ({
        1: "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200",
        2: "border-slate-300 bg-slate-50 ring-1 ring-slate-200",
        3: "border-orange-300 bg-orange-50/40 ring-1 ring-orange-200",
    })[rank] || "border-slate-200";

function StatCard({ label, value, detail, icon: Icon, color }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
                </div>
                <div className={`rounded-xl border p-3 ${colors[color] || colors.indigo}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const cardAccents = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
};

function CollapsibleCard({ id, icon: Icon, accent = "indigo", title, subtitle, badge = null, open, onToggle, children }) {
    return (
        <section
            id={id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
                open ? "border-slate-300" : "border-slate-200"
            }`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 sm:p-5"
            >
                <span className={`shrink-0 rounded-xl p-2.5 ${cardAccents[accent] || cardAccents.indigo}`}>
                    <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-black text-slate-900">{title}</span>
                    {subtitle && <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span>}
                </span>
                {badge}
                <span
                    className={`shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-transform duration-200 ${
                        open ? "rotate-180 bg-slate-50" : ""
                    }`}
                >
                    <ChevronDown size={16} />
                </span>
            </button>
            {open && (
                <div className="border-t border-slate-100 p-4 sm:p-5">{children}</div>
            )}
        </section>
    );
}

export default function FimecoIndex({
    available = true,
    annee,
    annees = [],
    stats = {},
    familles = [],
    classes = [],
    versements = [],
    optionsFamilles = [],
    cotisationsFimeco = [],
    importLogs = [],
}) {
    const [mainView, setMainView] = useState("consultation");
    const [familyDetails, setFamilyDetails] = useState(null);
    const [familyDetailsLoading, setFamilyDetailsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [classeFilter, setClasseFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [savingSubscription, setSavingSubscription] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);
    const [activatingCotisation, setActivatingCotisation] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [panels, setPanels] = useState({
        import: false,
        souscription: false,
        versement: false,
        journal: false,
    });
    const togglePanel = (key) =>
        setPanels((current) => ({ ...current, [key]: !current[key] }));
    const [openLogErrors, setOpenLogErrors] = useState({});
    const toggleLogErrors = (id) =>
        setOpenLogErrors((current) => ({ ...current, [id]: !current[id] }));
    const [classesView, setClassesView] = useState("cards");
    const [classesSort, setClassesSort] = useState("classe");
    const [versementSearch, setVersementSearch] = useState("");
    const [versementClasse, setVersementClasse] = useState("");
    const [versementMode, setVersementMode] = useState("");
    const [versementPage, setVersementPage] = useState(1);
    const [subscriptionForm, setSubscriptionForm] = useState({
        family_id: "",
        montant_souscrit: "",
    });
    const [paymentForm, setPaymentForm] = useState({
        family_id: "",
        montant: "",
        date_paiement: new Date().toISOString().slice(0, 10),
        mode_paiement: "ESPECES",
        note: "",
    });

    const classOptions = useMemo(() => {
        const map = new Map();
        familles.forEach((family) => {
            map.set(String(family.classe_id ?? "none"), family.classe || "Sans classe");
        });
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
    }, [familles]);

    const anneeOptions = useMemo(
        () => annees.map((year) => ({ value: String(year), label: String(year) })),
        [annees],
    );

    const familleSelectOptions = useMemo(
        () =>
            optionsFamilles.map((family) => ({
                value: String(family.id),
                label: family.label,
                description: family.classe,
            })),
        [optionsFamilles],
    );

    const classeFilterOptions = useMemo(
        () => classOptions.map(([id, label]) => ({ value: id, label })),
        [classOptions],
    );

    const sortedClasses = useMemo(() => {
        const list = [...classes];
        const byNumberDesc = (getter) => (a, b) =>
            (Number(getter(b)) || 0) - (Number(getter(a)) || 0) ||
            String(a.classe || "").localeCompare(String(b.classe || ""), "fr");

        switch (classesSort) {
            case "souscriptions":
                return list.sort(byNumberDesc((item) => item.familles_souscrites));
            case "montant":
                return list.sort(byNumberDesc((item) => item.montant_souscrit));
            case "taux":
                return list.sort(byNumberDesc((item) => item.progression));
            default:
                return list.sort((a, b) =>
                    String(a.classe || "").localeCompare(String(b.classe || ""), "fr"),
                );
        }
    }, [classes, classesSort]);

    const classesChartData = useMemo(
        () =>
            sortedClasses.map((item, index) => ({
                classe:
                    classesSort !== "classe"
                        ? `${index + 1}. ${item.classe}`
                        : item.classe,
                Souscrit: Number(item.montant_souscrit) || 0,
                Versé: Number(item.montant_paye) || 0,
                Reste: Number(item.montant_restant) || 0,
            })),
        [sortedClasses, classesSort],
    );

    const classesTotals = useMemo(
        () =>
            classes.reduce(
                (acc, item) => ({
                    souscrit: acc.souscrit + (Number(item.montant_souscrit) || 0),
                    paye: acc.paye + (Number(item.montant_paye) || 0),
                    restant: acc.restant + (Number(item.montant_restant) || 0),
                }),
                { souscrit: 0, paye: 0, restant: 0 },
            ),
        [classes],
    );

    const filteredFamilies = useMemo(() => {
        const query = search.trim().toLowerCase();
        return familles.filter((family) => {
            const matchesSearch =
                !query ||
                String(family.famille || "").toLowerCase().includes(query) ||
                String(family.code_famille || "").toLowerCase().includes(query) ||
                String(family.classe || "").toLowerCase().includes(query);
            const matchesClass =
                !classeFilter || String(family.classe_id ?? "none") === classeFilter;
            const matchesStatus = !statusFilter || family.statut === statusFilter;
            return matchesSearch && matchesClass && matchesStatus;
        });
    }, [familles, search, classeFilter, statusFilter]);

    const perPage = 25;
    const totalPages = Math.max(1, Math.ceil(filteredFamilies.length / perPage));
    const visibleFamilies = filteredFamilies.slice((page - 1) * perPage, page * perPage);

    const versementClasseOptions = useMemo(() => {
        const set = new Set(
            versements.map((payment) => payment.classe).filter(Boolean),
        );
        return [...set]
            .sort((a, b) => a.localeCompare(b, "fr"))
            .map((label) => ({ value: label, label }));
    }, [versements]);

    const filteredVersements = useMemo(() => {
        const query = versementSearch.trim().toLowerCase();
        return versements.filter((payment) => {
            const matchesSearch =
                !query ||
                [
                    payment.famille,
                    payment.code_famille,
                    payment.classe,
                    payment.reference,
                    payment.note,
                    payment.date,
                    String(payment.mode || "").replace(/_/g, " "),
                ]
                    .some((field) => String(field || "").toLowerCase().includes(query));
            const matchesClasse = !versementClasse || payment.classe === versementClasse;
            const matchesMode = !versementMode || payment.mode === versementMode;
            return matchesSearch && matchesClasse && matchesMode;
        });
    }, [versements, versementSearch, versementClasse, versementMode]);

    const versementPerPage = 20;
    const versementTotalPages = Math.max(
        1,
        Math.ceil(filteredVersements.length / versementPerPage),
    );
    const versementSafePage = Math.min(versementPage, versementTotalPages);
    const visibleVersements = filteredVersements.slice(
        (versementSafePage - 1) * versementPerPage,
        versementSafePage * versementPerPage,
    );
    const versementFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setVersementPage(1);
    };

    const changeYear = (value) => {
        router.get(
            withBasePath("", "/fimeco"),
            { annee: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        window.setTimeout(() => setFeedback(null), 5000);
    };

    const apiError = (error, fallback) =>
        error.response?.data?.message ||
        Object.values(error.response?.data?.errors || {})?.[0]?.[0] ||
        fallback;

    const saveSubscription = async (event) => {
        event.preventDefault();
        setSavingSubscription(true);
        try {
            const response = await axios.post(withBasePath("", "/fimeco/souscriptions"), {
                family_id: Number(subscriptionForm.family_id),
                annee: Number(annee),
                montant_souscrit: Number(subscriptionForm.montant_souscrit),
            });
            showFeedback("success", response.data?.message || "Souscription enregistrée.");
            setSubscriptionForm({ family_id: "", montant_souscrit: "" });
            router.reload({ only: ["stats", "familles", "classes"] });
        } catch (error) {
            showFeedback("error", apiError(error, "Impossible d'enregistrer la souscription."));
        } finally {
            setSavingSubscription(false);
        }
    };

    const savePayment = async (event) => {
        event.preventDefault();
        setSavingPayment(true);
        try {
            const response = await axios.post(withBasePath("", "/fimeco/versements"), {
                ...paymentForm,
                family_id: Number(paymentForm.family_id),
                annee: Number(annee),
                montant: Number(paymentForm.montant),
            });
            showFeedback("success", response.data?.message || "Versement enregistré.");
            setPaymentForm((current) => ({ ...current, montant: "", note: "" }));
            router.reload({ only: ["stats", "familles", "classes", "versements"] });
        } catch (error) {
            showFeedback("error", apiError(error, "Impossible d'enregistrer le versement."));
        } finally {
            setSavingPayment(false);
        }
    };

    const activateCotisation = async () => {
        setActivatingCotisation(true);
        try {
            const response = await axios.post(withBasePath("", "/fimeco/cotisation"));
            showFeedback("success", response.data?.message || "Cotisation FIMECO activée.");
            router.reload({
                only: ["cotisationsFimeco", "stats", "familles", "classes", "versements"],
            });
        } catch (error) {
            showFeedback("error", apiError(error, "Impossible d'activer la cotisation FIMECO."));
        } finally {
            setActivatingCotisation(false);
        }
    };

    const viewFamilyDetails = async (family) => {
        setFamilyDetails({ ...family, versements: null });
        setFamilyDetailsLoading(true);
        try {
            const response = await axios.get(
                withBasePath("", `/fimeco/familles/${family.family_id}/versements`),
                { params: { annee } },
            );
            setFamilyDetails(response.data);
        } catch (error) {
            setFamilyDetails((current) => (current ? { ...current, versements: [], loadError: true } : current));
        } finally {
            setFamilyDetailsLoading(false);
        }
    };
    const closeFamilyDetails = () => setFamilyDetails(null);

    const onFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    const importIssuesCount = useMemo(
        () =>
            importLogs.filter(
                (log) => !log.success || (log.errors_count || 0) > 0,
            ).length,
        [importLogs],
    );

    const downloadLogErrors = (log) => {
        const rows = log.errors || [];
        const header = ["Ligne", "Code famille", "Chef de famille", "Année", "Motif"];
        const escape = (value) => {
            const text = value == null ? "" : String(value);
            return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        };
        const body = rows.map((error) =>
            [error.line, error.chef_famille_id, error.chef_nom, error.annee, error.reason]
                .map(escape)
                .join(";"),
        );
        const csv = "﻿" + [header.join(";"), ...body].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `fimeco-import-${log.type}-${log.id}-echecs.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const logDate = (iso) => {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    };

    return (
        <>
            <Head title="Gestion FIMECO" />
            <div className="min-h-screen bg-slate-50/95 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Link
                                href={withBasePath("", "/dashboard")}
                                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"
                            >
                                <ArrowLeft size={16} /> Retour au tableau de bord
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
                                    <Landmark size={28} />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Gestion FIMECO</h1>
                                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                            Vue globale
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Pilotage consolidé de toutes les familles et de toutes les classes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-48">
                            <Field label="Exercice suivi">
                                <Select2Single
                                    name="annee"
                                    value={String(annee)}
                                    onChange={(event) => changeYear(event.target.value)}
                                    options={anneeOptions}
                                    placeholder="Choisir un exercice"
                                    isClearable={false}
                                    allowClearOption={false}
                                />
                            </Field>
                        </div>
                    </div>

                    {!available && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                            Le module FIMECO n'est pas disponible : les tables nécessaires ne sont pas encore installées.
                        </div>
                    )}

                    {feedback && (
                        <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
                            feedback.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-red-200 bg-red-50 text-red-800"
                        }`}>
                            {feedback.message}
                        </div>
                    )}

                    {available && cotisationsFimeco.length === 0 && (
                        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                            <p className="min-w-0">
                                Aucune cotisation FIMECO n'est encore configurée. Elle sert uniquement de repère
                                technique pour marquer un versement comme « FIMECO » (montant 0, aucune échéance
                                générée) et reste partagée avec le suivi FIMECO par classe. Elle est aussi créée
                                automatiquement au premier import ou premier versement.
                            </p>
                            <button
                                type="button"
                                onClick={activateCotisation}
                                disabled={activatingCotisation}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {activatingCotisation && <Loader2 className="animate-spin" size={15} />}
                                Activer la cotisation FIMECO
                            </button>
                        </div>
                    )}

                    <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setMainView("consultation")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                mainView === "consultation"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <Eye size={14} /> Consultation
                        </button>
                        <button
                            type="button"
                            onClick={() => setMainView("import")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                mainView === "import"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <UploadCloud size={14} /> Import &amp; journal
                        </button>
                    </div>

                    {mainView === "consultation" && (
                        <>
                            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard label="Souscriptions" value={formatAmount(stats.montant_souscrit)} detail={`${stats.familles_souscrites || 0} famille(s) engagée(s)`} icon={WalletCards} color="indigo" />
                                <StatCard label="Versements confirmés" value={formatAmount(stats.montant_paye)} detail={`Exercice ${annee}`} icon={CircleDollarSign} color="emerald" />
                                <StatCard label="Reste à mobiliser" value={formatAmount(stats.montant_restant)} detail={`${stats.familles_soldees || 0} famille(s) soldée(s)`} icon={Banknote} color="amber" />
                                <StatCard label="Taux de réalisation" value={`${Number(stats.taux_realisation || 0).toLocaleString("fr-FR")}%`} detail={`${stats.familles_total || 0} famille(s) au total`} icon={CheckCircle2} color="blue" />
                            </div>

                            {(stats.versements_sans_annee || 0) > 0 && (
                                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                                    <strong>{stats.versements_sans_annee}</strong> versement(s) FIMECO historique(s) n'ont pas d'année d'exercice et ne sont pas inclus dans les totaux annuels.
                                </div>
                            )}
                        </>
                    )}

                    {mainView === "import" && (
                    <div className="mb-6 space-y-3">
                        <CollapsibleCard
                            icon={UploadCloud}
                            accent="slate"
                            title="Import annuel FIMECO"
                            subtitle="Souscriptions et versements par fichier Excel — ré-import sans doublon."
                            open={panels.import}
                            onToggle={() => togglePanel("import")}
                        >
                            <FimecoImportPanel
                                embedded
                                onImported={() => router.reload({
                                    only: ["annees", "stats", "familles", "classes", "versements", "importLogs"],
                                })}
                            />
                        </CollapsibleCard>

                        <CollapsibleCard
                            icon={History}
                            accent="slate"
                            title="Journal des imports"
                            subtitle={
                                importLogs.length === 0
                                    ? "Aucun import enregistré pour le moment."
                                    : `${importLogs.length} import(s) — les 25 derniers, réussis et en échec.`
                            }
                            badge={
                                importIssuesCount > 0 ? (
                                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">
                                        {importIssuesCount} à vérifier
                                    </span>
                                ) : null
                            }
                            open={panels.journal}
                            onToggle={() => togglePanel("journal")}
                        >
                            {importLogs.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Les imports Excel (souscriptions et versements) apparaîtront ici avec le détail des lignes ignorées.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {importLogs.map((log) => {
                                        const errors = log.errors || [];
                                        const hasErrors = errors.length > 0 || (log.errors_count || 0) > 0;
                                        const isOpen = !!openLogErrors[log.id];
                                        return (
                                            <li
                                                key={log.id}
                                                className={`rounded-xl border p-4 ${
                                                    log.success ? "border-slate-200" : "border-red-200 bg-red-50/40"
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                                                            log.type === "versements"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-indigo-100 text-indigo-700"
                                                        }`}
                                                    >
                                                        {log.type}
                                                    </span>
                                                    {log.success ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                                            <CheckCircle2 size={14} /> Réussi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                                                            <XCircle size={14} /> Échec
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400">{logDate(log.date)}</span>
                                                </div>
                                                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                                                    {log.fichier || "Fichier sans nom"}
                                                </p>
                                                {log.message && <p className="mt-0.5 text-xs text-slate-500">{log.message}</p>}
                                                {log.auteur && <p className="mt-0.5 text-[11px] text-slate-400">Par {log.auteur}</p>}

                                                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
                                                    {log.type === "souscriptions" && (
                                                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{log.created} créées</span>
                                                    )}
                                                    {log.type === "souscriptions" && (
                                                        <span className="rounded-md bg-indigo-50 px-2 py-1 text-indigo-700">{log.updated} mises à jour</span>
                                                    )}
                                                    {log.type === "versements" && (
                                                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{log.created} importés</span>
                                                    )}
                                                    {log.type === "versements" && (
                                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{log.duplicates} doublons</span>
                                                    )}
                                                    <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{log.skipped} ignorées</span>
                                                    <span
                                                        className={`rounded-md px-2 py-1 ${
                                                            (log.errors_count || 0) > 0
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-slate-100 text-slate-500"
                                                        }`}
                                                    >
                                                        {log.errors_count || 0} erreurs
                                                    </span>
                                                </div>

                                                {hasErrors && (
                                                    <div className="mt-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleLogErrors(log.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                            >
                                                                <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                                                {isOpen ? "Masquer" : "Voir"} le détail ({errors.length})
                                                            </button>
                                                            {errors.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadLogErrors(log)}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                                >
                                                                    <Download size={14} /> Télécharger (CSV)
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isOpen && errors.length > 0 && (
                                                            <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200">
                                                                <table className="min-w-full text-xs">
                                                                    <thead className="sticky top-0 bg-slate-50 text-left font-bold text-slate-500">
                                                                        <tr>
                                                                            <th className="px-3 py-2">Ligne</th>
                                                                            <th className="px-3 py-2">Code / Chef</th>
                                                                            <th className="px-3 py-2">Année</th>
                                                                            <th className="px-3 py-2">Motif</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {errors.map((error, index) => (
                                                                            <tr key={index} className="align-top">
                                                                                <td className="px-3 py-2 font-mono text-slate-500">{error.line ?? "—"}</td>
                                                                                <td className="px-3 py-2">
                                                                                    <div className="font-semibold text-slate-700">{error.chef_famille_id || "—"}</div>
                                                                                    {error.chef_nom && <div className="text-slate-400">{error.chef_nom}</div>}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-slate-500">{error.annee || "—"}</td>
                                                                                <td className="px-3 py-2 text-slate-600">{error.reason}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                        {isOpen && errors.length === 0 && (
                                                            <p className="mt-2 text-xs text-slate-500">
                                                                {log.errors_count} erreur(s) — détail non conservé pour cet import.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CollapsibleCard>
                    </div>
                    )}

                    {mainView === "consultation" && (
                    <>
                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Building2 className="text-indigo-600" size={22} />
                                <div>
                                    <h2 className="font-black text-slate-900">Situation par classe</h2>
                                    <p className="text-xs text-slate-500">
                                        {CLASSE_SORT_CAPTIONS[classesSort] || `Consolidation globale de l'exercice ${annee}.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="w-full sm:w-56">
                                    <Select2Single
                                        name="classe_sort"
                                        value={classesSort}
                                        onChange={(event) => setClassesSort(event.target.value || "classe")}
                                        options={CLASSE_SORT_OPTIONS}
                                        isClearable={false}
                                        allowClearOption={false}
                                    />
                                </div>
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setClassesView("cards")}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                            classesView === "cards"
                                                ? "bg-white text-indigo-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        <LayoutGrid size={14} /> Cartes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClassesView("chart")}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                            classesView === "chart"
                                                ? "bg-white text-indigo-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        <BarChart3 size={14} /> Graphique
                                    </button>
                                </div>
                            </div>
                        </div>

                        {classes.length === 0 && (
                            <p className="text-sm text-slate-500">Aucune classe disponible.</p>
                        )}

                        {classes.length > 0 && (
                            <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Souscrit global</p>
                                    <p className="text-base font-black text-slate-800">{formatAmount(classesTotals.souscrit)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-500">Versé global</p>
                                    <p className="text-base font-black text-emerald-700">{formatAmount(classesTotals.paye)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500">Reste global</p>
                                    <p className="text-base font-black text-amber-700">{formatAmount(classesTotals.restant)}</p>
                                </div>
                            </div>
                        )}

                        {classes.length > 0 && classesView === "cards" && (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {sortedClasses.map((item, index) => {
                                    const tone = progressTone(item.progression);
                                    const ratio = item.familles
                                        ? Math.round((item.familles_souscrites / item.familles) * 100)
                                        : 0;
                                    const ranked = classesSort !== "classe";
                                    const rank = index + 1;
                                    return (
                                        <div
                                            key={item.classe_id ?? "none"}
                                            className={`relative rounded-xl border p-4 transition hover:shadow-sm ${
                                                ranked ? rankCardStyle(rank) : "border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            {ranked && (
                                                <span
                                                    className={`absolute -left-2 -top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black ${rankBadgeStyle(rank)}`}
                                                >
                                                    {rank === 1 && <Trophy size={13} />}
                                                    {rankOrdinal(rank)}
                                                </span>
                                            )}
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className={`font-black text-slate-900 ${ranked ? "pt-1" : ""}`}>{item.classe}</h3>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-black ${tone.chip}`}>
                                                    {item.progression}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.familles_souscrites}/{item.familles} famille(s) souscrite(s) · {ratio}%
                                            </p>
                                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full ${tone.bar}`}
                                                    style={{ width: `${Math.max(2, Math.min(100, Number(item.progression) || 0))}%` }}
                                                />
                                            </div>
                                            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-lg bg-slate-50 py-2">
                                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Souscrit</dt>
                                                    <dd className="text-sm font-black text-slate-800">{formatAmount(item.montant_souscrit)}</dd>
                                                </div>
                                                <div className="rounded-lg bg-emerald-50 py-2">
                                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-emerald-500">Versé</dt>
                                                    <dd className="text-sm font-black text-emerald-700">{formatAmount(item.montant_paye)}</dd>
                                                </div>
                                                <div className="rounded-lg bg-amber-50 py-2">
                                                    <dt className="text-[11px] font-bold uppercase tracking-wide text-amber-500">Reste</dt>
                                                    <dd className="text-sm font-black text-amber-700">{formatAmount(item.montant_restant)}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {classes.length > 0 && classesView === "chart" && (
                            <div className="overflow-x-auto">
                                <div
                                    className="min-w-[560px]"
                                    style={{ height: Math.max(300, classes.length * 46 + 64) }}
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={classesChartData}
                                            layout="vertical"
                                            margin={{ top: 4, right: 28, bottom: 4, left: 8 }}
                                            barGap={2}
                                        >
                                            <CartesianGrid horizontal={false} stroke="#eef2f7" />
                                            <XAxis
                                                type="number"
                                                tickFormatter={compactAmount}
                                                tick={{ fontSize: 11, fill: "#64748b" }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="classe"
                                                width={132}
                                                tick={{ fontSize: 11, fill: "#334155" }}
                                            />
                                            <Tooltip
                                                formatter={(value, name) => [formatAmount(value), name]}
                                                labelStyle={{ fontWeight: 700, color: "#0f172a" }}
                                                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                            <Bar dataKey="Souscrit" fill={CHART_COLORS.souscrit} radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="Versé" fill={CHART_COLORS.verse} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5">
                            <div className="flex items-center gap-3">
                                <Users className="text-indigo-600" size={22} />
                                <div>
                                    <h2 className="font-black text-slate-900">Suivi global des familles</h2>
                                    <p className="text-xs text-slate-500">{filteredFamilies.length} résultat(s) sur {familles.length} famille(s).</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                                    <input value={search} onChange={onFilterChange(setSearch)} className={`${inputClass} pl-10`} placeholder="Famille, code ou classe…" />
                                </div>
                                <Select2Single
                                    name="classe_filter"
                                    value={classeFilter}
                                    onChange={onFilterChange(setClasseFilter)}
                                    options={classeFilterOptions}
                                    placeholder="Toutes les classes"
                                    noOptionsMessage="Aucune classe"
                                />
                                <Select2Single
                                    name="statut_filter"
                                    value={statusFilter}
                                    onChange={onFilterChange(setStatusFilter)}
                                    options={STATUT_OPTIONS}
                                    placeholder="Tous les statuts"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">Famille</th>
                                        <th className="px-5 py-3">Classe</th>
                                        <th className="px-5 py-3 text-right">Souscrit</th>
                                        <th className="px-5 py-3 text-right">Versé</th>
                                        <th className="px-5 py-3 text-right">Reste</th>
                                        <th className="px-5 py-3 text-center">Statut</th>
                                        <th className="px-5 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleFamilies.map((family) => (
                                        <tr key={family.family_id} className="hover:bg-slate-50/70">
                                            <td className="px-5 py-3.5"><div className="font-bold text-slate-900">{family.famille}</div><div className="text-xs text-slate-500">{family.code_famille || "Sans code"}</div></td>
                                            <td className="px-5 py-3.5 text-slate-600">{family.classe}</td>
                                            <td className="px-5 py-3.5 text-right font-semibold">{formatAmount(family.montant_souscrit)}</td>
                                            <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{formatAmount(family.montant_paye)}</td>
                                            <td className="px-5 py-3.5 text-right font-bold text-amber-700">{formatAmount(family.montant_restant)}</td>
                                            <td className="px-5 py-3.5 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[family.statut]}`}>{statusLabels[family.statut]}</span></td>
                                            <td className="px-5 py-3.5 text-center"><button type="button" onClick={() => viewFamilyDetails(family)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50" title="Voir le détail des versements"><Eye size={14} /> Détails</button></td>
                                        </tr>
                                    ))}
                                    {visibleFamilies.length === 0 && <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-500">Aucune famille ne correspond aux filtres.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
                                <span className="text-slate-500">Page {page} sur {totalPages}</span>
                                <div className="flex gap-2">
                                    <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40">Précédent</button>
                                    <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40">Suivant</button>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="font-black text-slate-900">Versements de {annee}</h2>
                            <p className="text-xs text-slate-500">
                                {filteredVersements.length} résultat(s) sur {versements.length} versement(s) confirmé(s) (150 plus récents).
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                                    <input
                                        value={versementSearch}
                                        onChange={versementFilterChange(setVersementSearch)}
                                        className={`${inputClass} pl-10`}
                                        placeholder="Famille, code, référence, note…"
                                    />
                                </div>
                                <Select2Single
                                    name="versement_classe_filter"
                                    value={versementClasse}
                                    onChange={versementFilterChange(setVersementClasse)}
                                    options={versementClasseOptions}
                                    placeholder="Toutes les classes"
                                    noOptionsMessage="Aucune classe"
                                />
                                <Select2Single
                                    name="versement_mode_filter"
                                    value={versementMode}
                                    onChange={versementFilterChange(setVersementMode)}
                                    options={MODE_OPTIONS}
                                    placeholder="Tous les modes"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Famille</th><th className="px-5 py-3">Classe</th><th className="px-5 py-3">Mode</th><th className="px-5 py-3 text-right">Montant</th><th className="px-5 py-3">Référence</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleVersements.map((payment) => <tr key={payment.id}><td className="px-5 py-3">{payment.date || "-"}</td><td className="px-5 py-3"><div className="font-bold text-slate-900">{payment.famille}</div><div className="text-xs text-slate-500">{payment.code_famille || ""}</div></td><td className="px-5 py-3 text-slate-600">{payment.classe}</td><td className="px-5 py-3 text-slate-600">{String(payment.mode || "-").replaceAll("_", " ")}</td><td className="px-5 py-3 text-right font-black text-emerald-700">{formatAmount(payment.montant)}</td><td className="px-5 py-3 font-mono text-xs text-slate-500">{payment.reference || "-"}</td></tr>)}
                                    {visibleVersements.length === 0 && <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-500">{versements.length === 0 ? "Aucun versement confirmé pour cet exercice." : "Aucun versement ne correspond aux filtres."}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {versementTotalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm">
                                <span className="text-slate-500">Page {versementSafePage} sur {versementTotalPages}</span>
                                <div className="flex gap-2">
                                    <button type="button" disabled={versementSafePage === 1} onClick={() => setVersementPage(Math.max(1, versementSafePage - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40">Précédent</button>
                                    <button type="button" disabled={versementSafePage === versementTotalPages} onClick={() => setVersementPage(Math.min(versementTotalPages, versementSafePage + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40">Suivant</button>
                                </div>
                            </div>
                        )}
                    </section>
                    </>
                    )}
                </div>
            </div>

            {familyDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                            <div>
                                <h3 className="text-base font-black text-slate-900">{familyDetails.famille}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {familyDetails.code_famille || "Sans code"} · {familyDetails.classe} · Exercice {familyDetails.annee || annee}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFamilyDetails}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 p-5 pb-0 text-center">
                            <div className="rounded-xl bg-indigo-50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">Souscrit</p>
                                <p className="mt-1 text-sm font-black text-indigo-700">{formatAmount(familyDetails.montant_souscrit)}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Versé</p>
                                <p className="mt-1 text-sm font-black text-emerald-700">{formatAmount(familyDetails.montant_paye)}</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Reste</p>
                                <p className="mt-1 text-sm font-black text-amber-700">{formatAmount(familyDetails.montant_restant)}</p>
                            </div>
                        </div>
                        <div className="p-5">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Détail des versements</h4>
                            {familyDetailsLoading && (
                                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                                    <Loader2 className="animate-spin" size={16} /> Chargement…
                                </div>
                            )}
                            {!familyDetailsLoading && familyDetails.loadError && (
                                <p className="py-4 text-sm text-red-600">Impossible de charger les versements de cette famille.</p>
                            )}
                            {!familyDetailsLoading && !familyDetails.loadError && Array.isArray(familyDetails.versements) && (
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                                    {familyDetails.versements.length === 0 && (
                                        <p className="p-4 text-center text-sm text-slate-400">
                                            Aucun versement enregistré pour cet exercice.
                                        </p>
                                    )}
                                    {familyDetails.versements.map((v) => (
                                        <div key={v.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
                                            <div>
                                                <p className="font-semibold text-slate-800">{v.date || "-"}</p>
                                                <p className="text-xs text-slate-500">
                                                    {String(v.mode || "-").replaceAll("_", " ")}
                                                    {v.reference ? ` · ${v.reference}` : ""}
                                                </p>
                                                {v.note && <p className="text-xs italic text-slate-400">{v.note}</p>}
                                            </div>
                                            <span className="shrink-0 font-black text-emerald-700">{formatAmount(v.montant)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
