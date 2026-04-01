import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * miive ポイント残高取得
 *
 * miive は現時点で公式の外部向けAPIを公開していないため、
 * 管理者が手動でポイント情報を Firestore に登録する方式を採用しています。
 *
 * 将来的に miive が API を公開した場合は、このエンドポイントを更新してください。
 *
 * Firestore スキーマ:
 * miive/{email} = { point: number, expirePoint: number, expireDate: string, updatedAt: string }
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("miive")
    .doc(session.user.email)
    .get();

  if (!snap.exists) {
    return NextResponse.json({ point: null, linked: false });
  }

  const data = snap.data()!;
  return NextResponse.json({
    linked: true,
    point: data.point ?? 0,
    expirePoint: data.expirePoint ?? 0,
    expireDate: data.expireDate ?? null,
    updatedAt: data.updatedAt ?? null,
  });
}

// PUT: 管理者がポイント情報を更新
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // TODO: miive 公式 API 連携が可能になったら実装
  // 現在は Firestore への手動入力をサポート
  return NextResponse.json({ message: "miive API連携は設定画面から行ってください" });
}
