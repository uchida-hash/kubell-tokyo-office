import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CommunityList from "@/components/CommunityList";

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CommunityList />
      </main>
    </>
  );
}
