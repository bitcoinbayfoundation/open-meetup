"use client";

import { useState, useRef, useCallback, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Post } from "@/lib/posts";
import { uploadAndOptimize } from "@/lib/compress-image";

interface AuthorOption {
  id: string;
  name: string;
}

interface Props {
  post?: Post;
  users?: AuthorOption[];
  currentUserId?: string;
}

export default function PostEditor({ post, users, currentUserId }: Props) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [authorId, setAuthorId] = useState(
    post?.author_id ?? currentUserId ?? "",
  );

  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = useState(
    post?.featured_image ?? "",
  );
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(
    post?.status ?? "draft",
  );
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at
      ? new Date(post.published_at).toISOString().slice(0, 16)
      : "",
  );
  const [tagsInput, setTagsInput] = useState(
    post?.tags?.map((t) => t.name).join(", ") ?? "",
  );
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description ?? "",
  );
  const [ogImage, setOgImage] = useState(post?.og_image ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      return await uploadAndOptimize(file);
    } catch {
      setError("Image upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleFeaturedImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setFeaturedImage(url);
  }

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = await uploadImage(file);
    if (url) setFeaturedImage(url);
  }, []);

  async function handleInlineImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (!url) return;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const before = body.slice(0, start);
      const after = body.slice(start);
      setBody(`${before}![${file.name}](${url})${after}`);
    } else {
      setBody((prev) => `${prev}\n![${file.name}](${url})`);
    }
    e.target.value = "";
  }

  async function handleOgImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setOgImage(url);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      body,
      excerpt: excerpt || null,
      featured_image: featuredImage || null,
      featured,
      status,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      og_image: ogImage || null,
      tags,
      ...(authorId ? { author_id: authorId } : {}),
    };

    try {
      const url = post ? `/api/posts/${post.id}` : "/api/posts";
      const method = post ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }

      router.push("/admin/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            vim {post ? `${post.slug}.md` : "new-post.md"}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          {post ? "edit post" : "new post"}
          <span className="text-t-accent glow">.</span>
        </h1>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="post title"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-lg focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="custom excerpt (optional — shown on listing page)"
            rows={2}
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4 resize-none"
          />

          {/* Tags */}
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tags (comma separated, e.g. meetup, education, news)"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Author */}
          {users && users.length > 0 && (
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4 appearance-none"
            >
              <option value="" disabled className="bg-t-dark text-t-surface/40">
                select author
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-t-dark text-t-surface">
                  {user.name}
                </option>
              ))}
            </select>
          )}

          {/* Featured image drop zone */}
          {featuredImage ? (
            <div className="flex items-center gap-4 mb-4 border border-t-surface/10 p-4">
              <img src={featuredImage} alt="Featured image preview" className="h-20 w-20 object-cover" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[0.6rem] text-t-surface/40 truncate block max-w-[300px]">
                  {featuredImage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFeaturedImage("")}
                className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors shrink-0"
              >
                remove
              </button>
            </div>
          ) : (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center h-32 mb-4 border border-dashed cursor-pointer transition-colors ${
                dragging
                  ? "border-t-accent/50 bg-t-accent/5"
                  : "border-t-surface/20 hover:border-t-accent/30"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                className="hidden"
              />
              {uploading ? (
                <p className="font-mono text-sm text-t-accent">uploading...</p>
              ) : dragging ? (
                <p className="font-mono text-sm text-t-accent">drop image here</p>
              ) : (
                <>
                  <p className="font-mono text-sm text-t-surface/70 mb-1">
                    drag featured image here or click to upload
                  </p>
                  <p className="font-mono text-[0.6rem] text-t-surface/40">
                    supports jpg, png, webp
                  </p>
                </>
              )}
            </label>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            {/* Status switch */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="font-mono text-[0.68rem] text-t-surface/50 lowercase">
                {status}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={status === "published"}
                onClick={() =>
                  setStatus((s) => (s === "draft" ? "published" : "draft"))
                }
                className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                  status === "published" ? "bg-t-accent" : "bg-t-surface/15"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-t-surface transition-transform ${
                    status === "published" ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </label>

            {/* Featured switch */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="font-mono text-[0.68rem] text-t-surface/50 lowercase">
                featured
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={featured}
                onClick={() => setFeatured((f) => !f)}
                className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                  featured ? "bg-t-warm" : "bg-t-surface/15"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-t-surface transition-transform ${
                    featured ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </label>

            {/* Insert image */}
            <label className="font-mono text-[0.68rem] text-t-surface/50 cursor-pointer hover:text-t-accent transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleInlineImageUpload}
                className="hidden"
              />
              insert image
            </label>

            {/* SEO toggle */}
            <button
              type="button"
              onClick={() => setShowSeo((s) => !s)}
              className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
            >
              {showSeo ? "hide seo" : "seo settings"}
            </button>

            {/* Word count / reading time */}
            <span className="font-mono text-[0.6rem] text-t-surface/30 ml-auto">
              {wordCount} words · {readTime} min read
            </span>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-3 mb-4">
            <label className="font-mono text-[0.68rem] text-t-surface/50">
              schedule:
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="bg-t-surface/5 border border-t-surface/15 px-3 py-1.5 text-t-surface font-mono text-[0.75rem] focus:border-t-accent focus:outline-none transition-colors"
            />
            {publishedAt && (
              <button
                type="button"
                onClick={() => setPublishedAt("")}
                className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors"
              >
                clear
              </button>
            )}
          </div>

          {/* SEO fields (collapsible) */}
          {showSeo && (
            <div className="border border-t-surface/10 p-4 mb-6 space-y-3">
              <p className="font-mono text-[0.6rem] text-t-surface/40 mb-2">
                <span className="text-t-accent">$</span> seo
              </p>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="meta title (defaults to post title)"
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
              />
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="meta description (defaults to excerpt or body)"
                rows={2}
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="font-mono text-[0.68rem] text-t-surface/50 cursor-pointer hover:text-t-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOgImageUpload}
                    className="hidden"
                  />
                  upload og image
                </label>
                {ogImage && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] text-t-surface/40 truncate max-w-[200px]">
                      {ogImage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOgImage("")}
                      className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Split pane editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border border-t-surface/10 mb-6">
            {/* Left: raw markdown */}
            <div className="border-b lg:border-b-0 lg:border-r border-t-surface/10">
              <div className="px-4 py-2 border-b border-t-surface/10 font-mono text-[0.6rem] text-t-surface/40">
                <span className="text-t-accent">$</span> raw
              </div>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="write your markdown here..."
                className="w-full h-[60vh] bg-transparent text-t-surface placeholder:text-t-surface/30 font-mono text-sm p-4 resize-none focus:outline-none"
              />
            </div>

            {/* Right: preview */}
            <div>
              <div className="px-4 py-2 border-b border-t-surface/10 font-mono text-[0.6rem] text-t-surface/40">
                <span className="text-t-accent">$</span> preview
              </div>
              <div className="p-4 overflow-auto h-[60vh] prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {body || "*start writing to see preview...*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {saving ? "saving..." : post ? "update post" : "create post"}
          </button>
        </form>
      </div>
    </main>
  );
}
