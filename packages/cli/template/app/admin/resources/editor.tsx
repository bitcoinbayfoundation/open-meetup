"use client";

import { useState, useCallback, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadAndOptimize } from "@/lib/compress-image";
interface ResourceTag {
  id: string;
  name: string;
  slug: string;
}

interface Resource {
  id: string;
  title: string;
  slug: string;
  url: string;
  description: string;
  author: string | null;
  image: string | null;
  category: ResourceCategory;
  featured: boolean;
  status: "draft" | "published";
  tags: ResourceTag[];
}

type ResourceCategory = "documentaries" | "books" | "articles" | "websites" | "podcasts";

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "documentaries",
  "books",
  "articles",
  "websites",
  "podcasts",
];

interface Props {
  resource?: Resource;
}

export default function ResourceEditor({ resource }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(resource?.title ?? "");
  const [url, setUrl] = useState(resource?.url ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [author, setAuthor] = useState(resource?.author ?? "");
  const [image, setImage] = useState(resource?.image ?? "");
  const [category, setCategory] = useState<ResourceCategory>(
    resource?.category ?? "articles",
  );
  const [featured, setFeatured] = useState(resource?.featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(
    resource?.status ?? "draft",
  );
  const [tagsInput, setTagsInput] = useState(
    resource?.tags?.map((t) => t.name).join(", ") ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); }, []);

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAndOptimize(file);
      setImage(url);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadAndOptimize(file);
      setImage(url);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      url,
      description,
      author: author || null,
      image: image || null,
      category,
      featured,
      status,
      tags,
    };

    try {
      const endpoint = resource
        ? `/api/resources/${resource.id}`
        : "/api/resources";
      const method = resource ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }

      router.push("/admin/resources");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            vim {resource ? `${resource.slug}.resource` : "new-resource"}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          {resource ? "edit resource" : "new resource"}
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
            placeholder="resource title"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-lg focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* URL */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Author / Creator */}
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="author / creator (e.g. Saifedean Ammous)"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="short description of this resource"
            rows={3}
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4 resize-none"
          />

          {/* Tags */}
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tags (comma separated, e.g. beginner, lightning, privacy)"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Image drop zone */}
          {image ? (
            <div className="flex items-center gap-4 mb-4 border border-t-surface/10 p-4">
              <img src={image} alt="Resource image preview" className="h-20 w-20 object-cover" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[0.6rem] text-t-surface/40 truncate block max-w-[300px]">
                  {image}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImage("")}
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
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading ? (
                <p className="font-mono text-sm text-t-accent">uploading...</p>
              ) : dragging ? (
                <p className="font-mono text-sm text-t-accent">drop image here</p>
              ) : (
                <>
                  <p className="font-mono text-sm text-t-surface/70 mb-1">
                    drag image here or click to upload
                  </p>
                  <p className="font-mono text-[0.6rem] text-t-surface/40">
                    supports jpg, png, webp
                  </p>
                </>
              )}
            </label>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Category selector */}
            <div className="flex gap-2">
              {RESOURCE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`font-mono text-[0.68rem] lowercase px-3 py-1 border transition-colors ${
                    category === cat
                      ? "border-t-accent text-t-accent"
                      : "border-t-surface/20 text-t-surface/50 hover:border-t-surface/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mb-8">
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
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {saving
              ? "saving..."
              : resource
                ? "update resource"
                : "create resource"}
          </button>
        </form>
      </div>
    </main>
  );
}
