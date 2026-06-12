import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Calendar, Clock, MapPin, Mic, User, Users, ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Loader2, Eye, X, GraduationCap } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { withBasePath } from "../../../Utils/urlHelper";

const PAGE_SIZE = 10;

const STATS_URL = withBasePath("", "/president-conducteurs/presences/stats");

const PERIODES = [
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "annee", label: "Année" },
];

function tauxBadgeClass(taux) {
    if (taux >= 70) return "bg-green-50 text-green-700";
    if (taux >= 40) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-600";
}

const RANK_COLORS = ["#B5533C", "#4A7C5E", "#C9A227", "#8B5CF6"];

function rankColor(idx) {
    return RANK_COLORS[idx % RANK_COLORS.length];
}

function ActiviteMiniCard({ activite, rank, onDetails }) {
    const color = rankColor(rank - 1);

    return (
        <div className="text-left bg-white rounded-xl shadow-sm border p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm truncate">
                    {rank}. {activite.titre}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tauxBadgeClass(activite.taux_moyen)}`}>
                    {activite.taux_moyen}%
                </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                {activite.nb_presences} présence{activite.nb_presences > 1 ? "s" : ""}
                {" • "}
                {activite.nb_occurrences} occurrence{activite.nb_occurrences > 1 ? "s" : ""}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-2">
                <div
                    className="h-full"
                    style={{ width: `${Math.min(activite.taux_moyen, 100)}%`, backgroundColor: color }}
                />
            </div>
            <button
                onClick={() => onDetails(activite)}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
                <Eye size={13} />
                Voir détails
            </button>
        </div>
    );
}

function ActiviteDetailModal({ activite, onClose }) {
    if (!activite) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-3">
                    <h4 className="text-base font-bold text-gray-900 pr-4">{activite.titre}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <GraduationCap size={15} className="text-gray-400" />
                        <span className="font-semibold text-gray-500">Classe :</span>
                        <span>{activite.classe ?? "Toutes les classes"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Users size={15} className="text-gray-400" />
                        <span className="font-semibold text-gray-500">Participants :</span>
                        <span>
                            {activite.nb_participants_ref} / {activite.nb_membres_ref} ({activite.taux_ref}%)
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <User size={15} className="text-gray-400" />
                        <span className="font-semibold text-gray-500">Conducteur :</span>
                        <span>{activite.conducteur ?? "—"}</span>
                    </div>

                    <div className="flex items-start gap-2 text-gray-600">
                        <Calendar size={15} className="text-gray-400 mt-0.5" />
                        <span className="font-semibold text-gray-500 whitespace-nowrap">Date(s) :</span>
                        <span>{activite.dates && activite.dates.length > 0 ? activite.dates.join(", ") : "—"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SyntheseActivites() {
    const [periode, setPeriode] = useState("mois");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detailActivite, setDetailActivite] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axios
            .get(STATS_URL, { params: { vue: "activites_globales", periode } })
            .then((res) => {
                if (!cancelled) setData(res.data);
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
    }, [periode]);

    const activites = data?.activites ?? [];

    return (
        <div className="space-y-4">
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

                {loading && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Chargement...
                    </div>
                )}
                {error && <div className="text-xs text-red-500">{error}</div>}
            </div>

            {!loading && activites.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-sm text-gray-400">
                    Aucune présence enregistrée sur cette période.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {activites.map((a, idx) => (
                            <ActiviteMiniCard key={idx} activite={a} rank={idx + 1} onDetails={setDetailActivite} />
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Activités les plus suivies — Synthèse
                        </h4>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={activites} layout="vertical" margin={{ left: 16, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                <YAxis type="category" dataKey="titre" width={160} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value, name) =>
                                        name === "nb_presences" ? [value, "Présences"] : [value + "%", "Taux moyen"]
                                    }
                                />
                                <Bar dataKey="nb_presences" name="Présences" radius={[0, 4, 4, 0]}>
                                    {activites.map((a, idx) => (
                                        <Cell key={idx} fill={rankColor(idx)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            <ActiviteDetailModal activite={detailActivite} onClose={() => setDetailActivite(null)} />
        </div>
    );
}

function SearchableSelect({ options, value, onChange, placeholder, emptyLabel, className }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selected = options.find((o) => String(o.value) === String(value));
    const filtered = query.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
        : options;

    return (
        <div className="relative" ref={ref}>
            <input
                type="text"
                value={open ? query : (selected?.label ?? "")}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    setQuery("");
                    setOpen(true);
                }}
                placeholder={placeholder}
                className={className}
            />
            {open && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg text-xs">
                    {filtered.length === 0 && (
                        <li className="px-2 py-1 text-gray-400">{emptyLabel ?? "Aucun résultat"}</li>
                    )}
                    {filtered.map((o) => (
                        <li
                            key={o.value}
                            onClick={() => {
                                onChange(o.value);
                                setOpen(false);
                                setQuery("");
                            }}
                            className="px-2 py-1 cursor-pointer hover:bg-blue-50 truncate"
                        >
                            {o.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function TabProgrammes({ classesProgrammes = [] }) {
    const [selectedId, setSelectedId] = useState(classesProgrammes[0]?.id ?? null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
        setSearch("");
    }, [selectedId]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    if (!classesProgrammes.length) {
        return (
            <div className="space-y-4">
                <SyntheseActivites />
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Programmes d'activité</h3>
                    <p className="text-sm text-gray-500">Aucune classe disponible.</p>
                </div>
            </div>
        );
    }

    const classe = classesProgrammes.find((c) => c.id === selectedId) ?? classesProgrammes[0];
    const programmes = classe.programmes || [];

    const filteredProgrammes = search.trim()
        ? programmes.filter((p) => (p.titre || "").toLowerCase().includes(search.trim().toLowerCase()))
        : programmes;

    const totalPages = Math.max(1, Math.ceil(filteredProgrammes.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pagedProgrammes = filteredProgrammes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="space-y-4">
            <SyntheseActivites />

            <div className="bg-white rounded-xl shadow-sm border p-3">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Classe</label>
                        <SearchableSelect
                            options={classesProgrammes.map((c) => ({ value: c.id, label: c.nom }))}
                            value={classe.id}
                            onChange={(v) => setSelectedId(Number(v))}
                            placeholder="Rechercher une classe..."
                            className="border rounded-md px-2 py-1 text-xs text-gray-700 min-w-[160px]"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500">Programme</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un programme..."
                            className="border rounded-md px-2 py-1 text-xs text-gray-700 min-w-[180px]"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <CalendarDays size={18} />
                    {classe.nom} — Programmes d'activité
                </h4>
                {classe.conducteur && (
                    <p className="text-xs text-gray-400 mb-3">Conducteur : {classe.conducteur}</p>
                )}

                {programmes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucun programme enregistré pour cette classe.</p>
                ) : filteredProgrammes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucun programme ne correspond à la recherche.</p>
                ) : (
                    <div className="space-y-2">
                        {pagedProgrammes.map((p) => (
                            <div key={p.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-semibold text-gray-800 text-sm">{p.titre}</h5>
                                    {p.is_upcoming && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 whitespace-nowrap">
                                            À venir
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                                    {p.date_range && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={13} /> {p.date_range}
                                        </span>
                                    )}
                                    {p.time_range && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} /> {p.time_range}
                                        </span>
                                    )}
                                    {p.lieu && (
                                        <span className="flex items-center gap-1">
                                            <MapPin size={13} /> {p.lieu}
                                        </span>
                                    )}
                                    {p.orateur && (
                                        <span className="flex items-center gap-1">
                                            <Mic size={13} /> {p.orateur}
                                        </span>
                                    )}
                                    {p.moderateur && (
                                        <span className="flex items-center gap-1">
                                            <User size={13} /> {p.moderateur}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredProgrammes.length > PAGE_SIZE && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            disabled={currentPage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Précédent
                        </button>
                        <span className="text-xs text-gray-500 font-medium">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Suivant
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
