import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Select2Single from "../../../Components/Select2Single";
import {
    ArrowLeft,
    CalendarDays,
    ChevronRight,
    Send,
    Star,
} from "lucide-react";
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

export default function ResponsableFamilleSondageShow({
    survey,
    classe = null,
    hasResponded = false,
    previewMode = false,
    publicMode = false,
    backHref = "/responsable-famille/sondages",
    headerTitle = "Repondre au sondage",
    headerSubtitle = null,
    badgeLabel = "Reponses anonymes",
    submitUrl = survey?.id
        ? `/responsable-famille/sondages/${survey.id}/reponses`
        : null,
    submitLabel = "Envoyer mes reponses",
    submitDisabled = false,
}) {
    const { errors = {}, flash = {} } = usePage().props;
    const [answers, setAnswers] = useState({});
    const [respondentProfile, setRespondentProfile] = useState({
        genre: "",
        role: "",
        employment_status: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toasts, removeToast, success: showSuccess } = useToast();
    const lastSuccessRef = useRef(null);

    const isExpired = !previewMode && survey?.statut === "Cloture";
    const questions = useMemo(
        () => (Array.isArray(survey?.questions) ? survey.questions : []),
        [survey],
    );

    const resolvedHeaderSubtitle =
        headerSubtitle ??
        (classe?.nom ? `Classe ${classe.nom}` : "Votre reponse reste anonyme.");

    const genreOptions = [
        { value: "", label: "Non renseigne" },
        { value: "Femmes", label: "Femmes" },
        { value: "Hommes", label: "Hommes" },
    ];

    const roleOptions = [
        { value: "", label: "Non renseigne" },
        { value: "Responsables de famille", label: "Responsables de famille" },
        { value: "Membres de famille", label: "Membres de famille" },
        { value: "Conducteurs", label: "Conducteurs" },
        { value: "Autres", label: "Autres" },
    ];

    const employmentStatusOptions = [
        { value: "", label: "Non renseignee" },
        { value: "Travailleurs", label: "Travailleurs" },
        { value: "Etudiants", label: "Etudiants" },
        { value: "Sans emploi", label: "Sans emploi" },
        { value: "Retraites", label: "Retraites" },
        { value: "Autres", label: "Autres" },
    ];

    useEffect(() => {
        if (flash?.success && flash.success !== lastSuccessRef.current) {
            lastSuccessRef.current = flash.success;
            showSuccess(flash.success);
        }
    }, [flash?.success, showSuccess]);

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
        if (previewMode || !submitUrl) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            submitUrl,
            { answers, respondentProfile },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title={`${survey?.titre || "Sondage"} - Reponse`} />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Link
                                href={backHref}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    {headerTitle}
                                </h1>
                                <p className="text-sm text-blue-100">
                                    {resolvedHeaderSubtitle}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white">
                            {badgeLabel}
                        </div>
                    </div>

                    <section className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    {survey?.code ? (
                                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold font-mono text-sky-700 ring-1 ring-sky-200">
                                            {survey.code}
                                        </span>
                                    ) : null}
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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
                                        Audience:{" "}
                                        <strong>{survey.audience || "Non renseignee"}</strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Classe:{" "}
                                        <strong>
                                            {survey.classe || classe?.nom || "Non renseignee"}
                                        </strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Createur:{" "}
                                        <strong>{survey.createur || "Non renseigne"}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="w-full rounded-[24px] bg-slate-50 p-4 lg:w-[260px]">
                                <p className="text-sm font-semibold text-slate-900">
                                    Confidentialite
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {publicMode
                                        ? "Le lien public ne demande pas de connexion. Aucun nom, email ou telephone n'apparaitra dans les resultats. Seules les informations statistiques que vous renseignez ici peuvent etre utilisees."
                                        : "Le systeme enregistre une participation anonyme. Aucun nom, email ou telephone n'apparaitra dans les resultats. Seules des statistiques globales de profil comme le genre, le role ou la situation socio-pro peuvent etre utilisees."}
                                </p>
                            </div>
                        </div>
                    </section>

                    {hasResponded && !previewMode ? (
                        <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                            {publicMode
                                ? "Une reponse anonyme a deja ete enregistree depuis cet appareil pour ce lien."
                                : "Votre reponse anonyme a deja ete enregistree pour ce sondage."}
                        </div>
                    ) : null}

                    {(errors.survey || errors.answers) && !previewMode ? (
                        <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            {errors.survey || errors.answers}
                        </div>
                    ) : null}

                    {isExpired ? (
                        <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            Ce sondage est expire. Vous ne pouvez plus soumettre de reponse.
                        </div>
                    ) : null}

                    {publicMode ? (
                        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Profil statistique
                                    </p>
                                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                        Quelques informations anonymes
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Ces champs restent non nominaux et servent uniquement aux repartitions statistiques.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Genre
                                    </label>
                                    <Select2Single
                                        name="respondentProfile.genre"
                                        value={respondentProfile.genre}
                                        onChange={(event) =>
                                            setRespondentProfile((current) => ({
                                                ...current,
                                                genre: event.target.value,
                                            }))
                                        }
                                        options={genreOptions}
                                        disabled={hasResponded || isExpired || previewMode}
                                        placeholder="Non renseigne"
                                        allowClearOption={false}
                                    />
                                    {errors["respondentProfile.genre"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["respondentProfile.genre"]}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Role
                                    </label>
                                    <Select2Single
                                        name="respondentProfile.role"
                                        value={respondentProfile.role}
                                        onChange={(event) =>
                                            setRespondentProfile((current) => ({
                                                ...current,
                                                role: event.target.value,
                                            }))
                                        }
                                        options={roleOptions}
                                        disabled={hasResponded || isExpired || previewMode}
                                        placeholder="Non renseigne"
                                        allowClearOption={false}
                                    />
                                    {errors["respondentProfile.role"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["respondentProfile.role"]}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Situation socio-pro
                                    </label>
                                    <Select2Single
                                        name="respondentProfile.employment_status"
                                        value={respondentProfile.employment_status}
                                        onChange={(event) =>
                                            setRespondentProfile((current) => ({
                                                ...current,
                                                employment_status: event.target.value,
                                            }))
                                        }
                                        options={employmentStatusOptions}
                                        disabled={hasResponded || isExpired || previewMode}
                                        placeholder="Non renseignee"
                                        allowClearOption={false}
                                    />
                                    {errors["respondentProfile.employment_status"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["respondentProfile.employment_status"]}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </section>
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
                                        disabled={hasResponded || isExpired || previewMode}
                                        rows={4}
                                        className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        placeholder="Votre reponse..."
                                    />
                                ) : null}

                                {question.type === "rating" ? (
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        {(question.options || []).map((option, optionIndex) => {
                                            const isActive =
                                                answers[question.id] === option;

                                            return (
                                                <button
                                                    key={`${question.id}-${optionIndex}`}
                                                    type="button"
                                                    disabled={hasResponded || isExpired || previewMode}
                                                    onClick={() =>
                                                        setAnswers((current) => ({
                                                            ...current,
                                                            [question.id]: option,
                                                        }))
                                                    }
                                                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                                                        isActive
                                                            ? "border-amber-500 bg-amber-50 text-amber-600"
                                                            : "border-slate-200 bg-white text-slate-400 hover:border-amber-300"
                                                    }`}
                                                >
                                                    <Star className="h-4 w-4 fill-current" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                {question.type === "checkbox" ||
                                question.type === "yes_no" ? (
                                    <div className="mt-5 grid gap-3">
                                        {(question.options || []).map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                disabled={hasResponded || isExpired || previewMode}
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
                                                    disabled={hasResponded || isExpired || previewMode}
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
                            disabled={
                                hasResponded ||
                                isExpired ||
                                isSubmitting ||
                                questions.length === 0 ||
                                previewMode ||
                                submitDisabled
                            }
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? "Envoi..." : submitLabel}
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
