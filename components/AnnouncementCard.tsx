"use client";

import { useEffect, useState } from "react";
import { Megaphone, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Announcement } from "@/types";

const priorityConfig = {
  normal: {
    label: "お知らせ",
    icon: Megaphone,
    color: "text-brand-600",
    bg: "bg-brand-50 border-brand-200",
    badge: "bg-brand-100 text-brand-700",
  },
  important: {
    label: "重要",
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  urgent: {
    label: "緊急",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
  },
};

export default function AnnouncementCard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setAnnouncements(d?.announcements ?? []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone size={18} className="text-brand-600" />
        <h2 className="font-bold text-gray-800">掲示板</h2>
        {announcements.length > 0 && (
          <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
            {announcements.length}件
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          現在お知らせはありません
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = priorityConfig[a.priority] ?? priorityConfig.normal;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={cfg.color} />
                    <span className="font-semibold text-gray-800 text-sm">
                      {a.title}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {a.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(a.publishedAt), "M/d HH:mm", { locale: ja })} ·{" "}
                  {a.authorName}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
