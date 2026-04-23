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
    labelCount: p.desks.filter((d) => d.type === "label").length,
  }));
  return NextResponse.json({ presets });
}

// POST: プリセットを適用（既存デスクを全削除してレイアウトごと差し替え）
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

  // 既存デスクを全削除
  const existing = await adminDb.collection("seatingDesks").get();
  const batch = adminDb.batch();
  existing.docs.forEach((d) => batch.delete(d.ref));

  // レイアウトを更新
  batch.set(adminDb.collection("seatingLayout").doc("config"), {
    ...preset.layout,
    updatedAt: new Date().toISOString(),
  });

  // 新しいデスクを追加
  preset.desks.forEach((d) => {
    const ref = adminDb.collection("seatingDesks").doc();
    batch.set(ref, d);
  });

  await batch.commit();

  return NextResponse.json({ ok: true, count: preset.desks.length });
}
