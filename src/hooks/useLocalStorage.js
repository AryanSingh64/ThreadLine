"use client";

import { useEffect, useState } from "react";

function parseStoredValue(raw, defaultValue) {
  if (raw === null) return defaultValue;

  try {
    return JSON.parse(raw);
  } catch {
    if (typeof defaultValue === "boolean") {
      return raw === "true";
    }
    if (typeof defaultValue === "number") {
      const num = Number(raw);
      return Number.isFinite(num) ? num : defaultValue;
    }
    return raw;
  }
}

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setValue(parseStoredValue(raw, defaultValue));
    } catch {
      setValue(defaultValue);
    } finally {
      setReady(true);
    }
  }, [defaultValue, key]);

  const update = (next) => {
    setValue((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };

  return [value, update, ready];
}
