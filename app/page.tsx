import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import AttendanceCard from "@/components/AttendanceCard";
import LunchCard from "@/components/LunchCard";
import CalendarCard from "@/components/CalendarCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import MiiveCard from "@/components/MiiveCard";
import SeatingCard from "@/components/SeatingCard";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const today = format(new Date(), "yyyy年M月d日(E)", { locale: ja });

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            おはようございます、{session.user.name?.split(" ")[0]} さん 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>

        {/* モバイル: 1列 / タブレット以上: 2列 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 掲示板（全幅） */}
          <div className="lg:col-span-2">
            <AnnouncementCard />
          </div>

          {/* 出社状況 */}
          <AttendanceCard />

          {/* シャッフルランチ */}
          <LunchCard />

          {/* 座席表（全幅） */}
          <div className="lg:col-span-2">
            <SeatingCard />
          </div>

          {/* カレンダー */}
          <CalendarCard />

          {/* miive */}
          <MiiveCard />
        </div>
      </main>
    </>
  );
}
