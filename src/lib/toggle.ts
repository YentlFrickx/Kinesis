/** `list` with `v` added, or removed when it is already present. */
export const toggle = <T,>(list: readonly T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
