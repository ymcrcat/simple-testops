"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Feature { id: number; name: string; sort_order: number; }
interface Story { id: number; feature_id: number; name: string; sort_order: number; priority: string | null; }
export interface TestCase { id: number; story_id: number; name: string; status: string; class_name: string; sort_order: number; description: string | null; key: string | null; }

type DragItem =
  | { type: "feature"; id: number; index: number }
  | { type: "story"; id: number; featureId: number; index: number }
  | { type: "case"; id: number; storyId: number; index: number };

interface DropTarget {
  type: "feature" | "story" | "case";
  index: number;
  position: "before" | "after";
  parentId?: number;
}

const gripStyle: React.CSSProperties = {
  cursor: "grab",
  padding: "4px 2px",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  opacity: 0.4,
  transition: "opacity 0.15s",
  flexShrink: 0,
};

function GripIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onConfirm, onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-active)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
          animation: "fadeInScale 0.15s ease-out",
        }}
      >
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ fontSize: 13, padding: "7px 16px" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              background: "var(--color-failed)",
              color: "#fff",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ onClick, size = 14 }: { onClick: (e: React.MouseEvent) => void; size?: number }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className="delete-btn"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--text-muted)",
        padding: 4,
        display: "flex",
        alignItems: "center",
        borderRadius: "var(--radius-sm)",
        opacity: 0,
        transition: "opacity 0.15s, color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-failed)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </button>
  );
}

function DropIndicator({ show }: { show: boolean }) {
  return (
    <div style={{
      height: 2,
      background: show ? "var(--color-accent)" : "transparent",
      borderRadius: 1,
      margin: show ? "0 12px" : 0,
      transition: "background 0.1s",
    }} />
  );
}

function getDropPosition(e: React.DragEvent): "before" | "after" {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

function getInsertIndex(fromIndex: number, toIndex: number, position: "before" | "after"): number {
  const target = position === "after" ? toIndex + 1 : toIndex;
  if (fromIndex < target) return target - 1;
  return target;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  P0: { bg: "var(--color-failed-glow)", text: "var(--color-failed)" },
  P1: { bg: "var(--color-skipped-glow)", text: "var(--color-skipped)" },
  P2: { bg: "var(--bg-elevated)", text: "var(--text-muted)" },
};

function PriorityBadge({ story, onUpdate }: { story: Story; onUpdate: (priority: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const p = story.priority;
  const colors = p ? priorityColors[p] : null;

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex", marginLeft: 6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 4,
          border: !colors && hovered ? "1px dashed var(--text-muted)" : "1px solid transparent",
          cursor: "pointer",
          lineHeight: 1.2,
          background: colors ? colors.bg : hovered ? "var(--bg-elevated)" : "transparent",
          color: colors ? colors.text : "var(--text-muted)",
          opacity: colors ? 1 : hovered ? 1 : 0,
          transition: "all 0.15s",
          fontWeight: 600,
        }}
      >
        {p || "+"}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-active)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 50,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {(["P0", "P1", "P2", null] as (string | null)[]).map((opt) => {
            const c = opt ? priorityColors[opt] : null;
            return (
              <button
                key={opt ?? "none"}
                onClick={() => { onUpdate(opt); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: c ? c.text : "var(--text-muted)",
                  transition: "background 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                {opt || "None"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface TestCaseTreeProps {
  projectId: string;
  selectedCaseId?: number | null;
  onSelectCase?: (tc: TestCase) => void;
}

export default function TestCaseTree({ projectId, selectedCaseId, onSelectCase }: TestCaseTreeProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newStoryName, setNewStoryName] = useState<Record<number, string>>({});
  const [newCaseName, setNewCaseName] = useState<Record<number, string>>({});

  const [editing, setEditing] = useState<{ type: "feature" | "story" | "case"; id: number } | null>(null);
  const [editName, setEditName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const [pendingDelete, setPendingDelete] = useState<{ type: "feature" | "story" | "case"; id: number; name: string } | null>(null);

  const dragItem = useRef<DragItem | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  const loadFeatures = useCallback(() => {
    apiFetch<Feature[]>(`/features?project_id=${projectId}`).then(setFeatures);
  }, [projectId]);

  const reloadCases = useCallback(() => {
    apiFetch<TestCase[]>(`/testcases?project_id=${projectId}`).then(setCases);
  }, [projectId]);

  useEffect(() => {
    loadFeatures();
    reloadCases();
  }, [projectId, loadFeatures, reloadCases]);

  useEffect(() => {
    if (features.length === 0) { setStories([]); return; }
    Promise.all(features.map((f) => apiFetch<Story[]>(`/stories?feature_id=${f.id}`))).then((r) =>
      setStories(r.flat())
    );
  }, [features]);

  const reloadStories = () => {
    Promise.all(features.map((f) => apiFetch<Story[]>(`/stories?feature_id=${f.id}`))).then((r) =>
      setStories(r.flat())
    );
  };

  const createStory = async (featureId: number) => {
    const name = (newStoryName[featureId] || "").trim();
    if (!name) return;
    await apiFetch("/stories", {
      method: "POST",
      body: JSON.stringify({ feature_id: featureId, name }),
    });
    setNewStoryName((prev) => ({ ...prev, [featureId]: "" }));
    reloadStories();
  };

  const createCase = async (storyId: number) => {
    const name = (newCaseName[storyId] || "").trim();
    if (!name) return;
    await apiFetch("/testcases", {
      method: "POST",
      body: JSON.stringify({ story_id: storyId, name }),
    });
    setNewCaseName((prev) => ({ ...prev, [storyId]: "" }));
    reloadCases();
  };

  const updateStoryPriority = async (storyId: number, priority: string | null) => {
    await apiFetch(`/stories/${storyId}`, { method: "PUT", body: JSON.stringify({ priority }) });
    setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, priority } : s));
  };

  const requestDelete = (type: "feature" | "story" | "case", id: number, name: string) => {
    setPendingDelete({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    if (type === "feature") {
      await apiFetch(`/features/${id}`, { method: "DELETE" });
      setFeatures((prev) => prev.filter((f) => f.id !== id));
      setStories((prev) => prev.filter((s) => s.feature_id !== id));
    } else if (type === "story") {
      await apiFetch(`/stories/${id}`, { method: "DELETE" });
      setStories((prev) => prev.filter((s) => s.id !== id));
      setCases((prev) => prev.filter((c) => c.story_id !== id));
    } else {
      await apiFetch(`/testcases/${id}`, { method: "DELETE" });
      setCases((prev) => prev.filter((c) => c.id !== id));
    }
    setPendingDelete(null);
  };

  const startEditing = (type: "feature" | "story" | "case", id: number, name: string) => {
    setEditing({ type, id });
    setEditName(name);
    setTimeout(() => editRef.current?.select(), 0);
  };

  const commitRename = async () => {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) { setEditing(null); return; }
    const endpoint = editing.type === "feature" ? "features" : editing.type === "story" ? "stories" : "testcases";
    await apiFetch(`/${endpoint}/${editing.id}`, { method: "PUT", body: JSON.stringify({ name: trimmed }) });
    if (editing.type === "feature") {
      setFeatures((prev) => prev.map((f) => f.id === editing.id ? { ...f, name: trimmed } : f));
    } else if (editing.type === "story") {
      setStories((prev) => prev.map((s) => s.id === editing.id ? { ...s, name: trimmed } : s));
    } else {
      setCases((prev) => prev.map((c) => c.id === editing.id ? { ...c, name: trimmed } : c));
    }
    setEditing(null);
  };

  const cancelRename = () => setEditing(null);

  const persistOrder = async (type: "features" | "stories" | "testcases", items: { id: number }[]) => {
    await Promise.all(
      items.map((item, i) =>
        apiFetch(`/${type}/${item.id}`, { method: "PUT", body: JSON.stringify({ sort_order: i }) })
      )
    );
  };

  const onDragStart = (e: React.DragEvent, item: DragItem) => {
    dragItem.current = item;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  };

  const onDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    dragItem.current = null;
    setDrop(null);
  };

  const onFeatureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "feature") return;
    e.dataTransfer.dropEffect = "move";
    setDrop({ type: "feature", index, position: getDropPosition(e) });
  };

  const onFeatureDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "feature") return;
    const fromIndex = dragItem.current.index;
    const position = getDropPosition(e);
    const insertAt = getInsertIndex(fromIndex, toIndex, position);
    if (insertAt === fromIndex) { setDrop(null); return; }
    const reordered = reorder(features, fromIndex, insertAt);
    setFeatures(reordered);
    setDrop(null);
    await persistOrder("features", reordered);
  };

  const onStoryDragOver = (e: React.DragEvent, featureId: number, index: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "story" || dragItem.current.featureId !== featureId) return;
    e.dataTransfer.dropEffect = "move";
    setDrop({ type: "story", index, position: getDropPosition(e), parentId: featureId });
  };

  const onStoryDrop = async (e: React.DragEvent, featureId: number, toIndex: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "story" || dragItem.current.featureId !== featureId) return;
    const fromIndex = dragItem.current.index;
    const position = getDropPosition(e);
    const insertAt = getInsertIndex(fromIndex, toIndex, position);
    if (insertAt === fromIndex) { setDrop(null); return; }
    const featureStories = stories.filter((s) => s.feature_id === featureId);
    const otherStories = stories.filter((s) => s.feature_id !== featureId);
    const reordered = reorder(featureStories, fromIndex, insertAt);
    setStories([...otherStories, ...reordered]);
    setDrop(null);
    await persistOrder("stories", reordered);
  };

  const onCaseDragOver = (e: React.DragEvent, storyId: number, index: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "case" || dragItem.current.storyId !== storyId) return;
    e.dataTransfer.dropEffect = "move";
    setDrop({ type: "case", index, position: getDropPosition(e), parentId: storyId });
  };

  const onCaseDrop = async (e: React.DragEvent, storyId: number, toIndex: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "case" || dragItem.current.storyId !== storyId) return;
    const fromIndex = dragItem.current.index;
    const position = getDropPosition(e);
    const insertAt = getInsertIndex(fromIndex, toIndex, position);
    if (insertAt === fromIndex) { setDrop(null); return; }
    const storyCases = cases.filter((c) => c.story_id === storyId);
    const otherCases = cases.filter((c) => c.story_id !== storyId);
    const reordered = reorder(storyCases, fromIndex, insertAt);
    setCases([...otherCases, ...reordered]);
    setDrop(null);
    await persistOrder("testcases", reordered);
  };

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isDropAt = (type: string, index: number, pos: "before" | "after", parentId?: number) =>
    drop?.type === type && drop.index === index && drop.position === pos && drop.parentId === parentId;

  const deleteMessages: Record<string, { title: string; message: string }> = {
    feature: {
      title: "Delete Feature",
      message: `This will permanently delete "${pendingDelete?.name}" and all its stories and test cases.`,
    },
    story: {
      title: "Delete Story",
      message: `This will permanently delete "${pendingDelete?.name}" and all its test cases.`,
    },
    case: {
      title: "Delete Test Case",
      message: `This will permanently delete "${pendingDelete?.name}".`,
    },
  };

  if (features.length === 0) {
    return <div className="empty-state"><p>No features defined yet.</p></div>;
  }

  return (
    <div>
      {features.map((f, fi) => (
        <div
          key={f.id}
          className="animate-in"
          style={{ animationDelay: `${fi * 0.05}s` }}
          draggable
          onDragStart={(e) => onDragStart(e, { type: "feature", id: f.id, index: fi })}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onFeatureDragOver(e, fi)}
          onDrop={(e) => onFeatureDrop(e, fi)}
        >
          <DropIndicator show={isDropAt("feature", fi, "before")} />

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={gripStyle}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
            >
              <GripIcon />
            </div>
            <button
              onClick={() => toggle(`f-${f.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                padding: "10px 12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 14,
                borderRadius: "var(--radius-sm)",
                transition: "background 0.15s",
              }}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.2s", transform: expanded.has(`f-${f.id}`) ? "rotate(90deg)" : "rotate(0)" }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              {editing?.type === "feature" && editing.id === f.id ? (
                <input
                  ref={editRef}
                  className="input"
                  draggable={false}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, padding: "2px 6px", flex: 1 }}
                />
              ) : (
                <span onDoubleClick={(e) => { e.stopPropagation(); startEditing("feature", f.id, f.name); }}>{f.name}</span>
              )}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }}>
                {stories.filter((s) => s.feature_id === f.id).length} stories
              </span>
            </button>
            <DeleteButton onClick={() => requestDelete("feature", f.id, f.name)} />
          </div>

          {expanded.has(`f-${f.id}`) && (
            <div style={{ marginLeft: 20 }}>
              {(() => {
                const featureStories = stories.filter((s) => s.feature_id === f.id);
                return featureStories.map((s, si) => {
                  const storyCases = cases.filter((c) => c.story_id === s.id);
                  return (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); onDragStart(e, { type: "story", id: s.id, featureId: f.id, index: si }); }}
                      onDragEnd={onDragEnd}
                      onDragOver={(e) => { e.stopPropagation(); onStoryDragOver(e, f.id, si); }}
                      onDrop={(e) => { e.stopPropagation(); onStoryDrop(e, f.id, si); }}
                    >
                      <DropIndicator show={isDropAt("story", si, "before", f.id)} />

                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={gripStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
                        >
                          <GripIcon size={12} />
                        </div>
                        <button
                          onClick={() => toggle(`s-${s.id}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            fontSize: 13,
                            borderRadius: "var(--radius-sm)",
                            transition: "background 0.15s",
                          }}
                        >
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: "transform 0.2s", transform: expanded.has(`s-${s.id}`) ? "rotate(90deg)" : "rotate(0)" }}
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                          {editing?.type === "story" && editing.id === s.id ? (
                            <input
                              ref={editRef}
                              className="input"
                              draggable={false}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                              onBlur={commitRename}
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 500, padding: "2px 6px", flex: 1 }}
                            />
                          ) : (
                            <span onDoubleClick={(e) => { e.stopPropagation(); startEditing("story", s.id, s.name); }}>{s.name}</span>
                          )}
                          <PriorityBadge story={s} onUpdate={(p) => updateStoryPriority(s.id, p)} />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }}>
                            {storyCases.length}
                          </span>
                        </button>
                        <DeleteButton onClick={() => requestDelete("story", s.id, s.name)} size={12} />
                      </div>

                      {expanded.has(`s-${s.id}`) && (
                        <div style={{ marginLeft: 14 }}>
                          {storyCases.map((c, ci) => (
                            <div
                              key={c.id}
                              draggable
                              onDragStart={(e) => { e.stopPropagation(); onDragStart(e, { type: "case", id: c.id, storyId: s.id, index: ci }); }}
                              onDragEnd={onDragEnd}
                              onDragOver={(e) => { e.stopPropagation(); onCaseDragOver(e, s.id, ci); }}
                              onDrop={(e) => { e.stopPropagation(); onCaseDrop(e, s.id, ci); }}
                            >
                              <DropIndicator show={isDropAt("case", ci, "before", s.id)} />
                              <div
                                onClick={() => onSelectCase?.(c)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginLeft: 18,
                                  padding: "6px 12px",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  color: selectedCaseId === c.id ? "var(--text-primary)" : "var(--text-secondary)",
                                  background: selectedCaseId === c.id ? "var(--bg-elevated)" : "transparent",
                                  borderLeft: selectedCaseId === c.id ? "2px solid var(--color-accent)" : "1px solid var(--border)",
                                  borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                                  transition: "all 0.15s",
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ ...gripStyle, padding: "0 4px 0 0" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
                                >
                                  <GripIcon size={10} />
                                </div>
                                <span style={{
                                  display: "inline-block",
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: c.status === "active" ? "var(--color-accent)" : "var(--text-muted)",
                                  marginRight: 4,
                                  opacity: 0.6,
                                  flexShrink: 0,
                                }} />
                                {editing?.type === "case" && editing.id === c.id ? (
                                  <input
                                    ref={editRef}
                                    className="input"
                                    draggable={false}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                                    onBlur={commitRename}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ fontSize: 12, fontFamily: "var(--font-mono)", padding: "2px 6px", flex: 1 }}
                                  />
                                ) : (
                                  <span onDoubleClick={(e) => { e.stopPropagation(); startEditing("case", c.id, c.name); }}>{c.name}</span>
                                )}
                                <span style={{ flex: 1 }} />
                                <DeleteButton onClick={() => requestDelete("case", c.id, c.name)} size={11} />
                              </div>
                              <DropIndicator show={isDropAt("case", ci, "after", s.id)} />
                            </div>
                          ))}

                          {/* Add Test Case */}
                          <div style={{ display: "flex", gap: 6, padding: "4px 12px 4px 20px", alignItems: "center" }}>
                            <input
                              className="input"
                              value={newCaseName[s.id] || ""}
                              onChange={(e) => setNewCaseName((prev) => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="New test case..."
                              onKeyDown={(e) => e.key === "Enter" && createCase(s.id)}
                              style={{ fontSize: 11, padding: "4px 8px", flex: 1, maxWidth: 200 }}
                            />
                            <button
                              className="btn btn-ghost"
                              onClick={() => createCase(s.id)}
                              style={{ fontSize: 11, padding: "3px 8px" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      <DropIndicator show={isDropAt("story", si, "after", f.id)} />
                    </div>
                  );
                });
              })()}

              {/* Add Story */}
              <div style={{ display: "flex", gap: 8, padding: "6px 12px 6px 22px", alignItems: "center" }}>
                <input
                  className="input"
                  value={newStoryName[f.id] || ""}
                  onChange={(e) => setNewStoryName((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder="New story name..."
                  onKeyDown={(e) => e.key === "Enter" && createStory(f.id)}
                  style={{ fontSize: 12, padding: "5px 10px", flex: 1, maxWidth: 240 }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() => createStory(f.id)}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Story
                </button>
              </div>
            </div>
          )}

          <DropIndicator show={isDropAt("feature", fi, "after")} />
        </div>
      ))}
      {pendingDelete && (
        <ConfirmModal
          title={deleteMessages[pendingDelete.type].title}
          message={deleteMessages[pendingDelete.type].message}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
