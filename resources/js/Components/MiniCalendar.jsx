import React, { useEffect, useMemo, useState } from "react";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const parseDate = (value) => {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? null : parsed;
};

const formatKey = (value) => {
    const date = parseDate(value);
    if (!date) {
        return null;
    }
    return date.toISOString().slice(0, 10);
};

const formatLabel = (value) => {
    const date = parseDate(value);
    if (!date) {
        return "";
    }
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
};

const formatStatus = (statut) => {
    if (!statut) return "";
    return statut
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

const STYLES = {
    container: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#ffffff",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 700,
        color: "#1f2937",
    },
    subtitle: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
    nav: {
        display: "flex",
        gap: 6,
    },
    navButton: {
        border: "1px solid #d1d5db",
        background: "#f9fafb",
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        color: "#1f2937",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: 6,
        marginBottom: 10,
    },
    dayLabel: {
        textAlign: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#9ca3af",
    },
    cell: {
        minHeight: 38,
        borderRadius: 10,
        border: "1px solid transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        position: "relative",
        background: "#f8fafc",
        color: "#111827",
        transition: "background .15s, border .15s",
    },
    cellInactive: {
        background: "transparent",
        color: "#d1d5db",
        cursor: "default",
    },
    cellSelected: {
        background: "#5b3faf",
        color: "#ffffff",
        border: "1px solid #5b3faf",
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#16a34a",
        position: "absolute",
        right: 8,
        bottom: 6,
    },
    detail: {
        borderTop: "1px solid #e5e7eb",
        paddingTop: 12,
    },
    detailTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: "#1f2937",
        marginBottom: 6,
    },
    emptyState: {
        fontSize: 12,
        color: "#6b7280",
    },
    eventList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: 200,
        overflowY: "auto",
        paddingRight: 4,
    },
    eventItem: {
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        padding: "10px 12px",
        background: "#f8fafc",
    },
    eventLabel: {
        fontSize: 13,
        fontWeight: 700,
        color: "#111827",
        marginBottom: 2,
    },
    eventMeta: {
        fontSize: 12,
        color: "#475569",
    },
};

export default function MiniCalendar({
    events = [],
    highlightId = null,
    title = "Calendrier",
}) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(null);

    const eventsByDate = useMemo(() => {
        const grouped = {};
        events.forEach((event) => {
            const key = formatKey(event.date);
            if (!key) return;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(event);
        });
        return grouped;
    }, [events]);

    const eventsById = useMemo(() => {
        const map = {};
        events.forEach((event) => {
            if (!event?.id) return;
            const dateValue = parseDate(event.date);
            const key = formatKey(event.date);
            if (!key || !dateValue) return;
            map[event.id] = { dateKey: key, dateValue };
        });
        return map;
    }, [events]);

    const sortedKeys = useMemo(() => {
        return Object.keys(eventsByDate).sort();
    }, [eventsByDate]);

    const defaultKey = sortedKeys[0] || null;
    const todayKey = formatKey(new Date());

    useEffect(() => {
        if (highlightId && eventsById[highlightId]) {
            const { dateKey, dateValue } = eventsById[highlightId];
            setSelectedDate(dateKey);
            setCurrentMonth(
                new Date(dateValue.getFullYear(), dateValue.getMonth(), 1),
            );
            return;
        }

        if (sortedKeys.length === 0) {
            setSelectedDate(null);
            return;
        }

        let fallback = null;
        if (todayKey && eventsByDate[todayKey]?.length) {
            fallback = todayKey;
        } else if (todayKey) {
            fallback =
                sortedKeys.find((key) => key >= todayKey) ||
                sortedKeys[sortedKeys.length - 1];
        } else {
            fallback = sortedKeys[sortedKeys.length - 1];
        }

        if (!fallback) {
            fallback = defaultKey;
        }

        if (fallback) {
            setSelectedDate(fallback);
            const parsed = parseDate(fallback);
            if (parsed) {
                setCurrentMonth(
                    new Date(parsed.getFullYear(), parsed.getMonth(), 1),
                );
            }
        }
    }, [
        highlightId,
        eventsById,
        eventsByDate,
        sortedKeys,
        todayKey,
        defaultKey,
    ]);

    const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

    const handleMonthChange = (delta) => {
        setCurrentMonth((prev) => {
            const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
            return next;
        });
    };

    const getMonthCells = useMemo(() => {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDay = new Date(year, month, 1);
        const offset = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = 42;

        return Array.from({ length: totalCells }, (_, index) => {
            const day = index - offset + 1;
            if (day < 1 || day > daysInMonth) {
                return { key: null, label: "", hasEvents: false };
            }
            const dateValue = new Date(year, month, day);
            const key = formatKey(dateValue);
            return {
                key,
                label: day,
                dateValue,
                hasEvents: Boolean(eventsByDate[key]?.length),
            };
        });
    }, [currentMonth, eventsByDate]);

    const monthLabel = currentMonth.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <div>
                    <div style={STYLES.title}>{title}</div>
                    <div style={STYLES.subtitle}>{monthLabel}</div>
                </div>
                <div style={STYLES.nav}>
                    <button
                        type="button"
                        style={STYLES.navButton}
                        onClick={() => handleMonthChange(-1)}
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        style={STYLES.navButton}
                        onClick={() => handleMonthChange(1)}
                    >
                        →
                    </button>
                </div>
            </div>
            <div style={STYLES.grid}>
                {DAY_NAMES.map((dow) => (
                    <div key={dow} style={STYLES.dayLabel}>
                        {dow}
                    </div>
                ))}
                {getMonthCells.map((cell, index) => {
                    const isSelected = cell.key && cell.key === selectedDate;
                    const baseStyle = { ...STYLES.cell };
                    if (!cell.key) {
                        return (
                            <div
                                key={`empty-${index}`}
                                style={{ ...baseStyle, ...STYLES.cellInactive }}
                            >
                                &nbsp;
                            </div>
                        );
                    }
                    const style = {
                        ...baseStyle,
                        ...(cell.hasEvents ? { borderColor: "#cbd5f5" } : {}),
                        ...(isSelected ? STYLES.cellSelected : {}),
                    };
                    return (
                        <button
                            key={`${cell.key}-${index}`}
                            type="button"
                            style={style}
                            onClick={() => setSelectedDate(cell.key)}
                        >
                            {cell.label}
                            {cell.hasEvents && <span style={STYLES.dot} />}
                        </button>
                    );
                })}
            </div>
            <div style={STYLES.detail}>
                <div style={STYLES.detailTitle}>
                    {selectedDate
                        ? `Événements du ${formatLabel(selectedDate)}`
                        : "Sélectionnez une date"}
                </div>
                {selectedEvents.length === 0 ? (
                    <div style={STYLES.emptyState}>
                        Aucun événement enregistré pour cette date.
                    </div>
                ) : (
                    <div style={STYLES.eventList}>
                        {selectedEvents.map((event) => (
                            <div key={event.id} style={STYLES.eventItem}>
                                <div style={STYLES.eventLabel}>
                                    {event.membre?.prenom || ""}{" "}
                                    {event.membre?.nom || ""}{" "}
                                    {event.classe?.nom
                                        ? `(${event.classe.nom})`
                                        : ""}
                                </div>
                                <div style={STYLES.eventMeta}>
                                    {event.reference && (
                                        <span>Réf. {event.reference} • </span>
                                    )}
                                    {event.classe?.nom && (
                                        <span>{event.classe.nom} • </span>
                                    )}
                                    <span>{formatStatus(event.statut)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
