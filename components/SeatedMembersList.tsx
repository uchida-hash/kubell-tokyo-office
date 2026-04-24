"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Users, Search, CalendarDays, Check } from "lucide-react";
import type { Desk, SeatingRecord } from "@/types";
import ProfileViewModal from "./ProfileViewModal";

interface Props {
  desks: Desk[];
  records: SeatingRecord[];
  myEmail?: string;
}

/**
 * 今日の座席登録済みメンバー一覧。
 * 名前 + 部署 + 状態 + デスク番号を表示。行をクリックするとプロフィール表示。
 */
export default function SeatedMembersList({
  desks,
  records,
  myEmail,
}: Props) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SeatingRecord | null>(null);

  const deskLabelById = useMemo(() => {
    const m = new Map<string, string>();
    desks.forEach((d) => m.set(d.id, d.label));
    return m;
  }, [desks]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = [...records].sort((a, b) => {
      // 自分を先頭、次に利用中、次に予約
      if (a.uid === myEmail) return -1;
      if (b.uid === myEmail) return 1;
      if (a.status !== b.status)
        return a.status === "in_use" ? -1 : 1;
      return a.name.localeCompare(b.name, "ja");
    });
    if (!query) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.department ?? "").toLowerCase().includes(query) ||
        (deskLabelById.get(r.deskId) ?? "").toLowerCase().includes(query)
    );
  }, [records, q, myEmail, deskLabelById]);

  const reservedCount = records.filter((r) => r.status === "reserved").length;
  const inUseCount = records.filter((r) => r.status === "in_use").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <Users size={16} className="text-gray-500" />
        <h3 className="font-semibold text-sm text-gray-800">
          今日の出社メンバー
        </h3>
        <span className="text-xs text-gray-500">
          合計 {records.length} 人
        </span>
        {inUseCount > 0 && (
          <span className="text-[11px] bg-[#FCE4D9] text-[#C73800] font-semibold px-2 py-0.5 rounded-full border border-[#F04600]">
            利用中 {inUseCount}
          </span>
        )}
        {reservedCount > 0 && (
          <span className="text-[11px] bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-full border border-[#2F6FB5]">
            予約 {reservedCount}
          </span>
        )}
        <div className="ml-auto relative">
          <Search
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="名前・部署・席番号"
            className="pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">
          {records.length === 0
            ? "まだ誰も席を登録していません"
            : "該当するメンバーがいません"}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
          {filtered.map((r) => {
            const deskLabel = deskLabelById.get(r.deskId) ?? r.deskId;
            const isMe = r.uid === myEmail;
            const StatusIcon = r.status === "in_use" ? Check : CalendarDays;
            const statusCls =
              r.status === "in_use"
                ? "bg-[#FCE4D9] text-[#C73800] border-[#F04600]"
                : "bg-blue-100 text-blue-900 border-[#2F6FB5]";

            return (
              <li key={r.uid}>
                <button
                  onClick={() => setSelected(r)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${
                    isMe ? "bg-amber-50/30" : ""
                  }`}
                >
                  {r.photo ? (
                    <Image
                      src={r.photo}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {r.name[0] ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-gray-800 truncate">
                        {r.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-semibold bg-gray-800 text-white px-1.5 py-0.5 rounded">
                          あなた
                        </span>
                      )}
                    </div>
                    {r.department && (
                      <div className="text-[11px] text-gray-500 truncate">
                        {r.department}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full border ${statusCls}`}
                    >
                      <StatusIcon size={9} aria-hidden />
                      {r.status === "in_use" ? "利用中" : "予約"}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {deskLabel}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <ProfileViewModal
          email={selected.uid}
          name={selected.name}
          photo={selected.photo}
          department={selected.department}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
