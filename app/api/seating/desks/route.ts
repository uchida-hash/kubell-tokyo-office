import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import type { DeskType, DeskOrient } from "@/types";

// POST: デスク/ラベルを新規作成または更新（管理者）
// body: { id?, x, y, w?, h?, label, type, orient?, pod? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, x, y, w, h, label, type, orient, pod } = body as {
    id?: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
    label: string;
    type: DeskType;
    orient?: DeskOrient;
    pod?: string;
  };

  if (typeof x !== "number" || typeof y !== "number") {
    return NextResponse.json({ error: "x/y が必要です" }, { status: 400 });
  }
  if (type !== "desk" && type !== "label") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const col = adminDb.collection("seatingDesks");
  const data: Record<string, unknown> = {
    x,
    y,
    label: label ?? "",
    type,
  };
  if (typeof w === "number") data.w = w;
  if (typeof h === "number") data.h = h;
  if (orient) data.orient = orient;
  if (pod) data.pod = pod;

  if (id) {
    await col.doc(id).set(data, { merge: true });
    return NextResponse.json({ ok: true, id });
  } else {
    const ref = await col.add(data);
    return NextResponse.json({ ok: true, id: ref.id });
  }
}
