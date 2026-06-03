import { useEffect, useMemo, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import Select2Single from "../../../Components/Select2Single";
import {
    CalendarDays,
    ChevronRight,
    Mail,
    Phone,
    Send,
    ShieldCheck,
    Star,
    UserSquare2,
    Users,
} from "lucide-react";
import { ToastContainer } from "../../../Components/Toast";
import useToast from "../../../Hooks/useToast";

function formatDate(dateString) {
    if (!dateString) {
        return "Non renseignee";
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

function normalizeGenreValue(value) {
    const normalized = String(value || "").trim().toUpperCase();

    if (["M", "H", "HOMME", "MASCULIN"].includes(normalized)) {
        return "M";
    }

    if (["F", "FEMME", "FEMININ", "FEMININE"].includes(normalized)) {
        return "F";
    }

    return "";
}

function ProfileItem({ label, value, icon: Icon }) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <div className="mt-2 break-words text-sm font-medium text-slate-800">
                {value || "Non renseigne"}
            </div>
        </div>
    );
}

export default function PublicSondageRespond({
    publicToken,
    survey,
    member,
    classe = null,
    hasResponded = false,
}) {
    const { errors = {}, flash = {} } = usePage().props;
    const [answers, setAnswers] = useState({});
    const [memberForm, setMemberForm] = useState({
        nom: member?.nom || "",
        prenom: member?.prenom || "",
        genre: normalizeGenreValue(member?.genre),
        email: member?.email || "",
        contact: member?.contact || "",
        date_naissance: member?.date_naissance || "",
        employment_status: member?.employment_status || "",
        profession_detail: member?.profession_detail || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toasts, removeToast, success: showSuccess, error: showError } = useToast();
    const lastSuccessRef = useRef(null);
    const lastErrorRef = useRef(null);
    const lastRespondedRef = useRef(false);

    const isExpired = survey?.statut === "Cloture";
    const questions = useMemo(
        () => (Array.isArray(survey?.questions) ? survey.questions : []),
        [survey],
    );

    const genreOptions = [
        { value: "", label: "Selectionner" },
        { value: "M", label: "Masculin" },
        { value: "F", label: "Feminin" },
    ];

    const employmentStatusOptions = [
        { value: "", label: "Selectionner" },
        { value: "TRAVAILLEUR", label: "Travailleur" },
        { value: "RETRAITE", label: "Retraite" },
        { value: "ETUDIANT", label: "Etudiant" },
        { value: "SANS_EMPLOI", label: "Sans emploi" },
    ];

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

    useEffect(() => {
        if (hasResponded && !lastRespondedRef.current) {
            lastRespondedRef.current = true;
            showSuccess("Ce membre a deja repondu a ce sondage.");
        }
    }, [hasResponded, showSuccess]);

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
        if (!publicToken) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/sondages/public/${publicToken}/reponses`,
            {
                answers,
                member: memberForm,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title={`${survey?.titre || "Sondage"} - Reponse publique`} />
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

            <div
                className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
                style={{
                    background:
                        "linear-gradient(135deg, #6B46C1 0%, #1E40AF 50%, #B6C01A 100%)",
                }}
            >
                <div className="w-full">
                    <div className="mb-6 text-white">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Reponse au sondage
                            </h1>
                            <p className="text-sm text-blue-100">
                                Votre fiche membre est verifiee puis le questionnaire s'affiche juste en dessous.
                            </p>
                        </div>
                    </div>

                    <section className="rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                        <div className="grid gap-6 xl:grid-cols-[300px,minmax(0,1fr)]">
                            <div className="min-w-0 rounded-[28px] bg-slate-50 p-5">
                                <div className="flex items-start gap-4">
                                    {member?.profile_photo_url ? (
                                        <img
                                            src={member.profile_photo_url}
                                            alt={`${member?.prenom || ""} ${member?.nom || ""}`.trim()}
                                            className="h-24 w-24 rounded-[24px] object-cover ring-4 ring-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500 ring-4 ring-white shadow-lg">
                                            <UserSquare2 className="h-10 w-10" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Membre identifie
                                        </p>
                                        <h2 className="mt-2 break-words text-2xl font-bold text-slate-900">
                                            {[memberForm?.prenom, memberForm?.nom].filter(Boolean).join(" ")}
                                        </h2>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 ring-1 ring-sky-200">
                                                {member?.code_famille || "Sans code famille"}
                                            </span>
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                                                {member?.code_membre || "Sans code membre"}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-600">
                                            Role: {member?.role || "Autres"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="min-w-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <UserSquare2 className="h-3.5 w-3.5" />
                                        Nom
                                    </div>
                                    <input
                                        value={memberForm.nom}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                nom: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.nom"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.nom"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <UserSquare2 className="h-3.5 w-3.5" />
                                        Prenom
                                    </div>
                                    <input
                                        value={memberForm.prenom}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                prenom: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.prenom"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.prenom"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <Users className="h-3.5 w-3.5" />
                                        Genre
                                    </div>
                                    <div className="mt-2">
                                        <Select2Single
                                            name="member.genre"
                                            value={memberForm.genre}
                                            onChange={(event) =>
                                                setMemberForm((current) => ({
                                                    ...current,
                                                    genre: event.target.value,
                                                }))
                                            }
                                            options={genreOptions}
                                            disabled={hasResponded || isExpired}
                                            placeholder="Selectionner"
                                            allowClearOption={false}
                                        />
                                    </div>
                                    {errors["member.genre"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.genre"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </div>
                                    <input
                                        type="email"
                                        value={memberForm.email}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.email"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.email"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <Phone className="h-3.5 w-3.5" />
                                        Contact
                                    </div>
                                    <input
                                        value={memberForm.contact}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                contact: event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 10),
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        inputMode="numeric"
                                        maxLength={10}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.contact"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.contact"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Date de naissance
                                    </div>
                                    <input
                                        type="date"
                                        value={memberForm.date_naissance}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                date_naissance: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.date_naissance"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.date_naissance"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Situation socio-pro
                                    </div>
                                    <div className="mt-2">
                                        <Select2Single
                                            name="member.employment_status"
                                            value={memberForm.employment_status}
                                            onChange={(event) =>
                                                setMemberForm((current) => ({
                                                    ...current,
                                                    employment_status: event.target.value,
                                                }))
                                            }
                                            options={employmentStatusOptions}
                                            disabled={hasResponded || isExpired}
                                            placeholder="Selectionner"
                                            allowClearOption={false}
                                        />
                                    </div>
                                    {errors["member.employment_status"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.employment_status"]}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        <Users className="h-3.5 w-3.5" />
                                        Profession detail
                                    </div>
                                    <input
                                        value={memberForm.profession_detail}
                                        onChange={(event) =>
                                            setMemberForm((current) => ({
                                                ...current,
                                                profession_detail: event.target.value,
                                            }))
                                        }
                                        disabled={hasResponded || isExpired}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                    />
                                    {errors["member.profession_detail"] ? (
                                        <p className="mt-2 text-sm text-rose-600">
                                            {errors["member.profession_detail"]}
                                        </p>
                                    ) : null}
                                </div>
                                <ProfileItem
                                    label="Role"
                                    value={member?.role || "Autres"}
                                    icon={ShieldCheck}
                                />
                                <ProfileItem
                                    label="Classe"
                                    value={classe?.nom || survey?.classe}
                                    icon={Users}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                                        {survey?.code || "Sans code"}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {survey?.statut}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4" />
                                        Cree le {formatDate(survey?.dateCreation)}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4" />
                                        Date de cloture: {formatDate(survey?.dateEcheance)}
                                    </span>
                                </div>
                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                                    {survey?.titre}
                                </h2>
                                <p className="mt-3 text-base leading-7 text-slate-600">
                                    {survey?.description || "Aucune description renseignee."}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Audience:{" "}
                                        <strong>{survey?.audience || "Non renseignee"}</strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Classe:{" "}
                                        <strong>
                                            {survey?.classe || classe?.nom || "Non renseignee"}
                                        </strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Createur:{" "}
                                        <strong>{survey?.createur || "Non renseigne"}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="w-full rounded-[24px] bg-slate-50 p-4 lg:w-[260px]">
                                <p className="text-sm font-semibold text-slate-900">
                                    Confidentialite
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    L'identification sert uniquement a verifier le membre. Les resultats du sondage restent anonymes dans les statistiques.
                                </p>
                            </div>
                        </div>
                    </section>

                    {isExpired ? (
                        <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            Ce sondage est expire. Vous ne pouvez plus soumettre de reponse.
                        </div>
                    ) : null}

                    <div className="mt-6 space-y-5">
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

                                {question.type === "checkbox" ||
                                question.type === "yes_no" ? (
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
                            disabled={
                                hasResponded ||
                                isExpired ||
                                isSubmitting ||
                                questions.length === 0
                            }
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
