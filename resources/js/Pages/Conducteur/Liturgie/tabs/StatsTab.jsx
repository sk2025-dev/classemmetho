import React from "react";

export default function StatsTab({ stats, localActes, prettyType, tone, iconEmoji }) {
    return (
        <div className="grid-2">
            <div className="panel">
                <div className="panel-head">
                    <div className="panel-title">
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path
                                strokeLinecap="round"
                                d="M12 12l-4-4"
                            />
                        </svg>
                        Répartition par type
                    </div>
                </div>
                <div className="stats-types">
                    {[
                        "bapteme",
                        "mariage",
                        "premiere_communion",
                        "deces",
                    ].map((type) => {
                        const count = localActes.filter(
                            (a) => a.type_acte === type,
                        ).length;
                        const pct = stats.total
                            ? Math.round(
                                  (count / stats.total) * 100,
                              )
                            : 0;
                        return (
                            <div
                                key={type}
                                className="stat-type-row"
                            >
                                <div
                                    className={`stat-type-icon ${tone(type)}`}
                                >
                                    {iconEmoji(type)}
                                </div>
                                <div className="stat-type-info">
                                    <div className="stat-type-name">
                                        {prettyType(type)}
                                    </div>
                                    <div className="stat-type-bar-wrap">
                                        <div className="stat-type-bar">
                                            <div
                                                className={`stat-type-bar-fill ${tone(type)}`}
                                                style={{
                                                    width: `${pct}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="stat-type-pct">
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-type-count">
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="panel">
                <div className="panel-head">
                    <div className="panel-title">
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        Taux de traitement
                    </div>
                </div>
                <div className="stats-rates">
                    <div className="rate-big">
                        <div className="rate-circle">
                            <svg
                                viewBox="0 0 36 36"
                                className="rate-svg"
                            >
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#B6C01A"
                                    strokeWidth="3"
                                    strokeDasharray={`${stats.total ? Math.round((stats.valides / stats.total) * 100) : 0}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="rate-center">
                                <div className="rate-pct">
                                    {stats.total
                                        ? Math.round(
                                              (stats.valides /
                                                  stats.total) *
                                                  100,
                                          )
                                        : 0}
                                    %
                                </div>
                                <div className="rate-lbl">
                                    Validés
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="rate-rows">
                        <div className="rate-row">
                            <span className="rate-dot green" />
                            <span className="rate-name">
                                Validées
                            </span>
                            <span className="rate-val">
                                {stats.valides}
                            </span>
                        </div>
                        <div className="rate-row">
                            <span className="rate-dot gold" />
                            <span className="rate-name">
                                Au pasteur
                            </span>
                            <span className="rate-val">
                                {stats.transmises}
                            </span>
                        </div>
                        <div className="rate-row">
                            <span className="rate-dot orange" />
                            <span className="rate-name">
                                En attente
                            </span>
                            <span className="rate-val">
                                {stats.soumises}
                            </span>
                        </div>
                        <div className="rate-row total-row">
                            <span className="rate-dot blue" />
                            <span className="rate-name">
                                Total
                            </span>
                            <span className="rate-val">
                                {stats.total}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
