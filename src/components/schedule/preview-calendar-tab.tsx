"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { enUS } from 'date-fns/locale';

interface PreviewCalendarTabProps {
    events?: any[];
}

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})


export function PreviewCalendarTab({ events = [] }: PreviewCalendarTabProps) {
    const defaultEvents = [
        {
            title: 'Dr. Smith - Consultation',
            start: new Date(2024, 2, 10, 9, 0),
            end: new Date(2024, 2, 10, 9, 30),
            resource: 'Consultation'
        },
        {
            title: 'Dr. Smith - Break',
            start: new Date(2024, 2, 10, 12, 0),
            end: new Date(2024, 2, 10, 13, 0),
            resource: 'Break'
        }
    ];

    return (
        <div className="h-[700px] p-4 bg-white rounded-xl shadow-sm border">
            <Calendar
                localizer={localizer}
                events={defaultEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                views={['month', 'week', 'day']}
                defaultView="week"
                step={15}
                timeslots={4}
                eventPropGetter={(event: any) => ({
                    style: {
                        backgroundColor: event.resource === 'Break' ? '#f59e0b' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }
                })}
            />
        </div>
    );
}
