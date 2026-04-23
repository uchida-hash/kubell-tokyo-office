import type { ComponentType } from "react";
import Toranomon4F from "./Toranomon4F";

/**
 * 登録済み SVG フロアプランのレジストリ。
 * 新しいフロアを追加する際はここに追加する。
 */
export const FLOOR_PLANS: Record<
  string,
  {
    Component: ComponentType<{ className?: string }>;
    viewBoxWidth: number;
    viewBoxHeight: number;
    label: string;
  }
> = {
  "toranomon-4f": {
    Component: Toranomon4F,
    viewBoxWidth: 1200,
    viewBoxHeight: 800,
    label: "虎ノ門 4F",
  },
};

export function getFloorPlan(floorKey?: string) {
  if (!floorKey) return null;
  return FLOOR_PLANS[floorKey] ?? null;
}
