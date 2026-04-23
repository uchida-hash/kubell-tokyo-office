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
 * 虎ノ門 4F レイアウトのプリセット
 * `/public/seating/toranomon-4f.png` を背景にした絶対座標方式。
 * x/y は 0.0〜1.0（画像幅・高さに対する相対位置）。
 * 位置は図面を見ながらの近似値。管理画面でドラッグして微調整してください。
 */
const TORANOMON_4F: SeatingPreset = (() => {
  const desks: PresetDesk[] = [];

  // ヘルパー: アンカー (ax, ay) を左上として、rows × cols のクラスターを配置
  function cluster(
    prefix: string,
    ax: number,
    ay: number,
    rows: number,
    cols: number,
    dx = 0.022,
    dy = 0.048
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

  // ==== 上部（北側）のデスククラスター ====
  // 図面上、会議室の列よりも上、メインオフィスの上半分
  // 4 クラスター × 2列（上下2段）
  cluster("A", 0.435, 0.095, 2, 2); // 上段・左
  cluster("B", 0.560, 0.095, 2, 2);
  cluster("C", 0.685, 0.095, 2, 2);
  cluster("D", 0.810, 0.095, 2, 2);

  cluster("E", 0.435, 0.245, 2, 2); // 中段
  cluster("F", 0.560, 0.245, 2, 2);
  cluster("G", 0.685, 0.245, 2, 2);
  cluster("H", 0.810, 0.245, 2, 2);

  // ==== 右側（フレキシブルエリア右）のデスククラスター ====
  cluster("I", 0.810, 0.420, 2, 2);
  cluster("J", 0.810, 0.560, 2, 2);

  // ==== 下部（南側）のデスククラスター ====
  cluster("K", 0.435, 0.700, 2, 2);
  cluster("L", 0.560, 0.700, 2, 2);
  cluster("M", 0.685, 0.700, 2, 2);
  cluster("N", 0.810, 0.700, 2, 2);

  cluster("O", 0.435, 0.840, 2, 2);
  cluster("P", 0.560, 0.840, 2, 2);
  cluster("Q", 0.685, 0.840, 2, 2);
  cluster("R", 0.810, 0.840, 2, 2);

  return {
    id: "toranomon-4f",
    name: "虎ノ門 4F（KDX 虎ノ門1丁目）",
    layout: {
      floor: "4F",
      imagePath: "/seating/toranomon-4f.png",
      imageWidth: 2400,
      imageHeight: 1350,
    },
    desks,
  };
})();

export const SEATING_PRESETS: Record<string, SeatingPreset> = {
  "toranomon-4f": TORANOMON_4F,
};
