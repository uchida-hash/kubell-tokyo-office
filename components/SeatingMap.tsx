"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { CalendarDays, Check, User as UserIcon } from "lucide-react";
import type {
  Desk,
  Room,
  SeatingRecord,
  SeatingLayout,
} from "@/types";
import { getFloorPlan } from "./floorPlans";

// デスクのデフォルトサイズ（w/h が指定されていない場合）
const DEFAULT_DESK_W = 27;
const DEFAULT_DESK_H = 40;

interface Props {
  layout: SeatingLayout;
  desks: Desk[];
  rooms: Room[];
  records: SeatingRecord[];
  myEmail?: string;
  onDeskClick?: (desk: Desk, record: SeatingRecord | null) => void;
  onRoomClick?: (room: Room) => void;
  editMode?: boolean;
  onAddAt?: (x: number, y: number) => void;
  onMoveDesk?: (deskId: string, x: number, y: number) => void;
  onMoveRoom?: (roomId: string, x: number, y: number) => void;
}

/**
 * SVG viewBox 座標系で座席マップを描画する。
 * - 背景: 登録済みフロアプラン（または画像）
 * - オーバーレイ SVG: 会議室 + デスク（インタラクティブ）
 */
export default function SeatingMap({
  layout,
  desks,
  rooms,
  records,
  myEmail,
  onDeskClick,
  onRoomClick,
  editMode = false,
  onAddAt,
  onMoveDesk,
  onMoveRoom,
}: Props) {
  const overlayRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<
    | { kind: "desk" | "room"; id: string; startX: number; startY: number }
    | null
  >(null);
  const [dragPreview, setDragPreview] = useState<
    { kind: "desk" | "room"; id: string; x: number; y: number } | null
  >(null);

  const floorPlan = getFloorPlan(layout.floorKey);
  const vbW = floorPlan?.viewBoxWidth ?? layout.width;
  const vbH = floorPlan?.viewBoxHeight ?? layout.height;
  const aspect = vbW / vbH;

  const recordByDesk = useMemo(() => {
    const map = new Map<string, SeatingRecord>();
    records.forEach((r) => map.set(r.deskId, r));
    return map;
  }, [records]);

  // ポッド（島）ごとのベース矩形（WeWork 風の台座）
  const pods = useMemo(() => {
    const byPod: Record<string, Desk[]> = {};
    desks.forEach((d) => {
      if (!d.pod || d.type !== "desk") return;
      (byPod[d.pod] = byPod[d.pod] ?? []).push(d);
    });
    return Object.entries(byPod).map(([pod, ds]) => {
      const minX = Math.min(...ds.map((d) => d.x));
      const minY = Math.min(...ds.map((d) => d.y));
      const maxX = Math.max(
        ...ds.map((d) => d.x + (d.w ?? DEFAULT_DESK_W))
      );
      const maxY = Math.max(
        ...ds.map((d) => d.y + (d.h ?? DEFAULT_DESK_H))
      );
      return {
        pod,
        x: minX - 2,
        y: minY - 2,
        w: maxX - minX + 4,
        h: maxY - minY + 4,
      };
    });
  }, [desks]);

  // SVG 座標変換（clientX/Y → viewBox 単位）
  const toSvgCoord = useCallback(
    (ev: { clientX: number; clientY: number }) => {
      const svg = overlayRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * vbW;
      const y = ((ev.clientY - rect.top) / rect.height) * vbH;
      return { x: Math.max(0, Math.min(vbW, x)), y: Math.max(0, Math.min(vbH, y)) };
    },
    [vbW, vbH]
  );

  // ドラッグ中のグローバルマウスハンドラ
  useEffect(() => {
    if (!dragging) return;
    function handleMove(ev: MouseEvent) {
      const { x, y } = toSvgCoord(ev);
      setDragPreview({ kind: dragging!.kind, id: dragging!.id, x, y });
    }
    function handleUp(ev: MouseEvent) {
      const { x, y } = toSvgCoord(ev);
      const moved =
        Math.abs(x - dragging!.startX) > 2 ||
        Math.abs(y - dragging!.startY) > 2;
      if (moved) {
        if (dragging!.kind === "desk") onMoveDesk?.(dragging!.id, x, y);
        else onMoveRoom?.(dragging!.id, x, y);
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
  }, [dragging, onMoveDesk, onMoveRoom, toSvgCoord]);

  function handleOverlayClick(ev: React.MouseEvent) {
    if (!editMode || !onAddAt) return;
    if (dragging) return;
    // 子要素のクリックは各要素が stopPropagation するのでここには来ない想定
    const { x, y } = toSvgCoord(ev);
    onAddAt(x, y);
  }

  // 描画時の desk 位置（ドラッグ中はプレビュー）
  function deskPos(d: Desk) {
    if (dragPreview?.kind === "desk" && dragPreview.id === d.id) {
      return { x: dragPreview.x, y: dragPreview.y };
    }
    return { x: d.x, y: d.y };
  }
  function roomPos(r: Room) {
    if (dragPreview?.kind === "room" && dragPreview.id === r.id) {
      return { x: dragPreview.x, y: dragPreview.y };
    }
    return { x: r.x, y: r.y };
  }

  return (
    <div
      className="bg-[#F2EDE4] border border-gray-200 rounded-xl p-2 overflow-x-auto"
      role="region"
      aria-label={`座席マップ${layout.floor ? ` ${layout.floor}` : ""}`}
    >
      <div
        className={`relative mx-auto select-none ${editMode ? "cursor-crosshair" : ""}`}
        style={{
          width: "100%",
          maxWidth: vbW,
          aspectRatio: `${aspect}`,
        }}
      >
        {/* 背景フロアプラン */}
        {floorPlan ? (
          <floorPlan.Component className="absolute inset-0 w-full h-full pointer-events-none" />
        ) : layout.imagePath ? (
          <Image
            src={layout.imagePath}
            alt={`フロア図 ${layout.floor ?? ""}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1400px"
            className="object-contain pointer-events-none"
            priority
            unoptimized
          />
        ) : null}

        {/* インタラクティブレイヤー（SVG overlay） */}
        <svg
          ref={overlayRef}
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          onClick={handleOverlayClick}
        >
          {/* ポッド（島）の台座 */}
          {pods.map((p) => (
            <rect
              key={p.pod}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill="rgba(255,255,255,.4)"
              stroke="rgba(80,110,150,.2)"
              strokeWidth="0.6"
              rx="2"
              pointerEvents="none"
            />
          ))}

          {/* 会議室・設備室 */}
          {rooms.map((r) => {
            const { x, y } = roomPos(r);
            return (
              <RoomElement
                key={r.id}
                room={{ ...r, x, y }}
                editMode={editMode}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editMode) onRoomClick?.(r);
                }}
                onMouseDown={(e) => {
                  if (!editMode) return;
                  e.stopPropagation();
                  setDragging({
                    kind: "room",
                    id: r.id,
                    startX: r.x,
                    startY: r.y,
                  });
                  setDragPreview({ kind: "room", id: r.id, x: r.x, y: r.y });
                }}
              />
            );
          })}

          {/* デスク */}
          {desks.map((d) => {
            const record =
              d.type === "desk" ? recordByDesk.get(d.id) ?? null : null;
            const { x, y } = deskPos(d);
            return (
              <DeskElement
                key={d.id}
                desk={{ ...d, x, y }}
                record={record}
                isMe={!!record && record.uid === myEmail}
                editMode={editMode}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editMode || d.type !== "desk") {
                    if (editMode) onDeskClick?.(d, record);
                    return;
                  }
                  onDeskClick?.(d, record);
                }}
                onMouseDown={(e) => {
                  if (!editMode) return;
                  e.stopPropagation();
                  setDragging({
                    kind: "desk",
                    id: d.id,
                    startX: d.x,
                    startY: d.y,
                  });
                  setDragPreview({ kind: "desk", id: d.id, x: d.x, y: d.y });
                }}
              />
            );
          })}
        </svg>
      </div>
      {!editMode && <Legend floor={layout.floor} />}
    </div>
  );
}

function RoomElement({
  room,
  editMode,
  onClick,
  onMouseDown,
}: {
  room: Room;
  editMode: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  // 設備室（IT/TRASH/MOP 等）
  if (room.type === "service") {
    return (
      <g
        onClick={onClick}
        onMouseDown={onMouseDown}
        style={{ cursor: editMode ? "grab" : "default" }}
      >
        <rect
          x={room.x}
          y={room.y}
          width={room.w}
          height={room.h}
          fill="#D0D0D0"
          stroke="#999"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={room.x + room.w / 2}
          y={room.y + room.h / 2 + 3}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#555"
          style={{ letterSpacing: "0.1em", pointerEvents: "none" }}
        >
          {room.name}
        </text>
      </g>
    );
  }
  // フォンブース
  if (room.type === "phone") {
    return (
      <g
        onClick={onClick}
        onMouseDown={onMouseDown}
        style={{ cursor: editMode ? "grab" : "default" }}
      >
        <rect
          x={room.x}
          y={room.y}
          width={room.w}
          height={room.h}
          fill="#F5EFE4"
          stroke="#C6B890"
          strokeWidth="1"
          rx="3"
        />
        <text
          x={room.x + room.w / 2}
          y={room.y + room.h / 2 + 3}
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#8A7A4E"
          style={{ pointerEvents: "none" }}
        >
          {room.name}
        </text>
      </g>
    );
  }
  // 会議室
  return (
    <g
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ cursor: editMode ? "grab" : "default" }}
    >
      <rect
        x={room.x}
        y={room.y}
        width={room.w}
        height={room.h}
        fill="#CDE8D8"
        stroke="#6FA886"
        strokeWidth="1.2"
        rx="3"
      />
      {/* 机（装飾） */}
      <rect
        x={room.x + room.w * 0.25}
        y={room.y + room.h * 0.3}
        width={room.w * 0.5}
        height={room.h * 0.4}
        fill="#fff"
        stroke="#6FA886"
        strokeWidth="0.8"
        rx="2"
        pointerEvents="none"
      />
      <text
        x={room.x + room.w / 2}
        y={room.y + 14}
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#2E6B48"
        style={{ letterSpacing: "0.08em", pointerEvents: "none" }}
      >
        {room.name}
      </text>
      {room.capacity != null && (
        <text
          x={room.x + room.w / 2}
          y={room.y + room.h - 6}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill="#2E6B48"
          style={{ pointerEvents: "none" }}
        >
          {room.capacity} PAX
        </text>
      )}
    </g>
  );
}

function DeskElement({
  desk,
  record,
  isMe,
  editMode,
  onClick,
  onMouseDown,
}: {
  desk: Desk;
  record: SeatingRecord | null;
  isMe: boolean;
  editMode: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const w = desk.w ?? DEFAULT_DESK_W;
  const h = desk.h ?? DEFAULT_DESK_H;

  // ラベル（注釈）
  if (desk.type === "label") {
    return (
      <g
        onClick={onClick}
        onMouseDown={onMouseDown}
        style={{ cursor: editMode ? "grab" : "default" }}
      >
        <rect
          x={desk.x}
          y={desk.y}
          width={w}
          height={h}
          fill="rgba(255,255,255,.8)"
          stroke="#8A857E"
          strokeWidth="0.8"
          rx="3"
        />
        <text
          x={desk.x + w / 2}
          y={desk.y + h / 2 + 3}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#4A4A4A"
          style={{ pointerEvents: "none" }}
        >
          {desk.label}
        </text>
      </g>
    );
  }

  // 状態別の色（kubell 配色 + WCAG AA）
  const status = record?.status;
  let fill = "#FFFFFF";
  let border = "#C8D3DE";
  let textColor = "#8A857E";
  if (status === "in_use") {
    fill = "#FCE4D9"; // kubell 赤ソフト
    border = "#F04600";
    textColor = "#C73800";
  } else if (status === "reserved") {
    fill = "#E4EEF9";
    border = "#2F6FB5";
    textColor = "#1E4D85";
  }

  // 椅子描画（orient 方向）
  let chair: React.ReactNode = null;
  if (desk.orient === "up") {
    chair = (
      <rect
        x={desk.x + 6}
        y={desk.y - 6}
        width={w - 12}
        height={5}
        fill="#8E8577"
        rx="2"
        opacity="0.55"
      />
    );
  } else if (desk.orient === "down") {
    chair = (
      <rect
        x={desk.x + 6}
        y={desk.y + h + 1}
        width={w - 12}
        height={5}
        fill="#8E8577"
        rx="2"
        opacity="0.55"
      />
    );
  } else if (desk.orient === "left") {
    chair = (
      <rect
        x={desk.x - 6}
        y={desk.y + 6}
        width={5}
        height={h - 12}
        fill="#8E8577"
        rx="2"
        opacity="0.55"
      />
    );
  } else if (desk.orient === "right") {
    chair = (
      <rect
        x={desk.x + w + 1}
        y={desk.y + 6}
        width={5}
        height={h - 12}
        fill="#8E8577"
        rx="2"
        opacity="0.55"
      />
    );
  }

  // 自分の席は外周に太線リングを付ける
  const myRing = isMe ? (
    <rect
      x={desk.x - 2}
      y={desk.y - 2}
      width={w + 4}
      height={h + 4}
      fill="none"
      stroke="#1A1A1A"
      strokeWidth="2"
      rx="4"
      pointerEvents="none"
    />
  ) : null;

  const titleText = record
    ? `${desk.label}｜${record.name}（${status === "in_use" ? "利用中" : "予約"}）`
    : `${desk.label}｜空き`;

  return (
    <g
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ cursor: editMode ? "grab" : "pointer" }}
    >
      <title>{titleText}</title>
      {chair}
      <rect
        x={desk.x}
        y={desk.y}
        width={w}
        height={h}
        fill={fill}
        stroke={border}
        strokeWidth="1"
        rx="3"
      />
      {record ? (
        <g pointerEvents="none">
          <text
            x={desk.x + w / 2}
            y={desk.y + h / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill={textColor}
          >
            {(record.name.split(" ")[0] ?? "").slice(0, 2)}
          </text>
          {/* 状態ドット */}
          <circle
            cx={desk.x + w - 5}
            cy={desk.y + 5}
            r="3"
            fill={status === "in_use" ? "#F04600" : "#2F6FB5"}
            stroke="#fff"
            strokeWidth="1"
          />
        </g>
      ) : (
        <text
          x={desk.x + w / 2}
          y={desk.y + h / 2 + 3}
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill={textColor}
          style={{ pointerEvents: "none" }}
        >
          空
        </text>
      )}
      {/* 座席番号（小さく） */}
      <text
        x={desk.x + 2}
        y={desk.y + 7}
        fontSize="5"
        fontWeight="700"
        fill="rgba(0,0,0,.35)"
        style={{ pointerEvents: "none" }}
      >
        {desk.label}
      </text>
      {myRing}
    </g>
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
        swatch="bg-white border-gray-400"
        icon={<UserIcon size={10} className="text-gray-500" aria-hidden />}
        label="空き"
      />
      <LegendItem
        swatch="bg-[#E4EEF9] border-[#2F6FB5]"
        icon={<CalendarDays size={10} className="text-[#1E4D85]" aria-hidden />}
        label="予約"
      />
      <LegendItem
        swatch="bg-[#FCE4D9] border-[#F04600]"
        icon={<Check size={10} className="text-[#C73800]" aria-hidden />}
        label="利用中"
      />
      <div className="inline-flex items-center gap-1.5 ml-auto">
        <span
          className="inline-block w-3 h-3 rounded-sm ring-2 ring-gray-800"
          aria-hidden
        />
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
        className={`inline-flex w-5 h-5 rounded-sm border items-center justify-center ${swatch}`}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
