"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";

interface Props {
  onClose: () => void;
}

const FIELDS = [
  { section: "必須項目", items: [
    { key: "department", label: "部署名", placeholder: "例：CEO室" },
    { key: "jobDescription", label: "仕事内容", placeholder: "例：サステナビリティ推進、全体最適", textarea: true },
    { key: "relatedMembers", label: "関わりが深いメンバー（部署・チーム）", placeholder: "例：経営企画、営業部" },
  ]},
  { section: "入社・経歴", items: [
    { key: "joinDate", label: "入社年月日", placeholder: "例：2019/1/8" },
    { key: "careerHistory", label: "職歴", placeholder: "例：銀行員、営業、秘書、人事", textarea: true },
    { key: "birthday", label: "誕生日", placeholder: "例：1985/4/2" },
  ]},
  { section: "出身・エリア", items: [
    { key: "hometown", label: "出身地", placeholder: "例：岡山県倉敷市" },
    { key: "currentArea", label: "出没エリア", placeholder: "例：東銀座・築地、日本橋" },
  ]},
  { section: "パーソナリティ", items: [
    { key: "personality", label: "性格（長所・短所）", placeholder: "例：長所：裏表ない / 短所：興味の持久力がない", textarea: true },
    { key: "languages", label: "言語", placeholder: "例：日本語、英語" },
    { key: "specialSkills", label: "特技", placeholder: "例：生け花" },
    { key: "hobbies", label: "趣味", placeholder: "例：美術館・博物館、ゴルフ", textarea: true },
  ]},
  { section: "食の好み", items: [
    { key: "favoriteFood", label: "好きな食べ物", placeholder: "例：お肉（牛・羊）、パクチー", textarea: true },
    { key: "dislikedFood", label: "苦手な食べ物", placeholder: "例：加工された果物、にんじん" },
  ]},
  { section: "ライフスタイル", items: [
    { key: "recentInterests", label: "最近はやっているもの", placeholder: "例：King Gnu、ゴルフ" },
    { key: "weekends", label: "週末の過ごし方", placeholder: "例：週2でゴルフ練習、月イチゴルフ", textarea: true },
    { key: "freeText", label: "その他（ペットなど自由に）", placeholder: "例：うさぎ飼ってます🐰", textarea: true },
  ]},
];

export default function ProfileEditModal({ onClose }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile ?? {};
        const init: Record<string, string> = {};
        FIELDS.flatMap((s) => s.items).forEach(({ key }) => {
          init[key] = p[key] ?? "";
        });
        setForm(init);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">プロフィール編集（あれ誰）</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {FIELDS.map(({ section, items }) => (
                <div key={section}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {section}
                  </h3>
                  <div className="space-y-3">
                    {items.map(({ key, label, placeholder, textarea }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                        </label>
                        {textarea ? (
                          <textarea
                            rows={2}
                            value={form[key] ?? ""}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={form[key] ?? ""}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200"
          >
            閉じる
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "保存しました！" : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
