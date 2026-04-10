import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { email: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = decodeURIComponent(params.email);
  const snap = await adminDb.collection("users").doc(email).get();
  if (!snap.exists) return NextResponse.json({ profile: {} });

  const data = snap.data() ?? {};
  // Return only public profile fields (no isAdmin, etc.)
  const publicFields = [
    "name", "department", "jobDescription", "relatedMembers",
    "joinDate", "careerHistory", "birthday", "hometown", "currentArea",
    "personality", "languages", "specialSkills", "hobbies",
    "favoriteFood", "dislikedFood", "recentInterests", "weekends", "freeText",
  ];
  const profile: Record<string, string> = {};
  for (const key of publicFields) {
    if (data[key]) profile[key] = data[key];
  }

  return NextResponse.json({ profile });
}
