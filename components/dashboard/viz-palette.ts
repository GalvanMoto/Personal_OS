/**
 * Chart palette.
 *
 * Validated with the data-viz validator in both modes against this app's own
 * card surfaces (light #ffffff, dark #171717):
 *   light — CVD ΔE 9.1, normal-vision ΔE 19.6, contrast WARN on three slots
 *           (relief satisfied: every segment carries a visible direct label)
 *   dark  — CVD ΔE 8.4, normal-vision ΔE 19.3, contrast all ≥ 3:1
 *
 * The dark column is the same eight hues re-stepped for a dark surface, not an
 * automatic lightening of the light column.
 */

export type Slot = {
  light: string
  dark: string
}

export const CATEGORICAL: Slot[] = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue
  { light: "#eb6834", dark: "#d95926" }, // orange
  { light: "#1baf7a", dark: "#199e70" }, // aqua
  { light: "#eda100", dark: "#c98500" }, // yellow
  { light: "#e87ba4", dark: "#d55181" }, // magenta
  { light: "#008300", dark: "#008300" }, // green
  { light: "#4a3aa7", dark: "#9085e9" }, // violet
  { light: "#e34948", dark: "#e66767" }, // red
]

/// The tail bucket. Deliberately neutral: "Other" is an absence of identity, so
/// giving it a hue would imply it is a category like the rest.
export const OTHER: Slot = { light: "#8a8a85", dark: "#6f6f6a" }

/**
 * Slots that are safe when *any* pair may end up side by side.
 *
 * A stack ordered by size has data-dependent adjacency: today's biggest two
 * categories are neighbours, next month's may be a different two. That makes
 * the all-pairs gate the one that applies, not the adjacent one — and measured
 * against it, only the first three slots clear both modes (verified with the
 * validator: worst pair CVD ΔE 9.2 light / 9.4 dark). Four hues fail: green vs
 * orange collapses to ΔE 3.2 for protanopes in light, violet vs blue to 1.9 in
 * dark.
 *
 * So a ranked breakdown draws three hues and folds the rest into a neutral
 * "Other", rather than showing six colours a third of readers cannot separate.
 * The detail that loses is not lost — it is in the table below the chart.
 */
export const RANK_SAFE = CATEGORICAL.slice(0, 3)

/**
 * Position in a ranked breakdown to colour.
 *
 * Rank-keyed on purpose here, because the bar itself is rank-ordered and every
 * segment carries a direct label — identity comes from the label, not the hue.
 * Where colour must track an entity across re-sorts, use `SERIES` instead.
 */
export function rankSlot(index: number): Slot {
  return index < RANK_SAFE.length ? RANK_SAFE[index] : OTHER
}

/**
 * Fixed series identities.
 *
 * These are the same colour every render regardless of magnitude, so a reader
 * who learned "blue is spend" is never contradicted. All drawn from the
 * all-pairs-safe first three.
 */
export const SERIES = {
  spent: CATEGORICAL[0],
  earned: CATEGORICAL[2],
  captured: CATEGORICAL[0],
  completed: CATEGORICAL[2],
  blocked: CATEGORICAL[1],
}

/**
 * A slot as a shadcn `ChartConfig` theme entry.
 *
 * The chart primitive emits `--color-<key>` under both a bare selector and
 * `.dark`, which is the same class strategy next-themes uses — so a mark keeps
 * its correct step in either theme without any component reading the theme.
 */
export function chartTheme(slot: Slot): { light: string; dark: string } {
  return { light: slot.light, dark: slot.dark }
}

/// How many categories are drawn before the rest fold into "Other" — set by
/// what the all-pairs gate actually permits, not by taste.
export const MAX_CATEGORIES = RANK_SAFE.length
