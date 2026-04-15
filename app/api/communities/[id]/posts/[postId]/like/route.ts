import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// POST: いいねトグル
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postRef = adminDb
    .collection("communities").doc(params.id)
    .collection("posts").doc(params.postId);

  const snap = await postRef.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const likedBy: string[] = snap.data()?.likedBy ?? [];
  const myEmail = session.user.email;
  const alreadyLiked = likedBy.includes(myEmail);

  if (alreadyLiked) {
    await postRef.update({
      likedBy: FieldValue.arrayRemove(myEmail),
      likeCount: FieldValue.increment(-1),
    });
  } else {
    await postRef.update({
      likedBy: FieldValue.arrayUnion(myEmail),
      likeCount: FieldValue.increment(1),
    });
  }

  return NextResponse.json({ liked: !alreadyLiked });
}
