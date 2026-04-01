import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// GET: 掲示板一覧（有効なもの）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();

  const snap = await adminDb
    .collection("announcements")
    .where("publishedAt", "<=", now)
    .orderBy("publishedAt", "desc")
    .limit(20)
    .get();

  const announcements = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a: any) => !a.expiresAt || a.expiresAt > now);

  return NextResponse.json({ announcements });
}

// POST: 掲示板投稿（管理者のみ）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, content, priority, expiresAt } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title と content は必須です" }, { status: 400 });
  }

  const ref = await adminDb.collection("announcements").add({
    title,
    content,
    priority: priority ?? "normal",
    authorName: session.user.name ?? "",
    authorEmail: session.user.email ?? "",
    publishedAt: new Date().toISOString(),
    expiresAt: expiresAt ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id, success: true });
}

// DELETE: 掲示板削除（管理者のみ）
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id は必須です" }, { status: 400 });

  await adminDb.collection("announcements").doc(id).delete();
  return NextResponse.json({ success: true });
}
