import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Users,
    TrendingUp,
    AlertTriangle,
    Calendar,
    Loader2,
    ArrowUpDown,
    X,
} from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { withBasePath } from "../../../Utils/urlHelper";

const STATS_URL = withBasePath("", "/president-conducteurs/presences/stats");

const VUES = [
    { id: "classe", label: "Vue par classe" },
    { id: "activite", label: "Par activité" },
    { id: "absences_repetees", label: "Absences répétées" },
];

const PERIODES = [
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "annee", label: "Année" },
];

const COLORS = ["#4A7C5E", "#C9A227", "#B5533C", "#3B6EA5", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B"];

function tauxColor(taux) {
    if (taux >= 70) return "#4A7C5E";
    if (taux >= 40) return "#C9A227";
    return "#B5533C";
}

function tauxBadgeClass(taux) {
    if (taux >= 70) return "bg-green-50 text-green-700";
    if (taux >= 40) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-600";
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function TabPresences({ classesPresence = [] }) {
    const [vue, setVue] = useState("classe");
    const [periode, setPeriode] = useState("mois");
    const [dateRef, setDateRef] = useState(todayIso());
    const [selectedClasseId, setSelectedClasseId] = useState(null);
    const [drillClasse, setDrillClasse] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [statsClasse, setStatsClasse] = useState(null);
    const [statsActivite, setStatsActivite] = useState(null);
    const [statsAbsences, setStatsAbsences] = useState(null);
    const [statsDrill, setStatsDrill] = useState(null);

    const [sortKey, setSortKey] = useState("nb_absences");
    const [sortDir, setSortDir] = useState("desc");

    // Réinitialiser les sélections dépendantes lors d'un changement de vue
    useEffect(() => {
        setDrillClasse(null);
        if (vue !== "activite") {
            setSelectedClasseId(null);
        }
    }, [vue]);

    // Charger les statistiques principales (vue par classe / par activité / absences)
    useEffect(() => {
        let cancelled = false;

        if (vue === "activite" && !selectedClasseId) {
            setStatsActivite(null);
            return;
        }

        setLoading(true);
        setError(null);

        const params = { vue, periode, date_ref: dateRef };
        if (vue === "activite") {
            params.classe_id = selectedClasseId;
        }

        axios
            .get(STATS_URL, { params })
            .then((res) => {
                if (cancelled) return;
                if (vue === "classe") setStatsClasse(res.data);
                if (vue === "activite") setStatsActivite(res.data);
                if (vue === "absences_repetees") setStatsAbsences(res.data);
            })
            .catch(() => {
                if (!cancelled) setError("Impossible de charger les statistiques.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [vue, periode, dateRef, selectedClasseId]);

    // Charger le drill-down membres d'une classe (vue par classe)
    useEffect(() => {
        if (!drillClasse) {
            setStatsDrill(null);
            return;
        }

        let cancelled = false;
        axios
            .get(STATS_URL, {
                params: { vue: "membres", periode, date_ref: dateRef, classe_id: drillClasse.id },
            })
            .then((res) => {
                if (!cancelled) setStatsDrill(res.data);
            })
            .catch(() => {
                if (!cancelled) setStatsDrill(null);
            });

        return () => {
            cancelled = true;
        };
    }, [drillClasse, periode, dateRef]);

    const lineData = useMemo(() => {
        if (!statsClasse || periode !== "annee") return [];
        const ref = statsClasse.classes.find((c) => (c.serie_mensuelle || []).length > 0);
        const months = ref?.serie_mensuelle?.map((s) => s.label) || [];
        return months.map((label, idx) => {
            const row = { label };
            statsClasse.classes.forEach((c) => {
                row[c.nom] = c.serie_mensuelle?.[idx]?.taux ?? 0;
            });
            return row;
        });
    }, [statsClasse, periode]);

    const sortedAbsences = useMemo(() => {
        if (!statsAbsences) return [];
        const list = [...statsAbsences.membres];
        list.sort((a, b) => {
            const va = a[sortKey];
            const vb = b[sortKey];
            if (typeof va === "string") {
                return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            }
            return sortDir === "asc" ? va - vb : vb - va;
        });
        return list;
    }, [statsAbsences, sortKey, sortDir]);

    function toggleSort(key) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    if (!classesPresence.length) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Présences</h3>
                <p className="text-sm text-gray-500">Aucune classe disponible.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Boutons de vue */}
            <div className="flex flex-wrap gap-2">
                {VUES.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setVue(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            vue === v.id
                                ? "bg-[#4A7C5E] text-white shadow-sm"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Filtre période */}
            <div className="bg-white rounded-xl shadow-sm border p-3 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">Période</label>
                    <div className="flex gap-1">
                        {PERIODES.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriode(p.id)}
                                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                                    periode === p.id
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">
                        {periode === "semaine" ? "Semaine du" : periode === "annee" ? "Année" : "Mois"}
                    </label>
                    {periode === "annee" ? (
                        <input
                            type="number"
                            value={dateRef.slice(0, 4)}
                            onChange={(e) => setDateRef(`${e.target.value}-01-01`)}
                            className="border rounded-md px-2 py-1 text-xs text-gray-700 w-24"
                        />
                    ) : periode === "mois" ? (
                        <input
                            type="month"
                            value={dateRef.slice(0, 7)}
                            onChange={(e) => setDateRef(`${e.target.value}-01`)}
                            className="border rounded-md px-2 py-1 text-xs text-gray-700"
                        />
                    ) : (
                        <input
                            type="date"
                            value={dateRef}
                            onChange={(e) => setDateRef(e.target.value)}
                            className="border rounded-md px-2 py-1 text-xs text-gray-700"
                        />
                    )}
                </div>

                {loading && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Chargement...
                    </div>
                )}
                {error && <div className="text-xs text-red-500">{error}</div>}
            </div>

            {vue === "classe" && (
                <VueClasse
                    statsClasse={statsClasse}
                    periode={periode}
                    lineData={lineData}
                    drillClasse={drillClasse}
                    setDrillClasse={setDrillClasse}
                    statsDrill={statsDrill}
                />
            )}

            {vue === "activite" && (
                <VueActivite
                    classesPresence={classesPresence}
                    selectedClasseId={selectedClasseId}
                    setSelectedClasseId={setSelectedClasseId}
                    statsActivite={statsActivite}
                    periode={periode}
                />
            )}

            {vue === "absences_repetees" && (
                <VueAbsences
                    statsAbsences={statsAbsences}
                    sortedAbsences={sortedAbsences}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    toggleSort={toggleSort}
                />
            )}
        </div>
    );
}

function MiniCard({ classe, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`text-left bg-white rounded-xl shadow-sm border p-3 transition-colors hover:border-[#4A7C5E] ${
                active ? "ring-2 ring-[#4A7C5E]" : ""
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm truncate">{classe.nom}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tauxBadgeClass(classe.taux_moyen)}`}>
                    {classe.taux_moyen}%
                </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                {classe.nb_membres} membre{classe.nb_membres > 1 ? "s" : ""}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-2">
                <div
                    className="h-full"
                    style={{ width: `${Math.min(classe.taux_moyen, 100)}%`, backgroundColor: tauxColor(classe.taux_moyen) }}
                />
            </div>
        </button>
    );
}

function VueClasse({ statsClasse, periode, lineData, drillClasse, setDrillClasse, statsDrill }) {
    if (!statsClasse) {
        return <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">Chargement des statistiques...</div>;
    }

    const { classes } = statsClasse;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {classes.map((c) => (
                    <MiniCard
                        key={c.id}
                        classe={c}
                        active={drillClasse?.id === c.id}
                        onClick={() => setDrillClasse(drillClasse?.id === c.id ? null : { id: c.id, nom: c.nom })}
                    />
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Taux de participation moyen par classe
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                    {periode === "annee" ? (
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                            <Tooltip />
                            <Legend />
                            {classes.map((c, idx) => (
                                <Line
                                    key={c.id}
                                    type="monotone"
                                    dataKey={c.nom}
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={classes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                            <Tooltip />
                            <Bar dataKey="taux_moyen" name="Taux de participation" radius={[4, 4, 0, 0]}>
                                {classes.map((c, idx) => (
                                    <Cell key={c.id} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {drillClasse && (
                <DrillDown drillClasse={drillClasse} statsDrill={statsDrill} onClose={() => setDrillClasse(null)} />
            )}
        </div>
    );
}

function DrillDown({ drillClasse, statsDrill, onClose }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users size={16} />
                    Détail — {drillClasse.nom}
                </h4>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>

            {!statsDrill ? (
                <div className="text-center text-sm text-gray-400 py-6">Chargement...</div>
            ) : statsDrill.membres.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucun membre dans cette classe.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left px-3 py-2 border-b font-semibold text-gray-700">Membre</th>
                                    <th className="px-3 py-2 border-b text-center font-semibold text-gray-700">Présences</th>
                                    <th className="px-3 py-2 border-b text-center font-semibold text-gray-700">Absences</th>
                                    <th className="px-3 py-2 border-b text-center font-semibold text-gray-700">Taux</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statsDrill.membres.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 border-b font-medium text-gray-800">{m.nom_complet}</td>
                                        <td className="px-3 py-2 border-b text-center text-green-600 font-semibold">{m.present}</td>
                                        <td className="px-3 py-2 border-b text-center text-red-500 font-semibold">{m.absent}</td>
                                        <td className="px-3 py-2 border-b text-center">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tauxBadgeClass(m.taux)}`}>
                                                {m.taux}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <ResponsiveContainer width="100%" height={Math.max(220, statsDrill.membres.length * 28)}>
                            <BarChart data={statsDrill.membres} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                                <YAxis type="category" dataKey="nom_complet" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="taux" name="Taux de présence" radius={[0, 4, 4, 0]}>
                                    {statsDrill.membres.map((m) => (
                                        <Cell key={m.id} fill={tauxColor(m.taux)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

function VueActivite({ classesPresence, selectedClasseId, setSelectedClasseId, statsActivite, periode }) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Choisir une classe</h4>
                <div className="flex flex-wrap gap-2">
                    {classesPresence.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedClasseId(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                selectedClasseId === c.id
                                    ? "bg-[#4A7C5E] text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {c.nom}
                        </button>
                    ))}
                </div>
            </div>

            {!selectedClasseId ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">
                    Sélectionnez une classe pour voir le détail par activité.
                </div>
            ) : !statsActivite ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">Chargement...</div>
            ) : statsActivite.items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">
                    Aucune donnée de présence pour cette période.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        {statsActivite.classe.nom} — Taux de participation par {statsActivite.mode === "mensuel" ? "mois" : "activité"}
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statsActivite.items}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                            <Tooltip />
                            <Bar dataKey="taux" name="Taux de participation" radius={[4, 4, 0, 0]}>
                                {statsActivite.items.map((item, idx) => (
                                    <Cell key={idx} fill={tauxColor(item.taux)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function VueAbsences({ statsAbsences, sortedAbsences, sortKey, sortDir, toggleSort }) {
    if (!statsAbsences) {
        return <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">Chargement...</div>;
    }

    const columns = [
        { key: "nom_complet", label: "Membre" },
        { key: "classe", label: "Classe" },
        { key: "nb_absences", label: "Absences" },
        { key: "nb_occurrences", label: "Activités" },
        { key: "taux_absence", label: "Taux d'absence" },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border p-4 overflow-x-auto">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Membres avec {statsAbsences.threshold}+ absences sur la période
            </h4>

            {sortedAbsences.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Aucune absence répétée sur cette période.</p>
            ) : (
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => toggleSort(col.key)}
                                    className="px-3 py-2 border-b text-left font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-50"
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.label}
                                        <ArrowUpDown size={12} className={sortKey === col.key ? "text-[#4A7C5E]" : "text-gray-300"} />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAbsences.map((m) => (
                            <tr key={m.membre_id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 border-b font-medium text-gray-800">{m.nom_complet}</td>
                                <td className="px-3 py-2 border-b text-gray-600">{m.classe}</td>
                                <td className="px-3 py-2 border-b text-red-500 font-semibold">{m.nb_absences}</td>
                                <td className="px-3 py-2 border-b text-gray-600">{m.nb_occurrences}</td>
                                <td className="px-3 py-2 border-b">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tauxBadgeClass(100 - m.taux_absence)}`}>
                                        {m.taux_absence}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
