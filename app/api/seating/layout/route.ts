import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: レイアウト（背景画像）を更新（管理者）
// body: { imagePath, imageWidth, imageHeight, floor? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { imagePath, imageWidth, imageHeight, floor, floorKey } = await req.json();
  if (
    typeof imageWidth !== "number" ||
    typeof imageHeight !== "number"
  ) {
    return NextResponse.json(
      { error: "imageWidth/imageHeight が必要です" },
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
      imageWidth,
      imageHeight,
      floor: floor ?? null,
      updatedAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}
