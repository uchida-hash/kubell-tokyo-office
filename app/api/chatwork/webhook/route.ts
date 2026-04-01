import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import crypto from "crypto";

const TZ = "Asia/Tokyo";
function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

// Chatwork が送信する Webhook Token で検証
function verifyChatworkSignature(req: NextRequest, body: string): boolean {
  const token = process.env.CHATWORK_WEBHOOK_TOKEN;
  if (!token) return true; // 開発中はスキップ

  const signature = req.headers.get("x-chatworktoken");
  return signature === token;
}

/**
 * Chatwork Outgoing Webhook
 * 特定のルームで「出社」「おはようございます」などのキーワードを含む投稿で出社登録
 *
 * 事前設定:
 * 1. Chatwork管理画面でOutgoing Webhookを設定
 * 2. 監視するルームIDを指定
 * 3. Webhook URLを https://your-domain.com/api/chatwork/webhook に設定
 * 4. users コレクションに chatworkAccountId フィールドをマッピング
 */
export async function POST(req: NextRequest) {
  const bodyText = await req.text();

  if (!verifyChatworkSignature(req, bodyText)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Chatwork Webhook ペイロード形式
  const webhook = payload.webhook_setting;
  const event = payload.webhook_event;

  if (!event || event.type !== "mention_to_room" && webhook?.type !== "mention_to_room") {
    // メッセージイベントのみ処理
    if (event?.type !== "message_created") {
      return NextResponse.json({ ok: true });
    }
  }

  const messageBody: string = event?.body ?? "";
  const chatworkAccountId = String(event?.account_id ?? event?.from_account_id ?? "");

  // 出社登録キーワード
  const ATTENDANCE_KEYWORDS = ["出社", "おはようございます", "おはよう", "出勤"];
  const isAttendanceMessage = ATTENDANCE_KEYWORDS.some((kw) =>
    messageBody.includes(kw)
  );

  if (!isAttendanceMessage || !chatworkAccountId) {
    return NextResponse.json({ ok: true });
  }

  // Chatwork account ID → Firebase ユーザー をルックアップ
  const userSnap = await adminDb
    .collection("users")
    .where("chatworkAccountId", "==", chatworkAccountId)
    .limit(1)
    .get();

  if (userSnap.empty) {
    console.log(`Chatwork user ${chatworkAccountId} not mapped to any app user`);
    return NextResponse.json({ ok: true });
  }

  const userData = userSnap.docs[0].data();
  const uid = userData.email;
  const today = todayJST();

  // 既に登録済みか確認
  const existing = await adminDb
    .collection("attendance")
    .doc(today)
    .collection("participants")
    .doc(uid)
    .get();

  if (!existing.exists) {
    await adminDb
      .collection("attendance")
      .doc(today)
      .collection("participants")
      .doc(uid)
      .set({
        uid,
        name: userData.name,
        email: uid,
        photo: userData.photo ?? "",
        department: userData.department ?? "",
        registeredAt: new Date().toISOString(),
        source: "chatwork",
      });
    console.log(`Auto-registered attendance for ${uid} via Chatwork`);
  }

  return NextResponse.json({ ok: true });
}
