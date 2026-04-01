import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";

function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

// GET: 今日の出社者一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  const snap = await adminDb
    .collection("attendance")
    .doc(today)
    .collection("participants")
    .orderBy("registeredAt")
    .get();

  const data = snap.docs.map((d) => d.data());
  return NextResponse.json({ date: today, participants: data });
}

// POST: 出社登録
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  const uid = session.user.email;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const userData = userSnap.data();

  await adminDb
    .collection("attendance")
    .doc(today)
    .collection("participants")
    .doc(uid)
    .set({
      uid,
      name: session.user.name ?? "",
      email: uid,
      photo: session.user.image ?? "",
      department: userData?.department ?? "",
      registeredAt: new Date().toISOString(),
      chatworkAccountId: userData?.chatworkAccountId ?? "",
      confluencePageUrl: userData?.confluencePageUrl ?? "",
    });

  return NextResponse.json({ success: true });
}

// DELETE: 出社取消
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  const uid = session.user.email;

  await adminDb
    .collection("attendance")
    .doc(today)
    .collection("participants")
    .doc(uid)
    .delete();

  return NextResponse.json({ success: true });
}

// POST /api/attendance/preregister — 事前登録（指定日）
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await req.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const uid = session.user.email;
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const userData = userSnap.data();

  await adminDb
    .collection("attendance")
    .doc(date)
    .collection("participants")
    .doc(uid)
    .set({
      uid,
      name: session.user.name ?? "",
      email: uid,
      photo: session.user.image ?? "",
      department: userData?.department ?? "",
      registeredAt: new Date().toISOString(),
    });

  return NextResponse.json({ success: true });
}
