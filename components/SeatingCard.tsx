"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LayoutGrid, Loader2, X, Check, Pencil } from "lucide-react";
import type { SeatingZone, SeatingRecord } from "@/types";

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  pink:   { bg: "bg-pink-50",   border: "border-pink-200",   badge: "bg-pink-100 text-pink-700" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   badge: "bg-teal-100 text-teal-700" },
  red:    { bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-700" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
};
const COLORS = Object.keys(COLOR_MAP);
const COLOR_LABELS: Record<string, string> = {
  blue: "青", green: "緑", purple: "紫", orange: "橙",
  pink: "ピンク", teal: "水色", red: "赤", yellow: "黄",
};

interface SeatingData {
  zones: SeatingZone[];
  records: SeatingRecord[];
  myZoneId: string | null;
}

export default function SeatingCard() {
  const { data: session } = useSession();
  const [data, setData] = useState<SeatingData>({ zones: [], records: [], myZoneId: null });
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 管理者: ゾーン追加
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", color: "blue" });
  const [addingZone, setAddingZone] = useState(false);

  const isAdmin = session?.user?.isAdmin;
  const myEmail = session?.user?.email ?? "";

  async function fetchSeating() {
    const res = await fetch("/api/seating");
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSeating();
    const timer = setInterval(fetchSeating, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  async function selectZone(zoneId: string) {
    setSubmitting(true);
    try {
      if (data.myZoneId === zoneId) {
        await fetch("/api/seating", { method: "DELETE" });
      } else {
        await fetch("/api/seating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zoneId }),
        });
      }
      await fetchSeating();
      setShowPicker(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function addZone() {
    if (!newZone.name.trim()) return;
    setAddingZone(true);
    try {
      await fetch("/api/seating/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newZone, order: data.zones.length }),
      });
      setNewZone({ name: "", color: "blue" });
      setShowAddZone(false);
      await fetchSeating();
    } finally {
      setAddingZone(false);
    }
  }

  async function deleteZone(id: string) {
    if (!confirm("このゾーンを削除しますか？")) return;
    await fetch(`/api/seating/zones/${id}`, { method: "DELETE" });
    await fetchSeating();
  }

  // ゾーンごとにレコードをグループ化
  const recordsByZone: Record<string, SeatingRecord[]> = {};
  data.records.forEach((r) => {
    if (!recordsByZone[r.zoneId]) recordsByZone[r.zoneId] = [];
    recordsByZone[r.zoneId].push(r);
  });

  const myZone = data.zones.find((z) => z.id === data.myZoneId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-brand-600" />
          <h2 className="font-bold text-gray-800">今日の座席表</h2>
          {data.records.length > 0 && (
            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
              {data.records.length}人着席中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddZone(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              + ゾーン追加
            </button>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-all bg-brand-600 text-white hover:bg-brand-700"
          >
            <Pencil size={13} />
            {data.myZoneId ? "変更" : "座席を選ぶ"}
          </button>
        </div>
      </div>

      {/* 現在の自分の座席 */}
      {myZone && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500">あなた：</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${COLOR_MAP[myZone.color]?.badge ?? "bg-gray-100 text-gray-600"}`}>
            {myZone.name}
          </span>
          <button
            onClick={() => selectZone(data.myZoneId!)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            解除
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : data.zones.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          {isAdmin ? "「+ ゾーン追加」から部署ゾーンを登録してください" : "ゾーンが未設定です"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.zones.map((zone) => {
            const members = recordsByZone[zone.id] ?? [];
            const colors = COLOR_MAP[zone.color] ?? COLOR_MAP.blue;
            return (
              <div
                key={zone.id}
                className={`rounded-xl border p-3 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {zone.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{members.length}人</span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteZone(zone.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {members.length === 0 ? (
                  <p className="text-xs text-gray-400">まだ誰もいません</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <div key={m.uid} className="flex items-center gap-1.5">
                        {m.photo ? (
                          <Image src={m.photo} alt={m.name} width={28} height={28} className="rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm">
                            {m.name[0]}
                          </div>
                        )}
                        <span className="text-xs text-gray-700">
                          {m.name.split(" ")[0]}
                          {m.uid === myEmail && <span className="text-green-500 ml-0.5">●</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 座席選択モーダル */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">座席ゾーンを選ぶ</h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            {data.zones.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">ゾーンが登録されていません</p>
            ) : (
              <div className="space-y-2">
                {data.zones.map((zone) => {
                  const colors = COLOR_MAP[zone.color] ?? COLOR_MAP.blue;
                  const isSelected = data.myZoneId === zone.id;
                  const count = (recordsByZone[zone.id] ?? []).length;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => selectZone(zone.id)}
                      disabled={submitting}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-current`
                          : `border-gray-200 hover:${colors.bg} hover:${colors.border}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check size={15} className="text-green-500" />}
                        <span className={`font-medium text-sm ${isSelected ? "" : "text-gray-700"}`}>
                          {zone.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{count}人</span>
                    </button>
                  );
                })}
              </div>
            )}
            {data.myZoneId && (
              <button
                onClick={async () => { await selectZone(data.myZoneId!); }}
                className="w-full mt-3 text-sm text-red-500 hover:text-red-600 py-2"
              >
                座席を解除する
              </button>
            )}
          </div>
        </div>
      )}

      {/* ゾーン追加モーダル（管理者） */}
      {showAddZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">ゾーンを追加</h3>
              <button onClick={() => setShowAddZone(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">部署名 *</label>
                <input
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="例：CEO室、エンジニア、営業"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">カラー</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewZone({ ...newZone, color: c })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        COLOR_MAP[c].badge
                      } ${newZone.color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                    >
                      {COLOR_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowAddZone(false)}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={addZone}
                disabled={addingZone || !newZone.name.trim()}
                className="flex-1 py-2 text-sm text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center"
              >
                {addingZone ? <Loader2 size={14} className="animate-spin" /> : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
