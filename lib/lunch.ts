import type { LunchParticipant, LunchGroup } from "@/types";

/**
 * シャッフルランチのマッチングアルゴリズム
 * 参加者をランダムにグループ（2〜4人）に分ける
 */
export function matchLunchGroups(participants: LunchParticipant[]): LunchGroup[] {
  if (participants.length < 2) return [];

  // Fisher-Yates shuffle
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const groups: LunchGroup[] = [];
  const groupSize = 3; // 基本3人グループ

  let i = 0;
  while (i < shuffled.length) {
    const remaining = shuffled.length - i;

    if (remaining <= 4) {
      // 残り4人以下は1グループにまとめる
      groups.push({ members: shuffled.slice(i) });
      break;
    } else {
      groups.push({ members: shuffled.slice(i, i + groupSize) });
      i += groupSize;
    }
  }

  return groups;
}
