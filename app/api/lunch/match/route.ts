import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Anthropic from "@anthropic-ai/sdk";
import type { LunchGroup } from "@/types";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

// プロフィールフィールドのテキストをトークン化
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[、,，\s・\/]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2);
}

// 2人のプロフィール間の類似度スコアを計算
function similarityScore(
  profileA: Record<string, string>,
  profileB: Record<string, string>,
  criteria: string[]
): number {
  if (criteria.length === 0) return Math.random(); // ランダム
  let score = 0;
  for (const key of criteria) {
    const tokensA = tokenize(profileA[key] ?? "");
    const tokensB = tokenize(profileB[key] ?? "");
    if (tokensA.length === 0 || tokensB.length === 0) continue;
    const common = tokensA.filter((t) => tokensB.includes(t));
    score += common.length / Math.max(tokensA.length, tokensB.length);
  }
  return score;
}

// 共通点が多い順にグループを作成
function matchByCriteria(
  participants: Array<{ uid: string; profile: Record<string, string> }>,
  criteria: string[],
  groupSize: number = 3
): number[][] {
  const n = participants.length;
  const assigned = new Array(n).fill(false);
  const groups: number[][] = [];

  // ランダムの場合はシャッフル
  if (criteria.length === 0) {
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    for (let i = 0; i < indices.length; i += groupSize) {
      groups.push(indices.slice(i, i + groupSize));
    }
    return groups;
  }

  // 全ペアのスコアを計算
  const scores: Array<{ i: number; j: number; score: number }> = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const score = similarityScore(
        participants[i].profile,
        participants[j].profile,
        criteria
      );
      scores.push({ i, j, score });
    }
  }
  scores.sort((a, b) => b.score - a.score); // 高スコア順

  // greedy グループ化
  while (assigned.filter(Boolean).length < n) {
    // 未割当の中で最初の人を起点に
    const start = assigned.findIndex((v) => !v);
    if (start === -1) break;
    const group = [start];
    assigned[start] = true;

    // グループサイズになるまで最高スコアの未割当者を追加
    while (group.length < groupSize) {
      let bestIdx = -1;
      let bestScore = -1;
      for (let k = 0; k < n; k++) {
        if (assigned[k]) continue;
        // このkがgroupの全員と平均スコアを計算
        let avgScore = 0;
        for (const g of group) {
          const pair = scores.find(
            (s) => (s.i === g && s.j === k) || (s.i === k && s.j === g)
          );
          avgScore += pair?.score ?? 0;
        }
        avgScore /= group.length;
        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestIdx = k;
        }
      }
      if (bestIdx === -1) break;
      group.push(bestIdx);
      assigned[bestIdx] = true;
    }
    groups.push(group);
  }
  return groups;
}

async function generateTopics(
  group: LunchGroup & { profiles?: Record<string, Record<string, string>> },
  criteria: string[]
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = new Anthropic({ apiKey });

  const CRITERIA_LABELS: Record<string, string> = {
    hometown: "出身地", hobbies: "趣味", favoriteFood: "好きな食べ物",
    specialSkills: "特技", recentInterests: "最近はまっているもの",
    weekends: "週末の過ごし方", department: "部署", careerHistory: "職歴",
  };

  const profiles = group.members.map((m) => {
    const p = (group.profiles?.[m.uid] ?? (m as any).profile ?? {});
    const lines = [
      `名前: ${m.name}`,
      m.department ? `部署: ${m.department}` : null,
      p.hometown ? `出身: ${p.hometown}` : null,
      p.hobbies ? `趣味: ${p.hobbies}` : null,
      p.specialSkills ? `特技: ${p.specialSkills}` : null,
      p.favoriteFood ? `好きな食べ物: ${p.favoriteFood}` : null,
      p.recentInterests ? `最近はまっているもの: ${p.recentInterests}` : null,
      p.weekends ? `週末: ${p.weekends}` : null,
      p.careerHistory ? `職歴: ${p.careerHistory}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  });

  const criteriaHint = criteria.length > 0
    ? `特に「${criteria.map((k) => CRITERIA_LABELS[k] ?? k).join("・")}」の共通点を重視して話題を提案してください。`
    : "";

  const prompt = `以下はシャッフルランチのグループメンバーのプロフィールです。
${criteriaHint}
メンバー同士の共通点や盛り上がりそうな話題を3〜4つ提案してください。
箇条書きで、それぞれ1〜2文で簡潔に書いてください。

${profiles.map((p, i) => `【メンバー${i + 1}】\n${p}`).join("\n\n")}

回答は話題の提案のみ（前置き不要）、日本語で。`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return text
    .split("\n")
    .map((line) => line.replace(/^[-・•＊\*\d.]+\s*/, "").trim())
    .filter((line) => line.length > 5);
}

// POST: マッチング実行（管理者のみ）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const criteria: string[] = body.criteria ?? [];

  const today = todayJST();
  const snap = await adminDb
    .collection("lunch").doc(today)
    .collection("participants").get();

  const participants = snap.docs.map((d) => d.data()) as Array<{
    uid: string; name: string; email: string; photo: string; department?: string; registeredAt: string;
  }>;

  if (participants.length < 2) {
    return NextResponse.json({ error: "参加者が2名以上必要です" }, { status: 400 });
  }

  // 全参加者のプロフィールをFirestoreから取得
  const profileMap: Record<string, Record<string, string>> = {};
  await Promise.all(
    participants.map(async (p) => {
      const snap = await adminDb.collection("users").doc(p.uid).get();
      profileMap[p.uid] = (snap.data() ?? {}) as Record<string, string>;
    })
  );

  // クライテリアベースのグループ化
  const participantsWithProfile = participants.map((p) => ({
    uid: p.uid,
    profile: profileMap[p.uid] ?? {},
  }));

  const groupSize = participants.length <= 4 ? 2 : 3;
  const groupIndices = matchByCriteria(participantsWithProfile, criteria, groupSize);

  // インデックスをメンバーに変換
  const rawGroups: LunchGroup[] = groupIndices.map((indices) => ({
    members: indices.map((i) => participants[i]),
  }));

  // Claude APIで話題生成（並列実行）
  const groupsWithTopics = await Promise.all(
    rawGroups.map(async (group) => {
      const groupWithProfiles = { ...group, profiles: profileMap };
      const topics = await generateTopics(groupWithProfiles, criteria).catch(() => []);
      return { members: group.members, topics };
    })
  );

  await adminDb.collection("lunch").doc(today).set({
    groups: groupsWithTopics,
    matchCriteria: criteria,
    createdAt: new Date().toISOString(),
    participantCount: participants.length,
  }, { merge: true });

  return NextResponse.json({ groups: groupsWithTopics });
}

// DELETE: マッチングリセット（管理者のみ）
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = todayJST();
  await adminDb.collection("lunch").doc(today).update({
    groups: null,
    matchCriteria: null,
    createdAt: null,
  });

  return NextResponse.json({ ok: true });
}
