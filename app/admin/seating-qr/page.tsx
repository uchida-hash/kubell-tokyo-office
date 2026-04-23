import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SeatingQrClient from "./SeatingQrClient";
import { headers } from "next/headers";

export default async function SeatingQrPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isAdmin) redirect("/");

  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="max-w-5xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        <SeatingQrClient origin={origin} />
      </main>
    </>
  );
}
