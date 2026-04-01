import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import type { Session } from "next-auth";

// 型拡張
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (!session.user.isAdmin) {
    throw new Error("Forbidden");
  }
  return session;
}
