import { Head, Link } from "@inertiajs/react";
import Select2Single from "../../../Components/Select2Single";
import { useMemo, useState } from "react";
import { withBasePath } from "../../../Utils/urlHelper";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Filter,
    Share2,
    Users,
} from "lucide-react";
import {
    Bar,
    BarChart,
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    LabelList,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
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
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsedDate);
}

function formatShortDate(dateString) {
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

function getStatusClasses(statut) {
    if (statut === "Actif") {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (statut === "Cloture") {
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function questionTypeLabel(type) {
    if (type === "multiple") return "Choix multiples";
    if (type === "checkbox") return "Choix unique";
    if (type === "rating") return "Evaluation";
    if (type === "yes_no") return "Oui / Non";
    return "Reponse libre";
}

function responseStateLabel(value) {
    if (value === "with_answers") return "Avec reponses";
    if (value === "without_answers") return "Sans reponse";
    return "Toutes";
}

function clampLabel(value, size = 20) {
    if (!value) {
        return "Sans titre";
    }

    return value.length > size ? `${value.slice(0, size - 1)}...` : value;
}

function normalizeDay(dateString) {
    if (!dateString) {
        return null;
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate.toISOString().slice(0, 10);
}

function formatDayLabel(dateString) {
    if (!dateString) {
        return "Date inconnue";
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
    }).format(parsedDate);
}

function formatWeekLabel(dateString) {
    if (!dateString) {
        return "Periode inconnue";
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    const start = new Date(parsedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    return `Sem. ${new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
    }).format(start)}`;
}

function getWeekKey(dateString) {
    if (!dateString) {
        return null;
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    const start = new Date(parsedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    return start.toISOString().slice(0, 10);
}

function ChartCard({ title, subtitle, children, tone = "white" }) {
    return (
        <div
            className={`group relative overflow-hidden rounded-[32px] border border-white/75 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_95px_rgba(15,23,42,0.18)] ${tone}`}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/40 blur-3xl transition duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_34%)] opacity-90" />
            <div className="absolute inset-x-8 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_70%)]" />
            <div className="relative">
                <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                        {title}
                    </h3>
                </div>
            </div>
            {subtitle ? (
                <p className="relative mt-1 text-sm leading-6 text-slate-500">
                    {subtitle}
                </p>
            ) : null}
            <div className="relative mt-5">{children}</div>
        </div>
    );
}

function EmptyChartState({ message }) {
    return (
        <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-sm text-slate-500">
            {message}
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="min-w-[170px] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
            {label ? (
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {label}
                </div>
            ) : null}
            <div className="space-y-2">
                {payload.map((entry) => (
                    <div
                        key={`${entry.name}-${entry.value}`}
                        className="flex items-center justify-between gap-4 text-sm"
                    >
                        <div className="flex items-center gap-2 text-slate-700">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}
                        </div>
                        <span className="font-semibold text-slate-900">
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PieSlicePercentageLabel({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}) {
    if (!percent) {
        return null;
    }

    const isSmallSlice = percent < 0.06;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isSmallSlice ? 10 : 12}
            fontWeight={700}
        >
            {`${Math.round(percent * 100)}%`}
        </text>
    );
}

function BarPercentageLabel(props) {
    const { x, y, width, height, value, payload } = props;

    if (!width || !height) {
        return null;
    }

    const isSmallBar = width < 36;

    return (
        <text
            x={Math.max(x + width / 2, x + 12)}
            y={y + height / 2}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isSmallBar ? 10 : 12}
            fontWeight={700}
        >
            {`${payload?.percentage ?? value}%`}
        </text>
    );
}

function SummaryPill({ label, value, tone }) {
    return (
        <div className={`rounded-2xl px-4 py-3 ${tone}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {value}
            </div>
        </div>
    );
}

function ChartLegendList({ items = [] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">
                            {item.value}
                        </div>
                        {item.meta ? (
                            <div className="text-[11px] text-slate-500">
                                {item.meta}
                            </div>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getProfileValue(profile = {}, key) {
    const rawValue = profile?.[key];

    if (rawValue) {
        return rawValue;
    }

    if (key === "role") {
        return "Autres";
    }

    if (key === "employment_status") {
        return "Non renseignee";
    }

    if (key === "tranche_age") {
        return "Non renseignee";
    }

    return "Non renseigne";
}

function buildQuestionStats(questions = [], responses = []) {
    return (questions || []).map((question, index) => {
        const questionId = question?.id || `question-${index}`;
        const questionType = question?.type || "text";
        const options = (question?.options || []).filter(
            (option) => option !== null && option !== "",
        );

        const answerValues = (responses || [])
            .map((response) => response?.answers?.[questionId] ?? null)
            .filter(
                (value) =>
                    !(
                        value === null ||
                        value === "" ||
                        (Array.isArray(value) && value.length === 0)
                    ),
            );

        let optionStats = [];

        if (["checkbox", "yes_no", "rating"].includes(questionType)) {
            optionStats = options.map((option) => {
                const count = answerValues.filter(
                    (value) => value === option,
                ).length;
                const total = answerValues.length;

                return {
                    label: option,
                    count,
                    percentage:
                        total > 0 ? Math.round((count / total) * 100) : 0,
                };
            });
        }

        if (questionType === "multiple") {
            optionStats = options.map((option) => {
                const count = answerValues.filter(
                    (value) => Array.isArray(value) && value.includes(option),
                ).length;
                const total = answerValues.length;

                return {
                    label: option,
                    count,
                    percentage:
                        total > 0 ? Math.round((count / total) * 100) : 0,
                };
            });
        }

        const textAnswers = answerValues
            .map((value) =>
                Array.isArray(value) ? value.join(", ") : String(value),
            )
            .filter((value) => value.trim() !== "");

        return {
            id: questionId,
            title: question?.title || "Question sans titre",
            type: questionType,
            required: Boolean(question?.required),
            options,
            answersCount: answerValues.length,
            optionStats,
            textAnswers,
        };
    });
}

function buildProfileSections(responses = []) {
    const sections = [
        {
            key: "genre",
            title: "Repartition par genre",
            subtitle:
                "Vue anonyme des repondants selon le genre renseigne sur leur compte.",
        },
        {
            key: "employment_status",
            title: "Repartition socio-pro",
            subtitle:
                "Situation socio-professionnelle des repondants, sans information nominative.",
        },
        {
            key: "tranche_age",
            title: "Repartition par tranche d'age",
            subtitle:
                "Lecture anonyme des participations selon la tranche d'age des repondants.",
        },
    ];

    const palette = [
        "#2563eb",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#0f766e",
    ];

    return sections.map((section) => {
        const counts = new Map();

        (responses || []).forEach((response) => {
            const label = getProfileValue(response?.profile, section.key);
            counts.set(label, (counts.get(label) || 0) + 1);
        });

        const total = Array.from(counts.values()).reduce(
            (sum, count) => sum + count,
            0,
        );
        const items = Array.from(counts.entries())
            .sort((left, right) => right[1] - left[1])
            .map(([label, count], index) => ({
                label,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                color: palette[index % palette.length],
            }));

        return {
            ...section,
            items,
        };
    });
}

function getResponseAnswerCount(response = {}) {
    return Object.values(response?.answers || {}).filter((value) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return !(value === null || value === "");
    }).length;
}

function hasAnswerForQuestion(response = {}, questionId) {
    const value = response?.answers?.[questionId];

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return !(value === null || value === "");
}

export default function AdminSondageShow({
    survey,
    responses = [],
    exportUrl = null,
}) {
    const [questionFilter, setQuestionFilter] = useState("all");
    const [responseFilter, setResponseFilter] = useState("all");
    const [profileChartMode, setProfileChartMode] = useState("bar");
    const { toasts, removeToast, success: showSuccess } = useToast();

    const copyPublicLink = async () => {
        if (!survey?.publicUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(survey.publicUrl);
            showSuccess("Lien public copie.");
        } catch {
            showSuccess(
                "Copie impossible automatiquement. Vous pouvez copier le lien manuellement.",
            );
        }
    };

    const computedResponseStats = useMemo(
        () => buildQuestionStats(survey?.questions || [], responses || []),
        [responses, survey],
    );

    const questionOptions = useMemo(() => {
        return (computedResponseStats || []).map((question) => ({
            value: question.id,
            label: question.title || "Question sans titre",
        }));
    }, [computedResponseStats]);

    const filteredResponses = useMemo(() => {
        return (responses || []).filter((response) => {
            const hasMatchingAnswer =
                questionFilter === "all"
                    ? getResponseAnswerCount(response) > 0
                    : hasAnswerForQuestion(response, questionFilter);

            if (questionFilter !== "all" && !hasMatchingAnswer) {
                return false;
            }

            if (responseFilter === "with_answers") {
                return hasMatchingAnswer;
            }

            if (responseFilter === "without_answers") {
                return !hasMatchingAnswer;
            }

            return true;
        });
    }, [questionFilter, responseFilter, responses]);

    const computedProfileStats = useMemo(
        () => buildProfileSections(filteredResponses),
        [filteredResponses],
    );

    const filteredResponseStats = useMemo(() => {
        return (computedResponseStats || []).filter((question) => {
            if (questionFilter !== "all" && question.id !== questionFilter) {
                return false;
            }

            if (
                responseFilter === "with_answers" &&
                question.answersCount === 0
            ) {
                return false;
            }

            if (
                responseFilter === "without_answers" &&
                question.answersCount > 0
            ) {
                return false;
            }

            return true;
        });
    }, [computedResponseStats, questionFilter, responseFilter]);

    const globalTypeStats = useMemo(() => {
        const totals = new Map();

        (filteredResponseStats || []).forEach((question) => {
            const key = question.type || "text";
            const current = totals.get(key) || {
                type: key,
                label: questionTypeLabel(key),
                questions: 0,
                answers: 0,
            };

            current.questions += 1;
            current.answers += Number(question.answersCount || 0);
            totals.set(key, current);
        });

        const result = Array.from(totals.values());
        const maxAnswers = Math.max(...result.map((item) => item.answers), 0);

        return result.map((item) => ({
            ...item,
            width:
                maxAnswers > 0
                    ? Math.max(
                          12,
                          Math.round((item.answers / maxAnswers) * 100),
                      )
                    : 0,
        }));
    }, [filteredResponseStats]);

    const donutTypeStats = useMemo(() => {
        const palette = [
            { color: "#2563eb" },
            { color: "#10b981" },
            { color: "#f59e0b" },
            { color: "#8b5cf6" },
            { color: "#ef4444" },
        ];

        return globalTypeStats.map((item, index) => ({
            label: item.label,
            value: item.answers,
            color: palette[index % palette.length].color,
            meta: `${item.questions} question(s)`,
        }));
    }, [globalTypeStats]);

    const filteredCategoryStats = useMemo(() => {
        const categoryMap = new Map();

        filteredResponseStats.forEach((question) => {
            (question.optionStats || []).forEach((option) => {
                const key = option.label || "Option";
                const current = categoryMap.get(key) || {
                    label: key,
                    count: 0,
                };

                current.count += Number(option.count || 0);
                categoryMap.set(key, current);
            });
        });

        const sorted = Array.from(categoryMap.values()).sort(
            (a, b) => b.count - a.count,
        );
        const primary = sorted.slice(0, 6);
        const othersCount = sorted
            .slice(6)
            .reduce((sum, item) => sum + Number(item.count || 0), 0);
        const result =
            othersCount > 0
                ? [...primary, { label: "Autres", count: othersCount }]
                : primary;
        const maxCount = Math.max(...result.map((item) => item.count), 0);

        return result.map((item) => ({
            ...item,
            width:
                maxCount > 0
                    ? Math.max(12, Math.round((item.count / maxCount) * 100))
                    : 0,
        }));
    }, [filteredResponseStats]);

    const submissionTrend = useMemo(() => {
        const grouped = new Map();
        const datedResponses = filteredResponses.filter((response) =>
            Boolean(normalizeDay(response.submittedAt)),
        );
        const useWeeklyAggregation = datedResponses.length > 90;

        datedResponses.forEach((response) => {
            const dayKey = useWeeklyAggregation
                ? getWeekKey(response.submittedAt)
                : normalizeDay(response.submittedAt);

            if (!dayKey) {
                return;
            }

            grouped.set(dayKey, (grouped.get(dayKey) || 0) + 1);
        });

        const result = Array.from(grouped.entries())
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([day, count]) => ({
                day,
                count,
            }));

        const maxCount = Math.max(...result.map((item) => item.count), 0);

        return result.map((item) => ({
            ...item,
            height:
                maxCount > 0
                    ? Math.max(16, Math.round((item.count / maxCount) * 100))
                    : 0,
            mode: useWeeklyAggregation ? "week" : "day",
        }));
    }, [filteredResponses]);

    const categoryChartData = useMemo(
        () =>
            filteredCategoryStats.map((item) => ({
                label: item.label,
                shortLabel: clampLabel(item.label, 18),
                votes: item.count,
            })),
        [filteredCategoryStats],
    );

    const trendChartData = useMemo(() => {
        let cumulative = 0;

        return submissionTrend.map((item) => {
            cumulative += item.count;

            return {
                day:
                    item.mode === "week"
                        ? formatWeekLabel(item.day)
                        : formatDayLabel(item.day),
                soumissions: item.count,
                cumul: cumulative,
            };
        });
    }, [submissionTrend]);

    const profileDistributionCards = useMemo(
        () =>
            (computedProfileStats || []).map((section) => ({
                ...section,
                chartData: (section.items || []).map((item) => ({
                    label: item.label,
                    shortLabel: clampLabel(item.label, 18),
                    count: item.count,
                    percentage: item.percentage,
                    color: item.color,
                })),
            })),
        [computedProfileStats],
    );

    const surveySummary = useMemo(() => {
        const totalResponses = Number(survey?.reponses || 0);
        const totalParticipants = Number(survey?.participants || 0);
        const participationRate = Number(survey?.tauxParticipation || 0);
        const totalQuestions = Array.isArray(survey?.questions)
            ? survey.questions.length
            : 0;
        const totalAnswers = (computedResponseStats || []).reduce(
            (sum, item) => sum + Number(item.answersCount || 0),
            0,
        );
        const averageAnswersPerQuestion =
            totalQuestions > 0
                ? (totalAnswers / totalQuestions).toFixed(1)
                : "0";

        return {
            totalResponses,
            totalParticipants,
            participationRate,
            totalQuestions,
            totalAnswers,
            averageAnswersPerQuestion,
        };
    }, [computedResponseStats, survey]);

    return (
        <>
            <Head title={`${survey?.titre || "Sondage"} - Reponses`} />
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
                                href={withBasePath("", "/admin/sondages")}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    Reponses du sondage
                                </h1>
                                <p className="text-sm text-blue-100">
                                    Consultez les resultats anonymes de votre
                                    classe.
                                </p>
                            </div>
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
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(survey?.statut)}`}
                                    >
                                        {survey?.statut}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <CalendarDays className="h-4 w-4" />
                                        Cree le{" "}
                                        {formatShortDate(survey?.dateCreation)}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                        <Clock3 className="h-4 w-4" />
                                        Date de cloture:{" "}
                                        {formatShortDate(survey?.dateEcheance)}
                                    </span>
                                </div>

                                {survey?.statut === "Cloture" ? (
                                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Le sondage est cloture, mais
                                        l'historique des reponses reste
                                        disponible pour consultation.
                                    </div>
                                ) : null}

                                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                                    {survey?.titre}
                                </h2>
                                <p className="mt-3 text-base leading-7 text-slate-600">
                                    {survey?.description ||
                                        "Aucune description renseignee."}
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Audience:{" "}
                                        <strong>
                                            {survey?.audience ||
                                                "Non renseignee"}
                                        </strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Classe:{" "}
                                        <strong>
                                            {survey?.classe || "Non renseignee"}
                                        </strong>
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                                        Createur:{" "}
                                        <strong>
                                            {survey?.createur ||
                                                "Non renseigne"}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            <div className="flex w-full flex-wrap justify-start gap-3 lg:w-auto lg:justify-end">
                                {exportUrl ? (
                                    <a
                                        href={exportUrl}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
                                    >
                                        Exporter le rapport
                                    </a>
                                ) : null}

                                {survey?.publicUrl ? (
                                    <button
                                        type="button"
                                        onClick={copyPublicLink}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        Copier le lien
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.92)_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Participation
                                    </p>
                                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                                        {surveySummary.totalResponses} /{" "}
                                        {surveySummary.totalParticipants}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Membres ayant repondu sur l'ensemble de
                                        la classe.
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-blue-50 text-blue-700 shadow-lg ring-1 ring-black/5">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-5 rounded-[22px] bg-slate-900 px-4 py-4 text-white">
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                                            Taux de participation
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {surveySummary.participationRate}%
                                        </p>
                                    </div>
                                    <div className="text-right text-sm text-slate-300">
                                        {surveySummary.totalResponses}{" "}
                                        reponse(s)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.92)_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Volume des reponses
                                    </p>
                                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
                                        {surveySummary.totalAnswers}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Total des reponses enregistrees sur
                                        l'ensemble des questions.
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-700 shadow-lg ring-1 ring-black/5">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <SummaryPill
                                    label="Questions"
                                    value={surveySummary.totalQuestions}
                                    tone="bg-slate-50"
                                />
                                <SummaryPill
                                    label="Moyenne / question"
                                    value={
                                        surveySummary.averageAnswersPerQuestion
                                    }
                                    tone="bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <ChartCard
                            title="Tendance des soumissions"
                            subtitle={`Volume de reponses recues sur la periode`}
                            tone="bg-[linear-gradient(155deg,#f7fbff_0%,#ecfeff_42%,#ffffff_100%)]"
                        >
                            {trendChartData.length > 0 ? (
                                <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.94)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_35px_rgba(15,23,42,0.08)]">
                                    <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)] p-2">
                                        <div className="h-[320px] max-w-3xl">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <AreaChart
                                                    data={trendChartData}
                                                    margin={{
                                                        top: 8,
                                                        right: 16,
                                                        left: 0,
                                                        bottom: 0,
                                                    }}
                                                >
                                                    <defs>
                                                        <linearGradient
                                                            id="submissionFill"
                                                            x1="0"
                                                            y1="0"
                                                            x2="0"
                                                            y2="1"
                                                        >
                                                            <stop
                                                                offset="0%"
                                                                stopColor="#2a9d8f"
                                                                stopOpacity={
                                                                    0.22
                                                                }
                                                            />
                                                            <stop
                                                                offset="100%"
                                                                stopColor="#2a9d8f"
                                                                stopOpacity={
                                                                    0.04
                                                                }
                                                            />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="#e7e5e4"
                                                    />
                                                    <XAxis
                                                        dataKey="day"
                                                        tick={{ fontSize: 11 }}
                                                        stroke="#a8a29e"
                                                    />
                                                    <YAxis
                                                        allowDecimals={false}
                                                        tick={{ fontSize: 11 }}
                                                        stroke="#a8a29e"
                                                    />
                                                    <Tooltip
                                                        content={
                                                            <CustomTooltip />
                                                        }
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="soumissions"
                                                        name="Soumissions"
                                                        stroke="#2a9d8f"
                                                        strokeWidth={2.5}
                                                        fill="url(#submissionFill)"
                                                        dot={{
                                                            r: 4,
                                                            fill: "#ffffff",
                                                            stroke: "#2a9d8f",
                                                            strokeWidth: 2,
                                                        }}
                                                        activeDot={{
                                                            r: 6,
                                                            fill: "#2a9d8f",
                                                            stroke: "#ffffff",
                                                            strokeWidth: 2,
                                                        }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <EmptyChartState message="Pas assez de soumissions datees pour dessiner une courbe." />
                            )}
                        </ChartCard>
                    </div>

                    <section className="relative mt-8 overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.97)_0%,rgba(241,245,249,0.95)_48%,rgba(255,255,255,0.98)_100%)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.16)] sm:p-7">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                        <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-cyan-200/25 blur-3xl" />
                        <div className="absolute -right-16 bottom-6 h-44 w-44 rounded-full bg-lime-200/20 blur-3xl" />
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                    Statistiques visuelles
                                </h2>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                                    Vue synthese des reponses enregistrees pour
                                    ce sondage.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                                    <Filter className="h-4 w-4" />
                                    Filtrer l'analyse
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-[26px] border border-cyan-100 bg-[linear-gradient(145deg,#ecfeff_0%,#f0fdfa_52%,#ffffff_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                <label
                                    htmlFor="question-filter"
                                    className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                                >
                                    Filtre par question
                                </label>
                                <div className="mt-3">
                                    <Select2Single
                                        id="question-filter"
                                        name="question_filter"
                                        value={questionFilter}
                                        onChange={(event) =>
                                            setQuestionFilter(event.target.value)
                                        }
                                        options={[
                                            {
                                                value: "all",
                                                label: "Toutes les questions",
                                            },
                                            ...questionOptions,
                                        ]}
                                        placeholder="Toutes les questions"
                                        allowClearOption={false}
                                    />
                                </div>
                            </div>

                            <div className="rounded-[26px] border border-emerald-100 bg-[linear-gradient(145deg,#ecfccb_0%,#f0fdf4_52%,#ffffff_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Filtre par reponse
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[
                                        "all",
                                        "with_answers",
                                        "without_answers",
                                    ].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                setResponseFilter(value)
                                            }
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                responseFilter === value
                                                    ? "bg-[#14532d] text-white shadow-lg"
                                                    : "bg-white/90 text-slate-700 ring-1 ring-white hover:bg-white"
                                            }`}
                                        >
                                            {responseStateLabel(value)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 xl:grid-cols-2">
                            <ChartCard
                                title="Répartition par type"
                                subtitle="Distribution des réponses selon le type de question"
                                tone="bg-[linear-gradient(155deg,#f8fffd_0%,#ecfeff_48%,#ffffff_100%)]"
                            >
                                {donutTypeStats.length > 0 ? (
                                    <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.94)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_35px_rgba(15,23,42,0.08)]">
                                        <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.10),transparent_55%)] p-2">
                                            <div className="h-[250px]">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <PieChart>
                                                        <Pie
                                                            data={
                                                                donutTypeStats
                                                            }
                                                            dataKey="value"
                                                            nameKey="label"
                                                            innerRadius={62}
                                                            outerRadius={96}
                                                            paddingAngle={3}
                                                            stroke="#ffffff"
                                                            strokeWidth={4}
                                                        >
                                                            {donutTypeStats.map(
                                                                (entry) => (
                                                                    <Cell
                                                                        key={
                                                                            entry.label
                                                                        }
                                                                        fill={
                                                                            entry.color
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </Pie>
                                                        <Tooltip
                                                            content={
                                                                <CustomTooltip />
                                                            }
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                                            {donutTypeStats.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200/70 shadow-sm"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                item.color,
                                                        }}
                                                    />
                                                    <span>
                                                        {item.label} (
                                                        {item.value})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyChartState message="Aucune donnee disponible." />
                                )}
                            </ChartCard>

                            <ChartCard
                                title="Top réponses"
                                subtitle="Options les plus sélectionnées"
                                tone="bg-[linear-gradient(155deg,#f7fffc_0%,#ecfdf5_48%,#ffffff_100%)]"
                            >
                                {categoryChartData.length > 0 ? (
                                    <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.94)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_35px_rgba(15,23,42,0.08)]">
                                        <div className="hidden mb-4 items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium text-slate-500">
                                                    Catégorie leader
                                                </p>
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {categoryChartData[0]
                                                        ?.label || "Aucune"}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#065f46_0%,#0f766e_100%)] px-4 py-3 text-right shadow-[0_12px_24px_rgba(6,95,70,0.22)]">
                                                <p className="text-xs text-emerald-100">
                                                    Votes leader
                                                </p>
                                                <p className="text-lg font-semibold text-white">
                                                    {categoryChartData[0]
                                                        ? `${categoryChartData[0].votes}`
                                                        : "0"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_55%)] p-2">
                                            <div className="h-[300px]">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <BarChart
                                                        data={categoryChartData}
                                                        layout="vertical"
                                                        margin={{
                                                            top: 6,
                                                            right: 12,
                                                            left: 6,
                                                            bottom: 6,
                                                        }}
                                                        barCategoryGap={16}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            horizontal={false}
                                                            stroke="#e7e5e4"
                                                        />
                                                        <XAxis
                                                            type="number"
                                                            allowDecimals={
                                                                false
                                                            }
                                                            tick={{
                                                                fontSize: 11,
                                                            }}
                                                            stroke="#a8a29e"
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="shortLabel"
                                                            tick={{
                                                                fontSize: 12,
                                                            }}
                                                            width={120}
                                                            stroke="#78716c"
                                                        />
                                                        <Tooltip
                                                            content={
                                                                <CustomTooltip />
                                                            }
                                                        />
                                                        <Bar
                                                            dataKey="votes"
                                                            name="Votes"
                                                            fill="#2a9d8f"
                                                            radius={[
                                                                0, 12, 12, 0,
                                                            ]}
                                                            barSize={22}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyChartState message="Aucune donnee disponible." />
                                )}
                            </ChartCard>

                            <div className="hidden xl:col-span-2">
                                <ChartCard
                                    title="Tendance des soumissions"
                                    subtitle={`Volume de réponses reçues sur la période`}
                                    tone="bg-[linear-gradient(155deg,#f7fbff_0%,#ecfeff_42%,#ffffff_100%)]"
                                >
                                    {trendChartData.length > 0 ? (
                                        <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.94)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_35px_rgba(15,23,42,0.08)]">
                                            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)] p-2">
                                                <div className="h-[320px] max-w-3xl">
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <AreaChart
                                                            data={
                                                                trendChartData
                                                            }
                                                            margin={{
                                                                top: 8,
                                                                right: 16,
                                                                left: 0,
                                                                bottom: 0,
                                                            }}
                                                        >
                                                            <defs>
                                                                <linearGradient
                                                                    id="submissionFill"
                                                                    x1="0"
                                                                    y1="0"
                                                                    x2="0"
                                                                    y2="1"
                                                                >
                                                                    <stop
                                                                        offset="0%"
                                                                        stopColor="#2a9d8f"
                                                                        stopOpacity={
                                                                            0.22
                                                                        }
                                                                    />
                                                                    <stop
                                                                        offset="100%"
                                                                        stopColor="#2a9d8f"
                                                                        stopOpacity={
                                                                            0.04
                                                                        }
                                                                    />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid
                                                                strokeDasharray="3 3"
                                                                stroke="#e7e5e4"
                                                            />
                                                            <XAxis
                                                                dataKey="day"
                                                                tick={{
                                                                    fontSize: 11,
                                                                }}
                                                                stroke="#a8a29e"
                                                            />
                                                            <YAxis
                                                                allowDecimals={
                                                                    false
                                                                }
                                                                tick={{
                                                                    fontSize: 11,
                                                                }}
                                                                stroke="#a8a29e"
                                                            />
                                                            <Tooltip
                                                                content={
                                                                    <CustomTooltip />
                                                                }
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="soumissions"
                                                                name="Soumissions"
                                                                stroke="#2a9d8f"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                                fill="url(#submissionFill)"
                                                                dot={{
                                                                    r: 4,
                                                                    fill: "#ffffff",
                                                                    stroke: "#2a9d8f",
                                                                    strokeWidth: 2,
                                                                }}
                                                                activeDot={{
                                                                    r: 6,
                                                                    fill: "#2a9d8f",
                                                                    stroke: "#ffffff",
                                                                    strokeWidth: 2,
                                                                }}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyChartState message="Pas assez de soumissions datees pour dessiner une courbe." />
                                    )}
                                </ChartCard>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <div className="inline-flex rounded-full border border-slate-200 bg-white/85 p-1 shadow-sm">
                                {[
                                    { value: "bar", label: "Barres" },
                                    { value: "pie", label: "Cercles" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setProfileChartMode(option.value)
                                        }
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            profileChartMode === option.value
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-5 xl:grid-cols-3">
                            {profileDistributionCards.map((section) => (
                                <ChartCard
                                    key={section.key}
                                    title={section.title}
                                    subtitle={section.subtitle}
                                    tone="bg-[linear-gradient(155deg,#fffef7_0%,#f8fafc_45%,#ffffff_100%)]"
                                >
                                    {section.chartData.length > 0 ? (
                                        <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.94)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_35px_rgba(15,23,42,0.08)]">
                                            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_55%)] p-2">
                                                <div className="h-[260px]">
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        {profileChartMode ===
                                                        "pie" ? (
                                                            <PieChart>
                                                                <Pie
                                                                    data={
                                                                        section.chartData
                                                                    }
                                                                    dataKey="count"
                                                                    nameKey="label"
                                                                    innerRadius={
                                                                        52
                                                                    }
                                                                    outerRadius={
                                                                        92
                                                                    }
                                                                    paddingAngle={
                                                                        3
                                                                    }
                                                                    stroke="#ffffff"
                                                                    strokeWidth={
                                                                        4
                                                                    }
                                                                    labelLine={
                                                                        false
                                                                    }
                                                                    label={
                                                                        <PieSlicePercentageLabel />
                                                                    }
                                                                >
                                                                    {section.chartData.map(
                                                                        (
                                                                            item,
                                                                        ) => (
                                                                            <Cell
                                                                                key={`${section.key}-${item.label}`}
                                                                                fill={
                                                                                    item.color
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </Pie>
                                                                <Tooltip
                                                                    content={
                                                                        <CustomTooltip />
                                                                    }
                                                                />
                                                            </PieChart>
                                                        ) : (
                                                            <BarChart
                                                                data={
                                                                    section.chartData
                                                                }
                                                                layout="vertical"
                                                                margin={{
                                                                    top: 6,
                                                                    right: 12,
                                                                    left: 6,
                                                                    bottom: 6,
                                                                }}
                                                                barCategoryGap={
                                                                    14
                                                                }
                                                            >
                                                                <CartesianGrid
                                                                    strokeDasharray="3 3"
                                                                    horizontal={
                                                                        false
                                                                    }
                                                                    stroke="#e7e5e4"
                                                                />
                                                                <XAxis
                                                                    type="number"
                                                                    allowDecimals={
                                                                        false
                                                                    }
                                                                    tick={{
                                                                        fontSize: 11,
                                                                    }}
                                                                    stroke="#a8a29e"
                                                                />
                                                                <YAxis
                                                                    type="category"
                                                                    dataKey="shortLabel"
                                                                    tick={{
                                                                        fontSize: 12,
                                                                    }}
                                                                    width={120}
                                                                    stroke="#78716c"
                                                                />
                                                                <Tooltip
                                                                    content={
                                                                        <CustomTooltip />
                                                                    }
                                                                />
                                                                <Bar
                                                                    dataKey="count"
                                                                    name="Repondants"
                                                                    radius={[
                                                                        0, 12,
                                                                        12, 0,
                                                                    ]}
                                                                    barSize={22}
                                                                >
                                                                    {section.chartData.map(
                                                                        (
                                                                            item,
                                                                        ) => (
                                                                            <Cell
                                                                                key={`${section.key}-${item.label}`}
                                                                                fill={
                                                                                    item.color
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                    <LabelList
                                                                        dataKey="percentage"
                                                                        content={
                                                                            <BarPercentageLabel />
                                                                        }
                                                                    />
                                                                </Bar>
                                                            </BarChart>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <ChartLegendList
                                                    items={section.chartData.map(
                                                        (item) => ({
                                                            label: item.label,
                                                            value: item.count,
                                                            meta: `${item.percentage}%`,
                                                            color: item.color,
                                                        }),
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyChartState message="Aucune donnee de profil disponible." />
                                    )}
                                </ChartCard>
                            ))}
                        </div>
                    </section>

                    <div className="mt-8">
                        <div className="space-y-5">
                            {filteredResponseStats.map((question, index) => (
                                <section
                                    key={question.id || index}
                                    className="overflow-hidden rounded-[22px] border border-[#e8e5df] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                                >
                                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                    {index + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-semibold leading-tight text-slate-900">
                                                        {question.title}
                                                    </h3>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                                            {questionTypeLabel(
                                                                question.type,
                                                            )}
                                                        </span>
                                                        {question.required ? (
                                                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                                                Obligatoire
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 pt-1 text-sm text-slate-500">
                                            {question.answersCount} réponse(s)
                                        </div>
                                    </div>

                                    {question.optionStats?.length > 0 ? (
                                        <div className="border-t border-[#ece8e1] px-6 py-6">
                                            <div className="space-y-5">
                                                {question.optionStats.map(
                                                    (option) => (
                                                        <div key={option.label}>
                                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                                <span className="text-[15px] font-medium text-slate-900">
                                                                    {
                                                                        option.label
                                                                    }
                                                                </span>
                                                                <span className="text-sm text-slate-500">
                                                                    {
                                                                        option.count
                                                                    }{" "}
                                                                    ·{" "}
                                                                    {
                                                                        option.percentage
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f2f1ee]">
                                                                <div
                                                                    className="h-full rounded-full bg-[#2a9d8f] shadow-[0_2px_10px_rgba(42,157,143,0.28)]"
                                                                    style={{
                                                                        width: `${option.percentage}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                    {question.type === "text" &&
                                    question.textAnswers?.length > 0 ? (
                                        <div className="border-t border-[#ece8e1] px-6 py-6">
                                            <div className="grid gap-3">
                                                {question.textAnswers.map(
                                                    (answer, answerIndex) => (
                                                        <div
                                                            key={`${question.id}-${answerIndex}`}
                                                            className="rounded-2xl border border-slate-200 bg-[#fcfcfb] px-4 py-3 text-sm leading-6 text-slate-700"
                                                        >
                                                            {answer}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                    {question.answersCount === 0 ? (
                                        <div className="border-t border-[#ece8e1] px-6 py-6 text-sm text-slate-500">
                                            Aucune reponse enregistree pour
                                            cette question.
                                        </div>
                                    ) : null}
                                </section>
                            ))}

                            {filteredResponseStats.length === 0 ? (
                                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                                    Aucun bloc de statistiques ne correspond aux
                                    filtres selectionnes.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
