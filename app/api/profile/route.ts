import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("users").doc(session.user.email).get();
  return NextResponse.json({ profile: snap.data() ?? {} });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "department", "jobDescription", "relatedMembers",
    "joinDate", "careerHistory", "birthday", "hometown", "currentArea",
    "personality", "languages", "specialSkills", "hobbies",
    "favoriteFood", "dislikedFood", "recentInterests", "weekends", "freeText",
  ];

  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  update.updatedAt = new Date().toISOString();

  await adminDb.collection("users").doc(session.user.email).update(update);
  return NextResponse.json({ ok: true });
}
