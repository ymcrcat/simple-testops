"use client";

import { useEffect, useState, useRef } from "react";

export function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed. Please try again.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

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
        {error && (
          <div className="error-block" style={{ marginBottom: 16 }}>
            <pre>{error}</pre>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            ref={cancelRef}
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={submitting}
            style={{ fontSize: 13, padding: "7px 16px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: submitting ? "default" : "pointer",
              background: "var(--color-failed)",
              color: "#fff",
              opacity: submitting ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.opacity = "1"; }}
          >
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
