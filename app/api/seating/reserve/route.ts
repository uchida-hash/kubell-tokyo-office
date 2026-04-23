import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { findDeskHolder, upsertSeat } from "@/lib/seating";

// POST: 指定デスクを予約
// body: { deskId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deskId } = await req.json();
  if (!deskId) {
    return NextResponse.json({ error: "deskId is required" }, { status: 400 });
  }

  // デスクの存在確認
  const deskSnap = await adminDb.collection("seatingDesks").doc(deskId).get();
  if (!deskSnap.exists) {
    return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  }

  // 他ユーザーが既に確保していないか
  const holder = await findDeskHolder(deskId, email);
  if (holder) {
    return NextResponse.json(
      { error: `このデスクは既に ${holder.name} さんが${holder.status === "in_use" ? "利用中" : "予約中"}です` },
      { status: 409 }
    );
  }

  // 部署情報を引く
  const userSnap = await adminDb.collection("users").doc(email).get();
  const userData = userSnap.data() ?? {};

  const record = await upsertSeat({
    email,
    name: session.user.name ?? "",
    photo: session.user.image ?? "",
    department: userData.department ?? "",
    deskId,
    status: "reserved",
  });

  return NextResponse.json({ ok: true, record });
}
