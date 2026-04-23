import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import type { DeskType } from "@/types";

// POST: デスク/ラベルを新規作成または更新（管理者）
// body: { id?, x, y, label, type }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, x, y, label, type } = body as {
    id?: string;
    x: number;
    y: number;
    label: string;
    type: DeskType;
  };

  if (typeof x !== "number" || typeof y !== "number") {
    return NextResponse.json({ error: "x/y (0-1) が必要です" }, { status: 400 });
  }
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    return NextResponse.json(
      { error: "x/y は 0.0〜1.0 の範囲で指定してください" },
      { status: 400 }
    );
  }
  if (type !== "desk" && type !== "label") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const col = adminDb.collection("seatingDesks");
  const data = { x, y, label: label ?? "", type };
  if (id) {
    await col.doc(id).set(data, { merge: true });
    return NextResponse.json({ ok: true, id });
  } else {
    const ref = await col.add(data);
    return NextResponse.json({ ok: true, id: ref.id });
  }
}
