import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// PATCH: コミュニティ更新（管理者のみ）
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowed = ["name", "description", "emoji", "category"];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  await adminDb.collection("communities").doc(params.id).update(update);
  return NextResponse.json({ ok: true });
}

// DELETE: コミュニティ削除（管理者のみ）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 投稿・メンバーのサブコレクションも削除
  const ref = adminDb.collection("communities").doc(params.id);
  const [postsSnap, membersSnap] = await Promise.all([
    ref.collection("posts").get(),
    ref.collection("members").get(),
  ]);

  const batch = adminDb.batch();
  postsSnap.docs.forEach((d) => batch.delete(d.ref));
  membersSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();

  return NextResponse.json({ ok: true });
}
