"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  unsubscribed: boolean;
}

interface Group {
  id: string;
  name: string;
  member_count: number;
}

export default function NewsletterAdmin() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add contact form
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [saving, setSaving] = useState(false);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, string[]>>({}); // contactId -> groupIds
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  // Bulk action dropdown
  const [bulkAction, setBulkAction] = useState("");

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contacts");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } catch {
      setError("Failed to load contacts.");
    }
    setLoading(false);
  }

  async function loadGroups() {
    try {
      const res = await fetch("/api/admin/contacts/groups");
      if (!res.ok) return;
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch { /* ignore */ }
  }

  async function loadMemberships() {
    try {
      const res = await fetch("/api/admin/contacts/groups/members");
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string[]> = {};
      for (const m of data.members ?? []) {
        if (!map[m.contact_id]) map[m.contact_id] = [];
        map[m.contact_id].push(m.group_id);
      }
      setMemberMap(map);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    Promise.all([loadContacts(), loadGroups(), loadMemberships()]);
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!addEmail) return;
    setAdding(true);

    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail,
          firstName: addFirst || undefined,
          lastName: addLast || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add");
      }
      setAddEmail("");
      setAddFirst("");
      setAddLast("");
      setShowAdd(false);
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact.");
    }
    setAdding(false);
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove "${email}" from the list?`)) return;
    await fetch(`/api/admin/contacts?id=${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setEditFirst(contact.first_name ?? "");
    setEditLast(contact.last_name ?? "");
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          firstName: editFirst || null,
          lastName: editLast || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, first_name: editFirst || null, last_name: editLast || null }
            : c,
        ),
      );
      setEditingId(null);
    } catch {
      setError("Failed to update contact.");
    }
    setSaving(false);
  }

  // Multi-select handlers
  function toggleSelect(contactId: string, idx: number, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedIdx !== null) {
        const start = Math.min(lastClickedIdx, idx);
        const end = Math.max(lastClickedIdx, idx);
        for (let i = start; i <= end; i++) {
          next.add(filtered[i].id);
        }
      } else {
        if (next.has(contactId)) next.delete(contactId);
        else next.add(contactId);
      }
      return next;
    });
    setLastClickedIdx(idx);
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  // Group management
  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await fetch("/api/admin/contacts/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    setNewGroupName("");
    await loadGroups();
  }

  async function renameGroup() {
    if (!editingGroupId || !editGroupName.trim()) return;
    await fetch("/api/admin/contacts/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingGroupId, name: editGroupName.trim() }),
    });
    setEditingGroupId(null);
    await loadGroups();
  }

  async function deleteGroup(id: string, name: string) {
    if (!confirm(`Delete group "${name}"?`)) return;
    await fetch(`/api/admin/contacts/groups?id=${id}`, { method: "DELETE" });
    if (filterGroup === id) setFilterGroup(null);
    await Promise.all([loadGroups(), loadMemberships()]);
  }

  async function bulkAddToGroup(groupId: string) {
    const contactIds = Array.from(selected);
    await fetch("/api/admin/contacts/groups/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, contactIds }),
    });
    await Promise.all([loadMemberships(), loadGroups()]);
  }

  async function bulkRemoveFromGroup(groupId: string) {
    const contactIds = Array.from(selected);
    await fetch("/api/admin/contacts/groups/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, contactIds }),
    });
    await Promise.all([loadMemberships(), loadGroups()]);
  }

  async function bulkRemoveContacts() {
    if (!confirm(`Remove ${selected.size} contacts?`)) return;
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/admin/contacts?id=${id}`, { method: "DELETE" }),
      ),
    );
    setContacts((prev) => prev.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === "remove") {
      await bulkRemoveContacts();
    } else if (bulkAction.startsWith("add:")) {
      await bulkAddToGroup(bulkAction.slice(4));
    } else if (bulkAction.startsWith("rm:")) {
      await bulkRemoveFromGroup(bulkAction.slice(3));
    }
    setBulkAction("");
    setSelected(new Set());
  }

  const filtered = contacts.filter((c) => {
    if (filterGroup) {
      const cGroups = memberMap[c.id] ?? [];
      if (!cGroups.includes(filterGroup)) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.first_name?.toLowerCase().includes(q) ?? false) ||
      (c.last_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const subscribed = contacts.filter((c) => !c.unsubscribed).length;

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            cat /var/mail/subscribers
          </span>
        </div>

        <div className="flex items-start justify-between mb-10">
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)]">
            newsletter<span className="text-t-accent glow">.</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGroups(!showGroups)}
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] border border-t-surface/30 text-t-surface/70 px-8 py-3 hover:border-t-accent hover:text-t-accent transition-all duration-200"
            >
              {showGroups ? "hide groups" : "groups"}
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              {showAdd ? "cancel" : "add contact"}
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt mt-1"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="flex gap-6 mb-8">
            <div className="border border-t-surface/20 px-5 py-3">
              <p className="font-mono text-[0.6rem] text-t-surface/55 mb-1">
                total
              </p>
              <p className="font-mono text-xl font-bold text-t-surface">
                {contacts.length}
              </p>
            </div>
            <div className="border border-t-surface/20 px-5 py-3">
              <p className="font-mono text-[0.6rem] text-t-surface/55 mb-1">
                subscribed
              </p>
              <p className="font-mono text-xl font-bold text-t-accent">
                {subscribed}
              </p>
            </div>
            <div className="border border-t-surface/20 px-5 py-3">
              <p className="font-mono text-[0.6rem] text-t-surface/55 mb-1">
                unsubscribed
              </p>
              <p className="font-mono text-xl font-bold text-t-surface/55">
                {contacts.length - subscribed}
              </p>
            </div>
            <div className="border border-t-surface/20 px-5 py-3">
              <p className="font-mono text-[0.6rem] text-t-surface/55 mb-1">
                groups
              </p>
              <p className="font-mono text-xl font-bold text-t-surface/55">
                {groups.length}
              </p>
            </div>
          </div>
        )}

        {/* Group management panel */}
        {showGroups && (
          <div className="border border-t-surface/20 p-5 mb-6">
            <p className="font-mono text-[0.6rem] text-t-surface/55 mb-3">
              <span className="text-t-accent">$</span> groupmod --list
            </p>

            {groups.length === 0 ? (
              <p className="font-mono text-sm text-t-surface/45 mb-4">
                no groups yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 border border-t-surface/10 px-4 py-2"
                  >
                    {editingGroupId === g.id ? (
                      <>
                        <input
                          type="text"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renameGroup()}
                          className="bg-t-surface/5 border border-t-surface/15 px-2 py-1 text-t-surface font-mono text-sm focus:border-t-accent focus:outline-none flex-1"
                          autoFocus
                        />
                        <button
                          onClick={renameGroup}
                          className="font-mono text-[0.6rem] text-t-accent hover:text-t-surface transition-colors"
                        >
                          save
                        </button>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="font-mono text-[0.6rem] text-t-surface/50 hover:text-t-surface transition-colors"
                        >
                          cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setFilterGroup(filterGroup === g.id ? null : g.id);
                          }}
                          className={`font-mono text-sm flex-1 text-left transition-colors ${
                            filterGroup === g.id
                              ? "text-t-accent"
                              : "text-t-surface hover:text-t-accent"
                          }`}
                        >
                          {g.name}
                        </button>
                        <span className="font-mono text-[0.6rem] text-t-surface/40">
                          {g.member_count} contact{g.member_count !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => {
                            setEditingGroupId(g.id);
                            setEditGroupName(g.name);
                          }}
                          className="font-mono text-[0.6rem] text-t-surface/50 hover:text-t-accent transition-colors"
                        >
                          rename
                        </button>
                        <button
                          onClick={() => deleteGroup(g.id, g.name)}
                          className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors"
                        >
                          delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={createGroup} className="flex gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="new group name"
                className="bg-t-surface/5 border border-t-surface/15 px-3 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors flex-1"
              />
              <button
                type="submit"
                className="font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-6 py-2 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
              >
                create
              </button>
            </form>
          </div>
        )}

        {/* Add contact form */}
        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="border border-t-surface/20 p-5 mb-6"
          >
            <p className="font-mono text-[0.6rem] text-t-surface/55 mb-3">
              <span className="text-t-accent">$</span> useradd --newsletter
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="email"
                className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface placeholder:text-t-surface/55 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors flex-1 min-w-[200px]"
              />
              <input
                type="text"
                value={addFirst}
                onChange={(e) => setAddFirst(e.target.value)}
                placeholder="first name"
                className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface placeholder:text-t-surface/55 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors w-36"
              />
              <input
                type="text"
                value={addLast}
                onChange={(e) => setAddLast(e.target.value)}
                placeholder="last name"
                className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface placeholder:text-t-surface/55 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors w-36"
              />
              <button
                type="submit"
                disabled={adding}
                className="font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-6 py-2 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
              >
                {adding ? "adding..." : "add"}
              </button>
            </div>
          </form>
        )}

        {/* Search + filter + bulk actions bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search contacts..."
            className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface placeholder:text-t-surface/55 font-mono text-[0.75rem] focus:border-t-accent focus:outline-none transition-colors w-64"
          />

          {/* Group filter */}
          {groups.length > 0 && (
            <select
              value={filterGroup ?? ""}
              onChange={(e) => setFilterGroup(e.target.value || null)}
              className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface font-mono text-[0.75rem] focus:border-t-accent focus:outline-none transition-colors appearance-none"
            >
              <option value="" className="bg-t-dark">all groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-t-dark">
                  {g.name}
                </option>
              ))}
            </select>
          )}

          <span className="font-mono text-[0.6rem] text-t-surface/45">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
            {selected.size > 0 && ` · ${selected.size} selected`}
          </span>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bg-t-surface/8 border border-t-surface/25 px-3 py-2 text-t-surface font-mono text-[0.68rem] focus:border-t-accent focus:outline-none transition-colors appearance-none"
              >
                <option value="" className="bg-t-dark">bulk actions...</option>
                {groups.map((g) => (
                  <option key={`add-${g.id}`} value={`add:${g.id}`} className="bg-t-dark">
                    add to {g.name}
                  </option>
                ))}
                {groups.map((g) => (
                  <option key={`rm-${g.id}`} value={`rm:${g.id}`} className="bg-t-dark">
                    remove from {g.name}
                  </option>
                ))}
                <option value="remove" className="bg-t-dark">remove contacts</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="font-mono text-[0.68rem] lowercase bg-t-accent text-t-surface px-4 py-2 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
              >
                apply
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="font-mono text-[0.6rem] text-t-surface/50 hover:text-t-surface transition-colors"
              >
                clear
              </button>
            </div>
          )}
        </div>

        {/* Contact list */}
        {loading ? (
          <p className="font-mono text-sm text-t-surface/55">loading...</p>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-sm text-t-surface/55">
            {contacts.length === 0
              ? "no subscribers yet."
              : "no contacts match your search."}
          </p>
        ) : (
          <div className="border border-t-surface/20">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-2 border-b border-t-surface/10 bg-t-surface/8 items-center">
              <span className="col-span-1">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={selectAll}
                  className="accent-t-accent cursor-pointer"
                />
              </span>
              <span className="col-span-3 font-mono text-[0.6rem] text-t-surface/65 uppercase tracking-wider">
                email
              </span>
              <span className="col-span-3 font-mono text-[0.6rem] text-t-surface/65 uppercase tracking-wider">
                name
              </span>
              <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/65 uppercase tracking-wider">
                status
              </span>
              <span className="col-span-1 font-mono text-[0.6rem] text-t-surface/65 uppercase tracking-wider">
                joined
              </span>
              <span className="col-span-2" />
            </div>

            {/* Rows */}
            {filtered.map((contact, idx) => (
              <div
                key={contact.id}
                className={`grid grid-cols-12 gap-4 px-5 py-3 border-b border-t-surface/10 last:border-0 transition-colors items-center ${
                  selected.has(contact.id) ? "bg-t-accent/5" : "hover:bg-t-surface/5"
                }`}
              >
                <span className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selected.has(contact.id)}
                    onChange={(e) =>
                      toggleSelect(contact.id, idx, (e.nativeEvent as MouseEvent).shiftKey)
                    }
                    className="accent-t-accent cursor-pointer"
                  />
                </span>
                <span className="col-span-3 font-mono text-[0.75rem] text-t-surface truncate">
                  {contact.email}
                </span>

                {/* Name: inline editing */}
                <span className="col-span-3">
                  {editingId === contact.id ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={editFirst}
                        onChange={(e) => setEditFirst(e.target.value)}
                        placeholder="first"
                        className="bg-t-surface/5 border border-t-surface/15 px-2 py-0.5 text-t-surface font-mono text-[0.7rem] focus:border-t-accent focus:outline-none w-20"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editLast}
                        onChange={(e) => setEditLast(e.target.value)}
                        placeholder="last"
                        className="bg-t-surface/5 border border-t-surface/15 px-2 py-0.5 text-t-surface font-mono text-[0.7rem] focus:border-t-accent focus:outline-none w-20"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="font-mono text-[0.6rem] text-t-accent hover:text-t-surface transition-colors"
                      >
                        {saving ? "..." : "save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="font-mono text-[0.6rem] text-t-surface/40 hover:text-t-surface transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(contact)}
                      className="font-mono text-[0.75rem] text-t-surface/70 truncate hover:text-t-accent transition-colors text-left"
                      title="Click to edit"
                    >
                      {[contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </button>
                  )}
                </span>

                <span className="col-span-2">
                  <span
                    className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${
                      contact.unsubscribed
                        ? "border-t-surface/20 text-t-surface/55"
                        : "border-t-accent/40 text-t-accent"
                    }`}
                  >
                    {contact.unsubscribed ? "unsubscribed" : "subscribed"}
                  </span>
                </span>
                <span className="col-span-1 font-mono text-[0.65rem] text-t-surface/55">
                  {new Date(contact.created_at).toLocaleDateString()}
                </span>
                <span className="col-span-2 flex items-center justify-end gap-2">
                  {/* Group badges */}
                  {(memberMap[contact.id] ?? []).length > 0 && (
                    <span className="font-mono text-[0.5rem] text-t-highlight/70 truncate max-w-[80px]">
                      {(memberMap[contact.id] ?? [])
                        .map((gid) => groups.find((g) => g.id === gid)?.name)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(contact.id, contact.email)}
                    className="font-mono text-[0.6rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
                  >
                    remove
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
