"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { CalendarDays, Check, User, Plus } from "lucide-react";
import type { Desk, SeatingRecord, SeatingLayout } from "@/types";

interface Props {
  layout: SeatingLayout;
  desks: Desk[];
  records: SeatingRecord[];
  myEmail?: string;
  /** デスクがクリックされた時（予約/解除/プロフィール用） */
  onDeskClick?: (desk: Desk, record: SeatingRecord | null) => void;
  /** 編集モード（管理者） */
  editMode?: boolean;
  /** 編集: 空きエリアをクリック→新規デスク追加 */
  onAddAt?: (x: number, y: number) => void;
  /** 編集: デスクをドラッグ終了したら呼ばれる */
  onMoveDesk?: (deskId: string, x: number, y: number) => void;
}

/**
 * 図面画像を背景にして、x/y（0-1）座標でデスクを絶対配置する座席マップ。
 * - アスペクト比は画像の本来サイズを維持
 * - ユーザーモード: デスクをクリック → 親に通知（予約/解除/プロフィール表示）
 * - 編集モード: 空きエリアクリック → デスク追加、デスクドラッグで移動
 */
export default function SeatingMap({
  layout,
  desks,
  records,
  myEmail,
  onDeskClick,
  editMode = false,
  onAddAt,
  onMoveDesk,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);
  // ドラッグ中にプレビュー表示する x/y
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number } | null>(null);

  const recordByDesk = new Map<string, SeatingRecord>();
  records.forEach((r) => recordByDesk.set(r.deskId, r));

  // アスペクト比で高さを維持
  const aspect = layout.imageWidth / layout.imageHeight;

  // 座標変換: マウスイベント → 画像上の相対 x/y (0-1)
  const toPct = useCallback((ev: React.MouseEvent | MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / rect.width;
    const y = (ev.clientY - rect.top) / rect.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }, []);

  // ドラッグ中のマウス移動で位置をプレビュー更新
  useEffect(() => {
    if (!dragging) return;
    function handleMove(ev: MouseEvent) {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
      setDragPreview({ id: dragging!.id, x, y });
    }
    function handleUp(ev: MouseEvent) {
      const wrap = wrapRef.current;
      if (wrap && onMoveDesk) {
        const rect = wrap.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
        // 誤差で元の位置とほぼ同じなら更新しない
        const moved = Math.abs(x - dragging!.startX) > 0.003 || Math.abs(y - dragging!.startY) > 0.003;
        if (moved) onMoveDesk(dragging!.id, x, y);
      }
      setDragging(null);
      setDragPreview(null);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, onMoveDesk]);

  function handleBackgroundClick(ev: React.MouseEvent) {
    if (!editMode || !onAddAt) return;
    if (dragging) return;
    // デスクアイコン自身のクリック（子要素）は stopPropagation しているので、ここには来ない
    const { x, y } = toPct(ev);
    onAddAt(x, y);
  }

  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded-xl p-2 overflow-x-auto"
      role="region"
      aria-label={`座席マップ${layout.floor ? ` ${layout.floor}` : ""}`}
    >
      <div
        ref={wrapRef}
        onClick={handleBackgroundClick}
        className={`relative mx-auto select-none ${editMode ? "cursor-crosshair" : ""}`}
        style={{
          width: "100%",
          maxWidth: layout.imageWidth,
          aspectRatio: `${aspect}`,
        }}
      >
        {/* 背景図面 */}
        <Image
          src={layout.imagePath}
          alt={`フロア図 ${layout.floor ?? ""}`}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-contain pointer-events-none"
          priority
          unoptimized
        />

        {/* デスク */}
        {desks.map((d) => {
          const record = d.type === "desk" ? recordByDesk.get(d.id) ?? null : null;
          const isMe = !!record && record.uid === myEmail;
          const isDragged = dragPreview?.id === d.id;
          const x = isDragged ? dragPreview!.x : d.x;
          const y = isDragged ? dragPreview!.y : d.y;
          return (
            <DeskMarker
              key={d.id}
              desk={d}
              record={record}
              isMe={isMe}
              x={x}
              y={y}
              editMode={editMode}
              onClick={(e) => {
                e.stopPropagation();
                if (editMode || d.type !== "desk") return;
                onDeskClick?.(d, record);
              }}
              onMouseDown={(e) => {
                if (!editMode) return;
                e.stopPropagation();
                setDragging({ id: d.id, startX: d.x, startY: d.y });
                setDragPreview({ id: d.id, x: d.x, y: d.y });
              }}
              onEditClick={(e) => {
                e.stopPropagation();
                if (editMode) onDeskClick?.(d, record);
              }}
            />
          );
        })}
      </div>
      {!editMode && <Legend floor={layout.floor} />}
    </div>
  );
}

function DeskMarker({
  desk,
  record,
  isMe,
  x,
  y,
  editMode,
  onClick,
  onMouseDown,
  onEditClick,
}: {
  desk: Desk;
  record: SeatingRecord | null;
  isMe: boolean;
  x: number;
  y: number;
  editMode: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onEditClick: (e: React.MouseEvent) => void;
}) {
  // ラベル（注釈）セル
  if (desk.type === "label") {
    return (
      <div
        onMouseDown={onMouseDown}
        onClick={onEditClick}
        className={`absolute -translate-x-1/2 -translate-y-1/2 bg-white/80 border border-gray-400 text-gray-700 text-[10px] px-1.5 py-0.5 rounded shadow-sm ${
          editMode ? "cursor-grab hover:bg-white" : "pointer-events-none"
        }`}
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      >
        {desk.label}
      </div>
    );
  }

  // 状態別スタイル（WCAG AA）
  const status = record?.status;
  let bgCls = "bg-gray-50 border-gray-500 text-gray-700 hover:bg-gray-100";
  let icon: React.ReactNode = <User size={9} aria-hidden />;
  let ariaState = "空き";
  if (status === "reserved") {
    bgCls = "bg-blue-100 border-blue-700 text-blue-900 hover:bg-blue-200";
    icon = <CalendarDays size={9} aria-hidden />;
    ariaState = `予約中 ${record?.name ?? ""}`;
  } else if (status === "in_use") {
    bgCls = "bg-amber-100 border-amber-700 text-amber-900 hover:bg-amber-200";
    icon = <Check size={9} aria-hidden />;
    ariaState = `利用中 ${record?.name ?? ""}`;
  }
  const ringCls = isMe ? "ring-2 ring-offset-1 ring-gray-800" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={`${desk.label} ${ariaState}`}
      title={record ? `${desk.label}｜${record.name}（${status === "in_use" ? "利用中" : "予約"}）` : `${desk.label}｜空き`}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-semibold transition-colors shadow ${bgCls} ${ringCls} ${
        editMode ? "cursor-grab" : "cursor-pointer"
      }`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      {record ? (
        <span className="leading-none">{desk.label}</span>
      ) : (
        icon
      )}
    </button>
  );
}

function Legend({ floor }: { floor?: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 mt-3 px-2 text-xs text-gray-600"
      role="region"
      aria-label="凡例"
    >
      {floor && (
        <span className="font-semibold text-gray-700 mr-2">{floor}</span>
      )}
      <LegendItem
        swatch="bg-gray-50 border-gray-500"
        icon={<User size={10} className="text-gray-500" aria-hidden />}
        label="空き"
      />
      <LegendItem
        swatch="bg-blue-100 border-blue-700"
        icon={<CalendarDays size={10} className="text-blue-900" aria-hidden />}
        label="予約"
      />
      <LegendItem
        swatch="bg-amber-100 border-amber-700"
        icon={<Check size={10} className="text-amber-900" aria-hidden />}
        label="利用中"
      />
      <div className="inline-flex items-center gap-1.5 ml-auto">
        <span className="inline-block w-3 h-3 rounded-full ring-2 ring-gray-800" aria-hidden />
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
        className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center ${swatch}`}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

/** 編集モード用: 空きエリアにマウスを乗せた時「ここに追加」インジケータを出したい場合用のノット */
export function AddIndicator({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-dashed border-brand-600 flex items-center justify-center text-brand-600 bg-white/60"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      <Plus size={12} aria-hidden />
    </div>
  );
}
