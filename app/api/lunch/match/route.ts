import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { matchLunchGroups } from "@/lib/lunch";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Anthropic from "@anthropic-ai/sdk";
import type { LunchGroup } from "@/types";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

async function generateTopics(group: LunchGroup): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = new Anthropic({ apiKey });

  const profiles = group.members.map((m) => {
    const p = (m as any).profile ?? {};
    const lines = [
      `名前: ${m.name}`,
      m.department ? `部署: ${m.department}` : null,
      p.jobDescription ? `仕事内容: ${p.jobDescription}` : null,
      p.hometown ? `出身: ${p.hometown}` : null,
      p.hobbies ? `趣味: ${p.hobbies}` : null,
      p.specialSkills ? `特技: ${p.specialSkills}` : null,
      p.favoriteFood ? `好きな食べ物: ${p.favoriteFood}` : null,
      p.recentInterests ? `最近はまっているもの: ${p.recentInterests}` : null,
      p.weekends ? `週末の過ごし方: ${p.weekends}` : null,
      p.careerHistory ? `職歴: ${p.careerHistory}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  });

  const prompt = `以下はシャッフルランチのグループメンバーのプロフィールです。
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
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = todayJST();
  const snap = await adminDb
    .collection("lunch")
    .doc(today)
    .collection("participants")
    .get();

  const participants = snap.docs.map((d) => d.data()) as Parameters<typeof matchLunchGroups>[0];

  if (participants.length < 2) {
    return NextResponse.json({ error: "参加者が2名以上必要です" }, { status: 400 });
  }

  const groups = matchLunchGroups(participants);

  // 各メンバーのプロフィールをFirestoreから取得してグループに付与
  const groupsWithProfiles: LunchGroup[] = await Promise.all(
    groups.map(async (group) => {
      const membersWithProfiles = await Promise.all(
        group.members.map(async (m) => {
          const userSnap = await adminDb.collection("users").doc(m.uid).get();
          const userData = userSnap.data() ?? {};
          return { ...m, profile: userData };
        })
      );
      return { ...group, members: membersWithProfiles };
    })
  );

  // Claude APIで話題生成（並列実行）
  const groupsWithTopics = await Promise.all(
    groupsWithProfiles.map(async (group) => {
      const topics = await generateTopics(group).catch(() => []);
      // profileはFirestoreに保存しない（軽量化のため除去）
      const members = group.members.map(({ profile: _p, ...m }: any) => m);
      return { members, topics };
    })
  );

  await adminDb.collection("lunch").doc(today).set({
    groups: groupsWithTopics,
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
    createdAt: null,
  });

  return NextResponse.json({ success: true });
}
