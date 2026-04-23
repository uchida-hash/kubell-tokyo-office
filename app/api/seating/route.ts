import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Desk, SeatingLayout, SeatingRecord } from "@/types";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

const DEFAULT_LAYOUT: SeatingLayout = { cols: 12, rows: 8 };

// GET: 今日の座席状況（レイアウト + デスク + 予約レコード）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayJST();
  const [layoutSnap, desksSnap, recordsSnap] = await Promise.all([
    adminDb.collection("seatingLayout").doc("config").get(),
    adminDb.collection("seatingDesks").get(),
    adminDb.collection("seating").doc(today).collection("records").get(),
  ]);

  const layout: SeatingLayout = layoutSnap.exists
    ? (layoutSnap.data() as SeatingLayout)
    : DEFAULT_LAYOUT;

  const desks: Desk[] = desksSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Desk, "id">),
  }));

  const records: SeatingRecord[] = recordsSnap.docs.map((d) => ({
    ...(d.data() as SeatingRecord),
  }));

  const myRecord = records.find((r) => r.uid === session.user.email) ?? null;

  return NextResponse.json({ layout, desks, records, myRecord });
}

// DELETE: 自分の座席予約/利用を解除
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayJST();
  await adminDb
    .collection("seating")
    .doc(today)
    .collection("records")
    .doc(session.user.email)
    .delete();

  return NextResponse.json({ ok: true });
}
