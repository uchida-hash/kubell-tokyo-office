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

// GET: 今日の座席状況（ゾーン + 誰がいるか）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();

  const [zonesSnap, seatingSnap] = await Promise.all([
    adminDb.collection("seatingZones").orderBy("order", "asc").get(),
    adminDb.collection("seating").doc(today).collection("records").get(),
  ]);

  const zones = zonesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const records = seatingSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) as Array<{ uid: string; zoneId: string; [key: string]: unknown }>;

  // 自分の座席
  const myRecord = records.find((r) => r.uid === session.user.email);

  return NextResponse.json({ zones, records, myZoneId: myRecord?.zoneId ?? null });
}

// POST: 座席を登録・変更
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { zoneId } = await req.json();
  if (!zoneId) return NextResponse.json({ error: "zoneId is required" }, { status: 400 });

  const today = todayJST();
  const userSnap = await adminDb.collection("users").doc(session.user.email).get();
  const userData = userSnap.data() ?? {};

  await adminDb
    .collection("seating").doc(today)
    .collection("records").doc(session.user.email)
    .set({
      uid: session.user.email,
      name: session.user.name ?? "",
      photo: session.user.image ?? "",
      department: userData.department ?? "",
      zoneId,
      updatedAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}

// DELETE: 座席を解除
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayJST();
  await adminDb
    .collection("seating").doc(today)
    .collection("records").doc(session.user.email)
    .delete();

  return NextResponse.json({ ok: true });
}
