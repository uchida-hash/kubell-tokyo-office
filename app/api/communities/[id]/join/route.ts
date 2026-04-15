import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// POST: 参加
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const communityRef = adminDb.collection("communities").doc(params.id);
  const memberRef = communityRef.collection("members").doc(session.user.email);

  const already = await memberRef.get();
  if (already.exists) return NextResponse.json({ ok: true });

  await memberRef.set({
    uid: session.user.email,
    name: session.user.name,
    photo: session.user.image ?? "",
    joinedAt: new Date().toISOString(),
  });
  await communityRef.update({ memberCount: FieldValue.increment(1) });

  return NextResponse.json({ ok: true });
}

// DELETE: 退会
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const communityRef = adminDb.collection("communities").doc(params.id);
  const memberRef = communityRef.collection("members").doc(session.user.email);

  const exists = await memberRef.get();
  if (!exists.exists) return NextResponse.json({ ok: true });

  await memberRef.delete();
  await communityRef.update({ memberCount: FieldValue.increment(-1) });

  return NextResponse.json({ ok: true });
}
