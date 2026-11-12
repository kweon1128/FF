// 기본 값 목록을 다루는 계산: 복제, 붙여넣기, 순서 바꾸기, 글자로 주고받기.

import type { Token } from './api'
import { ALL_KINDS, SLUG, groupOf, shortName } from './catalog'
import { isColor } from './color'

export const kindOf = (name: string) => ALL_KINDS.find((k) => k.matches(name)) ?? null

/** 같은 묶음인지 가린다. 같은 종류이고, 색이면 같은 목록이어야 한다. */
export function siblingTest(name: string): (t: Token) => boolean {
  const kind = kindOf(name)
  if (!kind) return (t) => t.name === name
  if (kind.id !== 'color') return (t) => kind.matches(t.name)
  const group = groupOf(shortName(kind, name))
  return (t) => kind.matches(t.name) && groupOf(shortName(kind, t.name)) === group
}

/** 복제한 값의 이름. 색은 같은 목록에 남도록 하이픈 없이 붙인다(primary-500 → primary-500copy). */
export function copyName(name: string, taken: Set<string>) {
  const sep = kindOf(name)?.id === 'color' ? '' : '-'
  let next = `${name}${sep}copy`
  for (let i = 2; taken.has(next); i++) next = `${name}${sep}copy${i}`
  return next
}

/** 고른 값마다 바로 뒤에 같은 값을 하나 더 만든다. */
export function duplicateTokens(tokens: Token[], names: string[]) {
  const taken = new Set(tokens.map((t) => t.name))
  const added: string[] = []
  const next = tokens.flatMap((t) => {
    if (!names.includes(t.name)) return [t]
    const name = copyName(t.name, taken)
    taken.add(name)
    added.push(name)
    return [t, { name, value: t.value }]
  })
  return { next, added }
}

/** 고른 값을 같은 묶음 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. */
export function shiftTokens(tokens: Token[], names: string[], dir: 1 | -1) {
  const next = [...tokens]
  const order = next.map((_, i) => i).filter((i) => names.includes(next[i].name))
  if (dir === 1) order.reverse()
  for (const i of order) {
    const same = siblingTest(next[i].name)
    let j = i + dir
    while (j >= 0 && j < next.length && !same(next[j])) j += dir
    if (j < 0 || j >= next.length || names.includes(next[j].name)) continue
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** 복사할 때 클립보드에 담는 글자. CSS 변수 선언 그대로라서 코드에 붙여도 쓸 수 있다. */
export const toCss = (tokens: Token[]) => tokens.map((t) => `${t.name}: ${t.value};`).join('\n')

/**
 * 붙여넣은 글자에서 변수 선언을 찾는다.
 * FF가 아는 종류(이름이 --color-, --spacing- 등으로 시작하고 영문 소문자·숫자·하이픈으로 된 것)는 tokens에,
 * 그 밖의 선언(--blue-500, --Primary, --brand_color 등)은 skipped에 담는다.
 */
export function scanCss(text: string): { tokens: Token[]; skipped: Token[] } {
  const tokens: Token[] = []
  const skipped: Token[] = []
  for (const m of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;{}\n\r]+)/g)) {
    const name = m[1]
    const value = m[2].trim().replace(/\s+/g, ' ')
    if (!value || [...tokens, ...skipped].some((t) => t.name === name)) continue
    const known = /^--[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && kindOf(name)
    ;(known ? tokens : skipped).push({ name, value })
  }
  return { tokens, skipped }
}

/** 붙여넣은 글자에서 FF가 아는 종류의 변수 선언만 골라낸다. */
export const fromCss = (text: string) => scanCss(text).tokens

/**
 * 읽지 못한 선언 중 값이 색인 것을 색 값으로 받아들일 수 있게 이름을 고친다.
 * 이름 앞에 --color-를 붙이고, 대문자는 소문자로, 밑줄은 하이픈으로 바꾼다(--blue_500 → --color-blue-500).
 * 그래도 쓸 수 없는 이름이면 뺀다.
 */
export function adoptColors(skipped: Token[]): Token[] {
  const out: Token[] = []
  for (const t of skipped) {
    if (!isColor(t.value)) continue
    const short = t.name.replace(/^--/, '').replace(/^color[-_]?/i, '').toLowerCase().replace(/_+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const name = `--color-${short}`
    if (SLUG.test(short) && !out.some((o) => o.name === name)) out.push({ name, value: t.value })
  }
  return out
}

/** 붙여넣을 값이 실제로 갖게 될 이름. intoGroup이 있으면 색은 그 목록으로 들어간다('' 는 예외 색). */
export function pasteName(name: string, intoGroup: string | null) {
  const kind = kindOf(name)
  if (!kind || kind.id !== 'color' || intoGroup === null) return name
  const short = shortName(kind, name)
  const group = groupOf(short)
  const step = group ? short.slice(group.length + 1) : short
  return `${kind.prefix}${intoGroup ? `${intoGroup}-` : ''}${step}`
}

/**
 * 붙여넣기. 같은 묶음의 맨 끝에 넣는다.
 * 이름이 이미 있으면 overwrite일 때는 그 값만 바꾸고, 아니면 copy를 붙여 따로 만든다.
 * intoGroup이 있으면 색은 그 목록으로 들어간다('' 는 예외 색).
 * added는 새로 생기거나 값이 바뀐 이름들, replaced는 그중 덮어쓴 수.
 */
export function pasteTokens(tokens: Token[], pasted: Token[], intoGroup: string | null, overwrite = false) {
  const taken = new Set(tokens.map((t) => t.name))
  const next = [...tokens]
  const added: string[] = []
  let replaced = 0
  for (const p of pasted) {
    const kind = kindOf(p.name)
    if (!kind) continue
    let name = pasteName(p.name, intoGroup)
    if (taken.has(name) && overwrite) {
      const at = next.findIndex((t) => t.name === name)
      next[at] = { name, value: p.value }
      added.push(name)
      replaced++
      continue
    }
    if (taken.has(name)) name = copyName(name, taken)
    taken.add(name)
    let at = next.findLastIndex(siblingTest(name))
    if (at === -1) at = next.findLastIndex((t) => kind.matches(t.name))
    next.splice(at === -1 ? next.length : at + 1, 0, { name, value: p.value })
    added.push(name)
  }
  return { next, added, replaced }
}

/** 방향키로 값을 올리고 내린다. 16px, 1.5, 400처럼 숫자 하나로 된 값만 바꾼다. */
export function stepValue(value: string, dir: 1 | -1, big: boolean): string | null {
  const m = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(value.trim())
  if (!m) return null
  const decimals = m[1].includes('.') ? m[1].split('.')[1].length : 0
  const step = (decimals ? 0.1 : 1) * (big ? 10 : 1)
  const next = Number(m[1]) + dir * step
  return `${Number(next.toFixed(Math.max(decimals, 1))).toString()}${m[2]}`
}
