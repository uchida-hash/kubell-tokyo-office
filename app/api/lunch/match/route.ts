import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { matchLunchGroups } from "@/lib/lunch";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
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

  await adminDb.collection("lunch").doc(today).set({
    groups,
    createdAt: new Date().toISOString(),
    participantCount: participants.length,
  }, { merge: true });

  return NextResponse.json({ groups });
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
