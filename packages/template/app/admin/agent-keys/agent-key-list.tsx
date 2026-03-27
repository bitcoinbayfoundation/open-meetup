"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getKeyUserMap, setKeyUser } from "./actions";

interface ApiKey {
  id: string;
  name: string | null;
  prefix: string | null;
  enabled: boolean;
  expiresAt: Date | null;
  lastRequest: Date | null;
  createdAt: Date;
  requestCount: number | null;
}

interface SimpleUser {
  id: string;
  name: string;
}

export default function AgentKeyList() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // User assignment state
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [keyUserMap, setKeyUserMap] = useState<
    Record<string, { userId: string; userName: string }>
  >({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  async function fetchKeys() {
    const { data } = await authClient.apiKey.list();
    if (data) {
      setKeys(data.apiKeys as ApiKey[]);
    }
    setLoading(false);
  }

  async function fetchUsers() {
    const { data } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "name", sortDirection: "asc" },
    });
    if (data) {
      setUsers(
        (data.users as { id: string; name: string }[]).map((u) => ({
          id: u.id,
          name: u.name,
        })),
      );
    }
  }

  async function fetchKeyUserMap() {
    const map = await getKeyUserMap();
    setKeyUserMap(map);
  }

  useEffect(() => {
    fetchKeys();
    fetchUsers();
    fetchKeyUserMap();
  }, []);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const { data, error } = await authClient.apiKey.create({
      name: newKeyName.trim(),
      prefix: "bb",
    });
    if (data?.key) {
      setRevealedKey(data.key);
      setNewKeyName("");
      fetchKeys();
    } else {
      console.error("Failed to create key:", error);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Revoke this agent key? This cannot be undone.")) return;
    setDeletingId(id);
    await authClient.apiKey.delete({ keyId: id });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setKeyUserMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDeletingId(null);
  }

  function startRename(key: ApiKey) {
    setRenamingId(key.id);
    setRenameValue(key.name || "");
  }

  async function handleRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    await authClient.apiKey.update({ keyId: id, name: trimmed });
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, name: trimmed } : k)),
    );
    setRenamingId(null);
    setRenameValue("");
  }

  async function handleAssignUser(apiKeyId: string, userId: string) {
    setAssigningId(apiKeyId);
    if (!userId) {
      await setKeyUser(apiKeyId, null);
      setKeyUserMap((prev) => {
        const next = { ...prev };
        delete next[apiKeyId];
        return next;
      });
    } else {
      const { userName } = await setKeyUser(apiKeyId, userId);
      setKeyUserMap((prev) => ({
        ...prev,
        [apiKeyId]: { userId, userName: userName ?? "" },
      }));
    }
    setAssigningId(null);
  }

  function handleCopy() {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span> ./agent-keys
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,4rem)] mb-12">
          agent keys<span className="text-t-accent glow">.</span>
        </h1>

        {/* Revealed key modal */}
        {revealedKey && (
          <div className="border border-t-accent/40 bg-t-accent/5 p-6 mb-8">
            <p className="font-mono text-[0.7rem] text-t-accent mb-3">
              copy this key now — it won&apos;t be shown again
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-t-dark border border-t-surface/25 px-4 py-3 font-mono text-sm text-t-surface break-all select-all">
                {revealedKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 font-mono text-[0.68rem] lowercase bg-t-accent text-t-surface px-4 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              className="mt-3 font-mono text-[0.65rem] text-t-surface/55 hover:text-t-surface transition-colors cursor-pointer"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Create new key */}
        <div className="border border-t-surface/20 p-6 mb-8">
          <p className="font-mono text-[0.6rem] text-t-surface/55 mb-4">
            <span className="text-t-accent">$</span> create new key
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="key name (e.g. claude-agent)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 bg-t-surface/8 border border-t-surface/25 px-4 py-3 text-t-surface placeholder:text-t-surface/45 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="shrink-0 font-mono text-[0.68rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
            >
              {creating ? "..." : "generate"}
            </button>
          </div>
        </div>

        {/* Key list */}
        {loading ? (
          <p className="font-mono text-sm text-t-surface/55">loading...</p>
        ) : keys.length === 0 ? (
          <p className="font-mono text-sm text-t-surface/55">
            no agent keys yet. create one above.
          </p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="border border-t-surface/20 p-5 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {renamingId === k.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(k.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            autoFocus
                            className="bg-t-surface/8 border border-t-accent/40 px-2 py-1 text-t-surface font-mono text-sm focus:outline-none w-48"
                          />
                          <button
                            onClick={() => handleRename(k.id)}
                            className="font-mono text-[0.6rem] text-t-accent hover:text-t-surface transition-colors"
                          >
                            save
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="font-mono text-[0.6rem] text-t-surface/55 hover:text-t-surface transition-colors"
                          >
                            cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startRename(k)}
                          className="font-mono text-sm text-t-surface font-semibold truncate hover:text-t-accent transition-colors text-left"
                          title="click to rename"
                        >
                          {k.name || "unnamed"}
                        </button>
                      )}
                      <span
                        className={`shrink-0 font-mono text-[0.6rem] px-2 py-0.5 border ${
                          k.enabled
                            ? "border-green-500/30 text-green-400"
                            : "border-t-surface/30 text-t-surface/55"
                        }`}
                      >
                        {k.enabled ? "active" : "disabled"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.65rem] text-t-surface/55">
                      {k.prefix && <span>prefix: {k.prefix}_•••</span>}
                      <span>created {formatDate(k.createdAt)}</span>
                      {k.lastRequest && (
                        <span>last used {formatDate(k.lastRequest)}</span>
                      )}
                      {k.requestCount != null && (
                        <span>{k.requestCount} requests</span>
                      )}
                      {k.expiresAt && (
                        <span>expires {formatDate(k.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    disabled={deletingId === k.id}
                    className="shrink-0 font-mono text-[0.65rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === k.id ? "..." : "revoke"}
                  </button>
                </div>

                {/* User assignment */}
                <div className="flex items-center gap-3 border-t border-t-surface/10 pt-3">
                  <span className="font-mono text-[0.6rem] text-t-surface/55 shrink-0">
                    attributed to:
                  </span>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === k.id ? null : k.id,
                        )
                      }
                      disabled={assigningId === k.id}
                      className="font-mono text-[0.72rem] border border-t-surface/25 text-t-surface/70 px-4 py-2 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer disabled:opacity-50 min-w-[180px] text-left flex items-center justify-between gap-3"
                    >
                      <span className="truncate">
                        {assigningId === k.id
                          ? "saving..."
                          : keyUserMap[k.id]?.userName ?? "no user (anonymous)"}
                      </span>
                      <span className="text-t-surface/45 text-[0.5rem]">
                        ▼
                      </span>
                    </button>
                    {dropdownOpen === k.id && (
                      <div className="absolute top-full left-0 mt-1 z-20 border border-t-surface/25 bg-t-dark min-w-[220px] shadow-lg">
                        <button
                          onClick={() => {
                            handleAssignUser(k.id, "");
                            setDropdownOpen(null);
                          }}
                          className={`w-full text-left font-mono text-[0.72rem] px-4 py-2.5 transition-colors cursor-pointer ${
                            !keyUserMap[k.id]
                              ? "text-t-accent bg-t-accent/10"
                              : "text-t-surface/65 hover:text-t-accent hover:bg-t-surface/5"
                          }`}
                        >
                          no user (anonymous)
                        </button>
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              handleAssignUser(k.id, u.id);
                              setDropdownOpen(null);
                            }}
                            className={`w-full text-left font-mono text-[0.72rem] px-4 py-2.5 transition-colors cursor-pointer ${
                              keyUserMap[k.id]?.userId === u.id
                                ? "text-t-accent bg-t-accent/10"
                                : "text-t-surface/65 hover:text-t-accent hover:bg-t-surface/5"
                            }`}
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
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
