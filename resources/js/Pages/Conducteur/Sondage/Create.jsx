import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    CheckSquare,
    ChevronDown,
    ClipboardList,
    Copy,
    Eye,
    FileText,
    GripVertical,
    ListChecks,
    MessageSquare,
    Plus,
    Settings2,
    Share2,
    Sparkles,
    Star,
    Target,
    Trash2,
    Users,
} from "lucide-react";
import { ToastContainer } from "../../../Components/Toast";
import useToast from "../../../Hooks/useToast";

const questionTypeOptions = [
    {
        value: "multiple",
        label: "Choix multiples",
        icon: ListChecks,
        hint: "Permet plusieurs reponses dans une seule question.",
    },
    {
        value: "checkbox",
        label: "Choix unique",
        icon: CheckSquare,
        hint: "Une seule reponse possible, avec un rendu en cases a cocher.",
    },
    {
        value: "rating",
        label: "Echelle",
        icon: BarChart3,
        hint: "Parfait pour mesurer un niveau de satisfaction.",
    },
    {
        value: "text",
        label: "Reponse libre",
        icon: MessageSquare,
        hint: "Recueille des avis detailles et qualitatifs.",
    },
    {
        value: "yes_no",
        label: "Oui / Non",
        icon: CheckSquare,
        hint: "Excellent pour valider une decision simple.",
    },
];

const ratingScaleLabels = {
    1: "Tres insatisfait",
    2: "Insatisfait",
    3: "Neutre",
    4: "Satisfait",
    5: "Tres satisfait",
};

function createQuestion(type = "multiple", title = "") {
    const defaults = {
        multiple: ["Option 1"],
        checkbox: ["Option 1"],
        rating: ["1", "2", "3", "4", "5"],
        text: [],
        yes_no: ["Oui", "Non"],
    };

    return {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        title: title || "Nouvelle question",
        required: true,
        options: defaults[type] || [],
        scaleLabels: type === "rating" ? ratingScaleLabels : undefined,
    };
}

function fieldClasses() {
    return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
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

export default function ConducteurSondageCreate({
    authUser = null,
    existingSurvey = null,
    mode = "create",
}) {
    const isEditing = mode === "edit" && existingSurvey?.id;
    const isDraftSurvey = existingSurvey?.statut === "draft";

    const [survey, setSurvey] = useState({
        titre: existingSurvey?.titre || "",
        description: existingSurvey?.description || "",
        objectif: existingSurvey?.objectif || "",
        audience: existingSurvey?.audience || "Tous les membres",
        dateEcheance: existingSurvey?.dateEcheance || "",
        messageFin:
            existingSurvey?.messageFin ||
            "Merci pour votre participation. Vos reponses aideront a la prise de decision.",
        diffusion: existingSurvey?.diffusion || "Lien partage",
    });

    const [questions, setQuestions] = useState(existingSurvey?.questions || []);
    const [activeId, setActiveId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const { toasts, removeToast, error: showError } = useToast();
    const lastErrorKeyRef = useRef(null);

    useEffect(() => {
        const errorKeys = Object.keys(formErrors);

        if (errorKeys.length === 0) {
            lastErrorKeyRef.current = null;
            return;
        }

        const currentKey = JSON.stringify(errorKeys.sort());

        if (currentKey !== lastErrorKeyRef.current) {
            lastErrorKeyRef.current = currentKey;
            showError(
                "Certains champs du sondage doivent etre corriges avant l'enregistrement.",
            );
        }
    }, [formErrors, showError]);

    const addQuestion = (type = "multiple", title = "") => {
        const question = createQuestion(type, title);
        setQuestions((prev) => [...prev, question]);
        setActiveId(question.id);
    };

    const updateQuestion = (id, updates) => {
        setQuestions((prev) =>
            prev.map((question) =>
                question.id === id ? { ...question, ...updates } : question,
            ),
        );
    };

    const removeQuestion = (id) => {
        setQuestions((prev) => prev.filter((question) => question.id !== id));
        setActiveId((current) => (current === id ? null : current));
    };

    const duplicateQuestion = (id) => {
        setQuestions((prev) => {
            const index = prev.findIndex((question) => question.id === id);

            if (index === -1) {
                return prev;
            }

            const clone = {
                ...prev[index],
                id: `${prev[index].type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                options: [...prev[index].options],
            };

            const next = [...prev];
            next.splice(index + 1, 0, clone);
            return next;
        });
    };

    const updateOption = (questionId, index, value) => {
        setQuestions((prev) =>
            prev.map((question) => {
                if (question.id !== questionId) {
                    return question;
                }

                const nextOptions = [...question.options];
                nextOptions[index] = value;

                return { ...question, options: nextOptions };
            }),
        );
    };

    const addOption = (questionId) => {
        setQuestions((prev) =>
            prev.map((question) =>
                question.id === questionId
                    ? {
                          ...question,
                          options: [
                              ...question.options,
                              `Option ${question.options.length + 1}`,
                          ],
                      }
                    : question,
            ),
        );
    };

    const totalRequired = useMemo(
        () => questions.filter((question) => question.required).length,
        [questions],
    );

    const creatorName =
        [authUser?.prenom, authUser?.nom].filter(Boolean).join(" ") ||
        "Conducteur";

    const savePreviewDraft = () => {
        if (typeof window === "undefined") {
            return;
        }

        const previewBackHref = isEditing
            ? `/conducteur/sondages/${existingSurvey.id}/edit`
            : "/conducteur/sondages/create";

        window.localStorage.setItem(
            "conducteur-sondage-preview",
            JSON.stringify({
                survey,
                questions,
                creatorName,
                totalRequired,
                previewBackHref,
            }),
        );
    };

    const submitSurvey = (mode) => {
        savePreviewDraft();
        setIsSubmitting(true);
        setFormErrors({});

        const payload = {
            surveyId: existingSurvey?.id || null,
            ...survey,
            questions,
            mode,
        };

        const options = {
            preserveScroll: true,
            onError: (errors) => {
                setFormErrors(errors);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                if (typeof window !== "undefined") {
                    window.localStorage.removeItem(
                        "conducteur-sondage-preview",
                    );
                }
            },
            onFinish: () => setIsSubmitting(false),
        };

        if (isEditing) {
            router.put(
                withBasePath("", `/conducteur/sondages/${existingSurvey.id}`),
                payload,
                options,
            );
            return;
        }

        router.post(withBasePath("", "/conducteur/sondages"), payload, options);
    };

    return (
        <>
            <Head
                title={`${isEditing ? "Modifier" : "Nouveau"} sondage - Conducteur`}
            />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <Link
                                href={withBasePath("", "/conducteur/sondages")}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    {isEditing
                                        ? "Modifier le sondage"
                                        : "Nouveau sondage"}
                                </h1>
                                <p className="text-sm text-blue-100">
                                    {isEditing
                                        ? "Reprenez votre questionnaire a l'endroit ou vous l'avez laisse."
                                        : "Construisez un questionnaire clair, engageant et facile a analyser."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/conducteur/sondages/preview/${isEditing ? existingSurvey.id : "new"}`}
                                onClick={savePreviewDraft}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                                <Eye className="h-4 w-4" />
                                Apercu
                            </Link>
                            <button
                                type="button"
                                onClick={() => submitSurvey("draft")}
                                disabled={isSubmitting}
                                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                                {isEditing
                                    ? "Mettre a jour le brouillon"
                                    : "Enregistrer brouillon"}
                            </button>
                            <button
                                type="button"
                                onClick={() => submitSurvey("publish")}
                                disabled={isSubmitting}
                                className="rounded-lg bg-[#B6C01A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#a4ae17]"
                            >
                                {isSubmitting
                                    ? "Publication..."
                                    : isEditing
                                      ? isDraftSurvey
                                          ? "Publier le sondage"
                                          : "Mettre a jour le sondage"
                                      : "Publier le sondage"}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-6">
                            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.10)] sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                                            Structure
                                        </p>
                                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                            Informations du sondage
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                                            Les meilleurs outils de creation de
                                            sondage privilegient un objectif
                                            net, un contexte simple et une
                                            promesse de reponse courte. Les
                                            reponses sont anonymes pour tous les
                                            participants.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Titre du sondage
                                        </label>
                                        <input
                                            value={survey.titre}
                                            onChange={(event) =>
                                                setSurvey((prev) => ({
                                                    ...prev,
                                                    titre: event.target.value,
                                                }))
                                            }
                                            placeholder="Ex: Satisfaction apres la retraite spirituelle"
                                            className={fieldClasses()}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={survey.description}
                                            onChange={(event) =>
                                                setSurvey((prev) => ({
                                                    ...prev,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            rows={4}
                                            placeholder="Expliquez en quelques lignes ce que vous cherchez a comprendre."
                                            className={fieldClasses()}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Date de cloture
                                        </label>
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                value={survey.dateEcheance}
                                                onChange={(event) =>
                                                    setSurvey((prev) => ({
                                                        ...prev,
                                                        dateEcheance:
                                                            event.target.value,
                                                    }))
                                                }
                                                className={`${fieldClasses()} pl-11`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Public cible
                                        </label>
                                        <div className="relative">
                                            <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <select
                                                value={survey.audience}
                                                onChange={(event) =>
                                                    setSurvey((prev) => ({
                                                        ...prev,
                                                        audience:
                                                            event.target.value,
                                                    }))
                                                }
                                                className={`${fieldClasses()} appearance-none pl-11`}
                                            >
                                                <option>
                                                    Responsables de famille
                                                </option>
                                                <option>
                                                    Conducteurs de classe
                                                </option>
                                                <option>
                                                    Membres de famille
                                                </option>
                                                <option>
                                                    Tous les membres
                                                </option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.10)] sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
                                            Questionnaire
                                        </p>
                                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                                            Questions du sondage
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {questionTypeOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() =>
                                                    addQuestion(option.value)
                                                }
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                + {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    {questions.length === 0 ? (
                                        <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
                                            <p className="text-base font-semibold text-slate-800">
                                                Aucune question pour le moment
                                            </p>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Ajoutez un type de question pour
                                                commencer la construction du
                                                sondage.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addQuestion("multiple")
                                                }
                                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Ajouter une premiere question
                                            </button>
                                        </div>
                                    ) : null}
                                    {questions.map((question, index) => {
                                        const isActive =
                                            activeId === question.id;
                                        const currentType =
                                            questionTypeOptions.find(
                                                (option) =>
                                                    option.value ===
                                                    question.type,
                                            ) || questionTypeOptions[0];
                                        const CurrentIcon = currentType.icon;

                                        return (
                                            <div
                                                key={question.id}
                                                onClick={() =>
                                                    setActiveId(question.id)
                                                }
                                                className={`overflow-hidden rounded-[26px] border transition-all ${
                                                    isActive
                                                        ? "border-slate-300 bg-white shadow-md"
                                                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                                                }`}
                                            >
                                                <div
                                                    className={`h-1.5 w-full ${
                                                        isActive
                                                            ? "bg-slate-200"
                                                            : "bg-transparent"
                                                    }`}
                                                />
                                                <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                                                            {String(
                                                                index + 1,
                                                            ).padStart(2, "0")}
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                                Bloc de question
                                                            </p>
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {
                                                                    currentType.label
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="h-4 w-4 text-slate-400" />
                                                        <div className="rounded-2xl bg-white p-2 text-slate-700 ring-1 ring-slate-200">
                                                            <CurrentIcon className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-5">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                        <div className="flex-1">
                                                            <input
                                                                value={
                                                                    question.title
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateQuestion(
                                                                        question.id,
                                                                        {
                                                                            title: event
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder={`Question ${index + 1}`}
                                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                                                            />
                                                        </div>

                                                        <div className="relative md:w-[220px]">
                                                            <select
                                                                value={
                                                                    question.type
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateQuestion(
                                                                        question.id,
                                                                        {
                                                                            type: event
                                                                                .target
                                                                                .value,
                                                                            options:
                                                                                event
                                                                                    .target
                                                                                    .value ===
                                                                                "rating"
                                                                                    ? [
                                                                                          "1",
                                                                                          "2",
                                                                                          "3",
                                                                                          "4",
                                                                                          "5",
                                                                                      ]
                                                                                    : event
                                                                                            .target
                                                                                            .value ===
                                                                                        "text"
                                                                                      ? []
                                                                                      : event
                                                                                              .target
                                                                                              .value ===
                                                                                          "yes_no"
                                                                                        ? [
                                                                                              "Oui",
                                                                                              "Non",
                                                                                          ]
                                                                                        : [
                                                                                              "Option 1",
                                                                                          ],
                                                                            scaleLabels:
                                                                                event
                                                                                    .target
                                                                                    .value ===
                                                                                "rating"
                                                                                    ? ratingScaleLabels
                                                                                    : undefined,
                                                                        },
                                                                    )
                                                                }
                                                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                                                            >
                                                                {questionTypeOptions.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                option.value
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                            <CurrentIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-4">
                                                        {question.type ===
                                                        "text" ? (
                                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm italic text-slate-400">
                                                                Champ de reponse
                                                                libre...
                                                            </div>
                                                        ) : question.type ===
                                                          "rating" ? (
                                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                                                {question.options.map(
                                                                    (
                                                                        option,
                                                                        optionIndex,
                                                                    ) => (
                                                                        <div
                                                                            key={`${question.id}-${optionIndex}`}
                                                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center transition hover:border-amber-300 hover:bg-amber-50"
                                                                        >
                                                                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                                                                                <Star className="h-4 w-4 fill-current" />
                                                                                <span className="ml-1 text-sm font-semibold">
                                                                                    {
                                                                                        option
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                                                                                {question
                                                                                    .scaleLabels?.[
                                                                                    option
                                                                                ] ||
                                                                                    ratingScaleLabels[
                                                                                        option
                                                                                    ]}
                                                                            </p>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="grid gap-2">
                                                                {question.options.map(
                                                                    (
                                                                        option,
                                                                        optionIndex,
                                                                    ) => (
                                                                        <div
                                                                            key={`${question.id}-${optionIndex}`}
                                                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                                        >
                                                                            <div
                                                                                className={`h-5 w-5 shrink-0 border-2 border-slate-300 ${
                                                                                    question.type ===
                                                                                    "checkbox"
                                                                                        ? "rounded-md"
                                                                                        : "rounded-full"
                                                                                }`}
                                                                            />
                                                                            <input
                                                                                value={
                                                                                    option
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    updateOption(
                                                                                        question.id,
                                                                                        optionIndex,
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className="flex-1 border-0 bg-transparent px-0 text-sm text-slate-700 outline-none"
                                                                            />
                                                                            {question
                                                                                .options
                                                                                .length >
                                                                                1 &&
                                                                            question.type !==
                                                                                "yes_no" ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        updateQuestion(
                                                                                            question.id,
                                                                                            {
                                                                                                options:
                                                                                                    question.options.filter(
                                                                                                        (
                                                                                                            _,
                                                                                                            currentIndex,
                                                                                                        ) =>
                                                                                                            currentIndex !==
                                                                                                            optionIndex,
                                                                                                    ),
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            ) : null}
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {question.type !==
                                                                    "yes_no" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            addOption(
                                                                                question.id,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                        Ajouter
                                                                        une
                                                                        option
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-slate-500">
                                                            {currentType.hint}
                                                        </p>
                                                    </div>

                                                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                duplicateQuestion(
                                                                    question.id,
                                                                )
                                                            }
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                                            title="Dupliquer"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeQuestion(
                                                                    question.id,
                                                                )
                                                            }
                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <label className="ml-2 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                                                            Obligatoire
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateQuestion(
                                                                        question.id,
                                                                        {
                                                                            required:
                                                                                !question.required,
                                                                        },
                                                                    )
                                                                }
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                                    question.required
                                                                        ? "bg-amber-500"
                                                                        : "bg-slate-300"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                                                        question.required
                                                                            ? "translate-x-6"
                                                                            : "translate-x-1"
                                                                    }`}
                                                                />
                                                            </button>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {questions.length > 0 ? (
                                        <div className="flex justify-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addQuestion("multiple")
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Ajouter une question
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </section>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => submitSurvey("publish")}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#B6C01A] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#a4ae17] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Share2 className="h-4 w-4" />
                                    {isSubmitting
                                        ? "Publication..."
                                        : isEditing
                                          ? isDraftSurvey
                                              ? "Publier le sondage"
                                              : "Mettre a jour le sondage"
                                          : "Publier le sondage"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
