"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { UtensilsCrossed, Shuffle, Loader2 } from "lucide-react";
import type { LunchParticipant, LunchGroup } from "@/types";

interface LunchData {
  participants: LunchParticipant[];
  matches: LunchGroup[] | null;
  matchedAt: string | null;
  matchCriteria?: string[]; // 使用したマッチング軸
}

export default function LunchCard() {
  const { data: session } = useSession();
  const [data, setData] = useState<LunchData>({
    participants: [],
    matches: null,
    matchedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matching, setMatching] = useState(false);

  const myEmail = session?.user?.email ?? "";
  const isJoined = data.participants.some((p) => p.uid === myEmail);
  const isAdmin = session?.user?.isAdmin;

  async function fetchLunch() {
    const res = await fetch("/api/lunch");
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLunch();
    const timer = setInterval(fetchLunch, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  async function toggleJoin() {
    setSubmitting(true);
    try {
      await fetch("/api/lunch", { method: "POST" });
      await fetchLunch();
    } finally {
      setSubmitting(false);
    }
  }

  async function runMatch() {
    setMatching(true);
    try {
      const res = await fetch("/api/lunch/match", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
      } else {
        await fetchLunch();
      }
    } finally {
      setMatching(false);
    }
  }

  const groupColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-orange-50 border-orange-200",
    "bg-pink-50 border-pink-200",
    "bg-teal-50 border-teal-200",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-orange-500" />
          <h2 className="font-bold text-gray-800">シャッフルランチ</h2>
          <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
            {data.participants.length}人参加
          </span>
        </div>

        <button
          onClick={toggleJoin}
          disabled={submitting}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
            isJoined
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <UtensilsCrossed size={14} />}
          {isJoined ? "参加取消" : "参加する"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-orange-400" />
        </div>
      ) : data.matches ? (
        // マッチング結果表示
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-gray-400">
              マッチング済み ✓ {data.participants.length}人 → {data.matches.length}グループ
            </p>
            {data.matchCriteria && data.matchCriteria.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {data.matchCriteria.map((key: string) => (
                  <span key={key} className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                    {key}軸
                  </span>
                ))}
              </div>
            )}
          </div>
          {data.matches.map((group, i) => (
            <div key={i} className={`rounded-xl border p-3 ${groupColors[i % groupColors.length]}`}>
              <div className="text-xs font-semibold text-gray-500 mb-2">グループ {i + 1}</div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                {group.members.map((m) => (
                  <div key={m.uid} className="flex items-center gap-1.5">
                    {m.photo ? (
                      <Image src={m.photo} alt={m.name} width={28} height={28} className="rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                        {m.name[0]}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{m.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              {group.topics && group.topics.length > 0 && (
                <div className="mt-2 pt-2 border-t border-black/10">
                  <p className="text-xs font-semibold text-gray-500 mb-1">💬 話題のタネ</p>
                  <ul className="space-y-1">
                    {group.topics.map((topic, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-gray-400 shrink-0">・</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : data.participants.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">まだ参加者がいません</p>
      ) : (
        // 参加者一覧（マッチング前）
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.participants.map((p) => (
              <div key={p.uid} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1">
                {p.photo ? (
                  <Image src={p.photo} alt={p.name} width={22} height={22} className="rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {p.name[0]}
                  </div>
                )}
                <span className="text-xs text-gray-700">{p.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={runMatch}
              disabled={matching || data.participants.length < 2}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {matching ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
              {matching ? "マッチング中..." : "マッチング実行"}
            </button>
          )}

          {!isAdmin && (
            <p className="text-xs text-gray-400 text-center">
              管理者がマッチングを実行するまでお待ちください
            </p>
          )}
        </div>
      )}
    </div>
  );
}
