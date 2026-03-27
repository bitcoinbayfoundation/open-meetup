"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/posts";
import { useState } from "react";

export default function AdminPostList({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleStatus(post: Post) {
    setTogglingId(post.id);
    const newStatus = post.status === "published" ? "draft" : "published";
    await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTogglingId(null);
    router.refresh();
  }

  async function handleToggleFeatured(post: Post) {
    await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !post.featured }),
    });
    router.refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function readingTime(body: string): number {
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  function isScheduled(post: Post): boolean {
    return (
      post.status === "published" &&
      !!post.published_at &&
      new Date(post.published_at) > new Date()
    );
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">ls ./posts</span>
        </div>

        <div className="flex items-start justify-between mb-12">
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)]">
            posts<span className="text-t-accent glow">.</span>
          </h1>
          <Link
            href="/admin/posts/new"
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
          >
            new post
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="font-mono text-sm text-t-surface/55">
            no posts yet. create your first one.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-t-surface/20 p-5 hover:border-t-surface/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="font-mono font-bold text-t-surface lowercase truncate">
                        {post.title}
                      </h2>

                      {/* Status badge / quick toggle */}
                      <button
                        onClick={() => handleToggleStatus(post)}
                        disabled={togglingId === post.id}
                        className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border shrink-0 transition-colors ${
                          isScheduled(post)
                            ? "border-t-highlight/40 text-t-highlight"
                            : post.status === "published"
                              ? "border-t-accent/40 text-t-accent hover:border-t-surface/40 hover:text-t-surface/60"
                              : "border-t-surface/30 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
                        }`}
                      >
                        {togglingId === post.id
                          ? "..."
                          : isScheduled(post)
                            ? "scheduled"
                            : post.status}
                      </button>

                      {/* Featured badge */}
                      <button
                        onClick={() => handleToggleFeatured(post)}
                        className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border shrink-0 transition-colors ${
                          post.featured
                            ? "border-t-warm/40 text-t-warm"
                            : "border-t-surface/20 text-t-surface/35 hover:border-t-warm/30 hover:text-t-warm/60"
                        }`}
                      >
                        ★
                      </button>
                    </div>

                    {/* Meta line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-[0.65rem] text-t-surface/55">
                        {post.author_name} &middot;{" "}
                        {new Date(post.created_at).toLocaleDateString()} &middot;{" "}
                        {readingTime(post.body)} min read
                      </p>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="font-mono text-[0.55rem] text-t-accent border border-t-accent/40 bg-t-accent/10 px-1.5 py-0.5"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Scheduled date */}
                    {isScheduled(post) && post.published_at && (
                      <p className="font-mono text-[0.6rem] text-t-highlight/60 mt-1">
                        publishes{" "}
                        {new Date(post.published_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="font-mono text-[0.68rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                    >
                      edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="font-mono text-[0.68rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
                    >
                      delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
