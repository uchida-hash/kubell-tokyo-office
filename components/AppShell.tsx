"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // ログイン画面はサイドバー非表示
  if (pathname === "/login") return <>{children}</>;

  return (
    <>
      <Sidebar />
      <div className="lg:pl-56">{children}</div>
    </>
  );
}
