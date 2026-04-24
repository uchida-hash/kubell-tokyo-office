import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import type { RoomType } from "@/types";

// POST: 会議室/設備室を新規作成または更新（管理者）
// body: { id?, x, y, w, h, name, subname?, capacity?, type }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    id,
    x,
    y,
    w,
    h,
    name,
    subname,
    capacity,
    type,
  } = body as {
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    subname?: string;
    capacity?: number;
    type: RoomType;
  };

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof w !== "number" ||
    typeof h !== "number"
  ) {
    return NextResponse.json(
      { error: "x/y/w/h が必要です" },
      { status: 400 }
    );
  }
  if (type !== "meeting" && type !== "phone" && type !== "service") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const col = adminDb.collection("seatingRooms");
  const data = {
    x,
    y,
    w,
    h,
    name: name ?? "",
    subname: subname ?? null,
    capacity: capacity ?? null,
    type,
  };
  if (id) {
    await col.doc(id).set(data, { merge: true });
    return NextResponse.json({ ok: true, id });
  } else {
    const ref = await col.add(data);
    return NextResponse.json({ ok: true, id: ref.id });
  }
}
