"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Loader2, Hash, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = ["すべて", "趣味", "スポーツ", "仕事", "その他"];
const EMOJIS = ["💬", "🎯", "⚽", "🎨", "🎵", "📚", "🍜", "✈️", "🌿", "🎮", "🏃", "💪", "🐾", "🌸", "☕"];

interface Community {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  memberCount: number;
  isMember: boolean;
}

export default function CommunityList() {
  const { data: session } = useSession();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", emoji: "💬", category: "その他" });
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<Community | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", emoji: "💬", category: "その他" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = session?.user?.isAdmin;

  async function fetchCommunities() {
    const res = await fetch("/api/communities");
    if (res.ok) {
      const d = await res.json();
      setCommunities(d.communities ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchCommunities(); }, []);

  async function toggleJoin(id: string, isMember: boolean) {
    setJoiningId(id);
    try {
      await fetch(`/api/communities/${id}/join`, {
        method: isMember ? "DELETE" : "POST",
      });
      await fetchCommunities();
    } finally {
      setJoiningId(null);
    }
  }

  function openEdit(c: Community) {
    setEditTarget(c);
    setEditForm({ name: c.name, description: c.description, emoji: c.emoji, category: c.category });
  }

  async function saveCommunity() {
    if (!editTarget || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/communities/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditTarget(null);
      await fetchCommunities();
    } finally {
      setSaving(false);
    }
  }

  async function deleteCommunity(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？\n投稿・メンバー情報も全て削除されます。`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/communities/${id}`, { method: "DELETE" });
      await fetchCommunities();
    } finally {
      setDeletingId(null);
    }
  }

  async function createCommunity() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", description: "", emoji: "💬", category: "その他" });
      await fetchCommunities();
    } finally {
      setCreating(false);
    }
  }

  const filtered = activeCategory === "すべて"
    ? communities
    : communities.filter((c) => c.category === activeCategory);

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Hash size={20} className="text-brand-600" />
            コミュニティ
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">共通の趣味・興味でつながろう</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-all"
          >
            <Plus size={15} />
            作成
          </button>
        )}
      </div>

      {/* カテゴリタブ */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 text-sm rounded-full font-medium transition-all ${
              activeCategory === cat
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* コミュニティ一覧 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">
          {isAdmin ? "まだコミュニティがありません。「作成」から追加してください。" : "コミュニティがまだありません"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
              <Link href={`/community/${c.id}`} className="block mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users size={12} />
                  {c.memberCount}人
                </span>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="編集"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteCommunity(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="削除"
                      >
                        {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleJoin(c.id, c.isMember)}
                    disabled={joiningId === c.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      c.isMember
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200"
                    }`}
                  >
                    {joiningId === c.id ? <Loader2 size={12} className="animate-spin" /> : c.isMember ? "参加中" : "参加する"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-800 text-lg mb-4">コミュニティを編集</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">絵文字</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEditForm({ ...editForm, emoji: e })}
                      className={`text-xl p-1.5 rounded-lg transition-all ${editForm.emoji === e ? "bg-brand-100 ring-2 ring-brand-400" : "hover:bg-gray-100"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">名前 *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">説明</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">カテゴリ</label>
                <div className="flex gap-2 flex-wrap">
                  {["趣味", "スポーツ", "仕事", "その他"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEditForm({ ...editForm, category: cat })}
                      className={`text-sm px-3 py-1 rounded-full transition-all ${
                        editForm.category === cat ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={saveCommunity}
                disabled={saving || !editForm.name.trim()}
                className="flex-1 py-2 text-sm text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コミュニティ作成モーダル */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-800 text-lg mb-4">コミュニティを作成</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">絵文字</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`text-xl p-1.5 rounded-lg transition-all ${form.emoji === e ? "bg-brand-100 ring-2 ring-brand-400" : "hover:bg-gray-100"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">名前 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：ゴルフ部、読書好き"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="どんなコミュニティか説明してください"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">カテゴリ</label>
                <div className="flex gap-2 flex-wrap">
                  {["趣味", "スポーツ", "仕事", "その他"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`text-sm px-3 py-1 rounded-full transition-all ${
                        form.category === cat ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={createCommunity}
                disabled={creating || !form.name.trim()}
                className="flex-1 py-2 text-sm text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
