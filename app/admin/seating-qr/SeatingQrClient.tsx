"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import type { Desk } from "@/types";

export default function SeatingQrClient({ origin }: { origin: string }) {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seating")
      .then((r) => r.json())
      .then((d) => setDesks((d.desks as Desk[]).filter((x) => x.type === "desk")))
      .finally(() => setLoading(false));
  }, []);

  // 上→下、左→右の順にソート（y を 5% バケットに丸めて同じ行を揃える）
  const sorted = [...desks].sort((a, b) => {
    const ay = Math.round(a.y * 20);
    const by = Math.round(b.y * 20);
    return ay === by ? a.x - b.x : ay - by;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft size={14} />
            管理者パネルに戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-800">座席 QR コード印刷</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            各デスクに貼り付ける QR コード。スキャン →
            ログイン済みユーザーがそのデスクにチェックインできます。
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl"
        >
          <Printer size={16} />
          印刷
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12 print:hidden">
          デスクが登録されていません
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
          {sorted.map((desk) => {
            const url = `${origin}/seating/checkin/${desk.id}`;
            return (
              <div
                key={desk.id}
                className="border border-gray-300 rounded-lg p-3 flex flex-col items-center bg-white break-inside-avoid print:border-gray-400"
              >
                <div className="text-base font-bold text-gray-800 mb-1">
                  {desk.label}
                </div>
                <div className="text-xs text-gray-500 mb-2">着席 QR</div>
                <QRCodeSVG value={url} size={140} />
                <div className="text-[10px] text-gray-400 mt-2 break-all text-center">
                  {url}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white; }
        }
      `}</style>
    </>
  );
}
