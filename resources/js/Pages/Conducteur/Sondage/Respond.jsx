import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, CalendarDays, ChevronRight, Send, Star, Users } from "lucide-react";
import { ToastContainer } from "../../../Components/Toast";
import useToast from "../../../Hooks/useToast";

function formatDate(dateString) {
    if (!dateString) {
        return "Non definie";
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
}

function questionTypeLabel(type) {
    if (type === "multiple") return "Choix multiples";
    if (type === "checkbox") return "Choix unique";
    if (type === "rating") return "Evaluation";
    if (type === "yes_no") return "Oui / Non";
    return "Reponse libre";
}

const ratingScaleLabels = {
    1: "Tres insatisfait",
    2: "Insatisfait",
    3: "Neutre",
    4: "Satisfait",
    5: "Tres satisfait",
};

function getRatingLabel(question, option) {
    return (
        question?.scaleLabels?.[option] ||
        ratingScaleLabels[option] ||
        option
    );
}

function getStatusClasses(statut) {
    if (statut === "Actif") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (statut === "Cloture") {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

export default function ConducteurSondageRespond({
    survey,
    classe = null,
    hasResponded = false,
    previousAnswers = {},
}) {
    const { errors = {}, flash = {} } = usePage().props;
    const [answers, setAnswers] = useState(previousAnswers || {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toasts, removeToast, success: showSuccess, error: showError } = useToast();
    const lastSuccessRef = useRef(null);
    const lastErrorRef = useRef(null);

    const isExpired = survey?.statut === "Cloture";
    const questions = useMemo(
        () => (Array.isArray(survey?.questions) ? survey.questions : []),
        [survey],
    );

    useEffect(() => {
        setAnswers(previousAnswers || {});
    }, [previousAnswers]);

    useEffect(() => {
        if (flash?.success && flash.success !== lastSuccessRef.current) {
            lastSuccessRef.current = flash.success;
            showSuccess(flash.success);
        }
    }, [flash?.success, showSuccess]);

    useEffect(() => {
        const errorMessage = errors?.survey || errors?.answers || null;

        if (!errorMessage) {
            lastErrorRef.current = null;
            return;
        }

        if (errorMessage !== lastErrorRef.current) {
            lastErrorRef.current = errorMessage;
            showError(errorMessage);
        }
    }, [errors?.answers, errors?.survey, showError]);

    const updateCheckboxAnswer = (questionId, option, checked) => {
        setAnswers((current) => {
            const previous = Array.isArray(current[questionId])
                ? current[questionId]
                : [];

            return {
                ...current,
                [questionId]: checked
                    ? [...previous, option]
                    : previous.filter((item) => item !== option),
            };
        });
    };

    const submitAnswers = () => {
        setIsSubmitting(true);

        router.post(
            `/conducteur/sondages/${survey.id}/reponses`,
            { answers },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title={`${survey?.titre || "Sondage"} - Reponse conducteur`} />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-6xl">
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
                                    Repondre au sondage
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Votre reponse reste anonyme.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white">
                            Reponses anonymes
                        </div>
                    </div>

                    <section className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    {survey.code ? (
                                        <span className="rounded-full bg-sky-50 px-3 py-1.5 font-mono text-sky-700 ring-1 ring-sky-200">
                                            {survey.code}
                                        </span>
                                    ) : null}
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(survey.statut)}`}
                                    >
                                        {survey.statut}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4" />
                                        Cree le {formatDate(survey.dateCreation)}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4" />
                                        Date de cloture: {formatDate(survey.dateEcheance)}
                                    </span>
                                </div>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                                    {survey.titre}
                                </h2>
                                <p className="mt-3 text-base leading-7 text-slate-600">
                                    {survey.description || "Aucune description renseignee."}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Audience: <strong>{survey.audience}</strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Classe:{" "}
                                        <strong>
                                            {survey.classe || classe?.nom || "Non renseignee"}
                                        </strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Createur: <strong>{survey.createur || "Non renseigne"}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="w-full rounded-[24px] bg-slate-50 p-4 lg:w-[260px]">
                                <p className="text-sm font-semibold text-slate-900">
                                    Confidentialite
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Le systeme enregistre une participation anonyme.
                                    Aucun nom, email ou telephone n'apparaitra dans les
                                    resultats. Seules des statistiques globales de profil
                                    peuvent etre utilisees.
                                </p>
                            </div>
                        </div>
                    </section>

                    {hasResponded ? (
                        <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                            Votre reponse anonyme a deja ete enregistree pour ce sondage.
                        </div>
                    ) : null}

                    {isExpired ? (
                        <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            Ce sondage est expire. Vous ne pouvez plus soumettre de reponse.
                        </div>
                    ) : null}

                    <div className="mt-6 space-y-5">
                        {questions.length === 0 ? (
                            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                                Ce sondage ne contient encore aucune question.
                            </div>
                        ) : null}

                        {questions.map((question, index) => (
                            <section
                                key={question.id || index}
                                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Question {index + 1}
                                        </p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                            {question.title || "Question sans titre"}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                            {questionTypeLabel(question.type)}
                                        </span>
                                        {question.required ? (
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                                Obligatoire
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {question.type === "text" ? (
                                    <textarea
                                        value={answers[question.id] || ""}
                                        onChange={(event) =>
                                            setAnswers((current) => ({
                                                ...current,
                                                [question.id]: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        rows={4}
                                        className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        placeholder="Votre reponse..."
                                    />
                                ) : null}

                                {question.type === "rating" ? (
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                        {(question.options || []).map((option, optionIndex) => {
                                            const isActive = answers[question.id] === option;

                                            return (
                                                <button
                                                    key={`${question.id}-${optionIndex}`}
                                                    type="button"
                                                    disabled={hasResponded || isExpired}
                                                    onClick={() =>
                                                        setAnswers((current) => ({
                                                            ...current,
                                                            [question.id]: option,
                                                        }))
                                                    }
                                                    className={`rounded-2xl border px-4 py-3 text-center transition ${
                                                        isActive
                                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                                            : "border-slate-200 bg-white text-slate-500 hover:border-amber-300"
                                                    }`}
                                                >
                                                    <div
                                                        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border ${
                                                            isActive
                                                                ? "border-amber-400 bg-amber-100"
                                                                : "border-slate-200 bg-slate-50"
                                                        }`}
                                                    >
                                                        <Star className="h-4 w-4 fill-current" />
                                                        <span className="ml-1 text-sm font-semibold">
                                                            {option}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs font-medium leading-5">
                                                        {getRatingLabel(question, option)}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                {question.type === "checkbox" || question.type === "yes_no" ? (
                                    <div className="mt-5 grid gap-3">
                                        {(question.options || []).map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                disabled={hasResponded || isExpired}
                                                onClick={() =>
                                                    setAnswers((current) => ({
                                                        ...current,
                                                        [question.id]: option,
                                                    }))
                                                }
                                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                                    answers[question.id] === option
                                                        ? "border-blue-400 bg-blue-50 text-blue-700"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`h-4 w-4 rounded-md border-2 ${
                                                        answers[question.id] === option
                                                            ? "border-blue-500 bg-blue-500"
                                                            : "border-slate-300"
                                                    }`}
                                                />
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}

                                {question.type === "multiple" ? (
                                    <div className="mt-5 grid gap-3">
                                        {(question.options || []).map((option) => (
                                            <label
                                                key={option}
                                                className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={option}
                                                    checked={Array.isArray(answers[question.id]) && answers[question.id].includes(option)}
                                                    onChange={(event) =>
                                                        updateCheckboxAnswer(
                                                            question.id,
                                                            option,
                                                            event.target.checked,
                                                        )
                                                    }
                                                    disabled={hasResponded || isExpired}
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                ) : null}
                            </section>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            type="button"
                            onClick={submitAnswers}
                            disabled={hasResponded || isExpired || isSubmitting || questions.length === 0}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? "Envoi..." : "Envoyer mes reponses"}
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
