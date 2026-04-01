"use client";

import { useEffect, useState } from "react";
import { Gift, Loader2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface MiiveData {
  linked: boolean;
  point?: number;
  expirePoint?: number;
  expireDate?: string;
  updatedAt?: string;
}

export default function MiiveCard() {
  const [data, setData] = useState<MiiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/miive")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => setData({ linked: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-pink-500" />
          <h2 className="font-bold text-gray-800">miive ポイント</h2>
        </div>
        <a
          href="https://miive.me"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1"
        >
          miiveを開く <ExternalLink size={11} />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={24} className="animate-spin text-pink-400" />
        </div>
      ) : !data?.linked ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">miive ポイント情報が未設定です</p>
          <p className="text-gray-400 text-xs mt-1">
            管理者にご連絡ください
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-gray-800">
              {(data.point ?? 0).toLocaleString()}
            </span>
            <span className="text-lg text-gray-500 mb-0.5">pt</span>
          </div>

          {(data.expirePoint ?? 0) > 0 && data.expireDate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
              <span className="text-amber-700 font-medium">
                {(data.expirePoint ?? 0).toLocaleString()}pt
              </span>
              <span className="text-amber-600 text-xs ml-1">
                が{format(parseISO(data.expireDate), "M月d日", { locale: ja })}に期限切れ
              </span>
            </div>
          )}

          {data.updatedAt && (
            <p className="text-xs text-gray-400 mt-3">
              最終更新:{" "}
              {format(parseISO(data.updatedAt), "M/d HH:mm", { locale: ja })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
