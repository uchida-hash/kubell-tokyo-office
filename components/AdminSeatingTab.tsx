"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  Printer,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  Desk,
  DeskOrient,
  DeskType,
  Room,
  RoomType,
  SeatingLayout,
  SeatingRecord,
} from "@/types";
import SeatingMap from "./SeatingMap";

interface SeatingData {
  layout: SeatingLayout;
  desks: Desk[];
  rooms: Room[];
  records: SeatingRecord[];
}

interface PresetInfo {
  id: string;
  name: string;
  floor?: string;
  deskCount: number;
  roomCount: number;
}

const FALLBACK_LAYOUT: SeatingLayout = {
  floor: "4F",
  floorKey: "toranomon-4f",
  width: 1400,
  height: 1456,
};

type EditingState =
  | {
      kind: "desk";
      desk: Desk | null;
      x: number;
      y: number;
    }
  | {
      kind: "room";
      room: Room;
    }
  | {
      kind: "add";
      x: number;
      y: number;
    };

export default function AdminSeatingTab() {
  const [data, setData] = useState<SeatingData>({
    layout: FALLBACK_LAYOUT,
    desks: [],
    rooms: [],
    records: [],
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [busy, setBusy] = useState(false);
  const [presets, setPresets] = useState<PresetInfo[]>([]);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/seating");
    if (res.ok) {
      const d = (await res.json()) as SeatingData;
      setData(d);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    fetch("/api/seating/preset")
      .then((r) => (r.ok ? r.json() : { presets: [] }))
      .then((d) => setPresets(d.presets ?? []))
      .catch(() => setPresets([]));
  }, [fetchAll]);

  async function applyPreset(presetId: string, presetName: string) {
    if (
      !confirm(
        `「${presetName}」を適用すると現在のレイアウト・デスク・会議室は全て上書きされます。続行しますか？`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/seating/preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: presetId }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "プリセット適用に失敗しました");
        return;
      }
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function saveDesk(payload: {
    id?: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    label: string;
    type: DeskType;
    orient?: DeskOrient;
    pod?: string;
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/seating/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "保存に失敗しました");
        return;
      }
      setEditing(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function saveRoom(payload: {
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    subname?: string;
    capacity?: number;
    type: RoomType;
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/seating/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "保存に失敗しました");
        return;
      }
      setEditing(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function deleteDesk(id: string) {
    if (!confirm("このデスクを削除しますか？")) return;
    setBusy(true);
    try {
      await fetch(`/api/seating/desks/${id}`, { method: "DELETE" });
      setEditing(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoom(id: string) {
    if (!confirm("この会議室/設備室を削除しますか？")) return;
    setBusy(true);
    try {
      await fetch(`/api/seating/rooms/${id}`, { method: "DELETE" });
      setEditing(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function moveDesk(id: string, x: number, y: number) {
    const target = data.desks.find((d) => d.id === id);
    if (!target) return;
    // 楽観更新
    setData((prev) => ({
      ...prev,
      desks: prev.desks.map((d) => (d.id === id ? { ...d, x, y } : d)),
    }));
    await fetch("/api/seating/desks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        x,
        y,
        w: target.w,
        h: target.h,
        label: target.label,
        type: target.type,
        orient: target.orient,
        pod: target.pod,
      }),
    });
  }

  async function moveRoom(id: string, x: number, y: number) {
    const target = data.rooms.find((r) => r.id === id);
    if (!target) return;
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, x, y } : r)),
    }));
    await fetch("/api/seating/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        x,
        y,
        w: target.w,
        h: target.h,
        name: target.name,
        subname: target.subname,
        capacity: target.capacity,
        type: target.type,
      }),
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* プリセット */}
      {presets.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-brand-600" />
            <h3 className="font-semibold text-brand-900 text-sm">
              オフィスプリセット
            </h3>
          </div>
          <p className="text-xs text-brand-800 mb-3">
            ワンクリックでフロアレイアウト・デスク・会議室を一括セット（既存データは上書き）。
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id, p.name)}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-white border border-brand-300 hover:bg-brand-100 text-brand-900 text-sm px-3 py-2 rounded-xl disabled:opacity-50"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs text-brand-600">
                  デスク {p.deskCount} / 会議室 {p.roomCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 操作ヒント */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2">
        <Info size={14} className="text-gray-500 mt-0.5 shrink-0" />
        <div className="text-xs text-gray-600 flex-1">
          <div>
            <strong>空きエリアをクリック</strong> → デスク or 会議室を追加
          </div>
          <div>
            <strong>ドラッグ</strong> → 位置を移動／ <strong>クリック</strong> → 編集・削除
          </div>
        </div>
        <Link
          href="/admin/seating-qr"
          className="shrink-0 inline-flex items-center gap-1 text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-2 py-1 rounded-lg"
        >
          <Printer size={12} />
          QR 印刷
        </Link>
      </div>

      {/* マップ */}
      <SeatingMap
        layout={data.layout}
        desks={data.desks}
        rooms={data.rooms}
        records={data.records}
        editMode
        onDeskClick={(desk) =>
          setEditing({ kind: "desk", desk, x: desk.x, y: desk.y })
        }
        onRoomClick={(room) => setEditing({ kind: "room", room })}
        onAddAt={(x, y) => setEditing({ kind: "add", x, y })}
        onMoveDesk={moveDesk}
        onMoveRoom={moveRoom}
      />

      {editing && editing.kind === "add" && (
        <AddTypeChooser
          x={editing.x}
          y={editing.y}
          onCancel={() => setEditing(null)}
          onPickDesk={() =>
            setEditing({
              kind: "desk",
              desk: null,
              x: editing.x,
              y: editing.y,
            })
          }
          onPickRoom={() => {
            const ret: EditingState = {
              kind: "room",
              room: {
                id: "",
                x: editing.x,
                y: editing.y,
                w: 110,
                h: 110,
                name: "",
                type: "meeting",
              } as Room,
            };
            setEditing(ret);
          }}
        />
      )}

      {editing && editing.kind === "desk" && (
        <DeskModal
          x={editing.x}
          y={editing.y}
          desk={editing.desk}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={saveDesk}
          onDelete={deleteDesk}
        />
      )}

      {editing && editing.kind === "room" && (
        <RoomModal
          room={editing.room}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={saveRoom}
          onDelete={deleteRoom}
        />
      )}
    </div>
  );
}

function AddTypeChooser({
  x,
  y,
  onCancel,
  onPickDesk,
  onPickRoom,
}: {
  x: number;
  y: number;
  onCancel: () => void;
  onPickDesk: () => void;
  onPickRoom: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">
            追加するもの
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({Math.round(x)}, {Math.round(y)})
            </span>
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2">
          <button
            onClick={onPickDesk}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-brand-50 hover:border-brand-300 transition-colors text-left"
          >
            <div className="w-8 h-10 border-2 border-gray-300 rounded bg-white" />
            <div>
              <div className="font-semibold text-sm text-gray-800">デスク</div>
              <div className="text-xs text-gray-500">1席分の予約可能なデスク</div>
            </div>
          </button>
          <button
            onClick={onPickRoom}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded bg-[#CDE8D8] border border-[#6FA886]" />
            <div>
              <div className="font-semibold text-sm text-gray-800">
                会議室 / 設備室
              </div>
              <div className="text-xs text-gray-500">
                サイズ・名称・収容人数を設定
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function DeskModal({
  x,
  y,
  desk,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  x: number;
  y: number;
  desk: Desk | null;
  busy: boolean;
  onClose: () => void;
  onSave: (v: {
    id?: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    label: string;
    type: DeskType;
    orient?: DeskOrient;
    pod?: string;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState(desk?.label ?? "");
  const [type, setType] = useState<DeskType>(desk?.type ?? "desk");
  const [orient, setOrient] = useState<DeskOrient | "">(desk?.orient ?? "");
  const [pod, setPod] = useState(desk?.pod ?? "");
  const [w, setW] = useState<number | "">(desk?.w ?? "");
  const [h, setH] = useState<number | "">(desk?.h ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">
            {desk ? "デスク編集" : "デスク追加"}
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({Math.round(x)}, {Math.round(y)})
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              種別
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "desk", label: "デスク" },
                  { value: "label", label: "ラベル" },
                ] as const
              ).map((o) => (
                <button
                  key={o.value}
                  onClick={() => setType(o.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm transition-all ${
                    type === o.value
                      ? "bg-brand-50 border-brand-600 text-brand-900 font-semibold"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              ラベル
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: A-01"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                幅 (px)
              </label>
              <input
                type="number"
                value={w}
                onChange={(e) =>
                  setW(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="27"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                高さ (px)
              </label>
              <input
                type="number"
                value={h}
                onChange={(e) =>
                  setH(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="40"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              椅子の向き
            </label>
            <div className="flex gap-1">
              {(
                [
                  { v: "", l: "なし" },
                  { v: "up", l: "上" },
                  { v: "down", l: "下" },
                  { v: "left", l: "左" },
                  { v: "right", l: "右" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setOrient(o.v as DeskOrient | "")}
                  className={`flex-1 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                    orient === o.v
                      ? "bg-brand-50 border-brand-600 text-brand-900 font-semibold"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              島（ポッド）キー
              <span className="text-gray-400 ml-1">任意</span>
            </label>
            <input
              value={pod}
              onChange={(e) => setPod(e.target.value)}
              placeholder="例: N11（同じ島のデスクで共通化）"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {desk && (
            <button
              onClick={() => onDelete(desk.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 size={14} />
              削除
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            onClick={() =>
              onSave({
                id: desk?.id,
                x,
                y,
                w: w === "" ? undefined : Number(w),
                h: h === "" ? undefined : Number(h),
                label: label.trim() || "(無題)",
                type,
                orient: orient || undefined,
                pod: pod.trim() || undefined,
              })
            }
            disabled={busy}
            className="px-4 py-2 text-sm text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            {desk ? "更新" : "追加"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomModal({
  room,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  room: Room;
  busy: boolean;
  onClose: () => void;
  onSave: (v: {
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    subname?: string;
    capacity?: number;
    type: RoomType;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const isNew = !room.id;
  const [name, setName] = useState(room.name ?? "");
  const [subname, setSubname] = useState(room.subname ?? "");
  const [capacity, setCapacity] = useState<number | "">(
    room.capacity ?? ""
  );
  const [type, setType] = useState<RoomType>(room.type ?? "meeting");
  const [w, setW] = useState<number>(room.w ?? 110);
  const [h, setH] = useState<number>(room.h ?? 110);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">
            {isNew ? "会議室を追加" : "会議室を編集"}
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({Math.round(room.x)}, {Math.round(room.y)})
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              種別
            </label>
            <div className="flex gap-2">
              {(
                [
                  { v: "meeting", l: "会議室" },
                  { v: "phone", l: "フォンブース" },
                  { v: "service", l: "設備室" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setType(o.v as RoomType)}
                  className={`flex-1 px-2 py-2 rounded-xl border text-sm transition-all ${
                    type === o.v
                      ? "bg-brand-50 border-brand-600 text-brand-900 font-semibold"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              名称
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: CONV ROOM 04A"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          {type !== "service" && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  サブ名称
                  <span className="text-gray-400 ml-1">任意</span>
                </label>
                <input
                  value={subname}
                  onChange={(e) => setSubname(e.target.value)}
                  placeholder="例: 4 CHAIRS"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  収容人数
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="例: 4"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                幅 (px)
              </label>
              <input
                type="number"
                value={w}
                onChange={(e) => setW(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                高さ (px)
              </label>
              <input
                type="number"
                value={h}
                onChange={(e) => setH(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {!isNew && (
            <button
              onClick={() => onDelete(room.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 size={14} />
              削除
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            onClick={() =>
              onSave({
                id: isNew ? undefined : room.id,
                x: room.x,
                y: room.y,
                w,
                h,
                name: name.trim() || "(無題)",
                subname: subname.trim() || undefined,
                capacity: capacity === "" ? undefined : Number(capacity),
                type,
              })
            }
            disabled={busy}
            className="px-4 py-2 text-sm text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            {isNew ? "追加" : "更新"}
          </button>
        </div>
      </div>
    </div>
  );
}
