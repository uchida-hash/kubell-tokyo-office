import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: 投稿一覧
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("communities").doc(params.id)
    .collection("posts")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ posts });
}

// POST: 投稿作成
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const ref = await adminDb
    .collection("communities").doc(params.id)
    .collection("posts")
    .add({
      content: content.trim(),
      authorUid: session.user.email,
      authorName: session.user.name ?? "",
      authorPhoto: session.user.image ?? "",
      createdAt: new Date().toISOString(),
      likeCount: 0,
      likedBy: [],
    });

  return NextResponse.json({ id: ref.id });
}
