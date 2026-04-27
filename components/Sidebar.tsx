"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  LayoutGrid,
  Hash,
  Settings,
  LogOut,
  Shuffle,
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const nav: { href: string; label: string; icon: typeof Home }[] = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/seating", label: "座席表", icon: LayoutGrid },
    { href: "/lunch", label: "シャッフルランチ", icon: Shuffle },
    { href: "/community", label: "コミュニティ", icon: Hash },
  ];
  if (session?.user?.isAdmin) {
    nav.push({ href: "/admin", label: "管理者", icon: Settings });
  }

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-56 bg-white border-r border-gray-200 flex-col">
      {/* ロゴ */}
      <Link
        href="/"
        className="h-14 flex items-center gap-2 px-5 border-b border-gray-100 shrink-0"
      >
        <span className="text-xl">🏢</span>
        <span className="font-bold text-gray-800">kubell Tokyo</span>
      </Link>

      {/* ナビ */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 px-2 py-2">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ""}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
              {session?.user?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">
              {session?.user?.name}
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {session?.user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
