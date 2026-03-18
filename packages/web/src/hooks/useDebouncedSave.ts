"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Custom hook for debounced auto-save of a field to the API.
 *
 * Returns [value, setValue, isSaving] where setValue triggers a debounced API call.
 */
export function useDebouncedSave(
  endpoint: string | null,
  field: string,
  initialValue: string,
  delay: number = 600,
): [string, (value: string) => void, boolean] {
  const [value, setValueState] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial value when it changes externally
  useEffect(() => {
    setValueState(initialValue);
  }, [initialValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setValue = useCallback((newValue: string) => {
    setValueState(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (!endpoint) return;
      setSaving(true);
      await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify({ [field]: newValue }),
      });
      setSaving(false);
    }, delay);
  }, [endpoint, field, delay]);

  return [value, setValue, saving];
}

/**
 * Flushes any pending debounced save immediately.
 * Returns a ref that holds the current timeout.
 */
export function useSaveTimeout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return timeoutRef;
}
