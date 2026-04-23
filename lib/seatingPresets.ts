import type { DeskType, SeatingLayout } from "@/types";

export interface PresetDesk {
  x: number;
  y: number;
  label: string;
  type: DeskType;
}

export interface SeatingPreset {
  id: string;
  name: string;
  layout: SeatingLayout;
  desks: PresetDesk[];
}

/**
 * 虎ノ門 4F レイアウトのプリセット（SVG フロアプラン）。
 * floorKey=toranomon-4f で SVG 描画。viewBox は 1200×800。
 * x/y は 0.0〜1.0（viewBox に対する相対位置）。
 * 位置は図面を見ながらの近似値。管理画面でドラッグして微調整してください。
 *
 * SVG 上の主な領域（参考）:
 *   - 左アメニティ棟:   x=40-220   / y=110-620
 *   - 中央会議室/Lounge: x=240-500 / y=60-740
 *   - フレキシブル:     x=510-940  / y=320-600
 *   - オフィスデスク帯:  x=510-1140 / y=60-310 (上) および y=610-740 (下)
 *   - 右側デスク帯:     x=950-1140 / y=60-740
 */
const TORANOMON_4F: SeatingPreset = (() => {
  const desks: PresetDesk[] = [];

  // ヘルパー: アンカー (ax, ay) を左上として rows × cols のクラスターを配置
  // ax, ay は 0-1 相対座標
  function cluster(
    prefix: string,
    ax: number,
    ay: number,
    rows: number,
    cols: number,
    dx = 0.032,
    dy = 0.055
  ) {
    let n = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        desks.push({
          x: ax + c * dx,
          y: ay + r * dy,
          label: `${prefix}-${String(n).padStart(2, "0")}`,
          type: "desk",
        });
        n++;
      }
    }
  }

  // viewBox=1200x800 基準。
  // y: 0.075 = y60, 0.1 = y80, 0.5 = y400 など

  // ===== 上部（北側）のデスククラスター =====
  // オフィス上部帯: viewBox y=60-300 → 0.075-0.375
  cluster("A", 0.45, 0.10, 2, 2); // x=540-600, y=80-168
  cluster("B", 0.57, 0.10, 2, 2); // x=684-744
  cluster("C", 0.70, 0.10, 2, 2); // x=840-900
  cluster("D", 0.83, 0.10, 2, 2); // x=996-1056

  cluster("E", 0.45, 0.24, 2, 2); // y=192-280
  cluster("F", 0.57, 0.24, 2, 2);
  cluster("G", 0.70, 0.24, 2, 2);
  cluster("H", 0.83, 0.24, 2, 2);

  // ===== 右側（フレキシブルエリア右）のデスククラスター =====
  cluster("I", 0.83, 0.43, 2, 2); // y=344-432
  cluster("J", 0.83, 0.56, 2, 2); // y=448-536

  // ===== 下部（南側）のデスククラスター =====
  // viewBox y=610-740 → 0.76-0.925
  cluster("K", 0.45, 0.78, 2, 2);
  cluster("L", 0.57, 0.78, 2, 2);
  cluster("M", 0.70, 0.78, 2, 2);
  cluster("N", 0.83, 0.78, 2, 2);

  return {
    id: "toranomon-4f",
    name: "虎ノ門 4F（KDX 虎ノ門1丁目）",
    layout: {
      floor: "4F",
      floorKey: "toranomon-4f",
      imageWidth: 1200,
      imageHeight: 800,
    },
    desks,
  };
})();

export const SEATING_PRESETS: Record<string, SeatingPreset> = {
  "toranomon-4f": TORANOMON_4F,
};
