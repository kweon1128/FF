// 기본 값 목록을 다루는 계산: 복제, 붙여넣기, 순서 바꾸기, 글자로 주고받기.

import type { Token } from './api'
import { ALL_KINDS, COLOR_REF, KINDS, SLUG, groupOf, lineName, shortName } from './catalog'
import { isColor, toHex, toOklch } from './color'

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
  const after = new Map<string, Token[]>()
  const next = tokens.flatMap((t) => {
    if (!names.includes(t.name)) return [t]
    const name = copyName(t.name, taken)
    taken.add(name)
    added.push(name)
    // 글자 크기를 복제하면 묶인 줄 높이도 함께 복제한다. 원래 크기와 그 줄 높이 사이에 끼지 않게, 복제한 쌍은 원래 줄 높이 뒤에 놓는다.
    const line = tokens.find((l) => l.name === lineName(t.name))
    if (!line) return [t, { ...t, name }]
    after.set(line.name, [{ ...t, name }, { ...line, name: lineName(name) }])
    return [t]
  })
  return { next: next.flatMap((t) => [t, ...(after.get(t.name) ?? [])]), added }
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
    // 다른 색을 가리키는 값(의미 색)은 목록에 속하지 않으므로 이름을 그대로 둔다.
    let name = COLOR_REF.test(p.value) ? p.name : pasteName(p.name, intoGroup)
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

/** 이보다 선명한 색이 하나도 없는 목록은 무채색(회색) 목록으로 본다. */
const NEUTRAL_CHROMA = 0.04

/**
 * 색상 판의 순서를 기본으로 돌려놓는다.
 * 목록은 회색 목록을 먼저, 색깔 있는 목록을 무지개 순서(빨강, 주황, 노랑, 초록, 파랑, 보라)로 놓는다.
 * 목록 안의 색은 번호 순서(50→950)이고 번호가 아닌 이름은 뒤에 그대로 둔다. 예외 색은 맨 뒤에 지금 순서 그대로 둔다.
 */
export function defaultColorOrder(tokens: Token[]): Token[] {
  const color = KINDS.color
  const colors = tokens.filter((t) => color.matches(t.name))
  const listOf = (t: Token) => groupOf(shortName(color, t.name))
  const step = (t: Token) => {
    const n = Number(shortName(color, t.name).slice(listOf(t).length + 1))
    return listOf(t) && Number.isFinite(n) ? n : Infinity
  }
  // 목록의 색조는 그 목록에서 가장 선명한 색의 것으로 본다(옅은 단계는 색조가 흔들린다).
  const hueOf = (list: Token[]) => {
    let best = { c: 0, h: 0 }
    for (const t of list) {
      const hex = toHex(t.value)
      const m = hex && /^oklch\([\d.]+ ([\d.]+) ([\d.]+)/.exec(toOklch(hex.slice(0, 7)))
      if (m && Number(m[1]) > best.c) best = { c: Number(m[1]), h: Number(m[2]) }
    }
    return best.c < NEUTRAL_CHROMA ? -1 : best.h
  }
  const names = [...new Set(colors.map(listOf))].filter(Boolean)
  const lists = names.map((name) => {
    const list = colors.filter((t) => listOf(t) === name)
    return { hue: hueOf(list), list: [...list].sort((a, b) => step(a) - step(b)) }
  })
  const sorted = [...lists.sort((a, b) => a.hue - b.hue).flatMap((l) => l.list), ...colors.filter((t) => listOf(t) === '')]
  let k = 0
  return tokens.map((t) => (color.matches(t.name) ? sorted[k++] : t))
}

/** 글자 크기에 묶인 줄 높이. 없으면 undefined. */
export function lineOf(tokens: Token[], sizeName: string) {
  return tokens.find((t) => t.name === lineName(sizeName))?.value
}

/**
 * 글자 크기에 어울리는 줄 높이(px). 줄 높이는 배수가 아니라 px로 정하고 4의 배수에 맞춘다.
 * 그래야 어떤 글꼴을 넣어도 줄의 높이가 같고, 아이콘이나 체크박스가 줄의 한가운데에 놓인다.
 * 작은 글자는 약 1.45배, 24px부터는 약 1.25배다(12→16, 14→20, 16→24, 20→28, 24→32).
 * 크기가 px나 rem이 아니면 null.
 */
export function suggestLine(size: string) {
  const m = /^(\d*\.?\d+)(px|rem)$/.exec(size.trim())
  if (!m) return null
  const px = Number(m[1]) * (m[2] === 'rem' ? 16 : 1)
  return `${Math.max(4, Math.round((px * (px >= 24 ? 1.25 : 1.45)) / 4) * 4)}px`
}

/** 글자 크기에 묶인 줄 높이를 바꾼다. 없으면 그 크기 바로 뒤에 넣고, value가 null이면 지운다. */
export function withLine(tokens: Token[], sizeName: string, value: string | null) {
  const name = lineName(sizeName)
  if (value === null) return tokens.filter((t) => t.name !== name)
  if (tokens.some((t) => t.name === name)) return tokens.map((t) => (t.name === name ? { ...t, value } : t))
  return tokens.flatMap((t) => (t.name === sizeName ? [t, { name, value }] : [t]))
}
