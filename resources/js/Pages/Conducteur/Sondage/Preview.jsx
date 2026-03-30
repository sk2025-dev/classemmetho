import { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    ChevronRight,
    Edit3,
    Eye,
    Send,
    Star,
} from "lucide-react";

const sampleQuestions = [
    {
        id: 1,
        type: "rating",
        title: "Comment evaluez-vous notre service global ?",
        description: "1 = Tres insatisfait, 5 = Tres satisfait",
        required: true,
    },
    {
        id: 2,
        type: "multiple",
        title: "Quel aspect de notre produit appreciez-vous le plus ?",
        options: ["Interface utilisateur", "Performance", "Support client", "Prix"],
        required: true,
    },
    {
        id: 3,
        type: "text",
        title: "Avez-vous des suggestions d'amelioration ?",
        description: "Partagez librement vos idees",
        required: false,
    },
    {
        id: 4,
        type: "yes_no",
        title: "Recommanderiez-vous notre service a un collegue ?",
        options: ["Oui", "Non"],
        required: false,
    },
];

function getQuestionTitle(question) {
    return question?.title || question?.question || "Question sans titre";
}

function getQuestionOptions(question) {
    return Array.isArray(question?.options) ? question.options : [];
}

function getQuestionTypeLabel(type) {
    if (type === "multiple") {
        return "Choix unique";
    }

    if (type === "checkbox") {
        return "Choix multiples";
    }

    if (type === "rating") {
        return "Evaluation";
    }

    if (type === "yes_no") {
        return "Decision";
    }

    return "Expression";
}

function formatDate(dateString) {
    if (!dateString) {
        return "Non definie";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

export default function Preview({ surveyId }) {
    const isNew = surveyId === "new";
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const rawDraft = window.localStorage.getItem("conducteur-sondage-preview");

        if (!rawDraft) {
            return;
        }

        try {
            setDraft(JSON.parse(rawDraft));
        } catch {
            setDraft(null);
        }
    }, []);

    const survey = draft?.survey ?? null;
    const previewQuestions = useMemo(() => {
        if (Array.isArray(draft?.questions) && draft.questions.length > 0) {
            return draft.questions;
        }

        return sampleQuestions;
    }, [draft]);
    const creatorName = draft?.creatorName || "NATHAN AKRE";
    const totalQuestions = draft?.questions?.length ?? sampleQuestions.length;
    const totalRequired =
        draft?.totalRequired ??
        (Array.isArray(draft?.questions)
            ? draft.questions.filter((question) => question.required).length
            : 2);
    const targetAudience = survey?.audience || "Tous les membres";
    const deadline = formatDate(survey?.dateEcheance);
    const title =
        survey?.titre || (isNew ? "Satisfaction Client Q1 2026" : "Apercu du Sondage");
    const description =
        survey?.description ||
        "Aidez-nous a ameliorer nos services en partageant votre experience. Cette page montre une lecture plus narrative, plus chaleureuse et moins mecanique qu'un formulaire classique.";

    return (
        <>
            <Head title="Apercu du sondage" />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Link
                                href="/conducteur/sondages"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Apercu du sondage
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Visualisez le rendu du formulaire avant publication.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/conducteur/sondages/create"
                                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 font-medium text-white transition hover:bg-white/20"
                            >
                                <Edit3 className="h-4 w-4" />
                                Modifier
                            </Link>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#B6C01A] px-5 py-2.5 font-medium text-white shadow-lg transition hover:bg-[#a4ae17]"
                            >
                                <Send className="h-4 w-4" />
                                Publier
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Createur
                                    </p>
                                    <p className="mt-3 text-lg font-bold text-slate-900">
                                        {creatorName}
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Questions
                                    </p>
                                    <p className="mt-3 text-3xl font-bold text-slate-900">
                                        {totalQuestions}
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Obligatoires
                                    </p>
                                    <p className="mt-3 text-3xl font-bold text-slate-900">
                                        {totalRequired}
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Cible
                                    </p>
                                    <p className="mt-3 text-base font-bold text-slate-900">
                                        {targetAudience}
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                        Date d&apos;echeance
                                    </p>
                                    <p className="mt-3 text-base font-bold text-slate-900">
                                        {deadline}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-amber-100 bg-amber-50 px-5 py-4">
                                <Eye className="h-4 w-4 text-amber-700" />
                                <span className="text-sm font-medium text-amber-800 font-display">
                                    Mode Previsualisation
                                </span>
                                <span className="text-sm text-slate-500">
                                    Voici comment votre sondage apparaitra aux repondants.
                                </span>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
                                <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                                    <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-500 via-orange-400 to-lime-500" />
                                    <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-amber-100 blur-3xl" />
                                    <div className="absolute left-10 top-20 h-24 w-24 rounded-full bg-blue-100 blur-3xl" />

                                    <div className="relative">
                                        <span className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                            Lecture repondant
                                        </span>
                                        <h2 className="font-display text-3xl font-bold leading-tight text-slate-900">
                                            {title}
                                        </h2>
                                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                                            {description}
                                        </p>
                                    </div>
                                </div>

                            </div>

                            <div className="space-y-5">
                        {previewQuestions.map((question, index) => (
                            <div
                                key={question.id}
                                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white transition-all hover:border-amber-200 hover:shadow-sm"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white font-display">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                Sequence
                                            </p>
                                            <p className="text-sm font-medium text-slate-700">
                                                {getQuestionTypeLabel(question.type)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 px-6 py-6">
                                    
                                    <div className="flex-1">
                                        <h3 className="font-display text-base font-semibold text-slate-900">
                                            {getQuestionTitle(question)}
                                        </h3>

                                        {question.description ? (
                                            <p className="mt-1 text-sm text-slate-500">
                                                {question.description}
                                            </p>
                                        ) : null}

                                        {question.required ? (
                                            <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                                Reponse obligatoire
                                            </span>
                                        ) : null}

                                        {question.type === "rating" ? (
                                            <div className="mt-4 flex gap-2">
                                                {getQuestionOptions(question).map((option, star) => (
                                                    <button
                                                        key={`${question.id}-${option}-${star}`}
                                                        type="button"
                                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-amber-500 hover:text-amber-600"
                                                        title={option}
                                                    >
                                                        <Star className="h-4 w-4 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}

                                        {(question.type === "multiple" ||
                                            question.type === "checkbox" ||
                                            question.type === "yes_no") &&
                                        getQuestionOptions(question).length > 0 ? (
                                            <div className="mt-4 space-y-2">
                                                {getQuestionOptions(question).map((option) => (
                                                    <label
                                                        key={option}
                                                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-amber-200 hover:bg-amber-50/50"
                                                    >
                                                        <div
                                                            className={`h-4 w-4 border-2 border-slate-300 ${
                                                                question.type === "checkbox"
                                                                    ? "rounded-md"
                                                                    : "rounded-full"
                                                            }`}
                                                        />
                                                        {option}
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}

                                        {question.type === "text" ? (
                                            <div className="mt-4">
                                                <div className="h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                                                    Tapez votre reponse ici...
                                                </div>
                                            </div>
                                        ) : null}

                                    </div>
                                </div>
                            </div>
                        ))}
                            </div>

                            <div className="pt-2 flex justify-center">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#B6C01A] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#a4ae17]"
                                >
                                    Envoyer mes reponses
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                    </div>
                </div>
            </div>
        </>
    );
}
