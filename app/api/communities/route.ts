import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: コミュニティ一覧 + 自分が参加中かどうか
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("communities").orderBy("createdAt", "desc").get();
  const myEmail = session.user.email;

  const communities = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const memberSnap = await adminDb
        .collection("communities").doc(doc.id)
        .collection("members").doc(myEmail).get();
      return {
        id: doc.id,
        ...data,
        isMember: memberSnap.exists,
      };
    })
  );

  return NextResponse.json({ communities });
}

// POST: コミュニティ作成（管理者のみ）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, emoji, category } = body;
  if (!name || !emoji) return NextResponse.json({ error: "name and emoji are required" }, { status: 400 });

  const ref = await adminDb.collection("communities").add({
    name,
    description: description ?? "",
    emoji: emoji ?? "💬",
    category: category ?? "その他",
    memberCount: 0,
    createdAt: new Date().toISOString(),
    createdBy: session.user.email,
  });

  return NextResponse.json({ id: ref.id });
}
