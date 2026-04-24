import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { SEATING_PRESETS } from "@/lib/seatingPresets";

// GET: 利用可能なプリセット一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const presets = Object.values(SEATING_PRESETS).map((p) => ({
    id: p.id,
    name: p.name,
    floor: p.layout.floor,
    deskCount: p.desks.filter((d) => d.type === "desk").length,
    roomCount: p.rooms.length,
  }));
  return NextResponse.json({ presets });
}

// POST: プリセットを適用（既存デスク/会議室を全削除してレイアウトごと差し替え）
// body: { preset: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { preset: presetId } = await req.json();
  const preset = SEATING_PRESETS[presetId];
  if (!preset) {
    return NextResponse.json({ error: "Unknown preset" }, { status: 400 });
  }

  // 既存デスク + 会議室を全削除（バッチ書き込みは 500 ドキュメントまで）
  const BATCH_LIMIT = 450;
  async function commitInBatches<T>(
    items: T[],
    writer: (
      batch: FirebaseFirestore.WriteBatch,
      item: T
    ) => void
  ) {
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
      const chunk = items.slice(i, i + BATCH_LIMIT);
      const batch = adminDb.batch();
      chunk.forEach((it) => writer(batch, it));
      await batch.commit();
    }
  }

  const [desksSnap, roomsSnap] = await Promise.all([
    adminDb.collection("seatingDesks").get(),
    adminDb.collection("seatingRooms").get(),
  ]);

  await commitInBatches(desksSnap.docs, (b, d) => b.delete(d.ref));
  await commitInBatches(roomsSnap.docs, (b, d) => b.delete(d.ref));

  // レイアウト更新（単一 doc）
  await adminDb
    .collection("seatingLayout")
    .doc("config")
    .set({
      ...preset.layout,
      updatedAt: new Date().toISOString(),
    });

  // 新しいデスク追加
  const desksCol = adminDb.collection("seatingDesks");
  await commitInBatches(preset.desks, (b, d) => {
    const ref = desksCol.doc();
    b.set(ref, d);
  });

  // 新しい会議室追加
  const roomsCol = adminDb.collection("seatingRooms");
  await commitInBatches(preset.rooms, (b, r) => {
    const ref = roomsCol.doc();
    b.set(ref, r);
  });

  return NextResponse.json({
    ok: true,
    deskCount: preset.desks.length,
    roomCount: preset.rooms.length,
  });
}
