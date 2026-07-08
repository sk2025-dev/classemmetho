import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Users,
    TrendingUp,
    Calendar,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
    Eye,
    Search,
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
} from "recharts";
import { withBasePath } from "../../../Utils/urlHelper";

const STATS_URL = withBasePath("", "/president-conducteurs/presences/stats");

const VUES = [
    { id: "classe", label: "Vue par classe" },
    { id: "activite", label: "Par activité" },
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

function prettyDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
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
    const [statsDrill, setStatsDrill] = useState(null);

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

        </div>
    );
}

function MiniCard({ classe, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={`relative overflow-hidden text-left rounded-xl p-3 border backdrop-blur-xl bg-white/15 shadow-lg transition-all hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-xl ${
                active ? "border-white/80 ring-2 ring-white/60" : "border-white/30"
            }`}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
            <div className="relative flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm truncate drop-shadow-sm">{classe.nom}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tauxBadgeClass(classe.taux_moyen)}`}>
                    {classe.taux_moyen.toFixed(1)}%
                </span>
            </div>
            <div className="relative flex items-center gap-1 text-xs text-white/85">
                <Users size={12} />
                {classe.nb_membres} membre{classe.nb_membres > 1 ? "s" : ""}
            </div>
            <div className="relative h-1.5 rounded-full bg-white/20 overflow-hidden mt-2">
                <div
                    className="h-full"
                    style={{ width: `${Math.min(classe.taux_moyen, 100)}%`, backgroundColor: tauxColor(classe.taux_moyen) }}
                />
            </div>
        </button>
    );
}

function VueClasse({ statsClasse, periode, lineData, drillClasse, setDrillClasse, statsDrill }) {
    const [showAllClasses, setShowAllClasses] = useState(false);

    if (!statsClasse) {
        return <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">Chargement des statistiques...</div>;
    }

    const { classes } = statsClasse;
    const visibleClasses = showAllClasses ? classes : classes.slice(0, 4);
    const classesWithAbsence = classes.map((c) => ({
        ...c,
        taux_moyen: c.nb_occurrences > 0 ? c.taux_moyen : null,
        taux_absence: c.nb_occurrences > 0 ? Math.round((100 - c.taux_moyen) * 10) / 10 : null,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {visibleClasses.map((c) => (
                    <MiniCard
                        key={c.id}
                        classe={c}
                        active={drillClasse?.id === c.id}
                        onClick={() => setDrillClasse(drillClasse?.id === c.id ? null : { id: c.id, nom: c.nom })}
                    />
                ))}
            </div>

            {classes.length > 4 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowAllClasses((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {showAllClasses ? (
                            <>Voir moins <ChevronUp size={16} /></>
                        ) : (
                            <>Voir plus de classes <ChevronDown size={16} /></>
                        )}
                    </button>
                </div>
            )}

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
                            <Tooltip formatter={(value) => `${value}%`} />
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
                        <BarChart data={classesWithAbsence}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                            <Tooltip
                                formatter={(value, name, entry) => {
                                    const total = entry.payload.nb_membres * entry.payload.nb_occurrences;
                                    const count = Math.round((value / 100) * total);
                                    return [`${value}% (${count}/${total})`, name];
                                }}
                            />
                            <Legend />
                            <Bar dataKey="taux_moyen" name="Présence" fill="#4A7C5E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="taux_absence" name="Absence" fill="#B5533C" radius={[4, 4, 0, 0]} />
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

const DRILL_PAGE_SIZE = 10;

function DrillDown({ drillClasse, statsDrill, onClose }) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedMembre, setSelectedMembre] = useState(null);

    useEffect(() => {
        setPage(1);
        setSearch("");
    }, [drillClasse?.id, statsDrill]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const allMembres = statsDrill?.membres ?? [];
    const membres = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return allMembres;
        return allMembres.filter((m) => (m.nom_complet || "").toLowerCase().includes(term));
    }, [allMembres, search]);
    const totalPages = Math.max(1, Math.ceil(membres.length / DRILL_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleMembres = membres.slice((currentPage - 1) * DRILL_PAGE_SIZE, currentPage * DRILL_PAGE_SIZE);

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

            {statsDrill && allMembres.length > 0 && (
                <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un membre..."
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                    />
                </div>
            )}

            {!statsDrill ? (
                <div className="text-center text-sm text-gray-400 py-6">Chargement...</div>
            ) : allMembres.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucun membre dans cette classe.</p>
            ) : membres.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucun membre ne correspond à la recherche.</p>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-violet-50">
                                    <th className="text-left px-4 py-2.5 font-semibold text-violet-700 text-xs uppercase tracking-wide">Membre</th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-violet-700 text-xs uppercase tracking-wide">Présences</th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-violet-700 text-xs uppercase tracking-wide">Absences</th>
                                    <th className="px-4 py-2.5 text-center font-semibold text-violet-700 text-xs uppercase tracking-wide">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-100">
                                {visibleMembres.map((m, idx) => (
                                    <tr key={m.id} className={idx % 2 === 0 ? "bg-white hover:bg-violet-50" : "bg-violet-50/50 hover:bg-violet-50"}>
                                        <td className="px-4 py-2.5 font-medium text-gray-800">{m.nom_complet}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 font-semibold">
                                                {m.present}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-semibold">
                                                {m.absent}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <button
                                                onClick={() => setSelectedMembre(m)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                                            >
                                                <Eye size={14} />
                                                Voir détails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ← Précédent
                            </button>
                            <span className="text-xs text-gray-500 font-medium">
                                Page {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedMembre && (
                <MembreDetailModal
                    membre={selectedMembre}
                    classe={statsDrill?.classe}
                    onClose={() => setSelectedMembre(null)}
                />
            )}
        </div>
    );
}

function MembreDetailModal({ membre, classe, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl border w-full max-w-md max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users size={16} />
                        {membre.nom_complet}
                    </h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-4 py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Classe</span>
                            <span className="text-gray-800 font-medium">{classe?.nom || "—"}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Conducteur</span>
                            <span className="text-gray-800 font-medium">{classe?.conducteur_nom || "—"}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Présences</span>
                            <span className="text-green-600 font-semibold">{membre.present}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Taux</span>
                            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${tauxBadgeClass(membre.taux)}`}>
                                {membre.taux}%
                            </span>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Activités où le membre était absent ({membre.absences?.length || 0})
                        </h5>
                        {!membre.absences || membre.absences.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune absence sur cette période.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                {membre.absences.map((a, idx) => (
                                    <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm bg-red-50/40">
                                        <span className="font-medium text-gray-800">{a.titre}</span>
                                        <span className="text-xs text-gray-500">{prettyDate(a.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VueActivite({ classesPresence, selectedClasseId, setSelectedClasseId, statsActivite, periode }) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Choisir une classe</h4>
                <div className="flex flex-wrap gap-2">
                    {classesPresence.map((c, idx) => {
                        const color = COLORS[idx % COLORS.length];
                        const active = selectedClasseId === c.id;
                        return (
                        <button
                            key={c.id}
                            onClick={() => setSelectedClasseId(c.id)}
                            style={active
                                ? { backgroundColor: color, color: "#fff" }
                                : { backgroundColor: `${color}1A`, color }}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm hover:opacity-80"
                        >
                            {c.nom}
                        </button>
                        );
                    })}
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
                            <Tooltip
                                formatter={(value, name, entry) => {
                                    const total = entry.payload.nb_membres;
                                    const count = Math.round((value / 100) * total);
                                    return [`${value}% (${count}/${total})`, name];
                                }}
                            />
                            <Legend />
                            <Bar dataKey="taux" name="Présence" fill="#4A7C5E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="taux_absence" name="Absence" fill="#B5533C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
