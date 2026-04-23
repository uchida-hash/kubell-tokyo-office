import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "@/lib/firebaseAdmin";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN!;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) return false;
      try {
        const ref = adminDb.collection("users").doc(user.email);
        const snap = await ref.get();
        if (!snap.exists) {
          await ref.set({
            uid: user.email,
            name: user.name ?? "",
            email: user.email,
            photo: user.image ?? "",
            isAdmin: false,
            createdAt: new Date().toISOString(),
          });
        } else {
          await ref.update({
            name: user.name ?? "",
            photo: user.image ?? "",
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Firestore user upsert error:", e);
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (token.email) {
        try {
          const snap = await adminDb.collection("users").doc(token.email as string).get();
          token.isAdmin = snap.data()?.isAdmin ?? false;
        } catch {
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.isAdmin = token.isAdmin as boolean;
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
};
