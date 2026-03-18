"use client";

import { useEffect, useState, useRef } from "react";
import { DotsVerticalIcon, PencilIcon, TrashIcon } from "./icons";

interface DropdownMenuProps {
  name: string;
  onRename: (newName: string) => void;
  onDelete: () => void;
  /** Called when dropdown open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether toggle button should stop event propagation (e.g. when inside a link) */
  stopPropagation?: boolean;
}

export default function DropdownMenu({
  name,
  onRename,
  onDelete,
  onOpenChange,
  stopPropagation = false,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  // Keep name in sync if prop changes
  useEffect(() => {
    if (!renaming) setNewName(name);
  }, [name, renaming]);

  const handleRename = () => {
    if (!newName.trim() || newName === name) {
      setRenaming(false);
      return;
    }
    onRename(newName);
    setRenaming(false);
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleDelete = () => {
    setOpen(false);
    onOpenChange?.(false);
    onDelete();
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        className="btn-icon-ghost"
      >
        <DotsVerticalIcon />
      </button>

      {open && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="dropdown-panel"
        >
          {renaming ? (
            <div style={{ padding: 10 }}>
              <input
                ref={inputRef}
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") { setRenaming(false); setNewName(name); }
                }}
                style={{ fontSize: 13, padding: "6px 10px", marginBottom: 6 }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setRenaming(false); setNewName(name); }}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRename}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setRenaming(true)}
                className="dropdown-item"
              >
                <PencilIcon />
                Rename
              </button>
              <div style={{ height: 1, background: "var(--border)" }} />
              <button
                onClick={handleDelete}
                className="dropdown-item dropdown-item-danger"
              >
                <TrashIcon />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
