"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Grid3x3, Printer, X, Sparkles } from "lucide-react";
import type { Desk, SeatingLayout, SeatingRecord, DeskType } from "@/types";
import SeatingGrid from "./SeatingGrid";

interface SeatingData {
  layout: SeatingLayout;
  desks: Desk[];
  records: SeatingRecord[];
}

interface PresetInfo {
  id: string;
  name: string;
  cols: number;
  rows: number;
  deskCount: number;
  labelCount: number;
}

export default function AdminSeatingTab() {
  const [data, setData] = useState<SeatingData>({
    layout: { cols: 12, rows: 8 },
    desks: [],
    records: [],
  });
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState(12);
  const [rows, setRows] = useState(8);
  const [editing, setEditing] = useState<{
    row: number;
    col: number;
    desk: Desk | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [presets, setPresets] = useState<PresetInfo[]>([]);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/seating");
    if (res.ok) {
      const d = (await res.json()) as SeatingData;
      setData(d);
      setCols(d.layout.cols);
      setRows(d.layout.rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    fetch("/api/seating/preset")
      .then((r) => r.ok ? r.json() : { presets: [] })
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

  async function saveLayout() {
    setBusy(true);
    try {
      await fetch("/api/seating/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cols, rows }),
      });
      await fetchAll();
    } finally {
      setBusy(false);
    }
  }

  async function saveDesk({
    id,
    row,
    col,
    label,
    type,
  }: {
    id?: string;
    row: number;
    col: number;
    label: string;
    type: DeskType;
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/seating/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, row, col, label, type }),
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
            ワンクリックで既製のレイアウトを適用できます（既存デスクは上書きされます）。
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
                  {p.cols}×{p.rows} / デスク{p.deskCount}・ラベル{p.labelCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* レイアウト設定 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Grid3x3 size={16} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm">
            グリッドサイズ
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm">
            <span className="text-gray-500 mr-1">列</span>
            <input
              type="number"
              min={1}
              max={30}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 mr-1">行</span>
            <input
              type="number"
              min={1}
              max={30}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm"
            />
          </label>
          <button
            onClick={saveLayout}
            disabled={busy}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            サイズ更新
          </button>
          <Link
            href="/admin/seating-qr"
            className="ml-auto inline-flex items-center gap-1 text-sm bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg"
          >
            <Printer size={14} />
            QR 印刷ページ
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          マスをクリック → デスク追加・ラベル追加・編集・削除
        </p>
      </div>

      {/* グリッド */}
      <SeatingGrid
        layout={data.layout}
        desks={data.desks}
        records={data.records}
        editMode
        onCellClick={({ row, col, desk }) => setEditing({ row, col, desk })}
      />

      {editing && (
        <EditModal
          row={editing.row}
          col={editing.col}
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
  row,
  col,
  desk,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  row: number;
  col: number;
  desk: Desk | null;
  busy: boolean;
  onClose: () => void;
  onSave: (v: {
    id?: string;
    row: number;
    col: number;
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
              ({row}, {col})
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
                  { value: "label", label: "ラベル（会議室など）" },
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
              placeholder={type === "desk" ? "例：A-1" : "例：会議室A、窓"}
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
                row,
                col,
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
