"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Loader2,
  Maximize2,
  X,
  AlertCircle,
} from "lucide-react";
import type {
  Desk,
  SeatingLayout,
  SeatingRecord,
} from "@/types";
import SeatingGrid from "./SeatingGrid";
import ProfileViewModal from "./ProfileViewModal";

interface SeatingData {
  layout: SeatingLayout;
  desks: Desk[];
  records: SeatingRecord[];
  myRecord: SeatingRecord | null;
}

export default function SeatingCard({
  fullView = false,
}: {
  fullView?: boolean;
} = {}) {
  const { data: session } = useSession();
  const [data, setData] = useState<SeatingData>({
    layout: { cols: 12, rows: 8 },
    desks: [],
    records: [],
    myRecord: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewProfile, setViewProfile] = useState<SeatingRecord | null>(null);

  const myEmail = session?.user?.email ?? "";

  const fetchSeating = useCallback(async () => {
    const res = await fetch("/api/seating");
    if (res.ok) {
      const d = (await res.json()) as SeatingData;
      setData(d);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSeating();
    const timer = setInterval(fetchSeating, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchSeating]);

  async function reserveDesk(deskId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/seating/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deskId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "予約に失敗しました");
        return;
      }
      await fetchSeating();
    } finally {
      setSubmitting(false);
    }
  }

  async function releaseDesk() {
    setSubmitting(true);
    setError(null);
    try {
      await fetch("/api/seating", { method: "DELETE" });
      await fetchSeating();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCellClick({
    desk,
    record,
  }: {
    desk: Desk | null;
    record: SeatingRecord | null;
  }) {
    if (!desk || desk.type !== "desk") return;

    // 他人の席 → プロフィール表示
    if (record && record.uid !== myEmail) {
      setViewProfile(record);
      return;
    }

    // 自分の席 → 解除
    if (record && record.uid === myEmail) {
      if (confirm(`${desk.label} の${record.status === "in_use" ? "利用" : "予約"}を解除しますか？`)) {
        releaseDesk();
      }
      return;
    }

    // 空席 → 予約
    if (confirm(`${desk.label} を予約しますか？`)) {
      reserveDesk(desk.id);
    }
  }

  const reservedCount = data.records.filter((r) => r.status === "reserved").length;
  const inUseCount = data.records.filter((r) => r.status === "in_use").length;
  const hasLayout = data.desks.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <LayoutGrid size={18} className="text-brand-600" />
          <h2 className="font-bold text-gray-800">
            {fullView ? "座席表" : "今日の座席表"}
          </h2>
          {reservedCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              予約 {reservedCount}
            </span>
          )}
          {inUseCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              利用中 {inUseCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!fullView && (
            <Link
              href="/seating"
              className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Maximize2 size={12} />
              全表示
            </Link>
          )}
          {data.myRecord && (
            <button
              onClick={releaseDesk}
              disabled={submitting}
              className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
            >
              <X size={12} />
              自分の席を解除
            </button>
          )}
        </div>
      </div>

      {/* 自分の席情報 */}
      {data.myRecord && (
        <div className="mb-3 flex items-center gap-2 text-sm flex-wrap">
          <span className="text-gray-500">あなた：</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
              data.myRecord.status === "in_use"
                ? "bg-amber-100 text-amber-900 border-amber-600"
                : "bg-blue-100 text-blue-900 border-blue-600"
            }`}
          >
            {data.myRecord.status === "in_use" ? "利用中" : "予約中"}
          </span>
          <span className="text-xs text-gray-600">
            {data.desks.find((d) => d.id === data.myRecord!.deskId)?.label ?? ""}
          </span>
        </div>
      )}

      {error && (
        <div
          className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2"
          role="alert"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
            aria-label="閉じる"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : !hasLayout ? (
        <p className="text-center text-gray-400 text-sm py-6">
          座席レイアウトが未設定です。管理者に連絡してください。
        </p>
      ) : (
        <SeatingGrid
          layout={data.layout}
          desks={data.desks}
          records={data.records}
          myEmail={myEmail}
          compact={!fullView}
          onCellClick={handleCellClick}
        />
      )}

      {!fullView && hasLayout && (
        <p className="text-xs text-gray-400 mt-2">
          席をタップして予約・解除・プロフィール閲覧ができます。実際に着席する際はデスクの QR コードを読み取ってください。
        </p>
      )}

      {viewProfile && (
        <ProfileViewModal
          email={viewProfile.uid}
          name={viewProfile.name}
          photo={viewProfile.photo}
          department={viewProfile.department}
          onClose={() => setViewProfile(null)}
        />
      )}
    </div>
  );
}
