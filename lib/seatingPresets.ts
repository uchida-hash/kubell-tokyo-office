import type { DeskType, SeatingLayout } from "@/types";

export interface PresetDesk {
  row: number;
  col: number;
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
 * 虎ノ門 4F（KDX 虎ノ門1丁目 4F）レイアウトのプリセット
 * PDF を 20×12 グリッドに簡略化したもの。
 * 管理画面で個別に調整可能。
 */
const TORANOMON_4F: SeatingPreset = (() => {
  const desks: PresetDesk[] = [];

  // ===== エリア・ラベル =====
  // 左側エレベーターフォイヤー（ELEV）
  desks.push(
    { row: 2, col: 2, label: "ELEV", type: "label" },
    { row: 3, col: 2, label: "ELEV", type: "label" },
    { row: 4, col: 2, label: "ELEV", type: "label" },
    { row: 5, col: 2, label: "ELEV", type: "label" }
  );
  // 男女トイレ
  desks.push(
    { row: 1, col: 0, label: "M-WC", type: "label" },
    { row: 1, col: 1, label: "M-WC", type: "label" },
    { row: 2, col: 0, label: "M-WC", type: "label" },
    { row: 2, col: 1, label: "M-WC", type: "label" },
    { row: 4, col: 0, label: "W-WC", type: "label" },
    { row: 4, col: 1, label: "W-WC", type: "label" },
    { row: 5, col: 0, label: "W-WC", type: "label" },
    { row: 5, col: 1, label: "W-WC", type: "label" }
  );
  // エントランス
  desks.push(
    { row: 6, col: 0, label: "エントランス", type: "label" },
    { row: 6, col: 1, label: "エントランス", type: "label" }
  );
  // 会議室（上部左）
  desks.push(
    { row: 0, col: 4, label: "会議室1", type: "label" },
    { row: 1, col: 4, label: "会議室2", type: "label" },
    { row: 2, col: 4, label: "会議室3", type: "label" },
    { row: 3, col: 4, label: "会議室4", type: "label" },
    { row: 4, col: 4, label: "会議室5", type: "label" },
    { row: 5, col: 4, label: "会議室6", type: "label" }
  );
  // Lounge
  desks.push(
    { row: 6, col: 4, label: "Lounge", type: "label" },
    { row: 6, col: 5, label: "Lounge", type: "label" },
    { row: 7, col: 4, label: "Lounge", type: "label" },
    { row: 7, col: 5, label: "Lounge", type: "label" }
  );
  // 中央会議室
  desks.push({ row: 7, col: 6, label: "会議室7", type: "label" });
  // フレキシブルエリア
  desks.push(
    { row: 6, col: 8, label: "フレキシブル", type: "label" },
    { row: 6, col: 9, label: "フレキシブル", type: "label" },
    { row: 6, col: 10, label: "エリア", type: "label" },
    { row: 6, col: 11, label: "エリア", type: "label" }
  );
  // 下部左の会議室
  desks.push(
    { row: 9, col: 3, label: "会議室8", type: "label" },
    { row: 9, col: 4, label: "会議室9", type: "label" },
    { row: 10, col: 3, label: "会議室10", type: "label" },
    { row: 10, col: 4, label: "会議室11", type: "label" }
  );

  // ===== デスククラスター =====
  // 上部 4 クラスター（A〜D）: cols 7-18, rows 0-1 と 3-4
  // 1 クラスター = 2行 × 2列 = 4席
  type ClusterDef = { prefix: string; cols: number[]; rows: number[] };

  const topClusters: ClusterDef[] = [
    { prefix: "A", cols: [7, 8], rows: [0, 1] },
    { prefix: "B", cols: [10, 11], rows: [0, 1] },
    { prefix: "C", cols: [13, 14], rows: [0, 1] },
    { prefix: "D", cols: [16, 17], rows: [0, 1] },
    { prefix: "E", cols: [7, 8], rows: [3, 4] },
    { prefix: "F", cols: [10, 11], rows: [3, 4] },
    { prefix: "G", cols: [13, 14], rows: [3, 4] },
    { prefix: "H", cols: [16, 17], rows: [3, 4] },
  ];
  // 下部 4 クラスター（I〜L）: rows 8-9 と 11
  const bottomClusters: ClusterDef[] = [
    { prefix: "I", cols: [7, 8], rows: [8, 9] },
    { prefix: "J", cols: [10, 11], rows: [8, 9] },
    { prefix: "K", cols: [13, 14], rows: [8, 9] },
    { prefix: "L", cols: [16, 17], rows: [8, 9] },
    { prefix: "M", cols: [7, 8], rows: [11] },
    { prefix: "N", cols: [10, 11], rows: [11] },
    { prefix: "O", cols: [13, 14], rows: [11] },
    { prefix: "P", cols: [16, 17], rows: [11] },
  ];

  const applyCluster = (c: ClusterDef) => {
    let seat = 1;
    for (const r of c.rows) {
      for (const col of c.cols) {
        desks.push({
          row: r,
          col,
          label: `${c.prefix}-${String(seat).padStart(2, "0")}`,
          type: "desk",
        });
        seat++;
      }
    }
  };
  topClusters.forEach(applyCluster);
  bottomClusters.forEach(applyCluster);

  return {
    id: "toranomon-4f",
    name: "虎ノ門 4F（KDX 虎ノ門1丁目）",
    layout: { cols: 20, rows: 12 },
    desks,
  };
})();

export const SEATING_PRESETS: Record<string, SeatingPreset> = {
  "toranomon-4f": TORANOMON_4F,
};
