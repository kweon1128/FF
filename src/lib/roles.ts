// 의미 색: 실제로 쓰는 색에 쓰임새의 이름을 붙인 것.
// 파일에는 `--color-primary: var(--color-blue-600); /* 버튼: 가장 중요한 버튼 */`처럼,
// 색상 판의 색 하나를 가리키는 값과 그 뒤의 주석(역할: 설명)으로 적는다.

import type { Token } from './api'
import { COLOR_REF, groupOf } from './catalog'
import { toHex, toOklch } from './color'

/** 색이 맡는 역할. 판에 그리는 예시가 이것에 따라 달라진다. */
export type RoleUse = 'text' | 'surface' | 'border' | 'fill'

export const ROLE_USES: { id: RoleUse; label: string }[] = [
  { id: 'text', label: '글자' },
  { id: 'surface', label: '바탕' },
  { id: 'border', label: '테두리' },
  { id: 'fill', label: '버튼' },
]

const labelOf = (use: RoleUse) => ROLE_USES.find((u) => u.id === use)!.label

/** var(--color-blue-600)이 가리키는 변수 이름. 다른 색을 가리키는 값이 아니면 null. */
export const refOf = (value: string) => COLOR_REF.exec(value)?.[1] ?? null

export const refTo = (name: string) => `var(${name})`

/** 역할을 적지 않은 색은 이름에서 짐작한다. text-muted는 글자, border는 테두리처럼. */
export function guessUse(short: string): RoleUse {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (has('text', 'fg', 'foreground', 'ink', 'on', 'label', 'heading', 'body', 'link')) return 'text'
  if (has('border', 'line', 'outline', 'divider', 'ring', 'stroke')) return 'border'
  if (has('bg', 'background', 'surface', 'canvas', 'page', 'card', 'panel', 'overlay')) return 'surface'
  return 'fill'
}

/** 주석에서 역할과 설명을 읽는다. "글자: 본문 글자"처럼 역할로 시작하지 않으면 주석 전체가 설명이고 역할은 이름에서 짐작한다. */
export function readNote(note: string | undefined, short: string): { use: RoleUse; text: string } {
  const all = (note ?? '').trim()
  const m = /^(글자|바탕|테두리|버튼)\s*(?::\s*(.*))?$/.exec(all)
  const use = m && ROLE_USES.find((u) => u.label === m[1])
  return use ? { use: use.id, text: (m[2] ?? '').trim() } : { use: guessUse(short), text: all }
}

/** 주석에 적을 글자. 주석을 끝내는 기호와 줄바꿈은 파일을 깨뜨리므로 뺀다. */
export function writeNote(use: RoleUse, text: string) {
  const clean = text.replace(/\*\//g, '').replace(/\s+/g, ' ').trim()
  return clean ? `${labelOf(use)}: ${clean}` : labelOf(use)
}

/** 예시를 그릴 때 주변에 까는 색. 이 디자인 시스템의 기본 바탕과 기본 글자 색. */
export type Around = { surface: string; ink: string }

/**
 * 이 디자인 시스템의 기본 바탕과 기본 글자 색을 의미 색의 이름에서 찾는다(canvas, background… / ink, text…).
 * 그런 이름의 의미 색이 없으면 흰 바탕과 거의 검은 글자를 쓴다.
 */
export function surroundings(tokens: Token[]): Around {
  const named = (names: string[]) => {
    for (const n of names) {
      const t = tokens.find((x) => x.name === `--color-${n}` && refOf(x.value))
      const color = t && resolveColor(tokens, t.value)
      if (color) return color
    }
    return null
  }
  return {
    surface: named(['canvas', 'background', 'bg', 'surface', 'page', 'base']) ?? '#ffffff',
    ink: named(['ink', 'text', 'foreground', 'fg', 'body']) ?? '#1a1a1a',
  }
}

/** 가리키는 색을 따라가 실제 색(#rrggbb, 투명하면 #rrggbbaa)을 찾는다. 가리키는 색이 없거나 색이 아니면 null. */
export function resolveColor(tokens: Token[], value: string): string | null {
  let now = value
  // 의미 색이 다른 의미 색을 가리킬 수도 있다. 서로 맞물려 끝나지 않는 경우에 대비해 몇 번만 따라간다.
  for (let i = 0; i < 8; i++) {
    const ref = refOf(now)
    if (!ref) return toHex(now)
    const target = tokens.find((t) => t.name === ref)
    if (!target) return null
    now = target.value
  }
  return null
}

const isRole = (t: Token) => t.name.startsWith('--color-') && refOf(t.value) !== null
const useOf = (t: Token) => readNote(t.note, t.name.slice('--color-'.length)).use

/**
 * 의미 색을 역할별로 묶는다. 묶음의 순서는 파일에서 그 역할이 처음 나오는 순서이고, 묶음 안의 순서도 파일에 적힌 순서다.
 * 순서를 따로 저장하지 않고 파일의 순서가 곧 판의 순서다.
 */
export function roleGroups(tokens: Token[]): { use: RoleUse; items: Token[] }[] {
  const groups: { use: RoleUse; items: Token[] }[] = []
  for (const t of tokens) {
    if (!isRole(t)) continue
    const use = useOf(t)
    const group = groups.find((g) => g.use === use)
    if (group) group.items.push(t)
    else groups.push({ use, items: [t] })
  }
  return groups
}

/** 묶음의 순서대로 의미 색을 다시 늘어놓아, 값 목록에서 의미 색이 있던 자리들에 차례로 넣는다. 다른 값의 자리는 그대로다. */
function place(tokens: Token[], groups: { items: Token[] }[]): Token[] {
  const sorted = groups.flatMap((g) => g.items)
  let k = 0
  return tokens.map((t) => (isRole(t) ? sorted[k++] : t))
}

/** 역할 묶음을 통째로 옮긴다. before 묶음의 앞에 놓고, null이면 맨 뒤에 놓는다. */
export function moveRoleGroup(tokens: Token[], use: RoleUse, before: RoleUse | null): Token[] {
  const groups = roleGroups(tokens)
  const moving = groups.find((g) => g.use === use)
  if (!moving || use === before) return tokens
  const rest = groups.filter((g) => g !== moving)
  const at = before === null ? rest.length : rest.findIndex((g) => g.use === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  return place(tokens, rest)
}

/** 의미 색 하나를 같은 묶음 안에서 옮긴다. before 색의 앞에 놓고, null이면 묶음의 맨 뒤에 놓는다. */
export function moveRole(tokens: Token[], name: string, before: string | null): Token[] {
  const groups = roleGroups(tokens)
  const group = groups.find((g) => g.items.some((t) => t.name === name))
  if (!group || name === before) return tokens
  const moving = group.items.find((t) => t.name === name)!
  const rest = group.items.filter((t) => t !== moving)
  const at = before === null ? rest.length : rest.findIndex((t) => t.name === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  group.items = rest
  return place(tokens, groups)
}

/** oklch(밝기 선명함 색조)에서 밝기와 선명함을 읽는다. 색이 아니면 null. */
function lightChroma(value: string): { l: number; c: number } | null {
  const hex = toHex(value)
  const m = hex && /^oklch\(([\d.]+) ([\d.]+)/.exec(toOklch(hex.slice(0, 7)))
  return m ? { l: Number(m[1]), c: Number(m[2]) } : null
}

/** 이보다 선명한 색이 하나도 없는 목록은 무채색(회색) 목록으로 본다. */
const NEUTRAL_CHROMA = 0.04

/**
 * 판 안의 순서를 기본으로 돌려놓는다.
 * 묶음은 글자, 바탕, 테두리, 버튼 순서. 묶음 안에서는 무채색(회색·검정·흰색)을 가리키는 색을 먼저, 색깔 있는 것을 뒤에 둔다.
 * 글자·테두리·버튼은 진한 것부터, 바탕은 밝은 것부터 놓는다. 색깔 있는 것은 색상 판의 목록 순서를 따르고, 같은 목록 안에서는 같은 밝기 규칙을 쓴다.
 * 가리키는 색이 없는 것은 맨 뒤에 둔다. 조건이 같으면 지금 순서 그대로다.
 */
export function defaultRoleOrder(tokens: Token[]): Token[] {
  const rank = (use: RoleUse) => ROLE_USES.findIndex((u) => u.id === use)
  const palette = tokens.filter((t) => t.name.startsWith('--color-') && !isRole(t))
  const listOf = (name: string) => groupOf(name.slice('--color-'.length))
  // 색상 판에 나오는 목록의 순서(예외 색은 맨 뒤).
  const lists = [...new Set(palette.map((t) => listOf(t.name)))].filter(Boolean)
  const key = (t: Token) => {
    // 의미 색이 다른 의미 색을 가리키면 끝까지 따라가 색상 판의 색을 찾는다.
    let target: Token | undefined = t
    for (let i = 0; i < 8 && target && isRole(target); i++) {
      const ref = refOf(target.value)
      target = tokens.find((x) => x.name === ref)
    }
    const own = target && lightChroma(target.value)
    if (!target || !own) return null
    const list = listOf(target.name)
    // 목록에 속한 색은 그 목록에서 가장 선명한 색으로, 예외 색은 제 선명함으로 무채색인지 가린다(blue-50처럼 옅은 색도 파랑 목록의 색이다).
    const chroma = list ? Math.max(...palette.filter((p) => listOf(p.name) === list).map((p) => lightChroma(p.value)?.c ?? 0)) : own.c
    const neutral = chroma < NEUTRAL_CHROMA
    return { neutral, at: neutral ? -1 : list ? lists.indexOf(list) : lists.length, l: own.l }
  }
  const groups = roleGroups(tokens).sort((a, b) => rank(a.use) - rank(b.use))
  for (const g of groups) {
    const dir = g.use === 'surface' ? -1 : 1
    const keys = new Map(g.items.map((t) => [t, key(t)]))
    g.items = [...g.items].sort((a, b) => {
      const ka = keys.get(a)
      const kb = keys.get(b)
      if (!ka || !kb) return ka ? -1 : kb ? 1 : 0
      return ka.at - kb.at || (ka.l - kb.l) * dir
    })
  }
  return place(tokens, groups)
}
