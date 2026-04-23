import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import type { DeskType } from "@/types";

// POST: デスク/ラベルを新規作成または更新（管理者）
// body: { id?, row, col, label, type }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, row, col, label, type } = body as {
    id?: string;
    row: number;
    col: number;
    label: string;
    type: DeskType;
  };

  if (typeof row !== "number" || typeof col !== "number") {
    return NextResponse.json({ error: "row/col required" }, { status: 400 });
  }
  if (type !== "desk" && type !== "label") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const col2 = adminDb.collection("seatingDesks");

  // 同じマスに別のデスクがないか（編集時は自分は除外）
  const exists = await col2.where("row", "==", row).where("col", "==", col).get();
  const clash = exists.docs.find((d) => d.id !== id);
  if (clash) {
    return NextResponse.json(
      { error: "このマスには既に別のデスクがあります" },
      { status: 409 }
    );
  }

  const data = { row, col, label: label ?? "", type };
  if (id) {
    await col2.doc(id).set(data, { merge: true });
    return NextResponse.json({ ok: true, id });
  } else {
    const ref = await col2.add(data);
    return NextResponse.json({ ok: true, id: ref.id });
  }
}
