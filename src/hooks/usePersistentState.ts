import { useEffect, useState } from 'react'

/** `useState` that survives a page reload. Falls back to in-memory state when storage is unavailable. */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      // Private mode or corrupted value: start fresh.
    }
    return initial instanceof Function ? initial() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked; the calculator still works without it.
    }
  }, [key, value])

  return [value, setValue] as const
}
