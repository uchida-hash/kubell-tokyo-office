"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Settings, LogOut, UserCircle, Hash, LayoutGrid } from "lucide-react";
import { useState } from "react";
import ProfileEditModal from "./ProfileEditModal";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const today = format(new Date(), "M月d日(E)", { locale: ja });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="text-xl">🏢</span>
          <span className="font-bold text-gray-800 text-lg">kubell Tokyo-Office</span>
        </Link>
        {/* デスクトップ: サイドバーと被るためロゴ非表示、スペーサーを置く */}
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/seating"
            className="hidden sm:flex lg:hidden items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-sm"
          >
            <LayoutGrid size={15} />
            座席表
          </Link>
          <Link
            href="/community"
            className="hidden sm:flex lg:hidden items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-sm"
          >
            <Hash size={15} />
            コミュニティ
          </Link>
          <span className="hidden sm:block">{today}</span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
                  {session?.user?.name?.[0] ?? "?"}
                </div>
              )}
              <span className="hidden sm:block text-gray-700 font-medium max-w-[120px] truncate">
                {session?.user?.name}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                <button
                  onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserCircle size={15} />
                  プロフィール編集
                </button>
                {session?.user?.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={15} />
                    管理者パネル
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {profileOpen && <ProfileEditModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
