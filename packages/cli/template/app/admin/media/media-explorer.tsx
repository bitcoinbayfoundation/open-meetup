"use client";

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import type { Media, FolderInfo } from "@/lib/media";
import { upload } from "@vercel/blob/client";

interface Props {
  initialMedia: Media[];
  initialFolders: FolderInfo[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

function isOptimized(mime: string): boolean {
  return mime === "image/webp" || mime === "image/svg+xml" || mime === "image/gif";
}

function canOptimize(mime: string): boolean {
  return ["image/jpeg", "image/png", "image/tiff", "image/avif"].includes(mime);
}

export default function MediaExplorer({ initialMedia, initialFolders }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState(initialMedia);
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<Set<string>>(new Set());
  const [optimizingAll, setOptimizingAll] = useState(false);

  const currentFolder = activeFolder ?? "/";

  const filtered = media.filter((m) => {
    if (activeFolder && m.folder !== activeFolder) return false;
    if (!activeFolder && search) {
      return m.filename.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const unoptimizedCount = filtered.filter((m) => canOptimize(m.mime_type)).length;

  // --- Upload ---
  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        // Upload directly to Vercel Blob (bypasses 4.5MB limit)
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload/handle",
        });
        // Optimize + create DB record via media API
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: blob.url,
            filename: file.name,
            folder: currentFolder,
          }),
        });
        if (res.ok) {
          const newMedia = await res.json();
          setMedia((prev) => [newMedia, ...prev]);
          updateFolderCount(currentFolder, 1);
        }
      } catch { /* continue */ }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) uploadFiles(e.target.files);
  }

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); }, []);
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [currentFolder]);

  // --- Delete ---
  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return;
    const item = media.find((m) => m.id === id);
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    if (item) updateFolderCount(item.folder, -1);
    router.refresh();
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} files?`)) return;
    for (const id of selected) {
      const item = media.find((m) => m.id === id);
      await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (item) updateFolderCount(item.folder, -1);
    }
    setMedia((prev) => prev.filter((m) => !selected.has(m.id)));
    setSelected(new Set());
    router.refresh();
  }

  // --- Move ---
  async function handleMove(targetFolder: string) {
    for (const id of selected) {
      const item = media.find((m) => m.id === id);
      await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: targetFolder }),
      });
      if (item) {
        updateFolderCount(item.folder, -1);
        updateFolderCount(targetFolder, 1);
      }
    }
    setMedia((prev) => prev.map((m) => selected.has(m.id) ? { ...m, folder: targetFolder } : m));
    setSelected(new Set());
    setMovingTo(null);
    router.refresh();
  }

  // --- Optimize ---
  async function handleOptimize(id: string) {
    setOptimizing((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/admin/media/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.optimized > 0) {
        router.refresh();
        setMedia((prev) => prev.map((m) =>
          m.id === id ? { ...m, mime_type: "image/webp", filename: m.filename.replace(/\.[^.]+$/, ".webp") } : m,
        ));
      }
    } catch { /* silently fail */ } finally {
      setOptimizing((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  }

  async function handleOptimizeAll() {
    if (!confirm(`Optimize ${unoptimizedCount} unoptimized images to WebP?`)) return;
    setOptimizingAll(true);
    try {
      const res = await fetch("/api/admin/media/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.optimized > 0) { router.refresh(); window.location.reload(); }
    } catch { /* silently fail */ } finally { setOptimizingAll(false); }
  }

  // --- Folder helpers ---
  function updateFolderCount(folder: string, delta: number) {
    setFolders((prev) => {
      const existing = prev.find((f) => f.name === folder);
      if (existing) {
        const newCount = existing.count + delta;
        if (newCount <= 0) return prev.filter((f) => f.name !== folder);
        return prev.map((f) => f.name === folder ? { ...f, count: newCount } : f);
      }
      if (delta > 0) return [...prev, { name: folder, count: delta }].sort((a, b) => a.name.localeCompare(b.name));
      return prev;
    });
  }

  function handleCreateFolder() {
    const name = newFolderName.trim().toLowerCase().replace(/[^a-z0-9-/]/g, "-");
    if (!name) return;
    setActiveFolder(name);
    setShowNewFolder(false);
    setNewFolderName("");
  }

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((m) => m.id)));
  }

  function navigateToFolder(folder: string | null) {
    setActiveFolder(folder);
    setSelected(new Set());
    setSearch("");
  }

  // ─── Folder picker view (no folder selected) ───
  if (!activeFolder) {
    return (
      <main className="bg-t-dark min-h-screen scanlines">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
          <div className="font-mono text-[0.65rem] text-t-surface/70 mb-6">
            <span className="text-t-accent">$</span>{" "}
            <span className="text-t-surface/70">ls ./media</span>
          </div>

          <div className="flex items-start justify-between mb-10">
            <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)]">
              media<span className="text-t-accent glow">.</span>
            </h1>
            <label className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer">
              <input ref={fileRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
              {uploading ? "uploading..." : "upload"}
            </label>
          </div>

          {/* Search across all */}
          <div className="mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search all files..."
              className="w-full max-w-md bg-t-surface/5 border border-t-surface/30 px-4 py-3 text-t-surface placeholder:text-t-surface/45 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
          </div>

          {/* If searching, show results */}
          {search ? (
            <div>
              <p className="font-mono text-[0.7rem] text-t-surface/70 mb-4">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
              </p>
              <FileGrid
                items={filtered}
                selected={selected}
                copied={copied}
                optimizing={optimizing}
                showFolder
                onToggleSelect={toggleSelect}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onOptimize={handleOptimize}
              />
            </div>
          ) : (
            /* Folder grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {folders.map((f) => (
                <button
                  key={f.name}
                  onClick={() => navigateToFolder(f.name)}
                  className="border border-t-surface/30 p-6 hover:border-t-accent/40 hover:bg-t-accent/5 transition-all cursor-pointer text-left group"
                >
                  <div className="font-mono text-2xl text-t-surface/45 group-hover:text-t-accent/40 mb-3 transition-colors">
                    &#x1F4C1;
                  </div>
                  <p className="font-mono text-[0.8rem] text-t-surface group-hover:text-t-accent transition-colors truncate">
                    {f.name}
                  </p>
                  <p className="font-mono text-[0.65rem] text-t-surface/45 mt-1">
                    {f.count} file{f.count !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}

              {/* New folder card */}
              {showNewFolder ? (
                <div className="border border-t-accent/30 p-6 bg-t-accent/5">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
                    }}
                    placeholder="folder-name"
                    autoFocus
                    className="w-full bg-t-surface/5 border border-t-surface/30 px-3 py-2 text-t-surface placeholder:text-t-surface/45 font-mono text-sm focus:border-t-accent focus:outline-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFolder}
                      className="font-mono text-[0.7rem] bg-t-accent text-t-surface px-4 py-1.5 hover:bg-t-surface hover:text-t-dark transition-colors cursor-pointer"
                    >
                      create
                    </button>
                    <button
                      onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                      className="font-mono text-[0.7rem] border border-t-surface/30 text-t-surface/70 px-4 py-1.5 hover:border-t-surface/40 hover:text-t-surface transition-colors cursor-pointer"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="border border-dashed border-t-surface/30 p-6 hover:border-t-accent/40 transition-all cursor-pointer text-left group flex flex-col items-center justify-center"
                >
                  <div className="font-mono text-2xl text-t-surface/45 group-hover:text-t-accent/40 mb-2 transition-colors">
                    +
                  </div>
                  <p className="font-mono text-[0.75rem] text-t-surface/45 group-hover:text-t-accent transition-colors">
                    new folder
                  </p>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ─── Folder contents view ───
  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 font-mono text-sm">
          <button
            onClick={() => navigateToFolder(null)}
            className="text-t-surface/70 hover:text-t-accent transition-colors cursor-pointer"
          >
            media
          </button>
          <span className="text-t-surface/45">/</span>
          <span className="text-t-accent font-semibold">{activeFolder}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(1.5rem,4vw,2.5rem)]">
            {activeFolder}<span className="text-t-accent glow">.</span>
          </h1>
          <label className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer">
            <input ref={fileRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            {uploading ? "uploading..." : "upload"}
          </label>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 border border-t-surface/30 p-3">
          {/* Mobile folder select */}
          <select
            value={activeFolder ?? ""}
            onChange={(e) => navigateToFolder(e.target.value || null)}
            className="lg:hidden bg-t-surface/5 border border-t-surface/30 px-3 py-2 text-t-surface font-mono text-[0.75rem] focus:border-t-accent focus:outline-none cursor-pointer"
          >
            <option value="">all folders</option>
            {folders.map((f) => (
              <option key={f.name} value={f.name}>/{f.name} ({f.count})</option>
            ))}
          </select>

          {filtered.length > 0 && (
            <button
              onClick={selectAll}
              className="font-mono text-[0.72rem] lowercase border border-t-surface/30 text-t-surface/70 px-4 py-2 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
            >
              {selected.size === filtered.length ? "deselect all" : "select all"}
            </button>
          )}

          {selected.size > 0 && (
            <>
              <span className="font-mono text-[0.72rem] text-t-accent font-semibold">
                {selected.size} selected
              </span>

              {/* Move dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMovingTo(movingTo ? null : "")}
                  className="font-mono text-[0.72rem] lowercase border border-t-surface/30 text-t-surface/70 px-4 py-2 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                >
                  move to...
                </button>
                {movingTo !== null && (
                  <div className="absolute top-full left-0 mt-1 z-20 border border-t-surface/30 bg-t-dark min-w-[200px] shadow-lg">
                    {folders
                      .filter((f) => f.name !== activeFolder)
                      .map((f) => (
                        <button
                          key={f.name}
                          onClick={() => handleMove(f.name)}
                          className="w-full text-left font-mono text-[0.75rem] text-t-surface/70 hover:text-t-accent hover:bg-t-surface/5 px-4 py-2.5 transition-colors cursor-pointer"
                        >
                          /{f.name}
                        </button>
                      ))}
                    <div className="border-t border-t-surface/30 px-4 py-2.5">
                      <input
                        type="text"
                        placeholder="new folder..."
                        className="w-full bg-transparent text-t-surface font-mono text-[0.75rem] placeholder:text-t-surface/45 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim().toLowerCase().replace(/[^a-z0-9-/]/g, "-");
                            if (val) handleMove(val);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkDelete}
                className="font-mono text-[0.72rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-4 py-2 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
              >
                delete
              </button>
            </>
          )}

          {/* Optimize all */}
          {unoptimizedCount > 0 && (
            <button
              onClick={handleOptimizeAll}
              disabled={optimizingAll}
              className="font-mono text-[0.72rem] lowercase border border-amber-500/30 text-amber-400/70 px-4 py-2 hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              {optimizingAll ? "optimizing..." : `optimize all (${unoptimizedCount})`}
            </button>
          )}

          <span className="font-mono text-[0.7rem] text-t-surface/45 ml-auto">
            {filtered.length} file{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Drop zone + grid */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`min-h-[300px] transition-colors ${
            dragging ? "border-2 border-dashed border-t-accent/50 bg-t-accent/5" : ""
          }`}
        >
          {dragging && (
            <div className="flex items-center justify-center h-40">
              <p className="font-mono text-sm text-t-accent">
                drop files to upload to /{currentFolder}
              </p>
            </div>
          )}

          {!dragging && filtered.length === 0 ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center h-60 border border-dashed border-t-surface/30 cursor-pointer hover:border-t-accent/30 transition-colors"
            >
              <p className="font-mono text-sm text-t-surface/70 mb-2">
                no files in /{activeFolder}
              </p>
              <p className="font-mono text-[0.7rem] text-t-surface/45">
                drag & drop or click to upload
              </p>
            </div>
          ) : (
            !dragging && (
              <FileGrid
                items={filtered}
                selected={selected}
                copied={copied}
                optimizing={optimizing}
                showFolder={false}
                onToggleSelect={toggleSelect}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onOptimize={handleOptimize}
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Reusable file grid ───
function FileGrid({
  items,
  selected,
  copied,
  optimizing,
  showFolder,
  onToggleSelect,
  onCopy,
  onDelete,
  onOptimize,
}: {
  items: Media[];
  selected: Set<string>;
  copied: string | null;
  optimizing: Set<string>;
  showFolder: boolean;
  onToggleSelect: (id: string) => void;
  onCopy: (url: string, id: string) => void;
  onDelete: (id: string, filename: string) => void;
  onOptimize: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onToggleSelect(item.id)}
          className={`border cursor-pointer group transition-colors ${
            selected.has(item.id)
              ? "border-t-accent bg-t-accent/5"
              : "border-t-surface/30 hover:border-t-surface/30"
          }`}
        >
          {/* Thumbnail */}
          <div className="relative h-36 bg-t-surface/5 flex items-center justify-center overflow-hidden">
            {selected.has(item.id) && (
              <div className="absolute top-2 left-2 z-10 w-5 h-5 border border-t-accent bg-t-accent flex items-center justify-center">
                <span className="text-t-dark text-[0.55rem] font-bold">✓</span>
              </div>
            )}
            {isImage(item.mime_type) ? (
              <img
                src={item.url}
                alt={item.alt || item.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-lg text-t-surface/45">■</span>
                <span className="font-mono text-[0.65rem] text-t-surface/45 uppercase">
                  {item.mime_type.split("/")[1]}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 border-t border-t-surface/30">
            {/* Filename + optimization status on same row */}
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[0.7rem] text-t-surface truncate flex-1">
                {item.filename}
              </p>
              {isImage(item.mime_type) && (
                isOptimized(item.mime_type) ? (
                  <span className="shrink-0 font-mono text-[0.55rem] px-1.5 py-0.5 bg-green-500/15 border border-green-500/25 text-green-400">
                    webp
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[0.55rem] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400">
                    {item.mime_type.split("/")[1]}
                  </span>
                )
              )}
            </div>

            <p className="font-mono text-[0.6rem] text-t-surface/45 mb-2">
              {formatSize(item.size)}
              {showFolder && <span> · /{item.folder}</span>}
            </p>

            {/* Action buttons — always visible */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onCopy(item.url, item.id); }}
                className="font-mono text-[0.62rem] lowercase border border-t-surface/30 text-t-surface/70 px-2.5 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
              >
                {copied === item.id ? "copied!" : "copy url"}
              </button>
              {canOptimize(item.mime_type) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOptimize(item.id); }}
                  disabled={optimizing.has(item.id)}
                  className="font-mono text-[0.62rem] lowercase border border-amber-500/25 text-amber-400/70 px-2.5 py-1 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {optimizing.has(item.id) ? "..." : "optimize"}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.filename); }}
                className="font-mono text-[0.62rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-2.5 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
