import type {
  DeskOrient,
  DeskType,
  Room,
  RoomType,
  SeatingLayout,
} from "@/types";

export interface PresetDesk {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  type: DeskType;
  orient?: DeskOrient;
  pod?: string;
}

export type PresetRoom = Omit<Room, "id">;

export interface SeatingPreset {
  id: string;
  name: string;
  layout: SeatingLayout;
  desks: PresetDesk[];
  rooms: PresetRoom[];
}

/**
 * 虎ノ門 4F プリセット（kubell デザイン準拠）。
 * floorKey=toranomon-4f で SVG 描画。viewBox は 1400×1456。
 *
 * 6人島テーブル (tw=58, th=130 を縦向き、左右に 3 席ずつ) を北/南オフィスに並べる。
 * 会議室 2 室 + 設備室 3 室（IT, TRASH, MOP）をシード。
 */
const TORANOMON_4F: SeatingPreset = (() => {
  const desks: PresetDesk[] = [];

  // 6人長テーブル (縦向き) - SeatMap.jsx の table6v と同じ
  function table6v(prefix: string, x: number, y: number) {
    const tw = 58;
    const th = 130;
    const seatH = th / 3;
    for (let i = 0; i < 3; i++) {
      desks.push({
        label: `${prefix}L${i + 1}`,
        x,
        y: y + i * seatH + 2,
        w: tw / 2 - 2,
        h: seatH - 3,
        type: "desk",
        orient: "left",
        pod: prefix,
      });
    }
    for (let i = 0; i < 3; i++) {
      desks.push({
        label: `${prefix}R${i + 1}`,
        x: x + tw / 2 + 2,
        y: y + i * seatH + 2,
        w: tw / 2 - 2,
        h: seatH - 3,
        type: "desk",
        orient: "right",
        pod: prefix,
      });
    }
  }

  // 北オフィス: 6列 × 4段 = 24 テーブル × 6 席 = 144 席
  const N_COLS = [540, 680, 820, 960, 1100, 1240];
  const N_ROWS = [50, 200, 350, 500];
  N_ROWS.forEach((ry, ri) => {
    N_COLS.forEach((cx, ci) => {
      table6v(`N${ri + 1}${ci + 1}`, cx, ry);
    });
  });

  // 南オフィス: 6列 × 4段 = 144 席
  const S_COLS = [540, 680, 820, 960, 1100, 1240];
  const S_ROWS = [850, 1000, 1150, 1300];
  S_ROWS.forEach((ry, ri) => {
    S_COLS.forEach((cx, ci) => {
      table6v(`S${ri + 1}${ci + 1}`, cx, ry);
    });
  });

  const rooms: PresetRoom[] = [
    // 中央スパインの会議室
    {
      name: "CONV ROOM 04A",
      subname: "4 CHAIRS",
      capacity: 4,
      x: 410,
      y: 870,
      w: 110,
      h: 110,
      type: "meeting" as RoomType,
    },
    {
      name: "BRAIN STORM 04B",
      subname: "8 CHAIRS",
      capacity: 8,
      x: 410,
      y: 340,
      w: 110,
      h: 130,
      type: "meeting" as RoomType,
    },
    // 設備室
    {
      name: "IT",
      x: 420,
      y: 1100,
      w: 90,
      h: 50,
      type: "service" as RoomType,
    },
    {
      name: "TRASH",
      x: 420,
      y: 990,
      w: 90,
      h: 40,
      type: "service" as RoomType,
    },
    {
      name: "MOP",
      x: 420,
      y: 1040,
      w: 60,
      h: 40,
      type: "service" as RoomType,
    },
  ];

  return {
    id: "toranomon-4f",
    name: "虎ノ門 4F（kubell デザイン準拠）",
    layout: {
      floor: "4F",
      floorKey: "toranomon-4f",
      width: 1400,
      height: 1456,
    },
    desks,
    rooms,
  };
})();

export const SEATING_PRESETS: Record<string, SeatingPreset> = {
  "toranomon-4f": TORANOMON_4F,
};
