"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Send, Loader2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Community, CommunityPost } from "@/types";

interface Props {
  communityId: string;
}

export default function CommunityDetail({ communityId }: Props) {
  const { data: session } = useSession();
  const [community, setCommunity] = useState<(Community & { isMember: boolean }) | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const myEmail = session?.user?.email ?? "";

  async function fetchData() {
    const [commRes, postsRes] = await Promise.all([
      fetch("/api/communities"),
      fetch(`/api/communities/${communityId}/posts`),
    ]);
    if (commRes.ok) {
      const d = await commRes.json();
      const found = d.communities?.find((c: Community) => c.id === communityId);
      if (found) setCommunity(found);
    }
    if (postsRes.ok) {
      const d = await postsRes.json();
      setPosts(d.posts ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [communityId]);

  async function toggleJoin() {
    if (!community) return;
    setJoining(true);
    try {
      await fetch(`/api/communities/${communityId}/join`, {
        method: community.isMember ? "DELETE" : "POST",
      });
      await fetchData();
    } finally {
      setJoining(false);
    }
  }

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setContent("");
      await fetchData();
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: string) {
    setLikingId(postId);
    try {
      await fetch(`/api/communities/${communityId}/posts/${postId}/like`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const liked = p.likedBy?.includes(myEmail);
          return {
            ...p,
            likeCount: liked ? p.likeCount - 1 : p.likeCount + 1,
            likedBy: liked
              ? (p.likedBy ?? []).filter((e) => e !== myEmail)
              : [...(p.likedBy ?? []), myEmail],
          };
        })
      );
    } finally {
      setLikingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitPost();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!community) {
    return <p className="text-center text-gray-400 py-20">コミュニティが見つかりません</p>;
  }

  return (
    <div>
      {/* 戻るボタン */}
      <Link href="/community" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={15} />
        コミュニティ一覧
      </Link>

      {/* コミュニティヘッダー */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{community.emoji}</span>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">{community.name}</h1>
              {community.description && (
                <p className="text-sm text-gray-500 mt-0.5">{community.description}</p>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Users size={12} />
                {community.memberCount}人のメンバー
              </span>
            </div>
          </div>
          <button
            onClick={toggleJoin}
            disabled={joining}
            className={`shrink-0 text-sm font-medium px-4 py-2 rounded-xl transition-all ${
              community.isMember
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {joining ? <Loader2 size={14} className="animate-spin" /> : community.isMember ? "参加中" : "参加する"}
          </button>
        </div>
      </div>

      {/* 投稿フォーム */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex gap-3">
          {session?.user?.image ? (
            <Image src={session.user.image} alt="" width={36} height={36} className="rounded-full shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
              {session?.user?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="投稿する... (⌘+Enter で送信)"
              rows={2}
              className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submitPost}
                disabled={posting || !content.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-all"
              >
                {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                投稿
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            まだ投稿がありません。最初の投稿をしてみましょう！
          </p>
        ) : (
          posts.map((post) => {
            const liked = post.likedBy?.includes(myEmail);
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  {post.authorPhoto ? (
                    <Image src={post.authorPhoto} alt={post.authorName} width={36} height={36} className="rounded-full shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                      {post.authorName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{post.authorName.split(" ")[0]}</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(post.createdAt), { locale: ja, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={likingId === post.id}
                      className={`flex items-center gap-1 mt-2 text-xs transition-all ${
                        liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                    >
                      <Heart size={13} fill={liked ? "currentColor" : "none"} />
                      {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
