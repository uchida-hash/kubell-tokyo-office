"use client";

import Image from "next/image";
import { CalendarDays, Check, User } from "lucide-react";
import type { Desk, SeatingRecord, SeatingLayout } from "@/types";

interface Props {
  layout: SeatingLayout;
  desks: Desk[];
  records: SeatingRecord[];
  myEmail?: string;
  /** デスク/セルがクリックされた時のハンドラ */
  onCellClick?: (info: {
    row: number;
    col: number;
    desk: Desk | null;
    record: SeatingRecord | null;
  }) => void;
  /** 編集モード（管理者用） */
  editMode?: boolean;
  /** 縮小表示（ダッシュボード用） */
  compact?: boolean;
}

export default function SeatingGrid({
  layout,
  desks,
  records,
  myEmail,
  onCellClick,
  editMode = false,
  compact = false,
}: Props) {
  // (row, col) → desk のインデックス
  const deskByCell = new Map<string, Desk>();
  desks.forEach((d) => deskByCell.set(`${d.row}:${d.col}`, d));

  // deskId → record
  const recordByDesk = new Map<string, SeatingRecord>();
  records.forEach((r) => recordByDesk.set(r.deskId, r));

  const cellSize = compact ? 52 : 88;
  const gap = compact ? 4 : 8;

  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-x-auto"
      role="grid"
      aria-label="座席表"
    >
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
          gap: `${gap}px`,
          width: "max-content",
        }}
      >
        {Array.from({ length: layout.rows * layout.cols }).map((_, i) => {
          const row = Math.floor(i / layout.cols);
          const col = i % layout.cols;
          const desk = deskByCell.get(`${row}:${col}`) ?? null;
          const record = desk ? recordByDesk.get(desk.id) ?? null : null;
          return (
            <Cell
              key={`${row}:${col}`}
              row={row}
              col={col}
              desk={desk}
              record={record}
              isMe={!!record && record.uid === myEmail}
              compact={compact}
              editMode={editMode}
              onClick={() =>
                onCellClick?.({ row, col, desk, record })
              }
            />
          );
        })}
      </div>
      {!editMode && <Legend compact={compact} />}
    </div>
  );
}

function Cell({
  desk,
  record,
  isMe,
  compact,
  editMode,
  onClick,
}: {
  row: number;
  col: number;
  desk: Desk | null;
  record: SeatingRecord | null;
  isMe: boolean;
  compact: boolean;
  editMode: boolean;
  onClick: () => void;
}) {
  // 空きマス（デスクなし）
  if (!desk) {
    if (editMode) {
      return (
        <button
          onClick={onClick}
          className="rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
          aria-label="空きマス - クリックで追加"
        />
      );
    }
    return <div className="rounded-lg" aria-hidden />;
  }

  // ラベル（会議室・窓など）
  if (desk.type === "label") {
    return (
      <button
        onClick={onClick}
        disabled={!editMode}
        className="rounded-lg bg-gray-100 border border-gray-300 text-gray-600 text-xs font-medium flex items-center justify-center px-1 text-center disabled:cursor-default hover:enabled:bg-gray-200"
      >
        <span className="line-clamp-2 break-all">{desk.label}</span>
      </button>
    );
  }

  // デスク
  const status = record?.status;

  // 状態別スタイル（WCAG AA以上のコントラスト）
  let stateCls = "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100";
  let icon: React.ReactNode = null;
  let badge: string | null = null;
  let ariaState = "空き";
  if (status === "reserved") {
    stateCls =
      "bg-blue-100 border-blue-600 text-blue-900 hover:bg-blue-200";
    icon = <CalendarDays size={compact ? 10 : 12} aria-hidden />;
    badge = "予約";
    ariaState = `予約中 ${record?.name ?? ""}`;
  } else if (status === "in_use") {
    stateCls =
      "bg-amber-100 border-amber-600 text-amber-900 hover:bg-amber-200";
    icon = <Check size={compact ? 10 : 12} aria-hidden />;
    badge = "利用中";
    ariaState = `利用中 ${record?.name ?? ""}`;
  }

  const ringCls = isMe ? "ring-2 ring-offset-1 ring-gray-700" : "";

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg border-2 transition-colors flex flex-col items-center justify-center overflow-hidden ${stateCls} ${ringCls}`}
      aria-label={`${desk.label} ${ariaState}`}
      title={record ? `${desk.label} · ${record.name}（${badge}）` : desk.label}
    >
      <span
        className={`${compact ? "text-[10px]" : "text-[11px]"} font-semibold leading-none`}
      >
        {desk.label}
      </span>
      {record ? (
        <div className={`flex flex-col items-center ${compact ? "mt-0.5" : "mt-1"}`}>
          {!compact && record.photo ? (
            <Image
              src={record.photo}
              alt=""
              width={22}
              height={22}
              className="rounded-full"
            />
          ) : null}
          <span
            className={`${compact ? "text-[9px] mt-0.5" : "text-[10px] mt-0.5"} font-medium truncate max-w-full px-1`}
          >
            {record.name.split(" ")[0]}
            {isMe && (
              <span className="ml-0.5" aria-label="あなた">
                ●
              </span>
            )}
          </span>
          {badge && !compact && (
            <span className="text-[9px] mt-0.5 inline-flex items-center gap-0.5 bg-white/60 rounded px-1 py-[1px]">
              {icon}
              {badge}
            </span>
          )}
        </div>
      ) : (
        <User
          size={compact ? 14 : 18}
          className="mt-1 text-gray-300"
          aria-hidden
        />
      )}
    </button>
  );
}

function Legend({ compact }: { compact: boolean }) {
  if (compact) return null;
  return (
    <div
      className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600"
      role="region"
      aria-label="凡例"
    >
      <LegendItem
        swatch="bg-gray-50 border-gray-300"
        icon={null}
        label="空き"
      />
      <LegendItem
        swatch="bg-blue-100 border-blue-600"
        icon={<CalendarDays size={12} className="text-blue-900" />}
        label="予約"
      />
      <LegendItem
        swatch="bg-amber-100 border-amber-600"
        icon={<Check size={12} className="text-amber-900" />}
        label="利用中"
      />
      <div className="inline-flex items-center gap-1.5 ml-auto">
        <span className="inline-block w-3 h-3 rounded-full ring-2 ring-gray-700" />
        <span>あなた</span>
      </div>
    </div>
  );
}

function LegendItem({
  swatch,
  icon,
  label,
}: {
  swatch: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex w-4 h-4 rounded border-2 items-center justify-center ${swatch}`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
