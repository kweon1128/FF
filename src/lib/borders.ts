// 테두리와 의미 테두리.
// 선의 굵기에도 간격·크기·모서리처럼 층이 둘이다. 토대(굵기 그 자체: --thickness-1: 1px)와 의미(쓰임 이름: --border-width-edge: var(--thickness-1)).
// 토대의 이름은 px 숫자 그대로이고, 앞머리는 Tailwind가 모르는 --thickness-다.
// 의미 테두리는 두 종류다. 테두리 선(--border-width-이름 → border-이름, border-t-이름)과 외곽선(--outline-width-이름 → outline-이름).
// 테두리 선은 상자의 자리를 차지하는 선이고(입력칸의 테두리, 구역 사이의 구분선), 외곽선은 자리를 차지하지 않고 상자 밖에 두르는 선이다(초점 표시).
// 이름은 굵기(thin, thick)가 아니라 쓰임(edge, divider, focus)으로 짓는다. 같은 1px라도 쓰임이 다르면 이름을 나눈다.
// 색 이름과 겹치면 안 된다. border-이름과 outline-이름은 색도 읽기 때문에(border-hairline), --color-edge가 있으면 border-edge는 색이 된다.
// 분류와 설명, 예시는 값 뒤의 주석에 적는다(의미 간격, 의미 크기, 의미 모서리와 같은 방식).
//   --border-width-edge: var(--thickness-1); /* 입력칸(입력칸): 입력칸, 버튼, 목록 상자의 테두리 | 이름 | 버튼: 취소 */

import type { Token } from './api'
import { KINDS, THICKNESS_REF, type Kind } from './catalog'
import { groupFromNote, headOf } from './kindnote'
import { partGroups, type Part } from './parts'

export type BorderKind = 'border' | 'outline'

/**
 * 예전 주석의 맨 앞에 적던 종류의 이름("테두리(입력칸): …", "외곽선(초점): …"). 지금은 분류의 이름을 적는다.
 * 종류는 변수 이름의 앞머리에 이미 있어서 주석에 다시 적을 까닭이 없다. 예전 꼴의 주석은 분류를 적지 않은 것으로 읽어 모양과 이름에서 짐작한다.
 */
const OLD_HEADS = ['테두리', '외곽선']

/** 테두리 선이나 외곽선인지. 두 종류는 줄의 짜임과 패널, 추가 창을 함께 쓴다. */
export const isBorderKind = (kind: Kind) => kind.id === 'border' || kind.id === 'outline'

/**
 * 분류는 컴포넌트별 목록이다(lib/parts.ts. 의미 간격, 의미 크기, 의미 모서리와 같다). 그 선이 어느 컴포넌트의 것인지로 나눈다.
 * 판은 종류(테두리 선, 외곽선)로 먼저 나누고 그 안을 분류로 나눈다.
 */
export type BorderGroup = Part

export const BORDER_GROUPS = partGroups({
  button: '버튼의 테두리, 초점 표시',
  input: '입력칸의 테두리',
  list: '목록의 줄 사이, 탭 아래의 선',
  table: '표의 줄 사이',
  card: '카드와 상자의 테두리',
  board: '판의 상자, 가리키는 표시',
  panel: '패널의 구역 사이',
  dialog: '창과 떠 있는 것의 테두리',
  page: '화면의 영역 사이',
  other: '목록에 없는 쓰임',
})

/** 의미 테두리가 가리키는 토대 굵기의 변수 이름. 가리키지 않으면 null. */
export const thicknessRefOf = (value: string) => THICKNESS_REF.exec(value.trim())?.[1] ?? null

/** 길이 하나를 직접 적은 값인지(1px, 0.5px). 다른 도구로 만든 파일의 --border-width-thin: 1px이 이런 꼴이다. */
export const isDirectThickness = (value: string) => /^\d*\.?\d+(px|rem|em)?$/.test(value.trim())

/**
 * 의미 테두리의 실제 굵기. 가리키는 토대의 값이다. 가리키는 값이 없어졌으면 null.
 * 토대를 가리키지 않고 길이를 직접 적은 값은 그 길이를 그대로 돌려준다(판에 그려 보일 수는 있게. 패널에서 테두리 판의 값을 고르면 가리키는 값으로 바뀐다).
 */
export function resolveThickness(tokens: Token[], value: string): string | null {
  const ref = thicknessRefOf(value)
  if (ref) return tokens.find((t) => t.name === ref && KINDS.thickness.matches(t.name))?.value ?? null
  return isDirectThickness(value) ? value.trim() : null
}

/**
 * 예시의 모양. 그 선이 어떤 요소의 어느 자리에 그어지는지다. 종류마다 고를 수 있는 모양이 다르다.
 * 모양을 적지 않은 값은 예시를 그리지 않는다(의미 간격, 의미 크기, 의미 모서리와 같은 규칙이다).
 */
export type BorderShape = 'input' | 'button' | 'box' | 'divider' | 'side' | 'table' | 'tab' | 'focus' | 'mark'

export const BORDER_SHAPES: { id: BorderShape; kind: BorderKind; label: string; hint: string }[] = [
  { id: 'input', kind: 'border', label: '입력칸', hint: '입력칸의 테두리' },
  { id: 'button', kind: 'border', label: '버튼', hint: '테두리가 있는 버튼' },
  { id: 'box', kind: 'border', label: '상자', hint: '목록 상자, 카드, 창의 테두리' },
  { id: 'divider', kind: 'border', label: '구분선', hint: '위아래 구역 사이의 선' },
  { id: 'side', kind: 'border', label: '세로 구분선', hint: '좌우 영역 사이의 선' },
  { id: 'table', kind: 'border', label: '표', hint: '표의 줄과 줄 사이의 선' },
  { id: 'tab', kind: 'border', label: '탭', hint: '고른 탭 아래의 선' },
  { id: 'focus', kind: 'outline', label: '초점', hint: '자판으로 옮겨 간 버튼의 표시' },
  { id: 'mark', kind: 'outline', label: '표시', hint: '가리키는 글자에 두르는 선' },
]

/** 예시의 모양이 드는 분류. 분류를 적지 않은 값의 분류를 짐작할 때 쓴다(guessBorderGroup). */
const SHAPE_GROUP: Record<BorderShape, BorderGroup> = {
  input: 'input',
  button: 'button',
  box: 'card',
  divider: 'panel',
  side: 'page',
  table: 'table',
  tab: 'list',
  focus: 'button',
  mark: 'board',
}

/** 분류를 적지 않은 값(과 예전 꼴의 주석)의 분류. 예시의 모양이 적혀 있으면 그 모양이 드는 분류이고, 없으면 이름에서 짐작한다. 짐작할 수 없으면 그 밖이다. */
export function guessBorderGroup(short = '', shape?: BorderShape): BorderGroup {
  if (shape) return SHAPE_GROUP[shape]
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  if (has('button', 'btn', 'focus', 'ring')) return 'button'
  if (has('input', 'control', 'field', 'edge')) return 'input'
  if (has('row', 'list', 'tab', 'item')) return 'list'
  if (has('table', 'cell')) return 'table'
  if (has('card', 'box')) return 'card'
  if (has('panel', 'divider', 'section')) return 'panel'
  if (has('dialog', 'modal', 'popover', 'menu')) return 'dialog'
  if (has('page', 'side', 'layout')) return 'page'
  return 'other'
}

/**
 * 추가 창에서 종류와 분류마다 처음 골라 두는 예시의 모양. 그 자리에서 가장 흔한 쓰임이다. 직접 고르기 전까지만 분류를 따라 바뀐다.
 * 외곽선은 모양이 둘뿐이라 어느 분류에서나 초점이다.
 */
export const BORDER_SHAPE_FOR: Record<BorderKind, Record<BorderGroup, BorderShape>> = {
  border: { button: 'button', input: 'input', list: 'tab', table: 'table', card: 'box', board: 'box', panel: 'divider', dialog: 'box', page: 'side', other: 'input' },
  outline: { button: 'focus', input: 'focus', list: 'focus', table: 'focus', card: 'focus', board: 'mark', panel: 'focus', dialog: 'focus', page: 'focus', other: 'focus' },
}

/** 모양마다의 기본 예시 문구. 여럿을 늘어놓는 모양(상자, 구분선, 세로 구분선)은 ", "로 나눠 적는다. */
export const BORDER_WORDS: Record<BorderShape, string> = {
  input: '이름',
  button: '취소',
  box: '첫째, 둘째',
  divider: '이름=primary, 설명=주요 버튼',
  side: '홈, 주문, 이름=primary',
  table: '이름, 첫째, 둘째',
  tab: '색상, 글꼴, 간격',
  focus: '저장',
  mark: '제목',
}

/** 문구를 ", "로 나눠 여럿을 늘어놓는 모양. */
export const isBorderListShape = (shape: BorderShape) => ['box', 'divider', 'side', 'table', 'tab'].includes(shape)

/** 예시 하나. 어떤 요소로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type BorderExample = { shape: BorderShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const labelsOf = (kind: BorderKind) => BORDER_SHAPES.filter((s) => s.kind === kind).map((s) => s.label).join('|')
const HEADS = [...BORDER_GROUPS.map((g) => g.label), ...OLD_HEADS].join('|')
const HEAD = new RegExp('^(' + HEADS + ')(?:\\(([^)|]*)\\))?\\s*:\\s*(.*)$')

/**
 * 주석에서 분류와 설명과 예시들을 읽는다. "입력칸(입력칸): 입력칸, 버튼의 테두리 | 이름 | 버튼: 취소"처럼 분류 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * group은 분류(적혀 있지 않거나 예전 꼴이면 모양과 이름에서 짐작한 것). picked는 주석에 직접 적혀 있던 첫 예시의 모양이다.
 * examples는 판에 그릴 예시들이다. 모양을 적지 않은 값은 예시가 없다.
 */
export function readBorderNote(
  kind: BorderKind,
  note: string | undefined,
  short = '',
): { group: BorderGroup; text: string; picked?: BorderShape; words: string; more: BorderExample[]; examples: BorderExample[] } {
  const all = (note ?? '').trim()
  const own = (label: string) => BORDER_SHAPES.find((s) => s.kind === kind && s.label === label)?.id
  const m = HEAD.exec(all)
  const picked = m?.[2] ? own(m[2]) : undefined
  const group = m ? (BORDER_GROUPS.find((g) => g.label === m[1])?.id ?? guessBorderGroup(short, picked)) : (groupFromNote(all, BORDER_GROUPS, 'other') ?? guessBorderGroup(short))
  // 목록에 없는 분류의 주석(이름(모양): …)도 " | "로 나눠 읽는다. 통째로 설명으로 읽으면 다시 적을 때 문구의 구분이 사라진다.
  const parts = m ? m[3].split(MARK).map((p) => p.trim()) : headOf(all) !== null ? all.split(MARK).map((p) => p.trim()) : [all]
  const head = new RegExp('^(' + labelsOf(kind) + ')\\s*:\\s*(.*)$')
  const words = parts[1] ?? ''
  const more = parts.slice(2).flatMap((p): BorderExample[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { group, text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 분류는 언제나 적고, 첫 예시의 모양은 직접 고른 것만 적는다. */
export function writeBorderNote(group: BorderGroup, text: string, shape?: BorderShape, words = '', more: BorderExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: BorderShape) => BORDER_SHAPES.find((s) => s.id === id)!.label
  const groupLabel = BORDER_GROUPS.find((g) => g.id === group)?.label ?? BORDER_GROUPS[BORDER_GROUPS.length - 1].label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  const head = shape ? `${groupLabel}(${label(shape)})` : groupLabel
  return body ? `${head}: ${body}` : `${head}:`
}

/** 그 값이 그 종류(테두리 선이나 외곽선)의 의미 테두리면 그 분류, 아니면 null. */
export function borderGroupOf(kind: Kind, t: Token): BorderGroup | null {
  return kind.matches(t.name) ? readBorderNote(kind.id as BorderKind, t.note, t.name.slice(kind.prefix.length)).group : null
}

/**
 * 추가 창에서 예시를 고르면 이름 칸에 채워지는 이름(DESIGN.md dialog-defaults). 그 예시가 보여 주는 쓰임의 영문 이름이다.
 * ff-ds가 실제로 쓰는 이름을 따랐고(사이는 actions, 줄은 rows), 쓰는 이름이 없는 예시만 새로 지었다. 그 이름이 이미 있으면 창은 이름 칸을 비워 둔다.
 */
export const BORDER_NAMES: Record<BorderShape, string> = {
  input: 'edge',
  button: 'button',
  box: 'box',
  divider: 'divider',
  side: 'side',
  table: 'row-line',
  tab: 'tab',
  focus: 'focus',
  mark: 'mark',
}
