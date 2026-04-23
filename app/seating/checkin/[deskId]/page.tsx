import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CheckinClient from "./CheckinClient";

export default async function CheckinPage({
  params,
}: {
  params: { deskId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    // ログイン後にこのページに戻る
    redirect(`/login?callbackUrl=/seating/checkin/${params.deskId}`);
  }
  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-8">
        <CheckinClient deskId={params.deskId} />
      </main>
    </>
  );
}
