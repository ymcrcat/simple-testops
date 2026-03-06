"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Feature { id: number; name: string; sort_order: number; }
interface Story { id: number; feature_id: number; name: string; sort_order: number; }
interface TestCase { id: number; story_id: number; name: string; status: string; class_name: string; sort_order: number; }

type DragItem =
  | { type: "feature"; id: number; index: number }
  | { type: "story"; id: number; featureId: number; index: number }
  | { type: "case"; id: number; storyId: number; index: number };

interface DropTarget {
  type: "feature" | "story" | "case";
  index: number;
  position: "before" | "after";
  parentId?: number; // featureId for stories, storyId for cases
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
  // If dragging from before the target, the splice-remove shifts indices down
  if (fromIndex < target) return target - 1;
  return target;
}

export default function TestCaseTree({ projectId }: { projectId: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newStoryName, setNewStoryName] = useState<Record<number, string>>({});

  const dragItem = useRef<DragItem | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  const loadFeatures = useCallback(() => {
    apiFetch<Feature[]>(`/features?project_id=${projectId}`).then(setFeatures);
  }, [projectId]);

  useEffect(() => {
    loadFeatures();
    apiFetch<TestCase[]>(`/testcases?project_id=${projectId}`).then(setCases);
  }, [projectId, loadFeatures]);

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

  const reloadCases = () => {
    apiFetch<TestCase[]>(`/testcases?project_id=${projectId}`).then(setCases);
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

  const persistOrder = async (type: "features" | "stories" | "testcases", items: { id: number }[]) => {
    await Promise.all(
      items.map((item, i) =>
        apiFetch(`/${type}/${item.id}`, { method: "PUT", body: JSON.stringify({ sort_order: i }) })
      )
    );
  };

  // Generic drag start
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

  // Feature handlers
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

  // Story handlers
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

  // Test case handlers
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

          {/* Feature row */}
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
              {f.name}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                {stories.filter((s) => s.feature_id === f.id).length} stories
              </span>
            </button>
          </div>

          {/* Stories */}
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
                          {s.name}
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                            {storyCases.length}
                          </span>
                        </button>
                      </div>

                      {/* Test Cases */}
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
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginLeft: 18,
                                  padding: "6px 12px",
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  color: "var(--text-secondary)",
                                  borderLeft: "1px solid var(--border)",
                                  transition: "color 0.15s",
                                  cursor: "grab",
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
                                {c.name}
                              </div>
                              <DropIndicator show={isDropAt("case", ci, "after", s.id)} />
                            </div>
                          ))}
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
    </div>
  );
}
