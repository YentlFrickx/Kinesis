import { useSyncExternalStore } from 'react'

export interface Toast {
  id: number
  message: string
  undo?: () => void
}

const DURATION_MS = 6000

let current: Toast | null = null
let nextId = 1
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismissToast() {
  clearTimeout(timer)
  current = null
  emit()
}

/** Shows a toast (replacing any current one); with `undo` it offers an Undo button for a few seconds. */
export function showToast(message: string, undo?: () => void) {
  clearTimeout(timer)
  current = { id: nextId++, message, undo }
  emit()
  timer = setTimeout(dismissToast, DURATION_MS)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useToast = () => useSyncExternalStore(subscribe, () => current)
