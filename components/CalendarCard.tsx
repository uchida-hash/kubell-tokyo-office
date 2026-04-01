"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { CalendarEvent } from "@/types";

function formatEventDate(start: string, allDay: boolean): string {
  try {
    const d = parseISO(start);
    if (isToday(d)) return "今日";
    if (isTomorrow(d)) return "明日";
    if (allDay) return format(d, "M/d (E)", { locale: ja });
    return format(d, "M/d (E) HH:mm", { locale: ja });
  } catch {
    return start;
  }
}

function formatTime(start: string, end: string, allDay: boolean): string {
  if (allDay) return "終日";
  try {
    const s = parseISO(start);
    const e = parseISO(end);
    return `${format(s, "HH:mm")} 〜 ${format(e, "HH:mm")}`;
  } catch {
    return "";
  }
}

const eventColors = [
  "border-l-brand-500",
  "border-l-green-500",
  "border-l-purple-500",
  "border-l-orange-500",
  "border-l-pink-500",
  "border-l-teal-500",
];

export default function CalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        if (d.events) setEvents(d.events);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // 日付でグループ化
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((e, i) => {
    const key = e.allDay
      ? e.start
      : format(parseISO(e.start), "yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-purple-600" />
        <h2 className="font-bold text-gray-800">社内カレンダー</h2>
        <span className="text-xs text-gray-400">今後30日間</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      ) : error ? (
        <p className="text-center text-gray-400 text-sm py-6">
          カレンダーの取得に失敗しました
        </p>
      ) : events.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          今後30日間の予定はありません
        </p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
          {sortedKeys.map((dateKey) => (
            <div key={dateKey}>
              <div className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 bg-white pb-1">
                {(() => {
                  try {
                    const d = parseISO(dateKey);
                    if (isToday(d)) return `今日 (${format(d, "M/d E", { locale: ja })})`;
                    if (isTomorrow(d)) return `明日 (${format(d, "M/d E", { locale: ja })})`;
                    return format(d, "M月d日 (E)", { locale: ja });
                  } catch {
                    return dateKey;
                  }
                })()}
              </div>
              <div className="space-y-2">
                {grouped[dateKey].map((event, i) => (
                  <div
                    key={event.id}
                    className={`border-l-4 pl-3 py-1.5 ${eventColors[i % eventColors.length]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800 leading-snug">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatTime(event.start, event.end, event.allDay)}
                          {event.location && ` · 📍${event.location}`}
                        </p>
                      </div>
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-brand-600 shrink-0 mt-0.5"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
