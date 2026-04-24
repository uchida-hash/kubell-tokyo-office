import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Desk, Room, SeatingLayout, SeatingRecord } from "@/types";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

const DEFAULT_LAYOUT: SeatingLayout = {
  floor: "4F",
  floorKey: "toranomon-4f",
  width: 1400,
  height: 1456,
};

// GET: 今日の座席状況（レイアウト + デスク + 会議室 + 予約レコード）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayJST();
  const [layoutSnap, desksSnap, roomsSnap, recordsSnap] = await Promise.all([
    adminDb.collection("seatingLayout").doc("config").get(),
    adminDb.collection("seatingDesks").get(),
    adminDb.collection("seatingRooms").get(),
    adminDb.collection("seating").doc(today).collection("records").get(),
  ]);

  const stored = layoutSnap.exists ? (layoutSnap.data() as SeatingLayout) : null;
  const layout: SeatingLayout = stored
    ? {
        ...stored,
        // 旧フィールドから新フィールドへ補完
        width: stored.width ?? stored.imageWidth ?? DEFAULT_LAYOUT.width,
        height: stored.height ?? stored.imageHeight ?? DEFAULT_LAYOUT.height,
      }
    : DEFAULT_LAYOUT;

  const desks: Desk[] = desksSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Desk, "id">),
  }));
  const rooms: Room[] = roomsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Room, "id">),
  }));

  const records: SeatingRecord[] = recordsSnap.docs.map((d) => ({
    ...(d.data() as SeatingRecord),
  }));

  const myRecord = records.find((r) => r.uid === session.user.email) ?? null;

  return NextResponse.json({ layout, desks, rooms, records, myRecord });
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
