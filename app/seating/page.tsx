import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SeatingCard from "@/components/SeatingCard";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default async function SeatingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const today = format(new Date(), "yyyy年M月d日(E)", { locale: ja });

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800">座席表</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {today}のオフィス全体の着席状況
          </p>
        </div>
        <SeatingCard fullView />
      </main>
    </>
  );
}
