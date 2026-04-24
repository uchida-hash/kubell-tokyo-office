import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: レイアウト設定を更新（管理者）
// body: { width, height, floor?, floorKey?, imagePath? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { width, height, floor, floorKey, imagePath } = await req.json();
  if (typeof width !== "number" || typeof height !== "number") {
    return NextResponse.json(
      { error: "width/height が必要です" },
      { status: 400 }
    );
  }
  if (!imagePath && !floorKey) {
    return NextResponse.json(
      { error: "imagePath か floorKey のどちらかが必要です" },
      { status: 400 }
    );
  }

  await adminDb
    .collection("seatingLayout")
    .doc("config")
    .set({
      imagePath: imagePath ?? null,
      floorKey: floorKey ?? null,
      width,
      height,
      floor: floor ?? null,
      updatedAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}
