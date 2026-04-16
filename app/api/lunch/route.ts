import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

// GET: 今日のランチ参加者 & マッチング結果
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  const [partSnap, matchSnap] = await Promise.all([
    adminDb
      .collection("lunch")
      .doc(today)
      .collection("participants")
      .orderBy("registeredAt")
      .get(),
    adminDb.collection("lunch").doc(today).get(),
  ]);

  const participants = partSnap.docs.map((d) => d.data());
  const matchData = matchSnap.data();

  return NextResponse.json({
    date: today,
    participants,
    matches: matchData?.groups ?? null,
    matchedAt: matchData?.createdAt ?? null,
    matchCriteria: matchData?.matchCriteria ?? [],
  });
}

// POST: ランチ参加登録 / 取消
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  const uid = session.user.email;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const userData = userSnap.data();

  const ref = adminDb.collection("lunch").doc(today).collection("participants").doc(uid);
  const existing = await ref.get();

  if (existing.exists) {
    await ref.delete();
    return NextResponse.json({ joined: false });
  } else {
    await ref.set({
      uid,
      name: session.user.name ?? "",
      email: uid,
      photo: session.user.image ?? "",
      department: userData?.department ?? "",
      registeredAt: new Date().toISOString(),
    });
    return NextResponse.json({ joined: true });
  }
}
