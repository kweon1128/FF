// 모서리와 의미 모서리.
// 모서리에도 간격·크기처럼 층이 둘이다. 토대(둥글기 그 자체: --corner-6: 6px)와 의미(쓰임 이름: --radius-control: var(--corner-6)).
// 토대의 이름은 px 숫자 그대로이고, 앞머리는 Tailwind가 모르는 --corner-다. 끝이 완전히 둥근 것은 --corner-9999다.
// 의미 모서리는 Tailwind가 아는 --radius-이름이라 rounded-이름 클래스가 저절로 생긴다(rounded-control, rounded-t-control).
// 이름은 단계(sm, md)가 아니라 쓰임(control, row, card, float)으로 짓는다. 같은 둥글기라도 쓰임이 다르면 이름을 나눈다. 나눠 두어야 카드만 8px로 올릴 수 있다.
// 분류와 설명, 예시는 값 뒤의 주석에 적는다(의미 간격, 의미 크기와 같은 방식).
//   --radius-control: var(--corner-6); /* 버튼(버튼): 버튼, 입력칸 | 취소, 추가 | 입력칸: 이름 */

import type { Token } from './api'
import { CORNER_REF, KINDS } from './catalog'

/** 의미 모서리의 분류. 무엇의 모서리인지다. 판은 이 차례로 묶어 보여 준다. */
import { groupFromNote, headOf } from './kindnote'
import { partGroups, type Part } from './parts'

/**
 * 분류는 컴포넌트별 목록이다(lib/parts.ts. 의미 간격, 의미 크기, 의미 테두리와 같다). 그 모서리가 어느 컴포넌트의 것인지로 나눈다.
 * 예전에는 컨트롤, 컨테이너, 표시 셋으로 나눴다. 판마다 목록이 달라서 "버튼의 모서리"를 "버튼의 간격"과 같은 이름에서 찾을 수 없었다.
 */
export type RadiusGroup = Part

export const RADIUS_GROUPS = partGroups({
  button: '버튼, 아이콘 버튼',
  input: '입력칸, 체크 상자, 칩',
  list: '메뉴와 목록의 줄',
  table: '표의 칸',
  card: '카드, 상자',
  board: '판의 이름표, 견본',
  panel: '패널의 상자',
  dialog: '창, 떠 있는 메뉴, 알림',
  page: '페이지의 구역',
  other: '목록에 없는 쓰임',
})
/** 예전 파일의 주석에 남아 있을 수 있는, 이제 없는 분류의 이름. 분류를 적지 않은 것으로 읽어 예시의 모양과 이름에서 짐작하고, 그 값을 고치면 지금의 분류로 다시 적힌다. */
const OLD_GROUP_LABELS = ['컨트롤', '컨테이너', '표시', '조작']

/** 의미 모서리가 가리키는 토대 모서리의 변수 이름. 가리키지 않으면 null. */
export const cornerRefOf = (value: string) => CORNER_REF.exec(value.trim())?.[1] ?? null

/** 길이 하나를 직접 적은 값인지(6px, 0.5rem, 50%). 다른 도구로 만든 파일이나 예전 파일의 --radius-md: 6px이 이런 꼴이다. */
export const isDirectRadius = (value: string) => /^\d*\.?\d+(px|rem|em|%)?$/.test(value.trim())

/**
 * 의미 모서리의 실제 둥글기. 가리키는 토대 모서리의 값이다. 가리키는 값이 없어졌으면 null.
 * 토대를 가리키지 않고 길이를 직접 적은 값은 그 길이를 그대로 돌려준다(판에 그려 보일 수는 있게. 패널에서 모서리 판의 값을 고르면 가리키는 값으로 바뀐다).
 */
export function resolveCorner(tokens: Token[], value: string): string | null {
  const ref = cornerRefOf(value)
  if (ref) return tokens.find((t) => t.name === ref && KINDS.corner.matches(t.name))?.value ?? null
  return isDirectRadius(value) ? value.trim() : null
}

/** 분류를 적지 않은 값(과 예전 분류 이름으로 적힌 값)의 분류. 예시의 모양이 적혀 있으면 그 모양이 드는 분류이고, 없으면 이름에서 짐작한다. 짐작할 수 없으면 그 밖이다. */
export function guessRadiusGroup(short: string, shape?: RadiusShape): RadiusGroup {
  if (shape) return SHAPE_GROUP[shape]
  const has = (...words: string[]) => short.split('-').some((p) => words.includes(p))
  if (has('button', 'btn')) return 'button'
  if (has('control', 'input', 'field', 'checkbox', 'check', 'chip', 'small')) return 'input'
  if (has('row', 'item', 'list')) return 'list'
  if (has('table', 'cell')) return 'table'
  if (has('card', 'box', 'surface')) return 'card'
  if (has('tag', 'label', 'swatch')) return 'board'
  if (has('panel', 'sidebar')) return 'panel'
  if (has('float', 'menu', 'dialog', 'modal', 'popover', 'sheet', 'toast')) return 'dialog'
  if (has('page', 'section')) return 'page'
  return 'other'
}

/**
 * 예시의 모양. 그 둥글기를 어떤 요소의 모서리로 보여 줄지다. 빈 상자가 아니라 화면에 실제로 놓이는 것들이다.
 * 모양을 적지 않은 값은 예시를 그리지 않는다(의미 간격, 의미 크기, 의미 테두리와 같은 규칙이다). 무엇의 모서리인지는 이름만으로 정할 수 없고, 짐작해 그리면 그 값이 실제로 쓰이지 않는 요소가 판에 그려진다.
 */
export type RadiusShape = 'tag' | 'seltag' | 'check' | 'smallbutton' | 'chip' | 'button' | 'input' | 'row' | 'card' | 'menu' | 'dialog' | 'slider' | 'badge' | 'knob'

export const RADIUS_SHAPES: { id: RadiusShape; label: string; hint: string }[] = [
  { id: 'tag', label: '이름표', hint: '치수선의 숫자 이름표' },
  { id: 'seltag', label: '선택 이름표', hint: '선택한 것 아래의 이름표' },
  { id: 'check', label: '체크박스', hint: '체크 상자' },
  { id: 'smallbutton', label: '작은 버튼', hint: '귀퉁이의 작은 아이콘 버튼' },
  { id: 'chip', label: '칩', hint: '코드나 키를 적은 칩' },
  { id: 'button', label: '버튼', hint: '나란한 버튼' },
  { id: 'input', label: '입력칸', hint: '글자를 적는 칸' },
  { id: 'row', label: '줄', hint: '마우스를 올린 목록 줄' },
  { id: 'card', label: '카드', hint: '테두리가 있는 면' },
  { id: 'menu', label: '메뉴', hint: '떠 있는 목록' },
  { id: 'dialog', label: '창', hint: '화면 위에 뜨는 창' },
  { id: 'slider', label: '슬라이더', hint: '끝이 둥근 긴 막대' },
  { id: 'badge', label: '뱃지', hint: '알약 모양의 뱃지' },
  { id: 'knob', label: '손잡이', hint: '둥근 손잡이, 점' },
]

/** 예시의 모양이 드는 분류. 분류를 적지 않은 값의 분류를 짐작할 때 쓴다(guessRadiusGroup). */
const SHAPE_GROUP: Record<RadiusShape, RadiusGroup> = {
  button: 'button', smallbutton: 'button',
  input: 'input', check: 'input', chip: 'input', slider: 'input',
  row: 'list',
  card: 'card',
  tag: 'board', seltag: 'board',
  menu: 'dialog', dialog: 'dialog',
  badge: 'other', knob: 'other',
}

/** 추가 창에서 분류마다 처음 골라 두는 예시의 모양. 그 분류에서 가장 흔한 쓰임이다. 직접 고르기 전까지만 분류를 따라 바뀐다. */
export const RADIUS_SHAPE_FOR: Record<RadiusGroup, RadiusShape> = { button: 'button', input: 'input', list: 'row', table: 'card', card: 'card', board: 'tag', panel: 'card', dialog: 'dialog', page: 'card', other: 'badge' }

/** 모양마다의 기본 예시 문구. 글자가 없는 모양(작은 버튼, 슬라이더, 손잡이)은 비어 있다. 여럿을 늘어놓는 모양은 ", "로 나눠 적는다. */
export const RADIUS_WORDS: Record<RadiusShape, string> = {
  tag: '24',
  seltag: 'primary · blue',
  check: '기억하기',
  smallbutton: '',
  chip: 'primary',
  button: '취소, 저장',
  input: '이름',
  row: '홈, 주문, 설정',
  card: '카드 제목',
  menu: '이름 바꾸기, 복제, 삭제',
  dialog: '삭제할까요?, 이름, 취소, 삭제',
  slider: '',
  badge: '새 글, 완료',
  knob: '',
}

/** 문구를 ", "로 나눠 여럿을 늘어놓는 모양. */
export const isRadiusListShape = (shape: RadiusShape) => ['button', 'row', 'menu', 'dialog', 'badge'].includes(shape)

/** 예시 하나. 어떤 요소로 그릴지(모양)와 그 안에 적을 말(문구. 비어 있으면 모양의 기본 문구). */
export type RadiusExample = { shape: RadiusShape; words: string }

const WORDS_MARK = ' | '
// 읽을 때는 세로줄 앞뒤의 빈칸 수를 따지지 않는다(다른 의미 판의 주석과 같다).
const MARK = /\s*\|\s*/
const MARK_ALL = /\s*\|\s*/g
const LABELS = RADIUS_SHAPES.map((s) => s.label)
  // 긴 이름을 먼저 견준다("작은 버튼"이 "버튼"으로 읽히지 않게).
  .sort((a, b) => b.length - a.length)
  .join('|')
const GROUP_LABELS = [...RADIUS_GROUPS.map((g) => g.label), ...OLD_GROUP_LABELS].join('|')
const own = (label: string) => RADIUS_SHAPES.find((s) => s.label === label)?.id

/**
 * 주석에서 분류와 설명과 예시들을 읽는다. "버튼(버튼): 버튼, 입력칸 | 취소, 추가 | 입력칸: 이름"처럼 분류 이름으로 시작하지 않으면 주석 전체가 설명이다.
 * group은 분류(적혀 있지 않으면 이름에서 짐작한 것). picked는 주석에 직접 적혀 있던 첫 예시의 모양이다.
 * examples는 판에 그릴 예시들이다. 모양을 적지 않은 값은 예시가 없다(의미 간격, 의미 크기와 같다).
 */
export function readRadiusNote(
  note: string | undefined,
  short: string,
): { group: RadiusGroup; text: string; picked?: RadiusShape; words: string; more: RadiusExample[]; examples: RadiusExample[] } {
  const all = (note ?? '').trim()
  const m = new RegExp(`^(${GROUP_LABELS})(?:\\(([^)|]*)\\))?\\s*:\\s*(.*)$`).exec(all)
  const picked = m?.[2] ? own(m[2]) : undefined
  // 예전 분류 이름(컨트롤, 컨테이너, 표시)으로 적힌 주석은 분류를 적지 않은 것으로 읽어 모양과 이름에서 짐작한다.
  const group = m ? (RADIUS_GROUPS.find((g) => g.label === m[1])?.id ?? guessRadiusGroup(short, picked)) : (groupFromNote(all, RADIUS_GROUPS, 'other') ?? guessRadiusGroup(short))
  // 목록에 없는 분류의 주석(이름(모양): …)도 " | "로 나눠 읽는다. 통째로 설명으로 읽으면 다시 적을 때 문구의 구분이 사라진다.
  const parts = m ? m[3].split(MARK).map((p) => p.trim()) : headOf(all) !== null ? all.split(MARK).map((p) => p.trim()) : [all]
  const words = parts[1] ?? ''
  const head = new RegExp(`^(${LABELS})\\s*:\\s*(.*)$`)
  const more = parts.slice(2).flatMap((p): RadiusExample[] => {
    const h = head.exec(p)
    const id = h && own(h[1])
    return id ? [{ shape: id, words: h![2].trim() }] : picked ? [{ shape: picked, words: p }] : []
  })
  const examples = picked ? [{ shape: picked, words }, ...more] : more
  return { group, text: parts[0], ...(picked ? { picked } : {}), words, more, examples }
}

/** 주석에 적을 글자. 분류는 언제나 적고, 첫 예시의 모양은 주석에 적혀 있던 것만 적는다. */
export function writeRadiusNote(group: RadiusGroup, text: string, shape?: RadiusShape, words = '', more: RadiusExample[] = []) {
  const tidy = (s: string) => s.replace(/\*\//g, '').replace(/\s+/g, ' ').trim().replace(MARK_ALL, ' / ')
  const label = (id: RadiusShape) => RADIUS_SHAPES.find((s) => s.id === id)!.label
  const groupLabel = RADIUS_GROUPS.find((g) => g.id === group)!.label
  const rest = more.map((e) => `${label(e.shape)}: ${tidy(e.words)}`.trim())
  // 첫 예시의 문구가 비어 있어도 뒤에 예시가 더 있으면 그 자리는 비운 채로 남긴다. 그래야 둘째 예시가 첫째로 읽히지 않는다.
  const body = [tidy(text), ...(tidy(words) || rest.length ? [tidy(words)] : []), ...rest].join(WORDS_MARK).trim()
  const head = shape ? `${groupLabel}(${label(shape)})` : groupLabel
  return body ? `${head}: ${body}` : `${head}:`
}

/**
 * 추가 창에서 예시를 고르면 이름 칸에 채워지는 이름(DESIGN.md dialog-defaults). 그 예시가 보여 주는 쓰임의 영문 이름이다.
 * ff-ds가 실제로 쓰는 이름을 따랐고(사이는 actions, 줄은 rows), 쓰는 이름이 없는 예시만 새로 지었다. 그 이름이 이미 있으면 창은 이름 칸을 비워 둔다.
 */
export const RADIUS_NAMES: Record<RadiusShape, string> = {
  tag: 'tag',
  seltag: 'label',
  check: 'checkbox',
  smallbutton: 'small',
  chip: 'chip',
  button: 'button',
  input: 'control',
  row: 'row',
  card: 'card',
  menu: 'float',
  dialog: 'dialog',
  slider: 'slider',
  badge: 'badge',
  knob: 'pill',
}
