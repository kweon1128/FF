// 기본 값 목록을 다루는 계산: 복제, 붙여넣기, 순서 바꾸기, 글자로 주고받기.

import type { Token } from './api'
import { ALL_KINDS, COLOR_REF, KINDS, SLUG, SPACE_REF, boundNames, groupOf, lineName, shortName, trackName } from './catalog'
import { isColor, toHex, toOklch } from './color'
import { LEADINGS, lineFor, trackFor } from './presets'

export const kindOf = (name: string) => ALL_KINDS.find((k) => k.matches(name)) ?? null

/** 같은 분류인지 가린다. 같은 종류이고, 색이면 같은 목록이어야 한다. */
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
    // 글자 크기를 복제하면 묶인 줄 높이와 글자 사이도 함께 복제한다. 원래 크기와 묶인 값 사이에 끼지 않게, 복제한 것들은 원래의 마지막 묶인 값 뒤에 놓는다.
    const from = boundNames(t.name)
    const to = boundNames(name)
    const bound = tokens.filter((l) => from.includes(l.name))
    if (bound.length === 0) return [t, { ...t, name }]
    after.set(bound[bound.length - 1].name, [{ ...t, name }, ...bound.map((l) => ({ ...l, name: to[from.indexOf(l.name)] }))])
    return [t]
  })
  return { next: next.flatMap((t) => [t, ...(after.get(t.name) ?? [])]), added }
}

/** 고른 값을 같은 분류 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. */
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
// 주석(의미 색의 역할과 설명)도 파일에서처럼 같은 줄 뒤에 붙인다. 그래야 붙여넣었을 때 역할과 설명이 따라온다.
export const toCss = (tokens: Token[]) => tokens.map((t) => `${t.name}: ${t.value};${t.note ? ` /* ${t.note} */` : ''}`).join('\n')

/** 값에 딸린 것의 이름 끝(글자 크기의 줄 높이와 글자 사이, 의미 글꼴의 글자 사이). */
const BOUND = /--(line-height|letter-spacing)$/

/**
 * 붙여넣은 글자에서 변수 선언을 찾는다.
 * FF가 아는 종류(이름이 --color-, --spacing- 등으로 시작하고 영문 소문자·숫자·하이픈으로 된 것)는 tokens에,
 * 그 밖의 선언(--blue-500, --Primary, --brand_color 등)은 skipped에 담는다.
 */
export function scanCss(text: string): { tokens: Token[]; skipped: Token[] } {
  const tokens: Token[] = []
  const skipped: Token[] = []
  // 값 뒤, 같은 줄에 붙은 주석은 그 값의 설명으로 읽는다.
  for (const m of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;{}\n\r]+)(?:;[ \t]*\/\*[ \t]*([^\n\r]*?)[ \t]*\*\/)?/g)) {
    const name = m[1]
    const value = m[2].trim().replace(/\s+/g, ' ')
    if (!value || [...tokens, ...skipped].some((t) => t.name === name)) continue
    // 값에 딸린 것(--text-sm--line-height)은 제 값의 종류로 받는다.
    const base = name.replace(BOUND, '')
    const known = /^--[a-z0-9]+(-[a-z0-9]+)*$/.test(base) && kindOf(base)
    ;(known ? tokens : skipped).push(m[3] ? { name, value, note: m[3] } : { name, value })
  }
  return { tokens, skipped }
}

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
 * 붙여넣기. 같은 분류의 맨 끝에 넣는다.
 * 이름이 이미 있으면 overwrite일 때는 그 값만 바꾸고, 아니면 copy를 붙여 따로 만든다.
 * intoGroup이 있으면 색은 그 목록으로 들어간다('' 는 예외 색).
 * added는 새로 생기거나 값이 바뀐 이름들, replaced는 그중 덮어쓴 수.
 */
export function pasteTokens(tokens: Token[], pasted: Token[], intoGroup: string | null, overwrite = false) {
  const taken = new Set(tokens.map((t) => t.name))
  const next = [...tokens]
  const added: string[] = []
  let replaced = 0
  // 붙여넣으면서 이름이 달라진 값(이름이 겹쳐 copy가 붙은 것). 딸린 것이 제 값을 따라가게 한다.
  const renamed = new Map<string, string>()
  for (const p of pasted.filter((t) => BOUND.test(t.name))) {
    const suffix = BOUND.exec(p.name)![0]
    const owner = p.name.slice(0, -suffix.length)
    // 제 값과 함께 붙여넣은 것만 받는다. 값 없이 딸린 것만 온 것은 버린다.
    if (!pasted.some((t) => t.name === owner)) continue
    renamed.set(p.name, suffix)
  }
  const owners = new Map<string, string>()
  for (const p of pasted) {
    if (BOUND.test(p.name)) continue
    const kind = kindOf(p.name)
    if (!kind) continue
    // 다른 색을 가리키는 값(의미 색)은 목록에 속하지 않으므로 이름을 그대로 둔다.
    let name = COLOR_REF.test(p.value) ? p.name : pasteName(p.name, intoGroup)
    if (taken.has(name) && overwrite) {
      const at = next.findIndex((t) => t.name === name)
      // 덮어쓸 때 붙여넣은 쪽에 설명이 없으면 있던 설명을 그대로 둔다(파일도 그렇게 한다).
      next[at] = { ...next[at], value: p.value, ...(p.note ? { note: p.note } : {}) }
      added.push(name)
      replaced++
      continue
    }
    if (taken.has(name)) name = copyName(name, taken)
    taken.add(name)
    owners.set(p.name, name)
    // 다른 값을 가리키는 값(의미 색, 의미 간격)은 같은 의미 값들의 맨 뒤에 놓는다. 붙이는 순간에는 아직 종류가 가려지지 않아 토대 값들 사이에 끼기 때문이다.
    const semantic = name.startsWith('--color-') && COLOR_REF.test(p.value) ? KINDS.role : name.startsWith('--spacing-') && SPACE_REF.test(p.value) ? KINDS.spaceUse : null
    let at = semantic ? next.findLastIndex((t) => semantic.matches(t.name)) : -1
    if (at === -1) at = next.findLastIndex(siblingTest(name))
    if (at === -1) at = next.findLastIndex((t) => kind.matches(t.name))
    next.splice(at === -1 ? next.length : at + 1, 0, p.note ? { name, value: p.value, note: p.note } : { name, value: p.value })
    added.push(name)
  }
  // 값에 딸린 것을 제 값(새 이름) 바로 뒤에 놓는다. 이미 있으면 값만 바꾼다.
  for (const [boundName, suffix] of renamed) {
    const p = pasted.find((t) => t.name === boundName)!
    const owner = owners.get(boundName.slice(0, -suffix.length))
    if (!owner) continue
    const name = owner + suffix
    const has = next.findIndex((t) => t.name === name)
    if (has !== -1) next[has] = { ...next[has], value: p.value }
    else {
      const at = next.findLastIndex((t) => t.name === owner || t.name.startsWith(owner + '--'))
      next.splice(at + 1, 0, { name, value: p.value })
    }
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
 * 목록 안의 색은 번호 순서(50→950)이고 번호가 아닌 이름은 뒤에 그대로 둔다. 예외 색은 맨 뒤에, 무채색 먼저(밝은 것부터) 그다음 무지개 순서로 둔다.
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
  // 예외 색은 목록들과 같은 생각으로 놓는다. 무채색을 먼저(밝은 것부터), 색깔 있는 것을 무지개 순서로. 읽을 수 없는 값은 맨 뒤에 지금 순서 그대로.
  const tone = (t: Token) => {
    const hex = toHex(t.value)
    const m = hex && /^oklch\(([\d.]+) ([\d.]+)(?: ([\d.]+))?/.exec(toOklch(hex.slice(0, 7)))
    if (!m) return [2, 0]
    return Number(m[2]) < NEUTRAL_CHROMA ? [0, -Number(m[1])] : [1, Number(m[3] ?? 0)]
  }
  const tones = new Map(colors.filter((t) => listOf(t) === '').map((t) => [t, tone(t)]))
  const exceptions = [...tones.keys()].sort((a, b) => tones.get(a)![0] - tones.get(b)![0] || tones.get(a)![1] - tones.get(b)![1])
  const sorted = [...lists.sort((a, b) => a.hue - b.hue).flatMap((l) => l.list), ...exceptions]
  let k = 0
  return tokens.map((t) => (color.matches(t.name) ? sorted[k++] : t))
}

/** 글자 크기에 묶인 줄 높이. 없으면 undefined. */
export function lineOf(tokens: Token[], sizeName: string) {
  return tokens.find((t) => t.name === lineName(sizeName))?.value
}

/**
 * 글자 크기에 어울리는 줄 높이(px). 줄 높이는 배수가 아니라 px로 정하고 짝수에 맞춘다.
 * 그래야 어떤 글꼴을 넣어도 줄의 높이가 같고, 아이콘이나 체크박스가 줄의 한가운데에 놓인다.
 * 한 벌을 만들 때의 "보통"과 같은 규칙이다(lineFor. 12→16, 13→18, 14→20, 16→24, 20→28, 24→32).
 * 크기가 px나 rem이 아니면 null.
 */
export function suggestLine(size: string) {
  const m = /^(\d*\.?\d+)(px|rem)$/.exec(size.trim())
  if (!m) return null
  const px = Number(m[1]) * (m[2] === 'rem' ? 16 : 1)
  return `${lineFor(px, 'normal')}px`
}

/**
 * 글자 크기를 바꿨을 때 묶인 줄 높이가 따라갈 값. 지금 줄 높이가 예전 크기의 규칙대로면(보통, 좁게, 넓게 중 하나) 같은 방식으로 새 크기의 줄 높이를 낸다.
 * 규칙과 다른 줄 높이는 손으로 정한 것으로 보고 건드리지 않는다(null). 크기가 px나 rem이 아니어도 null.
 */
export function followLine(oldSize: string, oldLine: string, newSize: string) {
  const px = (v: string) => {
    const m = /^(\d*\.?\d+)(px|rem)$/.exec(v.trim())
    return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : null
  }
  const [from, line, to] = [px(oldSize), px(oldLine), px(newSize)]
  if (from === null || line === null || to === null) return null
  // 보통을 먼저 본다. 작은 글자는 좁게와 보통의 줄 높이가 같다.
  const leading = [...LEADINGS].sort((a, b) => Math.abs(a.scale - 1) - Math.abs(b.scale - 1)).find((l) => lineFor(from, l.id) === line)
  return leading ? `${lineFor(to, leading.id)}px` : null
}

/** 글자 크기에 묶인 줄 높이를 바꾼다. 없으면 그 크기 바로 뒤에 넣고, value가 null이면 지운다. */
export function withLine(tokens: Token[], sizeName: string, value: string | null) {
  const name = lineName(sizeName)
  if (value === null) return tokens.filter((t) => t.name !== name)
  if (tokens.some((t) => t.name === name)) return tokens.map((t) => (t.name === name ? { ...t, value } : t))
  return tokens.flatMap((t) => (t.name === sizeName ? [t, { name, value }] : [t]))
}

/** 글자 크기에 묶인 글자 사이. 없으면 undefined. */
export function trackOf(tokens: Token[], sizeName: string) {
  return tokens.find((t) => t.name === trackName(sizeName))?.value
}

/** 글자 크기에 어울리는 글자 사이(em). 크기가 px나 rem이 아니거나 좁힐 필요가 없는 크기면 null. */
export function suggestTrack(size: string) {
  const m = /^(\d*\.?\d+)(px|rem)$/.exec(size.trim())
  return m ? trackFor(Number(m[1]) * (m[2] === 'rem' ? 16 : 1)) : null
}

/**
 * 글자 크기를 바꿨을 때 묶인 글자 사이가 따라갈 값. 지금 값이 예전 크기의 규칙대로일 때만 따라간다.
 * 따라가지 않으면 undefined, 새 크기에서는 좁히지 않는 것이 규칙이면 null(묶인 값을 지운다).
 */
export function followTrack(oldSize: string, oldTrack: string, newSize: string): string | null | undefined {
  return suggestTrack(oldSize) === oldTrack ? suggestTrack(newSize) : undefined
}

/** 글자 크기에 묶인 글자 사이를 바꾼다. 없으면 그 크기의 줄 높이 뒤(줄 높이도 없으면 크기 바로 뒤)에 넣고, value가 null이면 지운다. */
export function withTrack(tokens: Token[], sizeName: string, value: string | null) {
  const name = trackName(sizeName)
  if (value === null) return tokens.filter((t) => t.name !== name)
  if (tokens.some((t) => t.name === name)) return tokens.map((t) => (t.name === name ? { ...t, value } : t))
  const anchor = tokens.some((t) => t.name === lineName(sizeName)) ? lineName(sizeName) : sizeName
  return tokens.flatMap((t) => (t.name === anchor ? [t, { name, value }] : [t]))
}
