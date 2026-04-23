"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Printer, X, Sparkles, Info } from "lucide-react";
import type { Desk, SeatingLayout, SeatingRecord, DeskType } from "@/types";
import SeatingMap from "./SeatingMap";

interface SeatingData {
  layout: SeatingLayout;
  desks: Desk[];
  records: SeatingRecord[];
}

interface PresetInfo {
  id: string;
  name: string;
  floor?: string;
  deskCount: number;
  labelCount: number;
}

const FALLBACK_LAYOUT: SeatingLayout = {
  floor: "4F",
  imagePath: "/seating/toranomon-4f.png",
  imageWidth: 2400,
  imageHeight: 1350,
};

export default function AdminSeatingTab() {
  const [data, setData] = useState<SeatingData>({
    layout: FALLBACK_LAYOUT,
    desks: [],
    records: [],
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{
    desk: Desk | null;
    x: number;
    y: number;
  } | null>(null);
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
        `「${presetName}」を適用すると現在のレイアウトとデスクは全て上書きされます。続行しますか？`
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

  async function saveDesk({
    id,
    x,
    y,
    label,
    type,
  }: {
    id?: string;
    x: number;
    y: number;
    label: string;
    type: DeskType;
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/seating/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, x, y, label, type }),
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
        label: target.label,
        type: target.type,
      }),
    });
  }

  async function deleteDesk(id: string) {
    if (!confirm("このマスを削除しますか？")) return;
    setBusy(true);
    try {
      await fetch(`/api/seating/desks/${id}`, { method: "DELETE" });
      setEditing(null);
      await fetchAll();
    } finally {
      setBusy(false);
    }
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
            ワンクリックで既製のフロアレイアウトを適用できます。図面画像とデスク初期配置が同時にセットされます（既存デスクは上書き）。
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
                  デスク{p.deskCount}
                  {p.labelCount > 0 && ` / ラベル${p.labelCount}`}
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
            <strong>図面の空きエリアをクリック</strong> → 新規デスク/ラベルを追加
          </div>
          <div>
            <strong>デスクをドラッグ</strong> → 位置を移動
            ／ <strong>クリック</strong> → 編集・削除
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
        records={data.records}
        editMode
        onDeskClick={(desk) =>
          setEditing({ desk, x: desk.x, y: desk.y })
        }
        onAddAt={(x, y) => setEditing({ desk: null, x, y })}
        onMoveDesk={moveDesk}
      />

      {editing && (
        <EditModal
          x={editing.x}
          y={editing.y}
          desk={editing.desk}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={saveDesk}
          onDelete={deleteDesk}
        />
      )}
    </div>
  );
}

function EditModal({
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
    label: string;
    type: DeskType;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState(desk?.label ?? "");
  const [type, setType] = useState<DeskType>(desk?.type ?? "desk");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">
            {desk ? "マスを編集" : "マスを追加"}{" "}
            <span className="text-xs text-gray-400 font-normal">
              ({(x * 100).toFixed(1)}%, {(y * 100).toFixed(1)}%)
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              種別
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "desk", label: "デスク" },
                  { value: "label", label: "ラベル（注釈）" },
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
              placeholder={type === "desk" ? "例：A-01" : "例：会議室A、窓"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
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
                label: label.trim() || "(無題)",
                type,
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
