import { adminDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { SeatingRecord, SeatStatus } from "@/types";

const TZ = "Asia/Tokyo";

export function todayJST() {
  return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd");
}

/**
 * デスクが今日の時点で別のユーザーに確保（予約または利用中）されているかを返す。
 * 自分自身のレコードは除外。
 */
export async function findDeskHolder(deskId: string, excludeEmail?: string) {
  const today = todayJST();
  const snap = await adminDb
    .collection("seating")
    .doc(today)
    .collection("records")
    .where("deskId", "==", deskId)
    .get();

  const holder = snap.docs
    .map((d) => d.data() as SeatingRecord)
    .find((r) => r.uid !== excludeEmail);
  return holder ?? null;
}

/**
 * 今日のユーザーの座席レコードを作成 or 更新する。
 */
export async function upsertSeat({
  email,
  name,
  photo,
  department,
  deskId,
  status,
}: {
  email: string;
  name: string;
  photo: string;
  department: string;
  deskId: string;
  status: SeatStatus;
}) {
  const today = todayJST();
  const ref = adminDb
    .collection("seating")
    .doc(today)
    .collection("records")
    .doc(email);
  const now = new Date().toISOString();

  const existing = await ref.get();
  const prev = (existing.data() as SeatingRecord | undefined) ?? null;

  const record: SeatingRecord = {
    uid: email,
    name,
    photo,
    department,
    deskId,
    status,
    reservedAt:
      prev?.reservedAt ??
      (status === "reserved" ? now : prev?.reservedAt),
    checkedInAt: status === "in_use" ? now : prev?.checkedInAt,
    updatedAt: now,
  };

  await ref.set(record);
  return record;
}
