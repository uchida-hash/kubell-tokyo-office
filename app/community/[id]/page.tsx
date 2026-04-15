import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CommunityDetail from "@/components/CommunityDetail";

export default async function CommunityDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <CommunityDetail communityId={params.id} />
      </main>
    </>
  );
}
