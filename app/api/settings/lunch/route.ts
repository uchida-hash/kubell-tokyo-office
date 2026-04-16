import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

const DOC = adminDb.collection("settings").doc("lunch");

// GET: ランチ設定を取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await DOC.get();
  const data = snap.data() ?? {};
  return NextResponse.json({
    criteria: data.criteria ?? [],   // マッチング軸
  });
}

// POST: ランチ設定を保存（管理者のみ）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { criteria } = await req.json();
  await DOC.set({ criteria: criteria ?? [] }, { merge: true });
  return NextResponse.json({ ok: true });
}
