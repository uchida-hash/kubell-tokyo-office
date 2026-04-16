import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: ゾーン一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("seatingZones").orderBy("order", "asc").get();
  const zones = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ zones });
}

// POST: ゾーン作成（管理者のみ）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, color, order } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const ref = await adminDb.collection("seatingZones").add({
    name,
    color: color ?? "blue",
    order: order ?? 0,
  });

  return NextResponse.json({ id: ref.id });
}
