"use client";

import { useState, useEffect } from "react";
import { Megaphone, Trash2, Plus, Loader2, Users, Shuffle, UserCog, SlidersHorizontal, X, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Announcement } from "@/types";
import AdminSeatingTab from "./AdminSeatingTab";

export default function AdminPanel() {
  const [tab, setTab] = useState<
    "announcements" | "attendance" | "lunch" | "users" | "seating"
  >("announcements");

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 flex-wrap">
        {[
          { key: "announcements", label: "掲示板", icon: Megaphone },
          { key: "attendance", label: "出社", icon: Users },
          { key: "lunch", label: "ランチ", icon: Shuffle },
          { key: "seating", label: "座席", icon: LayoutGrid },
          { key: "users", label: "ユーザー", icon: UserCog },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "attendance" && <AttendanceTab />}
      {tab === "lunch" && <LunchTab />}
      {tab === "seating" && <AdminSeatingTab />}
      {tab === "users" && <UsersTab />}
    </div>
  );
}

/* ─── 掲示板管理 ─── */
function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal" as "normal" | "important" | "urgent",
    expiresAt: "",
  });

  async function fetchAll() {
    const res = await fetch("/api/announcements");
    const d = await res.json();
    setAnnouncements(d.announcements ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      setForm({ title: "", content: "", priority: "normal", expiresAt: "" });
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAll();
  }

  return (
    <div className="space-y-6">
      {/* 投稿フォーム */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Plus size={16} /> 新規投稿
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="タイトル"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <textarea
            placeholder="内容"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
          <div className="flex gap-3">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="normal">お知らせ</option>
              <option value="important">重要</option>
              <option value="urgent">緊急</option>
            </select>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              placeholder="掲載終了日時（任意）"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            投稿する
          </button>
        </form>
      </div>

      {/* 既存一覧 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700">掲示中 ({announcements.length}件)</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">投稿はありません</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-800">{a.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.priority === "urgent" ? "bg-red-100 text-red-700" :
                    a.priority === "important" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {a.priority === "urgent" ? "緊急" : a.priority === "important" ? "重要" : "お知らせ"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(a.publishedAt), "M/d HH:mm", { locale: ja })}
                  {a.expiresAt && ` 〜 ${format(new Date(a.expiresAt), "M/d HH:mm", { locale: ja })}`}
                </p>
              </div>
              <button
                onClick={() => deleteAnnouncement(a.id)}
                className="text-red-400 hover:text-red-600 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── 出社管理 ─── */
function AttendanceTab() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then((r) => r.json())
      .then((d) => setParticipants(d.participants ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-700 mb-4">
        本日の出社者 ({participants.length}名)
      </h3>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : participants.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">出社者なし</p>
      ) : (
        <div className="space-y-2">
          {participants.map((p: any) => (
            <div key={p.uid} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-800 font-medium">{p.name}</span>
              <span className="text-xs text-gray-400">{p.department}</span>
              {p.source === "chatwork" && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Chatwork</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {format(new Date(p.registeredAt), "HH:mm")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CRITERIA_OPTIONS = [
  { key: "hometown",        label: "出身地" },
  { key: "hobbies",         label: "趣味" },
  { key: "favoriteFood",    label: "好きな食べ物" },
  { key: "specialSkills",   label: "特技" },
  { key: "recentInterests", label: "最近はまっているもの" },
  { key: "weekends",        label: "週末の過ごし方" },
  { key: "department",      label: "部署" },
  { key: "careerHistory",   label: "職歴" },
];

/* ─── ランチ管理 ─── */
function LunchTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [criteriaMessage, setCriteriaMessage] = useState("");

  async function fetchLunch() {
    const [lunchRes, settingsRes] = await Promise.all([
      fetch("/api/lunch"),
      fetch("/api/settings/lunch"),
    ]);
    setData(await lunchRes.json());
    const settings = await settingsRes.json();
    setCriteria(settings.criteria ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchLunch(); }, []);

  async function saveCriteria() {
    setSavingCriteria(true);
    await fetch("/api/settings/lunch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria }),
    });
    setSavingCriteria(false);
    setCriteriaMessage("保存しました");
    setTimeout(() => setCriteriaMessage(""), 2000);
  }

  function toggleCriterion(key: string) {
    setCriteria((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function runMatch() {
    setMatching(true);
    const res = await fetch("/api/lunch/match", { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    } else {
      await fetchLunch();
    }
    setMatching(false);
  }

  async function resetMatch() {
    if (!confirm("マッチングをリセットしますか？")) return;
    await fetch("/api/lunch/match", { method: "DELETE" });
    await fetchLunch();
  }

  return (
    <div className="space-y-4">
      {/* マッチング軸設定 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={16} className="text-orange-400" />
          <h3 className="font-semibold text-gray-700">マッチング軸の設定</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          選んだ項目でプロフィールの共通点が多い人同士をグループ化します。未選択の場合はランダムです。
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CRITERIA_OPTIONS.map((opt) => {
            const selected = criteria.includes(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => toggleCriterion(opt.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selected
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
              >
                {selected && <X size={11} />}
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {criteria.length > 0 && (
            <button
              onClick={() => setCriteria([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              クリア（ランダムに戻す）
            </button>
          )}
          <button
            onClick={saveCriteria}
            disabled={savingCriteria}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            {savingCriteria ? <Loader2 size={13} className="animate-spin" /> : null}
            保存
          </button>
          {criteriaMessage && (
            <span className="text-xs text-green-600">{criteriaMessage}</span>
          )}
        </div>
      </div>

      {/* 参加者 & マッチング実行 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">
          本日の参加者 ({data?.participants?.length ?? 0}名)
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (data?.participants?.length ?? 0) === 0 ? (
          <p className="text-gray-400 text-sm text-center py-3">参加者なし</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.participants.map((p: any) => (
              <span key={p.uid} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                {p.name.split(" ")[0]}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={runMatch}
            disabled={matching || (data?.participants?.length ?? 0) < 2}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {matching ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
            マッチング実行{criteria.length > 0 ? `（${criteria.map((k) => CRITERIA_OPTIONS.find((o) => o.key === k)?.label).join("・")}軸）` : "（ランダム）"}
          </button>
          {data?.matches && (
            <button
              onClick={resetMatch}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {data?.matches && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">マッチング結果</h3>
          <div className="space-y-3">
            {data.matches.map((group: any, i: number) => (
              <div key={i} className="border rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">グループ {i + 1}</p>
                <p className="text-sm text-gray-800">
                  {group.members.map((m: any) => m.name.split(" ")[0]).join(" / ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ユーザー管理 ─── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [chatworkId, setChatworkId] = useState("");
  const [confluenceUrl, setConfluenceUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function saveMapping(uid: string) {
    setSaving(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, chatworkAccountId: chatworkId, confluencePageUrl: confluenceUrl }),
    });
    setEditingUid(null);
    setChatworkId("");
    setConfluenceUrl("");
    const res = await fetch("/api/admin/users");
    const d = await res.json();
    setUsers(d.users ?? []);
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-700 mb-4">
        登録ユーザー ({users.length}名)
      </h3>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.uid} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              {editingUid === u.uid ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatworkId}
                    onChange={(e) => setChatworkId(e.target.value)}
                    placeholder="Chatwork ID"
                    className="border rounded-lg px-2 py-1 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <input
                    type="text"
                    value={confluenceUrl}
                    onChange={(e) => setConfluenceUrl(e.target.value)}
                    placeholder="Confluence URL"
                    className="border rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <button
                    onClick={() => saveMapping(u.uid)}
                    disabled={saving}
                    className="text-xs bg-brand-600 text-white px-2 py-1 rounded-lg"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingUid(null)}
                    className="text-xs text-gray-400"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {u.chatworkAccountId ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      CW: {u.chatworkAccountId}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">未設定</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingUid(u.uid);
                      setChatworkId(u.chatworkAccountId ?? "");
                      setConfluenceUrl(u.confluencePageUrl ?? "");
                    }}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    編集
                  </button>
                  {u.isAdmin && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      管理者
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
