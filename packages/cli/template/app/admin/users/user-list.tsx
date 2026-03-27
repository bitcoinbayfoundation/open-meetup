"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | Date | null;
  image: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function UserList({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    });
    if (error) {
      setError(error.message ?? "Failed to load users.");
    } else if (data) {
      setUsers(data.users as User[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId);
    await authClient.admin.setRole({ userId, role: role as "admin" | "user" });
    await loadUsers();
    setActionLoading(null);
  }

  async function handleBan(userId: string) {
    const reason = prompt("Ban reason (optional):");
    if (reason === null) return;
    setActionLoading(userId);
    await authClient.admin.banUser({
      userId,
      banReason: reason || undefined,
    });
    await loadUsers();
    setActionLoading(null);
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId);
    await authClient.admin.unbanUser({ userId });
    await loadUsers();
    setActionLoading(null);
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`))
      return;
    setActionLoading(userId);
    await authClient.admin.removeUser({ userId });
    await loadUsers();
    setActionLoading(null);
  }

  async function handleSetPassword(userId: string) {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setActionLoading(userId);
    await authClient.admin.setUserPassword({
      userId,
      newPassword,
    });
    setShowPasswordModal(null);
    setNewPassword("");
    setActionLoading(null);
  }

  async function handleRevokeSessions(userId: string) {
    if (!confirm("Revoke all sessions for this user? They will be logged out."))
      return;
    setActionLoading(userId);
    await authClient.admin.revokeUserSessions({ userId });
    setActionLoading(null);
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">cat /etc/passwd</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          users<span className="text-t-accent glow">.</span>
        </h1>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="font-mono text-sm text-t-surface/55">loading...</p>
        ) : users.length === 0 ? (
          <p className="font-mono text-sm text-t-surface/55">
            no users found.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div
                key={user.id}
                className={`border p-5 transition-colors ${
                  user.banned
                    ? "border-t-accent-alt/30 bg-t-accent-alt/5"
                    : "border-t-surface/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h2 className="font-mono font-bold text-t-surface lowercase">
                        {user.name}
                      </h2>

                      {/* Role badge */}
                      <span
                        className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${
                          user.role === "admin"
                            ? "border-t-accent/40 text-t-accent"
                            : "border-t-surface/30 text-t-surface/55"
                        }`}
                      >
                        {user.role}
                      </span>

                      {/* Email verified badge */}
                      <span
                        className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${
                          user.emailVerified
                            ? "border-green-500/40 text-green-500"
                            : "border-t-accent-alt/30 text-t-accent-alt/60"
                        }`}
                      >
                        {user.emailVerified ? "verified" : "unverified"}
                      </span>

                      {/* Banned badge */}
                      {user.banned && (
                        <span className="font-mono text-[0.6rem] lowercase px-2 py-0.5 border border-t-accent-alt/40 text-t-accent-alt">
                          banned
                        </span>
                      )}

                      {/* You badge */}
                      {user.id === currentUserId && (
                        <span className="font-mono text-[0.55rem] text-t-surface/45">
                          (you)
                        </span>
                      )}
                    </div>

                    <p className="font-mono text-[0.7rem] text-t-surface/65 mb-1">
                      {user.email}
                    </p>
                    <p className="font-mono text-[0.6rem] text-t-surface/45">
                      joined{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {user.updatedAt !== user.createdAt && (
                        <span>
                          {" "}· updated{" "}
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                      {user.banned && user.banReason && (
                        <span className="text-t-accent-alt/60">
                          {" "}
                          · reason: {user.banReason}
                        </span>
                      )}
                      {user.banned && user.banExpires && (
                        <span className="text-t-accent-alt/60">
                          {" "}
                          · expires{" "}
                          {new Date(user.banExpires).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[0.55rem] text-t-surface/35 mt-0.5">
                      id: {user.id}
                    </p>
                  </div>

                  {/* Actions */}
                  {user.id !== currentUserId && (
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      {actionLoading === user.id ? (
                        <span className="font-mono text-[0.65rem] text-t-surface/55">
                          ...
                        </span>
                      ) : (
                        <>
                          {/* Role toggle */}
                          <button
                            onClick={() =>
                              handleSetRole(
                                user.id,
                                user.role === "admin" ? "user" : "admin",
                              )
                            }
                            className="font-mono text-[0.65rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                          >
                            {user.role === "admin"
                              ? "demote"
                              : "make admin"}
                          </button>

                          {/* Ban/Unban */}
                          {user.banned ? (
                            <button
                              onClick={() => handleUnban(user.id)}
                              className="font-mono text-[0.65rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                            >
                              unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBan(user.id)}
                              className="font-mono text-[0.65rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
                            >
                              ban
                            </button>
                          )}

                          {/* Reset password */}
                          <button
                            onClick={() => setShowPasswordModal(user.id)}
                            className="font-mono text-[0.65rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                          >
                            password
                          </button>

                          {/* Revoke sessions */}
                          <button
                            onClick={() => handleRevokeSessions(user.id)}
                            className="font-mono text-[0.65rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                          >
                            logout
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleRemove(user.id, user.name)}
                            className="font-mono text-[0.65rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
                          >
                            delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Password reset modal */}
                {showPasswordModal === user.id && (
                  <div className="mt-4 pt-4 border-t border-t-surface/20 flex items-center gap-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="new password (min 8 chars)"
                      className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface placeholder:text-t-surface/55 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors flex-1 max-w-xs"
                    />
                    <button
                      onClick={() => handleSetPassword(user.id)}
                      className="font-mono text-[0.68rem] lowercase text-t-accent hover:text-t-surface transition-colors"
                    >
                      set
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(null);
                        setNewPassword("");
                      }}
                      className="font-mono text-[0.68rem] lowercase text-t-surface/55 hover:text-t-surface transition-colors cursor-pointer"
                    >
                      cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
