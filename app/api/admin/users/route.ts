import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: 全ユーザー一覧（管理者のみ）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("users").orderBy("name").get();
  const users = snap.docs.map((d) => d.data());
  return NextResponse.json({ users });
}

// PATCH: ユーザー情報更新（Chatwork ID、管理者権限など）
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { uid, chatworkAccountId, isAdmin, department, confluencePageUrl } = body;

  if (!uid) return NextResponse.json({ error: "uid は必須です" }, { status: 400 });

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (chatworkAccountId !== undefined) update.chatworkAccountId = chatworkAccountId;
  if (isAdmin !== undefined) update.isAdmin = isAdmin;
  if (department !== undefined) update.department = department;
  if (confluencePageUrl !== undefined) update.confluencePageUrl = confluencePageUrl;

  await adminDb.collection("users").doc(uid).update(update);
  return NextResponse.json({ success: true });
}
