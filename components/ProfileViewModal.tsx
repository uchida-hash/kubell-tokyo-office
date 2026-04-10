"use client";

import { useEffect, useState } from "react";
import { X, Loader2, MapPinned, Briefcase, CalendarDays, Heart, Star, UtensilsCrossed, XCircle, Sparkles, Clock, FileText, Users, Globe } from "lucide-react";
import Image from "next/image";
import type { UserProfile } from "@/types";

interface Props {
  email: string;
  name: string;
  photo?: string;
  department?: string;
  onClose: () => void;
}

const SECTIONS = [
  {
    label: "仕事",
    items: [
      { key: "department", label: "部署名", icon: Briefcase },
      { key: "jobDescription", label: "仕事内容", icon: Briefcase },
      { key: "relatedMembers", label: "関わりが深いメンバー", icon: Users },
    ],
  },
  {
    label: "経歴",
    items: [
      { key: "joinDate", label: "入社年月日", icon: CalendarDays },
      { key: "careerHistory", label: "職歴", icon: CalendarDays },
      { key: "birthday", label: "誕生日", icon: CalendarDays },
    ],
  },
  {
    label: "出身・エリア",
    items: [
      { key: "hometown", label: "出身地", icon: MapPinned },
      { key: "currentArea", label: "出没エリア", icon: MapPinned },
    ],
  },
  {
    label: "パーソナリティ",
    items: [
      { key: "personality", label: "性格（長所・短所）", icon: Sparkles },
      { key: "languages", label: "言語", icon: Globe },
      { key: "specialSkills", label: "特技", icon: Star },
      { key: "hobbies", label: "趣味", icon: Heart },
    ],
  },
  {
    label: "食の好み",
    items: [
      { key: "favoriteFood", label: "好きな食べ物", icon: UtensilsCrossed },
      { key: "dislikedFood", label: "苦手な食べ物", icon: XCircle },
    ],
  },
  {
    label: "ライフスタイル",
    items: [
      { key: "recentInterests", label: "最近はやっているもの", icon: Sparkles },
      { key: "weekends", label: "週末の過ごし方", icon: Clock },
      { key: "freeText", label: "その他", icon: FileText },
    ],
  },
];

export default function ProfileViewModal({ email, name, photo, department, onClose }: Props) {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${encodeURIComponent(email)}/`)
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? {}))
      .finally(() => setLoading(false));
  }, [email]);

  const hasAnyData = profile && Object.values(profile).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {photo ? (
              <Image src={photo} alt={name} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold">
                {name[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-800">{name}</p>
              {department && <p className="text-xs text-gray-500">{department}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : !hasAnyData ? (
            <p className="text-center text-gray-400 text-sm py-12">
              プロフィールがまだ入力されていません
            </p>
          ) : (
            <div className="space-y-6">
              {SECTIONS.map(({ label, items }) => {
                const filled = items.filter(({ key }) => profile?.[key as keyof UserProfile]);
                if (filled.length === 0) return null;
                return (
                  <div key={label}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {label}
                    </h3>
                    <div className="space-y-2">
                      {filled.map(({ key, label: fieldLabel, icon: Icon }) => (
                        <div key={key} className="flex items-start gap-2">
                          <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs text-gray-400">{fieldLabel}：</span>
                            <span className="text-sm text-gray-700 whitespace-pre-wrap">
                              {profile?.[key as keyof UserProfile]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
