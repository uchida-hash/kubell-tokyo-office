"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Users, MapPin, MapPinOff, Loader2, MessageCircle, X, BookUser } from "lucide-react";
import type { AttendanceRecord } from "@/types";

interface ProfilePopupProps {
  member: AttendanceRecord;
  onClose: () => void;
}

function ProfilePopup({ member, onClose }: ProfilePopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52 -translate-x-1/2 left-1/2 mt-2"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>

      <div className="flex flex-col items-center gap-2 mb-3">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold">
            {member.name[0]}
          </div>
        )}
        <div className="text-center">
          <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
          {member.department && (
            <p className="text-xs text-gray-500">{member.department}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {member.chatworkAccountId ? (
          <a
            href={`https://www.chatwork.com/#!rid${member.chatworkAccountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#00A95F] hover:bg-[#008a4e] text-white text-sm font-medium py-2 rounded-xl transition-all"
          >
            <MessageCircle size={14} />
            Chatwork で DM
          </a>
        ) : (
          <p className="text-xs text-gray-400 text-center">
            Chatwork 未設定
          </p>
        )}

        {member.confluencePageUrl && (
          <a
            href={member.confluencePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium py-2 rounded-xl transition-all"
          >
            <BookUser size={14} />
            自己紹介を見る
          </a>
        )}
      </div>
    </div>
  );
}

export default function AttendanceCard() {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AttendanceRecord | null>(null);

  const myEmail = session?.user?.email ?? "";
  const isRegistered = participants.some((p) => p.uid === myEmail);

  async function fetchAttendance() {
    const res = await fetch("/api/attendance");
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(fetchAttendance, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  async function toggle() {
    setSubmitting(true);
    try {
      if (isRegistered) {
        await fetch("/api/attendance", { method: "DELETE" });
      } else {
        await fetch("/api/attendance", { method: "POST" });
      }
      await fetchAttendance();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-brand-600" />
          <h2 className="font-bold text-gray-800">今日の出社メンバー</h2>
          <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
            {participants.length}人
          </span>
        </div>

        <button
          onClick={toggle}
          disabled={submitting}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
            isRegistered
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isRegistered ? (
            <MapPinOff size={14} />
          ) : (
            <MapPin size={14} />
          )}
          {isRegistered ? "取消" : "出社登録"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : participants.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          まだ誰も出社登録していません
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {participants.map((p) => (
            <div key={p.uid} className="relative flex flex-col items-center gap-1 w-14">
              <button
                onClick={() =>
                  setSelectedMember(selectedMember?.uid === p.uid ? null : p)
                }
                className="relative focus:outline-none"
              >
                {p.photo ? (
                  <Image
                    src={p.photo}
                    alt={p.name}
                    width={44}
                    height={44}
                    className="rounded-full ring-2 ring-white shadow hover:ring-brand-300 transition-all"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm ring-2 ring-white shadow hover:ring-brand-300 transition-all">
                    {p.name[0]}
                  </div>
                )}
                {p.uid === myEmail && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </button>

              {selectedMember?.uid === p.uid && (
                <ProfilePopup
                  member={p}
                  onClose={() => setSelectedMember(null)}
                />
              )}

              <span className="text-xs text-gray-600 text-center leading-tight truncate w-full text-center">
                {p.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      {isRegistered && (
        <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
          本日出社登録済み
        </p>
      )}
    </div>
  );
}
