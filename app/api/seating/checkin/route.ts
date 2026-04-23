import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { findDeskHolder, upsertSeat } from "@/lib/seating";

// POST: QR 経由の着席（利用開始）
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

  const deskSnap = await adminDb.collection("seatingDesks").doc(deskId).get();
  if (!deskSnap.exists) {
    return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  }
  const deskData = deskSnap.data();
  if (deskData?.type !== "desk") {
    return NextResponse.json(
      { error: "このセルは着席できません" },
      { status: 400 }
    );
  }

  // 他ユーザーが既に確保していないか
  const holder = await findDeskHolder(deskId, email);
  if (holder) {
    return NextResponse.json(
      {
        error: `このデスクは既に ${holder.name} さんが${holder.status === "in_use" ? "利用中" : "予約中"}です`,
      },
      { status: 409 }
    );
  }

  const userSnap = await adminDb.collection("users").doc(email).get();
  const userData = userSnap.data() ?? {};

  const record = await upsertSeat({
    email,
    name: session.user.name ?? "",
    photo: session.user.image ?? "",
    department: userData.department ?? "",
    deskId,
    status: "in_use",
  });

  return NextResponse.json({ ok: true, record });
}
