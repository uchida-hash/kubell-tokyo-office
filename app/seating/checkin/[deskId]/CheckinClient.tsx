"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, LayoutGrid } from "lucide-react";

type Status = "pending" | "success" | "error";

export default function CheckinClient({ deskId }: { deskId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("");
  const [deskLabel, setDeskLabel] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/seating/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deskId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "チェックインに失敗しました");
          return;
        }
        // デスク名を取りに行く
        const seatRes = await fetch("/api/seating");
        if (seatRes.ok) {
          const s = await seatRes.json();
          const desk = s.desks?.find(
            (d: { id: string; label: string }) => d.id === deskId
          );
          if (desk) setDeskLabel(desk.label);
        }
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage((e as Error).message ?? "通信エラー");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [deskId]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center">
      {status === "pending" && (
        <>
          <Loader2
            size={40}
            className="animate-spin text-brand-600 mx-auto mb-4"
            aria-hidden
          />
          <p className="text-gray-700 font-semibold">チェックイン中...</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2
            size={56}
            className="text-amber-600 mx-auto mb-4"
            aria-hidden
          />
          <h1 className="text-lg font-bold text-gray-800 mb-1">
            チェックイン完了
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {deskLabel ? `「${deskLabel}」を利用中にしました。` : "このデスクの利用を開始しました。"}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/seating"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl"
            >
              <LayoutGrid size={16} />
              座席表を見る
            </Link>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              ホームに戻る
            </button>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle
            size={56}
            className="text-red-600 mx-auto mb-4"
            aria-hidden
          />
          <h1 className="text-lg font-bold text-gray-800 mb-1">
            チェックインできませんでした
          </h1>
          <p className="text-sm text-red-700 mb-4">{message}</p>
          <Link
            href="/seating"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl"
          >
            座席表を開く
          </Link>
        </>
      )}
    </div>
  );
}
