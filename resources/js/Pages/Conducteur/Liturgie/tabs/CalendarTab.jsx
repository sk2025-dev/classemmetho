import React from "react";
import MiniCalendar from "../../../../Components/MiniCalendar";

export default function CalendarTab({ calendarEvents }) {
    return (
        <div className="calendar-tab-root">
            <MiniCalendar
                events={calendarEvents}
                title="Calendrier des mariages"
            />
        </div>
    );
}
