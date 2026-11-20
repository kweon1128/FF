// 의미 색: 실제로 쓰는 색에 쓰임새의 이름을 붙인 것.
// 파일에는 `--color-primary: var(--color-blue-600); /* 채움: 가장 중요한 버튼 */`처럼,
// 색상 판의 색 하나를 가리키는 값과 그 뒤의 주석(역할: 설명)으로 적는다.

import type { Token } from './api'
import { COLOR_REF, groupOf } from './catalog'
import { toHex, toOklch } from './color'

/** 색이 맡는 역할. 판에 그리는 예시가 이것에 따라 달라진다. */
import { groupFromNote, headOf } from './kindnote'

export type RoleUse = 'text' | 'surface' | 'border' | 'fill' | 'status' | 'chart' | 'other'

/**
 * 역할의 분류들. 앞의 넷은 색이 어디에 칠해지는지로 나눈 것이고, 뒤의 둘은 그것으로 나눌 수 없는 색이다.
 * 상태 색은 뜻이 먼저다. 위험 색 하나가 글자에도 바탕에도 테두리에도 버튼에도 쓰이므로, 칠해지는 곳으로 흩지 않고 한 분류에 모은다(뜻이 상태면 어디에 칠하든 상태).
 * 차트 색은 글자도 바탕도 아니고 계열끼리 구분하려고 쓴다.
 * 채움은 버튼만이 아니라 뱃지, 칩, 전환 버튼, 선택 표시처럼 색으로 채우는 것 모두다. 컴포넌트마다 분류를 나누지 않는다. 같은 색이 버튼에도 켜진 토글에도 쓰여서,
 * 나누면 같은 색을 가리키는 의미 색이 분류마다 따로 생긴다. 어느 컴포넌트가 어느 색을 쓰는지는 컴포넌트 화면에서 정한다.
 * hint는 그 분류에 드는 것들. 역할을 고르는 칸에 함께 적는다.
 */
export const ROLE_USES: { id: RoleUse; label: string; hint: string }[] = [
  { id: 'text', label: '글자', hint: '본문, 링크, 아이콘' },
  { id: 'surface', label: '바탕', hint: '화면, 카드, 마우스를 올린 줄' },
  { id: 'border', label: '테두리', hint: '구분선, 초점' },
  { id: 'fill', label: '채움', hint: '버튼, 뱃지, 칩, 전환 버튼, 선택' },
  { id: 'status', label: '상태', hint: '성공, 경고, 위험, 정보' },
  { id: 'chart', label: '차트', hint: '그래프의 계열' },
  // 목록에 없는 쓰임. 주석에 목록에 없는 분류가 적힌 값도 여기에 놓인다(kindnote.ts의 groupFromNote).
  { id: 'other', label: '그 밖', hint: '목록에 없는 쓰임' },
]

const labelOf = (use: RoleUse) => ROLE_USES.find((u) => u.id === use)!.label

/** var(--color-blue-600)이 가리키는 변수 이름. 다른 색을 가리키는 값이 아니면 null. */
export const refOf = (value: string) => COLOR_REF.exec(value)?.[1] ?? null

export const refTo = (name: string) => `var(${name})`

/** 역할을 적지 않은 색은 이름에서 짐작한다. text-muted는 글자, border는 테두리처럼. */
export function guessUse(short: string): RoleUse {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  // 뜻이 상태면 어디에 칠하든 상태다(text-danger도 상태). 그래서 가장 먼저 본다.
  if (has('danger', 'error', 'critical', 'negative', 'success', 'positive', 'warning', 'warn', 'caution', 'info', 'notice')) return 'status'
  if (has('chart', 'series', 'data', 'graph', 'viz')) return 'chart'
  if (has('text', 'fg', 'foreground', 'ink', 'on', 'label', 'heading', 'body', 'link')) return 'text'
  if (has('border', 'line', 'outline', 'divider', 'ring', 'stroke')) return 'border'
  if (has('bg', 'background', 'surface', 'canvas', 'page', 'card', 'panel', 'overlay')) return 'surface'
  return 'fill'
}

/**
 * 예시의 모양. 판의 줄마다 그 색을 어떤 자리에 칠해 보여 줄지다. 의미 글꼴의 예시 모양과 같은 생각이다.
 * 역할 하나에도 쓰임이 여럿이라(바탕 역할에 패널의 면도, 마우스를 올린 줄도 있다) 역할로 예시를 정하면 설명과 맞지 않는다. 그래서 줄마다 따로 정한다.
 * 적어 두지 않은 색은 이름에서 짐작하고(hover는 줄, on-primary는 버튼 글자), 짐작할 수 없으면 역할의 첫 모양을 쓴다.
 */
export type RoleShape = 'text' | 'surface' | 'row' | 'border' | 'divider' | 'button' | 'on-fill' | 'badge' | 'outline' | 'guide' | 'note' | 'chart'

export const ROLE_SHAPES: { id: RoleShape; label: string; hint: string }[] = [
  { id: 'text', label: '글자', hint: '이 색으로 적은 글자' },
  { id: 'surface', label: '바탕', hint: '글이 놓이는 바탕' },
  { id: 'row', label: '줄', hint: '목록에서 올리거나 고른 줄' },
  { id: 'border', label: '테두리', hint: '입력칸의 테두리' },
  { id: 'divider', label: '구분선', hint: '면을 나누는 선' },
  { id: 'button', label: '버튼', hint: '이 색으로 채운 버튼' },
  { id: 'on-fill', label: '버튼 글자', hint: '채운 버튼 위의 글자' },
  { id: 'badge', label: '뱃지', hint: '상태를 알리는 작은 표시' },
  { id: 'outline', label: '선택 표시', hint: '선택한 것을 두르는 선과 이름표' },
  { id: 'guide', label: '안내선', hint: '맞춤 안내선과 간격 숫자' },
  { id: 'note', label: '안내 글자', hint: '상태를 알리는 작은 글자' },
  { id: 'chart', label: '차트', hint: '그래프의 막대' },
]

/**
 * 모양마다의 기본 예시 문구. 줄에 예시 문구를 적지 않았을 때 쓴다. 구분선과 차트에는 글자가 없다.
 * 여러 개를 늘어놓는 모양(버튼, 버튼 글자, 뱃지)은 쉼표와 빈칸(", ")으로 나눠 적는다.
 */
export const ROLE_WORDS: Record<RoleShape, string> = {
  text: '제목 가나다 Aa',
  surface: '카드 제목',
  row: '고른 줄',
  border: '입력칸',
  divider: '',
  button: '저장',
  'on-fill': '저장',
  badge: '알림, 뱃지',
  outline: '선택됨',
  guide: '24',
  note: '안내 글자 가나다 Aa 123',
  chart: '',
}

/** 여러 개를 늘어놓는 모양인지. */
export const isRoleListShape = (shape: RoleShape) => ['button', 'on-fill', 'badge'].includes(shape)

/** 모양을 적지 않은 색의 모양. 이름에서 짐작하고, 짐작할 수 없으면 역할의 첫 모양이다. */
export function guessRoleShape(short: string, use: RoleUse): RoleShape {
  const parts = short.split('-')
  const has = (...words: string[]) => parts.some((p) => words.includes(p))
  if (parts[0] === 'on') return 'on-fill'
  if (has('hover', 'active', 'pressed', 'selected', 'row', 'highlight')) return use === 'surface' ? 'row' : ({ text: 'text', border: 'border', fill: 'button', status: 'badge', chart: 'chart', surface: 'row', other: 'button' } as const)[use]
  if (has('divider', 'separator', 'hairline', 'rule')) return 'divider'
  if (has('guide', 'snap', 'ruler')) return 'guide'
  if (has('selection', 'focus', 'ring', 'outline')) return use === 'surface' ? 'row' : 'outline'
  // 그 밖은 채움처럼 그 색으로 채운 버튼이다(무엇에 쓰는 색인지 모를 때 색이 가장 넓게 보인다).
  return ({ text: 'text', surface: 'surface', border: 'border', fill: 'button', status: 'badge', chart: 'chart', other: 'button' } as const)[use]
}

/** 예시 하나. 어떤 자리에 칠할지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type RoleExample = { shape: RoleShape; words: string }

// 설명 뒤에 " | "로 이어 적은 것은 예시다. "바탕(줄): 마우스를 올린 줄 | 색상 | 뱃지: --color-ink".
// 역할 뒤의 괄호가 첫 예시의 모양(직접 고른 것만 적힌다), 첫 " | " 뒤가 첫 예시의 문구, 그 뒤로 " | 모양: 문구"가 예시마다 이어진다.
const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다. 손으로 적은 주석은 빈칸이 하나 빠지거나 더 들어가기 쉽고, 문구가 빈 예시는 세로줄 둘이 붙어 적힌다.
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const SHAPE_LABELS = ROLE_SHAPES.map((u) => u.label).join('|')
// 역할의 이름은 목록에서 만든다(목록에 "그 밖"을 더했는데 여기에 빠져 있어, 저장할 때마다 "그 밖: 그 밖: …"으로 머리가 덧붙었다). "버튼"은 "채움"의 예전 이름이다.
// 모양 자리는 목록에 없는 이름도 받는다. 역할은 맞는데 모양만 목록에 없는 주석도 역할과 설명, 문구를 읽는다.
const NOTE = new RegExp(`^(${[...ROLE_USES.map((u) => u.label), '버튼'].join('|')})(?:\\(([^)|]*)\\))?\\s*(?::\\s*(.*))?$`)
const SHAPE_HEAD = new RegExp(`^(${SHAPE_LABELS})\\s*:\\s*(.*)$`)

/**
 * 주석에서 역할, 설명, 예시들을 읽는다. "글자: 본문 글자"처럼 역할로 시작하지 않으면 주석 전체가 설명이고 역할은 이름에서 짐작한다.
 * shape는 첫 예시를 그릴 모양이고, picked는 주석에 직접 적혀 있던 모양이다(없으면 undefined. 그때 shape는 짐작한 것이다).
 * words는 첫 예시의 문구(없으면 ''), more는 둘째부터의 예시다.
 */
export function readNote(note: string | undefined, short: string): { use: RoleUse; text: string; shape: RoleShape; picked?: RoleShape; words: string; more: RoleExample[] } {
  const all = (note ?? '').trim()
  // "버튼"은 "채움"의 예전 이름이다. 예전에 적어 둔 주석도 그대로 읽는다(다음에 역할이나 설명을 고칠 때 채움으로 적힌다).
  const m = NOTE.exec(all)
  const found = m && ROLE_USES.find((u) => u.label === (m[1] === '버튼' ? '채움' : m[1]))
  const use = found ? found.id : (groupFromNote(all.replace(/^버튼(?=\s*[(:])/, '채움'), ROLE_USES, 'other') ?? guessUse(short))
  const picked = found && m![2] ? ROLE_SHAPES.find((u) => u.label === m![2])?.id : undefined
  const shape = picked ?? guessRoleShape(short, use)
  // 예시는 역할을 적은 주석에서만 읽는다.
  // 목록에 없는 역할의 주석(이름(모양): …)도 " | "로 나눠 읽는다. 통째로 설명으로 읽으면 다시 적을 때 문구의 구분이 사라진다.
  const parts = found ? (m![3] ?? '').split(MARK).map((p) => p.trim()) : headOf(all) !== null ? all.split(MARK).map((p) => p.trim()) : [all]
  const more = parts.slice(2).map((p): RoleExample => {
    const head = SHAPE_HEAD.exec(p)
    const own = head && ROLE_SHAPES.find((u) => u.label === head[1])
    return own ? { shape: own.id, words: head![2].trim() } : { shape, words: p }
  })
  return { use, text: parts[0], shape, ...(picked ? { picked } : {}), words: parts[1] ?? '', more }
}

/** 주석에 적을 글자. 첫 예시의 모양은 직접 고른 것만 적는다. 주석을 끝내는 기호와 줄바꿈은 파일을 깨뜨리므로 뺀다. */
export function writeNote(use: RoleUse, text: string, shape?: RoleShape, words = '', more: RoleExample[] = []) {
  // 설명과 문구 안의 " | "는 예시를 나누는 표시와 헷갈리므로 " / "로 바꿔 적는다.
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const clean = tidy(text)
  const head = shape ? `${labelOf(use)}(${ROLE_SHAPES.find((u) => u.id === shape)!.label})` : labelOf(use)
  const rest = more.map((e) => `${ROLE_SHAPES.find((u) => u.id === e.shape)!.label}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [clean, ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  return body ? `${head}: ${body}` : head
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
 * 의미 색을 역할별로 묶는다. 분류의 순서는 파일에서 그 역할이 처음 나오는 순서이고, 분류 안의 순서도 파일에 적힌 순서다.
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

/** 분류의 순서대로 의미 색을 다시 늘어놓아, 값 목록에서 의미 색이 있던 자리들에 차례로 넣는다. 다른 값의 자리는 그대로다. */
function place(tokens: Token[], groups: { items: Token[] }[]): Token[] {
  const sorted = groups.flatMap((g) => g.items)
  let k = 0
  return tokens.map((t) => (isRole(t) ? sorted[k++] : t))
}

/** 역할 분류를 통째로 옮긴다. before 분류의 앞에 놓고, null이면 맨 뒤에 놓는다. */
export function moveRoleGroup(tokens: Token[], use: RoleUse, before: RoleUse | null): Token[] {
  const groups = roleGroups(tokens)
  const moving = groups.find((g) => g.use === use)
  if (!moving || use === before) return tokens
  const rest = groups.filter((g) => g !== moving)
  const at = before === null ? rest.length : rest.findIndex((g) => g.use === before)
  rest.splice(at === -1 ? rest.length : at, 0, moving)
  return place(tokens, rest)
}

/** 의미 색 하나를 같은 분류 안에서 옮긴다. before 색의 앞에 놓고, null이면 분류의 맨 뒤에 놓는다. */
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

/** 고른 의미 색들을 같은 분류 안에서 한 칸 뒤(1)나 앞(-1)으로 옮긴다. 분류의 끝에 닿으면 그대로 둔다. */
export function shiftRoles(tokens: Token[], names: string[], dir: 1 | -1): Token[] {
  const groups = roleGroups(tokens)
  for (const g of groups) {
    const order = g.items.map((_, i) => i).filter((i) => names.includes(g.items[i].name))
    if (dir === 1) order.reverse()
    for (const i of order) {
      const j = i + dir
      if (j < 0 || j >= g.items.length || names.includes(g.items[j].name)) continue
      ;[g.items[i], g.items[j]] = [g.items[j], g.items[i]]
    }
  }
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
 * 분류는 글자, 바탕, 테두리, 채움, 상태, 차트 순서. 분류 안에서는 무채색(회색·검정·흰색)을 가리키는 색을 먼저, 색깔 있는 것을 뒤에 둔다.
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

/**
 * 의미 색 추가 창에서 역할을 따라 이름 칸에 채워지는 이름(DESIGN.md dialog-defaults). 의미 색은 예시를 고르지 않고 역할을 고르므로 역할마다 하나다.
 * 그 이름이 이미 있으면 창은 이름 칸을 비워 둔다. "그 밖"은 쓰임을 알 수 없어 이름이 없다.
 */
export const ROLE_NAMES: Record<RoleUse, string> = {
  text: 'text',
  surface: 'surface',
  border: 'border',
  fill: 'primary',
  status: 'danger',
  chart: 'chart',
  other: '',
}
