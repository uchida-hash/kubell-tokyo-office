import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: グリッドサイズを更新（管理者）
// body: { cols, rows }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { cols, rows } = await req.json();
  if (
    typeof cols !== "number" ||
    typeof rows !== "number" ||
    cols < 1 ||
    rows < 1 ||
    cols > 30 ||
    rows > 30
  ) {
    return NextResponse.json(
      { error: "cols/rows は 1〜30 の範囲で指定してください" },
      { status: 400 }
    );
  }

  await adminDb
    .collection("seatingLayout")
    .doc("config")
    .set({ cols, rows, updatedAt: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
